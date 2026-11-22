# System Design & UI/UX Specification
## Apple Fluid Glass — Dual Theme (Dark & Light Mode)

**Arah Visual:** *Spatial Minimalism* terinspirasi dari Apple visionOS, macOS, dan iOS Liquid Glass  
**Karakter Utama:** Permukaan kaca transparan berlapis dengan *specular edge highlight*, sudut membulat harmonis (*continuous squircle feel*), tipografi presisi, dan transisi cair berbasis fisika pegas (*fluid spring motion*).

---

## 1. Filosofi Desain

Antarmuka dirancang dengan tiga prinsip utama agar data kompleks tetap terasa ringan dan premium:

1. **Deference (Bumi 3D Adalah Pusat Perhatian):** Seluruh elemen UI melayang sebagai kapsul dan lembaran kaca tipis (*floating glass surfaces*) dengan transparansi tinggi. Minimal $65\%$ area layar pada desktop dan $55\%$ pada HP harus selalu memperlihatkan Bumi 3D.
2. **Fluidity (Gerakan Cair & Organik):** Tidak ada kemunculan mendadak atau potongan kaku. Indikator tab/filter meluncur seperti cairan (*sliding fluid pill*), kapsul atas memuai dan menyusut halus (*morphing capsule*), dan panel detail masuk dengan kurva pegas lembut.
3. **Clarity in Both Worlds (Dual Theme Terintegrasi 3D):** Beralih antara **Dark Mode** dan **Light Mode** bukan sekadar membalik warna kartu UI, melainkan mengubah seluruh suasana ruang—termasuk warna latar belakang, pencahayaan, material Bumi 3D, dan pendar atmosfernya.

---

## 2. Sistem Warna & Material (Design Tokens)

Seluruh warna diatur menggunakan CSS Custom Properties pada `:root` (default Dark Mode atau mengikuti `prefers-color-scheme`) dan `[data-theme="light"]` / `[data-theme="dark"]` di `app/globals.css`.

### 2.1. Dark Mode — *Deep Orbital Glass*
Nuansa observatorium luar angkasa modern: hitam kebiruan mendalam, kaca gelap jernih dengan tepian kilau tipis (*specular border*), dan aksen biru sistem Apple.

| Token CSS | Nilai | Penggunaan |
| :--- | :--- | :--- |
| `--bg-canvas` | `#03060f` | Latar belakang dasar viewport & ruang angkasa 3D |
| `--glass-surface` | `rgba(18, 24, 38, 0.58)` | Kapsul HUD atas, dock bawah, dan tombol melayang |
| `--glass-surface-elevated` | `rgba(15, 21, 34, 0.76)` | Panel Feed & Detail Sheet agar teks panjang mudah dibaca |
| `--glass-hover` | `rgba(255, 255, 255, 0.10)` | State hover tombol & item daftar |
| `--glass-active-pill` | `rgba(255, 255, 255, 0.16)` | Pil cair (*fluid pill*) pada tab/segmented control aktif |
| `--glass-border` | `rgba(255, 255, 255, 0.14)` | Garis tepi kaca halus |
| `--glass-specular` | `rgba(255, 255, 255, 0.28)` | Kilau *inner top highlight* 1px ala kaca Apple |
| `--text-primary` | `#f5f7fa` | Judul, nama lokasi, dan nilai metrik utama |
| `--text-secondary` | `#9aa7bc` | Label sekunder, timestamp, dan deskripsi pendukung |
| `--text-tertiary` | `#64748b` | Placeholder input dan catatan skala |
| `--accent-primary` | `#0a84ff` | Aksen interaktif utama (Apple System Blue Dark) |
| `--accent-soft` | `rgba(10, 132, 255, 0.20)` | Latar belakang chip/tombol aktif |
| `--shadow-glass` | `0 20px 50px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)` | Bayangan kedalaman panel melayang |

### 2.2. Light Mode — *Frosted Daylight Studio*
Nuansa studio peta editorial ala Apple Maps / Weather siang hari: gradien mutiara-langit cerah, kaca buram putih susu (*frosted crystal*), dan bayangan lembut berwarna biru abu-abu.

