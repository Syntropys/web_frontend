# Analisis Proyek — Smart Agricultural BI System [PJK-GM030]

---

## 1. Analisis SWOT

### Strengths

**End-to-End Data Pipeline yang Tervalidasi dan Terintegrasi Penuh**: Proyek ini telah membangun pipeline data terintegrasi dari dua sumber resmi — NASA POWER untuk variabel meteorologi (curah hujan, suhu, kelembapan) dan BPS untuk data produksi historis 2018–2025 — yang diproses melalui 9 tahap notebook terstruktur (stage1–stage9) pada modul disease classification dan 7 notebook pada modul predictive analytics (EDA, baseline models, K-Means). Seluruh artefak model telah diekspor dan di-deploy: XGBoost .joblib (0.47 MB) untuk prediksi produktivitas dan TFLite (MobileNetV2 9.72 MB + DenseNet121 27.62 MB) untuk deteksi penyakit. Kedua fitur utama sudah terintegrasi secara end-to-end — fitur prediksi produktivitas menampilkan hasil XGBoost langsung di halaman dashboard Prediksi, sementara **fitur deteksi penyakit padi 10 kelas** (bacterial blight, brown spot, healthy, hispa, leaf blast, leaf scald, leaf smut, narrow brown spot, sheath blight, tungro) telah berhasil diintegrasikan dari frontend (halaman Penyakit → upload foto daun) ke backend FastAPI di Railway (→ TFLite ensemble inference) dan menampilkan hasil klasifikasi beserta confidence score kembali ke pengguna. Backend ML service menggunakan arsitektur single-service embedded (~310 MB RAM) yang sudah berjalan di Railway free tier.

**Arsitektur Frontend Premium dengan Performa Optimal**: Dashboard dibangun menggunakan React 18 + TypeScript 5 + Tailwind CSS v4 + Vite 6, diperkaya dengan TanStack Query v5 untuk manajemen data asinkron, Zustand v5 untuk global state, Chart.js + react-chartjs-2 untuk visualisasi grafik, Leaflet.js + react-leaflet untuk peta choropleth interaktif, Framer Motion v12 untuk animasi, Lenis untuk smooth scrolling, serta Zod v4 untuk validasi skema. Hasilnya adalah 8 halaman dashboard fungsional (Ringkasan, Tren, Prediksi, Peta, Prioritas, Iklim, Risiko, Penyakit) dan 4 halaman autentikasi, seluruhnya terintegrasi langsung dengan Supabase PostgreSQL dan menampilkan data real — bukan mock. Kualitas teknis divalidasi oleh skor PageSpeed Insights yang sangat tinggi: **Performance 100, Accessibility 100, Best Practices 100, SEO 100** (desktop) dan **Performance 96, Accessibility 100, Best Practices 100, SEO 100** (mobile), serta skor keamanan HTTP Observatory **B+ (80/100, 9/10 tests passed)** berkat implementasi security headers (CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy) pada konfigurasi Vercel.

**Diversifikasi Model ML dengan Evaluasi Komparatif yang Komprehensif**: Tim AI Engineer membangun empat model baseline secara komparatif — Linear Regression, Random Forest, XGBoost, dan K-Fold Cross Validation — lengkap dengan evaluasi metrik MAE, RMSE, dan R² menggunakan TimeSeriesSplit, serta model Soft Voting Ensemble CNN (DenseNet121 + MobileNetV2) untuk klasifikasi 10 kelas penyakit padi dengan Top-1 Accuracy 94.95%, Macro AUC 0.991, dan Macro F1 0.9493. Ditambah implementasi K-Means Clustering dengan Elbow Method untuk segmentasi 56 kabupaten ke dalam 3 tingkat prioritas (33 Tinggi, 18 Sedang, 5 Rendah), memberikan dimensi analisis spasial yang memperkuat nilai business intelligence.

---

### Weaknesses

**Ketergantungan pada Infrastruktur Free Tier dengan Batasan Ketat**: Seluruh infrastruktur produksi bergantung pada layanan free tier — Vercel untuk frontend, Supabase free tier untuk database (batas 500 MB storage, rate limit REST API, dan konfirmasi email 2–3 pengiriman per jam), serta Railway free tier untuk backend ML (512 MB RAM, $5 credit). Meskipun arsitektur single-service embedded telah mengoptimalkan penggunaan memori menjadi ~310 MB, tidak ada redundansi atau fallback jika salah satu layanan mengalami downtime, dan upgrade ke paid tier akan menambah biaya operasional yang belum dianggarkan dalam scope proyek capstone.

