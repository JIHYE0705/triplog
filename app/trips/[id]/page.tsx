import type { Metadata } from "next";
import { TripsWorkspace } from "@/components/trips-workspace";

export const metadata: Metadata = { title: "여행 상세" };

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripsWorkspace view="detail" id={id} />;
}
