create function private.is_known_time_zone(zone text)
returns boolean language sql stable security invoker
set search_path = ''
as $$ select exists (select 1 from pg_catalog.pg_timezone_names where name = zone); $$;
revoke all on function private.is_known_time_zone(text) from public, anon, authenticated;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  check (isfinite(starts_on) and isfinite(ends_on) and ends_on >= starts_on)
);
create index trips_owner_dates_idx on public.trips(owner_id, starts_on, ends_on);

create table public.trip_companions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  trip_id uuid not null,
  name text not null check (btrim(name) <> ''),
  position integer not null check (position >= 0),
  foreign key (owner_id, trip_id) references public.trips(owner_id, id) on delete restrict,
  unique (owner_id, trip_id, position) deferrable initially immediate
);

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  local_date date not null check (isfinite(local_date)),
  body text not null default '',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, local_date)
);

create table public.daily_entry_trips (
  owner_id uuid not null,
  daily_entry_id uuid not null,
  trip_id uuid not null,
  primary key (owner_id, daily_entry_id, trip_id),
  foreign key (owner_id, daily_entry_id) references public.daily_entries(owner_id, id) on delete restrict,
  foreign key (owner_id, trip_id) references public.trips(owner_id, id) on delete restrict
);
create index daily_entry_trips_trip_idx on public.daily_entry_trips(owner_id, trip_id);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (btrim(name) <> ''),
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  check ((latitude is null and longitude is null) or
    (latitude is not null and longitude is not null and
     latitude between -90 and 90 and longitude between -180 and 180))
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  daily_entry_id uuid not null,
  trip_id uuid,
  place_id uuid not null,
  local_time time without time zone,
  time_zone text,
  impression text not null default '',
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  unique (owner_id, daily_entry_id, position) deferrable initially immediate,
  foreign key (owner_id, daily_entry_id) references public.daily_entries(owner_id, id) on delete restrict,
  foreign key (owner_id, place_id) references public.places(owner_id, id) on delete restrict,
  foreign key (owner_id, daily_entry_id, trip_id)
    references public.daily_entry_trips(owner_id, daily_entry_id, trip_id) on delete restrict,
  check ((local_time is null and time_zone is null) or
    (local_time is not null and local_time < time '24:00' and private.is_known_time_zone(time_zone)))
);
create index visits_place_idx on public.visits(owner_id, place_id);
create index visits_trip_idx on public.visits(owner_id, trip_id);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  daily_entry_id uuid,
  visit_id uuid,
  object_key text not null unique check (btrim(object_key) <> ''),
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  position integer not null check (position >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, daily_entry_id) references public.daily_entries(owner_id, id) on delete restrict,
  foreign key (owner_id, visit_id) references public.visits(owner_id, id) on delete restrict,
  check (num_nonnulls(daily_entry_id, visit_id) = 1),
  check (not is_cover or status = 'ready')
);
create unique index photos_daily_position_idx on public.photos(owner_id, daily_entry_id, position)
  where daily_entry_id is not null;
create unique index photos_visit_position_idx on public.photos(owner_id, visit_id, position)
  where visit_id is not null;
create unique index photos_daily_cover_idx on public.photos(owner_id, daily_entry_id)
  where daily_entry_id is not null and is_cover;
create unique index photos_visit_cover_idx on public.photos(owner_id, visit_id)
  where visit_id is not null and is_cover;

alter table public.trips add column cover_photo_id uuid;
alter table public.trips add foreign key (owner_id, cover_photo_id)
  references public.photos(owner_id, id) on delete restrict;
create index trips_cover_photo_idx on public.trips(owner_id, cover_photo_id);

create table public.travel_segments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  trip_id uuid not null,
  mode text not null check (mode in ('flight', 'train')),
  operator_name text not null default '',
  service_number text not null default '',
  departure_place text not null check (btrim(departure_place) <> ''),
  arrival_place text not null check (btrim(arrival_place) <> ''),
  departure_local timestamp without time zone not null check (isfinite(departure_local)),
  departure_time_zone text not null check (private.is_known_time_zone(departure_time_zone)),
  arrival_local timestamp without time zone not null check (isfinite(arrival_local)),
  arrival_time_zone text not null check (private.is_known_time_zone(arrival_time_zone)),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  foreign key (owner_id, trip_id) references public.trips(owner_id, id) on delete restrict,
  unique (owner_id, trip_id, position) deferrable initially immediate,
  check (arrival_local at time zone arrival_time_zone >= departure_local at time zone departure_time_zone)
);

-- Login is deferred: keep every app role blocked until authenticated APIs and owner policies exist.
alter table public.trips enable row level security;
alter table public.trip_companions enable row level security;
alter table public.daily_entries enable row level security;
alter table public.daily_entry_trips enable row level security;
alter table public.places enable row level security;
alter table public.visits enable row level security;
alter table public.photos enable row level security;
alter table public.travel_segments enable row level security;
revoke all on public.trips, public.trip_companions, public.daily_entries, public.daily_entry_trips,
  public.places, public.visits, public.photos, public.travel_segments from public, anon, authenticated;
