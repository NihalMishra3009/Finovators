import 'dart:io';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class DeviceNotificationService {
  DeviceNotificationService._();

  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: android);
    await _plugin.initialize(settings);

    if (Platform.isAndroid) {
      await _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    }

    _initialized = true;
  }

  static Future<void> show({
    required int id,
    required String title,
    required String body,
  }) async {
    await init();
    const android = AndroidNotificationDetails(
      'gigbit_plan_expiry',
      'Plan Expiry',
      channelDescription: 'GigBit plan expiry and account updates',
      importance: Importance.max,
      priority: Priority.high,
    );
    const details = NotificationDetails(android: android);
    await _plugin.show(id, title, body, details);
  }
}
