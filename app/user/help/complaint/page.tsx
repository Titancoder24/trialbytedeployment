"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function HelpComplaintPage() {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Raise A Complaint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm">Enter the Title*</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <div className="mb-1 text-sm">Description (optional)</div>
            <Textarea
              rows={5}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>Submit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
