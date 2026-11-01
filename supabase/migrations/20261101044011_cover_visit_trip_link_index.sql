drop index public.visits_trip_idx;
create index visits_trip_idx on public.visits(owner_id, trip_id, daily_entry_id);
