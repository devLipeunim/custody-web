import { Loading, PageHeadingSkeleton, TableSkeleton, Line } from "@/components/Skeleton";

export default function LoadingCase() {
  return (
    <Loading label="Loading case">
      <PageHeadingSkeleton />
      <div className="panel">
        <div className="row">
          <Line width="200px" height={36} />
          <Line width="330px" height={12} />
        </div>
      </div>
      <h3>Evidence items</h3>
      <TableSkeleton
        columns={["Reference", "Description", "Size", "Collected", "Events", "Status"]}
        rows={4}
      />
    </Loading>
  );
}
