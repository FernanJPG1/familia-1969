export type UserRole = 'admin' | 'barber';
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string; // WhatsApp oficial
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  barberId?: string;
  colorTag?: string;
  commissionPercentage?: number;
  approvedAt?: string | null;
  approvedBy?: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSafeProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  barberId?: string;
  colorTag?: string;
  commissionPercentage?: number;
  tenantId: string;
}

export interface AuthResponse {
  user: UserSafeProfile;
  token: string;
  message?: string;
}

export interface AdminBarberItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  barberId?: string;
  colorTag?: string;
  commissionPercentage?: number;
  appointmentsCount: number;
  totalEarnings: number;
  createdAt: string;
  approvedAt?: string | null;
}
