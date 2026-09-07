# Plan: Aplikasi Kasir Sederhana (Simple POS Prototype)

## Intent Summary
Membangun prototipe high-fidelity aplikasi kasir (Point of Sale) sederhana yang berjalan di desktop web. Antarmuka harus intuitif, responsif, dan memungkinkan pengguna untuk menambahkan item ke keranjang, menghitung total, serta memproses transaksi secara cepat.

---

## 1. Users & Context

- **Pengguna Utama**: Kasir toko retail, warung, atau UMKM.
- **Tingkat Keahlian**: Pemula hingga menengah, memerlukan antarmuka yang sangat jelas dan minim langkah.
- **Konteks Penggunaan**: Penggunaan harian dengan volume transaksi tinggi, biasanya dengan layar sentuh atau mouse/keyboard.
- **Goals**: Proses checkout cepat, minim kesalahan, dan kemudahan navigasi.

---

## 2. Key Jobs-to-be-Done

1. **Tambah Produk ke Keranjang**: Pengguna dapat mencari/memilih produk dan menambahkannya ke daftar belanja dengan cepat.
2. **Atur Kuantitas & Hapus Item**: Pengguna dapat menambah/mengurangi jumlah item atau menghapusnya dari keranjang.
3. **Lihat Ringkasan Total**: Keranjang harus menampilkan subtotal, diskon (jika ada), dan total akhir secara real-time.
4. **Proses Pembayaran**: Simulasi input pembayaran (tunai/kartil) dan perhitungan kembalian.
5. **Cetak Struk / Selesaikan Transaksi**: Tombol aksi final untuk menyelesaikan pembelian dan mereset keranjang.
6. **Impor Produk via CSV**: Admin dapat menambahkan banyak produk sekaligus lewat file CSV.
7. **Scan Barcode**: Kasir dapat memindai barcode produk untuk cepat masuk ke keranjang.

---

## 3. Screens & Layout Structure

### Screen 1: Main POS Interface (Dashboard Kasir)
- **Layout**: Two-pane layout (Sidebar kiri + Area utama kanan).
- **Left Pane (Keranjang / Cart)**:
  - Header: Nomor transaksi / tanggal.
  - Daftar item yang dipilih (Nama, Qty, Harga Satuan, Subtotal).
  - Kontrol Qty (+/-) dan tombol hapus per item.
  - Footer ringkasan: Subtotal, Pajak, Total.
  - Tombol aksi besar: `Bayar`.
- **Right Pane (Katalog Produk)**:
  - Header: Search bar + Filter Kategori (Tab/Chip).
  - Grid kartu produk: Gambar, Nama, Harga.
  - Scrollable area untuk daftar produk.

### Screen 2: Checkout / Payment Modal
- **Trigger**: Klik tombol `Bayar`.
- **Layout**: Overlay modal di tengah layar.
- **Konten**:
  - Total yang harus dibayar.
  - Input jumlah uang diterima.
  - Pilihan metode pembayaran (Tunai, Kartu Debit, QRIS).
  - Perhitungan otomatis kembalian.
  - Tombol `Proses Pembayaran` dan `Batal`.

---

## 4. Component & State Requirements

### Components
- **ProductCard**: Menampilkan produk dengan gambar placeholder, nama, dan harga.
- **CartItemRow**: Baris item di keranjang dengan kontrol kuantitas.
- **CategoryFilter**: Tab atau chip untuk menyaring produk.
- **SearchBar**: Input pencarian produk.
- **SummaryPanel**: Panel ringkasan harga di footer keranjang.
- **PaymentModal**: Modal untuk proses pembayaran.

### State Management (React)
- `cartItems`: Array of objects `{ id, name, price, quantity }`.
- `products`: Array data produk dummy.
- `categories`: Array kategori dummy.
- `searchQuery`: String untuk filter pencarian.
- `selectedCategory`: String ID kategori aktif.
- `isPaymentModalOpen`: Boolean.
- `paymentAmount`: Number.

---

## 5. Interaction Rules & Flows

