// Browser behaviour for the pre-rendered pages: photos, the home page filter and the
// itinerary day menu. The page content itself is built ahead of time by scripts/build.mjs.
import { hydratePhotos } from "./commons.js";

const page = document.body.dataset.page;

/* ---------- Home: filter places by category ---------- */
function initFilter() {
  const chips = document.getElementById("chips");
  const cards = [...document.querySelectorAll("#grid .card")];
  if (!chips) return;
  const apply = (cat) => {
    let shown = 0;
    cards.forEach((c) => { c.hidden = !(cat === "all" || c.dataset.category === cat); if (!c.hidden) shown++; });
    chips.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
    document.getElementById("grid-empty").hidden = shown > 0;
  };
  let saved = "all";
  try { saved = localStorage.getItem("udha-filter") || "all"; } catch { /* storage unavailable */ }
  if (chips.querySelector(`[data-cat="${saved}"]`)) apply(saved);
  chips.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    try { localStorage.setItem("udha-filter", btn.dataset.cat); } catch { /* storage unavailable */ }
    apply(btn.dataset.cat);
  });
}

/* ---------- Itinerary: highlight the day on screen in the left-hand menu ---------- */
function initDayNav() {
  const links = [...document.querySelectorAll(".day-nav a[href^='#day-']")];
  if (!links.length) return;
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
}

if (page === "home") initFilter();
if (page === "trip") initDayNav();
hydratePhotos();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
