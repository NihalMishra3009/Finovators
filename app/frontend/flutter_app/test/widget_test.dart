import 'package:flutter_test/flutter_test.dart';

import 'package:gigbit_flutter/app.dart';

void main() {
  testWidgets('GigBit app renders auth shell', (WidgetTester tester) async {
    await tester.pumpWidget(const GigBitApp());
    await tester.pumpAndSettle();

    expect(find.text('GigBit'), findsWidgets);
  });
}
