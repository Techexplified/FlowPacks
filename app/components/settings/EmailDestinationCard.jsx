import React, { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { settingsStyles } from "../../styles/settings.styles";

/**
 * Card 1: Email destination configuration with independent activation toggle.
 */
export default function EmailDestinationCard({
  initialEmail = "",
  isEnabled = false,
}) {
  const fetcher = useFetcher();
  const [email, setEmail] = useState(initialEmail || "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEmail(initialEmail || "");
  }, [initialEmail]);

  const isSaving =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("actionType") === "UPDATE_EMAIL";

  const isTogglePending =
    fetcher.formData &&
    fetcher.formData.get("actionType") === "TOGGLE_CHANNEL" &&
    fetcher.formData.get("channel") === "EMAIL";

  const hasEmail = Boolean(initialEmail && initialEmail.includes("@"));
  const active = isTogglePending
    ? fetcher.formData.get("isEnabled") === "true"
    : Boolean(isEnabled && hasEmail);

  const handleSave = (e) => {
    e.preventDefault();
    fetcher.submit(
      {
        actionType: "UPDATE_EMAIL",
        email: email.trim(),
      },
      { method: "post" }
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEmail(initialEmail || "");
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    if (!hasEmail) return;
    const nextState = !active;
    fetcher.submit(
      {
        actionType: "TOGGLE_CHANNEL",
        channel: "EMAIL",
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
              backgroundColor: "#EEF2FF",
              color: "#4F46E5",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div style={settingsStyles.cardHeaderTexts}>
            <h3 style={settingsStyles.cardTitle}>Email</h3>
            <p style={settingsStyles.cardDesc}>
              Receive automation alerts via email.
            </p>
            {hasEmail && !isEditing ? (
              active ? (
                <span style={settingsStyles.badgeEnabled}>● Enabled</span>
              ) : (
                <span style={settingsStyles.badgeDisabled}>○ Disabled</span>
              )
            ) : null}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave}>
          <div style={settingsStyles.formGroup}>
            <label style={settingsStyles.formLabel}>Notification email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@store.com"
              disabled={!isEditing || isSaving}
              style={{
                ...settingsStyles.input,
                ...(!isEditing ? settingsStyles.inputDisabled : {}),
              }}
              required={isEditing}
            />
            <p style={settingsStyles.helperText}>
              This will be used as the default email for all automation alerts.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={settingsStyles.cardActions}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  style={settingsStyles.btnSecondary}
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={settingsStyles.btnPrimary}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save email"}
                </button>
              </>
            ) : (
              <button
                type="button"
                style={settingsStyles.btnSecondary}
                onClick={() => setIsEditing(true)}
              >
                Change email
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 1-Click Toggle Switch for Enabling/Disabling Email Alerts */}
      {hasEmail && !isEditing && (
        <div style={settingsStyles.toggleRow}>
          <span style={settingsStyles.toggleLabel}>
            Enable email alerts
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
