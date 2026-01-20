"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Plus, MoreHorizontal } from "lucide-react";
import { AddUserModal } from "@/components/add-user-modal";
import { usersApi, rolesApi } from "@/app/_lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ApiUser = {
  id: string;
  username: string;
  email: string;
  company: string | null;
  designation: string | null;
  phone: string | null;
  country: string | null;
  region: string | null;
  sex: string | null;
  age: number | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
};

// Chart data
const newTrialsData = [
  { month: "Jan", trials: 5 },
  { month: "Feb", trials: 8 },
  { month: "Mar", trials: 12 },
  { month: "Apr", trials: 18 },
  { month: "May", trials: 15 },
  { month: "June", trials: 10 },
  { month: "July", trials: 7 },
];

const addedVsModifiedData = [
  { name: "Added", value: 75, color: "#204B73" },
  { name: "Modified", value: 25, color: "#C6EDFD" },
];

export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await usersApi.list();
      setUsers(data as ApiUser[]);
      } catch {
        // Use mock data when API fails
          setUsers([
            {
              id: "CT123",
              username: "John Doe",
              email: "john.doe@example.com",
              company: "PharmaCorp",
              designation: "Clinical Researcher",
              phone: "+1-555-0123",
              country: "USA",
              region: "North America",
              sex: "Male",
              age: 35,
              plan: "active",
              created_at: "2024-01-15T10:30:00Z",
              updated_at: "2024-01-15T10:30:00Z",
            },
            {
              id: "CT124",
              username: "Jane Smith",
              email: "jane.smith@example.com",
              company: "MedTech Inc",
              designation: "Clinical Trial Manager",
              phone: "+1-555-0124",
              country: "Canada",
              region: "North America",
              sex: "Female",
              age: 28,
              plan: "inactive",
              created_at: "2024-01-20T14:15:00Z",
              updated_at: "2024-01-20T14:15:00Z",
            },
            {
              id: "CT125",
              username: "Alex Brown",
              email: "alex.brown@example.com",
              company: "BioResearch Ltd",
              designation: "Clinical Data Analyst",
              phone: "+1-555-0125",
              country: "USA",
              region: "North America",
              sex: "Male",
              age: 42,
              plan: "active",
              created_at: "2024-02-01T09:45:00Z",
              updated_at: "2024-02-01T09:45:00Z",
            },
            {
              id: "CT126",
              username: "Emily Davis",
              email: "emily.davis@example.com",
              company: "Clinical Solutions",
              designation: "Clinical Trial Monitor",
              phone: "+1-555-0126",
              country: "USA",
              region: "North America",
              sex: "Female",
              age: 31,
              plan: "active",
              created_at: "2024-02-10T16:20:00Z",
              updated_at: "2024-02-10T16:20:00Z",
            },
            {
              id: "CT127",
              username: "Michael Lee",
              email: "michael.lee@example.com",
              company: "Research Partners",
              designation: "Clinical Research Associate",
              phone: "+1-555-0127",
              country: "Canada",
              region: "North America",
              sex: "Male",
              age: 39,
              plan: "inactive",
              created_at: "2024-02-15T11:30:00Z",
              updated_at: "2024-02-15T11:30:00Z",
            },
          ]);
      } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadUsers();
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Refresh user list when modal closes (after adding a user)
  const prevModalOpen = useRef(false);
  useEffect(() => {
    // Only refresh if modal was open and is now closed (user was likely added)
    if (prevModalOpen.current && !isAddUserModalOpen) {
      // Small delay to ensure the user was added before refreshing
      const timeoutId = setTimeout(() => {
        loadUsers();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    prevModalOpen.current = isAddUserModalOpen;
  }, [isAddUserModalOpen]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter((u) =>
      [u.username, u.email, u.company ?? ""].some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [users, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Checkbox handlers
  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((u) => u.id)));
    }
  };

  const isAllSelected = paginatedUsers.length > 0 && selectedUsers.size === paginatedUsers.length;
  const isSomeSelected = selectedUsers.size > 0 && selectedUsers.size < paginatedUsers.length;

  // Remove users handler
  const handleRemoveUsers = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to remove.",
        variant: "destructive",
      });
      return;
    }

    setIsRemoving(true);
    console.log("handleRemoveUsers: Starting removal process", { selectedUsers: Array.from(selectedUsers) });

    try {
      const selectedUserIds = Array.from(selectedUsers);
      const adminUsers: string[] = [];
      const usersToDelete: string[] = [];

      // Check each selected user for admin role
      for (const userId of selectedUserIds) {
        try {
          const roles = await rolesApi.getUserRoles(userId);
          console.log(`handleRemoveUsers: User ${userId} roles:`, roles);
          const isAdmin = roles.some((role) => role.role_name === "Admin");
          
          if (isAdmin) {
            const user = users.find((u) => u.id === userId);
            adminUsers.push(user?.username || userId);
          } else {
            usersToDelete.push(userId);
          }
        } catch (error) {
          console.error(`handleRemoveUsers: Error checking roles for user ${userId}:`, error);
          // If we can't check roles, skip this user to be safe
          const user = users.find((u) => u.id === userId);
          adminUsers.push(user?.username || userId);
        }
      }

      // Prevent deletion if any admin users are selected
      if (adminUsers.length > 0) {
        toast({
          title: "Cannot delete admin users",
          description: `The following users are admins and cannot be deleted: ${adminUsers.join(", ")}`,
          variant: "destructive",
        });
        setIsRemoving(false);
        return;
      }

      // Delete non-admin users
      if (usersToDelete.length === 0) {
        toast({
          title: "No users to delete",
          description: "All selected users are admins and cannot be deleted.",
          variant: "destructive",
        });
        setIsRemoving(false);
        return;
      }

      // Delete users one by one
      const deletePromises = usersToDelete.map((userId) => usersApi.delete(userId));
      await Promise.all(deletePromises);

      console.log(`handleRemoveUsers: Successfully deleted ${usersToDelete.length} user(s)`);

      // Refresh the user list
      await loadUsers();
      setSelectedUsers(new Set());

      toast({
        title: "Users removed successfully",
        description: `Successfully removed ${usersToDelete.length} user(s).`,
      });
    } catch (error) {
      console.error("handleRemoveUsers: Error removing users:", error);
      toast({
        title: "Error removing users",
        description: error instanceof Error ? error.message : "Failed to remove users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF8FF] to-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setIsAddUserModalOpen(true)}
            className="bg-[#204B73] hover:bg-[#204B73]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add new users
          </Button>
          <Button
            variant="outline"
            className="border-[#204B73] text-[#204B73] hover:bg-[#204B73] hover:text-white"
            onClick={handleRemoveUsers}
            disabled={isRemoving || selectedUsers.size === 0}
          >
            {isRemoving ? "Removing..." : "Remove users"}
          </Button>
        </div>
      </div>

      {/* User Table */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">User Name</TableHead>
                  <TableHead className="font-semibold">Designation</TableHead>
                  <TableHead className="font-semibold">IP Authority</TableHead>
                  <TableHead className="font-semibold">User Status</TableHead>
                  <TableHead className="font-semibold">User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#204B73]"></div>
                        <span className="ml-2">Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.designation || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={user.plan === "active" ? "default" : "secondary"}>
                          {user.plan === "active" ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.plan === "active" ? "default" : "secondary"}>
                          {user.plan === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.id.slice(0, 8)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Trials Added Chart */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-700">
              New Trials added
            </CardTitle>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={newTrialsData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Bar dataKey="trials" fill="#204B73" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Added vs Modified Chart */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Added vs Modified
            </CardTitle>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={addedVsModifiedData}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {addedVsModifiedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {addedVsModifiedData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        open={isAddUserModalOpen}
        onOpenChange={setIsAddUserModalOpen}
      />
    </div>
  );
}