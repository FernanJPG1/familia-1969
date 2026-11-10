"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.normalizePhoneForWhatsApp = normalizePhoneForWhatsApp;
const store_1 = require("../../database/store");
const crypto_utils_1 = require("../../core/utils/crypto.utils");
const membership_utils_1 = require("../../core/utils/membership.utils");
const BARBER_PALETTE = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#14B8A6'];
function normalizePhoneForWhatsApp(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('3')) {
        digits = '57' + digits;
    }
    let formatted = '+' + digits;
    if (digits.startsWith('57') && digits.length === 12) {
        formatted = `+57 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    const waUrl = digits ? `https://wa.me/${digits}` : '';
    return { clean: digits, formatted, waUrl };
}
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
        // Generar códigos de verificación de 6 dígitos
        const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneNorm = normalizePhoneForWhatsApp(phone);
        const newUser = {
            id: userId,
            email: emailClean,
            passwordHash,
            name: name.trim(),
            phone: phoneNorm.formatted,
            role: 'barber',
            status: 'pending',
            isActive: false,
            isEmailVerified: false,
            isPhoneVerified: false,
            emailVerificationCode,
            phoneVerificationCode,
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
                isEmailVerified: false,
                isPhoneVerified: false,
                colorTag: newUser.colorTag,
                tenantId: newUser.tenantId,
            },
            token: '',
            requiresVerification: true,
            userId: newUser.id,
            email: newUser.email,
            phone: newUser.phone,
            emailCodePreview: emailVerificationCode,
            phoneCodePreview: phoneVerificationCode,
            message: 'Código de verificación enviado a tu correo y a tu WhatsApp. Por favor confirma los códigos de 6 dígitos para ingresar.'
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
        // Si es un barbero, verificar si completó la verificación de email y celular
        if (user.role === 'barber') {
            if (user.isEmailVerified === false || user.isPhoneVerified === false) {
                if (!user.emailVerificationCode) {
                    user.emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                }
                if (!user.phoneVerificationCode) {
                    user.phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                }
                store_1.store.updateUser(user.id, {
                    emailVerificationCode: user.emailVerificationCode,
                    phoneVerificationCode: user.phoneVerificationCode
                });
                const err = new Error('Debes verificar tu número de celular y correo electrónico para activar tu cuenta.');
                err.statusCode = 403;
                err.requiresVerification = true;
                err.userId = user.id;
                err.email = user.email;
                err.phone = user.phone;
                err.emailCodePreview = user.emailVerificationCode;
                err.phoneCodePreview = user.phoneVerificationCode;
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
            const phoneNorm = normalizePhoneForWhatsApp(data.phone);
            updates.phone = phoneNorm.formatted;
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
    /**
     * Verifica los códigos de correo y WhatsApp y activa la cuenta del barbero.
     */
    static async verify(data) {
        const { userId, emailCode, phoneCode } = data;
        if (!userId || !emailCode || !phoneCode) {
            throw new Error('Todos los campos son obligatorios (Código de Correo y Código de Celular).');
        }
        const user = store_1.store.findUserById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }
        const cleanEmailCode = emailCode.toString().trim();
        const cleanPhoneCode = phoneCode.toString().trim();
        // Verificación: acepta código generado o código maestro de prueba '123456'
        const isEmailValid = cleanEmailCode === user.emailVerificationCode || cleanEmailCode === '123456';
        const isPhoneValid = cleanPhoneCode === user.phoneVerificationCode || cleanPhoneCode === '123456';
        if (!isEmailValid) {
            throw new Error('Código de verificación de correo incorrecto.');
        }
        if (!isPhoneValid) {
            throw new Error('Código de verificación de WhatsApp/celular incorrecto.');
        }
        // Activar y verificar usuario
        user.isEmailVerified = true;
        user.isPhoneVerified = true;
        user.status = 'active';
        user.isActive = true;
        user.emailVerificationCode = undefined;
        user.phoneVerificationCode = undefined;
        store_1.store.updateUser(user.id, {
            isEmailVerified: true,
            isPhoneVerified: true,
            status: 'active',
            isActive: true,
            emailVerificationCode: undefined,
            phoneVerificationCode: undefined
        });
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
                isEmailVerified: true,
                isPhoneVerified: true,
                colorTag: user.colorTag,
                commissionPercentage: user.commissionPercentage,
                membership,
                tenantId: user.tenantId
            },
            token,
            message: '¡Verificación completada con éxito! Tu cuenta de barbero está activa.'
        };
    }
    /**
     * Reenvía nuevos códigos de verificación al correo y WhatsApp.
     */
    static async resendCode(data) {
        let user;
        if (data.userId) {
            user = store_1.store.findUserById(data.userId);
        }
        else if (data.email) {
            user = store_1.store.findUserByEmail(data.email);
        }
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }
        const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();
        store_1.store.updateUser(user.id, {
            emailVerificationCode: emailCode,
            phoneVerificationCode: phoneCode
        });
        return {
            success: true,
            message: 'Nuevos códigos generados y enviados a tu correo y celular.',
            emailCodePreview: emailCode,
            phoneCodePreview: phoneCode
        };
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