**CI/CD Pipeline Belum Terimplementasi secara Penuh**: Dokumen Project Plan menspesifikasikan penggunaan GitHub Actions untuk otomatisasi build, testing, dan deployment, namun implementasi aktual menunjukkan file workflow yang masih berupa placeholder. Deployment frontend sudah terotomatisasi melalui Vercel auto-deploy dari Git push, namun backend ML service belum memiliki pipeline CI/CD yang setara. Hal ini berarti proses deployment backend masih dilakukan secara manual, meningkatkan risiko human error saat release dan belum sepenuhnya memenuhi standar MLOps yang direncanakan dalam dokumen.

**Beberapa Library Terinstall tapi Belum Digunakan Secara Aktif**: Beberapa dependensi yang sudah terinstall di package.json belum sepenuhnya dimanfaatkan dalam codebase — React Hook Form dan @hookform/resolvers sudah terdaftar namun belum ada import useForm di seluruh source code (form handling masih menggunakan controlled components manual), dan recharts terinstall sebagai alternatif namun visualisasi data secara konsisten menggunakan Chart.js. Meskipun tidak berdampak signifikan pada performa runtime berkat tree-shaking Vite, hal ini menunjukkan adanya sisa dependensi dari fase eksplorasi awal yang belum di-cleanup dari package.json.

---

### Opportunities

**Potensi Replikasi ke Komoditas dan Wilayah Lain**: Arsitektur pipeline data (NASA POWER + BPS → preprocessing → model → Supabase → dashboard) bersifat modular dan tidak terikat secara hardcode pada komoditas padi atau wilayah Kalimantan. Dengan mengganti dataset sumber, menyesuaikan konfigurasi class_mapping.json, dan memodifikasi GeoJSON peta, sistem yang sama dapat direplikasi untuk komoditas lain (jagung, kelapa sawit, kopi) atau diperluas ke seluruh 34 provinsi Indonesia, menjadikannya platform BI pertanian yang skalabel secara horizontal.

**Ketersediaan Free Tier untuk Deployment Penuh Tanpa Biaya**: Seluruh stack teknologi yang digunakan memiliki opsi free tier yang memadai — Vercel (frontend hosting, auto-deploy dari Git), Supabase (database PostgreSQL + Auth + RLS), dan Railway (backend ML service dengan estimasi ~310 MB dari 512 MB limit setelah refactor ke arsitektur single-service embedded). Total biaya operasional bulanan dapat ditekan menjadi $0 selama masa trial, memungkinkan tim melakukan demo live dan UAT tanpa hambatan finansial selama periode capstone.

**AI Chatbot sebagai Differentiator Kompetitif**: Komponen AI Chatbot Overlay yang sudah terintegrasi di dashboard memberikan fitur conversational analytics yang sangat jarang ditemui pada proyek capstone sejenis. Fitur ini memungkinkan pengguna melakukan query natural language seperti "Bandingkan yield Banjar vs Tabalong 2024" dan mendapatkan insight langsung, menambahkan dimensi interaksi manusia-AI yang melampaui standar dashboard BI konvensional dan menjadi selling point utama saat presentasi.

---

### Threats

**Batasan Waktu yang Ketat untuk Finalisasi dan Dokumentasi**: Dengan durasi total 4–5 minggu dan fitur-fitur inti yang sudah fungsional — login Google OAuth sudah live, SEO sudah teroptimasi (skor 100/100), dan PageSpeed sudah excellent — fokus pada fase akhir beralih ke finalisasi dokumentasi, penyusunan laporan, persiapan materi presentasi, dan produksi video demo. Risiko terbesar bukan lagi pada pengembangan fitur, melainkan pada kualitas dan kelengkapan deliverable non-teknis yang menjadi komponen penilaian signifikan dalam evaluasi capstone.

**Potensi Kendala Performa pada Beban Puncak**: Meskipun arsitektur single-service embedded telah mengoptimalkan penggunaan RAM menjadi ~310 MB dari batas 512 MB Railway free tier, saat demo atau UAT dengan banyak pengguna simultan, risiko latency tinggi tetap ada — terutama jika model TFLite (DenseNet121 + MobileNetV2) menerima permintaan inferensi paralel bersamaan dengan query data Supabase yang intensif. Perlu dipertimbangkan strategi mitigasi seperti request queuing atau rate limiting pada endpoint inferensi untuk menjaga stabilitas sistem.

