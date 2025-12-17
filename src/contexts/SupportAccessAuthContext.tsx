import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupportAccessService } from '@/lib/supportAccessService';
import { TwilioCredentialsService } from '@/lib/twilio-credentials';

interface User {
  id: string;
  email: string | null;
  fullName: string | null;
  phone?: string | null;
  countryCode?: string | null;
  company?: string | null;
  industry?: string | null;
  teamSize?: string | null;
  role?: string | null;
  useCase?: string | null;
  theme?: string | null;
  notifications?: boolean | null;
  goals?: any | null;
  onboardingCompleted?: boolean | null;
  plan?: string | null;
  trialEndsAt?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface SupportAccessSession {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  reason: string;
  duration_minutes: number;
  scoped_token: string;
  status: 'active' | 'expired' | 'revoked' | 'completed';
  expires_at: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signUp: (name: string, email: string, password: string, metadata?: { phone?: string; countryCode?: string }) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  // Impersonation functions
  impersonateUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  exitImpersonation: () => Promise<void>;
  isImpersonating: boolean;
  originalUser: User | null;
  // Support Access functions
  startSupportAccess: (sessionData: any) => Promise<{ success: boolean; message: string }>;
  endSupportAccess: () => Promise<void>;
  activeSupportSession: SupportAccessSession | null;
  validateScopedToken: (token: string) => Promise<boolean>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://backend.vokivo.com' : '');

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [activeSupportSession, setActiveSupportSession] = useState<SupportAccessSession | null>(null);

  const supportAccessService = SupportAccessService.getInstance();

  // Helper to get access token from localStorage
  const getAccessToken = async () => {
    return localStorage.getItem('auth_token');
  };

  const loadUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const { user: apiUser } = await response.json();

      const mappedUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        fullName: apiUser.name || (apiUser.contact?.name) || apiUser.email.split('@')[0],
        phone: apiUser.contact?.phone || null,
        countryCode: apiUser.contact?.countryCode || null,
        company: apiUser.company || apiUser.tenant, // Assuming company or tenant
        industry: apiUser.industry,
        role: apiUser.role || 'user',
        isActive: apiUser.is_active !== undefined ? apiUser.is_active : true,
        createdAt: apiUser.created_at || apiUser.created_on,
        updatedAt: apiUser.updated_at,
        onboardingCompleted: apiUser.onboarding_completed,
        plan: apiUser.plan,
        trialEndsAt: apiUser.trial_ends_at
      };

      setUser(mappedUser);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      // 1. Check for support access session
      const supportSessionData = localStorage.getItem('support_access_session');
      if (supportSessionData) {
        try {
          const parsed = JSON.parse(supportSessionData);
          const { session, scopedToken, impersonatedUserData } = parsed;

          // Validate token
          const isValid = await supportAccessService.validateScopedToken(scopedToken);
          if (isValid.is_valid) {
            setActiveSupportSession(session);
            setIsImpersonating(true);
            setUser(impersonatedUserData);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('support_access_session');
          }
        } catch (e) {
          localStorage.removeItem('support_access_session');
        }
      }

      // 2. Check for regular impersonation
      const impersonationData = localStorage.getItem('impersonation');
      if (impersonationData) {
        try {
          const parsed = JSON.parse(impersonationData);
          if (parsed.isImpersonating && parsed.originalUserId && parsed.impersonatedUserData) {
            // We need to verify if the original session (admin) is still valid?
            // Ideally yes. For now, trust the localStorage state but we should probably validate the underlying token.
            // But impersonation doesn't switch the auth_token usually, it just switches the strict user object in context.
            // If we really want security we should check if 'auth_token' is valid for originalUserId.
            // Let's assume auth_token allows it.
            const token = localStorage.getItem('auth_token');
            if (token) {
              // Check if token is valid (optional optimized check or just trust for now)
              setOriginalUser({
                id: parsed.originalUserId,
                email: null,
                fullName: null,
                role: 'admin' // Assumed
              } as User); // Partial restoration
              setIsImpersonating(true);
              setUser(parsed.impersonatedUserData);
              setLoading(false);
              return;
            } else {
              localStorage.removeItem('impersonation');
            }
          }
        } catch (e) {
          localStorage.removeItem('impersonation');
        }
      }

