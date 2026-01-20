"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { usersApi } from "@/app/_lib/api";
import { toast } from "@/hooks/use-toast";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    username: "",
    email: "",
    password: "",
    company: "",
    designation: "",
    phone: "",
    country: "",
    region: "",
    sex: "",
    age: "",
    ipAuthority: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        userId: formData.userId,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        company: formData.company || undefined,
        designation: formData.designation || undefined,
        phone: formData.phone || undefined,
        country: formData.country || undefined,
        region: formData.region || undefined,
        sex: formData.sex || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        ipAuthority: formData.ipAuthority || undefined,
      };
      await usersApi.create(payload);
      onOpenChange(false);
      setFormData({
        userId: "",
        username: "",
        email: "",
        password: "",
        company: "",
        designation: "",
        phone: "",
        country: "",
        region: "",
        sex: "",
        age: "",
        ipAuthority: "",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to create user",
        description: err instanceof Error ? err.message : "Unexpected error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary">
            Add User Id
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID */}
          <div className="space-y-2">
            <Label htmlFor="userId">
              User ID<span className="text-red-500">*</span>
            </Label>
            <Input
              id="userId"
              value={formData.userId}
              onChange={(e) => handleInputChange("userId", e.target.value)}
              className="bg-gray-100"
              required
            />
          </div>

          {/* Username, Email, Password */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username<span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="bg-gray-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email<span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-gray-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password<span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="bg-gray-100"
              required
            />
          </div>

          {/* Company and Designation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">
                Company<span className="text-red-500">*</span>
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                className="bg-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">
                Designation<span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.designation}
                onValueChange={(value) =>
                  handleInputChange("designation", value)
                }
              >
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Phone, Country, Region */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Contact Phone<span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="bg-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">
                Country<span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange("country", value)}
              >
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usa">United States</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="australia">Australia</SelectItem>
                  <SelectItem value="india">India</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">
                Region<span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.region}
                onValueChange={(value) => handleInputChange("region", value)}
              >
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sex, Age, IP Authority */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sex">
                Sex<span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.sex}
                onValueChange={(value) => handleInputChange("sex", value)}
              >
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">
                Age<span className="text-red-500">*</span>
              </Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="bg-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipAuthority">
                IP Authority<span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.ipAuthority}
                onValueChange={(value) => handleInputChange("ipAuthority", value)}
              >
                <SelectTrigger className="bg-gray-100">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Add user"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
