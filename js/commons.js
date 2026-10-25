// Resolves Wikimedia Commons file names to sized image URLs plus author and licence,
// so every photo on the site carries an accurate credit without us hosting the files.
const API = "https://commons.wikimedia.org/w/api.php";
const CACHE_KEY = "udha-commons-v1";

function readCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
}
function writeCache(cache) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* storage unavailable */ }
}
function stripHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}
export function fallbackImage(file, width) {
  return {
    url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`,
    page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`,
    artist: "",
    license: ""
  };
}

export async function resolveImages(files, width = 1600) {
  const cache = readCache();
  const wanted = [...new Set(files.filter(Boolean))];
  const missing = wanted.filter((f) => !cache[`${width}|${f}`]);

  for (let i = 0; i < missing.length; i += 40) {
    const chunk = missing.slice(i, i + 40);
    const params = new URLSearchParams({
      action: "query", format: "json", formatversion: "2", origin: "*",
      prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: String(width),
      iiextmetadatafilter: "Artist|LicenseShortName",
      titles: chunk.map((f) => `File:${f}`).join("|")
    });
    try {
      const res = await fetch(`${API}?${params}`);
      const data = await res.json();
      const fromTitle = {};
      for (const f of chunk) fromTitle[`File:${f}`] = f;
      for (const n of data.query?.normalized || []) fromTitle[n.to] = fromTitle[n.from];
      for (const page of data.query?.pages || []) {
        const file = fromTitle[page.title];
        const info = page.imageinfo?.[0];
        if (!file || !info) continue;
        const meta = info.extmetadata || {};
        cache[`${width}|${file}`] = {
          url: info.thumburl || info.url,
          page: info.descriptionurl,
          artist: stripHtml(meta.Artist?.value),
          license: meta.LicenseShortName?.value || ""
        };
      }
    } catch { /* offline or API down: fall back below */ }
  }
  writeCache(cache);

  const out = {};
  for (const f of wanted) out[f] = cache[`${width}|${f}`] || fallbackImage(f, width);
  return out;
}

// Fills every [data-photo] plate on the page with its image and credit line.
export async function hydratePhotos(root = document) {
  const plates = [...root.querySelectorAll("[data-photo]:not([data-ready])")];
  if (!plates.length) return;
  const byWidth = {};
  for (const el of plates) (byWidth[el.dataset.width || 1600] ||= []).push(el);

  for (const [width, els] of Object.entries(byWidth)) {
    const images = await resolveImages(els.map((el) => el.dataset.photo), Number(width));
    for (const el of els) {
      const img = images[el.dataset.photo];
      el.dataset.ready = "1";
      const tag = el.querySelector("img");
      tag.addEventListener("error", () => el.classList.add("missing"), { once: true });
      tag.src = img.url;
      const credit = el.querySelector(".credit");
      if (credit) {
        const who = img.artist ? `Photo: ${img.artist}` : "Photo";
        const lic = img.license ? ` · ${img.license}` : "";
        credit.innerHTML = "";
        const a = document.createElement("a");
        a.href = img.page; a.target = "_blank"; a.rel = "noopener";
        a.textContent = `${who}${lic} · Wikimedia Commons`;
        credit.append(a);
      }
    }
  }
}
