"use client";

import { useForm, FormProvider } from "react-hook-form";
import { OTPInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MFAInputPage() {
    const methods = useForm({ defaultValues: { otp: "" } });
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Ambil secret sementara dari sessionStorage
    // const tempToken = typeof window !== "undefined" ? sessionStorage.getItem("mfa_secret_temp") : "";

    const onSubmit = async (data: { otp: string }) => {
        setLoading(true);
        setError(null);
        try {
            // Ambil tempToken dari localStorage/sessionStorage/context sesuai flow login-mu
            const tempToken = sessionStorage.getItem("mfa_temp_token");
            const rememberDevice = true; // atau sesuai state user

            console.log("TempToken before submit:", tempToken);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/mfa/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ tempToken, code: data.otp, rememberDevice }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result?.error || "OTP tidak valid");
            sessionStorage.removeItem("mfa_temp_token");
            router.push("/super-admin-area");
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else if (typeof err === "string") setError(err);
            else setError("Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xs mx-auto">
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b">
                        <div className="bg-white/80 dark:bg-neutral-900/80 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6">
                            <label className="mb-4 text-lg font-medium text-center text-gray-800 dark:text-white">
                                Masukkan 6 digit kode dari Google Authenticator
                            </label>
                            <OTPInput name="otp" length={6} disabled={loading} />
                            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                            <Button type="submit" disabled={loading || methods.watch("otp").length !== 6} className="w-full">
                                {loading ? "Memverifikasi..." : "Verifikasi"}
                            </Button>
                        </div>
                    </div>
                </form>
            </FormProvider>
        </div>
    );
}
