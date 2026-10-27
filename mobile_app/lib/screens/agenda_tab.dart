import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../models/appointment_model.dart';
import '../providers/barber_provider.dart';

class AgendaTab extends StatelessWidget {
  const AgendaTab({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BarberProvider>();
    final apps = provider.appointments;
    final metrics = provider.metrics;
    final nextApp = provider.nextUpcomingAppointment;
    final settings = provider.settings;

    return RefreshIndicator(
      color: AppTheme.goldPrimary,
      backgroundColor: AppTheme.surface,
      onRefresh: () => provider.fetchDashboard(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 90),
        children: [
          // 1. Carrusel de Días
          _buildDayCarousel(context, provider),
          const SizedBox(height: 16),

          // 2. Hero Card: Siguiente Cliente
          if (nextApp != null) ...[
            _buildNextUpHero(context, provider, nextApp),
            const SizedBox(height: 16),
          ],

          // 3. Métricas 3 Pills
          _buildMetricsRow(metrics),
          const SizedBox(height: 18),

          // 4. Título de Sección
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Turnos del Día',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              Text(
                '${apps.where((a) => a.status != 'cancelled').length} citas',
                style: const TextStyle(
                  color: AppTheme.goldPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // 5. Lista de Citas con Divisor de Almuerzo
          if (apps.isEmpty)
            _buildEmptyState()
          else
            ..._buildAppointmentsList(context, provider, apps, settings),
        ],
      ),
    );
  }

  Widget _buildDayCarousel(BuildContext context, BarberProvider provider) {
    final today = DateTime.now();
    final days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return SizedBox(
      height: 64,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 7,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final date = today.add(Duration(days: index - 1));
          final isSelected = date.year == provider.selectedDate.year &&
              date.month == provider.selectedDate.month &&
              date.day == provider.selectedDate.day;

          return GestureDetector(
            onTap: () => provider.changeDate(date),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 58,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                gradient: isSelected ? AppTheme.goldGradient : null,
                color: isSelected ? null : AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? Colors.transparent : AppTheme.borderSubtle,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppTheme.goldPrimary.withValues(alpha: 0.35),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    days[date.weekday % 7],
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? const Color(0xFF080C14) : AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${date.day}',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: isSelected ? const Color(0xFF080C14) : Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildNextUpHero(
    BuildContext context,
    BarberProvider provider,
    AppointmentModel nextApp,
  ) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.goldPrimary.withValues(alpha: 0.15),
            AppTheme.surface.withValues(alpha: 0.95),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.goldPrimary.withValues(alpha: 0.35)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.4),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.notifications_active, color: AppTheme.goldPrimary, size: 14),
                  SizedBox(width: 6),
                  Text(
                    'SIGUIENTE EN ESPERA',
                    style: TextStyle(
                      color: AppTheme.goldPrimary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.accentEmerald.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  AppConstants.formatTime(nextApp.startTime),
                  style: const TextStyle(
                    color: Color(0xFF34D399),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            nextApp.clientName,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.content_cut, color: AppTheme.goldPrimary, size: 14),
              const SizedBox(width: 6),
              Text(
                '${nextApp.serviceName} (${nextApp.serviceDuration} min) • ${AppConstants.formatPrice(nextApp.totalPrice)}',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => provider.updateStatus(nextApp.id, 'completed'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentEmerald.withValues(alpha: 0.2),
                    foregroundColor: const Color(0xFF34D399),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: AppTheme.accentEmerald.withValues(alpha: 0.4)),
                    ),
                  ),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('En Sillón / Listo', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () {
                  final uri = Uri.parse('https://wa.me/${nextApp.clientPhone}');
                  launchUrl(uri, mode: LaunchMode.externalApplication);
                },
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white.withValues(alpha: 0.08),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                ),
                icon: const Icon(Icons.chat, color: Color(0xFF25D366)),
                tooltip: 'WhatsApp',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsRow(DashboardMetrics? metrics) {
    return Row(
      children: [
        _buildMetricPill(
          label: 'CAJA HOY',
          value: metrics != null ? AppConstants.formatPrice(metrics.totalRevenue) : '\$0',
          color: Colors.white,
        ),
        const SizedBox(width: 8),
        _buildMetricPill(
          label: 'TURNOS',
          value: '${metrics?.totalBookings ?? 0}',
          color: Colors.white,
        ),
        const SizedBox(width: 8),
        _buildMetricPill(
          label: 'BOT 24/7',
          value: 'Activo',
          color: const Color(0xFF34D399),
        ),
      ],
    );
  }

  Widget _buildMetricPill({
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildAppointmentsList(
    BuildContext context,
    BarberProvider provider,
    List<AppointmentModel> apps,
    dynamic settings,
  ) {
    final sorted = [...apps]..sort((a, b) => a.startTime.compareTo(b.startTime));
    final widgets = <Widget>[];

    for (var i = 0; i < sorted.length; i++) {
      final app = sorted[i];

      widgets.add(_buildAppointmentCard(context, provider, app));
      widgets.add(const SizedBox(height: 10));

      // Lunch separator if enabled
      if (settings != null && settings.lunchEnabled == true) {
        final lStartH = int.tryParse(settings.lunchStartTime.split(':')[0]) ?? 13;
        final nextStartH = (i + 1 < sorted.length) ? sorted[i + 1].startTime.hour : 24;

        if (app.startTime.hour <= lStartH && nextStartH > lStartH) {
          widgets.add(
            Container(
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.restaurant, color: AppTheme.goldPrimary, size: 14),
                  const SizedBox(width: 8),
                  Text(
                    '${settings.lunchStartTime} - ${settings.lunchEndTime} Receso de Almuerzo (Bloqueado)',
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          );
          widgets.add(const SizedBox(height: 10));
        }
      }
    }

    return widgets;
  }

  Widget _buildAppointmentCard(
    BuildContext context,
    BarberProvider provider,
    AppointmentModel app,
  ) {
    final statusColor = _getStatusColor(app.status);

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.access_time, color: AppTheme.goldPrimary, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    '${AppConstants.formatTime(app.startTime)} - ${AppConstants.formatTime(app.endTime)}',
                    style: const TextStyle(
                      color: AppTheme.goldPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  app.status.toUpperCase(),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                app.clientName,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              if (app.clientNoShows > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.accentRose.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '⚠️ ${app.clientNoShows} No-Show',
                    style: const TextStyle(color: Color(0xFFF87171), fontSize: 9),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${app.serviceName} (${app.serviceDuration}m)',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
              Text(
                AppConstants.formatPrice(app.totalPrice),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (app.status != 'completed' && app.status != 'cancelled') ...[
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => provider.updateStatus(app.id, 'completed'),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppTheme.accentEmerald.withValues(alpha: 0.4)),
                      foregroundColor: const Color(0xFF34D399),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    icon: const Icon(Icons.check, size: 14),
                    label: const Text('Completar', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => provider.sendReminder(app.id),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppTheme.goldPrimary.withValues(alpha: 0.4)),
                      foregroundColor: AppTheme.goldPrimary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    icon: const Icon(Icons.notifications, size: 14),
                    label: const Text('T-2h', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 6),
                IconButton(
                  onPressed: () => provider.updateStatus(app.id, 'no_show'),
                  icon: const Icon(Icons.person_off, size: 16, color: Color(0xFFF87171)),
                  tooltip: 'No-Show',
                  style: IconButton.styleFrom(
                    backgroundColor: AppTheme.accentRose.withValues(alpha: 0.1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ] else ...[
                const Spacer(),
                const Text(
                  '🔒 Turno Finalizado',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'confirmed':
        return const Color(0xFF34D399);
      case 'pending':
        return AppTheme.goldPrimary;
      case 'completed':
        return const Color(0xFF60A5FA);
      case 'cancelled':
        return Colors.grey;
      case 'no_show':
      default:
        return AppTheme.accentRose;
    }
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: const Column(
        children: [
          Icon(Icons.calendar_today, size: 36, color: AppTheme.textMuted),
          SizedBox(height: 10),
          Text(
            'Sin citas para este día',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
          ),
          SizedBox(height: 4),
          Text(
            'Disponibilidad 100% libre para reservas en WhatsApp',
            style: TextStyle(color: AppTheme.goldPrimary, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