### Primary Flow: Menambah Produk dan Checkout
1. Pengguna melihat grid produk di panel kanan.
2. Pengguna mengklik kartu produk.
3. Produk ditambahkan ke panel keranjang kiri (qty default 1). Jika sudah ada, qty +1.
4. Total di footer keranjang di-update secara real-time.
5. Pengguna dapat menambah/mengurangi qty di keranjang.
6. Pengguna klik `Bayar`.
7. Modal pembayaran muncul.
8. Pengguna masukkan jumlah uang atau pilih metode.
9. Sistem menghitung kembalian otomatis.
10. Klik `Selesai` → Modal tutup, keranjang kosong, transaksi baru dimulai.

### Secondary Flow: Pencarian & Filter
- Ketik di search bar → filter produk real-time.
- Klik kategori chip → filter produk berdasarkan kategori.

---

## 6. Data / Content Model (Dummy Data)

**Products (15-20 items):**
- Kategori: Makanan, Minuman, Snack, Keperluan Rumah Tangga.
- Fields: `id`, `name`, `category`, `price`.

**Contoh:**
- Indomie Goreng (Makanan) - Rp 3.500
- Aqua 600ml (Minuman) - Rp 4.000
- Chocolatos (Snack) - Rp 2.000
- Sabun Lifebuoy (RT) - Rp 5.000

---

## 7. Visual System Notes

- **Design Direction**: Human / Approachable — bersih, ramah, dan mudah dipahami. Hindari nuansa "enterprise" yang kaku.
- **Color Palette**: Gunakan palet cerah namun tidak mencolok. Hijau sebagai warna aksen untuk aksi positif (Bayar, Tambah). Merah untuk hapus/batal.
- **Typography**: Font sans-serif yang jelas dan mudah dibaca (misal: system-ui atau 'Segoe UI').
- **Layout**: Manfaatkan full width desktop. Touch target minimal 44px.
- **Imagery**: Gunakan placeholder `.ph-img` atau ikon sederhana untuk produk.

---

## 8. Responsive Considerations

- **Desktop**: Layout two-pane optimal (Sidebar 40% + Grid 60%).
- **Tablet**: Layout tetap two-pane tetapi grid produk mengurangi kolom.
- **Mobile (Opsional)**: Stack vertikal (Keranjang di atas, Produk di bawah, atau gunakan Tab switching).

---

## 9. Acceptance Checks

- [ ] Pengguna dapat menambahkan produk ke keranjang dengan satu klik.
- [ ] Kuantitas item di keranjang dapat diubah (+/-) dan dihapus.
- [ ] Total harga dihitung dengan benar secara real-time.
- [ ] Modal pembayaran muncul dan menghitung kembalian dengan benar.
- [ ] Tidak ada elemen yang saling tumpang tindih (overlap).
- [ ] Teks dan tombol memiliki kontras yang cukup.
- [ ] Semua tombol aksi utama memiliki status hover dan fokus yang jelas.
- [ ] Aplikasi dapat menangani transaksi baru setelah pembayaran selesai (reset state).

---

## 10. Open Questions / TODO

- [ ] Apakah perlu fitur manajemen stok sederhana (mengecek stok tersedia)?
- [ ] Apakah perlu fitur riwayat transaksi (daftar transaksi hari ini)?
- [ ] Apakah ada kebutuhan khusus dari gambar referensi yang belum tercakup?

### 10.1 CSV Import

- [ ] Admin dapat upload file CSV dengan format: `SKU,Nama,Harga,Kategori,Stok`
- [ ] Sistem parse baris per baris, validasi tiap field
- [ ] Error baris tertentu tidak batalkan seluruh import (skip + report)
- [ ] Progress indicator saat proses
- [ ] Duplikat SKU → skip dengan warning, bukan error total

### 10.2 Barcode Scanning

- [ ] Input field menerima scan barcode (keyboard-emulated input)
- [ ] Otomatis cari produk by SKU/Barcode setelah input
- [ ] Tambah ke keranjang langsung setelah match
- [ ] Visual feedback: highlight produk yang discan

### 10.3 Open Questions

- [ ] Format CSV spesifik (delimiter, encoding)?
- [ ] Barcode format support (Code128, QR, EAN-13)?
- [ ] Scanner hardware vs kamera mobile?

---

## Next Step

Silakan tinjau dokumen rencana ini. Jika ada bagian yang perlu disesuaikan atau ditambahkan, beritahu saya. Setelah rencana disetujui, saya akan lanjut ke **Design mode** untuk membangun prototipe HTML interaktifnya.
