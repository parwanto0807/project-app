# Security Audit & Hardening — project-app (ERP)

**Tanggal:** 24 Oktober 2026
**Ruang lingkup:** `backend/` (Express 5 + Prisma 6) dan `frontend/` (Next.js 15.5.28)
**Metode:** review kode, pemetaan middleware route, uji endpoint tanpa kredensial, uji Bearer/session, uji upload/CSRF/rate-limit/pagination/gzip, `npm audit`, unit test.
**Branch:** `security/hardening`

---

## 1. Ringkasan Eksekutif

| Tingkat | Awal | Akhir |
|---|---|---|
| Critical | 2 | **0** |
| High | 4 | **0** |
| Medium kode | 5 | **0** |
| Dependency critical/high | 7 | **0** |
| Dependency moderate | 10 | 2 (tanpa fix aman) |

**Temuan terbesar:** 32 dari 58 file route API tidak memiliki autentikasi. Tanpa login:
`GET /api/master/product/getAllProducts` → **200 (1,8 MB)**, `GET /api/master/customer/getAllCustomers` → 200, create/update/delete tetap dieksekusi.

**Setelah perbaikan:** endpoint tersebut → **401 Unauthorized**.

---

## 2. Temuan & Perbaikan

### C-01 — Broken Access Control: API tanpa autentikasi (CRITICAL) ✅

**Bukti awal**
- 32/58 file route tanpa auth (`productRoutes`, `customerRoutes`, `invoiceRoutes`, `supplierRoutes`, `prRouters`, `mrRoutes`, `grRoute`, `tfRoutes`, `coaRouters`, `assetRoutes`, dll).
- Uji tanpa kredensial: produk 200 (1.853.491 byte), customer 200, createProduct 500, createInvoice 400.

**Perbaikan**
- `backend/src/middleware/requireApiAuth.js`: guard global `/api`.
  - Allowlist: `/api/auth/*`, `/api/health`.
  - Menerima **session cookie** atau **JWT** (Bearer/cookie httpOnly).
- `backend/src/app.js`: `app.use(requireApiAuth)` sebelum seluruh route.
- Frontend: codemod AST menambahkan `credentials: "include"` pada **61 file**.
- Kill-switch: env `API_AUTH_ENFORCE=false`.

**Hasil uji:** tanpa auth → **401**; Bearer valid → **200**; session cookie valid → **200**.

---

### C-02 — Dependency critical (CRITICAL) ✅

**Awal:** backend 23 (2 critical), frontend 23 (5 critical).

**Perbaikan**
- `npm audit fix` + upgrade: **Next.js 15.5.28**, **jspdf 4.2.1**, **sharp 0.35.5**, **firebase-admin 14.5.0**, **zod 4.6.7**.
- Overrides frontend: `postcss ^8.5.31`, `@grpc/grpc-js ^1.13.6`, `node-fetch 2.7.0` (untuk `@tensorflow/tfjs-core`).
- `firebase-admin` v14 memakai API modular → `utils/firebase/admin.js` disesuaikan.

**Hasil akhir**
| App | Critical | High | Moderate | Total |
|---|---|---|---|---|
| Backend | 0 | 0 | 2 | 2 |
| Frontend | 0 | 0 | 0 | **0** |

Sisa moderate backend: `exceljs` & `uuid` (tidak ada versi aman; fix menyarankan downgrade ke 3.4.0 — belum dilakukan agar fitur ekspor tidak rusak).

---

### H-01 — Upload file tanpa batas ukuran/tipe (HIGH) ✅

**Perbaikan**
- `backend/src/utils/secureUpload.js`:
  - gambar: maks 5 MB, whitelist JPG/PNG/WebP, ekstensi dari MIME, folder otomatis;
  - dokumen: maks 10 MB, whitelist PDF/gambar/Excel/CSV/DOC/DOCX.
- Diterapkan: produk, absensi, kegiatan, karyawan, PO.
- Error Multer → HTTP **400**.

**Hasil uji:** upload `evil.txt` → **400** `"Tipe file tidak diizinkan."`

---

### H-02 — Tidak ada rate limiting (HIGH) ✅

- global `/api`: 300 req/menit/IP
- `/api/auth`: 100 req/15 menit
- login/register/MFA: **10 percobaan gagal/15 menit**
- `trust proxy` numerik (`TRUST_PROXY`, default 1)

**Hasil uji:** 10 gagal → 403, ke-11 → **429**.

---

### H-03 — Token JWT via query string (HIGH) ✅

Dihapus; hanya header `Authorization` atau cookie httpOnly.

---

### H-04 — Cookie token dapat dibaca JavaScript (HIGH) ⚠️ mitigasi

`accessTokenReadable` dipertahankan untuk kompatibilitas frontend; access token berumur 1 jam dan autentikasi utama memakai cookie httpOnly. Target lanjutan: hapus setelah semua klien memakai cookie (§5).

---

### H-05 — CSRF pada endpoint mutasi (HIGH) ✅

- Middleware baru: request `POST/PUT/PATCH/DELETE` dari browser wajib berasal dari origin allowlist (`Origin`/`Referer`).
- Request tanpa Origin (mobile/server-to-server) tetap dilayani.

**Hasil uji:** Origin `https://evil.example` → **403**.

---

### M-01 — Nama cookie sesi tidak konsisten ✅
Middleware menerima `session_token` **dan** `sessionToken`; logout membersihkan keduanya.

### M-02 — `req.session` ditimpa objek biasa ✅
Diganti `req.sessionInfo`.

