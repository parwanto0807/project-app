// app/verify/page.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import { OTPInput } from "@/components/auth/otp-input"
import { toast } from "sonner"
import React from "react"
import { useRouter } from "next/navigation"

const FormSchema = z.object({
    otp: z.string().min(6, {
        message: "Kode OTP harus terdiri dari 6 digit",
    }),
})

export default function OTPVerificationForm() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [countdown, setCountdown] = React.useState(30)
     const router = useRouter()


    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            otp: "",
        },
    })

    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setIsLoading(true)

        try {
            // Ambil token sementara dari sessionStorage/localStorage
            const tempToken = sessionStorage.getItem("mfa_temp_token")

            if (!tempToken) {
                toast.error("Token verifikasi tidak ditemukan. Silakan login ulang.")
                setIsLoading(false)
                return
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tempToken}`
                },
                credentials: "include",
                body: JSON.stringify({
                    otp: data.otp,
                    rememberDevice: true,
                }),
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result?.error || "Verifikasi OTP gagal.")
            }

            sessionStorage.removeItem("mfa_temp_token")

            toast.success("Verifikasi Berhasil", {
                description: "OTP berhasil diverifikasi.",
                position: "top-center",
            })

            // Redirect ke halaman utama setelah verifikasi
            router.push("/dashboard") // ganti sesuai route tujuanmu

        } catch (err) {
            console.error("OTP verification error:", err)
            toast.error("Gagal Verifikasi", {
                description: err instanceof Error ? err.message : "Terjadi kesalahan.",
                position: "top-center",
            })
        } finally {
            setIsLoading(false)
        }
    }

    function handleResendOTP() {
        toast.info("OTP Dikirim Ulang", {
            description: "Kode OTP baru telah dikirim ke email/nomor HP Anda",
            position: "top-center",
        })
        setCountdown(30)
    }

    return (
        <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Verifikasi OTP
                    </CardTitle>
                    <CardDescription className="text-center">
                        Masukkan 6 digit kode yang dikirim ke email/nomor HP Anda
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kode OTP</FormLabel>
                                        <FormControl>
                                            <OTPInput
                                                name={field.name}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Verifikasi
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                Tidak menerima kode?{" "}
                                <button
                                    type="button"
                                    className="font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={countdown > 0 || isLoading}
                                    onClick={handleResendOTP}
                                >
                                    Kirim ulang {countdown > 0 && `(${countdown}s)`}
                                </button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}