/**
 * Central API configuration for the application
 */

// Production backend URL fallback if VITE_BACKEND_URL is not set
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://backend.vokivo.com' : 'http://localhost:4000');

/**
 * Utility to construct API URLs
 */
export const getApiUrl = (path: string): string => {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BACKEND_URL}${cleanPath}`;
};

/**
 * Common headers for API requests
 */
export const getAuthHeaders = async (token?: string): Promise<HeadersInit> => {
    const authToken = token || localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    };
};
