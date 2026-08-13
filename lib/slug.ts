export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Mirrors slug_from_url() in booking_page_scraper.py so a CSV row's
// booking_url deterministically maps to the same slug the scraper already
// put in that property's page URL - re-importing the same URL always
// upserts the same property instead of creating duplicates.
export function slugFromBookingUrl(url: string): string {
  const base = url.split("?")[0].replace(/\/+$/, "").split("/").pop() ?? "";
  const withoutHtml = base.endsWith(".html") ? base.slice(0, -".html".length) : base;
  return withoutHtml.replace(/\.[a-z]{2}(-[a-z]{2})?$/i, "");
}