| Token CSS | Nilai | Penggunaan |
| :--- | :--- | :--- |
| `--bg-canvas` | `#edf2f9` | Latar dasar studio (dengan gradien radial `#f8fafc` ke `#dce6f5`) |
| `--glass-surface` | `rgba(255, 255, 255, 0.62)` | Kapsul HUD atas, dock bawah, dan tombol melayang |
| `--glass-surface-elevated` | `rgba(255, 255, 255, 0.80)` | Panel Feed & Detail Sheet |
| `--glass-hover` | `rgba(15, 23, 42, 0.06)` | State hover tombol & item daftar |
| `--glass-active-pill` | `rgba(255, 255, 255, 0.92)` | Pil cair aktif (dengan bayangan mikro lembut) |
| `--glass-border` | `rgba(15, 23, 42, 0.09)` | Garis tepi halus untuk pemisah permukaan terang |
| `--glass-specular` | `rgba(255, 255, 255, 0.88)` | Kilau putih terang di tepi atas kaca |
| `--text-primary` | `#0f172a` | Judul, nama lokasi, dan angka utama |
| `--text-secondary` | `#475569` | Label sekunder dan metadata |
| `--text-tertiary` | `#94a3b8` | Placeholder dan catatan kaki |
| `--accent-primary` | `#007aff` | Aksen interaktif utama (Apple System Blue Light) |
| `--accent-soft` | `rgba(0, 122, 255, 0.12)` | Latar belakang chip/tombol aktif |
| `--shadow-glass` | `0 18px 42px rgba(15, 23, 42, 0.10), 0 2px 8px rgba(15, 23, 42, 0.05)` | Bayangan lembut bebas kesan kotor |

### 2.3. Sinkronisasi Material 3D Globe (Dark vs Light)
Saat tombol tema diklik, `GlobeCanvas.tsx` mentransisikan properti scene 3D secara halus:

| Elemen 3D | Dark Mode | Light Mode |
| :--- | :--- | :--- |
| **Background Scene** | `#03060f` + GPU Twinkling Starfield | Transparan (memperlihatkan gradien studio CSS `#f8fafc` $\rightarrow$ `#dce6f5`) + bintang dinonaktifkan |
| **Permukaan Lautan Bumi** | Biru malam pekat (`#0a1628`) | Biru cerah editorial (`#6eb5ff` $\rightarrow$ `#3b82f6`) |
| **Daratan & Batas Benua** | Slate gelap (`#18253a`) dengan garis pantai lembut (`#3b82f6` 35%) + titik lampu kota hangat (`#ffd180`) | Putih hangat / sage terang (`#e8eef5` & `#dce8e0`) dengan garis pantai crisp (`#94a3b8`) |
| **Pendar Atmosfer (Fresnel/BackSide)** | Cyan-biru elektrik (`#38bdf8`, `AdditiveBlending`) | Biru langit lembut (`#60a5fa`, `NormalBlending` opasitas rendah) |
| **Garis Lengkung (Bézier Arcs)** | Cyan-indigo neon (`#38bdf8` $\rightarrow$ `#818cf8`) | Biru kobalt & ungu royal tajam (`#0284c7` $\rightarrow$ `#6366f1`) agar kontras di latar terang |

### 2.4. Warna Semantik Data (Konsisten di Kedua Tema)
* **Gempa Ringan ($M < 4.0$):** `#34c759` (Apple Green)
* **Gempa Menengah ($4.0 \le M < 5.5$):** `#ffcc00` (Dark) / `#d97706` (Light — sedikit lebih gelap agar terbaca di kaca putih)
* **Gempa Kuat ($5.5 \le M < 7.0$):** `#ff9f0a` (Apple Orange)
* **Gempa Besar ($M \ge 7.0$):** `#ff3b30` (Apple Red)
* **ISS Live Telemetry:** `#30d158` (status live) & `#5ac8fa` (jalur orbit)

---

## 3. Resep Material "Apple Fluid Glass"

Setiap panel utama menggunakan komposisi kaca berlapis agar terasa seperti material optik sungguhan (bukan sekadar kotak semi-transparan biasa):

```css
.fluid-glass {
  background: var(--glass-surface);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow:
    inset 0 1px 0 0 var(--glass-specular),
    var(--shadow-glass);
  transition:
    background-color 0.35s var(--ease-fluid),
    border-color 0.35s var(--ease-fluid),
    box-shadow 0.35s var(--ease-fluid),
    transform 0.35s var(--ease-spring);
}
```

