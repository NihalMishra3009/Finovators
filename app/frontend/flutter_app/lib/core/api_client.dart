import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'backend_resolver.dart';
import 'base_url.dart';

class ApiClient {
  ApiClient({required this.baseUrl, this.token});

  String _backendUnreachableMessage() {
    try {
      final uri = Uri.parse(baseUrl);
      final host = uri.host;
      final port = uri.port;
      final hint =
          Platform.isAndroid && (host == '127.0.0.1' || host == 'localhost')
              ? ' (Android: run adb reverse tcp:$port tcp:4000)'
              : '';
      return 'Backend unreachable. Start API on $baseUrl (run scripts/start-stack.cmd)$hint';
    } catch (_) {
      return 'Backend unreachable. Start API on $baseUrl (run scripts/start-stack.cmd)';
    }
  }

  final String baseUrl;
  final String? token;
  static final http.Client _httpClient = http.Client();

  static const Duration _timeout = Duration(seconds: 12);
  static const Duration _otpTimeout = Duration(seconds: 40);

  Future<void> warmup({Duration timeout = const Duration(seconds: 8)}) async {
    try {
      await _httpClient.get(Uri.parse('$baseUrl/health')).timeout(timeout);
    } catch (_) {
      // Ignore warmup failures; real calls will surface actionable errors.
    }
  }

