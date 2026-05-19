// File: mobile/lib/models/loan_models.dart

import 'dart:convert';

/// Mini model for Karyawan to optimize data transfer
class KaryawanMini {
  final String id;
  final String namaLengkap;
  final String nik;
  final String? jabatan;
  final double? gajiPokok;

  KaryawanMini({
    required this.id,
    required this.namaLengkap,
    required this.nik,
    this.jabatan,
    this.gajiPokok,
  });

  factory KaryawanMini.fromJson(Map<String, dynamic> json) {
    return KaryawanMini(
      id: json['id'] as String,
      namaLengkap: json['namaLengkap'] as String,
      nik: json['nik'] as String,
      jabatan: json['jabatan'] as String?,
      gajiPokok: json['gajiPokok'] != null 
          ? double.tryParse(json['gajiPokok'].toString()) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'namaLengkap': namaLengkap,
      'nik': nik,
      if (jabatan != null) 'jabatan': jabatan,
      if (gajiPokok != null) 'gajiPokok': gajiPokok,
    };
  }
}

/// Detail schedule/angsuran for a Pinjaman (Loan)
class PinjamanDetail {
  final String id;
  final String pinjamanId;
  final int bulanKe;
  final DateTime tanggalJatuhTempo;
  final double jumlahBayar;
  final String status; // PENDING, PAID
  final DateTime? tanggalBayar;

  PinjamanDetail({
    required this.id,
    required this.pinjamanId,
    required this.bulanKe,
    required this.tanggalJatuhTempo,
    required this.jumlahBayar,
    required this.status,
    this.tanggalBayar,
  });

