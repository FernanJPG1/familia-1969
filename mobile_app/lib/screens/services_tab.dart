import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../providers/barber_provider.dart';

class ServicesTab extends StatelessWidget {
  const ServicesTab({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BarberProvider>();
    final services = provider.services;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppTheme.goldPrimary,
        backgroundColor: AppTheme.surface,
        onRefresh: () => provider.fetchServices(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 90),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Mis Tipos de Corte',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Los clientes pueden reservar estos cortes vía WhatsApp',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => _openAddServiceSheet(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.goldPrimary,
                    foregroundColor: const Color(0xFF080C14),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Añadir Corte', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                ),
              ],
            ),
            const SizedBox(height: 14),

            if (services.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: const Center(
                  child: Text(
                    'No tienes tipos de corte activos.\nPresiona "+ Añadir Corte" para crear el primero.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                  ),
                ),
              )
            else
              ...services.map((s) => _buildServiceCard(context, provider, s)),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceCard(BuildContext context, BarberProvider provider, dynamic service) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.schedule, size: 12, color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      '${service.durationMinutes} minutos (+buffer automático)',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Row(
            children: [
              Text(
                AppConstants.formatPrice(service.price),
                style: const TextStyle(
                  color: AppTheme.goldPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
              const SizedBox(width: 10),
              IconButton(
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: AppTheme.surface,
                      title: const Text('Eliminar Corte', style: TextStyle(color: Colors.white)),
                      content: Text(
                        '¿Deseas retirar "${service.name}" del catálogo de reservas de WhatsApp?',
                        style: const TextStyle(color: AppTheme.textMuted),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Cancelar', style: TextStyle(color: Colors.white70)),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentRose),
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Eliminar', style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await provider.removeService(service.id);
                  }
                },
                icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFFF87171)),
                tooltip: 'Eliminar',
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openAddServiceSheet(BuildContext context) {
    final nameCtrl = TextEditingController();
    final durationCtrl = TextEditingController(text: '40');
    final priceCtrl = TextEditingController(text: '35000');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF111A2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
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
                '+ Añadir Tipo de Corte',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Se publicará de inmediato para los clientes en WhatsApp',
                style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'NOMBRE DEL CORTE O RITUAL *',
                  hintText: 'Ej: Taper Fade con Diseño o Barba Spa',
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: durationCtrl,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'DURACIÓN (MIN) *',
                        hintText: '40',
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: priceCtrl,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'PRECIO (\$) *',
                        hintText: '35000',
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
                    final dur = int.tryParse(durationCtrl.text) ?? 35;
                    final price = int.tryParse(priceCtrl.text) ?? 35000;

                    if (name.isNotEmpty) {
                      final provider = context.read<BarberProvider>();
                      final ok = await provider.addService(name, dur, price);
                      if (ok && ctx.mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('✂️ ¡Nuevo corte publicado en WhatsApp!'),
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
                  child: const Text('Guardar y Publicar', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
