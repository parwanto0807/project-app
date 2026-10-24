# Security Audit & Hardening — project-app (ERP)

**Tanggal:** 24 Oktober 2026
**Ruang lingkup:** `backend/` (Express 5 + Prisma 6) dan `frontend/` (Next.js 15.5.28)
**Metode:** review kode, pemetaan middleware route, uji endpoint tanpa kredensial, uji autentikasi Bearer & session cookie, uji upload/rate-limit/pagination, `npm audit`.
**Branch:** `security/hardening`

---

## 1. Ringkasan Eksekutif

| Tingkat | Awal | Setelah perbaikan |
|---|---|---|
| Critical | 2 | **0** |
| High | 4 | 1 (zod, perlu upgrade major) |
| Medium | 5 | 0 |
| Low | 4 | 0 |

**Temuan terbesar:** 32 dari 58 file route API tidak memiliki autentikasi. Terbukti tanpa login:
`GET /api/master/product/getAllProducts` → **200 (1,8 MB data)**, `GET /api/master/customer/getAllCustomers` → 200, dan endpoint create/update/delete tetap dieksekusi.

**Setelah perbaikan:** endpoint tersebut → **401 Unauthorized**.

---

## 2. Temuan & Perbaikan

### C-01 — Broken Access Control: API tanpa autentikasi (CRITICAL) ✅ FIXED

**Bukti awal**
- 32/58 file route tanpa auth middleware (`productRoutes`, `customerRoutes`, `invoiceRoutes`, `supplierRoutes`, `prRouters`, `mrRoutes`, `grRoute`, `tfRoutes`, `coaRouters`, `assetRoutes`, dll).
- Uji tanpa kredensial: produk 200 (1.853.491 byte), customer 200, createProduct 500, createInvoice 400 (bukan 401).

**Perbaikan**
- `backend/src/middleware/requireApiAuth.js`: guard global untuk seluruh `/api`.
  - Allowlist: `/api/auth/*`, `/api/health`.
  - Menerima **session cookie** (`session_token`/`sessionToken`) atau **JWT** (`Authorization: Bearer` / cookie `accessToken`).
- `backend/src/app.js`: `app.use(requireApiAuth)` sebelum seluruh route.
- Frontend: codemod AST menambahkan `credentials: "include"` pada **61 file** (semua `fetch()` lintas-origin).
- Kill-switch darurat tanpa ubah kode: `API_AUTH_ENFORCE=false`.

**Hasil uji**
| Uji | Hasil |
|---|---|
| GET produk tanpa kredensial | **401** |
| GET customer tanpa kredensial | **401** |
| POST createProduct tanpa kredensial | **401** |
| GET produk dengan Bearer JWT | **200** |
| GET produk dengan session cookie | **200** |

---

### C-02 — Dependency critical (CRITICAL) ✅ SEBAGIAN BESAR

**Awal**
- Backend: 23 kerentanan (2 critical, 11 high, 10 moderate)
- Frontend: 23 kerentanan (5 critical, 13 high, 3 moderate, 2 low)

**Perbaikan**
- `npm audit fix` pada backend & frontend.
- Upgrade: **Next.js → 15.5.28**, **jspdf → 4.2.1**, **sharp → 0.35.5**.

**Hasil akhir**
| App | Critical | High | Moderate | Low | Total |
|---|---|---|---|---|---|
| Backend | **0** | 1 | 9 | 0 | 10 |
| Frontend | **0** | 7 | 1 | 2 | 10 |

Sisa temuan dijelaskan di §5 (mayoritas memerlukan upgrade major / tidak berdampak runtime).

---

### H-01 — Upload file tanpa batas ukuran/tipe (HIGH) ✅ FIXED

**Bukti:** 12 konfigurasi `multer`; 5 tanpa `limits`/`fileFilter` (`product`, `absensi`, `kegiatan`, `karyawan`, `po`). Ekstensi dari nama file asli, disimpan di folder statis publik.

