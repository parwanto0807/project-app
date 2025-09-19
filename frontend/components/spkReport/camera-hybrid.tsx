"use client";
import { useRef, useState } from "react";

export default function CameraUpload({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);

  // Fallback: buka kamera belakang
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }, // 👈 kamera belakang
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch (err) {
      console.error("Tidak bisa akses kamera belakang:", err);
    }
  };

  // Ambil snapshot dari kamera
  const takePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      }
    }, "image/jpeg");
  };

  return (
    <div className="space-y-3">
      {/* Input standar: kamera/galeri */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="border p-2 rounded"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
        }}
      />

      {/* Fallback: kamera langsung */}
      {!streaming && (
        <button
          onClick={openCamera}
          className="px-4 py-2 bg-green-500 text-white rounded shadow"
        >
          Buka Kamera Belakang
        </button>
      )}

      {streaming && (
        <div className="space-y-2">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded border" />
          <button
            onClick={takePhoto}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow"
          >
            Ambil Foto
          </button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
