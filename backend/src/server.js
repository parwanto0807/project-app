import { connectDB } from './config/db.js'; // Pastikan koneksi database Anda ada
import  app  from './app.js';

// Cek koneksi database dan jalankan server
connectDB()
  .then(() => {
    app.listen(5000, () => {
      console.log('Server is running on port 5000');
    });
  })
  .catch(err => {
    console.log('Database connection failed:', err);
    process.exit(1); // Keluar jika gagal koneksi database
  });