**Potensi Pertanyaan Evaluator tentang Deviasi dari Project Plan**: Terdapat beberapa perbedaan antara dokumen Project Plan dan implementasi aktual — seperti perubahan package manager dari Yarn ke pnpm, pembatalan Cloudflare R2, CI/CD GitHub Actions yang belum penuh, serta perubahan strategi mobile dari Capacitor ke PWA-ready webview. Meskipun setiap perubahan ini memiliki justifikasi teknis yang valid (pnpm lebih efisien, Supabase sudah mencukupi kebutuhan storage, dan webview lebih praktis daripada native build), tim perlu menyiapkan argumentasi yang rapi dan terstruktur agar deviasi-deviasi ini dipahami sebagai keputusan adaptif yang matang, bukan ketidakmatangan perencanaan.

---

## 2. Analisis Perubahan Proyek

Implementasi front-end mempertahankan mayoritas tech stack yang direncanakan — React, TypeScript, Tailwind CSS, Vite, Zustand, Zod, Leaflet.js, Chart.js, dan Framer Motion — namun terdapat beberapa penyesuaian: package manager berubah dari Yarn ke pnpm untuk kecepatan instalasi dan efisiensi disk, Axios digantikan oleh Supabase client SDK yang sudah menyediakan fetch wrapper bawaan sehingga mengeliminasi kebutuhan HTTP client terpisah, dan library tambahan seperti Lenis smooth scrolling, Lucide React icons, serta html2canvas + jspdf untuk fitur export PDF/XLSX ditambahkan sebagai enhancement. Strategi deployment mobile berubah dari Capacitor (konversi ke Android APK) menjadi pendekatan PWA-ready webview yang lebih ringan dan dapat langsung di-install dari browser tanpa memerlukan build native, sementara autentikasi diperkuat dengan login Google OAuth yang sudah live serta konfirmasi email bawaan Supabase untuk registrasi manual.

Pada sisi backend dan infrastruktur, perubahan paling substansial adalah pembatalan penggunaan Cloudflare R2 sebagai object storage karena seluruh kebutuhan penyimpanan data ternyata cukup ditangani oleh Supabase PostgreSQL dengan RLS policies, serta CI/CD pipeline via GitHub Actions yang direncanakan belum terimplementasi secara penuh (frontend sudah auto-deploy via Vercel, backend masih manual). Deployment frontend menggunakan Vercel sesuai rencana dengan konfigurasi vercel.json yang mencakup security headers lengkap (CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy), cache control untuk aset statis, dan rewrite rules untuk SPA routing, menghasilkan skor HTTP Observatory B+ (80/100). Backend FastAPI di-deploy ke Railway sebagai single container yang sudah dioptimasi untuk free tier.

Perubahan paling signifikan terjadi pada arsitektur MLOps: rancangan awal mengasumsikan arsitektur multi-container (FastAPI Bridge + ML Service terpisah + Predictive ML Service) yang berkomunikasi via HTTP internal dengan MLflow sebagai model registry, namun seluruh arsitektur di-refactor menjadi single-service embedded di mana model TFLite (disease detection) dan XGBoost .joblib (predictive analytics) dimuat langsung dalam proses FastAPI tanpa proxy. Perubahan ini menghilangkan kebutuhan Docker Hub images, MLflow serving, dan inter-service networking, menghemat ~1.7 GB RAM sehingga total konsumsi memori hanya ~310 MB dari batas 512 MB Railway free tier. Dua modul inti ditulis ulang — ml_engine.py menjadi TFLite in-process inference dan forecast_engine.py menjadi joblib in-process prediction — dan hasilnya kedua fitur inti (deteksi penyakit 10 kelas via upload foto dan prediksi produktivitas) sudah berjalan end-to-end dari frontend hingga backend Railway tanpa masalah.

---

## 3. Rekomendasi Screenshot untuk Dokumentasi Produk

### A. Landing Page (Prioritas Tertinggi)

