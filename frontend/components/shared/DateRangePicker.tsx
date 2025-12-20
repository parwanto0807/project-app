// components/shared/DateRangePicker.tsx
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onChange: (startDate: string, endDate: string) => void;
    className?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

export default function DateRangePicker({
    startDate,
    endDate,
    onChange,
    className,
    label = "Rentang Tanggal",
    placeholder = "Pilih rentang tanggal",
    disabled = false,
}: DateRangePickerProps) {
    const [dateRange, setDateRange] = useState<{
        from: Date | undefined;
        to: Date | undefined;
    }>({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
    });
    const [preset, setPreset] = useState<string>("custom");
    const [isOpen, setIsOpen] = useState(false);

    // Update dateRange when props change
    useEffect(() => {
        setDateRange({
            from: startDate ? new Date(startDate) : undefined,
            to: endDate ? new Date(endDate) : undefined,
        });
    }, [startDate, endDate]);

    // Apply preset dates
    useEffect(() => {
        if (preset !== "custom") {
            const today = new Date();
            let from = new Date();
            let to = new Date();

            switch (preset) {
                case "today":
                    from = today;
                    to = today;
                    break;
                case "yesterday":
                    from = new Date(today.setDate(today.getDate() - 1));
                    to = new Date(today);
                    break;
                case "thisWeek":
                    const day = today.getDay();
                    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
                    from = new Date(today.setDate(diff));
                    to = new Date();
                    break;
                case "lastWeek":
                    const lastWeek = new Date(today.setDate(today.getDate() - 7));
                    const lastWeekDay = lastWeek.getDay();
                    const lastWeekDiff = lastWeek.getDate() - lastWeekDay + (lastWeekDay === 0 ? -6 : 1);
                    from = new Date(lastWeek.setDate(lastWeekDiff));
                    to = new Date(from.setDate(from.getDate() + 6));
                    break;
                case "thisMonth":
                    from = new Date(today.getFullYear(), today.getMonth(), 1);
                    to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    break;
                case "lastMonth":
                    from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    to = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case "thisYear":
                    from = new Date(today.getFullYear(), 0, 1);
                    to = new Date(today.getFullYear(), 11, 31);
                    break;
                default:
                    return;
            }

            setDateRange({ from, to });
            handleDateChange({ from, to });
        }
    }, [preset]);

    const handleDateChange = (range: { from?: Date; to?: Date }) => {
        setDateRange({ from: range.from, to: range.to });

        if (range.from && range.to) {
            // Format dates to YYYY-MM-DD
            const formattedFrom = format(range.from, "yyyy-MM-dd");
            const formattedTo = format(range.to, "yyyy-MM-dd");

            // Only call onChange if both dates are selected
            onChange(formattedFrom, formattedTo);
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        setDateRange({ from: undefined, to: undefined });
        setPreset("custom");
        onChange("", "");
        setIsOpen(false);
    };

    const formatDateDisplay = () => {
        if (dateRange.from && dateRange.to) {
            return `${format(dateRange.from, "dd MMM yyyy", { locale: id })} - ${format(dateRange.to, "dd MMM yyyy", { locale: id })}`;
        }
        if (dateRange.from) {
            return `${format(dateRange.from, "dd MMM yyyy", { locale: id })} - Pilih akhir`;
        }
        return placeholder;
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <Label className="text-sm font-medium">{label}</Label>}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateDisplay()}
                        {dateRange.from && (
                            <X
                                className="ml-auto h-4 w-4"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            />
                        )}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-4">
                        {/* Preset Selections */}
                        <div>
                            <h4 className="text-sm font-medium mb-2">Preset</h4>
                            <Select value={preset} onValueChange={setPreset}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih preset" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="custom">Custom</SelectItem>
                                    <SelectItem value="today">Hari Ini</SelectItem>
                                    <SelectItem value="yesterday">Kemarin</SelectItem>
                                    <SelectItem value="thisWeek">Minggu Ini</SelectItem>
                                    <SelectItem value="lastWeek">Minggu Lalu</SelectItem>
                                    <SelectItem value="thisMonth">Bulan Ini</SelectItem>
                                    <SelectItem value="lastMonth">Bulan Lalu</SelectItem>
                                    <SelectItem value="thisYear">Tahun Ini</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range Calendar */}
                        <div>
                            <h4 className="text-sm font-medium mb-2">Pilih Rentang</h4>
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) => {
                                    handleDateChange({
                                        from: range?.from,
                                        to: range?.to,
                                    });
                                    setPreset("custom");
                                }}
                                locale={id}
                                className="rounded-md border"
                                disabled={(date) => date > new Date()}
                            />
                        </div>

                        {/* Selected Dates Display */}
                        {dateRange.from && dateRange.to && (
                            <div className="text-sm bg-muted p-3 rounded-md">
                                <div className="font-medium">Rentang Terpilih:</div>
                                <div className="mt-1">
                                    {format(dateRange.from, "PPPP", { locale: id })} -{" "}
                                    {format(dateRange.to, "PPPP", { locale: id })}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClear}
                                className="flex-1"
                            >
                                Clear
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="flex-1"
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreset("today")}
                    className={cn(
                        "text-xs",
                        preset === "today" && "bg-primary text-primary-foreground"
                    )}
                >
                    Hari Ini
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreset("thisWeek")}
                    className={cn(
                        "text-xs",
                        preset === "thisWeek" && "bg-primary text-primary-foreground"
                    )}
                >
                    Minggu Ini
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreset("thisMonth")}
                    className={cn(
                        "text-xs",
                        preset === "thisMonth" && "bg-primary text-primary-foreground"
                    )}
                >
                    Bulan Ini
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="text-xs"
                >
                    Clear Filter
                </Button>
            </div>
        </div>
    );
}