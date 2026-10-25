// Turns the content in data/*.json into page markup. Pure string functions with no DOM access,
// so scripts/build.mjs can pre-render every page as real HTML for search engines.
import { CONFIG, CATEGORIES, REGIONS } from "./config.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const placeUrl = (id) => `/places/${id}/`;
export const tripUrl = (id) => `/itineraries/${id}/`;

export function formatCoords([lat, lng]) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns}  ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// A photo is one Commons file name or a list of candidates, best first.
export const photoKey = (photo) => (Array.isArray(photo) ? photo.join("|") : photo);
export const firstPhoto = (photo) => (Array.isArray(photo) ? photo[0] : photo);

export function plate(file, { width = 1600, alt = "", eager = false } = {}) {
  return `<figure class="plate" data-photo="${esc(photoKey(file))}" data-width="${width}">
    <img alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    <figcaption class="credit"></figcaption>
  </figure>`;
}

function bookingUrl(search) {
  const url = new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss", search);
  if (CONFIG.affiliates.booking.aid) url.searchParams.set("aid", CONFIG.affiliates.booking.aid);
  return url.toString();
}

export function affiliateLinks(place) {
  const tours = new URL("https://www.getyourguide.com/s/");
  tours.searchParams.set("q", place.book.tours);
  if (CONFIG.affiliates.getyourguide.partnerId) tours.searchParams.set("partner_id", CONFIG.affiliates.getyourguide.partnerId);
  const [lat, lng] = place.coords;
  return {
    tours: tours.toString(),
    stays: bookingUrl(place.book.stays),
    directions: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  };
}

export function header(current, solid) {
  const link = (href, label, key) =>
    `<a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site-header${solid ? " solid" : ""}">
    <div class="wrap">
      <a class="wordmark" href="/">${esc(CONFIG.siteName)} <small>${esc(CONFIG.tagline)}</small></a>
      <nav class="site-nav" aria-label="Main">
        ${link("/#places", "Places", "places")}
        ${link("/itineraries/", "Itineraries", "itineraries")}
        ${link("/getting-around/", "Getting around", "essentials")}
      </nav>
    </div>
  </header>`;
}

export function footer() {
  return `<footer class="site-footer">
    <div class="wrap">
      <div><strong>${esc(CONFIG.siteName)}</strong>A travel guide to Albania, from the Ionian coast to the Albanian Alps.</div>
      <div>Some booking links are affiliate links: if you book through them we may earn a small commission at no extra cost to you.</div>
      <div>Photos come from Wikimedia Commons and are credited on each image. Travel details change; check times and prices locally before you go.</div>
    </div>
  </footer>`;
}

export function placeCard(p) {
  return `<a class="card" href="${placeUrl(p.id)}" data-category="${esc(p.category)}">
    ${plate(p.image, { width: 800, alt: p.name })}
    <div class="meta"><span class="eyebrow">${esc(categoryLabel(p.category))} · ${esc(REGIONS[p.region])}</span><span class="coords">${formatCoords(p.coords)}</span></div>
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.tagline)}</p>
  </a>`;
}

export function tripCard(t) {
  return `<a class="card" href="${tripUrl(t.id)}">
    ${plate(t.image, { width: 1000, alt: t.title })}
    <div class="meta"><span class="eyebrow">${t.days.length} days · ${esc(t.pace)}</span></div>
    <h3>${esc(t.title)}</h3>
    <p>${esc(t.tagline)}</p>
  </a>`;
}

