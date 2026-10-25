// Pre-renders every page from data/*.json into real HTML, so search engines and link
// previews see the full content without running JavaScript. Run after editing content:
//
//   node scripts/build.mjs
//
// Writes index.html, places/<id>/, itineraries/<id>/, getting-around/, sitemap.xml and robots.txt.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG, REGIONS } from "../js/config.js";
import {
  esc, firstPhoto, header, footer, placeUrl, tripUrl,
  homeMain, placeMain, tripMain, tripsIndexMain, essentialsMain
} from "../js/render.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.udhaguide.com";

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const { places } = read("data/places.json");
const { itineraries } = read("data/itineraries.json");
const essentials = read("data/essentials.json");
// Sitemap dates come from the content files, so rebuilding unchanged content changes nothing.
const lastmod = [read("data/places.json").updated, read("data/itineraries.json").updated, essentials.updated].sort().pop();
const placeById = Object.fromEntries(places.map((p) => [p.id, p]));

const photoUrl = (photo) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(firstPhoto(photo))}?width=1200`;

function breadcrumbs(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + path }))
  };
}

function page({ path, title, description, image, pageType, current, solid = false, main, jsonLd = [] }) {
  const url = SITE + path;
  const ld = jsonLd.map((d) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...d }).replace(/</g, "\\u003c")}</script>`).join("\n  ");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(CONFIG.siteName)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  ${image ? `<meta property="og:image" content="${esc(photoUrl(image))}">
  <meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`}
  <meta name="theme-color" content="#15212b">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://commons.wikimedia.org">
  <link rel="preconnect" href="https://upload.wikimedia.org">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Public+Sans:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="/css/style.css">
  ${ld}
</head>
<body data-page="${pageType}">
  ${header(current, solid)}
  <main>${main}</main>
  ${footer()}
  <script type="module" src="/js/app.js"></script>
</body>
</html>
`;
}

const written = [];
function write(path, html, { sitemap = true } = {}) {
  const file = path.endsWith("/") ? join(ROOT, path, "index.html") : join(ROOT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  if (sitemap) written.push(path);
}

// Old query-string URLs keep working by forwarding to the new clean ones.
function redirectStub(target, script) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Udha</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${SITE}${target}">
  <meta http-equiv="refresh" content="0; url=${target}">
  <script>${script}</script>
</head>
<body><p><a href="${target}">Continue to Udha</a></p></body>
</html>
`;
}

/* Home */
write("/", page({
  path: "/",
  title: `${CONFIG.siteName} · Albania travel guide: beaches, mountains and itineraries`,
  description: "A photo-led guide to Albania for first-time visitors: where to go, how to get there, what to watch out for, and day-by-day itineraries from the Riviera to the Albanian Alps.",
  image: placeById.ksamil.image,
  pageType: "home",
  current: "places",
  main: homeMain(places, itineraries),
  jsonLd: [{ "@type": "WebSite", name: CONFIG.siteName, url: SITE + "/", description: "A travel guide to Albania." }]
}));

/* Places */
for (const p of places) {
  write(placeUrl(p.id), page({
    path: placeUrl(p.id),
    title: `${p.name}, Albania: travel guide and how to get there · ${CONFIG.siteName}`,
    description: `${p.tagline}. What to see in ${p.name}, how to get there, the best time to visit and what to watch out for.`,
    image: p.image,
    pageType: "place",
    main: placeMain(p, places, itineraries),
    jsonLd: [
      {
        "@type": "TouristAttraction",
        name: p.name,
        description: p.summary[0],
        url: SITE + placeUrl(p.id),
        image: photoUrl(p.image),
        geo: { "@type": "GeoCoordinates", latitude: p.coords[0], longitude: p.coords[1] },
        containedInPlace: { "@type": "Country", name: "Albania" }
      },
      breadcrumbs([["Albania", "/"], [REGIONS[p.region], "/#places"], [p.name, placeUrl(p.id)]])
    ]
  }));
}

/* Itineraries */
write("/itineraries/", page({
  path: "/itineraries/",
  title: `Albania itineraries: 3 days to a week · ${CONFIG.siteName}`,
  description: "Day-by-day Albania itineraries with travel times and where to stay: a long weekend in Tirana and Berat, a week from Tirana to the Riviera, the Albanian Alps and the south-east.",
  image: itineraries[0].image,
  pageType: "trips",
  current: "itineraries",
  solid: true,
  main: tripsIndexMain(itineraries)
}));

for (const t of itineraries) {
  const stops = [...new Set(t.days.flatMap((d) => d.places))].map((id) => placeById[id]).filter(Boolean);
  write(tripUrl(t.id), page({
    path: tripUrl(t.id),
    title: `${t.title}: day-by-day itinerary · ${CONFIG.siteName}`,
    description: `${t.tagline}. ${t.summary.split(". ")[0].replace(/\.$/, "")}.`,
    image: t.image,
    pageType: "trip",
    current: "itineraries",
    main: tripMain(t, itineraries, placeById),
    jsonLd: [
      {
        "@type": "TouristTrip",
        name: t.title,
        description: t.summary,
        url: SITE + tripUrl(t.id),
        itinerary: {
          "@type": "ItemList",
          itemListElement: stops.map((p, i) => ({
            "@type": "ListItem", position: i + 1,
            item: { "@type": "TouristAttraction", name: p.name, url: SITE + placeUrl(p.id) }
          }))
        }
      },
      breadcrumbs([["Albania", "/"], ["Itineraries", "/itineraries/"], [t.title, tripUrl(t.id)]])
    ]
  }));
}

/* Getting around */
write("/getting-around/", page({
  path: "/getting-around/",
  title: `Getting around Albania: buses, driving, money and tips · ${CONFIG.siteName}`,
  description: "How to get around Albania: arriving, buses and furgons, driving, cash and ATMs, and practical tips for first-time visitors.",
  pageType: "essentials",
  current: "essentials",
  solid: true,
  main: essentialsMain(essentials),
  jsonLd: [{
    "@type": "FAQPage",
    mainEntity: essentials.sections.flatMap((s) => s.items).map((i) => ({
      "@type": "Question", name: i.title, acceptedAnswer: { "@type": "Answer", text: i.text }
    }))
  }]
}));

/* Redirects from the old URLs */
write("/place.html", redirectStub("/", `var id=new URLSearchParams(location.search).get("id");location.replace(id?"/places/"+encodeURIComponent(id)+"/":"/");`), { sitemap: false });
write("/itineraries.html", redirectStub("/itineraries/", `var t=new URLSearchParams(location.search).get("trip");location.replace(t?"/itineraries/"+encodeURIComponent(t)+"/":"/itineraries/");`), { sitemap: false });
write("/essentials.html", redirectStub("/getting-around/", `location.replace("/getting-around/"+location.hash);`), { sitemap: false });

/* Not found */
write("/404.html", page({
  path: "/404.html",
  title: `Page not found · ${CONFIG.siteName}`,
  description: "This page doesn't exist.",
  pageType: "notfound",
  solid: true,
  main: `<section class="wrap page-intro"><p class="eyebrow">Not found</p><h1>This path doesn't lead anywhere</h1><p>The page may have moved. Try the <a href="/">home page</a>, the <a href="/itineraries/">itineraries</a> or the <a href="/getting-around/">Getting around guide</a>.</p></section>`
}), { sitemap: false });

/* Sitemap and robots */
const priority = (p) => (p === "/" ? "1.0" : p.startsWith("/places/") ? "0.7" : "0.8");
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${written.map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${lastmod}</lastmod><priority>${priority(p)}</priority></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${written.length} pages and sitemap.xml`);
