import React from "react";
import { Link } from "react-router";
import { libraryStyles } from "../../styles/library.styles";

export default function LibraryHeaderBanner() {
  return (
    <div style={libraryStyles.banner}>
      <div style={libraryStyles.bannerCurves}>
        <svg style={libraryStyles.bannerSvg} viewBox="0 0 1000 100" preserveAspectRatio="none">
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

      <div style={libraryStyles.brandGroup}>
        <div style={libraryStyles.logoWrapper}>
          <img src="/Flowpacks-logo.png" alt="FlowPacks" style={libraryStyles.logoImg} />
        </div>
        <div>
          <h1 style={libraryStyles.brandTitle}>Automation Library</h1>
          <p style={libraryStyles.brandSubtitle}>Ready-to-run automations for your store.</p>
        </div>
      </div>

      <div style={libraryStyles.bannerRightGroup}>
        <div style={libraryStyles.tagline}>
          <span>Automate</span>
          <span style={libraryStyles.taglinePlus}>+</span>
          <span>Grow</span>
          <span style={libraryStyles.taglinePlus}>+</span>
          <span>Stay in control</span>
        </div>

        <Link to="/app/activity-log" style={libraryStyles.activityLogBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Activity log</span>
        </Link>
      </div>
    </div>
  );
}
