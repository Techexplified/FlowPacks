import React from "react";
import { useFetcher } from "react-router";
import { settingsStyles } from "../../styles/settings.styles";

/**
 * Section 2: Notification Alerts preferences (3 checkboxes).
 */
export default function AlertPreferencesList({
  alertOnTriggered = true,
  alertOnFailed = true,
  alertWeeklyDigest = true,
}) {
  const fetcher = useFetcher();

  const handleTogglePreference = (key, currentVal) => {
    const nextVal = !currentVal;
    fetcher.submit(
      {
        actionType: "UPDATE_ALERT_PREFERENCES",
        key,
        value: String(nextVal),
      },
      { method: "post" }
    );
  };

  const preferences = [
    {
      key: "alertOnTriggered",
      title: "Automation triggered",
      description: "When an automation runs and meets the conditions.",
      checked: Boolean(alertOnTriggered),
    },
    {
      key: "alertOnFailed",
      title: "Automation failed",
      description: "When an automation encounters an error.",
      checked: Boolean(alertOnFailed),
    },
    {
      key: "alertWeeklyDigest",
      title: "Weekly performance reports",
      description: "A weekly summary of key insights and activity.",
      checked: Boolean(alertWeeklyDigest),
    },
  ];

  return (
    <div style={settingsStyles.alertPreferencesCard}>
      {preferences.map((pref, index) => {
        const isLast = index === preferences.length - 1;
        return (
          <div
            key={pref.key}
            style={{
              ...settingsStyles.prefRow,
              ...(isLast ? settingsStyles.prefRowLast : {}),
            }}
            onClick={() => handleTogglePreference(pref.key, pref.checked)}
          >
            {/* Custom Checkbox */}
            <div
              style={{
                ...settingsStyles.customCheckbox,
                backgroundColor: pref.checked ? "#5C28D8" : "#FFFFFF",
                border: pref.checked
                  ? "1.5px solid #5C28D8"
                  : "1.5px solid #D1D5DB",
              }}
            >
              {pref.checked && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            {/* Labels */}
            <div>
              <h4 style={settingsStyles.prefTitle}>{pref.title}</h4>
              <p style={settingsStyles.prefDesc}>{pref.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
