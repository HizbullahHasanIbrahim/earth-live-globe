<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# Project Instructions — Interactive 3D Earth & Live Data Globe

## 1. Sumber Kebenaran (Wajib Dibaca Sebelum Coding)
- Selalu baca `PRD.md` (spesifikasi fungsional, data API, matematika 3D) dan `SYSTEM_DESIGN.md` (tema Apple Fluid Glass, Dark/Light Mode, responsivitas) sebelum membuat atau mengubah file.
- Jangan mengarang struktur folder sendiri: proyek ini menggunakan **Next.js App Router TANPA folder `src/`** (`app/`, `components/`, `lib/`, `data/` langsung di root).

## 2. Aturan Teknis Wajib
- **Isolasi 3D dari React:** Seluruh loop `requestAnimationFrame`, `OrbitControls`, dan `Raycaster` wajib berada di dalam komponen `'use client'` memakai `useRef` & `useEffect`. **DILARANG** memicu React `setState` di dalam loop animasi 60 FPS.
- **Zero-Allocation & Cleanup:** Deklarasikan vektor pembantu `THREE.Vector3` di luar loop animasi. Wajib lakukan `dispose()` pada geometry, material, texture, renderer, dan hapus semua event listener di fungsi cleanup `useEffect`.
- **Multi-Touch & Mobile First:** Gunakan pelacakan `Set` (`activePointers`) + `pointercancel` untuk membedakan *pinch-zoom* dan *tap* (`< 6px`). Pastikan seluruh tombol mobile memiliki *touch target* minimal `44x44px` dan mendukung `100dvh` + `env(safe-area-inset-*)`.
- **Anti-Shortcut:** Dilarang meninggalkan komentar placeholder/stub (misal `// TODO` atau tombol yang tidak berfungsi).
- **Komentar Kode:** Sertakan komentar singkat berbahasa Indonesia pada bagian konversi koordinat geografis (`lat/lon -> xyz`), kurva Bézier 3D, shader/tekstur, dan logika kamera *fly-to*.

## 3. Verifikasi Wajib Sebelum Melaporkan Selesai
Setiap kali selesai mengerjakan satu fase, WAJIB jalankan perintah berikut dan pastikan 0 error sebelum melapor:
1. `npx tsc --noEmit` (memastikan 0 error TypeScript)
2. `npm run lint` (memastikan 0 error ESLint)
3. Cek di browser bahwa tidak ada error console/WebGL dan mode Dark/Light berfungsi mulus.
<!-- END:nextjs-agent-rules -->
