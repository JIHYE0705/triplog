import { notFound } from "next/navigation";
import { DailyDiary } from "@/components/daily-diary";
import { isDate } from "@/lib/calendar";

export default async function DailyPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isDate(date)) notFound();
  return <DailyDiary key={date} date={date} />;
}
