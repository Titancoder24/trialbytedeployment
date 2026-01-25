"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";

const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
];

export function LanguageSelector() {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative" style={{ flexShrink: 0 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white rounded-lg transition-all hover:bg-gray-100"
                style={{
                    height: "48px",
                    borderRadius: "12px",
                    boxShadow: "0 -2px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
                title={t("language.select")}
            >
                <span
                    style={{
                        fontFamily: "Poppins",
                        fontWeight: 500,
                        fontSize: "16px",
                        color: "#204B73",
                    }}
                >
                    Aa
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
                    style={{ borderRadius: "12px" }}
                >
                    <div
                        className="px-3 py-2 text-xs text-gray-500 uppercase font-medium border-b border-gray-100"
                        style={{ fontFamily: "Poppins" }}
                    >
                        {t("language.select")}
                    </div>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${currentLang.code === lang.code
                                    ? "bg-[#204B73] text-white"
                                    : "text-gray-700 hover:bg-[#204B73] hover:text-white"
                                }`}
                            style={{
                                fontFamily: "Poppins",
                                fontSize: "14px",
                            }}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span>{lang.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
