# Product Requirements Document (PRD)
## Interactive 3D Earth & Live Data Globe

**Versi:** 1.0  
**Target Proyek:** Aplikasi Web Visualisasi Geospasial 3D Real-Time  
**Stack Utama:** Next.js (App Router, tanpa `src/`), TypeScript, Tailwind CSS, Three.js, `lucide-react`  
**Bahasa Antarmuka:** Bahasa Indonesia (dengan istilah teknis/metrik standar internasional)

---

## 1. Ringkasan Produk & Tujuan

**Interactive 3D Earth & Live Data Globe** adalah aplikasi web interaktif yang memvisualisasikan data dunia nyata secara *real-time* di atas bola Bumi 3D berakurasi geografis. Pengguna dapat memutar, memperbesar (*zoom*), mencari lokasi, memfilter kejadian, dan mengeksplorasi tiga lapisan data global langsung dari browser desktop maupun perangkat seluler.

### Tujuan Utama
1. **Visualisasi Data Dunia Nyata:** Menghubungkan grafik 3D WebGL dengan API publik *real-time* (gempa bumi global dan posisi Stasiun Luar Angkasa Internasional / ISS).
2. **Pengalaman Eksplorasi Cair & Responsif:** Menghadirkan antarmuka bergaya *Apple Fluid Glass* dengan dukungan **Dark Mode** dan **Light Mode** yang nyaman dipakai di layar desktop, HP *portrait*, maupun HP *landscape*.
3. **Standar Rekayasa Produksi:** Memisahkan *render loop* 60 FPS Three.js dari *state management* React, mengoptimalkan performa GPU mobile, serta menyediakan mekanisme *fallback* saat koneksi API terganggu.

---

## 2. Target Pengguna & Skenario Penggunaan

| Segmen Pengguna | Kebutuhan Utama |
| :--- | :--- |
| **Pengguna Umum & Pembelajar Geografi** | Melihat persebaran gempa terbaru, melacak posisi ISS di atas peta dunia, dan memahami jalur konektivitas global secara visual. |
| **Rekruter & Tim Teknis (Portofolio)** | Menilai kualitas arsitektur frontend, penguasaan WebGL/Three.js, integrasi API *real-time*, TypeScript, dan kepedulian terhadap detail UI/UX mobile. |
| **Pengguna Mobile** | Navigasi sentuh yang mulus (1 jari putar, 2 jari *pinch-zoom*) tanpa salah ketuk, serta panel informasi yang tidak menutupi seluruh bola Bumi. |

---

## 3. Spesifikasi Fitur (Functional Requirements)

### 3.1. Engine Bola Bumi 3D Akurat (`GlobeCanvas`)
* **Akurasi Geografis:** Bentuk benua dan garis pantai wajib akurat secara geografis (menggunakan tekstur equirectangular dunia beresolusi baik atau rendering batas negara GeoJSON/TopoJSON ke kanvas resolusi tinggi) agar setiap koordinat $(\text{lat}, \text{lon})$ tepat berada di lokasi aslinya.
* **Sinkronisasi Tema 3D (Dark & Light Mode):**
  * **Dark Mode (Orbital Night):** Latar ruang angkasa gelap dengan bintang berkedip halus (*GPU shader*), permukaan Bumi gelap/slate dengan kontras batas benua dan titik cahaya kota hangat, serta pendar atmosfer biru elektrik.
  * **Light Mode (Daylight Studio):** Latar terang bersih bergaya studio editorial, permukaan Bumi cerah bergaya atlas modern (lautan biru jernih & daratan netral-hijau lembut), pencahayaan studio lembut, serta pendar atmosfer biru langit.
