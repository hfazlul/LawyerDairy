-- Idempotent. User.email is UNIQUE, so this address cannot sit on two rows.
-- Keep fazlul.shakil10@gmail.com on the web admin phone 01531390692
-- (+8801531390692 / 8801531390692) so admin login by email still works.
-- Attach it to 01858173601 only when that does not take the address from the admin.
-- If both accounts exist, the address stays on the admin and is not copied.
-- Does not change passwords. Does not print hashes or the database URL.

BEGIN;

UPDATE "User" AS other
SET email = NULL
WHERE other.email = 'fazlul.shakil10@gmail.com'
  AND right(regexp_replace(coalesce(other.phone, ''), '[^0-9]', '', 'g'), 10) <> '1531390692'
  AND EXISTS (
    SELECT 1
    FROM "User" AS admin
    WHERE admin."deletedAt" IS NULL
      AND right(regexp_replace(coalesce(admin.phone, ''), '[^0-9]', '', 'g'), 10) = '1531390692'
  );

UPDATE "User" AS admin
SET email = 'fazlul.shakil10@gmail.com'
WHERE admin."deletedAt" IS NULL
  AND right(regexp_replace(coalesce(admin.phone, ''), '[^0-9]', '', 'g'), 10) = '1531390692'
  AND admin.email IS DISTINCT FROM 'fazlul.shakil10@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS other
    WHERE other.email = 'fazlul.shakil10@gmail.com'
      AND other.id <> admin.id
  );

UPDATE "User" AS sub
SET email = 'fazlul.shakil10@gmail.com'
WHERE sub."deletedAt" IS NULL
  AND right(regexp_replace(coalesce(sub.phone, ''), '[^0-9]', '', 'g'), 10) = '1858173601'
  AND sub.email IS DISTINCT FROM 'fazlul.shakil10@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS admin
    WHERE admin."deletedAt" IS NULL
      AND right(regexp_replace(coalesce(admin.phone, ''), '[^0-9]', '', 'g'), 10) = '1531390692'
      AND admin.email = 'fazlul.shakil10@gmail.com'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS other
    WHERE other.email = 'fazlul.shakil10@gmail.com'
      AND other.id <> sub.id
  );

COMMIT;