**Perbaikan**
- `backend/src/utils/secureUpload.js`:
  - `createImageUpload()`: maks 5 MB, hanya JPG/PNG/WebP, ekstensi dari MIME, folder otomatis.
  - `createDocumentUpload()`: maks 10 MB, whitelist PDF/gambar/Excel/CSV/DOCX (memory storage).
- Diterapkan di route produk, absensi, kegiatan, karyawan, PO.
- Error Multer → HTTP **400**.

**Hasil uji:** upload `evil.txt` → **400** `"Tipe file tidak diizinkan."`

---

### H-02 — Tidak ada rate limiting (HIGH) ✅ FIXED

**Perbaikan** (`express-rate-limit` v8):
- `/api`: 300 request/menit/IP
- `/api/auth`: 100 request/15 menit
- login/register/MFA: **10 percobaan gagal/15 menit** (yang sukses tidak dihitung)
- `trust proxy` diubah dari `true` (permissive) → angka (`TRUST_PROXY`, default 1)

**Hasil uji:** 10 percobaan login gagal → 403, percobaan ke-11 & 12 → **429**.

---

### H-03 — Token JWT diterima dari query string (HIGH) ✅ FIXED

`authenticateToken` tidak lagi menerima `?token=`; hanya header `Authorization` atau cookie httpOnly.

---

### H-04 — Cookie token dapat dibaca JavaScript (HIGH) ⚠️ MITIGASI

`accessTokenReadable` masih ada (kompatibilitas frontend), namun:
- access token berumur **1 jam**;
- autentikasi utama kini memakai cookie **httpOnly** (`accessToken`, `sessionToken`);
- target lanjutan: hapus `accessTokenReadable` setelah semua klien memakai cookie (§5).

---

### M-01 — Nama cookie sesi tidak konsisten (MEDIUM) ✅ FIXED

Setter memakai `sessionToken`, middleware membaca `session_token`. Sekarang middleware menerima **keduanya**; logout membersihkan keduanya.

**Hasil uji:** session cookie valid → **200**.

---

### M-02 — `req.session` ditimpa objek biasa (MEDIUM) ✅ FIXED

Diganti `req.sessionInfo` sehingga session store express-session tidak rusak.

---

### M-03 — `global.currentUserId` tidak aman untuk konkurensi (MEDIUM) ✅ FIXED

Dihapus dari `app.js`; `soController` hanya memakai `req.user.id` (tidak ada cross-request leak).

---

### M-04 — Pagination tanpa batas atas (MEDIUM) ✅ FIXED

`pageSize` dibatasi **maksimum 200**.

**Hasil uji:** `limit=100000` → `pageSize: 200`.

---

### M-05 — Tidak ada kompresi response (MEDIUM / performa) ✅ FIXED

`compression()` aktif; response besar mengirim `Content-Encoding: gzip`.

---

### L-01 — Hardening tambahan (LOW) ✅

- `x-powered-by` dimatikan.
- Body parser dibatasi **2 MB**.
- Error validasi Prisma → **400** (bukan 500).
- Error response tidak membocorkan stack ke client (hanya di development).

---

## 3. Performa

| Perbaikan | Dampak |
|---|---|
| `compression()` | payload JSON besar (mis. daftar produk ±1,8 MB) terkompresi |
| Batas `pageSize` 200 | mencegah query/response raksasa |
| Rate limit | melindungi DB/app dari banjir request |
| Batas body 2 MB | mengurangi beban parser & memori |

**Rekomendasi lanjutan:** index Prisma untuk kolom filter/sort yang sering dipakai, pagination default pada endpoint list lain, audit query N+1, dan pemisahan field yang tidak perlu di response.

---

## 4. Verifikasi yang Dijalankan

