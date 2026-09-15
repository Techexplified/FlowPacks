import React from "react";
import { Link } from "react-router";
import { activityLogStyles } from "../../styles/activity-log.styles";

/**
 * Top FlowPacks purple gradient header banner for Activity Log.
 */
export default function ActivityLogHeaderBanner() {
  return (
    <div style={activityLogStyles.banner}>
      <div style={activityLogStyles.bannerCurves}>
        <svg
          style={activityLogStyles.bannerSvg}
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 500 100 C 540 80, 580 45, 620 15 C 640 3, 670 0, 700 0 L 1000 0 L 1000 100 Z"
            fill="rgba(42, 14, 98, 0.32)"
          />
          <path
            d="M 605 0 C 575 20, 555 45, 560 64 C 568 82, 630 96, 730 100 L 1000 100 L 1000 0 Z"
            fill="#331075"
            opacity="0.75"
          />
          <path
            d="M 730 100 C 810 95, 890 92, 950 95 C 980 97, 995 98, 1000 100 L 1000 100 Z"
            fill="rgba(25, 5, 65, 0.2)"
          />
        </svg>
      </div>

      <div style={activityLogStyles.brandGroup}>
        <div style={activityLogStyles.logoWrapper}>
          <img
            src="/Flowpacks-logo.png"
            alt="FlowPacks"
            style={activityLogStyles.logoImg}
          />
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Automation Library</span>
        </Link>
      </div>
    </div>
  );
}
