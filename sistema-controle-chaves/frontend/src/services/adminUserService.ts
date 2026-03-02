import api from './api';

export interface ApiAdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface AdminUserPayload {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  is_superuser?: boolean;
  is_active?: boolean;
}

export const adminUserService = {
  list: () => api.get<ApiAdminUser[]>('/api/admin-users/'),

  create: (data: AdminUserPayload) =>
    api.post<ApiAdminUser>('/api/admin-users/', data),

  update: (id: number, data: AdminUserPayload) =>
    api.patch<ApiAdminUser>(`/api/admin-users/${id}/`, data),

  destroy: (id: number) => api.delete(`/api/admin-users/${id}/`),
};
