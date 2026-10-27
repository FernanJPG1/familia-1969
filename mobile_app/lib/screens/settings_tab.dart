import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/settings_model.dart';
import '../providers/barber_provider.dart';

class SettingsTab extends StatefulWidget {
  const SettingsTab({super.key});

  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  final _shopNameCtrl = TextEditingController();
  final _barberNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _parkingCtrl = TextEditingController();

  final _workStartCtrl = TextEditingController();
  final _workEndCtrl = TextEditingController();

  final _lunchStartCtrl = TextEditingController();
  final _lunchEndCtrl = TextEditingController();

  final _greetingCtrl = TextEditingController();

  bool _lunchEnabled = true;
  bool _autoBotEnabled = true;
  int _slotBufferMinutes = 10;
  List<int> _activeDays = [1, 2, 3, 4, 5, 6];

  bool _isSaving = false;
  bool _isInitialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      final settings = context.watch<BarberProvider>().settings;
      if (settings != null) {
        _populateFields(settings);
        _isInitialized = true;
      }
    }
  }

  void _populateFields(BarberSettings s) {
    _shopNameCtrl.text = s.shopName;
    _barberNameCtrl.text = s.barberName;
    _phoneCtrl.text = s.phone;
    _addressCtrl.text = s.address;
    _parkingCtrl.text = s.parkingInfo;

    _workStartCtrl.text = s.workStartTime;
    _workEndCtrl.text = s.workEndTime;

    _lunchStartCtrl.text = s.lunchStartTime;
    _lunchEndCtrl.text = s.lunchEndTime;

    _greetingCtrl.text = s.customGreeting;

    _lunchEnabled = s.lunchEnabled;
    _autoBotEnabled = s.autoBotEnabled;
    _slotBufferMinutes = s.slotBufferMinutes;
    _activeDays = List.from(s.activeDays);
  }

  void _toggleDay(int day) {
    setState(() {
      if (_activeDays.contains(day)) {
        if (_activeDays.length > 1) {
          _activeDays.remove(day);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('⚠️ Debes mantener al menos 1 día activo')),
          );
        }
      } else {
        _activeDays.add(day);
      }
    });
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);

    final payload = BarberSettings(
      shopName: _shopNameCtrl.text.trim(),
      barberName: _barberNameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      address: _addressCtrl.text.trim(),
      parkingInfo: _parkingCtrl.text.trim(),
      workStartTime: _workStartCtrl.text.trim(),
      workEndTime: _workEndCtrl.text.trim(),
      lunchStartTime: _lunchStartCtrl.text.trim(),
      lunchEndTime: _lunchEndCtrl.text.trim(),
      lunchEnabled: _lunchEnabled,
      activeDays: _activeDays,
      slotBufferMinutes: _slotBufferMinutes,
      autoBotEnabled: _autoBotEnabled,
      customGreeting: _greetingCtrl.text.trim(),
    );

    final ok = await context.read<BarberProvider>().saveSettings(payload);

    if (mounted) {
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ok
              ? '✓ ¡Configuración guardada y sincronizada!'
              : '❌ Error guardando configuración'),
          backgroundColor: const Color(0xFF1E293B),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final daysNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 90),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Configuración Total',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Controla todos los aspectos de tu negocio y bot',
                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
              ],
            ),
            ElevatedButton.icon(
              onPressed: _isSaving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.goldPrimary,
                foregroundColor: const Color(0xFF080C14),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: _isSaving
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                    )
                  : const Icon(Icons.save, size: 16),
              label: const Text('Guardar', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // 1. MI NEGOCIO & PERFIL
        _buildSectionCard(
          icon: Icons.store,
          title: 'Mi Negocio & Perfil',
          subtitle: 'Información visible para los clientes',
          children: [
            _buildTextField(
              controller: _shopNameCtrl,
              label: 'NOMBRE DEL ESTUDIO / BARBERÍA',
              hint: 'Ej: Mateo Silva Studio • Barbershop',
            ),
            const SizedBox(height: 10),
            _buildTextField(
              controller: _barberNameCtrl,
              label: 'NOMBRE DEL BARBERO (PROPIETARIO)',
              hint: 'Ej: Mateo Silva (Master Barber)',
            ),
            const SizedBox(height: 10),
            _buildTextField(
              controller: _phoneCtrl,
              label: 'TELÉFONO / WHATSAPP DE CONTACTO',
              hint: 'Ej: +57 311 111 2233',
            ),
            const SizedBox(height: 10),
            _buildTextField(
              controller: _addressCtrl,
              label: 'DIRECCIÓN FÍSICA',
              hint: 'Ej: Carrera 15 # 85-30, Zona Rosa, Bogotá',
            ),
            const SizedBox(height: 10),
            _buildTextField(
              controller: _parkingCtrl,
              label: 'CONVENIO O INFO DE PARQUEADERO',
              hint: 'Ej: Convenio privado frente al estudio',
            ),
          ],
        ),
        const SizedBox(height: 14),

        // 2. JORNADA & HORARIOS
        _buildSectionCard(
          icon: Icons.access_time,
          title: 'Jornada & Horarios',
          subtitle: 'Horario en que el bot agenda tus citas',
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _workStartCtrl,
                    label: 'HORA APERTURA',
                    hint: '09:00',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildTextField(
                    controller: _workEndCtrl,
                    label: 'HORA CIERRE',
                    hint: '19:00',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'DÍAS DE ATENCIÓN ACTIVOS',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(7, (i) {
                final dayNum = i + 1;
                final isSelected = _activeDays.contains(dayNum);
                return GestureDetector(
                  onTap: () => _toggleDay(dayNum),
                  child: Container(
                    width: 40,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      gradient: isSelected ? AppTheme.goldGradient : null,
                      color: isSelected ? null : Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected ? Colors.transparent : AppTheme.borderSubtle,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        daysNames[i],
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? const Color(0xFF080C14) : AppTheme.textMuted,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // 3. RECESO DE ALMUERZO
        _buildSectionCard(
          icon: Icons.restaurant,
          title: 'Receso de Almuerzo',
          subtitle: 'Bloquea turnos automáticamente a mediodía',
          trailing: Switch(
            value: _lunchEnabled,
            activeThumbColor: AppTheme.goldPrimary,
            onChanged: (val) => setState(() => _lunchEnabled = val),
          ),
          children: [
            if (_lunchEnabled)
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _lunchStartCtrl,
                      label: 'INICIO ALMUERZO',
                      hint: '13:00',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildTextField(
                      controller: _lunchEndCtrl,
                      label: 'FIN ALMUERZO',
                      hint: '14:00',
                    ),
                  ),
                ],
              )
            else
              const Text(
                'Receso desactivado: Trabajarás sin pausa de almuerzo.',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
          ],
        ),
        const SizedBox(height: 14),

        // 4. BUFFER ENTRE CORTES
        _buildSectionCard(
          icon: Icons.hourglass_empty,
          title: 'Buffer entre Cortes',
          subtitle: 'Minutos de descanso o desinfección entre cada cliente',
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [0, 5, 10, 15, 20].map((mins) {
                final isSelected = _slotBufferMinutes == mins;
                return GestureDetector(
                  onTap: () => setState(() => _slotBufferMinutes = mins),
                  child: Container(
                    width: 54,
                    padding: const EdgeInsets.symmetric(vertical: 9),
                    decoration: BoxDecoration(
                      gradient: isSelected ? AppTheme.goldGradient : null,
                      color: isSelected ? null : Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected ? Colors.transparent : AppTheme.borderSubtle,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '${mins}m',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? const Color(0xFF080C14) : AppTheme.textMuted,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 8),
            Text(
              _getBufferDescription(_slotBufferMinutes),
              style: const TextStyle(color: AppTheme.goldPrimary, fontSize: 11),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // 5. WHATSAPP BOT & SALUDO
        _buildSectionCard(
          icon: Icons.chat,
          title: 'Bot Automático de WhatsApp',
          subtitle: 'Modo 24/7 de atención y reservas',
          trailing: Switch(
            value: _autoBotEnabled,
            activeThumbColor: AppTheme.goldPrimary,
            onChanged: (val) => setState(() => _autoBotEnabled = val),
          ),
          children: [
            _buildTextField(
              controller: _greetingCtrl,
              label: 'MENSAJE DE SALUDO PARA NUEVOS CLIENTES',
              hint: 'Escribe tu mensaje de bienvenida personalizado...',
              maxLines: 3,
            ),
            const SizedBox(height: 4),
            const Text(
              'Este saludo lo recibirán los clientes cuando te escriban por primera vez al WhatsApp.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 10),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // BOTÓN GUARDAR INFERIOR
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: _isSaving ? null : _save,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldPrimary,
              foregroundColor: const Color(0xFF080C14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            icon: _isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                  )
                : const Icon(Icons.check, size: 18),
            label: const Text(
              'Guardar Toda la Configuración',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppTheme.goldPrimary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppTheme.goldPrimary, size: 16),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppTheme.textMuted,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          ),
        ),
      ],
    );
  }

  String _getBufferDescription(int mins) {
    switch (mins) {
      case 0:
        return '⚡ Sin buffer: Turnos continuos sin descanso intermedio.';
      case 5:
        return '⚡ Buffer rápido de 5 min para limpieza veloz.';
      case 10:
        return '⚡ Recomendado: 10 min de preparación entre turnos.';
      case 15:
        return '⚡ 15 min de descanso o esterilización de herramientas.';
      case 20:
      default:
        return '⚡ 20 min holgados para máxima puntualidad.';
    }
  }
}
