import { useState } from "react";
import { useLoaderData, useFetcher, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getOrCreateMerchantSettings,
  updateMerchantEmail,
  connectSlackWebhook,
  disconnectSlackWebhook,
  toggleInAppNotifications,
  toggleChannelNotification,
  updateAlertPreferences,
} from "../services/merchant.server";
import SettingsHeaderBanner from "../components/settings/SettingsHeaderBanner";
import EmailDestinationCard from "../components/settings/EmailDestinationCard";
import SlackDestinationCard from "../components/settings/SlackDestinationCard";
import InAppDestinationCard from "../components/settings/InAppDestinationCard";
import AlertPreferencesList from "../components/settings/AlertPreferencesList";
import { settingsStyles } from "../styles/settings.styles";

/**
 * Server Loader: Fetches existing merchant settings or seeds initial defaults.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateMerchantSettings(session.shop);

  return {
    shop: session.shop,
    settings,
  };
};

/**
 * Server Action: Handles email updates, Slack connection/disconnection, channel toggles, and alert preferences.
 */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  try {
    if (actionType === "UPDATE_EMAIL") {
      const email = formData.get("email");
      const updated = await updateMerchantEmail(session.shop, email);
      return { success: true, message: "Notification email updated!", updated };
    }

    if (actionType === "CONNECT_SLACK") {
      const webhookUrl = formData.get("webhookUrl");
      const workspaceName = formData.get("workspaceName");
      const channelName = formData.get("channelName");

      const updated = await connectSlackWebhook(session.shop, {
        webhookUrl,
        workspaceName,
        channelName,
      });
      return { success: true, message: "Slack connected successfully! 🚀", updated };
    }

    if (actionType === "DISCONNECT_SLACK") {
      const updated = await disconnectSlackWebhook(session.shop);
      return { success: true, message: "Slack disconnected.", updated };
    }

    if (actionType === "TOGGLE_CHANNEL") {
      const channel = formData.get("channel");
      const isEnabled = formData.get("isEnabled") === "true";
      const updated = await toggleChannelNotification(session.shop, channel, isEnabled);
      return {
        success: true,
        message: `${channel} notifications ${isEnabled ? "enabled" : "disabled"}`,
        updated,
      };
    }

    if (actionType === "TOGGLE_IN_APP") {
      const isEnabled = formData.get("isEnabled") === "true";
      const updated = await toggleInAppNotifications(session.shop, isEnabled);
      return {
        success: true,
        message: isEnabled ? "In-app notifications enabled" : "In-app notifications disabled",
        updated,
      };
    }

    if (actionType === "UPDATE_ALERT_PREFERENCES") {
      const key = formData.get("key");
      const value = formData.get("value") === "true";
      const updated = await updateAlertPreferences(session.shop, { [key]: value });
      return { success: true, message: "Preferences updated", updated };
    }

    return { success: false, error: "Unknown action" };
  } catch (err) {
    console.error("Settings action error:", err);
    return { success: false, error: err.message };
  }
};

export default function SettingsPage() {
  const { settings } = useLoaderData();
  const enabledTypes = settings?.enabledNotificationTypes || ["EMAIL", "SLACK", "IN_APP"];
  const isEmailEnabled = enabledTypes.includes("EMAIL");
  const isSlackEnabled = enabledTypes.includes("SLACK");
  const isInAppEnabled = enabledTypes.includes("IN_APP");

  return (
    <div style={settingsStyles.container}>
      {/* FlowPacks Purple Header Banner */}
      <SettingsHeaderBanner />

      {/* Section 1: Notification destinations */}
      <div style={settingsStyles.sectionWrapper}>
        <div style={settingsStyles.sectionHeader}>
          <h2 style={settingsStyles.sectionTitle}>Notification destinations</h2>
          <p style={settingsStyles.sectionSubtitle}>
            Connect and manage where you want to receive alerts from your automations.
          </p>
        </div>

        <div style={settingsStyles.destinationsGrid}>
          {/* Card 1: Email */}
          <EmailDestinationCard
            initialEmail={settings?.notificationEmail || ""}
            isEnabled={isEmailEnabled}
          />

          {/* Card 2: Slack */}
          <SlackDestinationCard
            slackWebhookUrl={settings?.slackWebhookUrl || ""}
            slackWorkspaceName={settings?.slackWorkspaceName || ""}
            slackChannelName={settings?.slackChannelName || ""}
            isEnabled={isSlackEnabled}
          />

          {/* Card 3: In-app notifications */}
          <InAppDestinationCard isEnabled={isInAppEnabled} />
        </div>
      </div>

      {/* Section 2: Notification alerts */}
      <div style={settingsStyles.sectionWrapper}>
        <div style={settingsStyles.sectionHeader}>
          <h2 style={settingsStyles.sectionTitle}>Notification alerts</h2>
          <p style={settingsStyles.sectionSubtitle}>
            Choose what kind of alerts you want to receive.
          </p>
        </div>

        <AlertPreferencesList
          alertOnTriggered={settings?.alertOnTriggered ?? true}
          alertOnFailed={settings?.alertOnFailed ?? true}
          alertWeeklyDigest={settings?.alertWeeklyDigest ?? true}
        />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
