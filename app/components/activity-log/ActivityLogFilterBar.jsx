import React from "react";
import { activityLogStyles } from "../../styles/activity-log.styles";

export default function ActivityLogFilterBar({
  timeFilter = "7d",
  onTimeFilterChange,
  unreadCount = 0,
  onMarkAllRead,
  onOpenTestRun,
}) {
  return (
    <div style={activityLogStyles.filterBar}>
      <div style={activityLogStyles.filterGroupLeft}>
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
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            style={activityLogStyles.markAllReadBtn}
            onClick={onMarkAllRead}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4B5563"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Mark all as read ({unreadCount})</span>
          </button>
        )}
      </div>

      <button
        type="button"
        style={activityLogStyles.testRunBtn}
        onClick={onOpenTestRun}
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
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>Test Run Automation</span>
      </button>
    </div>
  );
}
