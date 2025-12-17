import { extractTenantFromHostname } from "@/lib/tenant-utils";

// Enhanced user interface with all available data
export interface AuthUser {
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

// Contact information interface
export interface ContactInfo {
  email: string | null;
  phone: string | null;
  countryCode: string | null;
}

// User profile interface for database operations
export interface UserProfile {
  id: string;
  name?: string | null;
  company?: string | null;
  industry?: string | null;
  team_size?: string | null;
  role?: string | null;
  use_case?: string | null;
  theme?: string | null;
  notifications?: boolean | null;
  goals?: any | null;
  onboarding_completed?: boolean | null;
  plan?: string | null;
  trial_ends_at?: string | null;
  contact?: ContactInfo | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Auth state interface
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Sign up metadata interface
export interface SignUpMetadata {
  phone?: string;
  countryCode?: string;
}

// Backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Auth utility class
export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };
  private listeners: Set<(state: AuthState) => void> = new Set();
  private TOKEN_KEY = 'auth_token';

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize auth state
  private async initializeAuth() {
    this.updateAuthState({ isLoading: true });

    try {
      const token = localStorage.getItem(this.TOKEN_KEY);

      if (!token) {
        this.updateAuthState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Validate token and get user profile
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Since /me returns the user object from DB (which is UserProfile structure roughly)
        // We need to map it to AuthUser
        // The endpoint returns { success: true, user: { ... } }
        if (data.user) {
          const authUser = this.mapBackendUserToAuthUser(data.user);
          this.updateAuthState({
            user: authUser,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          // Token might be valid but no user? weird.
          this.handleLogout();
        }
      } else {
        // Token invalid or expired
        this.handleLogout();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.handleLogout();
    }
  }

  private handleLogout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }

  // Map backend user object to AuthUser interface
  private mapBackendUserToAuthUser(backendUser: any): AuthUser {
    // backendUser structure from Mongoose:
    // id, name, email, role, is_active, tenant, slug_name, contact: { phone, ... }, etc.
    return {
      id: backendUser.id,
      email: backendUser.email,
      fullName: backendUser.name,
      phone: backendUser.contact?.phone || backendUser.live_demo_phone_number || null,
      countryCode: backendUser.contact?.countryCode || null,
      company: backendUser.company,
      industry: backendUser.industry,
      teamSize: backendUser.team_size,
      role: backendUser.role,
      useCase: backendUser.use_case,
      theme: backendUser.theme,
      notifications: backendUser.notifications,
      goals: backendUser.goals,
      onboardingCompleted: backendUser.onboarding_completed,
      plan: backendUser.plan,
      trialEndsAt: backendUser.trial_ends_at,
      isActive: backendUser.is_active,
      createdAt: backendUser.created_at,
      updatedAt: backendUser.updated_at
    };
  }

  // Update auth state and notify listeners
  private updateAuthState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Subscribe to auth state changes
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current auth state
  public getAuthState(): AuthState {
    return this.authState;
  }

  // Get current user
  public getCurrentUser(): AuthUser | null {
    return this.authState.user;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Check if auth is loading
  public isLoading(): boolean {
    return this.authState.isLoading;
  }

  // Get auth error
  public getError(): string | null {
    return this.authState.error;
  }

  // Sign in with email and password
  public async signIn(email: string, password: string) {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token
      localStorage.setItem(this.TOKEN_KEY, data.token);

      // We need the full profile which standard login might not return fully?
      // Check auth.js: login returns { success, token, user: { id, email, role, tenant } }
      // This is partial. We should fetch full profile or update login to return it.
      // For now, let's fetch profile immediately after login to be safe and consistent.

      await this.initializeAuth(); // Use the existing fetch logic

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Sign up
  public async signUp(
    name: string,
    email: string,
    password: string,
    metadata?: SignUpMetadata
  ) {
    try {
      this.updateAuthState({ isLoading: true, error: null });

      const tenant = extractTenantFromHostname();

      // Note: The backend /api/auth/signup doesn't fully support all metadata fields yet in body directly
      // except 'name'.
      // But we can update profile after or update backend route.
      // Current api/auth/signup takes: email, password, name
      // It creates user.

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name
          // TODO: pass metadata if backend supports it. Currently it does not.
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      // Auto login if token returned
      if (data.token) {
        localStorage.setItem(this.TOKEN_KEY, data.token);

        // If we have extra metadata, we might want to update profile now?
        // Or wait for onboarding.

        await this.initializeAuth();
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Sign out
  public async signOut() {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      // Call backend logout if stateful? JWT is stateless usually.
      // Just clear local.
      localStorage.removeItem(this.TOKEN_KEY);
      this.updateAuthState({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Update user profile
  public async updateProfile(updates: Partial<UserProfile>) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    try {
      this.updateAuthState({ isLoading: true, error: null });

      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) throw new Error('No auth token');

      // We have route PUT /api/v1/user/profile (in user.js)
      const response = await fetch(`${BACKEND_URL}/api/v1/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Profile update failed');

      // Refresh local state
      await this.initializeAuth();

      return data.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      this.updateAuthState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }

  // Refresh user profile
  public async refreshProfile() {
    await this.initializeAuth();
  }

  // Utility methods
  public getUserDisplayName(): string {
    const user = this.getCurrentUser();
    return user?.fullName || user?.email || 'User';
  }

  public getUserInitials(): string {
    const user = this.getCurrentUser();
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  public hasCompletedOnboarding(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user?.onboardingCompleted);
  }

  public isTrialActive(): boolean {
    const user = this.getCurrentUser();
    if (!user?.trialEndsAt) return false;
    return new Date(user.trialEndsAt) > new Date();
  }

  public getDaysUntilTrialEnds(): number {
    const user = this.getCurrentUser();
    if (!user?.trialEndsAt) return 0;
    const trialEnd = new Date(user.trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export convenience functions
export const getCurrentUser = () => authService.getCurrentUser();
export const isAuthenticated = () => authService.isAuthenticated();
export const isLoading = () => authService.isLoading();
export const getAuthError = () => authService.getError();
export const signIn = (email: string, password: string) => authService.signIn(email, password);
export const signUp = (name: string, email: string, password: string, metadata?: SignUpMetadata) =>
  authService.signUp(name, email, password, metadata);
export const signOut = () => authService.signOut();
export const updateProfile = (updates: Partial<UserProfile>) => authService.updateProfile(updates);
export const refreshProfile = () => authService.refreshProfile();
export const getUserDisplayName = () => authService.getUserDisplayName();
export const getUserInitials = () => authService.getUserInitials();
export const hasCompletedOnboarding = () => authService.hasCompletedOnboarding();
export const isTrialActive = () => authService.isTrialActive();
export const getDaysUntilTrialEnds = () => authService.getDaysUntilTrialEnds();
export const getAccessToken = () => localStorage.getItem('auth_token');
