import React from "react";
import { useFetcher } from "react-router";
import { settingsStyles } from "../../styles/settings.styles";

/**
 * Card 3: In-app notifications destination configuration with 1-click toggle.
 */
export default function InAppDestinationCard({ isEnabled = true }) {
  const fetcher = useFetcher();

  const isPending =
    fetcher.formData &&
    fetcher.formData.get("actionType") === "TOGGLE_CHANNEL" &&
    fetcher.formData.get("channel") === "IN_APP";

  const active = isPending
    ? fetcher.formData.get("isEnabled") === "true"
    : Boolean(isEnabled);

  const handleToggle = () => {
    const nextState = !active;
    fetcher.submit(
      {
        actionType: "TOGGLE_CHANNEL",
        channel: "IN_APP",
        isEnabled: String(nextState),
      },
      { method: "post" }
    );
  };

  return (
    <div style={settingsStyles.card}>
      <div>
        {/* Card Header */}
        <div style={settingsStyles.cardTop}>
          <div
            style={{
              ...settingsStyles.iconBox,
              backgroundColor: "#F3EEFF",
              color: "#5C28D8",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5C28D8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>

          <div style={settingsStyles.cardHeaderTexts}>
            <h3 style={settingsStyles.cardTitle}>In-app notifications</h3>
            <p style={settingsStyles.cardDesc}>
              View alerts directly in FlowPacks.
            </p>
            {active ? (
              <span style={settingsStyles.badgeEnabled}>● Enabled</span>
            ) : (
              <span style={settingsStyles.badgeDisabled}>○ Disabled</span>
            )}
          </div>
        </div>

        <p style={{ ...settingsStyles.helperText, fontSize: "12px", color: "#4B5563", margin: "10px 0" }}>
          In-app notifications are available automatically. Use the toggle below to enable or disable them.
        </p>
      </div>

      {/* 1-Click Toggle Switch */}
      <div style={settingsStyles.toggleRow}>
        <span style={settingsStyles.toggleLabel}>
          Enable in-app notifications
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={handleToggle}
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
    </div>
  );
}
