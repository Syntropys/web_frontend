-- ──────────────────────────────────────────────────────────────────
-- seed.sql — Agrolytics Seed Data Reference
-- ──────────────────────────────────────────────────────────────────
-- ⚠ PENTING: File ini adalah REFERENSI SCHEMA SAJA.
-- Data real sudah ada di Supabase production via ingesti JSON dari
-- ai_models/supabase_ready/. Jangan jalankan file ini di production
-- karena akan MENIMPA semua data yang sudah ada.
--
-- Data production saat ini:
--   - regions:              56 kabupaten/kota Kalimantan
--   - production_history:  448 rows (56 × 8 tahun, BPS 2018–2025)
--   - weather_history:    5376 rows (56 × 8 × 12 bulan, NASA POWER)
--   - predictions:         168 rows (56 × 3 model: xgboost, random_forest, linear, v1-real)
--   - cluster_assignments:  56 rows (K-Means 3 klaster, ref 2026)
--   - profiles:              8 users (1 admin, 7 pengguna)
--
-- Jika perlu reset ke data bersih, gunakan:
--   1. supabase/migrations/ → untuk schema
--   2. ai_models/supabase_ready/*.json → untuk data via halaman Ingesti
-- ──────────────────────────────────────────────────────────────────

-- Schema reference only. See supabase/migrations/ for DDL.
-- See ai_models/supabase_ready/ for actual data files.

-- ── Regions: 56 kabupaten/kota across 5 provinces ──────────────────
-- Data loaded from: regions.json (via Ingesti Data page)
-- Sumber: BPS Kalimantan 2023

-- ── production_history: 56 × 8 tahun (2018–2025) = 448 rows ─────
-- Data loaded from: production_history.json
-- Sumber: BPS — Badan Pusat Statistik

-- ── weather_history: 56 × 8 tahun × 12 bulan = 5,376 rows ───────
-- Data loaded from: weather_history.json
-- Sumber: NASA POWER API (Prediction of Worldwide Energy Resources)

-- ── predictions: 56 × 3 model × target 2026 = 168 rows ──────────
-- Data loaded from: predictions.json
-- Model: XGBoost (best), Random Forest, Linear Regression
-- Version: v1-real (trained on real BPS + NASA POWER data)

-- ── cluster_assignments: 56 rows, K-Means 3 clusters ────────────
-- Data loaded from: cluster_assignments_kmeans.json
-- Klaster 0: Risiko Tinggi  (33 kabupaten)
-- Klaster 1: Risiko Sedang  (18 kabupaten)
-- Klaster 2: Risiko Rendah  ( 5 kabupaten)
-- Reference year: 2026