### Efek Fluid Tambahan (Halus & Hemat GPU)
1. **Liquid Ambient Rim:** Pada panel aktif (seperti Detail Sheet atau kapsul pencarian yang terbuka), gunakan `::before` pseudo-element bergradien lembut (`radial-gradient`) yang berpindah posisi mengikuti kursor pada desktop (*pointer-reactive specular shimmer*) dengan opasitas maksimal $0.08$.
2. **Fluid Pill Morphing:** Kontrol bersegmen (filter magnitudo & toggle Dark/Light) menggunakan satu elemen latar belakang aktif (`indicator pill`) yang bergeser menggunakan `transform: translateX(...)` dan kurva pegas lembut sehingga perpindahan terasa cair menyatu.
3. **Organic Corner Radius:** Gunakan skala radius besar dan konsisten:
   * Kapsul & tombol pill: `9999px`
   * Panel besar & Detail Sheet: `24px` (desktop), `28px 28px 0 0` (bottom sheet HP)
   * Kartu item di dalam panel: `16px` (mengikuti aturan konsentris Apple: $R_{\text{inner}} = R_{\text{outer}} - \text{padding}$)

---

## 4. Tipografi & Hierarki Informasi

* **Font Family:**
  * Display / Heading: `'SF Pro Display', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
  * Body / UI: `'SF Pro Text', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
  * Data / Koordinat: `font-variant-numeric: tabular-nums` (wajib pada semua angka magnitudo, koordinat, kecepatan ISS, dan jumlah kejadian agar teks tidak bergetar saat nilai diperbarui).
* **Skala Tipografi:**
  * **App Title:** `1.05rem` (`17px`), `font-weight: 600`, `letter-spacing: -0.02em`
  * **Panel Headline (Nama Lokasi/Objek):** `1.25rem` (`20px`), `font-weight: 700`, `letter-spacing: -0.025em`
  * **Metric Hero (Angka Magnitudo / Kecepatan):** `1.75rem` (`28px`), `font-weight: 700`, `tabular-nums`
  * **Body Text:** `0.875rem` (`14px`), `line-height: 1.5`
  * **Caption / Eyebrow:** `0.75rem` (`12px`), `font-weight: 500`, `letter-spacing: 0.01em`

---

## 5. Sistem Gerakan (Motion & Spring Curves)

Seluruh animasi hanya menganimasikan properti GPU-friendly (`transform`, `opacity`, `backdrop-filter`).

| Nama Token | Kurva Easing | Durasi | Penggunaan |
| :--- | :--- | :--- | :--- |
| `--ease-fluid` | `cubic-bezier(0.22, 1, 0.36, 1)` | `320ms--420ms` | Panel masuk/keluar, *bottom sheet*, transisi tema |
| `--ease-spring` | `cubic-bezier(0.34, 1.45, 0.64, 1)` | `380ms` | Pergeseran *fluid pill* segmented control, ekspansi kapsul |
| `--ease-tactile` | `cubic-bezier(0.2, 0, 0, 1)` | `140ms` | Efek tekan tombol (`transform: scale(0.96)`) |

* **Aksesibilitas Gerakan (`prefers-reduced-motion: reduce`):** Menonaktifkan animasi *bounce*, memperpendek transisi menjadi *cross-fade* singkat (`100ms`), dan menghentikan denyut berulang serta *auto-rotate* default.

---

## 6. Anatomi Komponen & Tata Letak (Layout Blueprint)

### 6.1. Desktop ($\ge 1024\text{ px}$)
```text
┌──────────────────────────────────────────────────────────────────────┐
│  [ 🌍 TerraPulse • Live ]    [ 🔍 Cari lokasi/gempa... ]   [ 🌙/☀️ ]  │  ← Top Capsule (Fluid Morph)
│                                                                      │
│  ┌─────────────────┐                                ┌─────────────┐  │
│  │ Live Feed       │                                │ Detail      │  │
│  │ [Semua|4.5+|6+] │            (  🌍  )            │ Inspector   │  │
│  │ • M5.2 Jawa     │          3D Earth Globe        │ M5.2 • 18km │  │
│  │ • M4.8 Jepang   │                                │ [Lihat USGS]│  │
│  │ • M4.1 Chile    │                                └─────────────┘  │
│  └─────────────────┘                                                 │
│                                                                      │
│             [ Gempa • ISS • Rute  |  ↻ Putar  |  ↺ Reset ]           │  ← Floating Layer Dock
└──────────────────────────────────────────────────────────────────────┘
```

