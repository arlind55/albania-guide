# Udha · Your guide to Albania

A photo-led travel guide to Albania for first-time visitors, from the beaches of the Ionian coast to the Albanian Alps. This is a proof of concept: a static website that already installs on a phone like an app, with a path to iOS and Android later.

## What's here

- **Home**: a split sea-and-mountains hero and ten places you can filter by beaches, mountains, history, cities and nature.
- **Place pages** (`/places/<id>/`): overview, highlights, how to get there, what to watch out for, plus links to find tours (GetYourGuide), stays (Booking.com) and directions.
- **Getting around**: buses and furgons, driving, money and other practical tips.

## Run it locally

From the repo folder:

```sh
node scripts/build.mjs      # regenerate pages after content changes
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish with GitHub Pages

Settings → Pages → Build and deployment → Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)**. The site appears at `https://<user>.github.io/albania-guide/` within a minute or two.

### Custom domain: udhaguide.com

The `CNAME` file tells GitHub Pages to serve the site at `www.udhaguide.com`. DNS records at the registrar:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `arlind55.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

With these in place, `udhaguide.com` redirects to `www.udhaguide.com`. Then tick **Enforce HTTPS** under Settings → Pages once GitHub has issued the certificate.

## How the site is built

Content lives in `data/*.json`. `node scripts/build.mjs` turns it into real HTML pages with clean URLs (`/places/theth/`, `/itineraries/albanian-alps/`, `/getting-around/`), page titles, descriptions, link previews and structured data for Google, plus `sitemap.xml` and `robots.txt`. GitHub Pages serves the generated files directly; there's no build step on the server.

**After editing anything in `data/` or `js/render.js`, run `node scripts/build.mjs` and commit the result.** A GitHub check fails on pull requests if you forget.

## Editing content

- Places: `data/places.json`
- Getting around: `data/essentials.json`
- Site name and affiliate IDs: `js/config.js`

See [docs/content-model.md](docs/content-model.md) for every field, and [docs/app-roadmap.md](docs/app-roadmap.md) for the plan to move to iOS and Android.

Photos are hotlinked from Wikimedia Commons and credited automatically on each image.
