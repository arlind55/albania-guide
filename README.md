# Udha · Your guide to Albania

A photo-led travel guide to Albania for first-time visitors, from the beaches of the Ionian coast to the Albanian Alps. This is a proof of concept: a static website that already installs on a phone like an app, with a path to iOS and Android later.

## What's here

- **Home**: a split sea-and-mountains hero and ten places you can filter by beaches, mountains, history, cities and nature.
- **Place pages**: overview, highlights, how to get there, what to watch out for, plus links to find tours (GetYourGuide), stays (Booking.com) and directions.
- **Getting around**: buses and furgons, driving, money and other practical tips.

## Run it locally

No build step. From the repo folder:

```sh
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

## Editing content

- Places: `data/places.json`
- Getting around: `data/essentials.json`
- Site name and affiliate IDs: `js/config.js`

See [docs/content-model.md](docs/content-model.md) for every field, and [docs/app-roadmap.md](docs/app-roadmap.md) for the plan to move to iOS and Android.

Photos are hotlinked from Wikimedia Commons and credited automatically on each image.
