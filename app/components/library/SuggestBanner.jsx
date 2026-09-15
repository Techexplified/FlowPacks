import React from "react";
import { libraryStyles } from "../../styles/library.styles";

export default function SuggestBanner({ onSuggestClick }) {
  return (
    <div style={libraryStyles.bottomBanner}>
      <div style={libraryStyles.bottomLeft}>
        <div style={libraryStyles.sparkleBox}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5C28D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <div>
          <h4 style={libraryStyles.bottomTitle}>Have an idea in mind?</h4>
          <p style={libraryStyles.bottomSubtitle}>Tell us what you want to automate and we&apos;ll help you set it up.</p>
        </div>
      </div>

      <button
        type="button"
        style={libraryStyles.suggestBtn}
        onClick={onSuggestClick}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </svg>
        <span>Suggest an automation</span>
      </button>
    </div>
  );
}
