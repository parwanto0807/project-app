import { connectDB } from './config/db.js';
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';

// 1️⃣ Buat HTTP server untuk Express
const server = http.createServer(app);

// 2️⃣ Buat Socket.IO server
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // alamat frontend
    methods: ["GET", "POST"],
  },
});

// 3️⃣ Event ketika client terkoneksi
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 4️⃣ Jalankan koneksi database dulu, baru server
connectDB()
  .then(() => {
    server.listen(5000, () => {
      console.log("✅ Server + Socket.IO running on port 5000");
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
    process.exit(1);
  });
