-- Dedicated development DB only. All synthetic users and records are rolled back.
begin;
set local plpgsql.check_asserts = on;

create function pg_temp.expect_error(statement text, expected_state text)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise;
  end;
  raise exception 'Expected SQLSTATE %, statement succeeded: %', expected_state, statement;
end $$;

do $$
declare
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  trip_a uuid;
  trip_b uuid;
  foreign_trip uuid;
  day_a uuid;
  day_b uuid;
  foreign_day uuid;
  place_a uuid;
  foreign_place uuid;
  visit_a uuid;
  cover_a uuid;
  foreign_photo uuid;
  original_date date;
  table_name text;
  role_name text;
begin
  insert into auth.users(id) values (owner_a), (owner_b);
  insert into public.trips(owner_id, title, starts_on, ends_on)
    values (owner_a, 'Synthetic trip A', '2026-10-25', '2026-11-05') returning id into trip_a;
  insert into public.trips(owner_id, title, starts_on, ends_on)
    values (owner_a, 'Synthetic trip B', '2026-10-26', '2026-10-26') returning id into trip_b;
  insert into public.trips(owner_id, title, starts_on, ends_on)
    values (owner_b, 'Other owner trip', '2026-10-26', '2026-10-26') returning id into foreign_trip;
  insert into public.daily_entries(owner_id, local_date, body)
    values (owner_a, '2026-10-26', 'Separate daily diary') returning id into day_a;
  insert into public.daily_entries(owner_id, local_date)
    values (owner_a, '2026-10-27') returning id into day_b;
  insert into public.daily_entries(owner_id, local_date)
    values (owner_b, '2026-10-26') returning id into foreign_day;
  insert into public.places(owner_id, name) values (owner_a, 'Manual place without coordinates') returning id into place_a;
  insert into public.places(owner_id, name) values (owner_b, 'Other owner place') returning id into foreign_place;

  -- A daily entry and visit can exist without any trip, time or photo.
  insert into public.visits(owner_id, daily_entry_id, place_id, impression, position)
    values (owner_a, day_a, place_a, 'Separate visit impression', 0) returning id into visit_a;
  insert into public.visits(owner_id, daily_entry_id, place_id, position)
    values (owner_a, day_b, place_a, 0);
  assert (select count(*) = 2 from public.visits where owner_id = owner_a and place_id = place_a), 'revisit must reuse one place';
  assert not exists (select 1 from public.daily_entry_trips where daily_entry_id = day_a), 'everyday record must not need a trip';

  -- Two trips on one day, with a visit explicitly choosing one of them.
  insert into public.daily_entry_trips values (owner_a, day_a, trip_a), (owner_a, day_a, trip_b);
  update public.visits set trip_id = trip_b, local_time = '23:30', time_zone = 'America/Los_Angeles' where id = visit_a;
  assert (select count(*) = 2 from public.daily_entry_trips where daily_entry_id = day_a), 'multiple trips on one day';
  set local time zone 'Asia/Seoul';
  select local_date into original_date from public.daily_entries where id = day_a;
  assert original_date = date '2026-10-26', 'local date must not shift with viewer time zone';

  insert into public.trip_companions(owner_id, trip_id, name, position)
    values (owner_a, trip_a, 'Synthetic companion', 0), (owner_a, trip_a, 'Synthetic companion', 1);
  assert not exists (select 1 from public.trip_companions where trip_id = trip_b), 'companions are optional';

  -- Westbound travel arrives on the previous local date, but later in absolute time.
  insert into public.travel_segments(owner_id, trip_id, mode, departure_place, arrival_place,
      departure_local, departure_time_zone, arrival_local, arrival_time_zone, position)
    values (owner_a, trip_a, 'flight', 'Synthetic ICN', 'Synthetic LAX',
      '2026-10-27 01:00', 'Asia/Seoul', '2026-10-26 19:00', 'America/Los_Angeles', 0),
      (owner_a, trip_a, 'train', 'Synthetic station A', 'Synthetic station B',
      '2026-10-27 09:00', 'America/Los_Angeles', '2026-10-27 10:00', 'America/Los_Angeles', 1);
  assert (select array_agg(mode order by position) = array['flight','train'] from public.travel_segments where trip_id = trip_a), 'segment order must survive';

  insert into public.photos(owner_id, visit_id, object_key, status, position, is_cover)
    values (owner_a, visit_a, 'synthetic/' || owner_a || '/cover', 'ready', 0, true) returning id into cover_a;
  insert into public.photos(owner_id, daily_entry_id, object_key, position)
    values (owner_a, day_a, 'synthetic/' || owner_a || '/pending', 0);
  insert into public.photos(owner_id, daily_entry_id, object_key, status, position)
    values (owner_b, foreign_day, 'synthetic/' || owner_b || '/photo', 'ready', 0) returning id into foreign_photo;
  update public.trips set cover_photo_id = cover_a where id = trip_a;

  -- Date changes retain existing links, photos, companions and transport records.
  update public.trips set starts_on = '2026-11-01', ends_on = '2026-11-02' where id = trip_a;
  assert exists (select 1 from public.daily_entry_trips where daily_entry_id = day_a and trip_id = trip_a), 'out-of-range entry must survive';
  assert exists (select 1 from public.photos where id = cover_a), 'photo metadata must survive';
  assert (select count(*) = 2 from public.trip_companions where trip_id = trip_a), 'companions must survive';
  assert (select count(*) = 2 from public.travel_segments where trip_id = trip_a), 'segments must survive';

  perform pg_temp.expect_error(format('update public.trips set ends_on = %L where id = %L', '2026-10-01', trip_a), '23514');
  perform pg_temp.expect_error(format('update public.trips set title = %L where id = %L', '   ', trip_a), '23514');
  perform pg_temp.expect_error(format('insert into public.daily_entries(owner_id, local_date) values (%L, %L)', owner_a, '2026-10-26'), '23505');
  perform pg_temp.expect_error(format('insert into public.daily_entry_trips values (%L, %L, %L)', owner_a, day_b, foreign_trip), '23503');
  perform pg_temp.expect_error(format('update public.visits set place_id = %L where id = %L', foreign_place, visit_a), '23503');
  perform pg_temp.expect_error(format('update public.visits set daily_entry_id = %L where id = %L', foreign_day, visit_a), '23503');
  perform pg_temp.expect_error(format('update public.visits set daily_entry_id = %L, position = 1 where id = %L', day_b, visit_a), '23503');
  perform pg_temp.expect_error(format('update public.visits set time_zone = null where id = %L', visit_a), '23514');
  perform pg_temp.expect_error(format('update public.visits set time_zone = %L where id = %L', 'Invalid/Zone', visit_a), '23514');
  perform pg_temp.expect_error(format('update public.visits set local_time = %L where id = %L', '24:00', visit_a), '23514');
  perform pg_temp.expect_error(format('update public.places set latitude = 91, longitude = 0 where id = %L', place_a), '23514');
  perform pg_temp.expect_error(format('update public.places set latitude = 0 where id = %L', place_a), '23514');
  perform pg_temp.expect_error(format('update public.photos set daily_entry_id = %L where id = %L', day_a, cover_a), '23514');
  perform pg_temp.expect_error(format('update public.photos set status = %L where id = %L', 'pending', cover_a), '23514');
  perform pg_temp.expect_error(format('update public.trips set cover_photo_id = %L where id = %L', foreign_photo, trip_a), '23503');
  perform pg_temp.expect_error(format('insert into public.photos(owner_id, visit_id, object_key, status, position, is_cover) values (%L, %L, %L, %L, 1, true)', owner_a, visit_a, 'synthetic/' || owner_a || '/second-cover', 'ready'), '23505');
  perform pg_temp.expect_error(format('update public.travel_segments set arrival_local = %L where trip_id = %L and position = 1', '2026-10-26 09:00', trip_a), '23514');
  perform pg_temp.expect_error(format('delete from public.trips where id = %L', trip_a), '23503');

  foreach table_name in array array['trips','trip_companions','daily_entries','daily_entry_trips','places','visits','photos','travel_segments'] loop
    assert (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass), 'RLS must be enabled';
    foreach role_name in array array['anon','authenticated'] loop
      assert not has_table_privilege(role_name, 'public.' || table_name, 'select,insert,update,delete'), 'app table access must remain blocked';
    end loop;
  end loop;
end $$;

set local role anon;
do $$ begin
  begin perform 1 from public.trips; raise exception 'anonymous read unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$ begin
  begin perform 1 from public.daily_entries; raise exception 'authenticated read unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

rollback;
select 'record_data_model: all assertions passed; fixtures rolled back' as result;
