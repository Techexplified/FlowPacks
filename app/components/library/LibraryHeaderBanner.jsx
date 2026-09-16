import { Link } from "react-router";
import { Boxes, Activity } from "lucide-react";
import { libraryStyles } from "../../styles/library.styles";

export default function LibraryHeaderBanner() {
  return (
    <div style={libraryStyles.banner}>
      {/* Background ambient svg curves matching Settings */}
      <div style={libraryStyles.bannerCurves}>
        <svg
          style={libraryStyles.bannerSvg}
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

      <div style={libraryStyles.brandGroup}>
        <div style={libraryStyles.logoWrapper}>
          <Boxes size={22} color="#5C28D8" strokeWidth={2.2} />
        </div>
        <div>
          <h1 style={libraryStyles.brandTitle}>Automation Library</h1>
          <p style={libraryStyles.brandSubtitle}>
            Ready-to-run automations for your store.
          </p>
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
          <Activity size={14} color="#FFFFFF" strokeWidth={2.2} />
          <span>Activity log</span>
        </Link>
      </div>
    </div>
  );
}
