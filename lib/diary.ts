import { isDate } from "./calendar.ts";

export type Visit = { id: string; place: string; time?: string; timeZone?: string; photo?: string; note: string; tripId?: string };
export type DemoEntry = { visits: Visit[]; diary?: string; tripIds: string[] };
export type DiaryEntries = Record<string, DemoEntry>;

export function visitInputError(date: string, visit: Visit): string | null {
  if (!isDate(date)) return "방문 날짜를 올바르게 입력해 주세요.";
  if (!visit.place.trim() || visit.place.length > 200) return "장소명을 1~200자로 입력해 주세요.";
  if (visit.time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(visit.time)) return "시간은 00:00~23:59 사이로 입력해 주세요.";
    if (!visit.timeZone) return "시간을 입력했다면 여행지의 시간대도 선택해 주세요.";
    try { new Intl.DateTimeFormat("ko", { timeZone: visit.timeZone }); }
    catch { return "시간대를 확인해 주세요."; }
  } else if (visit.timeZone) return "시간이 없으면 시간대도 비워 주세요.";
  return null;
}

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const identifier = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value);

export function parseDiaryEntries(raw: string): DiaryEntries {
  const data: unknown = JSON.parse(raw);
  if (!record(data)) throw new Error("Invalid diary");
  const ids = new Set<string>();
  for (const [date, entry] of Object.entries(data)) {
    if (!isDate(date) || !record(entry) || !Array.isArray(entry.visits) || !Array.isArray(entry.tripIds)
      || !entry.tripIds.every(identifier) || new Set(entry.tripIds).size !== entry.tripIds.length
      || (entry.diary !== undefined && typeof entry.diary !== "string")) throw new Error("Invalid entry");
    for (const visit of entry.visits) {
      if (!record(visit) || !identifier(visit.id) || ids.has(visit.id) || typeof visit.place !== "string" || typeof visit.note !== "string"
        || (visit.time !== undefined && typeof visit.time !== "string") || (visit.timeZone !== undefined && typeof visit.timeZone !== "string")
        || (visit.photo !== undefined && !["/demo/coffee.jpg", "/demo/kyoto.jpg"].includes(visit.photo as string))
        || (visit.tripId !== undefined && (!identifier(visit.tripId) || !entry.tripIds.includes(visit.tripId)))
        || visitInputError(date, visit as Visit)) throw new Error("Invalid visit");
      ids.add(visit.id);
    }
  }
  return data as DiaryEntries;
}

export function putVisit(entries: DiaryEntries, sourceDate: string | null, date: string, visit: Visit): DiaryEntries {
  const error = visitInputError(date, visit);
  if (error) throw new Error(error);
  const next = { ...entries };
  if (sourceDate && !entries[sourceDate]?.visits.some((item) => item.id === visit.id)) throw new Error("Visit no longer exists");
  if (sourceDate && sourceDate !== date) next[sourceDate] = { ...entries[sourceDate], visits: entries[sourceDate].visits.filter((item) => item.id !== visit.id) };
  const target = next[date] ?? { visits: [], tripIds: [] };
  const replacing = sourceDate === date;
  next[date] = {
    ...target,
    tripIds: visit.tripId && !target.tripIds.includes(visit.tripId) ? [...target.tripIds, visit.tripId] : target.tripIds,
    visits: replacing ? target.visits.map((item) => item.id === visit.id ? visit : item) : [...target.visits, visit],
  };
  return parseDiaryEntries(JSON.stringify(next));
}

export function reorderVisit(entry: DemoEntry, id: string, direction: -1 | 1): DemoEntry {
  const index = entry.visits.findIndex((visit) => visit.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= entry.visits.length) return entry;
  const visits = [...entry.visits];
  [visits[index], visits[target]] = [visits[target], visits[index]];
  return { ...entry, visits };
}