  Map<String, String> get _headers {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    final response = await _safePost('$baseUrl/auth/register', {
      'email': email,
      'password': password,
      'fullName': fullName,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> requestRegisterOtp(
      {required String email}) async {
    final response = await _safePost(
        '$baseUrl/auth/register/request-otp',
        {
          'email': email,
        },
        timeout: _otpTimeout);
    return _decode(response);
  }

  Future<Map<String, dynamic>> verifyRegisterOtp({
    required String email,
    required String otp,
  }) async {
    final response = await _safePost('$baseUrl/auth/register/verify-otp', {
      'email': email,
      'otp': otp,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> completeRegistration({
    required String email,
    required String fullName,
    required String username,
    required String password,
    bool vehicleRented = false,
    bool gigbitInsurance = false,
    double? dailyFuel,
    double? rent,
  }) async {
    final body = <String, dynamic>{
      'email': email,
      'fullName': fullName,
      'username': username,
      'password': password,
      'vehicleRented': vehicleRented,
      'gigbitInsurance': gigbitInsurance,
    };
    if (dailyFuel != null) body['dailyFuel'] = dailyFuel;
    if (rent != null) body['rent'] = rent;

    final response = await _safePost('$baseUrl/auth/register/complete', body);
    return _decode(response);
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _safePost('$baseUrl/auth/login', {
      'email': email,
      'password': password,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> requestPasswordReset(
      {required String email}) async {
    final response = await _safePost(
      '$baseUrl/auth/password-reset/request',
      {'email': email},
      timeout: _otpTimeout,
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> verifyPasswordReset({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final response = await _safePost('$baseUrl/auth/password-reset/verify', {
      'email': email,
      'otp': otp,
      'newPassword': newPassword,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> fetchMe() async {
    final response = await _safeGet('$baseUrl/me');
    return _decode(response);
  }

  Future<Map<String, dynamic>> updateExpenseSettings({
    required double dailyFuel,
    bool? vehicleRented,
    double? dailyRent,
  }) async {
    final body = <String, dynamic>{'dailyFuel': dailyFuel};
    if (vehicleRented != null) body['vehicleRented'] = vehicleRented;
    if (dailyRent != null) body['dailyRent'] = dailyRent;
    final response = await _safePost('$baseUrl/user/expense-settings', body);
    return _decode(response);
  }

  Future<Map<String, dynamic>> fetchSummary() async {
    final response = await _safeGet('$baseUrl/dashboard/summary');
    return _decode(response);
  }

  Future<Map<String, dynamic>> fetchSubscription(String userId) async {
    final response = await _safeGet('$baseUrl/subscription/$userId');
    return _decode(response);
  }

  Future<List<dynamic>> fetchSubscriptionPurchases() async {
    final response = await _safeGet('$baseUrl/subscription/purchases');
    final data = _decode(response);
    return (data['purchases'] as List<dynamic>? ?? []);
  }

  Future<Map<String, dynamic>> selectSubscription({
    required String userId,
    required String plan,
  }) async {
    final response = await _safePost('$baseUrl/subscription/select', {
      'user_id': userId,
      'plan': plan,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> confirmSubscription(
      {required String userId}) async {
    final response =
        await _safePost('$baseUrl/subscription/confirm-mock-payment', {
      'user_id': userId,
    });
    return _decode(response);
  }

  Future<List<dynamic>> fetchTransactions() async {
    final response = await _safeGet('$baseUrl/transactions');
    return _decodeList(response);
  }

  Future<List<dynamic>> fetchContributions() async {
    final response = await _safeGet('$baseUrl/insurance/contributions');
    return _decodeList(response);
  }

  Future<List<dynamic>> fetchLedger() async {
    final response = await _safeGet('$baseUrl/ledger');
    return _decodeList(response);
  }

  Future<List<dynamic>> fetchUserPlatforms() async {
    final response = await _safeGet('$baseUrl/user/platforms');
    final data = _decode(response);
    return (data['platforms'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> fetchPlatformCatalog() async {
    final response = await _safeGet('$baseUrl/platforms/catalog');
    final data = _decode(response);
    return (data['items'] as List<dynamic>? ?? []);
  }

  Stream<void> platformCatalogEvents() async* {
    while (true) {
      HttpClient? client;
      try {
        client = HttpClient()..connectionTimeout = const Duration(seconds: 15);
        final req =
            await client.getUrl(Uri.parse('$baseUrl/platforms/catalog/stream'));
        req.headers.set(HttpHeaders.acceptHeader, 'text/event-stream');
        if (token != null && token!.isNotEmpty) {
          req.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
        }
        final res = await req.close();
        if (res.statusCode < 200 || res.statusCode >= 300) {
          await Future<void>.delayed(const Duration(seconds: 3));
          continue;
        }

        var buffer = '';
        await for (final chunk in res.transform(utf8.decoder)) {
          buffer += chunk;
          while (true) {
            final marker = buffer.indexOf('\n\n');
            if (marker == -1) break;
            final block = buffer.substring(0, marker);
            buffer = buffer.substring(marker + 2);
            if (block.contains('event: platform_catalog') ||
                block.contains('data:')) {
              yield null;
            }
          }
        }
      } catch (_) {
        await Future<void>.delayed(const Duration(seconds: 3));
      } finally {
        client?.close(force: true);
      }
    }
  }

  Future<Map<String, dynamic>> connectPlatform(
      {required String platform}) async {
    final response =
        await _safePost('$baseUrl/platforms/connect', {'platform': platform});
    return _decode(response);
  }

  Future<Map<String, dynamic>> disconnectPlatform(
      {required String platform}) async {
    final response = await _safePost(
        '$baseUrl/platforms/disconnect', {'platform': platform});
    return _decode(response);
  }

  Future<Map<String, dynamic>> syncPlatformEarning({
    required String platform,
    required double amount,
    int? trips,
    double? perTrip,
  }) async {
    final body = <String, dynamic>{
      'platform': platform,
      'amount': amount,
    };
    if (trips != null) body['trips'] = trips;
    if (perTrip != null) body['perTrip'] = perTrip;
    final response = await _safePost('$baseUrl/platforms/sync-earning', body);
    return _decode(response);
  }

  Future<Map<String, dynamic>> createTransaction({
    required String platform,
    required double amount,
    String? note,
  }) async {
    final response = await _safePost('$baseUrl/transactions', {
      'platform': platform,
      'amount': amount,
      'note': note,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> addExpense({
    required String userId,
    required double amount,
    required String category,
    String? note,
  }) async {
    final response = await _safePost('$baseUrl/expenses', {
      'user_id': userId,
      'amount': amount,
      'category': category,
      'note': note,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> upsertDailyExpense({
    required String category,
    required double amount,
    String? note,
  }) async {
    final response = await _safePost('$baseUrl/expenses/upsert-daily', {
      'category': category,
      'amount': amount,
      'note': note,
    });
    return _decode(response);
  }

  Future<List<dynamic>> fetchExpenses() async {
    final response = await _safeGet('$baseUrl/expenses');
    final data = _decode(response);
    return (data['expenses'] as List<dynamic>? ?? []);
  }

  Future<Map<String, dynamic>> createWithdrawal(
      {required double amount}) async {
    final response =
        await _safePost('$baseUrl/withdrawals', {'amount': amount});
    return _decode(response);
  }

  Future<Map<String, dynamic>> submitClaim({
    required String claimType,
    required String incidentDate,
    required String proofUrl,
    String? proofName,
    String? description,
  }) async {
    final response = await _safePost('$baseUrl/insurance/claims', {
      'claimType': claimType,
      'incidentDate': incidentDate,
      'proofUrl': proofUrl,
      if (proofName != null && proofName.trim().isNotEmpty) 'proofName': proofName.trim(),
      if (description != null && description.trim().isNotEmpty) 'description': description.trim(),
    }, timeout: const Duration(seconds: 60));
    return _decode(response);
  }

  Future<List<dynamic>> fetchInsuranceClaims() async {
    final response = await _safeGet('$baseUrl/insurance/claims');
    final data = _decode(response);
    return (data['items'] as List<dynamic>? ?? []);
  }

  Future<Map<String, dynamic>> fetchLoanEligibility() async {
    final response = await _safeGet('$baseUrl/loan/eligibility');
    return _decode(response);
  }

  Future<List<dynamic>> fetchLoanRequests() async {
    final response = await _safeGet('$baseUrl/loan/requests');
    final data = _decode(response);
    return (data['items'] as List<dynamic>? ?? []);
  }

  Stream<Map<String, dynamic>> approvalUpdateEvents() async* {
    while (true) {
      HttpClient? client;
      try {
        client = HttpClient()..connectionTimeout = const Duration(seconds: 15);
        final req =
            await client.getUrl(Uri.parse('$baseUrl/user/approval-updates/stream'));
        req.headers.set(HttpHeaders.acceptHeader, 'text/event-stream');
        if (token != null && token!.isNotEmpty) {
          req.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
        }
        final res = await req.close();
        if (res.statusCode < 200 || res.statusCode >= 300) {
          await Future<void>.delayed(const Duration(seconds: 3));
          continue;
        }

        var buffer = '';
        await for (final chunk in res.transform(utf8.decoder)) {
          buffer += chunk;
          while (true) {
            final marker = buffer.indexOf('\n\n');
            if (marker == -1) break;
            final block = buffer.substring(0, marker);
            buffer = buffer.substring(marker + 2);
            final lines = block.split('\n');
            String eventName = '';
            String dataText = '';
            for (final line in lines) {
              if (line.startsWith('event:')) {
                eventName = line.substring(6).trim();
              } else if (line.startsWith('data:')) {
                dataText += line.substring(5).trim();
              }
            }
            if (eventName != 'approval_update' || dataText.isEmpty) continue;
            try {
              final decoded = jsonDecode(dataText);
              if (decoded is Map) {
                yield Map<String, dynamic>.from(decoded);
              }
            } catch (_) {
              // ignore malformed event payload
            }
          }
        }
      } catch (_) {
        await Future<void>.delayed(const Duration(seconds: 3));
      } finally {
        client?.close(force: true);
      }
    }
  }

  Future<Map<String, dynamic>> applyLoan({
    required double amount,
    required String proofUrl,
    String? proofName,
  }) async {
    final response = await _safePost('$baseUrl/loan/apply', {
      'amount': amount,
      'proofUrl': proofUrl,
      if (proofName != null && proofName.trim().isNotEmpty) 'proofName': proofName.trim(),
    }, timeout: const Duration(seconds: 60));
    return _decode(response);
  }

  Future<Map<String, dynamic>> raiseSupportTicket({
    required String complaint,
    String? subject,
  }) async {
    final response = await _safePost('$baseUrl/support/tickets', {
      'subject': (subject == null || subject.trim().isEmpty)
          ? 'Support Ticket'
          : subject.trim(),
      'complaint': complaint,
    });
    return _decode(response);
  }

  Future<List<dynamic>> fetchSupportTickets({int limit = 100}) async {
    final response = await _safeGet('$baseUrl/support/tickets?limit=$limit');
    final data = _decode(response);
    return (data['tickets'] as List<dynamic>? ?? []);
  }

  Future<Map<String, dynamic>> askTaxAssistant({
    required String question,
    String? chatId,
    String? languageCode,
  }) async {
    final response = await _safePost('$baseUrl/tax/assistant', {
      'question': question,
      if (chatId != null && chatId.trim().isNotEmpty) 'chatId': chatId.trim(),
      if (languageCode != null && languageCode.trim().isNotEmpty)
        'language': languageCode.trim(),
    });
    return _decode(response);
  }

  Future<List<dynamic>> fetchTaxAssistantHistory({
    int limit = 200,
    String? chatId,
  }) async {
    final q = [
      'limit=$limit',
      if (chatId != null && chatId.trim().isNotEmpty)
        'chatId=${Uri.encodeQueryComponent(chatId.trim())}',
    ].join('&');
    final response = await _safeGet('$baseUrl/tax/assistant/history?$q');
    final data = _decode(response);
    return (data['messages'] as List<dynamic>? ?? []);
  }

  Future<List<dynamic>> fetchTaxAssistantChats({int limit = 120}) async {
    final response =
        await _safeGet('$baseUrl/tax/assistant/chats?limit=$limit');
    final data = _decode(response);
    return (data['chats'] as List<dynamic>? ?? []);
  }

  Future<Map<String, dynamic>> createTaxAssistantChat({String? title}) async {
    final response = await _safePost('$baseUrl/tax/assistant/chats', {
      if (title != null && title.trim().isNotEmpty) 'title': title.trim(),
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> renameTaxAssistantChat({
    required String chatId,
    required String title,
  }) async {
    final response = await _safePost(
      '$baseUrl/tax/assistant/chats/${chatId.trim()}/rename',
      {'title': title.trim()},
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> deleteTaxAssistantChat({
    required String chatId,
  }) async {
    final response = await _safePost(
      '$baseUrl/tax/assistant/chats/${chatId.trim()}/delete',
      {},
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> updateProfile({
    required String userId,
    required String name,
  }) async {
    final response =
        await _safePost('$baseUrl/users/$userId/profile', {'name': name});
    return _decode(response);
  }

  Future<Map<String, dynamic>> requestEmailChange({
    required String currentEmail,
    required String newEmail,
  }) async {
    final response = await _safePost('$baseUrl/user/profile/email/request', {
      'current_email': currentEmail,
      'new_email': newEmail,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> requestOldEmailOtp() async {
    final response = await _safePost(
        '$baseUrl/user/profile/email/change/request-old-otp', {});
    return _decode(response);
  }

  Future<Map<String, dynamic>> verifyOldEmailOtp({
    required String flowId,
    required String otp,
    required String newEmail,
  }) async {
    final response =
        await _safePost('$baseUrl/user/profile/email/change/verify-old', {
      'flowId': flowId,
      'otp': otp,
      'newEmail': newEmail,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> verifyNewEmailOtp({
    required String flowId,
    required String otp,
  }) async {
    final response =
        await _safePost('$baseUrl/user/profile/email/change/verify-new', {
      'flowId': flowId,
      'otp': otp,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> optInInsurance() async {
    final response = await _safePost('$baseUrl/user/insurance/opt-in', {});
    return _decode(response);
  }

  Future<Map<String, dynamic>> requestAccountDeletion({
    required String reasonCode,
    String? reasonText,
  }) async {
    final response = await _safePost('$baseUrl/account/delete-request', {
      'reasonCode': reasonCode,
      'reasonText': reasonText,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> changePassword({
    required String email,
    required String oldPassword,
    required String newPassword,
  }) async {
    final response = await _safePost('$baseUrl/user/profile/password', {
      'email': email,
      'old_password': oldPassword,
      'new_password': newPassword,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> verifyOldPassword({
    required String oldPassword,
  }) async {
    final response =
        await _safePost('$baseUrl/user/profile/password/verify-old', {
      'old_password': oldPassword,
    });
    return _decode(response);
  }

  Future<Map<String, dynamic>> updatePasswordWithVerification({
    required String verifyToken,
    required String newPassword,
  }) async {
    final response = await _safePost('$baseUrl/user/profile/password/update', {
      'verifyToken': verifyToken,
      'new_password': newPassword,
    });
    return _decode(response);
  }

  Future<http.Response> _safeGet(
    String url, {
    bool allowResolve = true,
    Duration timeout = _timeout,
  }) async {
    try {
      return await _httpClient
          .get(Uri.parse(url), headers: _headers)
          .timeout(timeout);
    } on TimeoutException {
      if (allowResolve) {
        final r = await _retryWithResolvedBase(url, timeout: timeout);
        if (r != null) return r;
      }
      throw Exception('Request timed out. Check API on $baseUrl');
    } on SocketException {
      if (allowResolve) {
        final r = await _retryWithResolvedBase(url, timeout: timeout);
        if (r != null) return r;
      }
      throw Exception(_backendUnreachableMessage());
    } catch (_) {
      if (allowResolve) {
        final r = await _retryWithResolvedBase(url, timeout: timeout);
        if (r != null) return r;
      }
      throw Exception(_backendUnreachableMessage());
    }
  }

  Future<http.Response> _safePost(
    String url,
    Map<String, dynamic> body, {
    bool allowResolve = true,
    Duration timeout = _timeout,
  }) async {
    try {
      return await http
          .post(
            Uri.parse(url),
            headers: _headers,
            body: jsonEncode(body),
          )
          .timeout(timeout);
    } on TimeoutException {
      if (allowResolve) {
        final r =
            await _retryWithResolvedBase(url, body: body, timeout: timeout);
        if (r != null) return r;
      }
      throw Exception('Request timed out. Check API on $baseUrl');
    } on SocketException {
      if (allowResolve) {
        final r =
            await _retryWithResolvedBase(url, body: body, timeout: timeout);
        if (r != null) return r;
      }
      throw Exception(_backendUnreachableMessage());
    } catch (e) {
      if (allowResolve) {
        final r =
            await _retryWithResolvedBase(url, body: body, timeout: timeout);
        if (r != null) return r;
      }
      final msg = e.toString();
      throw Exception(msg.isEmpty ? _backendUnreachableMessage() : msg.replaceFirst('Exception: ', ''));
    }
  }

  Future<http.Response?> _retryWithResolvedBase(
    String url, {
    Map<String, dynamic>? body,
    Duration timeout = _timeout,
  }) async {
    final uri = Uri.parse(url);
    final pathAndQuery = uri.hasQuery ? '${uri.path}?${uri.query}' : uri.path;

    if (definedApiBaseUrl() != null) return null;

    final resolved = await BackendResolver.resolve(preferred: baseUrl);
    if (resolved == null || resolved == baseUrl) return null;

    // Switch runtime base URL so new ApiClient instances use it.
    setRuntimeApiBaseUrl(resolved);

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(kApiBaseUrlPrefKey, resolved);
    } catch (_) {
      // ignore persistence errors
    }

    final retryUrl = '$resolved$pathAndQuery';
    try {
      if (body == null) {
        return await _httpClient
            .get(Uri.parse(retryUrl), headers: _headers)
            .timeout(timeout);
      }
      return await _httpClient
          .post(
            Uri.parse(retryUrl),
            headers: _headers,
            body: jsonEncode(body),
          )
          .timeout(timeout);
    } catch (_) {
      return null;
    }
  }

  Map<String, dynamic> _decode(http.Response response) {
    final raw = response.body.trim();
    final data = raw.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(raw) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      final message = (data['message'] ?? 'Request failed').toString();
      final detail = (data['detail'] ?? '').toString().trim();
      throw Exception(detail.isEmpty || detail == message ? message : '$message: $detail');
    }
    return data;
  }

  List<dynamic> _decodeList(http.Response response) {
    final raw = response.body.trim();
    final data = raw.isEmpty ? <dynamic>[] : jsonDecode(raw) as List<dynamic>;
    if (response.statusCode >= 400) {
      throw Exception('Request failed');
    }
    return data;
  }
}
