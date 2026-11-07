import { store } from '../../database/store';
import { CryptoUtils } from '../../core/utils/crypto.utils';
import { User, UserSafeProfile, AuthResponse } from '../../core/types';

const BARBER_PALETTE = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#14B8A6'];

export class AuthService {
  /**
   * Registra un nuevo barbero en el sistema.
   * La cuenta queda en estado "pending" e inactiva hasta que el Administrador la apruebe.
   */
  public static async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    shopName?: string;
  }): Promise<AuthResponse> {
    const { name, email, password, phone } = data;

    if (!name || !email || !password || !phone) {
      throw new Error('Todos los campos son obligatorios (Nombre, Email, Contraseña, Teléfono WhatsApp).');
    }

    const emailClean = email.trim().toLowerCase();
    const existing = store.findUserByEmail(emailClean);
    if (existing) {
      throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres para garantizar la seguridad.');
    }

    const passwordHash = CryptoUtils.hashPassword(password);
    const tenantId = store.tenants[0]?.id || 'tenant-demo-1';
    const userId = `usr-${Date.now()}`;
    const now = new Date().toISOString();
    const colorTag = BARBER_PALETTE[Math.floor(Math.random() * BARBER_PALETTE.length)];

    const newUser: User = {
      id: userId,
      email: emailClean,
      passwordHash,
      name: name.trim(),
      phone: phone.trim(),
      role: 'barber',
      status: 'pending',
      isActive: false,
      colorTag,
      commissionPercentage: 100,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    store.createUser(newUser);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        isActive: newUser.isActive,
        colorTag: newUser.colorTag,
        tenantId: newUser.tenantId,
      },
      token: '',
      message: '¡Registro exitoso! Tu cuenta de barbero ha sido creada y está pendiente de activación por el Administrador de FAMILIA 1969. Tan pronto como el administrador verifique tu WhatsApp y active tu cuenta podrás iniciar sesión.'
    };
  }

  /**
   * Inicia sesión verificando credenciales seguras y estado de activación.
   */
  public static async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Por favor ingresa tu correo y contraseña.');
    }

    const emailClean = email.trim().toLowerCase();
    const user = store.findUserByEmail(emailClean);

    if (!user) {
      throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
    }

    const isValid = CryptoUtils.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
    }

    // Si es un barbero, verificar si su cuenta fue activada por el Administrador
    if (user.role === 'barber') {
      if (user.status === 'pending' || !user.isActive) {
        const err: any = new Error('Tu cuenta de barbero está en revisión y pendiente de activación por el Administrador de FAMILIA 1969. Comunícate con la administración para ser habilitado.');
        err.statusCode = 403;
        err.isPending = true;
        throw err;
      }

      if (user.status === 'suspended') {
        const err: any = new Error('Tu cuenta de barbero ha sido suspendida temporalmente por el Administrador de FAMILIA 1969.');
        err.statusCode = 403;
        throw err;
      }
    }

    const token = CryptoUtils.createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        colorTag: user.colorTag,
        commissionPercentage: user.commissionPercentage,
        tenantId: user.tenantId
      },
      token
    };
  }

  /**
   * Obtiene el perfil seguro del usuario autenticado.
   */
  public static getProfile(userId: string): UserSafeProfile {
    const user = store.findUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      colorTag: user.colorTag,
      commissionPercentage: user.commissionPercentage,
      tenantId: user.tenantId
    };
  }

  /**
   * Permite al barbero o administrador autenticado actualizar su número de WhatsApp y datos.
   */
  public static updateProfile(userId: string, data: { name?: string; phone?: string }): UserSafeProfile {
    const user = store.findUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    const updates: Partial<User> = {};
    if (data.name) updates.name = data.name.trim();
    if (data.phone) {
      updates.phone = data.phone.trim();

      // Sincronizar en store.barbers si tiene registro de barbero
      if (user.barberId) {
        const barber = store.barbers.find(b => b.id === user.barberId);
        if (barber) {
          barber.phone = updates.phone;
          barber.updatedAt = new Date();
        }
      }

      // Si es el barbero principal o admin, actualizar en Settings
      if (user.role === 'admin' || user.barberId === store.barbers[0]?.id) {
        store.updateSettings({ phone: updates.phone });
      }
    }

    const updated = store.updateUser(userId, updates);
    if (!updated) {
      throw new Error('Error al actualizar usuario.');
    }

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      role: updated.role,
      status: updated.status,
      isActive: updated.isActive,
      colorTag: updated.colorTag,
      commissionPercentage: updated.commissionPercentage,
      tenantId: updated.tenantId
    };
  }
}
export default AuthService;
