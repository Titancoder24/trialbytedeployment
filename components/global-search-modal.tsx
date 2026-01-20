"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search } from "lucide-react"

interface GlobalSearchModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSearch: (searchTerm: string) => void
    currentSearchTerm?: string
}

export function GlobalSearchModal({
    open,
    onOpenChange,
    onSearch,
    currentSearchTerm = ""
}: GlobalSearchModalProps) {
    const [searchValue, setSearchValue] = useState(currentSearchTerm)

    const handleSearch = () => {
        onSearch(searchValue)
        onOpenChange(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    // Reset search value when modal opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setSearchValue(currentSearchTerm)
        }
        onOpenChange(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="max-w-2xl p-0 rounded-lg overflow-hidden [&>button]:hidden"
                style={{ fontFamily: "Poppins, sans-serif" }}
            >
                {/* Header */}
                <DialogHeader
                    className="px-6 py-4 border-b relative"
                    style={{ backgroundColor: "#C3E9FB" }}
                >
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className="text-lg font-semibold"
                            style={{ fontFamily: "Poppins, sans-serif", color: "#204B73" }}
                        >
                            Search
                        </DialogTitle>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute right-4 top-4 rounded-full p-1 hover:opacity-80"
                            style={{ backgroundColor: "#204B73" }}
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </DialogHeader>

                {/* Search Input */}
                <div className="p-6 bg-white">
                    <Input
                        placeholder="Search.."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full border border-gray-200 rounded-lg py-3 px-4"
                        style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px" }}
                        autoFocus
                    />

                    {/* Search Button */}
                    <div className="flex justify-end mt-4">
                        <Button
                            onClick={handleSearch}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg hover:opacity-90"
                            style={{ backgroundColor: "#204B73", color: "white", fontFamily: "Poppins, sans-serif" }}
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
