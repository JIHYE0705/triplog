import type { Metadata } from "next";
import { TripsWorkspace } from "@/components/trips-workspace";

export const metadata: Metadata = { title: "여행 수정" };

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripsWorkspace view="edit" id={id} />;
}
