"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function UserNavbar() {
  const router = useRouter();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/user" className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={160}
              height={40}
              className="h-10 w-auto rounded"
            />
          </div>
        </Link>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="default"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6"
            onClick={() => router.push("/user/pricing")}
          >
            SOLUTIONS & PRICING
          </Button>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50 px-6 bg-transparent"
            onClick={() => router.push("/user/help")}
          >
            Help Centre
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
          >
            <Mail className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
