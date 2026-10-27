class WhatsAppButton {
  final String id;
  final String title;

  WhatsAppButton({required this.id, required this.title});

  factory WhatsAppButton.fromJson(Map<String, dynamic> json) {
    return WhatsAppButton(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
    );
  }
}

class WhatsAppListRow {
  final String id;
  final String title;
  final String? description;

  WhatsAppListRow({required this.id, required this.title, this.description});

  factory WhatsAppListRow.fromJson(Map<String, dynamic> json) {
    return WhatsAppListRow(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
    );
  }
}

class WhatsAppSection {
  final String title;
  final List<WhatsAppListRow> rows;

  WhatsAppSection({required this.title, required this.rows});

  factory WhatsAppSection.fromJson(Map<String, dynamic> json) {
    return WhatsAppSection(
      title: json['title'] ?? '',
      rows: (json['rows'] as List<dynamic>?)
              ?.map((e) => WhatsAppListRow.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class WhatsAppChatMessage {
  final String text;
  final bool isOutgoing;
  final String? header;
  final String? footer;
  final List<WhatsAppButton>? buttons;
  final List<WhatsAppSection>? sections;
  final DateTime timestamp;

  WhatsAppChatMessage({
    required this.text,
    required this.isOutgoing,
    this.header,
    this.footer,
    this.buttons,
    this.sections,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory WhatsAppChatMessage.fromApiResponse(Map<String, dynamic> json) {
    return WhatsAppChatMessage(
      text: json['body'] ?? '',
      isOutgoing: false,
      header: json['header'],
      footer: json['footer'],
      buttons: (json['buttons'] as List<dynamic>?)
          ?.map((e) => WhatsAppButton.fromJson(e))
          .toList(),
      sections: (json['sections'] as List<dynamic>?)
          ?.map((e) => WhatsAppSection.fromJson(e))
          .toList(),
    );
  }
}
