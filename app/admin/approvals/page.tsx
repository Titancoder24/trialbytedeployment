"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Pending = {
  id: string;
  target_table: string;
  target_record_id?: string | null;
  proposed_data: any;
  change_type: string;
  submitted_by?: { id: string; name?: string; email?: string } | string;
  submitted_at: string;
  is_approved?: boolean;
  approved_at?: string | null;
  rejected?: boolean;
};

export default function ApprovalsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<Pending | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/pending-changes/listChanges`
      );

      if (response.ok) {
        const data = await response.json();
        setItems(data.changes || []);
        setTotal(data.total || 0);
      } else {
        console.error("Failed to fetch pending changes");
        setItems([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching pending changes:", error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const approve = async (id: string) => {
    try {
      setProcessingId(id);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/pending-changes/approve/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setSelected(null);
        load();
      } else {
        console.error("Failed to approve change");
      }
    } catch (error) {
      console.error("Error approving change:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (id: string) => {
    try {
      setProcessingId(id);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/pending-changes/reject/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "Rejected from UI",
          }),
        }
      );

      if (response.ok) {
        setSelected(null);
        load();
      } else {
        console.error("Failed to reject change");
      }
    } catch (error) {
      console.error("Error rejecting change:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Approvals</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Pending Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              {loading
                ? "Loading..."
                : items.length === 0
                ? "No pending items"
                : undefined}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Change Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell>
                    {typeof p.submitted_by === "string"
                      ? p.submitted_by
                      : p.submitted_by?.name ||
                        (p.submitted_by as any)?.email ||
                        (p.submitted_by as any)?.id}
                  </TableCell>
                  <TableCell>{p.change_type}</TableCell>
                  <TableCell>
                    {p.target_table}
                    {p.target_record_id ? ` (${p.target_record_id})` : ""}
                  </TableCell>
                  <TableCell>
                    {new Date(p.submitted_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => setSelected(p)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Target</div>
                  <div className="font-medium">{selected.target_table}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Record</div>
                  <div className="font-mono text-xs">
                    {selected.target_record_id || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">{selected.change_type}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Submitted</div>
                  <div className="font-medium">
                    {new Date(selected.submitted_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm mb-2 text-muted-foreground">
                  Proposed Data
                </div>
                <pre className="max-h-80 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(selected.proposed_data, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => selected && reject(selected.id)}
                  disabled={processingId === selected.id}
                >
                  {processingId === selected.id ? "Rejecting..." : "Reject"}
                </Button>
                <Button
                  onClick={() => selected && approve(selected.id)}
                  disabled={processingId === selected.id}
                >
                  {processingId === selected.id ? "Approving..." : "Approve"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
