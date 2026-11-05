import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants.dart';
import '../models/appointment_model.dart';
import '../models/service_model.dart';
import '../models/settings_model.dart';
import '../models/whatsapp_message_model.dart';

class ApiService {
  final String baseUrl;

  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? AppConstants.baseUrl;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  // 1. DASHBOARD
  Future<Map<String, dynamic>> getDashboard(String date) async {
    final uri = Uri.parse('$baseUrl/api/dashboard/today?date=$date');
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final apps = (data['appointments'] as List<dynamic>?)
              ?.map((e) => AppointmentModel.fromJson(e))
              .toList() ??
          [];
      final metrics = DashboardMetrics.fromJson(data['metrics'] ?? {});
      final settings = data['settings'] != null
          ? BarberSettings.fromJson(data['settings'])
          : null;

      return {
        'appointments': apps,
        'metrics': metrics,
        'settings': settings,
      };
    } else {
      throw Exception('Error cargando el dashboard: ${response.statusCode}');
    }
  }

  // 2. CORTES Y SERVICIOS
  Future<List<ServiceModel>> getServices() async {
    final uri = Uri.parse('$baseUrl/api/services');
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['services'] as List<dynamic>?)
              ?.map((e) => ServiceModel.fromJson(e))
              .toList() ??
          [];
    } else {
      throw Exception('Error cargando catálogo');
    }
  }

  Future<ServiceModel> createService(
    String name,
    int durationMinutes,
    int price, {
    String description = '',
    String category = 'Corte',
    String? badge,
  }) async {
    final uri = Uri.parse('$baseUrl/api/services');
    final response = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'durationMinutes': durationMinutes,
        'price': price,
        'description': description,
        'category': category,
        if (badge != null && badge.isNotEmpty) 'badge': badge,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return ServiceModel.fromJson(data['service']);
    } else {
      throw Exception('Error creando corte');
    }
  }

  Future<bool> deleteService(String id) async {
    final uri = Uri.parse('$baseUrl/api/services/$id');
    final response = await http.delete(uri, headers: _headers);
    return response.statusCode == 200;
  }

  // 3. CONFIGURACIÓN TOTAL
  Future<BarberSettings> getSettings() async {
    final uri = Uri.parse('$baseUrl/api/settings');
    final response = await http.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return BarberSettings.fromJson(data['settings']);
    } else {
      throw Exception('Error cargando configuración');
    }
  }

  Future<BarberSettings> updateSettings(BarberSettings settings) async {
    final uri = Uri.parse('$baseUrl/api/settings');
    final response = await http.put(
      uri,
      headers: _headers,
      body: jsonEncode(settings.toJson()),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return BarberSettings.fromJson(data['settings']);
    } else {
      throw Exception('Error guardando configuración');
    }
  }

  // 4. CITAS
  Future<bool> updateAppointmentStatus(String id, String status) async {
    final uri = Uri.parse('$baseUrl/api/appointments/$id/status');
    final response = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode({'status': status}),
    );
    return response.statusCode == 200;
  }

  Future<bool> triggerReminder(String id) async {
    final uri = Uri.parse('$baseUrl/api/appointments/$id/trigger-reminder');
    final response = await http.post(uri, headers: _headers);
    return response.statusCode == 200;
  }

  Future<bool> createAppointment({
    required String serviceId,
    required String clientName,
    required String clientPhone,
    required String startTimeISO,
  }) async {
    final uri = Uri.parse('$baseUrl/api/appointments');
    final response = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode({
        'serviceId': serviceId,
        'clientName': clientName,
        'clientPhone': clientPhone,
        'startTimeISO': startTimeISO,
      }),
    );
    return response.statusCode == 201;
  }

  // 5. SIMULADOR WHATSAPP
  Future<WhatsAppChatMessage> simulateWhatsApp({
    required String from,
    String? text,
    String? buttonId,
    String? listId,
    String type = 'text',
  }) async {
    final uri = Uri.parse('$baseUrl/api/whatsapp/simulate');
    final response = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode({
        'from': from,
        'type': type,
        'text': text,
        'buttonId': buttonId,
        'listId': listId,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return WhatsAppChatMessage.fromApiResponse(data);
    } else {
      throw Exception('Error en respuesta de WhatsApp');
    }
  }
}
