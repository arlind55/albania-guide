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

function plate(file, { width = 1600, alt = "", eager = false } = {}) {
  return `<figure class="plate" data-photo="${esc(file)}" data-width="${width}">
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
    <section class="plate place-hero" data-photo="${esc(p.image)}" data-width="2000">
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

const pages = { home: initHome, place: initPlace, essentials: initEssentials };
pages[document.body.dataset.page]?.().catch((err) => {
  console.error(err);
  const main = $("main");
  if (main) main.insertAdjacentHTML("afterbegin", `<p class="wrap empty">Something went wrong loading this page. Refresh to try again.</p>`);
});

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
