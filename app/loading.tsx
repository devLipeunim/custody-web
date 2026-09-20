import { Loading, PageHeadingSkeleton, TableSkeleton } from "@/components/Skeleton";

export default function LoadingCases() {
  return (
    <Loading label="Loading cases">
      <PageHeadingSkeleton subWidth="560px" />
      <TableSkeleton columns={["Reference", "Title", "Forum", "Items", "Size", "Status"]} rows={3} />
    </Loading>
  );
}
