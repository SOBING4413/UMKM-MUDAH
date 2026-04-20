# Security Audit & Hardening Notes (UMKM Mudah)

## 1) Ringkasan audit

Aplikasi ini adalah **frontend static + Firebase Auth + Firestore**, jadi:
- SQL Injection di aplikasi ini **tidak relevan langsung** (tidak ada SQL query raw di code frontend).
- Risiko utama: brute force auth, validasi input lemah, keamanan session client, dan kebocoran data akibat konfigurasi Firestore Rules yang longgar.

## 2) Perbaikan yang sudah diterapkan di kode

### Login/Register hardening
- Input sanitization untuk nama/email.
- Validasi format email.
- Password policy lebih ketat (min 8 karakter + huruf besar + huruf kecil + angka).
- Error message login dibuat lebih generik untuk mengurangi user enumeration.
- Rate limiting client-side untuk login, signup, reset password, dan Google login.
- Security event logging ringan untuk aktivitas sensitif.

### Stabilitas sinkronisasi database
- Parse JSON lebih aman (anti data rusak dari localStorage/cloud).
- Deduplikasi data berdasarkan `id` dengan preferensi data terbaru.
- Lock `saveInFlightPromise` agar sync cloud tidak balapan (race condition) saat save berulang.
- Logging sync yang lebih terstruktur.

## 3) Catatan tentang password hashing

Password email/password pada Firebase Auth **di-hash secara aman di sisi Firebase** (bukan plaintext di client), sehingga tidak ada kebutuhan hashing manual di frontend.

## 4) Rekomendasi penting untuk production

1. Aktifkan **Firebase App Check** (reCAPTCHA Enterprise / Play Integrity / DeviceCheck) untuk menahan abuse traffic.
2. Pastikan **Firestore Security Rules** ketat: user hanya boleh baca/tulis dokumen miliknya.
3. Batasi domain CORS + gunakan reverse proxy (Nginx/Cloudflare) untuk WAF + rate limiting di edge.
4. Aktifkan monitoring & alerting:
   - Firebase Auth failed login spikes
   - lonjakan write/read Firestore
5. Gunakan cloud protection:
   - Cloudflare WAF / Google Cloud Armor
   - Bot management + DDoS mitigation
6. Jika nanti menambah backend sendiri, gunakan middleware contoh di `security-middleware.example.js`.

## 5) Contoh Firestore Security Rules (direkomendasikan)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
