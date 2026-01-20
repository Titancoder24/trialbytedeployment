"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rolesApi } from "@/app/_lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Role = { id: string; role_name: string; created_at?: string };
type UserRole = {
  id: string;
  user_id: string;
  role_id: string;
  username: string;
  email: string;
  role_name: string;
};

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRole, setNewRole] = useState("");
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>(
    {}
  );
  const [assigningRoles, setAssigningRoles] = useState<Record<string, boolean>>(
    {}
  );
  const [deletingRoles, setDeletingRoles] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, ur] = await Promise.all([
        rolesApi.list(),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user-roles/getAllUserRoles`
        ).then((res) => res.json()),
      ]);
      setRoles(r as any);
      setUserRoles(ur.userRoles || []);
    } catch {
      setRoles([]);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createRole = async () => {
    if (!newRole.trim()) return;
    await rolesApi.create(newRole.trim());
    setNewRole("");
    loadData();
  };

  const deleteRole = async (id: string) => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;

    setDeletingRoles((prev) => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/roles/deleteRole/${id}/${currentUserId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role_id: id,
            user_id: currentUserId,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        });
        loadData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setDeletingRoles((prev) => ({ ...prev, [id]: false }));
    }
  };

  const assign = async (userId: string) => {
    const selectedRole = selectedRoles[userId];
    if (!selectedRole) return;

    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;

    setAssigningRoles((prev) => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/user-roles/assignRole/${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            role_id: selectedRole,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role assigned successfully",
        });
        setSelectedRoles((prev) => ({ ...prev, [userId]: "" }));
        loadData();
      } else {
        toast({
          title: "Error",
          description: "Failed to assign role",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to assign role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setAssigningRoles((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const removeAssignment = async (userRoleId: string) => {
    await rolesApi.removeRole(userRoleId);
    loadData();
  };

  // Group user roles by user
  const usersWithRoles = userRoles.reduce(
    (acc, userRole) => {
      const existingUser = acc.find((u) => u.user.id === userRole.user_id);
      if (existingUser) {
        existingUser.roles.push({
          id: userRole.id,
          role_name: userRole.role_name,
          role_id: userRole.role_id,
        });
      } else {
        acc.push({
          user: {
            id: userRole.user_id,
            name: userRole.username,
            email: userRole.email,
          },
          roles: [
            {
              id: userRole.id,
              role_name: userRole.role_name,
              role_id: userRole.role_id,
            },
          ],
        });
      }
      return acc;
    },
    [] as {
      user: { id: string; name?: string; email?: string };
      roles: { id: string; role_name: string; role_id: string }[];
    }[]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-lg">Loading roles and users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Role Management</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="New role name"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
            <Button onClick={createRole}>Create</Button>
          </div>
          <Table>
            <TableCaption>
              {roles.length === 0 ? "No roles" : undefined}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.role_name}</TableCell>
                  <TableCell>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => deleteRole(r.id)}
                      disabled={deletingRoles[r.id]}
                    >
                      {deletingRoles[r.id] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Users & Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              {usersWithRoles.length === 0 ? "No users" : undefined}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Assign Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithRoles.map((ur) => (
                <TableRow key={ur.user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {ur.user.name || ur.user.email || ur.user.id}
                      </span>
                      {ur.user.email && (
                        <span className="text-xs text-muted-foreground">
                          {ur.user.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {ur.roles.map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center rounded border px-2 py-1 text-xs"
                        >
                          {r.role_name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 max-w-sm">
                      <Select
                        value={selectedRoles[ur.user.id] || ""}
                        onValueChange={(value) =>
                          setSelectedRoles((prev) => ({
                            ...prev,
                            [ur.user.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.role_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => assign(ur.user.id)}
                        disabled={assigningRoles[ur.user.id]}
                      >
                        {assigningRoles[ur.user.id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          "Assign"
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
