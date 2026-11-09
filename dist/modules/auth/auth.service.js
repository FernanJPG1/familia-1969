"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const store_1 = require("../../database/store");
const crypto_utils_1 = require("../../core/utils/crypto.utils");
const membership_utils_1 = require("../../core/utils/membership.utils");
const BARBER_PALETTE = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#14B8A6'];
class AuthService {
    /**
     * Registra un nuevo barbero en el sistema.
     * La cuenta queda en estado "pending" e inactiva hasta que el Administrador la apruebe.
     */
    static async register(data) {
        const { name, email, password, phone } = data;
        if (!name || !email || !password || !phone) {
            throw new Error('Todos los campos son obligatorios (Nombre, Email, Contraseña, Teléfono WhatsApp).');
        }
        const emailClean = email.trim().toLowerCase();
        const existing = store_1.store.findUserByEmail(emailClean);
        if (existing) {
            throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
        }
        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres para garantizar la seguridad.');
        }
        const passwordHash = crypto_utils_1.CryptoUtils.hashPassword(password);
        const tenantId = store_1.store.tenants[0]?.id || 'tenant-demo-1';
        const userId = `usr-${Date.now()}`;
        const now = new Date().toISOString();
        const colorTag = BARBER_PALETTE[Math.floor(Math.random() * BARBER_PALETTE.length)];
        const newUser = {
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
            membership: {
                plan: 'trial',
                startDate: now,
                expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                price: 0,
                paymentMethod: 'Prueba Gratuita',
                notes: 'Período de prueba inicial de 15 días asignado al registrarse.'
            },
            tenantId,
            createdAt: now,
            updatedAt: now,
        };
        store_1.store.createUser(newUser);
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
    static async login(data) {
        const { email, password } = data;
        if (!email || !password) {
            throw new Error('Por favor ingresa tu correo y contraseña.');
        }
        const emailClean = email.trim().toLowerCase();
        const user = store_1.store.findUserByEmail(emailClean);
        if (!user) {
            throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        const isValid = crypto_utils_1.CryptoUtils.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
        }
        // Si es un barbero, verificar si su cuenta fue activada por el Administrador
        if (user.role === 'barber') {
            if (user.status === 'pending' || !user.isActive) {
                const err = new Error('Tu cuenta de barbero está en revisión y pendiente de activación por el Administrador de FAMILIA 1969. Comunícate con la administración para ser habilitado.');
                err.statusCode = 403;
                err.isPending = true;
                throw err;
            }
            if (user.status === 'suspended') {
                const err = new Error('Tu cuenta de barbero ha sido suspendida temporalmente por el Administrador de FAMILIA 1969.');
                err.statusCode = 403;
                throw err;
            }
        }
        const token = crypto_utils_1.CryptoUtils.createToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            tenantId: user.tenantId
        });
        const membership = user.role === 'barber' ? membership_utils_1.MembershipUtils.evaluate(user.membership, user.status) : undefined;
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
                membership,
                tenantId: user.tenantId
            },
            token
        };
    }
    /**
     * Obtiene el perfil seguro del usuario autenticado.
     */
    static getProfile(userId) {
        const user = store_1.store.findUserById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }
        const membership = user.role === 'barber' ? membership_utils_1.MembershipUtils.evaluate(user.membership, user.status) : undefined;
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
            membership,
            tenantId: user.tenantId
        };
    }
    /**
     * Permite al barbero o administrador autenticado actualizar su número de WhatsApp y datos.
     */
    static updateProfile(userId, data) {
        const user = store_1.store.findUserById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }
        const updates = {};
        if (data.name)
            updates.name = data.name.trim();
        if (data.phone) {
            updates.phone = data.phone.trim();
            // Sincronizar en store.barbers si tiene registro de barbero
            if (user.barberId) {
                const barber = store_1.store.barbers.find(b => b.id === user.barberId);
                if (barber) {
                    barber.phone = updates.phone;
                    barber.updatedAt = new Date();
                }
            }
            // Si es el barbero principal o admin, actualizar en Settings
            if (user.role === 'admin' || user.barberId === store_1.store.barbers[0]?.id) {
                store_1.store.updateSettings({ phone: updates.phone });
            }
        }
        const updated = store_1.store.updateUser(userId, updates);
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
exports.AuthService = AuthService;
exports.default = AuthService;
