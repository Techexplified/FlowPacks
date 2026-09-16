import React from "react";
import { settingsStyles } from "../../styles/settings.styles";

/**
 * Top purple gradient header banner for Settings page.
 */
export default function SettingsHeaderBanner() {
  return (
    <div style={settingsStyles.banner}>
      {/* Background ambient svg curves */}
      <div style={settingsStyles.bannerCurves}>
        <svg
          style={settingsStyles.bannerSvg}
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

      {/* Brand title and subtitle */}
      <div style={settingsStyles.brandGroup}>
        <div style={settingsStyles.logoWrapper}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5C28D8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <div>
          <h1 style={settingsStyles.brandTitle}>Settings</h1>
          <p style={settingsStyles.brandSubtitle}>
            Configure your notifications and preferences.
          </p>
        </div>
      </div>

      {/* Tagline */}
      <div style={settingsStyles.tagline}>
        Automate &nbsp;+&nbsp; Grow &nbsp;+&nbsp; Stay in control
      </div>
    </div>
  );
}
