"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MonthYearDatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

// Month names for display
const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

// Generate years from 1900 to 2100
const generateYears = () => {
    const years = [];
    for (let year = 2100; year >= 1900; year--) {
        years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
};

const YEARS = generateYears();

export function MonthYearDatePicker({
    value = "",
    onChange,
    placeholder = "Select date",
    className,
    disabled = false,
}: MonthYearDatePickerProps) {
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [day, setDay] = useState<string>("");

    // Parse the incoming value (expected format: YYYY-MM-DD or ISO string)
    useEffect(() => {
        if (value) {
            let dateStr = value;

            // Handle ISO date string
            if (value.includes("T")) {
                dateStr = value.split("T")[0];
            }

            // Parse YYYY-MM-DD format
            const parts = dateStr.split("-");
            if (parts.length === 3) {
                setYear(parts[0]);
                setMonth(parts[1]);
                setDay(parseInt(parts[2], 10).toString()); // Remove leading zero for display
            }
        } else {
            setMonth("");
            setYear("");
            setDay("");
        }
    }, [value]);

    // Update parent when any value changes
    const updateValue = (newMonth: string, newYear: string, newDay: string) => {
        if (newMonth && newYear && newDay) {
            // Validate day based on month and year
            const maxDay = getMaxDayForMonth(parseInt(newMonth, 10), parseInt(newYear, 10));
            const validDay = Math.min(parseInt(newDay, 10) || 1, maxDay);
            const dayStr = validDay.toString().padStart(2, "0");
            const dateStr = `${newYear}-${newMonth}-${dayStr}`;
            onChange?.(dateStr);
        } else if (!newMonth && !newYear && !newDay) {
            onChange?.("");
        }
    };

    // Get max days for a given month/year
    const getMaxDayForMonth = (monthNum: number, yearNum: number): number => {
        if (monthNum === 2) {
            // February - check leap year
            const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
            return isLeapYear ? 29 : 28;
        }
        if ([4, 6, 9, 11].includes(monthNum)) {
            return 30;
        }
        return 31;
    };

    const handleMonthChange = (newMonth: string) => {
        setMonth(newMonth);
        updateValue(newMonth, year, day);
    };

    const handleYearChange = (newYear: string) => {
        setYear(newYear);
        updateValue(month, newYear, day);
    };

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;

        // Only allow numbers
        if (inputVal && !/^\d*$/.test(inputVal)) {
            return;
        }

        // Limit to 2 digits
        if (inputVal.length > 2) {
            return;
        }

        setDay(inputVal);

        // Validate range on blur or when complete
        if (inputVal.length === 2 || inputVal === "") {
            updateValue(month, year, inputVal);
        }
    };

    const handleDayBlur = () => {
        if (day) {
            const dayNum = parseInt(day, 10);
            if (dayNum < 1) {
                setDay("1");
                updateValue(month, year, "1");
            } else if (month && year) {
                const maxDay = getMaxDayForMonth(parseInt(month, 10), parseInt(year, 10));
                if (dayNum > maxDay) {
                    setDay(maxDay.toString());
                    updateValue(month, year, maxDay.toString());
                } else {
                    updateValue(month, year, day);
                }
            } else if (dayNum > 31) {
                setDay("31");
            }
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Month Dropdown */}
            <Select
                value={month}
                onValueChange={handleMonthChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-[130px] bg-white border border-gray-300 rounded-lg">
                    <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                    {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Day Input */}
            <Input
                type="text"
                inputMode="numeric"
                placeholder="Day"
                value={day}
                onChange={handleDayChange}
                onBlur={handleDayBlur}
                className="w-[70px] text-center border border-gray-300 rounded-lg"
                disabled={disabled}
                maxLength={2}
            />

            {/* Year Dropdown */}
            <Select
                value={year}
                onValueChange={handleYearChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-[100px] bg-white border border-gray-300 rounded-lg">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                    {YEARS.map((y) => (
                        <SelectItem key={y.value} value={y.value}>
                            {y.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export default MonthYearDatePicker;
