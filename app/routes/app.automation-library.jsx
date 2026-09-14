import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function AutomationLibraryPage() {
  return (
    <s-page heading="Automation Library">
      <s-section heading="Onboarding Complete 🎉">
        <s-paragraph>
          Your notification destinations have been saved and all 6 automation recipes are initialized.
        </s-paragraph>
        <s-paragraph>
          The full recipe cards, category filters, and 1-click toggles are being prepared.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
