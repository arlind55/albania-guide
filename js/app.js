import { CONFIG, CATEGORIES, REGIONS } from "./config.js";
import { hydratePhotos } from "./commons.js";

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

function formatCoords([lat, lng]) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns}  ${Math.abs(lng).toFixed(2)}° ${ew}`;
}

function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// A photo is one Commons file name or a list of candidates, best first.
const photoKey = (photo) => (Array.isArray(photo) ? photo.join("|") : photo);

function plate(file, { width = 1600, alt = "", eager = false } = {}) {
  return `<figure class="plate" data-photo="${esc(photoKey(file))}" data-width="${width}">
    <img alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    <figcaption class="credit"></figcaption>
  </figure>`;
}

export function affiliateLinks(place) {
  const { getyourguide, booking } = CONFIG.affiliates;
  const tours = new URL("https://www.getyourguide.com/s/");
  tours.searchParams.set("q", place.book.tours);
  if (getyourguide.partnerId) tours.searchParams.set("partner_id", getyourguide.partnerId);
  const stays = new URL("https://www.booking.com/searchresults.html");
  stays.searchParams.set("ss", place.book.stays);
  if (booking.aid) stays.searchParams.set("aid", booking.aid);
  const [lat, lng] = place.coords;
  return {
    tours: tours.toString(),
    stays: stays.toString(),
    directions: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  };
}

function header(current, solid) {
  const link = (href, label, key) =>
    `<a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<header class="site-header${solid ? " solid" : ""}">
    <div class="wrap">
      <a class="wordmark" href="./">${esc(CONFIG.siteName)} <small>${esc(CONFIG.tagline)}</small></a>
      <nav class="site-nav" aria-label="Main">
        ${link("./#places", "Places", "places")}
        ${link("itineraries.html", "Itineraries", "itineraries")}
        ${link("essentials.html", "Getting around", "essentials")}
      </nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="wrap">
      <div><strong>${esc(CONFIG.siteName)}</strong>An early preview of a travel guide to Albania, from the Ionian coast to the Albanian Alps.</div>
      <div>Some booking links are affiliate links: if you book through them we may earn a small commission at no extra cost to you.</div>
      <div>Photos come from Wikimedia Commons and are credited on each image. Travel details change; check times and prices locally before you go.</div>
    </div>
  </footer>`;
}

function card(p) {
  return `<a class="card" href="place.html?id=${encodeURIComponent(p.id)}">
    ${plate(p.image, { width: 800, alt: p.name })}
    <div class="meta"><span class="eyebrow">${esc(categoryLabel(p.category))} · ${esc(REGIONS[p.region])}</span><span class="coords">${formatCoords(p.coords)}</span></div>
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.tagline)}</p>
  </a>`;
}

/* ---------- Home ---------- */
async function initHome() {
  const { places } = await loadJSON("data/places.json");
  $("#header").innerHTML = header("places", false);
  $("#footer").innerHTML = footer();

  const sea = places.find((p) => p.id === "ksamil");
  const peaks = places.find((p) => p.id === "valbona");
  $("#hero-plates").innerHTML =
    plate(sea.image, { alt: "Clear water at Ksamil on the Ionian coast", eager: true }) +
    plate(peaks.image, { alt: "Peaks above the Valbona valley", eager: true });

  let active = "all";
  try { active = localStorage.getItem("udha-filter") || "all"; } catch { /* ignore */ }
  if (!CATEGORIES.some((c) => c.id === active)) active = "all";

  const chips = $("#chips");
  const grid = $("#grid");
  const render = () => {
    chips.innerHTML = CATEGORIES.map((c) =>
      `<button class="chip" type="button" id="chip-${c.id}" data-cat="${c.id}" aria-pressed="${c.id === active}">${c.label}</button>`
    ).join("");
    const shown = places.filter((p) => active === "all" || p.category === active);
    grid.innerHTML = shown.length ? shown.map(card).join("") : `<p class="empty">Nothing here yet.</p>`;
    hydratePhotos(grid);
  };
  loadJSON("data/itineraries.json").then(({ itineraries }) => {
    $("#trips").innerHTML = itineraries.map((t) => `<a class="card" href="itineraries.html?trip=${encodeURIComponent(t.id)}">
      ${plate(t.image, { width: 1000, alt: t.title })}
      <div class="meta"><span class="eyebrow">${t.days.length} days · ${esc(t.pace)}</span></div>
      <h3>${esc(t.title)}</h3>
      <p>${esc(t.tagline)}</p>
    </a>`).join("");
    hydratePhotos($("#trips"));
  });

  chips.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    active = btn.dataset.cat;
    try { localStorage.setItem("udha-filter", active); } catch { /* ignore */ }
    render();
  });
  render();
  hydratePhotos();
}

/* ---------- Place ---------- */
async function initPlace() {
  const { places } = await loadJSON("data/places.json");
  const id = new URLSearchParams(location.search).get("id");
  const index = Math.max(0, places.findIndex((p) => p.id === id));
  const p = places[index];
  document.title = `${p.name} · ${CONFIG.siteName}`;
  $("meta[name=description]")?.setAttribute("content", p.tagline);

  $("#header").innerHTML = header(null, false);
  $("#footer").innerHTML = footer();
  const links = affiliateLinks(p);
  const prev = places[(index - 1 + places.length) % places.length];
  const next = places[(index + 1) % places.length];
  const nearby = places.filter((q) => q.region === p.region && q.id !== p.id).slice(0, 3);

  $("#place").innerHTML = `
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
        <section><h2>Don't miss</h2><ul class="list">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></section>
        <section><h2>Getting there</h2><ul class="list steps">${p.gettingThere.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></section>
        <section class="caution"><h2>Watch out for</h2><ul class="list">${p.watchOut.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></section>
        ${p.gallery?.length ? `<section class="gallery">${p.gallery.map((g) => plate(g, { width: 1400, alt: p.name })).join("")}</section>` : ""}
      </article>
      <aside class="aside">
        <div class="book">
          <h2>Plan your visit</h2>
          <p>Compare tours, activities and places to stay around ${esc(p.name)}.</p>
          <a class="btn primary" href="${links.tours}" target="_blank" rel="sponsored noopener">Find tours and activities <span>GetYourGuide ↗</span></a>
          <a class="btn" href="${links.stays}" target="_blank" rel="sponsored noopener">Find a place to stay <span>Booking.com ↗</span></a>
          <a class="btn" href="${links.directions}" target="_blank" rel="noopener">Directions <span>Maps ↗</span></a>
          <p class="fineprint">Booking links may earn us a small commission at no extra cost to you.</p>
        </div>
      </aside>
    </div>

    ${nearby.length ? `<section class="section" style="padding-top:0"><div class="wrap">
      <div class="section-head"><h2>Also in ${esc(REGIONS[p.region])}</h2></div>
      <div class="grid">${nearby.map(card).join("")}</div>
    </div></section>` : ""}

    <nav class="wrap pager" aria-label="More places">
      <a href="place.html?id=${prev.id}"><span class="eyebrow">Previous</span><strong>${esc(prev.name)}</strong></a>
      <a href="place.html?id=${next.id}"><span class="eyebrow">Next</span><strong>${esc(next.name)}</strong></a>
    </nav>`;
  hydratePhotos();
}

/* ---------- Essentials ---------- */
const ICONS = {
  plane: '<path d="M2 16l20-8-20-8 4 8-4 8z" transform="translate(0 4) scale(1 .8)"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16M8 18v3M16 18v3"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
  car: '<path d="M3 13l2-6h14l2 6v5H3z"/><path d="M3 13h18"/><circle cx="7.5" cy="16" r="1.2"/><circle cx="16.5" cy="16" r="1.2"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'
};

async function initEssentials() {
  const data = await loadJSON("data/essentials.json");
  $("#header").innerHTML = header("essentials", true);
  $("#footer").innerHTML = footer();
  $("#intro").textContent = data.intro;
  $("#jump").innerHTML = data.sections.map((s) => `<a class="chip" href="#${s.id}">${esc(s.title)}</a>`).join("");
  $("#sections").innerHTML = data.sections.map((s) => `
    <section class="ess" id="${s.id}">
      <div class="ess-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[s.icon] || ICONS.info}</svg>
        <h2>${esc(s.title)}</h2>
      </div>
      <div class="ess-items">${s.items.map((i) => `<div><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join("")}</div>
    </section>`).join("");
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

/* ---------- Itineraries ---------- */
async function initItineraries() {
  const [{ itineraries }, { places }] = await Promise.all([loadJSON("data/itineraries.json"), loadJSON("data/places.json")]);
  const wanted = new URLSearchParams(location.search).get("trip");
  const trip = itineraries.find((t) => t.id === wanted) || itineraries[0];
  const placeById = Object.fromEntries(places.map((p) => [p.id, p]));
  document.title = `${trip.title} · ${CONFIG.siteName}`;
  $("meta[name=description]")?.setAttribute("content", trip.tagline);

  $("#header").innerHTML = header("itineraries", false);
  $("#footer").innerHTML = footer();

  const tabs = itineraries.map((t) =>
    `<a href="itineraries.html?trip=${encodeURIComponent(t.id)}"${t.id === trip.id ? ' aria-current="page"' : ""}>${esc(t.title.replace(/^Albania in /, ""))}</a>`
  ).join("");
  const others = itineraries.filter((t) => t.id !== trip.id);

  const dayHtml = (d, i) => {
    const stops = d.places.map((id) => placeById[id]).filter(Boolean);
    const photo = stops[stops.length - 1]?.image;
    const stays = new URL("https://www.booking.com/searchresults.html");
    stays.searchParams.set("ss", d.stay);
    if (CONFIG.affiliates.booking.aid) stays.searchParams.set("aid", CONFIG.affiliates.booking.aid);
    return `<section class="day" id="day-${i + 1}" aria-labelledby="day-${i + 1}-title">
      <div class="day-head">
        <p class="eyebrow">Day ${i + 1} · Overnight in ${esc(d.base)}</p>
        <h2 id="day-${i + 1}-title">${esc(d.title)}</h2>
        <p class="day-travel coords">${esc(d.travel)}</p>
      </div>
      ${photo ? plate(photo, { width: 1400, alt: stops[stops.length - 1].name }) : ""}
      <dl class="dayparts">
        <div><dt>Morning</dt><dd>${esc(d.morning)}</dd></div>
        <div><dt>Afternoon</dt><dd>${esc(d.afternoon)}</dd></div>
        <div><dt>Evening</dt><dd>${esc(d.evening)}</dd></div>
      </dl>
      <p class="day-tip"><strong>Tip:</strong> ${esc(d.tip)}</p>
      <div class="day-links">
        ${stops.map((p) => `<a class="btn" href="place.html?id=${encodeURIComponent(p.id)}">${esc(p.name)} guide <span>→</span></a>`).join("")}
        <a class="btn primary" href="${stays.toString()}" target="_blank" rel="sponsored noopener">Stays in ${esc(d.base)} <span>Booking.com ↗</span></a>
      </div>
    </section>`;
  };

  $("#trip").innerHTML = `
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
        ${others.map((t) => `<p class="other">${t.days.length > trip.days.length ? "Got more time?" : "Short on time?"} <a href="itineraries.html?trip=${encodeURIComponent(t.id)}">${esc(t.title)}</a></p>`).join("")}
      </nav>
      <div class="days">
        <p class="trip-lede">${esc(trip.summary)}</p>
        ${trip.days.map(dayHtml).join("")}
      </div>
    </div>`;

  // Highlight the day currently on screen in the left-hand menu.
  const links = [...document.querySelectorAll(".day-nav a")];
  const setActive = (id) => links.forEach((a) => {
    const on = a.getAttribute("href") === `#${id}`;
    a.setAttribute("aria-current", on ? "true" : "false");
    if (on && matchMedia("(max-width: 820px)").matches) {
      a.parentElement.parentElement.scrollTo({ left: a.parentElement.offsetLeft - 16, behavior: "smooth" });
    }
  });
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible[0]) setActive(visible[0].target.id);
  }, { rootMargin: "-20% 0px -60% 0px" });
  document.querySelectorAll(".day").forEach((el) => observer.observe(el));
  setActive("day-1");

  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  hydratePhotos();
}

const pages = { home: initHome, place: initPlace, essentials: initEssentials, itineraries: initItineraries };
pages[document.body.dataset.page]?.().catch((err) => {
  console.error(err);
  const main = $("main");
  if (main) main.insertAdjacentHTML("afterbegin", `<p class="wrap empty">Something went wrong loading this page. Refresh to try again.</p>`);
});

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
