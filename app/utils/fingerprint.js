import crypto from "node:crypto";

export function generateFingerprint(recipeSlug, flaggedItems = []) {
  if (recipeSlug === "weekly-performance-digest") {
    const item = flaggedItems[0] || {};
    const raw = `${Math.round(item.totalSales || 0)}_${item.totalOrders || 0}`;
    return crypto.createHash("md5").update(raw).digest("hex");
  }

  // For product-based alerts:
  const ids = flaggedItems
    .map((i) => i.productId || i.title || "")
    .filter(Boolean)
    .sort()
    .join(",");

  return crypto.createHash("md5").update(`${recipeSlug}:${ids}`).digest("hex");
}
