/**
 * API client for communicating with the FastAPI backend.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  is_admin?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Colleague {
  id: number;
  name: string;
  email: string;
  department?: string;
  position?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ColleagueCreate {
  name: string;
  email: string;
  department?: string;
  position?: string;
  bio?: string;
  avatar_url?: string;
}

export interface ColleagueUpdate {
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  bio?: string;
  avatar_url?: string;
}

export interface Badge {
  id: number;
  colleague_id: number;
  badge_type: string;
  title: string;
  description?: string;
  icon?: string;
  awarded_by: number;
  awarded_at: string;
  month: number;
  year: number;
  upvotes?: number;
  downvotes?: number;
  user_vote?: string;
}

export interface BadgeCreate {
  colleague_id: number;
  badge_type: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface Vote {
  id: number;
  user_id: number;
  badge_id: number;
  vote_type: string;
  created_at: string;
}

export interface VoteCreate {
  badge_id: number;
  vote_type: 'up' | 'down';
}

export interface Quota {
  id: number;
  user_id: number;
  month: number;
  year: number;
  badges_given: number;
  max_badges: number;
}

export interface DashboardStats {
  total_colleagues: number;
  total_badges: number;
  badges_this_month: number;
  remaining_quota: number;
}

export interface ColleagueWithBadges extends Colleague {
  badges: Badge[];
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  getToken(): string | null {
    return this.token;
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>('/auth/register', data);
    return response.data;
  }

  async login(username: string, password: string): Promise<TokenResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.client.post<TokenResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    this.setToken(response.data.access_token);
    return response.data;
  }

  async logout() {
    this.clearToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // ============================================================================
  // Colleagues
  // ============================================================================

  async getColleagues(skip: number = 0, limit: number = 100): Promise<Colleague[]> {
    const response = await this.client.get<Colleague[]>('/colleagues', {
      params: { skip, limit },
    });
    return response.data;
  }

  async getColleague(id: number): Promise<ColleagueWithBadges> {
    const response = await this.client.get<ColleagueWithBadges>(`/colleagues/${id}`);
    return response.data;
  }

  async createColleague(data: ColleagueCreate): Promise<Colleague> {
    const response = await this.client.post<Colleague>('/colleagues', data);
    return response.data;
  }

  async updateColleague(id: number, data: ColleagueUpdate): Promise<Colleague> {
    const response = await this.client.put<Colleague>(`/colleagues/${id}`, data);
    return response.data;
  }

  async deleteColleague(id: number): Promise<void> {
    await this.client.delete(`/colleagues/${id}`);
  }

  // ============================================================================
  // Badges
  // ============================================================================

  async getBadges(
    skip: number = 0,
    limit: number = 100,
    colleagueId?: number,
    month?: number,
    year?: number
  ): Promise<Badge[]> {
    const response = await this.client.get<Badge[]>('/badges', {
      params: { skip, limit, colleague_id: colleagueId, month, year },
    });
    return response.data;
  }

  async createBadge(data: BadgeCreate): Promise<Badge> {
    const response = await this.client.post<Badge>('/badges', data);
    return response.data;
  }

  // ============================================================================
  // Votes
  // ============================================================================

  async createVote(data: VoteCreate): Promise<Vote> {
    const response = await this.client.post<Vote>('/votes', data);
    return response.data;
  }

  async deleteVote(badgeId: number): Promise<void> {
    await this.client.delete(`/votes/${badgeId}`);
  }

  // ============================================================================
  // Quota
  // ============================================================================

  async getCurrentQuota(): Promise<Quota> {
    const response = await this.client.get<Quota>('/quota/current');
    return response.data;
  }

  // ============================================================================
  // Dashboard
  // ============================================================================

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
