# Content model

All content lives in plain JSON under `data/`, so the website and a future iOS/Android app can share it.

## `data/places.json`

Each entry in `places` is one destination.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | URL slug, e.g. `theth`. Used in `place.html?id=theth`. |
| `name` | string | Display name. |
| `tagline` | string | One line shown on cards and under the title. |
| `region` | `north` \| `central` \| `south` | Labels live in `js/config.js`. |
| `category` | `beaches` \| `mountains` \| `history` \| `cities` \| `nature` | Drives the home page filter. |
| `coords` | `[lat, lng]` | Used for the coordinates label and the Directions link. |
| `image` | string | Wikimedia Commons file name (without `File:`). The hero and card photo. |
| `gallery` | string[] | Optional extra Commons file names. |
| `bestTime` | string | When to go. |
| `days` | string | How long to spend. |
| `summary` | string[] | Paragraphs. The first one is shown larger as the lede. |
| `highlights` | string[] | "Don't miss" list. |
| `gettingThere` | string[] | Transport options, one per line. |
| `watchOut` | string[] | Practical warnings and gotchas. |
| `book.tours` | string | Search term for GetYourGuide. |
| `book.stays` | string | Search term for Booking.com. |

## `data/essentials.json`

The "Getting around" guide: an `intro` and a list of `sections`, each with an `id`, `title`, `icon` (`plane`, `bus`, `car`, `cash`, `info`) and `items` of `{ title, text }`.

## Photos

Photos are not stored in the repo. Each place names a file on [Wikimedia Commons](https://commons.wikimedia.org), and `js/commons.js` asks the Commons API for a sized image plus the author and licence, which are shown as a credit on every photo. To change a photo, find a better file on Commons and paste its file name into `image`.

Commons files are free to reuse, including commercially, as long as they are credited, which the site does automatically. If a file is ever deleted from Commons, the card falls back to a plain colour block.

## Affiliate links

Partner IDs go in `js/config.js`. Links work without them; they just won't earn commission. Airbnb closed its affiliate programme, so stays point to Booking.com.
