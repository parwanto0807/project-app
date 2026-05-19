// File: mobile/lib/services/loan_api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/loan_models.dart';

class LoanApiService {
  /// Base API URL
  /// - For Production: https://api.yourdomain.com/api
  /// - For Android Emulator (local backend on port 5000): http://10.0.2.2:5000/api
  /// - For iOS Simulator / Desktop: http://localhost:5000/api
  final String baseUrl;

  /// Optional User JWT Token (Bearer token for authenticateToken middleware)
  String? authToken;

  LoanApiService({
    required this.baseUrl,
    this.authToken,
  });

  /// Helper to generate common request headers
  Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
      if (authToken != null) 'Authorization': 'Bearer $authToken',
    };
  }

  /// Update the active authentication token (e.g. after login/refresh)
  void updateToken(String? token) {
    authToken = token;
  }

  // ===========================================================================
  // ─── PINJAMAN (LOANS) ENDPOINTS ────────────────────────────────────────────
  // ===========================================================================

  /// Fetch personalized loans for the currently authenticated employee
  /// GET /api/loans/my-loans
  Future<List<Pinjaman>> fetchMyLoans() async {
    final uri = Uri.parse('$baseUrl/loans/my-loans');

    try {
      final response = await http.get(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((dynamic item) => Pinjaman.fromJson(item as Map<String, dynamic>)).toList();
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal mengambil data pinjaman saya');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Fetch all employee loans with optional status or employee filters
  /// GET /api/loans/pinjaman
  Future<List<Pinjaman>> fetchAllLoans({
    String? status,
    String? karyawanId,
  }) async {
    final queryParams = <String, String>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (karyawanId != null && karyawanId.isNotEmpty) queryParams['karyawanId'] = karyawanId;

    final uri = Uri.parse('$baseUrl/loans/pinjaman').replace(queryParameters: queryParams);

    try {
      final response = await http.get(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((dynamic item) => Pinjaman.fromJson(item as Map<String, dynamic>)).toList();
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal mengambil data pinjaman (Code: ${response.statusCode})');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Create a new Loan (Status will start as DRAFT)
  /// POST /api/loans/pinjaman
  Future<Pinjaman> createLoan({
    required String karyawanId,
    required double jumlahPinjaman,
    required int tenor,
    required DateTime tanggalPinjam,
    double bunga = 0.0,
    String? keterangan,
    String? bankAccountId,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/pinjaman');
    final body = {
      'karyawanId': karyawanId,
      'jumlahPinjaman': jumlahPinjaman,
      'tenor': tenor,
      'tanggalPinjam': tanggalPinjam.toIso8601String(),
      'bunga': bunga,
      if (keterangan != null) 'keterangan': keterangan,
      if (bankAccountId != null) 'bankAccountId': bankAccountId,
    };

    try {
      final response = await http.post(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 201) {
        return Pinjaman.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal membuat pinjaman');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Update a Loan (DRAFT status only)
  /// PUT /api/loans/pinjaman/:id
  Future<Pinjaman> updateLoan(
    String loanId, {
    required String karyawanId,
    required double jumlahPinjaman,
    required int tenor,
    required DateTime tanggalPinjam,
    double bunga = 0.0,
    String? keterangan,
    String? bankAccountId,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/pinjaman/$loanId');
    final body = {
      'karyawanId': karyawanId,
      'jumlahPinjaman': jumlahPinjaman,
      'tenor': tenor,
      'tanggalPinjam': tanggalPinjam.toIso8601String(),
      'bunga': bunga,
      if (keterangan != null) 'keterangan': keterangan,
      'bankAccountId': bankAccountId, // Can be null to clear
    };

    try {
      final response = await http.put(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return Pinjaman.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal memperbarui pinjaman');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Delete a Loan (DRAFT status only)
  /// DELETE /api/loans/pinjaman/:id
  Future<bool> deleteLoan(String loanId) async {
    final uri = Uri.parse('$baseUrl/loans/pinjaman/$loanId');

    try {
      final response = await http.delete(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        return true;
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal menghapus pinjaman');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Post Loan to General Ledger (Transitions DRAFT -> ACTIVE, disburse funds)
  /// POST /api/loans/pinjaman/:id/post
  Future<Pinjaman> postLoan(String loanId) async {
    final uri = Uri.parse('$baseUrl/loans/pinjaman/$loanId/post');

    try {
      final response = await http.post(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        return Pinjaman.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal posting pencairan pinjaman');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Record an installment payment manually
  /// POST /api/loans/pinjaman/repayment/:detailId
  Future<PinjamanDetail> recordRepayment(
    String detailId, {
    required String bankAccountId,
    required DateTime tanggalBayar,
    String? keterangan,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/pinjaman/repayment/$detailId');
    final body = {
      'bankAccountId': bankAccountId,
      'tanggalBayar': tanggalBayar.toIso8601String(),
      if (keterangan != null) 'keterangan': keterangan,
    };

    try {
      final response = await http.post(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return PinjamanDetail.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal mencatat pembayaran angsuran');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  // ===========================================================================
  // ─── KASBON SEMENTARA (CASH ADVANCE) ENDPOINTS ─────────────────────────────
  // ===========================================================================

  /// Fetch personalized kasbon history for the currently authenticated employee
  /// GET /api/loans/my-kasbon
  Future<List<Kasbon>> fetchMyKasbon() async {
    final uri = Uri.parse('$baseUrl/loans/my-kasbon');

    try {
      final response = await http.get(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((dynamic item) => Kasbon.fromJson(item as Map<String, dynamic>)).toList();
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal mengambil data kasbon saya');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Submit a new kasbon request as the authenticated employee
  /// POST /api/loans/my-kasbon
  /// Returns a Map containing the parsed 'Kasbon' and optional 'warning' message (if exceeds 50% salary).
  Future<Map<String, dynamic>> applyMyKasbon({
    required double jumlah,
    String? keperluan,
    DateTime? bulanPotong,
    String? catatan,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/my-kasbon');
    final body = {
      'jumlah': jumlah,
      if (keperluan != null) 'keperluan': keperluan,
      if (bulanPotong != null) 'bulanPotong': bulanPotong.toIso8601String(),
      if (catatan != null) 'catatan': catatan,
    };

    try {
      final response = await http.post(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        return {
          'kasbon': Kasbon.fromJson(responseData),
          'warning': responseData['warning'] as String?,
        };
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal mengajukan kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Fetch all kasbon records with optional status or employee filters
  /// GET /api/loans/kasbon
  Future<List<Kasbon>> fetchAllKasbon({
    String? status,
    String? karyawanId,
  }) async {
    final queryParams = <String, String>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (karyawanId != null && karyawanId.isNotEmpty) queryParams['karyawanId'] = karyawanId;

    final uri = Uri.parse('$baseUrl/loans/kasbon').replace(queryParameters: queryParams);

    try {
      final response = await http.get(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((dynamic item) => Kasbon.fromJson(item as Map<String, dynamic>)).toList();
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal mengambil data kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Create a new Kasbon request (Starts as PENDING)
  /// POST /api/loans/kasbon
  /// Returns a Map containing the parsed 'Kasbon' and optional 'warning' message (if exceeds 50% salary).
  Future<Map<String, dynamic>> createKasbon({
    required String karyawanId,
    required double jumlah,
    String? keperluan,
    DateTime? bulanPotong,
    String? catatan,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/kasbon');
    final body = {
      'karyawanId': karyawanId,
      'jumlah': jumlah,
      if (keperluan != null) 'keperluan': keperluan,
      if (bulanPotong != null) 'bulanPotong': bulanPotong.toIso8601String(),
      if (catatan != null) 'catatan': catatan,
    };

    try {
      final response = await http.post(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        return {
          'kasbon': Kasbon.fromJson(responseData),
          'warning': responseData['warning'] as String?,
        };
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal membuat kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Update Kasbon request (PENDING status only)
  /// PUT /api/loans/kasbon/:id
  Future<Map<String, dynamic>> updateKasbon(
    String id, {
    double? jumlah,
    String? keperluan,
    DateTime? bulanPotong,
    String? catatan,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/kasbon/$id');
    final body = {
      if (jumlah != null) 'jumlah': jumlah,
      if (keperluan != null) 'keperluan': keperluan,
      if (bulanPotong != null) 'bulanPotong': bulanPotong.toIso8601String(),
      if (catatan != null) 'catatan': catatan,
    };

    try {
      final response = await http.put(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        return {
          'kasbon': Kasbon.fromJson(responseData),
          'warning': responseData['warning'] as String?,
        };
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal mengupdate kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Approve a Kasbon request (Transitions PENDING -> APPROVED)
  /// PATCH /api/loans/kasbon/:id/approve
  Future<Kasbon> approveKasbon(
    String id, {
    String? approvedBy,
    String? catatan,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/kasbon/$id/approve');
    final body = {
      if (approvedBy != null) 'approvedBy': approvedBy,
      if (catatan != null) 'catatan': catatan,
    };

    try {
      final response = await http.patch(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return Kasbon.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal menyetujui kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Post Kasbon to General Ledger (Deduct Petty Cash, add Employee Receivables)
  /// POST /api/loans/kasbon/:id/post
  Future<Kasbon> postKasbon(
    String id, {
    String cashAccountKey = 'PETTY_CASH',
  }) async {
    final uri = Uri.parse('$baseUrl/loans/kasbon/$id/post');
    final body = {
      'cashAccountKey': cashAccountKey,
    };

    try {
      final response = await http.post(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return Kasbon.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal posting kasbon ke jurnal');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Reject Kasbon request
  /// PATCH /api/loans/kasbon/:id/reject
  Future<Kasbon> rejectKasbon(
    String id, {
    required String rejectedReason,
  }) async {
    final uri = Uri.parse('$baseUrl/loans/kasbon/$id/reject');
    final body = {
      'rejectedReason': rejectedReason,
    };

    try {
      final response = await http.patch(
        uri,
        headers: _getHeaders(),
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        return Kasbon.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal menolak kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Settle Kasbon request via salary cut (Transitions APPROVED -> SETTLED)
  /// PATCH /api/loans/kasbon/:id/settle
  Future<Kasbon> settleKasbon(String id) async {
    final uri = Uri.parse('$baseUrl/loans/kasbon/$id/settle');

    try {
      final response = await http.patch(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        return Kasbon.fromJson(jsonDecode(response.body));
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal pelunasan kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }

  /// Delete Kasbon request (PENDING status only)
  /// DELETE /api/loans/kasbon/:id
  Future<bool> deleteKasbon(String id) async {
    final uri = Uri.parse('$baseUrl/loans/kasbon/$id');

    try {
      final response = await http.delete(uri, headers: _getHeaders());

      if (response.statusCode == 200) {
        return true;
      } else {
        final errBody = jsonDecode(response.body);
        throw Exception(errBody['message'] ?? 'Gagal menghapus kasbon');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }
}
