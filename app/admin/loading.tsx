export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
