import React from "react";
import { Link } from "react-router";
import { activityLogStyles } from "../../styles/activity-log.styles";

export default function ActivityLogPagination({
  page = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  timeFilter = "7d",
}) {
  if (totalPages <= 1) return null;

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  return (
    <div style={activityLogStyles.paginationBar}>
      <div style={activityLogStyles.paginationInfo}>
        Showing {startIdx}–{endIdx} of {totalCount} logs
      </div>
      <div style={activityLogStyles.paginationBtns}>
        <Link
          to={`/app/activity-log?timeFilter=${timeFilter}&page=${page - 1}`}
          style={{
            ...activityLogStyles.pageBtn,
            ...(page <= 1 ? activityLogStyles.pageBtnDisabled : {}),
          }}
          tabIndex={page <= 1 ? -1 : undefined}
        >
          Previous
        </Link>
        <span style={{ fontSize: "12px", color: "#6B7280", margin: "0 6px" }}>
          Page {page} of {totalPages}
        </span>
        <Link
          to={`/app/activity-log?timeFilter=${timeFilter}&page=${page + 1}`}
          style={{
            ...activityLogStyles.pageBtn,
            ...(page >= totalPages ? activityLogStyles.pageBtnDisabled : {}),
          }}
          tabIndex={page >= totalPages ? -1 : undefined}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
