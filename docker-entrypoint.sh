#!/bin/sh
set -e

# Replace placeholder with actual env var at runtime
envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

# Continue normal nginx startup
exec "$@"
