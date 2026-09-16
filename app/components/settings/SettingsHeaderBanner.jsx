import { Settings } from "lucide-react";
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
          <Settings size={22} color="#5C28D8" strokeWidth={2.2} />
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
        <span>Automate</span>
        <span style={{ color: "rgba(255, 255, 255, 0.55)", fontWeight: "400", margin: "0 4px" }}>+</span>
        <span>Grow</span>
        <span style={{ color: "rgba(255, 255, 255, 0.55)", fontWeight: "400", margin: "0 4px" }}>+</span>
        <span>Stay in control</span>
      </div>
    </div>
  );
}
