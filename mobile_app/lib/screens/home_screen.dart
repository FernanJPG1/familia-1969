import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/barber_provider.dart';
import 'agenda_tab.dart';
import 'earnings_tab.dart';
import 'services_tab.dart';
import 'settings_tab.dart';
import 'whatsapp_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = const [
    AgendaTab(),
    ServicesTab(),
    WhatsAppTab(),
    EarningsTab(),
    SettingsTab(),
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BarberProvider>();
    final settings = provider.settings;
    final barberName = settings?.barberName ?? 'Mateo Silva';
    final shopName = settings?.shopName ?? 'Mateo Silva Studio';

    // Initials
    final nameParts = barberName.trim().split(' ');
    final initials = (nameParts.isNotEmpty ? nameParts[0][0] : 'M') +
        (nameParts.length > 1 ? nameParts[1][0] : 'S');

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: AppBar(
          backgroundColor: AppTheme.background,
          elevation: 0,
          titleSpacing: 16,
          title: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(
                  gradient: AppTheme.goldGradient,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    initials.toUpperCase(),
                    style: const TextStyle(
                      color: Color(0xFF080C14),
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Text(
                        barberName,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.verified, color: AppTheme.goldPrimary, size: 13),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: AppTheme.accentEmerald,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Disponible • ${shopName.split('•')[0].trim()}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppTheme.accentEmerald,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline, color: AppTheme.goldPrimary),
              tooltip: 'Agendar Cita Rápida',
              onPressed: () => _openQuickBookingSheet(context),
            ),
            IconButton(
              icon: const Icon(Icons.settings_outlined, color: AppTheme.goldPrimary),
              tooltip: 'Ajustes',
              onPressed: () => setState(() => _currentIndex = 4),
            ),
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white70),
              tooltip: 'Refrescar',
              onPressed: () => provider.fetchAll(),
            ),
            const SizedBox(width: 6),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton(
              onPressed: () => _openQuickBookingSheet(context),
              backgroundColor: AppTheme.goldPrimary,
              elevation: 8,
              shape: const CircleBorder(),
              child: const Icon(Icons.add, color: Color(0xFF080C14), size: 26),
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today_outlined),
            activeIcon: Icon(Icons.calendar_today),
            label: 'Agenda',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.content_cut_outlined),
            activeIcon: Icon(Icons.content_cut),
            label: 'Cortes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble),
            label: 'Bot 24/7',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            activeIcon: Icon(Icons.account_balance_wallet),
            label: 'Ganancias',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.tune_outlined),
            activeIcon: Icon(Icons.tune),
            label: 'Ajustes',
          ),
        ],
      ),
    );
  }

  void _openQuickBookingSheet(BuildContext context) {
    final provider = context.read<BarberProvider>();
    final services = provider.services;

    if (services.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Crea al menos un corte primero en la pestaña Cortes')),
      );
      return;
    }

    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController(text: '573001234567');
    String selectedServiceId = services.first.id;
    final timeCtrl = TextEditingController(text: '10:00');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111A2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    '+ Agendar Cita Manual Rápida',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Se sincronizará en la agenda y bloqueará el slot en WhatsApp',
                    style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: nameCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'NOMBRE DEL CLIENTE *',
                      hintText: 'Ej: Santiago Restrepo',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: phoneCtrl,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'WHATSAPP TELÉFONO *',
                      hintText: 'Ej: 573001234567',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<String>(
                          initialValue: selectedServiceId,
                          dropdownColor: const Color(0xFF1E293B),
                          decoration: const InputDecoration(
                            labelText: 'TIPO DE CORTE',
                          ),
                          items: services.map((s) {
                            return DropdownMenuItem(
                              value: s.id,
                              child: Text(
                                '${s.name} (${s.durationMinutes}m)',
                                style: const TextStyle(color: Colors.white, fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setModalState(() => selectedServiceId = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: timeCtrl,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'HORA',
                            hintText: '10:00',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton(
                      onPressed: () async {
                        final name = nameCtrl.text.trim();
                        final phone = phoneCtrl.text.trim();
                        final time = timeCtrl.text.trim();

                        if (name.isNotEmpty && time.isNotEmpty) {
                          final ok = await provider.createManualAppointment(
                            serviceId: selectedServiceId,
                            clientName: name,
                            clientPhone: phone,
                            timeStr: time,
                          );
                          if (ok && ctx.mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('✓ Cita agendada con éxito'),
                                backgroundColor: Color(0xFF1E293B),
                              ),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.goldPrimary,
                        foregroundColor: const Color(0xFF080C14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Confirmar Turno', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
