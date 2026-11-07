import type { Metadata } from "next";
import { TravelSegmentEditor } from "@/components/travel-segment-editor";
export const metadata: Metadata = { title: "이동편 수정" };
export default async function EditSegmentPage({ params }: { params: Promise<{ id: string; segmentId: string }> }) {
  const { id, segmentId } = await params;
  return <TravelSegmentEditor tripId={id} segmentId={segmentId} />;
}
