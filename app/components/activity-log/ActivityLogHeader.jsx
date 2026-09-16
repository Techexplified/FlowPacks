import { useState } from "react";
import { activityLogStyles } from "../../styles/activity-log.styles";

/**
 * Top header row with "Activity log" title, Test Run button, Mark All as Read button, and Time Filter dropdown.
 */
export default function ActivityLogHeader({
  unreadCount = 0,
  timeFilter = "7d",
  onTimeFilterChange,
  onMarkAllRead,
  onOpenTestRun,
}) {
  const [isMarkReadHovered, setIsMarkReadHovered] = useState(false);
  const [isMarkReadActive, setIsMarkReadActive] = useState(false);
  const [isTestRunHovered, setIsTestRunHovered] = useState(false);

  const isMarkAllEnabled = unreadCount > 0;

  const getMarkAllBtnStyle = () => {
    if (!isMarkAllEnabled) {
      return {
        ...activityLogStyles.markAllReadBtn,
        ...activityLogStyles.markAllReadBtnDisabled,
      };
    }
    if (isMarkReadActive) {
      return {
        ...activityLogStyles.markAllReadBtn,
        ...activityLogStyles.markAllReadBtnActive,
      };
    }
    if (isMarkReadHovered) {
      return {
        ...activityLogStyles.markAllReadBtn,
        ...activityLogStyles.markAllReadBtnHover,
      };
    }
    return activityLogStyles.markAllReadBtn;
  };

  const getTestRunBtnStyle = () => {
    if (isTestRunHovered) {
      return {
        ...activityLogStyles.testRunBtn,
        ...activityLogStyles.testRunBtnHover,
      };
    }
    return activityLogStyles.testRunBtn;
  };

  return (
    <div style={activityLogStyles.topHeaderRow}>
      <h1 style={activityLogStyles.pageTitle}>Activity log</h1>

      <div style={activityLogStyles.controlsGroup}>
        {/* Test Run Button */}
        <button
          type="button"
          style={getTestRunBtnStyle()}
          onClick={onOpenTestRun}
          onMouseEnter={() => setIsTestRunHovered(true)}
          onMouseLeave={() => setIsTestRunHovered(false)}
          title="Trigger a test run for any recipe"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5C28D8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Test Run</span>
        </button>

        {/* Enhanced Mark All as Read Button */}
        <button
          type="button"
          style={getMarkAllBtnStyle()}
          onClick={onMarkAllRead}
          onMouseEnter={() => setIsMarkReadHovered(true)}
          onMouseLeave={() => {
            setIsMarkReadHovered(false);
            setIsMarkReadActive(false);
          }}
          onMouseDown={() => isMarkAllEnabled && setIsMarkReadActive(true)}
          onMouseUp={() => setIsMarkReadActive(false)}
          disabled={!isMarkAllEnabled}
          title={
            isMarkAllEnabled
              ? `Mark ${unreadCount} notification${unreadCount > 1 ? "s" : ""} as read`
              : "All notifications are already read"
          }
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={
              !isMarkAllEnabled
                ? "#9CA3AF"
                : isMarkReadHovered
                  ? "#059669"
                  : "#4B5563"
            }
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: "stroke 0.18s ease" }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Mark all as read</span>
        </button>

        {/* Time Filter Select */}
        <div style={activityLogStyles.selectWrapper}>
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
            style={activityLogStyles.selectInput}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <div style={activityLogStyles.selectArrow}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
