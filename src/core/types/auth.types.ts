export type UserRole = 'admin' | 'barber';
export type UserStatus = 'active' | 'pending' | 'suspended';

export type MembershipPlan = 'trial' | 'mensual' | 'trimestral' | 'semestral' | 'anual';
export type MembershipStatus = 'active' | 'expiring_soon' | 'expired' | 'suspended';

export interface BarberMembership {
  plan: MembershipPlan;
  status: MembershipStatus;
  startDate: string;
  expiresAt: string;
  price: number;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  autoRenew?: boolean;
  lastPaymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

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
  membership?: {
    plan: MembershipPlan;
    status?: MembershipStatus;
    startDate: string;
    expiresAt: string;
    price: number;
    autoRenew?: boolean;
    lastPaymentDate?: string;
    paymentMethod?: string;
    notes?: string;
  };
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  emailVerificationCode?: string;
  phoneVerificationCode?: string;
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
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  membership?: BarberMembership;
  tenantId: string;
}

export interface AuthResponse {
  user: UserSafeProfile;
  token: string;
  message?: string;
  requiresVerification?: boolean;
  userId?: string;
  email?: string;
  phone?: string;
  emailCodePreview?: string;
  phoneCodePreview?: string;
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
  membership: BarberMembership;
}
