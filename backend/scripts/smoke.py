"""Ad-hoc end-to-end smoke test against a locally running API.

Usage: python scripts/smoke.py [base_url] [admin_password]
Exits non-zero if any check fails. Not part of the runtime application.
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8014"
PASSWORD = sys.argv[2] if len(sys.argv) > 2 else "Admin@12345"
FAILURES: list[str] = []


def call(method: str, path: str, body=None, token: str | None = None, form: bool = False):
    url = f"{BASE}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        if form:
            data = urllib.parse.urlencode(body).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, raw[:400]


def check(label: str, ok: bool, detail: str = "") -> None:
    print(f"{'PASS' if ok else 'FAIL'}  {label}  {detail}")
    if not ok:
        FAILURES.append(label)


status, body = call("GET", "/health")
check("GET /health", status == 200, str(body))

status, cats = call("GET", "/api/v1/categories")
parents = cats or []
check("GET /categories is a list", status == 200 and isinstance(parents, list), f"status={status}")
nested = sum(len(c.get("children") or []) for c in parents if isinstance(c, dict))
check("category tree is nested (not flattened)", nested > 0, f"children={nested}")
check("category slugs are unique", status == 200 and len({c['slug'] for c in parents}) == len(parents))

status, brands = call("GET", "/api/v1/brands")
check("GET /brands", status == 200 and isinstance(brands, list), f"status={status} n={len(brands or [])}")
status, systems = call("GET", "/api/v1/operating-systems")
check("GET /operating-systems", status == 200 and isinstance(systems, list), f"status={status} n={len(systems or [])}")
status, tags = call("GET", "/api/v1/tags")
check("GET /tags", status == 200 and isinstance(tags, list), f"status={status} n={len(tags or [])}")

status, files = call("GET", "/api/v1/files")
check("GET /files", status == 200 and isinstance(files, dict) and "meta" in files, f"status={status}")

for name, path in (("recent", "/api/v1/files/recent"), ("trending", "/api/v1/files/trending"), ("favorites", "/api/v1/files/favorites")):
    status, body = call("GET", path)
    check(f"GET /files/{name}", status == 200, f"status={status} {str(body)[:120]}")

status, token = call("POST", "/api/v1/auth/login", {"username": "admin", "password": PASSWORD})
check("POST /auth/login", status == 200 and isinstance(token, dict) and bool(token.get("access_token")), f"status={status} {str(token)[:160]}")
if not (isinstance(token, dict) and token.get("access_token")):
    print("\nCannot continue without a session token.")
    sys.exit(1)
jwt = token["access_token"]

status, me = call("GET", "/api/v1/auth/me", token=jwt)
check("GET /auth/me", status == 200 and isinstance(me, dict) and me.get("is_admin") is True, f"status={status}")

status, stats = call("GET", "/api/v1/dashboard/stats", token=jwt)
check("GET /dashboard/stats", status == 200, f"status={status} {str(stats)[:200]}")

status, created = call(
    "POST",
    "/api/v1/categories",
    {"name": "Smoke Category", "description": "temp", "icon": "folder", "color": "#888888"},
    token=jwt,
)
check("POST /categories (admin)", status == 201 and isinstance(created, dict), f"status={status} {str(created)[:160]}")
if status == 201:
    cid = created["id"]
    status, updated = call("PUT", f"/api/v1/categories/{cid}", {"description": "edited"}, token=jwt)
    check("PUT /categories/{id}", status == 200 and isinstance(updated, dict) and "children" in updated, f"status={status} {str(updated)[:160]}")
    status, _ = call("DELETE", f"/api/v1/categories/{cid}", token=jwt)
    check("DELETE /categories/{id}", status == 200, f"status={status}")

print("\n" + ("ALL CHECKS PASSED" if not FAILURES else f"FAILURES: {FAILURES}"))
sys.exit(1 if FAILURES else 0)
