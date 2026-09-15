import React from "react";
import { toastStyles } from "../../styles/toast.styles";

/**
 * Floating bottom-right in-app notification card for active alerts.
 */
export default function NotificationToast({
  log,
  onDismiss,
  onMarkAsRead,
  onViewLog,
}) {
  if (!log) return null;

  return (
    <div style={toastStyles.popupWrapper}>
      <div style={toastStyles.popupHeader}>
        <div style={toastStyles.popupBadge}>
          <span style={toastStyles.pulseDot} />
          <span style={toastStyles.popupBadgeText}>FlowPacks Alert</span>
        </div>
        <button
          type="button"
          style={toastStyles.closeBtn}
          onClick={onDismiss}
          title="Dismiss for now"
        >
          ✕
        </button>
      </div>

      <div style={toastStyles.popupBody}>
        <div style={toastStyles.popupIconBox}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5C28D8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div style={toastStyles.popupTextGroup}>
          <h4 style={toastStyles.popupTitle}>{log.recipeName}</h4>
          <p style={toastStyles.popupDesc}>{log.summaryText}</p>
        </div>
      </div>

      <div style={toastStyles.popupFooter}>
        <button
          type="button"
          style={toastStyles.markReadBtn}
          onClick={onMarkAsRead}
        >
          Mark as read
        </button>
        <button
          type="button"
          style={toastStyles.viewLogBtn}
          onClick={onViewLog}
        >
          <span>View Log</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
