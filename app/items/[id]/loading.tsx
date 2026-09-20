import {
  Loading, PageHeadingSkeleton, FactsSkeleton, TimelineSkeleton, Line,
} from "@/components/Skeleton";

export default function LoadingItem() {
  return (
    <Loading label="Loading evidence item">
      <PageHeadingSkeleton subWidth="520px" />
      <div className="banner unknown" style={{ visibility: "hidden" }}>
        <span className="headline">&nbsp;</span>
      </div>
      <FactsSkeleton />
      <div className="panel">
        <div className="row">
          <Line width="190px" height={36} />
          <Line width="140px" height={36} />
          <Line width="140px" height={36} />
        </div>
        <div style={{ marginTop: 12 }}><Line width="70%" height={12} /></div>
      </div>
      <h3>Who has handled it</h3>
      <TimelineSkeleton rows={4} />
    </Loading>
  );
}
