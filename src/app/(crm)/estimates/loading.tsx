import { TableSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function EstimatesLoading() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-44" />
      </div>
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