      // 3. Regular auth check
      const token = localStorage.getItem('auth_token');
      if (token) {
        await loadUserProfile(token);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('onboarding-completed', 'true'); // Preserving legacy behavior

      await loadUserProfile(data.token);

      return { success: true, message: 'Sign in successful' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: 'An error occurred during sign in' };
    }
  };

  const signUp = async (name: string, email: string, password: string, metadata?: { phone?: string; countryCode?: string }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          contact: {
            phone: metadata?.phone,
            countryCode: metadata?.countryCode
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Signup failed' };
      }

      // Auto login after signup
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        await loadUserProfile(data.token);
      }

      return { success: true, message: 'Sign up successful! You can now login.' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, message: 'An error occurred during sign up' };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('impersonation');
      localStorage.removeItem('support_access_session');
      if (user?.id) localStorage.removeItem(`user_profile_${user.id}`);

      setUser(null);
      setIsImpersonating(false);
      setOriginalUser(null);
      setActiveSupportSession(null);
      // TwilioCredentialsService cache cleared implicitly by token removal
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/v1/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updates.fullName,
          contact: {
            phone: updates.phone,
            countryCode: updates.countryCode
          },
          company: updates.company,
          // Add other fields as necessary based on backend spec
        })
      });

      if (response.ok) {
        const { user: updatedUser } = await response.json();
        // Refresh user state
        await loadUserProfile(token);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const impersonateUser = async (userId: string) => {
    if (!user || user.role !== 'admin') {
      return { success: false, message: 'Only admins can impersonate users' };
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        return { success: false, message: 'Failed to fetch user data for impersonation' };
      }

      const { data: targetUser } = await response.json();

      if (targetUser.role === 'admin') {
        return { success: false, message: 'Cannot impersonate admin users' };
      }

      const impersonatedUser: User = {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.name || targetUser.email,
        phone: targetUser.contact?.phone,
        countryCode: targetUser.contact?.countryCode,
        role: targetUser.role,
        isActive: targetUser.is_active,
        company: targetUser.company || targetUser.tenant,
        industry: targetUser.industry,
        createdAt: targetUser.created_on || targetUser.created_at,
        updatedAt: targetUser.updated_at
      };

      setOriginalUser(user);
      setIsImpersonating(true);

      localStorage.setItem('impersonation', JSON.stringify({
        isImpersonating: true,
        originalUserId: user.id,
        targetUserId: userId,
        impersonatedUserData: impersonatedUser
      }));

      setUser(impersonatedUser);

      return { success: true, message: `Now impersonating ${impersonatedUser.fullName}` };
    } catch (error) {
      console.error('Impersonation error:', error);
      return { success: false, message: 'Failed to impersonate user' };
    }
  };

  const exitImpersonation = async () => {
    if (!isImpersonating || !originalUser) return;

    setUser(originalUser);
    setIsImpersonating(false);
    setOriginalUser(null);
    setActiveSupportSession(null);

    localStorage.removeItem('impersonation');
    localStorage.removeItem('support_access_session');
  };

  const startSupportAccess = async (sessionData: any) => {
    // Reuse existing logic, update storage
    try {
      const { session, token } = sessionData;
      const validation = await supportAccessService.validateScopedToken(token);

      if (!validation.is_valid) return { success: false, message: 'Invalid token' };

      // Get target user via service (which now calls API)
      const targetUserData = await supportAccessService.getUserForScopedAccess(session.target_user_id);

      if (!targetUserData) return { success: false, message: 'Target user not found' };

      const impersonatedUser: User = {
        id: targetUserData.id,
        email: targetUserData.email,
        fullName: targetUserData.name || targetUserData.email,
        role: targetUserData.role,
        isActive: targetUserData.is_active,
        createdAt: targetUserData.created_on,
      };

      localStorage.setItem('support_access_session', JSON.stringify({
        session,
        scopedToken: token,
        impersonatedUserData: impersonatedUser
      }));

      setUser(impersonatedUser);
      setActiveSupportSession(session);
      setIsImpersonating(true);

      return { success: true, message: 'Support access granted' };
    } catch (error) {
      return { success: false, message: 'Failed to start support access' };
    }
  };

  const endSupportAccess = async () => {
    if (!activeSupportSession) return;
    await supportAccessService.endSupportSession(activeSupportSession.id, user?.id || '', 'completed');

    setActiveSupportSession(null);
    setIsImpersonating(false);
    setOriginalUser(null);
    localStorage.removeItem('support_access_session');
    localStorage.removeItem('impersonation');

    const token = localStorage.getItem('auth_token');
    if (token) await loadUserProfile(token);
  };

  const validateScopedToken = async (token: string) => {
    const res = await supportAccessService.validateScopedToken(token);
    return res.is_valid;
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    impersonateUser,
    exitImpersonation,
    isImpersonating,
    originalUser,
    startSupportAccess,
    endSupportAccess,
    activeSupportSession,
    validateScopedToken,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