| # | Elemen | Komponen | Alasan |
|---|--------|----------|--------|
| 1 | **Hero Section** — tagline + CTA "Masuk ke Dashboard" | `hero.tsx` | First impression produk, menampilkan identitas visual "Agrolytics" dengan tipografi Instrument Serif dan palet gold-sage yang menjadi signature design system. |
| 2 | **Peta Interaktif Kalimantan** — choropleth K-Means dengan panel distribusi prioritas | `peta.tsx` (component) | Fitur unggulan landing page yang menunjukkan integrasi Leaflet.js + data Supabase real-time, menampilkan 56 kabupaten dengan warna prioritas (Tinggi/Sedang/Rendah) serta popup detail yield per wilayah. |
| 3 | **Pilar Fitur** — kartu fitur utama (Prediksi, Peta, Analisis) | `pillars.tsx` | Menjelaskan value proposition produk secara visual, penting untuk README dan pitch deck. |

### B. Dashboard (Prioritas Tinggi)

| # | Elemen | Halaman | Alasan |
|---|--------|---------|--------|
| 4 | **Halaman Ringkasan** — KPI cards + grafik ringkas | `ringkasan.tsx` | Tampilan pertama setelah login, overview data produksi dan prediksi dalam bentuk widget informatif. |
| 5 | **Halaman Tren Historis** — line chart produksi multi-tahun + toolbar filter + export | `tren.tsx` | Demonstrasi fitur BI utama: visualisasi tren data BPS 2018–2025 dengan filter provinsi, range tahun, dan export CSV/PDF/XLSX. |
| 6 | **Halaman Prediksi** — hasil prediksi XGBoost 2026 dalam format tabel/chart | `prediksi.tsx` | Core deliverable proyek — output model ML yang menjawab research question utama tentang akurasi prediksi produktivitas padi. |
| 7 | **Halaman Peta Dashboard** — peta Kalimantan full dengan panel detail wilayah | `peta.tsx` (page) | Versi lengkap dari peta landing, interaksi klik → detail kabupaten → yield prediction → cluster label. |
| 8 | **Halaman Prioritas** — tabel ranking wilayah berdasarkan K-Means clustering | `prioritas.tsx` | Menjawab fitur "rekomendasi wilayah prioritas" yang menjadi deliverable in-scope di Project Plan. |

### C. Fitur Kunci (Prioritas Sedang)

| # | Elemen | Komponen/Halaman | Alasan |
|---|--------|-----------------|--------|
| 9 | **Halaman Iklim** — visualisasi data cuaca NASA POWER (curah hujan, suhu, kelembapan) | `iklim.tsx` | Menunjukkan integrasi dataset kedua (NASA POWER) dan menjawab research question tentang signifikansi variabel cuaca. |
| 10 | **Halaman Deteksi Penyakit** — upload foto daun padi + hasil klasifikasi 10 kelas | `penyakit.tsx` | Fitur deep learning showcase (ensemble DenseNet121 + MobileNetV2, accuracy 94.95%), sangat visual dan impressive untuk demo. |
| 11 | **AI Chatbot Overlay** — dialog conversational analytics | `ai-chatbot-overlay.tsx` | Differentiator utama yang menunjukkan inovasi AI integration beyond standar BI dashboard. |
| 12 | **Halaman Login/Daftar** — form auth dengan desain premium + Google OAuth | `masuk.tsx` + `daftar.tsx` | Menunjukkan implementasi Supabase Auth dengan login Google OAuth dan konfirmasi email, serta desain form yang premium dan responsif. |

### D. Responsivitas & Tema (Prioritas Sedang)

| # | Elemen | Alasan |
|---|--------|--------|
| 13 | **Mobile view** — landing page + dashboard sidebar collapsed | Bukti responsivitas dan kesiapan akses via webview mobile (PWA-ready). |
| 14 | **Dark mode** — landing atau dashboard dalam tema gelap | Menunjukkan implementasi dual-theme (light/dark) yang meningkatkan kesan profesionalisme produk. |

### Tips Pengambilan Screenshot

- Gunakan resolusi **1920×1080** (desktop) dan **390×844** (mobile/iPhone 14 Pro) untuk konsistensi.
- Pastikan menggunakan **data real dari Supabase** (bukan placeholder) agar grafik dan angka terlihat kredibel.
- Untuk halaman deteksi penyakit, siapkan **foto daun padi dari dataset** agar hasil klasifikasi tampil lengkap.
- Screenshot **dark mode dan light mode** pada halaman yang sama sebagai pasangan perbandingan.
- Ambil juga screenshot **Swagger UI** (`/docs`) dari backend FastAPI sebagai bukti dokumentasi API.