* **Kontrol Kamera Interaktif:**
  * Mendukung *orbit rotate* dan *zoom* via mouse maupun layar sentuh (`OrbitControls` dengan *damping* halus).
  * Fitur **Fly-To Camera**: Saat pengguna memilih gempa, ISS, atau hub rute dari daftar/pencarian, kamera meluncur halus mengarah ke koordinat 3D target menggunakan *frame-rate independent damping*.
  * Fitur **Auto-Rotate** (dapat dinyalakan/dimatikan, otomatis berhenti sementara saat pengguna menggeser kamera manual) dan tombol **Reset View**.
  * **Proteksi Multi-Touch:** Melacak pointer aktif menggunakan `Set` (`pointerdown`, `pointerup`, `pointercancel`) untuk membedakan gestur *drag*/*pinch-zoom* dengan ketukan (*tap* dengan pergeseran $< 6\text{ px}$).

### 3.2. Layer 1 — Pantauan Gempa Bumi Global (USGS Live API)
* **Sumber Data:** USGS Earthquake Hazards Program GeoJSON Feed (endpoint publik tanpa API key):
  * Default: 24 jam terakhir (`all_day.geojson`) dengan opsi rentang 7 hari (`all_week.geojson`).
* **Visualisasi 3D:**
  * Seluruh titik gempa dirender menggunakan **`THREE.InstancedMesh`** (bukan ratusan `Mesh` terpisah) demi performa tinggi di HP.
  * Warna dan tinggi penanda/pilar serta cincin riak (*pulse ring*) mencerminkan skala magnitudo ($M < 4.0$, $4.0 \le M < 5.5$, $5.5 \le M < 7.0$, $M \ge 7.0$).
* **Interaksi & Filter:**
  * Filter magnitudo cepat: `Semua`, `M2.5+`, `M4.5+`, `M6.0+`.
  * Daftar umpan gempa terbaru (*Live Feed*) yang dapat diurutkan berdasarkan **Terbaru** atau **Magnitudo Terbesar**.
  * Klik titik gempa di 3D atau di daftar untuk memicu *fly-to camera* dan membuka **Detail Sheet** berisi: Magnitudo, Nama Lokasi, Kedalaman ($\text{km}$), Waktu Kejadian (format lokal WIB/relatif), Koordinat, Status Peringatan Tsunami, serta tautan ke laporan resmi USGS.

### 3.3. Layer 2 — Pelacakan Stasiun Luar Angkasa Internasional (ISS Live)
* **Sumber Data:** Where The ISS At API (`https://api.wheretheiss.at/v1/satellites/25544`), di-*polling* otomatis setiap $5\text{ detik}$ (hanya saat layer ISS aktif dan tab browser terlihat).
* **Visualisasi 3D:**
  * Penanda satelit 3D melayang di atas permukaan Bumi pada ketinggian visual $R + h_{\text{iss}}$.
  * Jejak lintasan (*orbital trail*) yang menunjukkan jalur pergerakan ISS selama beberapa titik pembaruan terakhir, disertai cincin proyeksi jangkauan (*footprint*) halus di permukaan Bumi tepat di bawah ISS.
* **Interaksi:**
  * Tombol cepat **"Fokus / Ikuti ISS"** agar kamera mengunci dan mengikuti pergerakan ISS.
  * Panel detail menampilkan telemetri *real-time* (dengan angka `tabular-nums`): Lintang, Bujur, Ketinggian ($\text{km}$), Kecepatan ($\text{km/jam}$), dan status pencahayaan (`Siang / Daylight` atau `Gerhana / Eclipsed`).

### 3.4. Layer 3 — Rute Konektivitas & Penerbangan Global (3D Bézier Arcs)
* **Sumber Data:** Dataset lokal terkurasi berisi $12\text{--}16$ kota hub utama dunia (termasuk Jakarta, Singapura, Tokyo, Sydney, Dubai, London, Frankfurt, New York, San Francisco, São Paulo) beserta rute aktif antar hub.
* **Visualisasi 3D:**
  * Garis lengkung 3D melintasi atmosfer Bumi menggunakan kurva Bézier kuadratik (`THREE.QuadraticBezierCurve3`).
  * Animasi cahaya/partikel bergerak (*animated flowing pulse*) di sepanjang lengkungan dari kota asal ke tujuan menggunakan shader atau animasi `BufferGeometry` ringan.
  * Penanda titik hub bercahaya di permukaan Bumi.
* **Interaksi:**
  * Toggle nyala/mati layer rute, plus kemampuan klik hub/rute untuk melihat jarak geodesik ($\text{km}$), estimasi latensi jaringan / waktu tempuh, dan daftar koneksi terkait.

### 3.5. Pencarian, Kontrol Layer, & Ketahanan Data
* **Pencarian Lokasi Cepat:** Kotak pencarian global yang memfilter nama wilayah gempa dan daftar kota hub secara instan; memilih hasil langsung mengarahkan kamera (*fly-to*).
* **Toggle Layer Independen:** Pengguna dapat mengombinasikan layer apa saja secara bebas (`Gempa`, `ISS`, `Rute`).
* **Indikator Status & Fallback Data:**
  * Menampilkan indikator status koneksi (`Live` dengan titik hijau berdenyut, `Memuat...`, atau `Mode Cadangan`).
  * Jika fetch API gagal, *timeout* ($> 8\text{ detik}$), atau terkena *rate limit*, sistem otomatis menggunakan *snapshot* data lokal agar demo tetap berjalan utuh tanpa layar kosong.

---

## 4. Arsitektur Teknis & Matematika Inti

### 4.1. Struktur Folder Proyek (Next.js App Router — Root Level)
Mengikuti struktur hasil instalasi proyek tanpa folder `src/`:

```text
earth-live-globe/
├── PRD.md                    # Dokumen spesifikasi produk ini
├── SYSTEM_DESIGN.md          # Dokumen desain UI/UX Apple Fluid Glass
├── AGENTS.md                 # Panduan aturan arsitektur untuk AI coding agent
├── public/
│   └── data/                 # Aset ringan (mis. GeoJSON/TopoJSON peta dunia atau tekstur)
├── app/
│   ├── layout.tsx            # Konfigurasi font, metadata, dan ThemeProvider
│   ├── page.tsx              # Komposisi utama GlobeCanvas + HUD + Panel
│   └── globals.css           # Design tokens Dark/Light, efek Fluid Glass, animasi CSS
├── components/
│   ├── GlobeCanvas.tsx       # Engine Three.js ('use client'), terisolasi dari re-render React
│   ├── TopCapsule.tsx        # HUD atas (brand, live badge, search, theme toggle)
│   ├── LayerDock.tsx         # Dock mengambang bawah untuk toggle layer & kontrol kamera
│   ├── FeedPanel.tsx         # Drawer kiri (desktop) / tab sheet (mobile) untuk daftar gempa & filter
│   ├── DetailSheet.tsx       # Panel detail gempa/ISS/rute (kanan desktop, bottom sheet HP)
│   └── StatusOverlays.tsx    # Layar loading awal & fallback jika WebGL tidak didukung
├── lib/
│   ├── geo.ts                # Konversi koordinat bola, jarak Haversine, generator kurva Bézier 3D
│   ├── earthTexture.ts       # Generator kanvas tekstur Bumi akurat (Dark & Light) dari data peta
│   ├── api.ts                # Fetcher USGS & ISS + timeout + fallback otomatis
│   └── types.ts              # Definisi interface TypeScript ketat
└── data/
    ├── routes.ts             # Data kota hub global & rute konektivitas
    └── fallbackData.ts       # Snapshot gempa & posisi ISS cadangan jika offline
```

### 4.2. Pemisahan State React vs Render Loop Three.js
* **Aturan Kritis:** `requestAnimationFrame` berjalan murni di dalam `useEffect` milik `GlobeCanvas.tsx` dengan seluruh state mutabel animasi disimpan di `useRef`. **Dilarang** memanggil `setState` di dalam loop animasi agar tidak memicu *re-render* React 60 kali per detik.
* Perubahan props dari React (filter gempa, layer aktif, target *fly-to*, perubahan tema `dark`/`light`) disinkronkan ke instance Three.js melalui `useEffect` khusus yang hanya memperbarui objek 3D yang terdampak.

### 4.3. Rumus Geospasial 3D (`lib/geo.ts`)
1. **Konversi Geografis $(\text{lat}, \text{lon})$ ke Kartesius $(x, y, z)$:**
   Selaras dengan pemetaan UV `THREE.SphereGeometry` standar untuk bola berjari-jari $R$:
   $$\phi = (90 - \text{lat}) \cdot \frac{\pi}{180}, \qquad \theta = (\text{lon} + 180) \cdot \frac{\pi}{180}$$
   $$x = -R \sin(\phi)\cos(\theta), \qquad y = R \cos(\phi), \qquad z = R \sin(\phi)\sin(\theta)$$

2. **Titik Kontrol Kurva Bézier 3D (Arcs):**
   Untuk dua titik di permukaan Bumi $\mathbf{P}_0$ dan $\mathbf{P}_2$ dengan jarak sudut $\alpha = \arccos\!\left(\frac{\mathbf{P}_0 \cdot \mathbf{P}_2}{R^2}\right)$, vektor tengah yang dinormalisasi $\hat{\mathbf{M}} = \frac{\mathbf{P}_0 + \mathbf{P}_2}{\|\mathbf{P}_0 + \mathbf{P}_2\|}$ didorong keluar sesuai panjang rute:
   $$\mathbf{P}_1 = \hat{\mathbf{M}} \cdot \left(R + h_{\min} + k \cdot \alpha\right)$$
   di mana $h_{\min}$ adalah ketinggian minimum lengkungan di atas permukaan Bumi dan $k$ adalah faktor skala kelengkungan.

3. **Jarak Geodesik (Haversine):**
   $$d = 2 R_{\oplus} \arcsin\!\left(\sqrt{\sin^2\!\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\!\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   dengan $R_{\oplus} = 6371\text{ km}$.

---

## 5. Persyaratan Non-Fungsional (NFR)

* **Performa & Efisiensi Memori:**
  * Target $60\text{ FPS}$ pada desktop dan minimal $30\text{--}60\text{ FPS}$ stabil pada perangkat mobile kelas menengah.
  * `pixelRatio` dibatasi adaptif: $\min(\text{devicePixelRatio}, 1.5)$ untuk mobile dan $\min(\text{devicePixelRatio}, 2.0)$ untuk desktop.
  * **Zero-allocation** di dalam `animate()` (daur ulang seluruh `THREE.Vector3`, `THREE.Matrix4`, dan `THREE.Color` pembantu di luar loop).
  * Loop animasi dan *polling* ISS otomatis berhenti saat tab disembunyikan (`document.visibilitychange`).
  * Cleanup lengkap (`dispose()` pada semua geometry, material, texture, renderer, serta `removeEventListener`) saat komponen di-*unmount*.
* **Responsivitas Lintas Perangkat:**
  * Viewport penuh $100\text{dvh} \times 100\text{vw}$ tanpa scrollbar halaman, dengan dukungan `env(safe-area-inset-*)`.
  * Mode khusus untuk Desktop ($\ge 1024\text{ px}$), Tablet ($769\text{--}1023\text{ px}$), Mobile Portrait ($\le 768\text{ px}$), dan Mobile Landscape ($\text{max-height}: 520\text{ px}$).
* **Aksesibilitas & Keamanan:**
  * Mematuhi rasio kontras teks minimal $4.5:1$ (WCAG AA) pada Dark Mode maupun Light Mode.
  * Mendukung navigasi keyboard (`Esc` tutup panel, `R` reset kamera, `/` fokus pencarian, `Space` toggle auto-rotate) dan `prefers-reduced-motion`.
  * Deteksi WebGL sebelum inisialisasi dengan tampilan *fallback* informatif.

---

## 6. Roadmap Implementasi Bertahap (Anti-Bug)

Untuk menjaga kualitas kode saat dikerjakan bersama AI coding agent (OpenCode), implementasi dibagi ke dalam 4 fase berurutan:

1. **Fase 1 — Fondasi, Tema, & Globe 3D Akurat:** Setup `globals.css` (Design Tokens Dark/Light + Apple Fluid Glass), `lib/types.ts`, `lib/geo.ts`, `lib/earthTexture.ts`, dan `components/GlobeCanvas.tsx` (Bumi akurat + atmosfer + bintang/studio background + transisi tema + kontrol kamera).
2. **Fase 2 — Layer Data Real-Time & Visualisasi 3D:** Implementasi `lib/api.ts` (USGS + ISS + fallback), `data/routes.ts`, rendering `InstancedMesh` gempa, marker + lintasan ISS, dan kurva Bézier 3D bercahaya.
3. **Fase 3 — UI Apple Fluid Glass & Interaktivitas:** Pembuatan `TopCapsule.tsx`, `LayerDock.tsx`, `FeedPanel.tsx`, `DetailSheet.tsx`, pencarian cepat, *fly-to camera*, dan *fluid bottom sheet* mobile.
4. **Fase 4 — Polish, Audit Performa, & Verifikasi Lintas Viewport:** Uji `npm run build` + `tsc --noEmit`, verifikasi Dark/Light mode di desktop, HP portrait (`390x844`), dan HP landscape (`844x390`), serta uji mode *offline fallback*.