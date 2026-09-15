import React from "react";
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
  return (
    <div style={activityLogStyles.topHeaderRow}>
      <h1 style={activityLogStyles.pageTitle}>Activity log</h1>

      <div style={activityLogStyles.controlsGroup}>
        <button
          type="button"
          style={activityLogStyles.testRunBtn}
          onClick={onOpenTestRun}
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

        <button
          type="button"
          style={activityLogStyles.markAllReadBtn}
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          <span>Mark all as read</span>
        </button>

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