/* ---------- Home ---------- */
export function homeMain(places, itineraries) {
  const sea = places.find((p) => p.id === "ksamil");
  const peaks = places.find((p) => p.id === "valbona");
  const chips = CATEGORIES.map((c) =>
    `<button class="chip" type="button" id="chip-${c.id}" data-cat="${c.id}" aria-pressed="${c.id === "all"}">${c.label}</button>`
  ).join("");
  return `
    <section class="hero-split" aria-label="From the coast to the mountains">
      ${plate(sea.image, { alt: "Clear water at Ksamil on the Ionian coast", eager: true })}
      ${plate(peaks.image, { alt: "Peaks above the Valbona valley", eager: true })}
      <div class="hero-copy"><div class="wrap">
        <p class="eyebrow" style="color:#ffb3b6">Albania, from sea level to 2,764 m</p>
        <h1>From the Ionian to the <em>Accursed Mountains</em></h1>
        <p>Where to go, how to get there and what to look out for on your first trip to Albania.</p>
        <div class="hero-labels"><span class="coords">Ionian Sea · 39.8° N</span><span class="coords">Albanian Alps · 42.4° N</span></div>
      </div></div>
    </section>

    <section class="section" id="places">
      <div class="wrap">
        <div class="section-head">
          <div><p class="eyebrow">Places</p><h2>Where to go in Albania</h2></div>
          <p>${places.length} places that show the range of the country, from island-dotted coves to valleys reached only by boat and on foot.</p>
        </div>
        <div class="chips" id="chips" role="group" aria-label="Filter places">${chips}</div>
        <div class="grid" id="grid">${places.map(placeCard).join("")}</div>
        <p class="empty" id="grid-empty" hidden>Nothing here yet.</p>
      </div>
    </section>

    <section class="section" id="itineraries" style="padding-top:0">
      <div class="wrap">
        <div class="section-head">
          <div><p class="eyebrow">Itineraries</p><h2>Ready-made trips</h2></div>
          <p>Day-by-day plans with travel times, where to sleep and what to see, from a long weekend to a week in the mountains.</p>
        </div>
        <div class="teaser">${itineraries.map(tripCard).join("")}</div>
      </div>
    </section>

    <section class="band section">
      <div class="wrap">
        <p class="eyebrow">Before you go</p>
        <h2>Three things first-timers wish they'd known</h2>
        <div class="tips">
          <div><h3>Buses run on local knowledge</h3><p>There's no national timetable. Your guesthouse is the best source for departure times and stops, and most buses leave in the morning.</p></div>
          <div><h3>Cash rules in the mountains</h3><p>Carry Albanian lek. There are no ATMs in Theth or Valbona, and minibuses and guesthouses rarely take cards.</p></div>
          <div><h3>Roads take longer than maps say</h3><p>Mountain and coastal roads are slow and winding. Add a third to your map's estimate and avoid driving them after dark.</p></div>
        </div>
        <a class="more" href="/getting-around/">Read the full Getting around guide →</a>
      </div>
    </section>`;
}

