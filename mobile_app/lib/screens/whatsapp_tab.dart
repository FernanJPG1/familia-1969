import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../models/whatsapp_message_model.dart';
import '../providers/barber_provider.dart';

class WhatsAppTab extends StatefulWidget {
  const WhatsAppTab({super.key});

  @override
  State<WhatsAppTab> createState() => _WhatsAppTabState();
}

class _WhatsAppTabState extends State<WhatsAppTab> {
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BarberProvider>();
    final messages = provider.chatMessages;
    final settings = provider.settings;

    _scrollToBottom();

    return Container(
      color: const Color(0xFF0B141A),
      child: Column(
        children: [
          // 1. WhatsApp Top Bar con Selector de Cliente
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            color: const Color(0xFF202C33),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: const BoxDecoration(
                            gradient: AppTheme.goldGradient,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.content_cut, color: Colors.black, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              settings?.shopName ?? 'Mateo Silva Studio',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                            const Row(
                              children: [
                                Icon(Icons.check_circle, color: Color(0xFF34D399), size: 10),
                                SizedBox(width: 4),
                                Text(
                                  'Asistente Personal Activo 24/7',
                                  style: TextStyle(color: Color(0xFF34D399), fontSize: 10),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      onPressed: () {
                        provider.sendWhatsAppText('reiniciar');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.2),
                        foregroundColor: const Color(0xFF34D399),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.restart_alt, size: 14),
                      label: const Text('Reiniciar', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Selector de Cliente Simulado
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.person_pin, color: AppTheme.goldPrimary, size: 14),
                      const SizedBox(width: 6),
                      const Text(
                        'Simular cliente:',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: provider.simulatedPhone,
                            dropdownColor: const Color(0xFF202C33),
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                            isExpanded: true,
                            items: const [
                              DropdownMenuItem(
                                value: '573001234567',
                                child: Text('David Rincón (Cliente Frecuente)'),
                              ),
                              DropdownMenuItem(
                                value: '573199998877',
                                child: Text('Nuevo Cliente Ocasional'),
                              ),
                            ],
                            onChanged: (val) {
                              if (val != null) provider.setSimulatedPhone(val);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 2. Chat Feed
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.all(14),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final msg = messages[index];
                return _buildChatBubble(context, provider, msg);
              },
            ),
          ),

          // Loading indicator
          if (provider.isChatLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 4),
              child: SizedBox(
                height: 16,
                width: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00A884)),
              ),
            ),

          // 3. Sugerencias Rápidas de NLU
          Container(
            color: const Color(0xFF111B21),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildQuickChip('📍 ¿Dónde queda?', provider),
                _buildQuickChip('✂️ ¿Qué precios tienen?', provider),
                _buildQuickChip('🕒 ¿A qué hora atienden?', provider),
                _buildQuickChip('⚡ ¿Tienes espacio hoy en la tarde?', provider),
                _buildQuickChip('💬 Quiero hablar con Mateo', provider),
              ],
            ),
          ),

          // 4. Barra de Input
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            color: const Color(0xFF202C33),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2A3942),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: TextField(
                      controller: _inputCtrl,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: const InputDecoration(
                        hintText: 'Pregunta algo o escribe tu corte...',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        filled: false,
                        contentPadding: EdgeInsets.symmetric(vertical: 10),
                      ),
                      onSubmitted: (_) => _sendText(provider),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: () => _sendText(provider),
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xFF00A884),
                    shape: const CircleBorder(),
                  ),
                  icon: const Icon(Icons.send, color: Colors.white, size: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _sendText(BarberProvider provider) {
    final text = _inputCtrl.text.trim();
    if (text.isNotEmpty) {
      provider.sendWhatsAppText(text);
      _inputCtrl.clear();
      _scrollToBottom();
    }
  }

  Widget _buildQuickChip(String text, BarberProvider provider) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ActionChip(
        label: Text(text, style: const TextStyle(color: Colors.white, fontSize: 10)),
        backgroundColor: Colors.white.withValues(alpha: 0.08),
        side: const BorderSide(color: AppTheme.borderSubtle),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        onPressed: () => provider.sendWhatsAppText(text),
      ),
    );
  }

  Widget _buildChatBubble(BuildContext context, BarberProvider provider, WhatsAppChatMessage msg) {
    return Align(
      alignment: msg.isOutgoing ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.82,
        ),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: msg.isOutgoing ? const Color(0xFF005C4B) : const Color(0xFF202C33),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (msg.header != null) ...[
              Text(
                msg.header!,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                  color: AppTheme.goldPrimary,
                ),
              ),
              const SizedBox(height: 6),
            ],
            Text(
              msg.text,
              style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.35),
            ),
            if (msg.footer != null) ...[
              const SizedBox(height: 6),
              Text(
                msg.footer!,
                style: const TextStyle(color: Colors.white54, fontSize: 10),
              ),
            ],

            // Botones interactivos
            if (msg.buttons != null && msg.buttons!.isNotEmpty) ...[
              const SizedBox(height: 10),
              ...msg.buttons!.map(
                (b) => Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 6),
                  child: OutlinedButton(
                    onPressed: () => provider.sendWhatsAppButtonClick(b.id, b.title),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF53BDEB),
                      side: const BorderSide(color: Color(0xFF53BDEB)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    child: Text(
                      b.title,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                  ),
                ),
              ),
            ],

            // Secciones y filas interactivas
            if (msg.sections != null && msg.sections!.isNotEmpty) ...[
              const SizedBox(height: 10),
              ...msg.sections!.expand(
                (sec) => sec.rows.map(
                  (row) => Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 6),
                    child: OutlinedButton(
                      onPressed: () => provider.sendWhatsAppListClick(row.id, row.title),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF53BDEB),
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.all(8),
                        alignment: Alignment.centerLeft,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            row.title,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                          ),
                          if (row.description != null)
                            Text(
                              row.description!,
                              style: const TextStyle(color: Colors.white70, fontSize: 10),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
