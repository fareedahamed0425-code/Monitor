import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = (async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        return accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const response = await this.client.post('/auth/login', { username, password });
    return response.data;
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.client.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  // Workstation endpoints
  async getWorkstations(params?: { status?: string; lab?: string; search?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/workstations', { params });
    return response.data;
  }

  async getWorkstation(id: string) {
    const response = await this.client.get(`/workstations/${id}`);
    return response.data;
  }

  async getWorkstationStats(id: string, params?: { hours?: number }) {
    const response = await this.client.get(`/workstations/${id}/stats`, { params });
    return response.data;
  }

  async sendCommand(workstationId: string, command: string, params?: Record<string, unknown>) {
    const response = await this.client.post(`/workstations/${workstationId}/command`, { command, params });
    return response.data;
  }

  async requestScreenshot(workstationId: string) {
    return this.sendCommand(workstationId, 'request_screenshot');
  }

  async lockWorkstation(workstationId: string) {
    return this.sendCommand(workstationId, 'lock_workstation');
  }

  async logoffUser(workstationId: string) {
    return this.sendCommand(workstationId, 'logoff_user');
  }

  async updatePolicy(workstationId: string, policy: Record<string, unknown>) {
    return this.sendCommand(workstationId, 'update_policy', policy);
  }

  // User endpoints
  async getUsers(params?: { search?: string; department?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async getUser(id: string) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async getUserSessions(userId: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const response = await this.client.get(`/users/${userId}/sessions`, { params });
    return response.data;
  }

  async getUserActivities(userId: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const response = await this.client.get(`/users/${userId}/activities`, { params });
    return response.data;
  }

  async getUserRiskScore(userId: string) {
    const response = await this.client.get(`/users/${userId}/risk-score`);
    return response.data;
  }

  // Session endpoints
  async getSessions(params?: { workstationId?: string; userId?: string; status?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/sessions', { params });
    return response.data;
  }

  async getSession(id: string) {
    const response = await this.client.get(`/sessions/${id}`);
    return response.data;
  }

  async getSessionActivities(sessionId: string, params?: { page?: number; limit?: number }) {
    const response = await this.client.get(`/sessions/${sessionId}/activities`, { params });
    return response.data;
  }

  async getSessionScreenshots(sessionId: string, params?: { page?: number; limit?: number }) {
    const response = await this.client.get(`/sessions/${sessionId}/screenshots`, { params });
    return response.data;
  }

  // Activity endpoints
  async getActivities(params?: { workstationId?: string; userId?: string; sessionId?: string; type?: string; riskLevel?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/activities', { params });
    return response.data;
  }

  async getActivity(id: string) {
    const response = await this.client.get(`/activities/${id}`);
    return response.data;
  }

  // Screenshot endpoints
  async getScreenshots(params?: { workstationId?: string; userId?: string; sessionId?: string; triggerReason?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/screenshots', { params });
    return response.data;
  }

  async getScreenshot(id: string) {
    const response = await this.client.get(`/screenshots/${id}`);
    return response.data;
  }

  async getScreenshotImage(id: string) {
    const response = await this.client.get(`/screenshots/${id}/image`, { responseType: 'blob' });
    return response.data;
  }

  async downloadScreenshot(id: string) {
    const response = await this.client.get(`/screenshots/${id}/download`, { responseType: 'blob' });
    return response.data;
  }

  async downloadScreenshotsZip(ids: string[]) {
    const response = await this.client.post('/screenshots/download-zip', { ids }, { responseType: 'blob' });
    return response.data;
  }

  // Alert endpoints
  async getAlerts(params?: { workstationId?: string; userId?: string; severity?: string; resolved?: boolean; acknowledged?: boolean; page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/alerts', { params });
    return response.data;
  }

  async getAlert(id: string) {
    const response = await this.client.get(`/alerts/${id}`);
    return response.data;
  }

  async acknowledgeAlert(id: string) {
    const response = await this.client.post(`/alerts/${id}/acknowledge`);
    return response.data;
  }

  async resolveAlert(id: string, resolution?: string) {
    const response = await this.client.post(`/alerts/${id}/resolve`, { resolution });
    return response.data;
  }

  async getAlertStats(params?: { hours?: number }) {
    const response = await this.client.get('/alerts/stats', { params });
    return response.data;
  }

  // Policy endpoints
  async getPolicies() {
    const response = await this.client.get('/policies');
    return response.data;
  }

  async getPolicy(id: string) {
    const response = await this.client.get(`/policies/${id}`);
    return response.data;
  }

  async createPolicy(policy: Record<string, unknown>) {
    const response = await this.client.post('/policies', policy);
    return response.data;
  }

  async updatePolicyById(id: string, policy: Record<string, unknown>) {
    const response = await this.client.put(`/policies/${id}`, policy);
    return response.data;
  }

  async deletePolicy(id: string) {
    const response = await this.client.delete(`/policies/${id}`);
    return response.data;
  }

  async deployPolicy(policyId: string, workstationIds: string[]) {
    const response = await this.client.post(`/policies/${policyId}/deploy`, { workstationIds });
    return response.data;
  }

  // Report endpoints
  async getDashboardStats() {
    const response = await this.client.get('/reports/dashboard');
    return response.data;
  }

  async getUsageReport(params?: { startDate?: string; endDate?: string; groupBy?: string }) {
    const response = await this.client.get('/reports/usage', { params });
    return response.data;
  }

  async getApplicationReport(params?: { startDate?: string; endDate?: string; limit?: number }) {
    const response = await this.client.get('/reports/applications', { params });
    return response.data;
  }

  async getWebsiteReport(params?: { startDate?: string; endDate?: string; limit?: number }) {
    const response = await this.client.get('/reports/websites', { params });
    return response.data;
  }

  async getAlertTrends(params?: { startDate?: string; endDate?: string; interval?: string }) {
    const response = await this.client.get('/reports/alert-trends', { params });
    return response.data;
  }

  async getUserActivityReport(params?: { userId?: string; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/reports/user-activity', { params });
    return response.data;
  }

  async exportReport(type: string, params?: Record<string, unknown>, format: 'pdf' | 'excel' = 'excel') {
    const response = await this.client.post(`/reports/export/${type}`, { ...params, format }, { responseType: 'blob' });
    return response.data;
  }

  // Evidence Vault endpoints
  async searchEvidence(params?: { query?: string; workstationId?: string; userId?: string; startDate?: string; endDate?: string; triggerReason?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/evidence/search', { params });
    return response.data;
  }

  async getEvidenceStats() {
    const response = await this.client.get('/evidence/stats');
    return response.data;
  }

  // Settings endpoints
  async getSettings() {
    const response = await this.client.get('/settings');
    return response.data;
  }

  async updateSettings(settings: Record<string, unknown>) {
    const response = await this.client.put('/settings', settings);
    return response.data;
  }

  async getSystemHealth() {
    const response = await this.client.get('/settings/health');
    return response.data;
  }

  // Audit log endpoints
  async getAuditLogs(params?: { userId?: string; action?: string; resource?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const response = await this.client.get('/audit-logs', { params });
    return response.data;
  }

  // Admin user management
  async getAdmins() {
    const response = await this.client.get('/admin/users');
    return response.data;
  }

  async createAdmin(userData: { username: string; email: string; password: string; fullName: string; role: string }) {
    const response = await this.client.post('/admin/users', userData);
    return response.data;
  }

  async updateAdmin(id: string, userData: Partial<{ username: string; email: string; fullName: string; role: string; isActive: boolean }>) {
    const response = await this.client.put(`/admin/users/${id}`, userData);
    return response.data;
  }

  async deleteAdmin(id: string) {
    const response = await this.client.delete(`/admin/users/${id}`);
    return response.data;
  }

  async resetAdminPassword(id: string, newPassword: string) {
    const response = await this.client.post(`/admin/users/${id}/reset-password`, { newPassword });
    return response.data;
  }
}

export const api = new ApiService();
export default api;