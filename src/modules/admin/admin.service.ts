import { store } from '../../database/store';
import { UserStatus, AdminBarberItem, MembershipPlan, BarberMembership } from '../../core/types';
import { MembershipUtils } from '../../core/utils/membership.utils';

export class AdminService {
  /**
   * Obtiene la lista completa de barberos registrados con sus métricas y estado.
   */
  public static listBarbers(): AdminBarberItem[] {
    return store.getAllBarbersWithStats();
  }

  /**
   * Actualiza el estado de una cuenta de barbero (Activar / Suspender / Pendiente).
   */
  public static updateBarberStatus(
    userId: string, 
    status: UserStatus, 
    isActive: boolean, 
    adminUser: any
  ) {
    const user = store.findUserById(userId);
    if (!user) {
      throw new Error('Barbero no encontrado.');
    }

    if (user.role !== 'barber') {
      throw new Error('Solo se puede modificar el estado de cuentas con rol de barbero.');
    }

    const updated = store.updateUserStatus(userId, status, isActive, adminUser?.email || 'Administrador');
    if (!updated) {
      throw new Error('No se pudo actualizar el estado del barbero.');
    }

    return {
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        status: updated.status,
        isActive: updated.isActive,
        approvedAt: updated.approvedAt,
      },
      message: isActive && status === 'active' 
        ? `Barbero ${updated.name} activado con éxito. Ahora está disponible en la agenda para recibir citas.`
        : `Barbero ${updated.name} ${status === 'suspended' ? 'suspendido' : 'actualizado'} con éxito.`
    };
  }

  /**
   * Actualiza detalles del barbero como comisión, teléfono o color.
   */
  public static updateBarberDetails(userId: string, data: {
    commissionPercentage?: number;
    colorTag?: string;
    phone?: string;
    name?: string;
  }) {
    const user = store.findUserById(userId);
    if (!user) {
      throw new Error('Barbero no encontrado.');
    }

    const updates: any = {};
    if (typeof data.commissionPercentage === 'number') updates.commissionPercentage = data.commissionPercentage;
    if (data.colorTag) updates.colorTag = data.colorTag;
    if (data.phone) updates.phone = data.phone.trim();
    if (data.name) updates.name = data.name.trim();

    const updated = store.updateUser(userId, updates);
    if (!updated) {
      throw new Error('Error actualizando barbero.');
    }

    // Sincronizar en store.barbers si está activo
    if (updated.isActive) {
      store.syncUserToBarber(updated);
    }

    return {
      success: true,
      user: updated
    };
  }

  /**
   * Elimina una cuenta de barbero.
   */
    /**
   * Gestiona el tiempo y vigencia de la membresía de software del barbero.
   * Permite renovar sumando días (+30, +90, +365), fijar fecha exacta o cambiar de plan.
   */
  public static updateBarberMembership(userId: string, data: {
    plan?: MembershipPlan;
    addDays?: number;
    expiresAt?: string;
    price?: number;
    paymentMethod?: string;
    notes?: string;
    autoRenew?: boolean;
  }) {
    const result = store.updateBarberMembership(userId, data);
    if (!result) {
      throw new Error('Barbero no encontrado para actualizar su membresía.');
    }

    const { user, membership } = result;
    return {
      success: true,
      message: `Membresía del barbero ${user.name} actualizada con éxito (${membership.plan.toUpperCase()} • ${membership.daysRemaining} días restantes).`,
      barber: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        membership
      }
    };
  }

  public static deleteBarber(userId: string) {
    const user = store.findUserById(userId);
    if (!user) {
      throw new Error('Barbero no encontrado.');
    }

    if (user.role === 'admin') {
      throw new Error('No es posible eliminar una cuenta de Administrador.');
    }

    const deleted = store.deleteUser(userId);
    if (!deleted) {
      throw new Error('No se pudo eliminar el barbero.');
    }

    return {
      success: true,
      message: `Cuenta del barbero ${user.name} eliminada permanentemente.`
    };
  }

  /**
   * Obtiene estadísticas consolidadas del panel de administración.
   */
  public static getAdminStats() {
    const barbers = store.getAllBarbersWithStats();
    const totalBarbers = barbers.length;
    const activeBarbers = barbers.filter(b => b.isActive && b.status === 'active').length;
    const pendingBarbers = barbers.filter(b => b.status === 'pending' || !b.isActive).length;
    const suspendedBarbers = barbers.filter(b => b.status === 'suspended').length;

    // Métricas clave de Membresías de Software ("medir las membresias de el software")
    const membershipsList = barbers.map(b => b.membership);
    const activeMemberships = membershipsList.filter(m => !m.isExpired && m.status !== 'suspended').length;
    const expiringSoonMemberships = membershipsList.filter(m => m.isExpiringSoon).length;
    const expiredMemberships = membershipsList.filter(m => m.isExpired).length;
    const monthlyRecurringRevenue = MembershipUtils.calculateMRR(membershipsList);

    const totalRevenue = store.appointments
      .filter(a => a.status === 'completed' || a.status === 'confirmed')
      .reduce((sum, a) => sum + (a.totalPrice || 0), 0);

    return {
      totalBarbers,
      activeBarbers,
      pendingBarbers,
      suspendedBarbers,
      memberships: {
        total: membershipsList.length,
        active: activeMemberships,
        expiringSoon: expiringSoonMemberships,
        expired: expiredMemberships,
        monthlyRecurringRevenue,
      },
      totalAppointments: store.appointments.length,
      totalClients: store.clients.length,
      totalRevenue,
      shopSettings: store.settings
    };
  }
}

export default AdminService;
