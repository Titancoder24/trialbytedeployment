"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import "./calendar-dropdown.css";

interface CustomDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function CustomDateInput({
  value = "",
  onChange,
  placeholder = "MM-DD-YYYY or click calendar",
  className,
  disabled = false,
  readOnly = false
}: CustomDateInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Parse the input value to a date
  const parseInputToDate = (input: string): Date | undefined => {
    if (!input.trim()) return undefined;

    // Try different date formats
    const formats = [
      "MMMM d, yyyy", // January 1, 2024
      "MMM d, yyyy",  // Jan 1, 2024
      "M/d/yyyy",     // 1/1/2024
      "MM/dd/yyyy",   // 01/01/2024
      "M-d-yyyy",     // 1-1-2024
      "MM-dd-yyyy",   // 01-01-2024
      "yyyy-MM-dd",   // 2024-01-01
      "MMMM d yyyy",  // January 1 2024
      "MMM d yyyy",   // Jan 1 2024
      "d/M/yyyy",     // 1/1/2024 (European format)
      "dd/MM/yyyy",   // 01/01/2024 (European format)
      "d-M-yyyy",     // 1-1-2024 (European format)
      "dd-MM-yyyy",   // 01-01-2024 (European format)
      "yyyy/MM/dd",   // 2024/01/01
      "yyyy.MM.dd",   // 2024.01.01
      "MM.dd.yyyy",   // 01.01.2024
      "M.d.yyyy",     // 1.1.2024
      "MMMM d",       // January 1 (current year)
      "MMM d",        // Jan 1 (current year)
      "M/d",          // 1/1 (current year)
      "MM/dd",        // 01/01 (current year)
    ];

    for (const formatStr of formats) {
      try {
        const parsed = parse(input, formatStr, new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    // Try parsing as a simple number (assume it's a day of current month/year)
    const dayNumber = parseInt(input);
    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
      const now = new Date();
      const testDate = new Date(now.getFullYear(), now.getMonth(), dayNumber);
      if (testDate.getDate() === dayNumber) {
        return testDate;
      }
    }

    return undefined;
  };

  // Format date to YYYY-MM-DD format for API (without timezone conversion)
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date to "MM-DD-YYYY" format
  const formatDateToDisplay = (date: Date): string => {
    return format(date, "MM-dd-yyyy");
  };

  // Initialize state from props
  useEffect(() => {
    if (value) {
      const date = parseInputToDate(value);
      if (date) {
        setSelectedDate(date);
        setInputValue(formatDateToDisplay(date));
      } else {
        setInputValue(value);
      }
    } else {
      setInputValue("");
      setSelectedDate(undefined);
    }
  }, [value]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the input as a date
    const parsedDate = parseInputToDate(newValue);
    if (parsedDate) {
      setSelectedDate(parsedDate);
      // Don't auto-format while typing to allow natural input
      onChange?.(formatDateForAPI(parsedDate));
    } else if (newValue.trim() === "") {
      setSelectedDate(undefined);
      onChange?.("");
    }
  };

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formatted = formatDateToDisplay(date);
      setInputValue(formatted);
      onChange?.(formatDateForAPI(date));
      setIsOpen(false);
    }
  };

  // Handle input blur - validate and format
  const handleInputBlur = () => {
    if (inputValue.trim()) {
      const parsedDate = parseInputToDate(inputValue);
      if (parsedDate) {
        const formatted = formatDateToDisplay(parsedDate);
        setInputValue(formatted);
        setSelectedDate(parsedDate);
        onChange?.(formatDateForAPI(parsedDate));
      } else {
        // If can't parse, revert to last valid value
        if (selectedDate) {
          setInputValue(formatDateToDisplay(selectedDate));
        } else {
          setInputValue("");
          onChange?.("");
        }
      }
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    if (disabled || readOnly) {
      setIsOpen(false);
      return;
    }
    setIsOpen(open);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className={cn("pr-10", className)}
        disabled={disabled}
        readOnly={readOnly}
      />
      <Popover open={isOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            disabled={disabled || readOnly}
          >
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            initialFocus
            captionLayout="dropdown"
            fromYear={1900}
            toYear={2100}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CustomDateInput;
