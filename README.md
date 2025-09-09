# Aplikasi Manajemen Restoran

Sistem manajemen restoran lengkap dengan fitur admin dan kasir, dibangun menggunakan React, TypeScript, dan Supabase.

## Fitur Utama

### Admin
- **Dashboard**: Ringkasan penjualan, stok menipis, grafik penjualan
- **Inventori**: Manajemen stok bahan baku (masuk, keluar, stok saat ini)
- **Menu**: Manajemen menu makanan/minuman dengan upload foto
- **Supplier**: Manajemen data supplier bahan baku
- **Transaksi**: Riwayat transaksi penjualan
- **Laporan**: Laporan inventori dan penjualan (harian, mingguan, bulanan)
- **Pengguna**: Manajemen kasir dan hak akses

### Kasir
- **Kasir**: Sistem POS untuk transaksi penjualan
- **Laporan**: Laporan transaksi personal kasir
- **Cetak Struk**: Generate receipt dalam format PDF

## Teknologi

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: React Context
- **Routing**: React Router
- **UI Components**: Lucide React Icons
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Notifications**: React Hot Toast

## Setup Development

1. Clone repository
2. Install dependencies: `npm install`
3. Setup Supabase:
   - Buat project baru di [supabase.com](https://supabase.com)
   - Copy URL dan Anon Key ke file `.env`
   - Jalankan migration SQL untuk membuat database schema
4. Jalankan development server: `npm run dev`

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

Database menggunakan PostgreSQL dengan Row Level Security (RLS) dan terdiri dari tabel:

- `users` - Data pengguna (admin/kasir)
- `suppliers` - Data supplier
- `ingredients` - Bahan baku
- `categories` - Kategori menu
- `menus` - Menu makanan/minuman
- `menu_ingredients` - Relasi menu dengan bahan baku
- `stock_movements` - Riwayat pergerakan stok
- `transactions` - Data transaksi
- `transaction_items` - Item dalam transaksi

## Akun Demo

Untuk testing, gunakan akun demo berikut:

- **Admin**: admin@restaurant.com / admin123
- **Kasir**: cashier@restaurant.com / cashier123

*Note: Anda perlu membuat akun ini secara manual di Supabase Auth atau menggunakan sistem registrasi yang akan dikembangkan.*

## Fitur Keamanan

- Row Level Security (RLS) untuk semua tabel
- Role-based access control (admin/kasir)
- Authentication menggunakan Supabase Auth
- Data isolation berdasarkan role pengguna

## Responsive Design

Aplikasi fully responsive dengan breakpoint:
- Mobile: <768px
- Tablet: 768px-1024px  
- Desktop: >1024px

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License