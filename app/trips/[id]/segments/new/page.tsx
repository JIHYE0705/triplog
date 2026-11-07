import type { Metadata } from "next";
import { TravelSegmentEditor } from "@/components/travel-segment-editor";
export const metadata: Metadata = { title: "이동편 추가" };
export default async function NewSegmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TravelSegmentEditor tripId={id} />;
}
