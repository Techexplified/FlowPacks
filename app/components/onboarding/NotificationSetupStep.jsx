import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Sparkles, Mail, Bell, ArrowLeft, ArrowRight } from "lucide-react";
import SlackGuideModal from "../common/SlackGuideModal";

export default function NotificationSetupStep({
  defaultEmail = "",
  initialSettings = {},
  shopName = "Your Store",
  onBack,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}) {
  const fetcher = useFetcher();
  const initialTypes = initialSettings?.enabledNotificationTypes || ["EMAIL", "SLACK", "IN_APP"];

  const [email, setEmail] = useState(initialSettings?.notificationEmail || defaultEmail || "");
  const [emailEnabled, setEmailEnabled] = useState(initialTypes.includes("EMAIL"));
  const [slackEnabled, setSlackEnabled] = useState(initialTypes.includes("SLACK") && Boolean(initialSettings?.slackWebhookUrl));
  const [inAppEnabled, setInAppEnabled] = useState(initialTypes.includes("IN_APP"));

  // Slack state
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(initialSettings?.slackWebhookUrl || "");
  const [slackWorkspaceName, setSlackWorkspaceName] = useState(initialSettings?.slackWorkspaceName || "");
  const [slackChannelName, setSlackChannelName] = useState(initialSettings?.slackChannelName || "");
  const [isSlackEditing, setIsSlackEditing] = useState(!initialSettings?.slackWebhookUrl);
  const [isSlackGuideOpen, setIsSlackGuideOpen] = useState(false);

  const [localError, setLocalError] = useState("");

  // Sync state when fetcher returns from CONNECT_SLACK or DISCONNECT_SLACK
  useEffect(() => {
    if (fetcher.data?.updated) {
      const updated = fetcher.data.updated;
      setSlackWebhookUrl(updated.slackWebhookUrl || "");
      setSlackWorkspaceName(updated.slackWorkspaceName || "");
      setSlackChannelName(updated.slackChannelName || "");
      if (updated.slackWebhookUrl) {
        setIsSlackEditing(false);
        setSlackEnabled(true);
      } else {
        setIsSlackEditing(true);
        setSlackEnabled(false);
      }
    }
  }, [fetcher.data]);

  const isSlackConnected = Boolean(slackWebhookUrl);

  const isConnectingSlack =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("actionType") === "CONNECT_SLACK";

  const isDisconnectingSlack =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("actionType") === "DISCONNECT_SLACK";

  const handleConnectSlack = (e) => {
    e.preventDefault();
    setLocalError("");
    fetcher.submit(
      {
        actionType: "CONNECT_SLACK",
        webhookUrl: slackWebhookUrl.trim(),
        workspaceName: slackWorkspaceName.trim() || `${shopName} Team`,
        channelName: slackChannelName.trim() || "#general",
      },
      { method: "POST" }
    );
  };

  const handleDisconnectSlack = () => {
    if (confirm("Disconnect Slack? Alerts will no longer be sent to your Slack channel.")) {
      fetcher.submit(
        { actionType: "DISCONNECT_SLACK" },
        { method: "POST" }
      );
      setSlackWebhookUrl("");
      setSlackWorkspaceName("");
      setSlackChannelName("");
      setIsSlackEditing(true);
      setSlackEnabled(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    const activeChannels = [];
    if (emailEnabled) activeChannels.push("EMAIL");
    if (slackEnabled && isSlackConnected) activeChannels.push("SLACK");
    if (inAppEnabled) activeChannels.push("IN_APP");

    if (activeChannels.length === 0) {
      setLocalError("At least one notification channel must remain active.");
      return;
    }

    if (emailEnabled && (!email.trim() || !email.includes("@"))) {
      setLocalError("Please enter a valid email address for Email alerts.");
      return;
    }

    if (slackEnabled && !isSlackConnected) {
      setLocalError("Please connect a valid Slack webhook before enabling Slack alerts.");
      return;
    }

    onSubmit({
      notificationEmail: email.trim(),
      emailEnabled,
      slackEnabled,
      inAppEnabled,
      enabledNotificationTypes: activeChannels,
      webhookUrl: slackWebhookUrl ? slackWebhookUrl.trim() : null,
      workspaceName: slackWorkspaceName ? slackWorkspaceName.trim() : null,
      channelName: slackChannelName ? slackChannelName.trim() : null,
    });
  };

  const displayError = errorMessage || localError || fetcher.data?.error || null;

  return (
    <div style={styles.container}>
      {/* Top Header Banner matching Settings aesthetic */}
      <div style={styles.header}>
        {/* Ambient background curves */}
        <div style={styles.bannerCurves}>
          <svg
            style={styles.bannerSvg}
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M-50,20 C200,90 400,-20 650,50 C800,90 950,20 1050,40"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="4"
              fill="none"
            />
            <path
              d="M-20,70 C250,130 500,10 750,80 C900,110 1000,60 1080,70"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="6"
              fill="none"
            />
          </svg>
        </div>

        <div style={styles.brandGroup}>
          <div style={styles.logoWrapper}>
            <Sparkles size={22} color="#5C28D8" strokeWidth={2.2} />
          </div>
          <span style={styles.brandTitle}>FlowPacks</span>
        </div>

        <div style={styles.tagline}>
          <span style={styles.stepIndicator}>Step 2 of 2: Notifications</span>
        </div>
      </div>

      {/* Main Card */}
      <div style={styles.card}>
        <div style={styles.titleSection}>
          <h1 style={styles.heading}>Notification destinations</h1>
          <p style={styles.subheading}>
            Connect and manage where you want to receive alerts from your automations.
          </p>
        </div>

        {displayError && (
          <div style={styles.errorBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          {/* 3 Channels Grid */}
          <div style={styles.cardsGrid}>
            {/* Card 1: Email */}
            <div style={{ ...styles.channelCard, borderColor: emailEnabled ? "#4F46E5" : "#E2E8F0" }}>
              <div>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: "#EEF2FF" }}>
                    <Mail size={22} color="#4F46E5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 style={styles.cardTitle}>Email</h3>
                    <p style={styles.cardSubtitle}>Receive automation alerts via email.</p>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.badgeRow}>
                    {emailEnabled ? (
                      <span
                        style={{
                          ...styles.inAppBadge,
                          backgroundColor: "#EEF2FF",
                          color: "#4F46E5",
                        }}
                      >
                        <span
                          style={{
                            ...styles.inAppBadgeDot,
                            backgroundColor: "#4F46E5",
                          }}
                        />
                        Enabled
                      </span>
                    ) : (
                      <span
                        style={{
                          ...styles.inAppBadge,
                          backgroundColor: "#F3F4F6",
                          color: "#6B7280",
                        }}
                      >
                        <span
                          style={{
                            ...styles.inAppBadgeDot,
                            backgroundColor: "#9CA3AF",
                          }}
                        />
                        Disabled
                      </span>
                    )}
                  </div>

                  <div style={styles.fieldGroup}>
                    <label htmlFor="notification-email-input" style={styles.fieldLabel}>
                      Notification email
                    </label>
                    <input
                      id="notification-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@store.com"
                      disabled={!emailEnabled}
                      style={{
                        ...styles.textInput,
                        opacity: emailEnabled ? 1 : 0.6,
                        backgroundColor: emailEnabled ? "#FFFFFF" : "#F9FAFB",
                      }}
                    />
                    <span style={styles.helperText}>
                      This will be used as the default email for all automation alerts.
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <label style={styles.toggleRow}>
                  <span style={styles.toggleLabel}>Enable email alerts</span>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    style={styles.checkboxInput}
                  />
                </label>
              </div>
            </div>

            {/* Card 2: Slack (Matching Settings Page UI & Logic) */}
            <div
              style={{
                ...styles.channelCard,
                borderColor: isSlackConnected && slackEnabled ? "#10B981" : "#E2E8F0",
              }}
            >
              <div>
                <div style={styles.cardHeader}>
                  <div
                    style={{
                      ...styles.iconBox,
                      backgroundColor: "#FFF7ED",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src="/Slack_Symbol_0.svg"
                      alt="Slack"
                      style={{ width: "42px", height: "42px", objectFit: "contain" }}
                    />
                  </div>
                  <div>
                    <h3 style={styles.cardTitle}>Slack</h3>
                    <p style={styles.cardSubtitle}>Get alerts in your Slack workspace.</p>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  {/* Connected Readout State */}
                  {isSlackConnected && !isSlackEditing ? (
                    <div>
                      <div style={styles.badgeRow}>
                        <span style={styles.connectedBadge}>
                          <span style={styles.badgeDot} />
                          Connected
                        </span>
                      </div>

                      <div style={styles.slackMetaGrid}>
                        <div>
                          <span style={styles.metaLabel}>Workspace</span>
                          <span style={styles.metaValue} title={slackWorkspaceName || "Slack Workspace"}>
                            {slackWorkspaceName || "Slack Workspace"}
                          </span>
                        </div>
                        <div>
                          <span style={styles.metaLabel}>Default channel</span>
                          <span style={styles.metaValue} title={slackChannelName || "#general"}>
                            {slackChannelName || "#general"}
                          </span>
                        </div>
                      </div>

                      <div style={styles.slackActionBtns}>
                        <button
                          type="button"
                          style={styles.btnSecondary}
                          onClick={() => setIsSlackEditing(true)}
                        >
                          Change channel
                        </button>
                        <button
                          type="button"
                          style={styles.btnDanger}
                          onClick={handleDisconnectSlack}
                          disabled={isDisconnectingSlack}
                        >
                          {isDisconnectingSlack ? "Disconnecting..." : "Disconnect"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Disconnected / Editing Form */
                    <div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.fieldLabel}>Slack Incoming Webhook URL</label>
                        <input
                          type="url"
                          value={slackWebhookUrl}
                          onChange={(e) => setSlackWebhookUrl(e.target.value)}
                          placeholder="https://hooks.slack.com/services/..."
                          style={styles.textInput}
                          disabled={isConnectingSlack}
                          required={slackEnabled}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "6px",
                            fontSize: "11.5px",
                            color: "#6B7280",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span>Don't have a webhook URL?</span>
                          <button
                            type="button"
                            onClick={() => setIsSlackGuideOpen(true)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: "#5C28D8",
                              fontWeight: "600",
                              textDecoration: "underline",
                              cursor: "pointer",
                              fontSize: "11.5px",
                              display: "inline",
                            }}
                          >
                            View step-by-step guide →
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                        <div style={styles.fieldGroup}>
                          <label style={styles.fieldLabel}>Workspace name</label>
                          <input
                            type="text"
                            value={slackWorkspaceName}
                            onChange={(e) => setSlackWorkspaceName(e.target.value)}
                            placeholder="e.g. Stride Stores"
                            style={styles.textInput}
                            disabled={isConnectingSlack}
                          />
                        </div>
                        <div style={styles.fieldGroup}>
                          <label style={styles.fieldLabel}>Default channel</label>
                          <input
                            type="text"
                            value={slackChannelName}
                            onChange={(e) => setSlackChannelName(e.target.value)}
                            placeholder="e.g. #flowpacks-alerts"
                            style={styles.textInput}
                            disabled={isConnectingSlack}
                          />
                        </div>
                      </div>

                      <div style={{ ...styles.slackActionBtns, marginTop: "12px" }}>
                        {isSlackConnected && isSlackEditing && (
                          <button
                            type="button"
                            style={styles.btnSecondary}
                            onClick={() => setIsSlackEditing(false)}
                            disabled={isConnectingSlack}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          style={styles.btnPrimary}
                          onClick={handleConnectSlack}
                          disabled={isConnectingSlack || !slackWebhookUrl.trim()}
                        >
                          {isConnectingSlack
                            ? "Testing & Connecting..."
                            : isSlackConnected
                            ? "Save changes"
                            : "Connect Slack"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.cardFooter}>
                <label
                  style={{
                    ...styles.toggleRow,
                    opacity: isSlackConnected ? 1 : 0.6,
                    cursor: isSlackConnected ? "pointer" : "not-allowed",
                  }}
                >
                  <span style={styles.toggleLabel}>Enable Slack alerts</span>
                  <input
                    type="checkbox"
                    checked={slackEnabled && isSlackConnected}
                    onChange={(e) => {
                      if (!isSlackConnected) return;
                      setSlackEnabled(e.target.checked);
                    }}
                    disabled={!isSlackConnected}
                    style={styles.checkboxInput}
                  />
                </label>
              </div>
            </div>

            {/* Card 3: In-App Notifications */}
            <div style={{ ...styles.channelCard, borderColor: inAppEnabled ? "#7C3AED" : "#E2E8F0" }}>
              <div>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.iconBox, backgroundColor: "#F5F3FF" }}>
                    <Bell size={22} color="#7C3AED" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 style={styles.cardTitle}>In-app notifications</h3>
                    <p style={styles.cardSubtitle}>View alerts directly in FlowPacks.</p>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.badgeRow}>
                    {inAppEnabled ? (
                      <span style={styles.inAppBadge}>
                        <span style={styles.inAppBadgeDot} />
                        Enabled
                      </span>
                    ) : (
                      <span
                        style={{
                          ...styles.inAppBadge,
                          backgroundColor: "#F3F4F6",
                          color: "#6B7280",
                        }}
                      >
                        <span
                          style={{
                            ...styles.inAppBadgeDot,
                            backgroundColor: "#9CA3AF",
                          }}
                        />
                        Disabled
                      </span>
                    )}
                  </div>
                  <p style={styles.inAppDesc}>
                    In-app notifications are available automatically. Use toggle below to enable or disable audit logs.
                  </p>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <label style={styles.toggleRow}>
                  <span style={styles.toggleLabel}>Enable in-app logs</span>
                  <input
                    type="checkbox"
                    checked={inAppEnabled}
                    onChange={(e) => setInAppEnabled(e.target.checked)}
                    style={styles.checkboxInput}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={styles.actionFooter}>
            <button
              type="button"
              onClick={onBack}
              style={styles.backButton}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <span>Saving & Initializing...</span>
              ) : (
                <>
                  <span>Save & Go to Library</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <SlackGuideModal
        isOpen={isSlackGuideOpen}
        onClose={() => setIsSlackGuideOpen(false)}
      />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1160px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    paddingBottom: "32px",
    boxSizing: "border-box",
  },
  header: {
    position: "relative",
    background: "linear-gradient(90deg, #5925D8 0%, #632DE0 55%, #5924CE 100%)",
    borderRadius: "14px",
    minHeight: "72px",
    padding: "16px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#FFFFFF",
    boxShadow: "0 8px 24px rgba(88, 36, 206, 0.22)",
    overflow: "hidden",
    marginBottom: "24px",
    boxSizing: "border-box",
  },
  bannerCurves: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  bannerSvg: {
    width: "100%",
    height: "100%",
  },
  brandGroup: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logoWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "-0.01em",
    color: "#FFFFFF",
  },
  tagline: {
    position: "relative",
    zIndex: 2,
  },
  stepIndicator: {
    fontSize: "13px",
    fontWeight: "600",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "6px 14px",
    borderRadius: "20px",
    letterSpacing: "0.02em",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: "36px",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
  },
  titleSection: {
    marginBottom: "28px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#111827",
    margin: "0 0 6px 0",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontSize: "14px",
    color: "#6B7280",
    margin: 0,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    color: "#991B1B",
    borderRadius: "8px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "24px",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  channelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "14px",
    border: "2px solid #E2E8F0",
    padding: "22px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    transition: "border-color 0.2s ease",
    minHeight: "290px",
    boxSizing: "border-box",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "16px",
    minHeight: "56px",
  },
  iconBox: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 3px 0",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#6B7280",
    margin: 0,
    lineHeight: 1.4,
  },
  cardBody: {
    marginBottom: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#374151",
  },
  textInput: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "13.5px",
    color: "#111827",
    boxSizing: "border-box",
    outline: "none",
  },
  helperText: {
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: 1.3,
    marginTop: "6px",
    display: "block",
  },
  badgeRow: {
    marginBottom: "12px",
  },
  connectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#ECFDF5",
    color: "#065F46",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
  },
  slackMetaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "14px",
    border: "1px solid #E5E7EB",
  },
  metaLabel: {
    color: "#6B7280",
    display: "block",
    fontSize: "11px",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: "2px",
  },
  metaValue: {
    color: "#1F2937",
    fontWeight: "600",
    fontSize: "13px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "block",
  },
  slackActionBtns: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  btnPrimary: {
    backgroundColor: "#5C28D8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  btnSecondary: {
    backgroundColor: "#FFFFFF",
    color: "#374151",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnDanger: {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: "6px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  inAppBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#F5F3FF",
    color: "#5B21B6",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "12px",
  },
  inAppBadgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#7C3AED",
  },
  inAppDesc: {
    fontSize: "13px",
    color: "#6B7280",
    lineHeight: 1.4,
    margin: 0,
  },
  cardFooter: {
    borderTop: "1px solid #F1F5F9",
    paddingTop: "14px",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    userSelect: "none",
  },
  toggleLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  checkboxInput: {
    width: "18px",
    height: "18px",
    accentColor: "#5C28D8",
    cursor: "pointer",
  },
  actionFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #E5E7EB",
    paddingTop: "24px",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    color: "#4B5563",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#5C28D8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
};
