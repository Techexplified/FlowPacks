import React, { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { settingsStyles } from "../../styles/settings.styles";

/**
 * Card 2: Slack destination configuration with public Slack logo,
 * independent activation toggle, and connection management.
 */
export default function SlackDestinationCard({
  slackWebhookUrl = "",
  slackWorkspaceName = "",
  slackChannelName = "",
  isEnabled = false,
}) {
  const fetcher = useFetcher();
  const isConnected = Boolean(slackWebhookUrl);

  const [isEditing, setIsEditing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(slackWebhookUrl || "");
  const [workspaceName, setWorkspaceName] = useState(slackWorkspaceName || "");
  const [channelName, setChannelName] = useState(slackChannelName || "");

  useEffect(() => {
    setWebhookUrl(slackWebhookUrl || "");
    setWorkspaceName(slackWorkspaceName || "");
    setChannelName(slackChannelName || "");
    if (!slackWebhookUrl) {
      setIsEditing(false);
    }
  }, [slackWebhookUrl, slackWorkspaceName, slackChannelName]);

  const isConnecting =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("actionType") === "CONNECT_SLACK";

  const isDisconnecting =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("actionType") === "DISCONNECT_SLACK";

  const isTogglePending =
    fetcher.formData &&
    fetcher.formData.get("actionType") === "TOGGLE_CHANNEL" &&
    fetcher.formData.get("channel") === "SLACK";

  const active = isTogglePending
    ? fetcher.formData.get("isEnabled") === "true"
    : Boolean(isEnabled && isConnected);

  const handleConnect = (e) => {
    e.preventDefault();
    fetcher.submit(
      {
        actionType: "CONNECT_SLACK",
        webhookUrl: webhookUrl.trim(),
        workspaceName: workspaceName.trim(),
        channelName: channelName.trim(),
      },
      { method: "post" }
    );
    setIsEditing(false);
  };

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect Slack? Alerts will no longer be sent to Slack.")) {
      fetcher.submit(
        { actionType: "DISCONNECT_SLACK" },
        { method: "post" }
      );
      setIsEditing(false);
    }
  };

  const handleToggleActive = () => {
    if (!isConnected) return;
    const nextState = !active;
    fetcher.submit(
      {
        actionType: "TOGGLE_CHANNEL",
        channel: "SLACK",
        isEnabled: String(nextState),
      },
      { method: "post" }
    );
  };

  const handleCancelEdit = () => {
    setWebhookUrl(slackWebhookUrl || "");
    setWorkspaceName(slackWorkspaceName || "");
    setChannelName(slackChannelName || "");
    setIsEditing(false);
  };

  return (
    <div style={settingsStyles.card}>
      <div>
        {/* Card Header */}
        <div style={settingsStyles.cardTop}>
          <div
            style={{
              ...settingsStyles.iconBox,
              backgroundColor: "#FFF7ED",
              overflow: "hidden",
            }}
          >
            {/* Official Slack Logo from public directory */}
            <img
              src="/Slack_Symbol_0.svg"
              alt="Slack"
              style={{ width: "42px", height: "42px", objectFit: "contain" }}
            />
          </div>

          <div style={settingsStyles.cardHeaderTexts}>
            <h3 style={settingsStyles.cardTitle}>Slack</h3>
            <p style={settingsStyles.cardDesc}>
              Get alerts in your Slack workspace.
            </p>
            {isConnected && !isEditing && (
              active ? (
                <span style={settingsStyles.badgeConnected}>
                  ● Connected
                </span>
              ) : (
                <span
                  style={{
                    ...settingsStyles.badgeDisabled,
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                  }}
                >
                  ○ Paused
                </span>
              )
            )}
          </div>
        </div>

        {/* 1. Connected Display State */}
        {isConnected && !isEditing ? (
          <div>
            <div style={settingsStyles.metaGrid}>
              <div>
                <div style={settingsStyles.metaLabel}>Workspace</div>
                <div style={settingsStyles.metaValue} title={slackWorkspaceName || "Connected Workspace"}>
                  {slackWorkspaceName || "Connected Workspace"}
                </div>
              </div>
              <div>
                <div style={settingsStyles.metaLabel}>Default channel</div>
                <div style={settingsStyles.metaValue} title={slackChannelName || "#general"}>
                  {slackChannelName || "#general"}
                </div>
              </div>
            </div>

            <div style={settingsStyles.cardActions}>
              <button
                type="button"
                style={settingsStyles.btnSecondary}
                onClick={() => setIsEditing(true)}
              >
                Change channel
              </button>
              <button
                type="button"
                style={settingsStyles.btnDanger}
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        ) : (
          /* 2. Disconnected / Editing State */
          <form onSubmit={handleConnect}>
            <div style={settingsStyles.formGroup}>
              <label style={settingsStyles.formLabel}>
                Slack Incoming Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                style={settingsStyles.input}
                required
                disabled={isConnecting}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={settingsStyles.formGroup}>
                <label style={settingsStyles.formLabel}>Workspace name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Stride Stores"
                  style={settingsStyles.input}
                  disabled={isConnecting}
                />
              </div>
              <div style={settingsStyles.formGroup}>
                <label style={settingsStyles.formLabel}>Default channel</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. #flowpacks-alerts"
                  style={settingsStyles.input}
                  disabled={isConnecting}
                />
              </div>
            </div>

            <p style={settingsStyles.helperText}>
              Need a webhook? Create an Incoming Webhook in your Slack workspace.
            </p>

            <div style={settingsStyles.cardActions}>
              {isEditing && (
                <button
                  type="button"
                  style={settingsStyles.btnSecondary}
                  onClick={handleCancelEdit}
                  disabled={isConnecting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                style={settingsStyles.btnPrimary}
                disabled={isConnecting}
              >
                {isConnecting
                  ? "Testing & Connecting..."
                  : isConnected
                  ? "Save changes"
                  : "Connect Slack"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 1-Click Toggle Switch for Enabling/Disabling Slack Alerts */}
      {isConnected && !isEditing && (
        <div style={settingsStyles.toggleRow}>
          <span style={settingsStyles.toggleLabel}>
            Enable Slack alerts
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={handleToggleActive}
            style={{
              ...settingsStyles.toggleTrack,
              backgroundColor: active ? "#5C28D8" : "#E5E7EB",
            }}
          >
            <div
              style={{
                ...settingsStyles.toggleThumb,
                transform: active ? "translateX(23px)" : "translateX(3px)",
              }}
            >
              {active && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5C28D8"
                  strokeWidth="3.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
