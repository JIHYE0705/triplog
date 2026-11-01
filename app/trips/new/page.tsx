import type { Metadata } from "next";
import { TripsWorkspace } from "@/components/trips-workspace";

export const metadata: Metadata = { title: "여행 추가" };

export default function NewTripPage() {
  return <TripsWorkspace view="new" />;
}
