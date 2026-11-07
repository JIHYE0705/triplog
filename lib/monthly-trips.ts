import type { DemoTrip } from "./demo-trips.ts";

export function monthlyTripLanes(trips: DemoTrip[], from: string, to: string) {
  const ends: string[] = [];
  return trips.filter((trip) => trip.startsOn <= to && trip.endsOn >= from)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn) || a.id.localeCompare(b.id))
    .map((trip) => {
      const available = ends.findIndex((end) => end < trip.startsOn);
      const lane = available === -1 ? ends.length : available;
      ends[lane] = trip.endsOn;
      return { trip, lane };
    });
}
