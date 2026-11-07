export const demoDate = "2026-10-26";

export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function shiftDate(value: string, days: number): string | null {
  if (!isDate(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const result = date.toISOString().split("T")[0];
  return isDate(result) ? result : null;
}

export function weekDates(value: string): string[] {
  const selected = isDate(value) ? value : demoDate;
  const weekday = new Date(`${selected}T12:00:00Z`).getUTCDay();
  // shortcut: 시작 요일은 정책 확정 전 월요일 시안, 사용자 선택 시 조정.
  const start = shiftDate(selected, -((weekday + 6) % 7));
  const days = start ? Array.from({ length: 7 }, (_, index) => shiftDate(start, index)) : [];
  return days.length === 7 && days.every((day) => day !== null) ? days : weekDates(demoDate);
}

export function formatDate(value: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("ko-KR", { ...options, timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export function visibleVisitCount(cellHeight: number, reserved = 62, rowHeight = 30): number {
  // 날짜·여백·초과 표시 공간을 먼저 확보하고, 장소는 최대 세 개만 보여준다.
  return Math.max(0, Math.min(3, Math.floor((cellHeight - reserved) / rowHeight)));
}

export function shiftMonth(value: string, months: number): string | null {
  if (!isDate(value)) return null;
  const date = new Date(`${value.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  const result = date.toISOString().slice(0, 10);
  return isDate(result) ? result : null;
}

export function monthWeeks(value: string): (string | null)[][] {
  const first = `${(isDate(value) ? value : demoDate).slice(0, 7)}-01`;
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const next = shiftMonth(first, 1);
  const last = next ? shiftDate(next, -1)! : `${first.slice(0, 7)}-31`;
  const length = Math.ceil((offset + Number(last.slice(-2))) / 7) * 7;
  return Array.from({ length: length / 7 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => shiftDate(first, week * 7 + day - offset)));
}