/* ---------- Place ---------- */
export function placeMain(p, places, itineraries) {
  const index = places.indexOf(p);
  const links = affiliateLinks(p);
  const prev = places[(index - 1 + places.length) % places.length];
  const next = places[(index + 1) % places.length];
  const nearby = places.filter((q) => q.region === p.region && q.id !== p.id).slice(0, 3);
  const trips = itineraries.filter((t) => t.days.some((d) => d.places.includes(p.id)));
  return `
    <section class="plate place-hero" data-photo="${esc(photoKey(p.image))}" data-width="2000">
      <img alt="${esc(p.name)}" fetchpriority="high" decoding="async">
      <figcaption class="credit"></figcaption>
      <div class="hero-copy"><div class="wrap">
        <p class="eyebrow">${esc(categoryLabel(p.category))} · ${esc(REGIONS[p.region])}</p>
        <h1>${esc(p.name)}</h1>
        <p>${esc(p.tagline)}</p>
      </div></div>
    </section>

    <section class="facts"><div class="wrap">
      <dl>
        <div><dt>Best time</dt><dd>${esc(p.bestTime)}</dd></div>
        <div><dt>Time to spend</dt><dd>${esc(p.days)}</dd></div>
        <div><dt>Region</dt><dd>${esc(REGIONS[p.region])}</dd></div>
        <div><dt>Coordinates</dt><dd class="coords">${formatCoords(p.coords)}</dd></div>
      </dl>
    </div></section>

    <div class="wrap place-body">
      <article class="prose">
        <div class="lede">${p.summary.map((s) => `<p>${esc(s)}</p>`).join("")}</div>
        <section><h2>Don't miss in ${esc(p.name)}</h2><ul class="list">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></section>
        <section><h2>How to get to ${esc(p.name)}</h2><ul class="list steps">${p.gettingThere.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></section>
        <section class="caution"><h2>Watch out for</h2><ul class="list">${p.watchOut.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></section>
        ${p.gallery?.length ? `<section class="gallery">${p.gallery.map((g) => plate(g, { width: 1400, alt: p.name })).join("")}</section>` : ""}
        ${trips.length ? `<section><h2>Itineraries that include ${esc(p.name)}</h2><ul class="list">${trips.map((t) => `<li><a href="${tripUrl(t.id)}">${esc(t.title)}</a></li>`).join("")}</ul></section>` : ""}
      </article>
      <aside class="aside">
        <div class="book">
          <h2>Plan your visit</h2>
          <p>Compare tours, activities and places to stay around ${esc(p.name)}.</p>
          <a class="btn primary" href="${esc(links.tours)}" target="_blank" rel="sponsored noopener">Find tours and activities <span>GetYourGuide ↗</span></a>
          <a class="btn" href="${esc(links.stays)}" target="_blank" rel="sponsored noopener">Find a place to stay <span>Booking.com ↗</span></a>
          <a class="btn" href="${esc(links.directions)}" target="_blank" rel="noopener">Directions <span>Maps ↗</span></a>
          <p class="fineprint">Booking links may earn us a small commission at no extra cost to you.</p>
        </div>
      </aside>
    </div>

    ${nearby.length ? `<section class="section" style="padding-top:0"><div class="wrap">
      <div class="section-head"><h2>Also in ${esc(REGIONS[p.region])}</h2></div>
      <div class="grid">${nearby.map(placeCard).join("")}</div>
    </div></section>` : ""}

    <nav class="wrap pager" aria-label="More places">
      <a href="${placeUrl(prev.id)}"><span class="eyebrow">Previous</span><strong>${esc(prev.name)}</strong></a>
      <a href="${placeUrl(next.id)}"><span class="eyebrow">Next</span><strong>${esc(next.name)}</strong></a>
    </nav>`;
}

/* ---------- Itineraries ---------- */
export function tripsIndexMain(itineraries) {
  return `
    <section class="wrap page-intro">
      <p class="eyebrow">Itineraries</p>
      <h1>Albania itineraries</h1>
      <p>Day-by-day trips with travel times, where to stay and what to see each day. Pick one that matches your time and your taste for beaches, cities or mountains.</p>
    </section>
    <div class="wrap section" style="padding-top:32px">
      <div class="teaser">${itineraries.map(tripCard).join("")}</div>
    </div>`;
}

const shortTitle = (t) => t.short || t.title;

