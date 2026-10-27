class AppointmentModel {
  final String id;
  final String clientName;
  final String clientPhone;
  final int clientNoShows;
  final String serviceName;
  final int serviceDuration;
  final int totalPrice;
  final String status; // 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
  final DateTime startTime;
  final DateTime endTime;
  final String notes;

  AppointmentModel({
    required this.id,
    required this.clientName,
    required this.clientPhone,
    required this.clientNoShows,
    required this.serviceName,
    required this.serviceDuration,
    required this.totalPrice,
    required this.status,
    required this.startTime,
    required this.endTime,
    required this.notes,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] ?? '',
      clientName: json['clientName'] ?? 'Cliente Ocasional',
      clientPhone: json['clientPhone'] ?? '',
      clientNoShows: json['clientNoShows'] is int
          ? json['clientNoShows']
          : int.tryParse(json['clientNoShows']?.toString() ?? '0') ?? 0,
      serviceName: json['serviceName'] ?? 'Corte de Cabello',
      serviceDuration: json['serviceDuration'] is int
          ? json['serviceDuration']
          : int.tryParse(json['serviceDuration']?.toString() ?? '35') ?? 35,
      totalPrice: json['totalPrice'] is int
          ? json['totalPrice']
          : int.tryParse(json['totalPrice']?.toString() ?? '0') ?? 0,
      status: json['status'] ?? 'pending',
      startTime: DateTime.tryParse(json['startTime']?.toString() ?? '') ?? DateTime.now(),
      endTime: DateTime.tryParse(json['endTime']?.toString() ?? '') ?? DateTime.now(),
      notes: json['notes'] ?? '',
    );
  }
}

class DashboardMetrics {
  final int totalBookings;
  final int completedCount;
  final int noShowCount;
  final int totalRevenue;
  final int myEarnings;
  final int occupancyPercentage;

  DashboardMetrics({
    required this.totalBookings,
    required this.completedCount,
    required this.noShowCount,
    required this.totalRevenue,
    required this.myEarnings,
    required this.occupancyPercentage,
  });

  factory DashboardMetrics.fromJson(Map<String, dynamic> json) {
    return DashboardMetrics(
      totalBookings: json['totalBookings'] ?? 0,
      completedCount: json['completedCount'] ?? 0,
      noShowCount: json['noShowCount'] ?? 0,
      totalRevenue: json['totalRevenue'] ?? 0,
      myEarnings: json['myEarnings'] ?? 0,
      occupancyPercentage: json['occupancyPercentage'] ?? 0,
    );
  }
}
