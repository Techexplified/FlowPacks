import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateMerchantSettings } from "../services/merchant.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const merchant = await getOrCreateMerchantSettings(session.shop);

  if (!merchant?.hasCompletedOnboarding) {
    throw embedRedirect("/app/onboarding", request);
  }

  throw embedRedirect("/app/automation-library", request);
};

export default function AppIndexRedirect() {
  return null;
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
