import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../providers/barber_provider.dart';

class EarningsTab extends StatelessWidget {
  const EarningsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BarberProvider>();
    final apps = provider.appointments;
    final completed = apps.where((a) => a.status == 'completed' || a.status == 'confirmed').toList();
    final total = completed.fold<int>(0, (sum, a) => sum + a.totalPrice);
    final barberName = provider.settings?.barberName ?? 'Mateo Silva';

    return RefreshIndicator(
      color: AppTheme.goldPrimary,
      backgroundColor: AppTheme.surface,
      onRefresh: () => provider.fetchDashboard(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 90),
        children: [
          // Hero Caja Proyectada
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.goldPrimary.withValues(alpha: 0.18),
                  AppTheme.surface.withValues(alpha: 0.95),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppTheme.goldPrimary.withValues(alpha: 0.3)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: [
                const Text(
                  'TOTAL PROYECTADO HOY',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.goldPrimary,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  AppConstants.formatPrice(total),
                  style: const TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '100% de ingreso directo para $barberName',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'Historial de Servicios de Hoy',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),

          if (completed.isEmpty)
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: const Center(
                child: Text(
                  'Sin ingresos registrados hoy aún.',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                ),
              ),
            )
          else
            ...completed.map(
              (a) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          a.serviceName,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${a.clientName} • ${AppConstants.formatTime(a.startTime)}',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                    Text(
                      '+${AppConstants.formatPrice(a.totalPrice)}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF34D399),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
