#!/usr/bin/env python3
"""Run a SQL file via the project's Management API; credentials are never printed.
Usage: python3 scripts/supabase-query.py FILE [--read-only]
Uses SUPABASE_ACCESS_TOKEN or the existing ~/tmp/supabase_pat credential.
"""
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request

token = os.environ.get('SUPABASE_ACCESS_TOKEN') or (Path.home() / 'tmp/supabase_pat').read_text().splitlines()[0].strip()
query = Path(sys.argv[1]).read_text()
request = urllib.request.Request(
    'https://api.supabase.com/v1/projects/alfwjhczzefvcevmlcif/database/query',
    data=json.dumps({'query': query, 'read_only': '--read-only' in sys.argv}).encode(),
    headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
)
try:
    with urllib.request.urlopen(request, timeout=45) as response:
        print(response.read().decode())
except urllib.error.HTTPError as error:
    print(f'HTTP {error.code}: {error.read().decode()}', file=sys.stderr)
    sys.exit(1)
