class ServiceModel {
  final String id;
  final String name;
  final int durationMinutes;
  final int price;
  final bool isActive;
  final String description;
  final String category;
  final String? badge;

  ServiceModel({
    required this.id,
    required this.name,
    required this.durationMinutes,
    required this.price,
    this.isActive = true,
    this.description = '',
    this.category = 'Corte',
    this.badge,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      durationMinutes: json['durationMinutes'] is int
          ? json['durationMinutes']
          : int.tryParse(json['durationMinutes']?.toString() ?? '35') ?? 35,
      price: json['price'] is int
          ? json['price']
          : int.tryParse(json['price']?.toString() ?? '35000') ?? 35000,
      isActive: json['isActive'] ?? true,
      description: json['description'] ?? '',
      category: json['category'] ?? 'Corte',
      badge: json['badge'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'durationMinutes': durationMinutes,
      'price': price,
      'description': description,
      'category': category,
      if (badge != null) 'badge': badge,
    };
  }
}
