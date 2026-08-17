import 'package:flutter_test/flutter_test.dart';
import 'package:lawyer_diary_bd/core/config/api_config.dart';

void main() {
  test('ApiConfig.kProdApiBase is https', () {
    expect(ApiConfig.kProdApiBase.startsWith('https://'), isTrue);
  });
}