export function tripMain(trip, itineraries, placeById) {
  const tabs = itineraries.map((t) =>
    `<a href="${tripUrl(t.id)}"${t.id === trip.id ? ' aria-current="page"' : ""}>${esc(shortTitle(t))}</a>`
  ).join("");
  const others = itineraries.filter((t) => t.id !== trip.id);

  const dayHtml = (d, i) => {
    const stops = d.places.map((id) => placeById[id]).filter(Boolean);
    const last = stops[stops.length - 1];
    return `<section class="day" id="day-${i + 1}" aria-labelledby="day-${i + 1}-title">
      <div class="day-head">
        <p class="eyebrow">Day ${i + 1} · Overnight in ${esc(d.base)}</p>
        <h2 id="day-${i + 1}-title">${esc(d.title)}</h2>
        <p class="day-travel coords">${esc(d.travel)}</p>
      </div>
      ${last ? plate(last.image, { width: 1400, alt: last.name }) : ""}
      <dl class="dayparts">
        <div><dt>Morning</dt><dd>${esc(d.morning)}</dd></div>
        <div><dt>Afternoon</dt><dd>${esc(d.afternoon)}</dd></div>
        <div><dt>Evening</dt><dd>${esc(d.evening)}</dd></div>
      </dl>
      <p class="day-tip"><strong>Tip:</strong> ${esc(d.tip)}</p>
      <div class="day-links">
        ${stops.map((p) => `<a class="btn" href="${placeUrl(p.id)}">${esc(p.name)} guide <span>→</span></a>`).join("")}
        <a class="btn primary" href="${esc(bookingUrl(d.stay))}" target="_blank" rel="sponsored noopener">Stays in ${esc(d.base)} <span>Booking.com ↗</span></a>
      </div>
    </section>`;
  };

  return `
    <section class="plate trip-hero" data-photo="${esc(photoKey(trip.image))}" data-width="2000">
      <img alt="${esc(trip.title)}" fetchpriority="high" decoding="async">
      <figcaption class="credit"></figcaption>
      <div class="hero-copy"><div class="wrap">
        <p class="eyebrow">Itinerary · ${trip.days.length} days</p>
        <h1>${esc(trip.title)}</h1>
        <p>${esc(trip.tagline)}</p>
        <nav class="trip-tabs" aria-label="Choose an itinerary">${tabs}</nav>
      </div></div>
    </section>

    <section class="facts"><div class="wrap">
      <dl>
        <div><dt>Best for</dt><dd>${esc(trip.bestFor)}</dd></div>
        <div><dt>Getting around</dt><dd>${esc(trip.transport)}</dd></div>
        <div><dt>Pace</dt><dd>${esc(trip.pace)}</dd></div>
        <div><dt>Route</dt><dd>${trip.days.map((d) => d.base).filter((b, i, all) => b !== all[i - 1]).map(esc).join(" → ")}</dd></div>
      </dl>
    </div></section>

    <div class="wrap trip-body">
      <nav class="day-nav" aria-label="Days">
        <p class="eyebrow">Day by day</p>
        <ol>${trip.days.map((d, i) => `<li><a href="#day-${i + 1}"><strong>Day ${i + 1}</strong><span>${esc(d.title)}</span></a></li>`).join("")}</ol>
        <p class="other">More trips:</p>
        <ul class="other-list">${others.map((t) => `<li><a href="${tripUrl(t.id)}">${esc(t.title)}</a></li>`).join("")}</ul>
      </nav>
      <div class="days">
        <p class="trip-lede">${esc(trip.summary)}</p>
        ${trip.days.map(dayHtml).join("")}
      </div>
    </div>`;
}

/* ---------- Getting around ---------- */
const ICONS = {
  plane: '<path d="M2 16l20-8-20-8 4 8-4 8z" transform="translate(0 4) scale(1 .8)"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 18v3M16 18v3"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
  car: '<path d="M3 13l2-6h14l2 6v5H3z"/><path d="M3 13h18"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="16.5" cy="16" r="1.2"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'
};

export function essentialsMain(data) {
  return `
    <section class="wrap page-intro">
      <p class="eyebrow">Practical guide</p>
      <h1>Getting around Albania</h1>
      <p>${esc(data.intro)}</p>
      <nav class="jump" aria-label="Sections">${data.sections.map((s) => `<a class="chip" href="#${s.id}">${esc(s.title)}</a>`).join("")}</nav>
    </section>
    <div class="wrap section" style="padding-top:24px">
      ${data.sections.map((s) => `
      <section class="ess" id="${s.id}">
        <div class="ess-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[s.icon] || ICONS.info}</svg>
          <h2>${esc(s.title)}</h2>
        </div>
        <div class="ess-items">${s.items.map((i) => `<div><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join("")}</div>
      </section>`).join("")}
    </div>`;
}
