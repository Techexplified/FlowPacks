import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateMerchantSettings, completeMerchantOnboarding, connectSlackWebhook, disconnectSlackWebhook } from "../services/merchant.server";
import { embedRedirect } from "../utils/shopify-embed-nav.server.js";
import WelcomeStep from "../components/onboarding/WelcomeStep";
import NotificationSetupStep from "../components/onboarding/NotificationSetupStep";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  let adminShopEmail = null;
  let shopName = session.shop;

  try {
    const response = await admin.graphql(
      `#graphql
      query getShopInfo {
        shop {
          name
          email
        }
      }`
    );
    const result = await response.json();
    adminShopEmail = result?.data?.shop?.email || null;
    shopName = result?.data?.shop?.name || session.shop;
  } catch (err) {
    console.error("Could not fetch shop info from GraphQL Admin API:", err);
  }

  const merchantSettings = await getOrCreateMerchantSettings(session.shop, adminShopEmail);

  // Route Guard: If onboarding is already completed, redirect to Automation Library
  if (merchantSettings?.hasCompletedOnboarding) {
    throw embedRedirect("/app/automation-library", request);
  }

  return {
    shop: session.shop,
    shopName,
    adminShopEmail,
    merchantSettings,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const actionType = formData.get("actionType") || formData.get("intent");

  if (actionType === "CONNECT_SLACK") {
    const webhookUrl = formData.get("webhookUrl");
    const workspaceName = formData.get("workspaceName");
    const channelName = formData.get("channelName");

    try {
      const updated = await connectSlackWebhook(session.shop, {
        webhookUrl,
        workspaceName,
        channelName,
      });
      return { success: true, message: "Slack connected successfully! 🚀", updated };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Failed to connect Slack webhook. Please try again.",
      };
    }
  }

  if (actionType === "DISCONNECT_SLACK") {
    try {
      const updated = await disconnectSlackWebhook(session.shop);
      return { success: true, message: "Slack disconnected.", updated };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Failed to disconnect Slack webhook. Please try again.",
      };
    }
  }

  const notificationEmail = formData.get("notificationEmail");
  const rawChannels = formData.get("enabledNotificationTypes");
  const webhookUrl = formData.get("webhookUrl");
  const workspaceName = formData.get("workspaceName");
  const channelName = formData.get("channelName");

  let enabledNotificationTypes = [];
  try {
    enabledNotificationTypes = rawChannels ? JSON.parse(rawChannels) : [];
  } catch (e) {
    enabledNotificationTypes = ["EMAIL", "SLACK", "IN_APP"];
  }

  try {
    await completeMerchantOnboarding(session.shop, {
      notificationEmail,
      enabledNotificationTypes,
      webhookUrl,
      workspaceName,
      channelName,
    });

    throw embedRedirect("/app/automation-library", request);
  } catch (err) {
    if (err instanceof Response) throw err;
    return {
      success: false,
      error: err.message || "Failed to complete onboarding. Please try again.",
    };
  }
};

export default function OnboardingRoute() {
  const { shopName, adminShopEmail, merchantSettings } = useLoaderData();
  const fetcher = useFetcher();
  const [currentStep, setCurrentStep] = useState(1);

  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";
  const errorMessage = fetcher.data?.error || null;

  const handleStep2Submit = (data) => {
    fetcher.submit(
      {
        notificationEmail: data.notificationEmail,
        enabledNotificationTypes: JSON.stringify(data.enabledNotificationTypes),
        ...(data.webhookUrl ? { webhookUrl: data.webhookUrl } : {}),
        ...(data.workspaceName ? { workspaceName: data.workspaceName } : {}),
        ...(data.channelName ? { channelName: data.channelName } : {}),
      },
      { method: "POST" }
    );
  };

  return (
    <div style={pageStyles.wrapper}>
      {currentStep === 1 ? (
        <WelcomeStep onContinue={() => setCurrentStep(2)} />
      ) : (
        <NotificationSetupStep
          defaultEmail={adminShopEmail}
          initialSettings={merchantSettings}
          shopName={shopName}
          onBack={() => setCurrentStep(1)}
          onSubmit={handleStep2Submit}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

const pageStyles = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#F4F6F8",
    padding: "32px 20px",
    boxSizing: "border-box",
  },
};
