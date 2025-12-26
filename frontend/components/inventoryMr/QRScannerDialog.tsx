"use client"

import * as React from "react"
import jsQR from "jsqr"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, X, CheckCircle, XCircle, Loader2, ScanLine, Copy } from "lucide-react"
import { toast } from "sonner"



interface QRScannerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onScanSuccess: (data: string) => void
    expectedToken?: string
    title?: string
    description?: string
}

export const QRScannerDialog: React.FC<QRScannerDialogProps> = ({
    open,
    onOpenChange,
    onScanSuccess,
    expectedToken,
    title = "Scan QR Code",
    description = "Arahkan kamera ke QR Code untuk melakukan scan"
}) => {
    const [cameraActive, setCameraActive] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState(false)
    const [scannedData, setScannedData] = React.useState<string | null>(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const streamRef = React.useRef<MediaStream | null>(null)
    const cleanupTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
    const scanningRef = React.useRef<number | null>(null)

    const stopCamera = React.useCallback(() => {
        console.log("Stopping camera...")

        // Stop scanning loop
        if (scanningRef.current) {
            cancelAnimationFrame(scanningRef.current)
            scanningRef.current = null
        }

        // Clear any pending timeouts
        if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current)
            cleanupTimeoutRef.current = null
        }

        // Stop all media tracks
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach(track => {
                    console.log("Stopping track:", track.kind)
                    track.stop()
                })
            } catch (err) {
                console.error("Error stopping tracks:", err)
            }
            streamRef.current = null
        }

        // Clear video element
        if (videoRef.current) {
            try {
                videoRef.current.pause()
                videoRef.current.srcObject = null
            } catch (err) {
                console.error("Error clearing video:", err)
            }
        }

        setCameraActive(false)
        console.log("Camera stopped")
    }, [])

    const startCamera = async () => {
        try {
            setError(null)
            console.log("Starting camera...")

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
                setCameraActive(true)
                console.log("Camera started successfully")
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.")
            setCameraActive(false)
        }
    }

    const handleManualInput = () => {
        const input = prompt("Masukkan token QR Code secara manual:")
        if (input) {
            handleScanResult(input)
        }
    }

    const handleScanResult = (data: string) => {
        setScannedData(data)

        if (expectedToken) {
            if (data === expectedToken) {
                setSuccess(true)
                setError(null)

                // Stop camera immediately on success
                stopCamera()

                cleanupTimeoutRef.current = setTimeout(() => {
                    onScanSuccess(data)
                    handleClose()
                }, 1500)
            } else {
                setError("QR Code tidak sesuai dengan MR yang dipilih!")
                setSuccess(false)
            }
        } else {
            setSuccess(true)

            // Stop camera immediately on success
            stopCamera()

            cleanupTimeoutRef.current = setTimeout(() => {
                onScanSuccess(data)
                handleClose()
            }, 1000)
        }
    }

    const scanQRCode = React.useCallback(() => {
        if (!videoRef.current || !canvasRef.current) {
            return
        }

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (!context) {
            return
        }

        // Check if video is ready
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Get image data from canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

            // Scan for QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            })

            if (code) {
                console.log("QR Code detected:", code.data)
                handleScanResult(code.data)
                return // Stop scanning after successful detection
            }
        }

        // Continue scanning
        scanningRef.current = requestAnimationFrame(scanQRCode)
    }, [handleScanResult])

    const handleClose = React.useCallback(() => {
        console.log("Closing dialog...")

        // Stop camera first
        stopCamera()

        // Reset all states
        setError(null)
        setSuccess(false)
        setScannedData(null)
        setCameraActive(false)

        // Close dialog
        onOpenChange(false)
    }, [stopCamera, onOpenChange])

    // Start scanning when camera is active
    React.useEffect(() => {
        if (cameraActive && !success) {
            console.log("Starting QR code scanning...")
            scanQRCode()
        }
    }, [cameraActive, success, scanQRCode])

    // Cleanup on unmount or when dialog closes
    React.useEffect(() => {
        if (!open) {
            stopCamera()
            // Reset states when closed
            setError(null)
            setSuccess(false)
            setScannedData(null)
            setCameraActive(false)
        }

        return () => {
            console.log("Component unmounting, cleaning up...")
            stopCamera()
        }
    }, [open, stopCamera])

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-2xl"
                onEscapeKeyDown={(e) => {
                    e.preventDefault()
                    handleClose()
                }}
                onPointerDownOutside={(e) => {
                    e.preventDefault()
                    handleClose()
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {/* Expected Token Display */}
                {expectedToken && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-700 mb-1">Token yang Diharapkan:</p>
                                <div className="bg-white rounded-lg px-4 py-2 border border-blue-200 flex items-center justify-between gap-2">
                                    <p className="font-mono font-bold text-blue-700 text-lg tracking-wide break-all">
                                        {expectedToken}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 shrink-0"
                                        onClick={() => {
                                            navigator.clipboard.writeText(expectedToken);
                                            toast.success("Token berhasil disalin!");
                                        }}
                                        title="Salin Token"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 ml-11">
                            Pastikan QR Code yang di-scan menghasilkan token yang sama dengan di atas
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Camera Preview */}
                    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                        />

                        {/* Hidden canvas for QR code scanning */}
                        <canvas ref={canvasRef} className="hidden" />


                        {/* Scanning Overlay */}
                        {cameraActive && !success && !error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="w-64 h-64 border-4 border-blue-500 rounded-lg animate-pulse"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                                            <p className="text-white text-sm font-medium">
                                                Arahkan QR Code ke area ini
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Overlay */}
                        {success && (
                            <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center">
                                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-emerald-100 rounded-full">
                                            <CheckCircle className="h-16 w-16 text-emerald-600" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-bold text-slate-800">Scan Berhasil!</h3>
                                            <p className="text-sm text-slate-600 mt-2">QR Code terverifikasi</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Idle State */}
                        {!cameraActive && !success && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                <div className="text-center text-white">
                                    <Camera className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                                    <p className="text-sm mb-4">Kamera belum aktif</p>
                                    <Button
                                        onClick={startCamera}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <ScanLine className="h-4 w-4 mr-2" />
                                        Aktifkan Kamera
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Scanned Data Display */}
                    {scannedData && (
                        <Alert variant={error ? "destructive" : "default"} className={error ? "" : "border-emerald-200 bg-emerald-50"}>
                            <div className="flex items-start gap-3">
                                {error ? (
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                ) : (
                                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <AlertDescription>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold mb-1.5">Token yang Di-scan:</p>
                                                <div className="bg-white/50 rounded-md px-3 py-2 border border-slate-200 overflow-x-auto">
                                                    <p className="font-mono font-bold text-sm whitespace-nowrap">
                                                        {scannedData}
                                                    </p>
                                                </div>
                                            </div>
                                            {expectedToken && (
                                                <div>
                                                    <p className="text-sm font-semibold mb-1.5">Token yang Diharapkan:</p>
                                                    <div className="bg-white/50 rounded-md px-3 py-2 border border-slate-200 overflow-x-auto">
                                                        <p className="font-mono font-bold text-sm whitespace-nowrap">
                                                            {expectedToken}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {expectedToken && (
                                                <div className={`p-2.5 rounded-lg ${scannedData === expectedToken
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    <p className="text-sm font-semibold text-center">
                                                        {scannedData === expectedToken ? '✓ Token Cocok!' : '✗ Token Tidak Cocok!'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </AlertDescription>
                                </div>
                            </div>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {cameraActive && (
                            <Button
                                variant="outline"
                                onClick={stopCamera}
                                className="flex-1"
                                disabled={success}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Stop Kamera
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleManualInput}
                            className="flex-1"
                            disabled={success}
                        >
                            Input Manual
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Tutup
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="text-center">
                        <p className="text-xs text-slate-500">
                            {cameraActive
                                ? "Pastikan QR Code terlihat jelas dan pencahayaan cukup"
                                : "Klik 'Aktifkan Kamera' untuk mulai scan atau gunakan 'Input Manual'"
                            }
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
