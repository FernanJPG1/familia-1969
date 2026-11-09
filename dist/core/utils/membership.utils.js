"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipUtils = exports.PLAN_PRICING = void 0;
exports.PLAN_PRICING = {
    trial: { price: 0, name: 'Prueba Gratuita (15 días)', durationDays: 15 },
    mensual: { price: 50000, name: 'Plan Mensual (30 días)', durationDays: 30 },
    trimestral: { price: 135000, name: 'Plan Trimestral (90 días)', durationDays: 90 },
    semestral: { price: 250000, name: 'Plan Semestral (180 días)', durationDays: 180 },
    anual: { price: 480000, name: 'Plan Anual VIP (365 días)', durationDays: 365 },
};
class MembershipUtils {
    /**
     * Evalúa la vigencia y estado dinámico de la membresía de un barbero.
     */
    static evaluate(rawMembership, userStatus) {
        const now = Date.now();
        const defaultStart = new Date().toISOString();
        // Por defecto, otorgar 30 días de prueba / membresía activa desde su creación
        const defaultExpiry = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
        const plan = rawMembership?.plan || 'mensual';
        const startDate = rawMembership?.startDate || defaultStart;
        const expiresAt = rawMembership?.expiresAt || defaultExpiry;
        const price = typeof rawMembership?.price === 'number' ? rawMembership.price : (exports.PLAN_PRICING[plan]?.price ?? 50000);
        const expTime = new Date(expiresAt).getTime();
        const diffMs = expTime - now;
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isExpired = daysRemaining <= 0;
        const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
        let status = 'active';
        if (userStatus === 'suspended') {
            status = 'suspended';
        }
        else if (isExpired) {
            status = 'expired';
        }
        else if (isExpiringSoon) {
            status = 'expiring_soon';
        }
        return {
            plan,
            status,
            startDate,
            expiresAt,
            price,
            daysRemaining: Math.max(0, daysRemaining),
            isExpired,
            isExpiringSoon,
            autoRenew: rawMembership?.autoRenew ?? false,
            lastPaymentDate: rawMembership?.lastPaymentDate || undefined,
            paymentMethod: rawMembership?.paymentMethod || 'Nequi / Transferencia',
            notes: rawMembership?.notes || '',
        };
    }
    /**
     * Calcula la nueva fecha de expiración al agregar días.
     * Si la membresía actual ya está vencida, los días se suman a partir de hoy.
     * Si la membresía está vigente, los días se acumulan al final del vencimiento actual.
     */
    static calculateNewExpiry(currentExpiresAt, addDays) {
        const now = Date.now();
        let baseTime = now;
        if (currentExpiresAt) {
            const currentExpiryMs = new Date(currentExpiresAt).getTime();
            if (!isNaN(currentExpiryMs) && currentExpiryMs > now) {
                baseTime = currentExpiryMs;
            }
        }
        const newTime = baseTime + addDays * 24 * 60 * 60 * 1000;
        return new Date(newTime).toISOString();
    }
    /**
     * Calcula el Ingreso Mensual Recurrente (MRR) normalizado de un conjunto de membresías activas.
     */
    static calculateMRR(memberships) {
        return memberships.reduce((sum, m) => {
            if (m.isExpired || m.status === 'suspended')
                return sum;
            switch (m.plan) {
                case 'mensual':
                    return sum + m.price;
                case 'trimestral':
                    return sum + Math.round(m.price / 3);
                case 'semestral':
                    return sum + Math.round(m.price / 6);
                case 'anual':
                    return sum + Math.round(m.price / 12);
                case 'trial':
                default:
                    return sum;
            }
        }, 0);
    }
}
exports.MembershipUtils = MembershipUtils;
