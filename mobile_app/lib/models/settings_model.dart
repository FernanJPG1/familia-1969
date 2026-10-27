class BarberSettings {
  final String shopName;
  final String barberName;
  final String phone;
  final String address;
  final String parkingInfo;
  final int slotBufferMinutes;
  final String workStartTime;
  final String workEndTime;
  final String lunchStartTime;
  final String lunchEndTime;
  final bool lunchEnabled;
  final List<int> activeDays;
  final String customGreeting;
  final bool autoBotEnabled;

  BarberSettings({
    required this.shopName,
    required this.barberName,
    required this.phone,
    required this.address,
    required this.parkingInfo,
    required this.slotBufferMinutes,
    required this.workStartTime,
    required this.workEndTime,
    required this.lunchStartTime,
    required this.lunchEndTime,
    required this.lunchEnabled,
    required this.activeDays,
    required this.customGreeting,
    required this.autoBotEnabled,
  });

  factory BarberSettings.fromJson(Map<String, dynamic> json) {
    return BarberSettings(
      shopName: json['shopName'] ?? 'Mateo Silva Studio',
      barberName: json['barberName'] ?? 'Mateo Silva',
      phone: json['phone'] ?? '+57 311 111 2233',
      address: json['address'] ?? '',
      parkingInfo: json['parkingInfo'] ?? '',
      slotBufferMinutes: json['slotBufferMinutes'] is int
          ? json['slotBufferMinutes']
          : int.tryParse(json['slotBufferMinutes']?.toString() ?? '10') ?? 10,
      workStartTime: json['workStartTime'] ?? '09:00',
      workEndTime: json['workEndTime'] ?? '19:00',
      lunchStartTime: json['lunchStartTime'] ?? '13:00',
      lunchEndTime: json['lunchEndTime'] ?? '14:00',
      lunchEnabled: json['lunchEnabled'] == true,
      activeDays: (json['activeDays'] as List<dynamic>?)
              ?.map((e) => int.parse(e.toString()))
              .toList() ??
          [1, 2, 3, 4, 5, 6],
      customGreeting: json['customGreeting'] ?? '',
      autoBotEnabled: json['autoBotEnabled'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'shopName': shopName,
      'barberName': barberName,
      'phone': phone,
      'address': address,
      'parkingInfo': parkingInfo,
      'slotBufferMinutes': slotBufferMinutes,
      'workStartTime': workStartTime,
      'workEndTime': workEndTime,
      'lunchStartTime': lunchStartTime,
      'lunchEndTime': lunchEndTime,
      'lunchEnabled': lunchEnabled,
      'activeDays': activeDays,
      'customGreeting': customGreeting,
      'autoBotEnabled': autoBotEnabled,
    };
  }

  BarberSettings copyWith({
    String? shopName,
    String? barberName,
    String? phone,
    String? address,
    String? parkingInfo,
    int? slotBufferMinutes,
    String? workStartTime,
    String? workEndTime,
    String? lunchStartTime,
    String? lunchEndTime,
    bool? lunchEnabled,
    List<int>? activeDays,
    String? customGreeting,
    bool? autoBotEnabled,
  }) {
    return BarberSettings(
      shopName: shopName ?? this.shopName,
      barberName: barberName ?? this.barberName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      parkingInfo: parkingInfo ?? this.parkingInfo,
      slotBufferMinutes: slotBufferMinutes ?? this.slotBufferMinutes,
      workStartTime: workStartTime ?? this.workStartTime,
      workEndTime: workEndTime ?? this.workEndTime,
      lunchStartTime: lunchStartTime ?? this.lunchStartTime,
      lunchEndTime: lunchEndTime ?? this.lunchEndTime,
      lunchEnabled: lunchEnabled ?? this.lunchEnabled,
      activeDays: activeDays ?? this.activeDays,
      customGreeting: customGreeting ?? this.customGreeting,
      autoBotEnabled: autoBotEnabled ?? this.autoBotEnabled,
    );
  }
}
