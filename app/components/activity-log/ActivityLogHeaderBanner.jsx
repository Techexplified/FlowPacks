import { Link } from "react-router";
import { Activity, Boxes } from "lucide-react";
import { activityLogStyles } from "../../styles/activity-log.styles";

/**
 * Top FlowPacks purple gradient header banner for Activity Log matching Settings.
 */
export default function ActivityLogHeaderBanner() {
  return (
    <div style={activityLogStyles.banner}>
      {/* Background ambient svg curves matching Settings */}
      <div style={activityLogStyles.bannerCurves}>
        <svg
          style={activityLogStyles.bannerSvg}
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

      <div style={activityLogStyles.brandGroup}>
        <div style={activityLogStyles.logoWrapper}>
          <Activity size={22} color="#5C28D8" strokeWidth={2.2} />
        </div>
        <div>
          <h1 style={activityLogStyles.brandTitle}>Activity Log</h1>
          <p style={activityLogStyles.brandSubtitle}>
            Live audit trail of triggered alerts and store actions.
          </p>
        </div>
      </div>

      <div style={activityLogStyles.bannerRightGroup}>
        <div style={activityLogStyles.tagline}>
          <span>Automate</span>
          <span style={activityLogStyles.taglinePlus}>+</span>
          <span>Grow</span>
          <span style={activityLogStyles.taglinePlus}>+</span>
          <span>Stay in control</span>
        </div>

        <Link
          to="/app/automation-library"
          style={activityLogStyles.backLibraryBtn}
        >
          <Boxes size={14} color="#FFFFFF" strokeWidth={2.2} />
          <span>Automation Library</span>
        </Link>
      </div>
    </div>
  );
}
