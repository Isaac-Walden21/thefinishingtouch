import { TableSkeleton } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CustomersLoading() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
