"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usersApi } from "@/app/_lib/api";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddUserModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UserForm = {
  username: string;
  email: string;
  password: string;
  company: string;
  designation: string;
  phone: string;
  country: string;
  region: string;
  sex: string;
  age: number | "";
  plan: string;
};

const initialForm: UserForm = {
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
  plan: "",
};

export function AddUserModal({ open, onOpenChange }: AddUserModalProps) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<UserForm>(initialForm);

  const handleChange = (key: keyof UserForm, value: string) => {
    setForm(
      (prev) =>
        ({
          ...prev,
          [key]: key === "age" ? (value === "" ? "" : Number(value)) : value,
        } as UserForm)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return;
    setSubmitting(true);
    try {
      await usersApi.create({
        username: form.username,
        email: form.email,
        password: form.password,
        company: form.company || undefined,
        designation: form.designation || undefined,
        phone: form.phone || undefined,
        country: form.country || undefined,
        region: form.region || undefined,
        sex: form.sex || undefined,
        age: form.age === "" ? undefined : form.age,
        plan: form.plan || undefined,
      });
      onOpenChange(false);
      setForm(initialForm);
      toast({
        title: "User created",
        description: `${form.username} has been registered.`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={form.region}
                onChange={(e) => handleChange("region", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Input
                id="sex"
                value={form.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={0}
                value={form.age}
                onChange={(e) => handleChange("age", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="plan">Plan</Label>
              <Input
                id="plan"
                value={form.plan}
                onChange={(e) => handleChange("plan", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
