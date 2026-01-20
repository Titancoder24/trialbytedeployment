"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/_lib/api";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

const FALLBACK_EMAIL = "trialbyteuser@gmail.com";
const FALLBACK_PASSWORD = "trialbyteuser";

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("handleSignIn invoked");
    setIsLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      if (email === FALLBACK_EMAIL && password === FALLBACK_PASSWORD) {
        console.log("Fallback credentials matched");
        localStorage.setItem("token", "fallback-token");
        localStorage.setItem("userId", "trialbyteuser-fallback-id");
        localStorage.setItem("role_name", "User");
        router.push("/user/clinical_trial/dashboard");
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        return;
      }

      const res = await authApi.login(email, password);
      const token = res?.token ?? "";
      const userId = res?.user?.id ?? "";
      const roleName = res?.roles?.[0]?.role_name ?? "";
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("role_name", roleName);
      if (roleName === "Admin") {
        router.push("/admin");
      } else if (roleName === "User") {
        router.push("/user/clinical_trial/dashboard");
      } else {
        toast({
          title: "Login successful",
          description: "No role found. Staying on current page.",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Unexpected error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0e1f33] via-[#163a5a] to-[#204b73]">
      {/* Brand */}
      <div className="absolute left-8 top-8 z-10 flex items-center gap-2 text-white">
        <Image
          src="/logo.jpeg"
          alt="Logo"
          width={160}
          height={40}
          className="h-10 w-auto rounded"
        />
      </div>

      {/* Center content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1000px] flex-col items-center justify-center px-4 text-white">
        <h1 className="mb-2 text-center text-4xl font-semibold">
          Sign in to your account
        </h1>
        <p className="mb-10 text-center text-lg text-white/90">
          Enter your credentials to view all insights
        </p>

        <form
          onSubmit={handleSignIn}
          className="w-full max-w-[435px] space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90">
              Email Address<span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="h-14 bg-white text-black"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90">
              Password<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                className="h-14 bg-white pr-12 text-black"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#204b73] hover:bg-white/60"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white/90">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(Boolean(v))}
                className="border-white/40 data-[state=checked]:bg-white"
              />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              className="text-sm text-white underline underline-offset-4 hover:text-white/80"
            >
              Forget Password?
            </button>
          </div>

          <Button
            type="submit"
            className="h-14 w-full rounded-lg bg-white text-[#204b73] hover:bg-white/90"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </div>

      {/* Decorative gradient blobs (lightweight substitute for Figma vectors) */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-[-10%] top-[-15%] h-[40vh] w-[40vh] rounded-full bg-cyan-400 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[50vh] w-[50vh] rounded-full bg-indigo-400 blur-[140px]" />
      </div>
    </div>
  );
}
