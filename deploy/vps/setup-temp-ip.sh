#!/usr/bin/env bash
# Temporary IP-only host for the Next.js web app.
# Run on the VPS from a git checkout: sudo bash deploy/vps/setup-temp-ip.sh
# Does not drop tables or delete users. Writes secrets only into webapp/.env on the server.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/webapp"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://187.77.153.28}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg nginx postgresql postgresql-contrib

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE '^v(20|22)\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

install -d -m 755 /var/www
if [[ ! -d /var/www/lawyerdiary/.git ]]; then
  if [[ -d "$ROOT/.git" ]]; then
    ln -sfn "$ROOT" /var/www/lawyerdiary
  fi
fi

DB_NAME="${DB_NAME:-lawyer_diary}"
DB_USER="${DB_USER:-lawyerdiary}"
ENV_FILE="$APP/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  DB_PASS="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -base64 48)"
  CSRF_SECRET="$(openssl rand -base64 32)"
  CRON_SECRET="$(openssl rand -hex 32)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SQL
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  fi
  umask 077
  cat > "$ENV_FILE" <<ENV
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
JWT_SECRET="${JWT_SECRET}"
JWT_ACCESS_TTL_MIN="15"
JWT_REFRESH_TTL_DAYS="30"
CSRF_SECRET="${CSRF_SECRET}"
CRON_SECRET="${CRON_SECRET}"
PUBLIC_APP_URL="${PUBLIC_ORIGIN}"
NEXT_PUBLIC_SITE_URL="${PUBLIC_ORIGIN}"
NEXT_PUBLIC_APP_URL="${PUBLIC_ORIGIN}"
NODE_ENV="production"
ENV
  chmod 600 "$ENV_FILE"
  echo "Wrote server env file. Secrets were not printed."
else
  echo "Keeping existing server env file."
fi

cd "$APP"
npm ci
npx prisma generate
set -a
# shellcheck disable=SC1091
source "$ENV_FILE"
set +a
npx prisma db push --skip-generate
if [[ -f prisma/sql/2026-10-14-profile-share.sql ]]; then
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/sql/2026-10-14-profile-share.sql
fi
npm run build

install -m 644 "$ROOT/deploy/vps/nginx-lawyerdiary.conf" /etc/nginx/sites-available/lawyerdiary
ln -sfn /etc/nginx/sites-available/lawyerdiary /etc/nginx/sites-enabled/lawyerdiary
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

cd "$APP"
pm2 delete lawyerdiary >/dev/null 2>&1 || true
pm2 start npm --name lawyerdiary -- start -- --port 3000
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null || true
echo "App process: pm2 lawyerdiary on 127.0.0.1:3000, nginx on :80"
