"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const store_1 = require("../../database/store");
const crypto_utils_1 = require("../../core/utils/crypto.utils");
class AuthService {
    /**
     * Registra un nuevo barbero / administrador en el sistema seguro.
     */
    static async register(data) {
        const { name, email, password, phone, shopName } = data;
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
        const newUser = {
            id: userId,
            email: emailClean,
            passwordHash,
            name: name.trim(),
            phone: phone.trim(),
            role: 'barber',
            tenantId,
            createdAt: now,
            updatedAt: now,
        };
        store_1.store.createUser(newUser);
        // Sincronizar teléfono y nombre con los ajustes de la barbería
        store_1.store.updateSettings({
            barberName: newUser.name,
            phone: newUser.phone,
            ...(shopName ? { shopName } : {})
        });
        const token = crypto_utils_1.CryptoUtils.createToken({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
            tenantId: newUser.tenantId
        });
        return {
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                phone: newUser.phone,
                role: newUser.role,
                tenantId: newUser.tenantId
            },
            token
        };
    }
    /**
     * Inicia sesión verificando credenciales seguras.
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
        const token = crypto_utils_1.CryptoUtils.createToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
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
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            tenantId: user.tenantId
        };
    }
    /**
     * Permite al barbero autenticado actualizar su número de WhatsApp y nombre.
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
            // Actualizar automáticamente el número de WhatsApp oficial en Settings
            store_1.store.updateSettings({ phone: updates.phone });
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
            tenantId: updated.tenantId
        };
    }
}
exports.AuthService = AuthService;
