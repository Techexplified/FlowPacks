import React, { useState } from "react";

export default function NotificationSetupStep({
  defaultEmail = "",
  initialSettings = {},
  shopName = "Your Store",
  onBack,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}) {
  const initialTypes = initialSettings?.enabledNotificationTypes || ["EMAIL", "SLACK", "IN_APP"];

  const [email, setEmail] = useState(initialSettings?.notificationEmail || defaultEmail || "");
  const [emailEnabled, setEmailEnabled] = useState(initialTypes.includes("EMAIL"));
  const [slackEnabled, setSlackEnabled] = useState(initialTypes.includes("SLACK"));
  const [inAppEnabled, setInAppEnabled] = useState(initialTypes.includes("IN_APP"));
  const [localError, setLocalError] = useState("");

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    const activeChannels = [];
    if (emailEnabled) activeChannels.push("EMAIL");
    if (slackEnabled) activeChannels.push("SLACK");
    if (inAppEnabled) activeChannels.push("IN_APP");

    if (activeChannels.length === 0) {
      setLocalError("At least one notification channel must remain active.");
      return;
    }

    if (emailEnabled && (!email.trim() || !email.includes("@"))) {
      setLocalError("Please enter a valid email address for Email alerts.");
      return;
    }

    onSubmit({
      notificationEmail: email.trim(),
      emailEnabled,
      slackEnabled,
      inAppEnabled,
      enabledNotificationTypes: activeChannels,
    });
  };

  const displayError = errorMessage || localError;

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div style={styles.brandGroup}>
          <div style={styles.logoWrapper}>
            <img src="/Flowpacks-logo.png" alt="FlowPacks" style={styles.logoImg} />
          </div>
          <span style={styles.brandTitle}>FlowPacks</span>
        </div>
        <div style={styles.stepIndicator}>Step 2 of 2: Notifications</div>
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
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconBox, backgroundColor: "#EEF2FF" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <h3 style={styles.cardTitle}>Email</h3>
                  <p style={styles.cardSubtitle}>Receive automation alerts via email.</p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="notification-email-input" style={styles.fieldLabel}>Notification email</label>
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

            {/* Card 2: Slack (UI Mockup) */}
            <div style={{ ...styles.channelCard, borderColor: slackEnabled ? "#10B981" : "#E2E8F0" }}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconBox, backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                  <img
                    src="/Slack_Symbol_0.svg"
                    alt="Slack"
                    style={{ width: "34px", height: "34px", objectFit: "contain" }}
                  />
                </div>
                <div>
                  <h3 style={styles.cardTitle}>Slack</h3>
                  <p style={styles.cardSubtitle}>Get alerts in your Slack workspace.</p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.badgeRow}>
                  <span style={styles.connectedBadge}>
                    <span style={styles.badgeDot} />
                    Connected
                  </span>
                </div>
                <div style={styles.slackMeta}>
                  <div>
                    <span style={styles.metaLabel}>Workspace</span>
                    <span style={styles.metaValue}>{shopName || "Store"} Team</span>
                  </div>
                  <div>
                    <span style={styles.metaLabel}>Default channel</span>
                    <span style={styles.metaValue}>#flowpacks-alerts</span>
                  </div>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <label style={styles.toggleRow}>
                  <span style={styles.toggleLabel}>Enable Slack alerts</span>
                  <input
                    type="checkbox"
                    checked={slackEnabled}
                    onChange={(e) => setSlackEnabled(e.target.checked)}
                    style={styles.checkboxInput}
                  />
                </label>
              </div>
            </div>

            {/* Card 3: In-App Notifications */}
            <div style={{ ...styles.channelCard, borderColor: inAppEnabled ? "#7C3AED" : "#E2E8F0" }}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconBox, backgroundColor: "#F5F3FF" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h3 style={styles.cardTitle}>In-app notifications</h3>
                  <p style={styles.cardSubtitle}>View alerts directly in FlowPacks.</p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.badgeRow}>
                  <span style={styles.inAppBadge}>
                    <span style={styles.inAppBadgeDot} />
                    Enabled
                  </span>
                </div>
                <p style={styles.inAppDesc}>
                  In-app notifications are available automatically. Use toggle below to enable or disable audit logs.
                </p>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.7 : 1,
              }}
              onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#4338CA")}
              onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = "#4F46E5")}
            >
              {isSubmitting ? (
                <span>Saving & Initializing...</span>
              ) : (
                <>
                  <span>Save & Go to Library</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1080px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    paddingBottom: "32px",
  },
  header: {
    background: "linear-gradient(90deg, #4338CA 0%, #6366F1 100%)",
    borderRadius: "16px 16px 0 0",
    padding: "16px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
  },
  brandGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoWrapper: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: {
    width: "28px",
    height: "28px",
    objectFit: "contain",
  },
  brandTitle: {
    fontSize: "22px",
    fontWeight: "700",
  },
  stepIndicator: {
    fontSize: "13px",
    fontWeight: "600",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "6px 12px",
    borderRadius: "20px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: "36px",
    borderRadius: "0 0 16px 16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
  },
  titleSection: {
    marginBottom: "28px",
  },
  heading: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#111827",
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontSize: "15px",
    color: "#4B5563",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  channelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "2px solid #E2E8F0",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    transition: "border-color 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "18px",
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
    margin: "0 0 4px 0",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#6B7280",
    margin: 0,
    lineHeight: 1.4,
  },
  cardBody: {
    flex: 1,
    marginBottom: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  textInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "14px",
    color: "#111827",
    boxSizing: "border-box",
    outline: "none",
  },
  helperText: {
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: 1.3,
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
  slackMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
  },
  metaLabel: {
    color: "#6B7280",
    display: "block",
    fontSize: "11px",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  metaValue: {
    color: "#1F2937",
    fontWeight: "600",
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
    cursor: "pointer",
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
    accentColor: "#4F46E5",
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
    backgroundColor: "#4F46E5",
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
