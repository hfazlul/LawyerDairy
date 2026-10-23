-- Idempotent. User.email is UNIQUE.
-- Sets hfazlul860@gmail.com only on the existing row whose phone is
-- +8801858173601 / 01858173601 / 8801858173601 (username fazlul_3601).
-- Does nothing if that row is missing.
-- Does nothing if another user already owns hfazlul860@gmail.com.
-- Does nothing if more than one row matches that phone, so one address
-- is never written onto two users.
-- Does not create a user. Does not change passwords.
-- Does not print hashes or the database URL.

BEGIN;

UPDATE "User" AS sub
SET email = 'hfazlul860@gmail.com'
WHERE right(regexp_replace(coalesce(sub.phone, ''), '[^0-9]', '', 'g'), 10) = '1858173601'
  AND sub.email IS DISTINCT FROM 'hfazlul860@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS other
    WHERE lower(other.email) = 'hfazlul860@gmail.com'
      AND other.id <> sub.id
  )
  AND (
    SELECT count(*)
    FROM "User" AS matches
    WHERE right(regexp_replace(coalesce(matches.phone, ''), '[^0-9]', '', 'g'), 10) = '1858173601'
  ) = 1;

COMMIT;
