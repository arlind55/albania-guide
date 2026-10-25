# From website to iOS and Android app

The site is built so nothing has to be thrown away when it becomes an app.

## Stage 1: installable web app (done)

The site already has a web app manifest, icons and a service worker. On a phone, "Add to Home Screen" installs it with its own icon and full-screen view, and pages you've visited keep working offline. This is the cheapest way to test whether people use it like an app.

## Stage 2: wrap the site with Capacitor

[Capacitor](https://capacitorjs.com) packages an existing website as a native iOS and Android app, with access to native features through plugins. It's the shortest path to the App Store and Google Play.

- Same HTML, CSS, JS and `data/*.json`; no rewrite.
- Add native features where they help travellers: offline maps, saved places, push notifications for ferry or weather alerts, geolocation for "near me".
- Needs an Apple Developer account (yearly fee) and a Google Play developer account (one-off fee).

## Stage 3 (only if needed): a fully native or React Native app

If the app grows into something heavier, such as booking flows, user accounts or complex offline maps, a React Native or native rebuild becomes worth it. The JSON content model carries straight over, and it could be moved into a headless CMS at that point so non-developers can edit places.

## Before going to the stores

- Download and host photos ourselves (with their credits) so the app works fully offline.
- Replace placeholder affiliate IDs with real partner accounts.
- Add a privacy policy and analytics to learn which places and links people use.
