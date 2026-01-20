"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MAILS = new Array(8).fill(0).map((_, i) => ({
  id: i + 1,
  from: ["James Dean", "Annie Williams", "Laura Romeo", "Ursula Clovaro"][
    i % 4
  ],
  subject: "Subject: Lorem ipsum dolor sit amet consectetur adipiscing elit,",
  snippet:
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium…",
  time: "10:3" + i + "PM",
}));

export default function UserMailPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input placeholder="Search" className="max-w-sm" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by ▾</span>
          <Button>New Email</Button>
        </div>
      </div>
      <div className="rounded border bg-white">
        {MAILS.map((m) => (
          <div key={m.id} className="border-b p-4 last:border-none">
            <div className="text-sm font-medium">{m.from}</div>
            <div className="text-sm">{m.subject}</div>
            <div className="text-xs text-muted-foreground">{m.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


