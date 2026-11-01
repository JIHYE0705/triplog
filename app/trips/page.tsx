import type { Metadata } from "next";
import { TripsWorkspace } from "@/components/trips-workspace";

export const metadata: Metadata = { title: "여행" };

export default function TripsPage() {
  return <TripsWorkspace view="list" />;
}
