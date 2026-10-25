// Site-wide settings. Fill in the affiliate IDs once the partner accounts are approved;
// links still work without them, they just won't earn commission.
export const CONFIG = {
  siteName: "Udha",
  tagline: "Your guide to Albania",
  affiliates: {
    getyourguide: { partnerId: "" },
    booking: { aid: "" }
  }
};

export const CATEGORIES = [
  { id: "all", label: "Everything" },
  { id: "beaches", label: "Beaches" },
  { id: "mountains", label: "Mountains" },
  { id: "history", label: "History" },
  { id: "cities", label: "Cities" },
  { id: "nature", label: "Nature" }
];

export const REGIONS = {
  north: "The North",
  central: "Central Albania",
  south: "The South"
};
