import 'package:flutter/material.dart';
import '../models/appointment_model.dart';
import '../models/service_model.dart';
import '../models/settings_model.dart';
import '../models/whatsapp_message_model.dart';
import '../services/api_service.dart';

class BarberProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  DateTime _selectedDate = DateTime.now();
  bool _isLoading = false;
  String? _errorMessage;

  List<AppointmentModel> _appointments = [];
  DashboardMetrics? _metrics;
  List<ServiceModel> _services = [];
  BarberSettings? _settings;

  // WhatsApp Simulator State
  String _simulatedPhone = '573001234567'; // Default: David Rincón
  final List<WhatsAppChatMessage> _chatMessages = [];
  bool _isChatLoading = false;

  // Getters
  DateTime get selectedDate => _selectedDate;
  String get selectedDateFormatted => _selectedDate.toIso8601String().split('T')[0];
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<AppointmentModel> get appointments => _appointments;
  DashboardMetrics? get metrics => _metrics;
  List<ServiceModel> get services => _services;
  BarberSettings? get settings => _settings;

  String get simulatedPhone => _simulatedPhone;
  List<WhatsAppChatMessage> get chatMessages => _chatMessages;
  bool get isChatLoading => _isChatLoading;

  AppointmentModel? get nextUpcomingAppointment {
    final active = _appointments.where((a) => a.status == 'confirmed' || a.status == 'pending').toList();
    if (active.isEmpty) return null;
    active.sort((a, b) => a.startTime.compareTo(b.startTime));
    return active.first;
  }

  BarberProvider() {
    init();
  }

  Future<void> init() async {
    await fetchAll();
    await initWhatsAppChat();
  }

  Future<void> fetchAll() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _api.getDashboard(selectedDateFormatted),
        _api.getServices(),
        _api.getSettings(),
      ]);

      final dash = results[0] as Map<String, dynamic>;
      _appointments = dash['appointments'] as List<AppointmentModel>;
      _metrics = dash['metrics'] as DashboardMetrics?;
      _services = results[1] as List<ServiceModel>;
      _settings = results[2] as BarberSettings;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void changeDate(DateTime date) {
    _selectedDate = date;
    fetchDashboard();
  }

  Future<void> fetchDashboard() async {
    try {
      final dash = await _api.getDashboard(selectedDateFormatted);
      _appointments = dash['appointments'] as List<AppointmentModel>;
      _metrics = dash['metrics'] as DashboardMetrics?;
      if (dash['settings'] != null) {
        _settings = dash['settings'] as BarberSettings;
      }
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateStatus(String id, String status) async {
    final success = await _api.updateAppointmentStatus(id, status);
    if (success) {
      await fetchDashboard();
    }
  }

  Future<void> sendReminder(String id) async {
    final success = await _api.triggerReminder(id);
    if (success) {
      await fetchDashboard();
    }
  }

  Future<bool> createManualAppointment({
    required String serviceId,
    required String clientName,
    required String clientPhone,
    required String timeStr,
  }) async {
    try {
      final startIso = '${selectedDateFormatted}T$timeStr:00.000Z';
      final success = await _api.createAppointment(
        serviceId: serviceId,
        clientName: clientName,
        clientPhone: clientPhone,
        startTimeISO: startIso,
      );
      if (success) {
        await fetchDashboard();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // SERVICES CRUD
  Future<void> fetchServices() async {
    try {
      _services = await _api.getServices();
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
    }
  }

  Future<bool> addService(
    String name,
    int durationMinutes,
    int price, {
    String description = '',
    String category = 'Corte',
    String? badge,
  }) async {
    try {
      final newSrv = await _api.createService(
        name,
        durationMinutes,
        price,
        description: description,
        category: category,
        badge: badge,
      );
      _services.add(newSrv);
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> removeService(String id) async {
    try {
      final success = await _api.deleteService(id);
      if (success) {
        _services.removeWhere((s) => s.id == id);
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // SETTINGS
  Future<bool> saveSettings(BarberSettings newSettings) async {
    try {
      _settings = await _api.updateSettings(newSettings);
      await fetchDashboard();
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  // WHATSAPP CHAT
  Future<void> setSimulatedPhone(String phone) async {
    _simulatedPhone = phone;
    _chatMessages.clear();
    notifyListeners();
    await sendWhatsAppText('hola');
  }

  Future<void> initWhatsAppChat() async {
    if (_chatMessages.isEmpty) {
      await sendWhatsAppText('hola');
    }
  }

  Future<void> sendWhatsAppText(String text) async {
    if (text.trim().isEmpty) return;

    _chatMessages.add(WhatsAppChatMessage(text: text, isOutgoing: true));
    _isChatLoading = true;
    notifyListeners();

    try {
      final reply = await _api.simulateWhatsApp(
        from: _simulatedPhone,
        text: text,
      );
      _chatMessages.add(reply);
      await fetchDashboard();
    } catch (e) {
      _chatMessages.add(WhatsAppChatMessage(
        text: 'Error de red en el bot de WhatsApp: $e',
        isOutgoing: false,
      ));
    } finally {
      _isChatLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendWhatsAppButtonClick(String buttonId, String title) async {
    _chatMessages.add(WhatsAppChatMessage(text: title, isOutgoing: true));
    _isChatLoading = true;
    notifyListeners();

    try {
      final reply = await _api.simulateWhatsApp(
        from: _simulatedPhone,
        type: 'interactive_button',
        buttonId: buttonId,
      );
      _chatMessages.add(reply);
      await fetchDashboard();
    } catch (e) {
      _chatMessages.add(WhatsAppChatMessage(
        text: 'Error: $e',
        isOutgoing: false,
      ));
    } finally {
      _isChatLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendWhatsAppListClick(String listId, String title) async {
    _chatMessages.add(WhatsAppChatMessage(text: title, isOutgoing: true));
    _isChatLoading = true;
    notifyListeners();

    try {
      final reply = await _api.simulateWhatsApp(
        from: _simulatedPhone,
        type: 'interactive_list',
        listId: listId,
      );
      _chatMessages.add(reply);
      await fetchDashboard();
    } catch (e) {
      _chatMessages.add(WhatsAppChatMessage(
        text: 'Error: $e',
        isOutgoing: false,
      ));
    } finally {
      _isChatLoading = false;
      notifyListeners();
    }
  }
}