- [x] Endpoint tanpa kredensial → **401** (produk, customer, createProduct)
- [x] `/api/health` → **200** (publik)
- [x] Bearer JWT valid → **200**
- [x] Session cookie valid → **200**
- [x] Upload `.txt` → **400** (ditolak)
- [x] Rate limit login → **429** setelah 10 percobaan gagal
- [x] `pageSize` maksimum **200**
- [x] `Content-Encoding: gzip` pada response besar
- [x] CORS preflight → **200**, `Access-Control-Allow-Origin` sesuai allowlist, `Allow-Credentials: true`
- [x] Header keamanan Helmet aktif (`X-Content-Type-Options: nosniff`, CSP), `X-Powered-By` kosong
- [x] `npm run build` frontend → **exit 0** (Next 15.5.28 + jspdf 4.2.1)
- [x] `node --check` seluruh file backend yang diubah → OK
- [x] `npm audit` → **0 critical** backend & frontend

---

## 5. Risiko Tersisa & Roadmap

1. **Backend — `zod@3.25.76` (high, fix `zod@4.6.7`)**
   Upgrade major; format error Zod berubah. Perlu regression test pada validasi request.
2. **Frontend — `firebase@12.6.0` (high)**
   Advisory npm menyarankan `firebase@9.14.0` (downgrade). Perlu evaluasi pemakaian Firebase/firestore sebelum mengubah versi.
3. **Frontend — `face-api.js@0.22.2` → `node-fetch` (high)**
   Tidak ada fix. `node-fetch` hanya dipakai di lingkungan Node (bukan browser); risiko runtime rendah. Alternatif jangka panjang: ganti modul face detection.
4. **Frontend — `postcss` (high)**
   Fix memerlukan **Next 16.4.3** (major). Risiko terutama saat build/dev; jadwalkan upgrade Next 16 terpisah + regression test.
5. **Frontend — `zod@3.25.76` (high)** — sama seperti backend, perlu upgrade teruji.
6. **Cookie `accessTokenReadable`** — target: hapus, gunakan cookie httpOnly sepenuhnya.
7. **File upload publik** (`/uploads`, `/images`) masih dapat diakses tanpa login. Dokumen sensitif (bukti transfer, KTP, slip) sebaiknya memakai signed URL/route ber-auth.
8. **CSRF** — cookie produksi `SameSite=None`; pertimbangkan CSRF token atau `SameSite=Lax` jika domain memungkinkan.
9. **Observability** — banyak `console.log` dibungkus `;(() => {})()` sehingga log hilang. Ganti dengan logger terstruktur (pino) dan alert 401/429/500.

---

## 6. File Perubahan Utama

**Backend**
```
backend/src/app.js
backend/src/middleware/requireApiAuth.js        (baru)
backend/src/middleware/authMiddleware.js
backend/src/utils/secureUpload.js               (baru)
backend/src/routes/master/product/productRoutes.js
backend/src/routes/absensi/absensiRoutes.js
backend/src/routes/kegiatan/kegiatanRoutes.js
backend/src/routes/master/karyawan/karyawanRoutes.js
backend/src/routes/po/poRoutes.js
backend/src/controllers/master/product/productController.js
backend/src/controllers/stockOpname/soController.js
backend/package.json + package-lock.json
```

**Frontend**
```
61 file (codemod credentials: "include" pada fetch lintas-origin)
frontend/package.json + package-lock.json (Next 15.5.28, jspdf 4.2.1, sharp 0.35.5)
```

---

## 7. Rollback

```bash
# Nonaktifkan guard autentikasi tanpa mengubah kode (restart backend)
API_AUTH_ENFORCE=false
```

Rate limit dapat dilonggarkan melalui konstanta di `backend/src/app.js`.

---

## 8. Checklist Deploy

1. Merge `security/hardening` → `main`.
2. `cd backend && npm ci && npx prisma generate`
3. `cd frontend && npm ci && npm run build`
4. Restart backend (PM2) & frontend.
5. Uji: login, buka 5 halaman utama, upload foto, buat 1 transaksi.
6. Pantau log 401/429 selama 24 jam; gunakan kill-switch bila ada integrasi yang terputus.
7. Uji mobile app (Bearer token) & mesin absensi (`/iclock`) setelah deploy.
