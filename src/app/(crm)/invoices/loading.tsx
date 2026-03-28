import { CardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function InvoicesLoading() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
