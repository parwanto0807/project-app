"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAllKaryawan } from "@/lib/action/master/karyawan";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Plus,
    Loader2,
    X,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { makeImageSrc } from "@/utils/makeImageSrc";

interface Karyawan {
    id: string;
    namaLengkap: string;
    jabatan?: string;
    foto?: string;
}

export default function CreateTeamForm({ role }: { role: string; }) {
    const router = useRouter();
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [selectedKaryawan, setSelectedKaryawan] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        namaTeam: "",
        deskripsi: ""
    });

    console.log("role", role);

    useEffect(() => {
        const loadKaryawan = async () => {
            try {
                const result = await fetchAllKaryawan();
                if (Array.isArray(result.karyawan)) {
                    setKaryawanList(result.karyawan);
                } else {
                    setError("Format data karyawan tidak valid");
                }
            } catch (err) {
                console.error("Error fetching karyawan:", err);
                setError("Terjadi kesalahan saat memuat data");
            } finally {
                setIsLoading(false);
            }
        };

        loadKaryawan();
    }, []);

    const toggleKaryawan = (karyawanId: string) => {
        setSelectedKaryawan((prev) =>
            prev.includes(karyawanId)
                ? prev.filter((id) => id !== karyawanId)
                : [...prev, karyawanId]
        );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.namaTeam.trim()) {
            toast.error("❌ Nama tim wajib diisi");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/team/createTeam`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    namaTeam: formData.namaTeam.trim(),
                    deskripsi: formData.deskripsi.trim(),
                    karyawanIds: selectedKaryawan,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            toast.success("✅ Tim berhasil dibuat!", {
                description: "Anda akan diarahkan kembali ke daftar tim.",
            });

            setTimeout(() => {
                router.push("/admin-area/master/team");
                router.refresh();
            }, 1500);

        } catch (error: unknown) {
            console.error('Error creating team:', error);

            // ✅ Lakukan type guard
            let errorMessage = "Terjadi kesalahan tidak terduga";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error; // Jika error adalah string
            }

            toast.error("❌ Gagal membuat tim", {
                description: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredKaryawan = karyawanList.filter((karyawan) =>
        karyawan.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="border-none shadow-lg">
            <CardHeader className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Buat Tim Baru</CardTitle>
                        <CardDescription>
                            Isi data tim dan pilih anggota yang akan bergabung.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nama Tim */}
                    <div className="space-y-2">
                        <Label htmlFor="namaTeam" className="text-base font-semibold">
                            Nama Tim <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="namaTeam"
                            name="namaTeam"
                            placeholder="Contoh: Tim Frontend, Divisi Marketing"
                            required
                            value={formData.namaTeam}
                            onChange={handleInputChange}
                            className="h-12 text-base"
                        />
                    </div>

                    {/* Deskripsi Tim */}
                    <div className="space-y-2">
                        <Label htmlFor="deskripsi" className="text-base font-semibold">
                            Deskripsi Tim
                        </Label>
                        <Input
                            id="deskripsi"
                            name="deskripsi"
                            placeholder="Deskripsi singkat tentang tujuan dan fungsi tim"
                            value={formData.deskripsi}
                            onChange={handleInputChange}
                            className="h-12 text-base"
                        />
                    </div>

                    {/* Daftar Karyawan */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-600" />
                                Pilih Anggota Tim
                                <Badge variant="secondary" className="ml-2">
                                    {selectedKaryawan.length} terpilih
                                </Badge>
                            </Label>

                            <Input
                                placeholder="Cari karyawan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-10 w-full sm:w-64"
                            />
                        </div>

                        {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                        <Skeleton className="h-5 w-5 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                <AlertCircle className="h-5 w-5" />
                                <span>{error}</span>
                            </div>
                        ) : filteredKaryawan.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-lg">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">
                                    {searchTerm ? "Tidak ada karyawan yang sesuai dengan pencarian" : "Tidak ada karyawan yang tersedia"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3 max-h-96 overflow-y-auto p-2 border rounded-lg">
                                {filteredKaryawan.map((karyawan) => (
                                    <div
                                        key={karyawan.id}
                                        className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                                        onDoubleClick={() => toggleKaryawan(karyawan.id)} // ✅ toggle via double click
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage
                                                    src={makeImageSrc(karyawan.foto)}
                                                    alt={karyawan.namaLengkap}
                                                    crossOrigin="anonymous"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                                                    {karyawan.namaLengkap
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .substring(0, 2)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{karyawan.namaLengkap}</p>
                                                <p className="text-sm text-gray-500">
                                                    {karyawan.jabatan || "Belum ada jabatan"}
                                                </p>
                                            </div>
                                        </div>
                                        <Checkbox
                                            checked={selectedKaryawan.includes(karyawan.id)}
                                            onCheckedChange={() => toggleKaryawan(karyawan.id)} // ✅ toggle via checkbox
                                            onClick={(e) => e.stopPropagation()} // ✅ cegah bubble ke parent row
                                            className="border-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                    </div>
                                ))}

                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                            type="submit"
                            size="lg"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold gap-2 transition-all duration-300"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Sedang Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5" />
                                    Buat Tim ({selectedKaryawan.length} Anggota)
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => router.back()}
                            className="flex-1 gap-2"
                        >
                            <X className="h-5 w-5" />
                            Batal
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}