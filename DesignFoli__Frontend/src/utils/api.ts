import { useAuth } from '@/contexts/AuthContext';

// API client for making authenticated requests
export class ApiClient {
  private baseURL: string;
  private getToken: () => string | null;

  constructor(getToken: () => string | null, baseURL: string = '') {
    this.baseURL = baseURL;
    this.getToken = getToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Hook for using the API client in components
export const useApiClient = () => {
  const { state } = useAuth();
  
  const getToken = () => state.token;

  // Use the Next.js API proxy to avoid CORS issues
  return new ApiClient(getToken, '/api/proxy');
};

// Profile data interface
interface ProfileData {
  name: string;
  profilePicture?: string | null;
}

// API response interfaces
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profilePicture: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Example API service
export const userService = {
  getProfile: (apiClient: ApiClient) => 
    apiClient.get<ApiResponse<UserProfile>>('/users/profile'),

  updateProfile: (apiClient: ApiClient, profileData: ProfileData) =>
    apiClient.put<ApiResponse<UserProfile>>('/users/profile', profileData),
};
