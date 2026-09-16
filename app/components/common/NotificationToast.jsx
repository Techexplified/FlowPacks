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

  const isFailed = log.status === "Failed";

  return (
    <div
      style={{
        ...toastStyles.popupWrapper,
        ...(isFailed ? { border: "1.5px solid #FECACA", boxShadow: "0 10px 25px -5px rgba(220, 38, 38, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" } : {}),
      }}
    >
      <div style={toastStyles.popupHeader}>
        <div style={toastStyles.popupBadge}>
          <span
            style={{
              ...toastStyles.pulseDot,
              backgroundColor: isFailed ? "#EF4444" : "#5C28D8",
              boxShadow: isFailed
                ? "0 0 0 2px rgba(239, 68, 68, 0.2)"
                : "0 0 0 2px rgba(92, 40, 216, 0.2)",
            }}
          />
          <span
            style={{
              ...toastStyles.popupBadgeText,
              color: isFailed ? "#DC2626" : "#5C28D8",
            }}
          >
            {isFailed ? "Automation Failed" : "FlowPacks Alert"}
          </span>
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
        <div
          style={{
            ...toastStyles.popupIconBox,
            backgroundColor: isFailed ? "#FEF2F2" : "#F3EEFF",
          }}
        >
          {isFailed ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
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
          )}
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