1. **Top Capsule (`TopCapsule.tsx`):** Melayang $16\text{ px}$ dari atas. Terdiri dari klaster kiri (logo + status *live* dengan titik hijau berdenyut), klaster tengah (kapsul pencarian yang memuai halus saat difokuskan lengkap dengan *dropdown* hasil kaca), dan klaster kanan (*fluid segmented toggle* Dark/Light Mode dengan ikon matahari/bulan).
2. **Feed Drawer (`FeedPanel.tsx`):** Melayang di sisi kiri (`width: 310px`, bisa dilipat menjadi tombol pil kecil `Feed (42)` agar kanvas bisa dilihat penuh). Berisi kontrol filter magnitudo bergaya *Apple segmented control* dan daftar kartu gempa yang bersih.
3. **Detail Inspector (`DetailSheet.tsx`):** Muncul melayang di sisi kanan (`width: 340px`) saat pengguna memilih titik gempa, ISS, atau hub rute. Menampilkan lencana magnitudo/status di bagian atas, grid metrik 2 kolom, dan tombol aksi cepat (mis. "Ikuti ISS" atau "Laporan USGS").
4. **Floating Layer Dock (`LayerDock.tsx`):** Melayang di tengah bawah ($20\text{ px}$ dari tepi), bergaya *dock* visionOS. Memuat tombol pil untuk 3 layer data (`Gempa`, `ISS`, `Rute`), pemisah vertikal tipis, tombol `Auto-Rotate`, dan tombol `Reset View`.

### 6.2. Mobile Portrait ($\le 768\text{ px}$)
* **Top Bar Ringkas:** Kapsul atas mengecil menjadi satu baris rapi: Logo/Status di kiri, tombol ikon Search (memuai jadi overlay input saat ditekan) & Theme Toggle di kanan. Seluruh target sentuh minimal `44px x 44px`.
* **Dock Bawah Kompak:** Mengambang di atas `env(safe-area-inset-bottom)` dengan 4–5 tombol ikon + label mikro yang pas dalam satu baris tanpa *overflow* horizontal.
* **Fluid Bottom Sheet (Feed & Detail):**
  * Feed gempa tidak tampil permanen agar layar HP lega; dibuka lewat tombol pil `Feed Gempa` di dock/atas.
  * Detail Sheet & Feed muncul dari bawah sebagai *iOS-style Bottom Sheet* dengan tinggi maksimal `48dvh`, memiliki *grabber pill* (`36px x 4px`) di atas, `overscroll-behavior: contain`, dan otomatis menyembunyikan dock saat sheet terbuka (atau bertumpuk rapi dengan `z-index` lebih tinggi) agar tidak pernah saling menabrak.

### 6.3. Mobile Landscape ($\text{max-height}: 520\text{ px}$)
* **Aturan Kritis:** Media query ditulis `@media (max-height: 520px)` **tanpa** pembatasan `max-width: 768px` agar aktif di semua HP modern berlayar lebar saat diputar miring.
* Panel detail otomatis beralih dari *bottom sheet* menjadi panel kanan ringkas (`width: min(310px, 42vw)`, tinggi penuh dengan margin `10px`), dan dock bawah mengecil di sisi kiri bawah agar bagian tengah Bumi 3D tetap terbuka penuh.

---

## 7. Checklist Kualitas UI Sebelum Rilis

1. **Transisi Tema Bebas Kedip (No FOUC):** Tema tersimpan di `localStorage` dan diterapkan secepat mungkin pada `<html>` (`data-theme="dark" | "light"`), dengan transisi halus pada UI dan material Bumi 3D.
2. **Kontras di Kedua Mode:** Semua teks, ikon `lucide-react`, garis orbit, dan *arc* tetap terbaca tajam di Dark Mode maupun Light Mode.
3. **Kaca Optik Asli:** Seluruh permukaan kaca menyertakan `backdrop-filter` sekaligus `-webkit-backdrop-filter` agar efek *frosted glass* berjalan mulus di Safari/iOS.
4. **Zero Overlap:** Tidak ada elemen HUD yang saling bertabrakan pada ukuran `1440x900`, `768x1024`, `390x844`, dan `844x390`.