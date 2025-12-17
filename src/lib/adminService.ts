import { getAccessToken } from '@/lib/auth';

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
  created_on: string | null;
  company: string | null;
  industry: string | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export class AdminService {
  /**
   * Check if current user is admin
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const token = await getAccessToken();
      if (!token) return false;

      // We can check against /api/auth/me but that returns user object.
      // Or we can rely on the fact that admin routes will properly fail 
      // if not admin.
      // For UI conditional rendering, we usually check the user object 
      // in the AuthContext. 
      // But if we need an explicit check:
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return false;
      const data = await response.json();
      return data.user?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No auth token');

      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users?perPage=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, updates: Partial<AdminUser>) {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No auth token');

      // Admin route for updating ANY user?
      // server/routes/admin.js usually needs an update endpoint.
      // Checking admin.js... it DOES NOT have an update endpoint for valid users, only get/delete/create-customer.
      // It has DELETE /users/:userId, GET /users/:userId.
      // But NO PUT /users/:userId.
      // server/routes/user.js might have profile update but that is usually for "me".

      // TODO: We might need to add PUT /api/v1/admin/users/:userId to server/routes/admin.js
      // For now, I will leave this method throwing or stubbed if the endpoint is missing, 
      // but strictly we should add it.

      // Assuming we will add it or it exists in a way I missed?
      // Admin.js had: GET users/emails, GET users, GET users/:id, DELETE users/:id, POST customers, POST customers/:id/minutes

      // I should probably add the endpoint to admin.js in the next step.

      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update user');

    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId: string) {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No auth token');

      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete user');

    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  static async searchUsers(query: string): Promise<AdminUser[]> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No auth token');

      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users?search=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to search users');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}
