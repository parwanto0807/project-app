"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Plus, Trash2 } from "lucide-react";
import { RABUpdateInput, CostType, CategoryRAB, RABResponse } from "@/types/rab";

interface Product {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    unit?: string;
}

interface Project {
    id: string;
    name: string;
    customer?: {
        name: string;
    };
}

interface RABUpdateFormProps {
    rabData?: RABResponse;
    projects: Project[];
    products: Product[];
    onSubmit: (data: RABUpdateInput) => void;
    isSubmitting: boolean;
    error?: string | null;
    user: { id: string } | null;
}

export function RABUpdateForm({ rabData, projects, products, onSubmit, isSubmitting, error, user }: RABUpdateFormProps) {
    // State untuk form
    const [formData, setFormData] = useState<RABUpdateInput>({
        id: "",
        projectId: "",
        name: "",
        description: "",
        rabDetails: [],
    });

    // Ref untuk scroll ke bawah
    const bottomRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (rabData && projects.length > 0) {
            setFormData((prev) => ({
                ...prev,
                projectId: rabData.data.projectId, // isi dari DB
            }));
        }
    }, [rabData, projects]);

    useEffect(() => {
        if (!formData.projectId && projects.length > 0) {
            setFormData(prev => ({ ...prev, projectId: String(projects[0].id) }));
        }
    }, [projects, formData.projectId]);

    // Load data RAB ke form ketika rabData tersedia
    useEffect(() => {
        if (rabData && rabData.data) {
            const rab = rabData.data; // Langsung akses data object
            setFormData({
                id: rab.id,
                projectId: rab.projectId,
                name: rab.name,
                description: rab.description || "",
                rabDetails: rab.rabDetails.map(detail => ({
                    id: detail.id,
                    productId: detail.productId || null,
                    description: detail.description,
                    categoryRab: detail.categoryRab,
                    qty: detail.qty,
                    unit: detail.unit,
                    price: detail.price,
                    costType: detail.costType,
                    notes: detail.notes || "",
                    subtotal: detail.qty * detail.price
                }))
            });
        }
    }, [rabData]);

    // Handle form input changes
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => {
            const updated = {
                ...prev,
                [field]: value
            };
            return updated;
        });
    };


    // Handler yang lebih type-safe
    const handleDetailChange = {
        // Untuk string fields
        string: (index: number, field: 'description' | 'unit' | 'notes', value: string) => {
            setFormData(prev => {
                const updatedDetails = [...prev.rabDetails!];
                updatedDetails[index] = {
                    ...updatedDetails[index],
                    [field]: value
                };
                return { ...prev, rabDetails: updatedDetails };
            });
        },

        // Untuk number fields
        number: (index: number, field: 'qty' | 'price', value: number) => {
            setFormData(prev => {
                const updatedDetails = [...prev.rabDetails!];
                const currentDetail = { ...updatedDetails[index] };

                currentDetail[field] = value;
                currentDetail.subtotal = currentDetail.qty * currentDetail.price;

                updatedDetails[index] = currentDetail;
                return { ...prev, rabDetails: updatedDetails };
            });
        },

        // Untuk costType
        costType: (index: number, value: CostType) => {
            setFormData(prev => {
                const updatedDetails = [...prev.rabDetails!];
                updatedDetails[index] = {
                    ...updatedDetails[index],
                    costType: value
                };
                return { ...prev, rabDetails: updatedDetails };
            });
        },

        // Untuk categoryRab
        categoryRab: (index: number, value: CategoryRAB) => {
            setFormData(prev => {
                const updatedDetails = [...prev.rabDetails!];
                updatedDetails[index] = {
                    ...updatedDetails[index],
                    categoryRab: value
                };
                return { ...prev, rabDetails: updatedDetails };
            });
        },

        // Untuk productId
        productId: (index: number, value: string | null) => {
            setFormData(prev => {
                const updatedDetails = [...prev.rabDetails!];
                updatedDetails[index] = {
                    ...updatedDetails[index],
                    productId: value
                };
                return { ...prev, rabDetails: updatedDetails };
            });
        },
    };

    // Add new RAB detail
    const addDetail = () => {
        setFormData(prev => ({
            ...prev,
            rabDetails: [
                ...(prev.rabDetails || []),
                {
                    productId: null,
                    description: "",
                    categoryRab: "PRELIMINARY",
                    qty: 1,
                    unit: "pcs",
                    price: 0,
                    costType: "MATERIAL",
                    notes: "",
                    subtotal: 0
                }
            ]
        }));

        // Scroll ke bawah setelah state diupdate
        setTimeout(() => {
            const element = bottomRef.current;
            if (!element) return;

            const start = window.pageYOffset;
            const target = element.getBoundingClientRect().top + window.pageYOffset;
            const duration = 800; // ms
            const startTime = performance.now();

            // Custom easing function - easeOutQuart
            const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

            const animateScroll = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutQuart(progress);

                window.scrollTo(0, start + (target - start) * easedProgress);

                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };

            requestAnimationFrame(animateScroll);
        }, 100);
    };

    // Remove RAB detail
    const removeDetail = (index: number) => {
        setFormData(prev => ({
            ...prev,
            rabDetails: prev.rabDetails?.filter((_, i) => i !== index)
        }));
    };

    // Handle product selection
    const handleProductSelect = (index: number, productId: string) => {
        const selectedProduct = products.find(p => p.id === productId);
        if (selectedProduct) {
            setFormData(prev => {
                const updatedDetails = [...prev.rabDetails!];
                const subtotal = updatedDetails[index].qty * (selectedProduct.price || 0);

                updatedDetails[index] = {
                    ...updatedDetails[index],
                    productId: productId,
                    description: selectedProduct.name,
                    unit: selectedProduct.unit || "pcs",
                    price: selectedProduct.price || 0,
                    subtotal: subtotal
                };
                return {
                    ...prev,
                    rabDetails: updatedDetails
                };
            });
        }
    };

    // Calculate totals
    const calculateTotals = () => {
        const details = formData.rabDetails || [];
        return details.reduce((acc, detail) => {
            const subtotal = detail.qty * detail.price;
            return {
                subtotal: acc.subtotal + subtotal,
                taxTotal: acc.taxTotal,
                total: acc.total + subtotal
            };
        }, { subtotal: 0, taxTotal: 0, total: 0 });
    };

    const totals = calculateTotals();

    // Handle submit untuk update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi user
        if (!user) {
            alert("User not authenticated. Please login again.");
            return;
        }

        // Basic validation
        if (!formData.projectId || !formData.name || !formData.rabDetails || formData.rabDetails.length === 0) {
            alert("Please fill in all required fields and add at least one item");
            return;
        }

        // Validate details
        const invalidDetails = formData.rabDetails.filter(detail =>
            !detail.description || detail.qty <= 0 || detail.price < 0
        );

        if (invalidDetails.length > 0) {
            alert("Please check all item details. Description, quantity, and price are required.");
            return;
        }

        try {
            // Siapkan data untuk update
            const submitData: RABUpdateInput = {
                id: formData.id,
                projectId: formData.projectId,
                name: formData.name,
                description: formData.description,
                createdById: user.id,
                rabDetails: formData.rabDetails.map(detail => ({
                    productId: detail.productId || null,
                    description: detail.description,
                    categoryRab: detail.categoryRab,
                    qty: Number(detail.qty),
                    unit: detail.unit,
                    price: Number(detail.price),
                    costType: detail.costType,
                    notes: detail.notes || null
                }))
            };
            await onSubmit(submitData);
        } catch (error) {
            console.error("Form submission error:", error);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null; // hindari render di SSR

    return (
        <div className="w-full mx-auto p-4 bg-white dark:bg-slate-900 dark:text-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <h1 className="text-2xl font-bold">Update RAB</h1>
                </div>
                <p className="text-gray-600">
                    {formData.name ? `Update RAB: ${formData.name}` : "Loading RAB data..."}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Basic Information dan Summary dalam 2 kolom di atas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Basic Information */}
                    <Card className="bg-gradient-to-r from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Update the basic details for this RAB
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Project Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="project">Project *</Label>
                                {projects.length > 0 && (
                                    <Select
                                        value={formData.projectId || ""}
                                        onValueChange={(value) => handleInputChange("projectId", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((project) => (
                                                <SelectItem key={project.id} value={String(project.id)}>
                                                    {project.name} {project.customer && `- ${project.customer.name}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">RAB Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter RAB name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ""}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Enter description (optional)"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card className="bg-gradient-to-r from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span>Total Items:</span>
                                <span className="font-semibold">{formData.rabDetails?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-semibold">
                                    {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                    }).format(totals.subtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (PPN):</span>
                                <span className="font-semibold">
                                    {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                    }).format(totals.taxTotal)}
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="font-semibold">Grand Total:</span>
                                <span className="font-bold text-lg">
                                    {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                    }).format(totals.total)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RAB Details - Full width di bawah */}
                <Card className="bg-gradient-to-r from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="mb-2">RAB Details</CardTitle>
                            <CardDescription>
                                Update items in your RAB
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!formData.rabDetails || formData.rabDetails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center">
                                <p>No items added yet. Click Add Item to get started.</p>
                                <Button
                                    type="button"
                                    onClick={addDetail}
                                    className="mt-4 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </Button>
                            </div>
                        ) : (
                            <div className="border rounded-lg">
                                {/* Header */}
                                <div className="hidden md:grid grid-cols-5 gap-4 p-2 bg-cyan-100 dark:bg-cyan-800 border-b text-xs font-medium">
                                    <div className="col-span-2 col-start-1">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-10 text-center">#</div>
                                            <div className="w-40">Kategori</div>
                                            <div className="w-20">Jenis Biaya</div>
                                            <div className="flex-1">Product</div>
                                        </div>
                                    </div>
                                    <div className="col-span-3 col-start-3">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1/2 text-left">Description</div>
                                            <div className="w-20 text-center">Qty</div>
                                            <div className="w-20 text-center">Unit</div>
                                            <div className="w-40 text-center">Price</div>
                                            <div className="w-40 text-center">Subtotal</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Header */}
                                <div className="md:hidden p-2 bg-cyan-100 dark:bg-cyan-800 border-b text-xs font-medium">
                                    <div className="flex justify-between items-center">
                                        <div>Item Details</div>
                                        <div className="text-right">Actions</div>
                                    </div>
                                </div>

                                {/* Details Items */}
                                <div className="space-y-1 p-1">
                                    {formData.rabDetails.map((detail, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start p-2 rounded dark:bg-slate-950 border border-gray-200 dark:border-gray-800 mb-2">

                                            {/* Desktop View */}
                                            <div className="hidden md:block md:col-span-2 col-start-1">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 text-sm text-gray-600 text-center font-semibold">{index + 1}</div>

                                                    {/* Kategori */}
                                                    <div className="w-40">
                                                        <Select
                                                            value={detail.categoryRab}
                                                            onValueChange={(value: CategoryRAB) =>
                                                                handleDetailChange.categoryRab(index, value)
                                                            }
                                                        >
                                                            <SelectTrigger className="h-7 text-xs border border-cyan-300 dark:border-cyan-800 data-[state=open]:bg-white">
                                                                <SelectValue placeholder="Pilih" />
                                                            </SelectTrigger>
                                                            <SelectContent className="border border-cyan-300 dark:border-cyan-800 shadow-md">
                                                                <SelectItem value="PRELIMINARY">Pendahuluan</SelectItem>
                                                                <SelectItem value="SITEPREP">Persiapan</SelectItem>
                                                                <SelectItem value="STRUCTURE">Struktur</SelectItem>
                                                                <SelectItem value="ARCHITECTURE">Arsitektur</SelectItem>
                                                                <SelectItem value="MEP">MEP</SelectItem>
                                                                <SelectItem value="FINISHING">Finishing</SelectItem>
                                                                <SelectItem value="LANDSCAPE">Landscaping</SelectItem>
                                                                <SelectItem value="EQUIPMENT">Peralatan</SelectItem>
                                                                <SelectItem value="OVERHEAD">Overhead</SelectItem>
                                                                <SelectItem value="OTHER">Lain-lain</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Jenis Biaya */}
                                                    <div>
                                                        <Select
                                                            value={detail.costType}
                                                            onValueChange={(value: CostType) => handleDetailChange.costType(index, value)}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs border shadow-none border-cyan-300 dark:border-cyan-800">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="border border-cyan-300 dark:border-cyan-800">
                                                                <SelectItem value="MATERIAL">Material</SelectItem>
                                                                <SelectItem value="LABOR">Tenaga</SelectItem>
                                                                <SelectItem value="OTHER">Lainnya</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Product */}
                                                    <div className="flex-1">
                                                        <Select
                                                            value={detail.productId || "manual-entry"}
                                                            onValueChange={(value) => handleProductSelect(index, value)}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs border border-cyan-300 dark:border-cyan-800">
                                                                <SelectValue placeholder="Pilih product" />
                                                            </SelectTrigger>
                                                            <SelectContent className="border border-cyan-300 dark:border-cyan-800">
                                                                <SelectItem value="manual-entry">Manual Entry</SelectItem>
                                                                {products.map(product => (
                                                                    <SelectItem key={product.id} value={product.id}>
                                                                        {product.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop View - Column 2 */}
                                            <div className="hidden md:block col-span-3 col-start-3">
                                                <div className="flex items-center space-x-2">
                                                    {/* Description */}
                                                    <div className="w-1/2">
                                                        <Input
                                                            className="h-8 text-xs border border-cyan-300 dark:border-cyan-800"
                                                            value={detail.description}
                                                            onChange={(e) => handleDetailChange.string(index, 'description', e.target.value)}
                                                            placeholder="Deskripsi"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="w-20">
                                                        <Input
                                                            className="h-8 text-xs border border-cyan-300 dark:border-cyan-800 text-center"
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={detail.qty}
                                                            onChange={(e) => handleDetailChange.number(index, 'qty', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </div>

                                                    {/* Unit */}
                                                    <div className="w-20">
                                                        <Input
                                                            className="h-8 text-xs border border-cyan-300 dark:border-cyan-800 text-center"
                                                            value={detail.unit}
                                                            onChange={(e) => handleDetailChange.string(index, 'unit', e.target.value)}
                                                            placeholder="pcs, kg"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Price */}
                                                    <div className="w-40">
                                                        <Input
                                                            className="h-8 text-xs border border-cyan-300 dark:border-cyan-800 text-right"
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={detail.price}
                                                            onChange={(e) => handleDetailChange.number(index, 'price', parseFloat(e.target.value) || 0)}
                                                            required
                                                        />
                                                    </div>

                                                    {/* Subtotal & Delete */}
                                                    <div className="w-40 flex items-center justify-end gap-6">
                                                        <div className="text-xs p-2 rounded font-medium text-right flex-1 border border-orange-300 dark:border-orange-800">
                                                            {new Intl.NumberFormat('id-ID', {
                                                                style: 'currency',
                                                                currency: 'IDR',
                                                                minimumFractionDigits: 0,
                                                            }).format(detail.subtotal || 0)}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeDetail(index)}
                                                        className="h-8 w-8 p-2 cursor-pointer hover:border-red-600 hover:text-red-400 dark:hover:border-red-800 dark:hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-600" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Mobile View */}
                                            <div className="md:hidden space-y-3">
                                                {/* Header Row */}
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm font-medium flex items-center gap-2">
                                                        <span className="bg-cyan-100 dark:bg-cyan-800 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                                            {index + 1}
                                                        </span>
                                                        <span>Item #{index + 1}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeDetail(index)}
                                                        className="h-8 w-8 p-2 cursor-pointer hover:border-red-600 hover:text-red-400 dark:hover:border-red-800 dark:hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-600" />
                                                    </Button>
                                                </div>

                                                {/* Form Fields */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Kategori */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-gray-500 mb-1 block">Kategori</label>
                                                        <Select
                                                            value={detail.categoryRab}
                                                            onValueChange={(value: CategoryRAB) =>
                                                                handleDetailChange.categoryRab(index, value)
                                                            }
                                                        >
                                                            <SelectTrigger className="h-9 text-xs border border-cyan-300 dark:border-cyan-800">
                                                                <SelectValue placeholder="Pilih Kategori" />
                                                            </SelectTrigger>
                                                            <SelectContent className="border border-cyan-300 dark:border-cyan-800 shadow-md">
                                                                <SelectItem value="PRELIMINARY">Pendahuluan</SelectItem>
                                                                <SelectItem value="SITEPREP">Persiapan</SelectItem>
                                                                <SelectItem value="STRUCTURE">Struktur</SelectItem>
                                                                <SelectItem value="ARCHITECTURE">Arsitektur</SelectItem>
                                                                <SelectItem value="MEP">MEP</SelectItem>
                                                                <SelectItem value="FINISHING">Finishing</SelectItem>
                                                                <SelectItem value="LANDSCAPE">Landscaping</SelectItem>
                                                                <SelectItem value="EQUIPMENT">Peralatan</SelectItem>
                                                                <SelectItem value="OVERHEAD">Overhead</SelectItem>
                                                                <SelectItem value="OTHER">Lain-lain</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Jenis Biaya */}
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label className="text-xs text-gray-500 mb-1 block">Jenis Biaya</label>
                                                        <Select
                                                            value={detail.costType}
                                                            onValueChange={(value: CostType) => handleDetailChange.costType(index, value)}
                                                        >
                                                            <SelectTrigger className="h-9 text-xs border border-cyan-300 dark:border-cyan-800">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="border border-cyan-300 dark:border-cyan-800">
                                                                <SelectItem value="MATERIAL">Material</SelectItem>
                                                                <SelectItem value="LABOR">Tenaga</SelectItem>
                                                                <SelectItem value="OTHER">Lainnya</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Product */}
                                                    <div className="col-span-2 sm:col-span-1">
                                                        <label className="text-xs text-gray-500 mb-1 block">Product</label>
                                                        <Select
                                                            value={detail.productId || "manual-entry"}
                                                            onValueChange={(value) => handleProductSelect(index, value)}
                                                        >
                                                            <SelectTrigger className="h-9 text-xs border border-cyan-300 dark:border-cyan-800">
                                                                <SelectValue placeholder="Pilih product" />
                                                            </SelectTrigger>
                                                            <SelectContent className="border border-cyan-300 dark:border-cyan-800">
                                                                <SelectItem value="manual-entry">Manual Entry</SelectItem>
                                                                {products.map(product => (
                                                                    <SelectItem key={product.id} value={product.id}>
                                                                        {product.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Description */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-gray-500 mb-1 block">Description</label>
                                                        <Input
                                                            className="h-9 text-xs border border-cyan-300 dark:border-cyan-800"
                                                            value={detail.description}
                                                            onChange={(e) => handleDetailChange.string(index, 'description', e.target.value)}
                                                            placeholder="Deskripsi"
                                                            required
                                                        />
                                                    </div>

                                                    {/* Quantity, Unit, Price */}
                                                    <div className="col-span-2 grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                                                            <Input
                                                                className="h-9 text-xs border border-cyan-300 dark:border-cyan-800 text-center"
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={detail.qty}
                                                                onChange={(e) => handleDetailChange.number(index, 'qty', parseFloat(e.target.value) || 0)}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                                                            <Input
                                                                className="h-9 text-xs border border-cyan-300 dark:border-cyan-800 text-center"
                                                                value={detail.unit}
                                                                onChange={(e) => handleDetailChange.string(index, 'unit', e.target.value)}
                                                                placeholder="pcs, kg"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-500 mb-1 block">Price</label>
                                                            <Input
                                                                className="h-9 text-xs border border-cyan-300 dark:border-cyan-800 text-right"
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={detail.price}
                                                                onChange={(e) => handleDetailChange.number(index, 'price', parseFloat(e.target.value) || 0)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Subtotal */}
                                                    <div className="col-span-2">
                                                        <label className="text-xs text-gray-500 mb-1 block">Subtotal</label>
                                                        <div className="text-sm p-2 rounded font-medium text-center border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                                                            {new Intl.NumberFormat('id-ID', {
                                                                style: 'currency',
                                                                currency: 'IDR',
                                                                minimumFractionDigits: 0,
                                                            }).format(detail.subtotal || 0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div ref={bottomRef} />
                                    <div className="flex flex-row-reverse p-4">
                                        <Button
                                            type="button"
                                            onClick={addDetail}
                                            className="flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Item
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !formData.rabDetails || formData.rabDetails.length === 0}
                        className="flex items-center gap-2"
                    >
                        {isSubmitting ? "Updating..." : "Update RAB"}
                    </Button>
                </div>
            </form>
        </div>
    );
}