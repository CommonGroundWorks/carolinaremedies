#!/bin/sh

set -eu

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
	echo "NEXT_PUBLIC_SUPABASE_URL is required to start the application." >&2
	exit 1
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
	echo "NEXT_PUBLIC_SUPABASE_ANON_KEY is required to start the application." >&2
	exit 1
fi

echo "Starting Next.js standalone server..."
exec node server.js