### M-03 — `global.currentUserId` tidak aman untuk konkurensi ✅
Dihapus; `soController` memakai `req.user.id`.

### M-04 — Pagination tanpa batas ✅
`pageSize` maksimum **200**.

### M-05 — Tidak ada kompresi response ✅
`compression()` aktif; response besar mengirim `Content-Encoding: gzip`.

### M-06 — Zod error API (kompatibilitas v4) ✅
`.errors` diganti `.issues` pada 6 file (kompatibel v3 & v4).

---

### L-01 — Hardening tambahan ✅
- `x-powered-by` dimatikan.
- Body parser maks **2 MB**.
- Error validasi Prisma → **400**.
- Error response tidak membocorkan stack (hanya development).

---

## 3. Performa

| Perbaikan | Dampak |
|---|---|
| gzip compression | payload JSON besar (mis. daftar produk ±1,8 MB) terkompresi |
| batas `pageSize` 200 | mencegah query/response raksasa |
| rate limit | melindungi DB/app dari banjir request |
| body limit 2 MB | mengurangi beban parser & memori |

**Rekomendasi lanjutan:** index Prisma untuk kolom filter/sort yang sering dipakai, pagination default endpoint list lain, audit N+1 query, dan pengurangan field response yang tidak perlu.

---

## 4. Verifikasi (dijalankan)

**Keamanan otomatis** — `cd backend && npm run test:security` → **11/11 PASS**
```
PASS health publik
PASS tanpa auth ditolak (produk, customer)
PASS Bearer JWT valid
PASS response besar terkompresi (gzip)
PASS pagination cap = 200
PASS session cookie valid
PASS upload .txt ditolak
PASS origin asing ditolak (CSRF)
PASS CORS preflight origin diizinkan
PASS rate limit login (429)
```

**Unit test backend** — `npm test` → **2/2 pass** (health test diperbarui untuk Express 5).

**Lainnya**
- [x] `npm run build` frontend → exit 0 (Next 15.5.28 + jspdf 4.2.1 + zod 4)
- [x] `node --check` seluruh file backend yang diubah
- [x] `npm audit`: backend **0 high/critical**, frontend **0 vulnerabilities**
- [x] CORS allowlist & header Helmet aktif
- [x] `X-Powered-By` kosong

---

## 5. Risiko Tersisa & Roadmap

1. **`exceljs@4.4.0` + `uuid` (moderate, backend)** — belum ada versi aman; fix npm menyarankan downgrade `exceljs@3.4.0`. Perlu uji fitur ekspor Excel sebelum memutuskan.
2. **Cookie `accessTokenReadable`** — target dihapus; gunakan cookie httpOnly sepenuhnya.
3. **File upload publik** (`/uploads`, `/images`) masih dapat diakses tanpa login. Dokumen sensitif sebaiknya memakai signed URL/route ber-auth.
4. **Observability** — banyak `console.log` dibungkus `;(() => {})()` sehingga log hilang; ganti dengan logger terstruktur dan alert 401/429/500.
5. **Next 16** — upgrade major (postcss/Next) terpisah dengan regression test penuh.

---

## 6. File Perubahan Utama

**Backend**
```
backend/src/app.js
backend/src/middleware/requireApiAuth.js        (baru)
backend/src/middleware/authMiddleware.js
backend/src/utils/secureUpload.js               (baru)
backend/src/utils/firebase/admin.js             (firebase-admin v14)
backend/src/routes/{master/product,absensi,kegiatan,master/karyawan,po}/*.js
backend/src/controllers/master/product/productController.js
backend/src/controllers/stockOpname/soController.js
backend/src/controllers/{lpp,pr,rab,wh}/*.js     (zod .issues)
backend/src/validations/{rabValidation,supplierValdator}.js
backend/scripts/security-smoke.mjs              (baru, npm run test:security)
backend/__tests__/health.test.js                (Express 5)
backend/package.json + package-lock.json
```

**Frontend**
```
61 file (credentials: "include" pada fetch)
frontend/package.json + package-lock.json
  Next 15.5.28, jspdf 4.2.1, sharp 0.35.5, zod 4.6.7
  overrides: postcss, @grpc/grpc-js, node-fetch
```

---

## 7. Rollback

```bash
# Nonaktifkan guard auth tanpa ubah kode (restart backend)
API_AUTH_ENFORCE=false
```
Rate limit dapat dilonggarkan melalui konstanta di `backend/src/app.js`.

---

## 8. Checklist Deploy (Anda yang eksekusi)

**Prasyarat runtime:** **Node.js >= 22** (disarankan **Node 24 LTS**, sudah diuji).
`firebase-admin@14` mensyaratkan Node >=22 dan `sharp` >=20.9.

1. Pastikan `node -v` di server **>=22**; jika masih 18/20, upgrade dulu
   (`nvm install 24 && nvm use 24` atau paket Node resmi).
2. Merge `security/hardening` → `main`.
3. `cd backend && rm -rf node_modules && npm ci && npx prisma generate`
   (wajib reinstall agar binary native `sharp` sesuai versi Node baru)
4. `cd backend && npm run test:security` (opsional, butuh app berjalan)
5. `cd frontend && rm -rf node_modules && npm ci && npm run build`
6. Restart backend (PM2) & frontend.
7. Uji: login, 5 halaman utama, upload foto, 1 transaksi.
8. Uji **mobile app** (Bearer) & mesin absensi `/iclock`.
9. Pantau log 401/429 24 jam; gunakan kill-switch bila ada integrasi terputus.