  factory PinjamanDetail.fromJson(Map<String, dynamic> json) {
    return PinjamanDetail(
      id: json['id'] as String,
      pinjamanId: json['pinjamanId'] as String,
      bulanKe: json['bulanKe'] as int,
      tanggalJatuhTempo: DateTime.parse(json['tanggalJatuhTempo'] as String),
      jumlahBayar: double.parse(json['jumlahBayar'].toString()),
      status: json['status'] as String,
      tanggalBayar: json['tanggalBayar'] != null
          ? DateTime.parse(json['tanggalBayar'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'pinjamanId': pinjamanId,
      'bulanKe': bulanKe,
      'tanggalJatuhTempo': tanggalJatuhTempo.toIso8601String(),
      'jumlahBayar': jumlahBayar,
      'status': status,
      if (tanggalBayar != null) 'tanggalBayar': tanggalBayar!.toIso8601String(),
    };
  }
}

/// Core model for Pinjaman (Loan)
class Pinjaman {
  final String id;
  final String karyawanId;
  final DateTime tanggalPinjam;
  final double jumlahPinjaman;
  final int tenor;
  final double bunga;
  final double angsuranBulanan;
  final double sisaPinjaman;
  final String status; // DRAFT, ACTIVE, COMPLETED
  final String? keterangan;
  final String? bankAccountId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final KaryawanMini karyawan;
  final List<PinjamanDetail> details;

  Pinjaman({
    required this.id,
    required this.karyawanId,
    required this.tanggalPinjam,
    required this.jumlahPinjaman,
    required this.tenor,
    required this.bunga,
    required this.angsuranBulanan,
    required this.sisaPinjaman,
    required this.status,
    this.keterangan,
    this.bankAccountId,
    required this.createdAt,
    required this.updatedAt,
    required this.karyawan,
    required this.details,
  });

  factory Pinjaman.fromJson(Map<String, dynamic> json) {
    var detailsList = (json['details'] as List?) ?? [];
    List<PinjamanDetail> parsedDetails = detailsList
        .map((d) => PinjamanDetail.fromJson(d as Map<String, dynamic>))
        .toList();

    return Pinjaman(
      id: json['id'] as String,
      karyawanId: json['karyawanId'] as String,
      tanggalPinjam: DateTime.parse(json['tanggalPinjam'] as String),
      jumlahPinjaman: double.parse(json['jumlahPinjaman'].toString()),
      tenor: json['tenor'] as int,
      bunga: json['bunga'] != null ? double.parse(json['bunga'].toString()) : 0.0,
      angsuranBulanan: double.parse(json['angsuranBulanan'].toString()),
      sisaPinjaman: double.parse(json['sisaPinjaman'].toString()),
      status: json['status'] as String,
      keterangan: json['keterangan'] as String?,
      bankAccountId: json['bankAccountId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      karyawan: KaryawanMini.fromJson(json['karyawan'] as Map<String, dynamic>),
      details: parsedDetails,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'karyawanId': karyawanId,
      'tanggalPinjam': tanggalPinjam.toIso8601String(),
      'jumlahPinjaman': jumlahPinjaman,
      'tenor': tenor,
      'bunga': bunga,
      'angsuranBulanan': angsuranBulanan,
      'sisaPinjaman': sisaPinjaman,
      'status': status,
      if (keterangan != null) 'keterangan': keterangan,
      if (bankAccountId != null) 'bankAccountId': bankAccountId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'karyawan': karyawan.toJson(),
      'details': details.map((d) => d.toJson()).toList(),
    };
  }
}

/// Core model for Kasbon Sementara (Cash Advance)
class Kasbon {
  final String id;
  final String karyawanId;
  final DateTime tanggal;
  final double jumlah;
  final String? keperluan;
  final String status; // PENDING, APPROVED, REJECTED, SETTLED
  final DateTime? bulanPotong;
  final String? approvedBy;
  final DateTime? approvedAt;
  final String? rejectedReason;
  final String? catatan;
  final DateTime? tanggalPenyelesaian;
  final bool isPosted;
  final DateTime createdAt;
  final DateTime updatedAt;
  final KaryawanMini karyawan;

  Kasbon({
    required this.id,
    required this.karyawanId,
    required this.tanggal,
    required this.jumlah,
    this.keperluan,
    required this.status,
    this.bulanPotong,
    this.approvedBy,
    this.approvedAt,
    this.rejectedReason,
    this.catatan,
    this.tanggalPenyelesaian,
    required this.isPosted,
    required this.createdAt,
    required this.updatedAt,
    required this.karyawan,
  });

  factory Kasbon.fromJson(Map<String, dynamic> json) {
    return Kasbon(
      id: json['id'] as String,
      karyawanId: json['karyawanId'] as String,
      tanggal: DateTime.parse(json['tanggal'] as String),
      jumlah: double.parse(json['jumlah'].toString()),
      keperluan: json['keperluan'] as String?,
      status: json['status'] as String,
      bulanPotong: json['bulanPotong'] != null
          ? DateTime.parse(json['bulanPotong'] as String)
          : null,
      approvedBy: json['approvedBy'] as String?,
      approvedAt: json['approvedAt'] != null
          ? DateTime.parse(json['approvedAt'] as String)
          : null,
      rejectedReason: json['rejectedReason'] as String?,
      catatan: json['catatan'] as String?,
      tanggalPenyelesaian: json['tanggalPenyelesaian'] != null
          ? DateTime.parse(json['tanggalPenyelesaian'] as String)
          : null,
      isPosted: json['isPosted'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      karyawan: KaryawanMini.fromJson(json['karyawan'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'karyawanId': karyawanId,
      'tanggal': tanggal.toIso8601String(),
      'jumlah': jumlah,
      if (keperluan != null) 'keperluan': keperluan,
      'status': status,
      if (bulanPotong != null) 'bulanPotong': bulanPotong!.toIso8601String(),
      if (approvedBy != null) 'approvedBy': approvedBy,
      if (approvedAt != null) 'approvedAt': approvedAt!.toIso8601String(),
      if (rejectedReason != null) 'rejectedReason': rejectedReason,
      if (catatan != null) 'catatan': catatan,
      if (tanggalPenyelesaian != null) 'tanggalPenyelesaian': tanggalPenyelesaian!.toIso8601String(),
      'isPosted': isPosted,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'karyawan': karyawan.toJson(),
    };
  }
}
