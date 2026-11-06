export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: 'admin' | 'barber';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSafeProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'barber';
  tenantId: string;
}

export interface AuthResponse {
  user: UserSafeProfile;
  token: string;
}
