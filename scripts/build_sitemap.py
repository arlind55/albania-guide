"""Regenerate sitemap.xml from the content files. Run after adding places or itineraries:

    python3 scripts/build_sitemap.py
"""
import datetime
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.udhaguide.com/"

places = json.loads((ROOT / "data/places.json").read_text())["places"]
trips = json.loads((ROOT / "data/itineraries.json").read_text())["itineraries"]
today = datetime.date.today().isoformat()

urls = [("", "1.0"), ("essentials.html", "0.8")]
urls += [(f"itineraries.html?trip={t['id']}", "0.8") for t in trips]
urls += [(f"place.html?id={p['id']}", "0.7") for p in places]

lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for path, priority in urls:
    lines.append(f"  <url><loc>{BASE}{path}</loc><lastmod>{today}</lastmod><priority>{priority}</priority></url>")
lines.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n")
print(f"Wrote {len(urls)} URLs to sitemap.xml")
