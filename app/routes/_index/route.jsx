import { redirect } from "react-router";
import { authenticate } from "../../shopify.server";
import { getOrCreateMerchantSettings } from "../../services/merchant.server";

const EMBED_QUERY_KEYS = [
  "shop",
  "host",
  "embedded",
  "hmac",
  "id_token",
  "session",
  "timestamp",
  "locale",
];

function hasEmbedContext(url) {
  return EMBED_QUERY_KEYS.some((key) => url.searchParams.has(key));
}

function isLikelyShopifyAdminReferer(request) {
  const referer = request.headers.get("Referer") || "";
  return (
    referer.includes("admin.shopify.com") ||
    referer.includes(".myshopify.com/admin")
  );
}

function appHomeUrl(request, targetRoute = "/app/automation-library") {
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  return qs ? `${targetRoute}?${qs}` : targetRoute;
}

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  // 1. Embedded admin context or OAuth return — go straight to the app UI with all query params
  if (hasEmbedContext(url) || isLikelyShopifyAdminReferer(request)) {
    throw redirect(appHomeUrl(request));
  }

  // 2. Existing session (e.g. reopen from Apps menu without query params)
  try {
    const { session } = await authenticate.admin(request);
    const merchant = await getOrCreateMerchantSettings(session.shop);
    const destination = !merchant?.hasCompletedOnboarding
      ? "/app/onboarding"
      : "/app/automation-library";
    throw redirect(appHomeUrl(request, destination));
  } catch (error) {
    if (error instanceof Response) throw error;
    throw redirect("/auth/login");
  }
};

export default function Index() {
  return null; // Never render the placeholder page
}
