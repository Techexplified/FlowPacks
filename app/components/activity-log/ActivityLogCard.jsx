import { useState } from "react";
import RecipeIcon from "../common/RecipeIcon";
import { formatActivityDate } from "../../libs/date.utils";
import { activityLogStyles } from "../../styles/activity-log.styles";

/**
 * Individual item breakdown row inside the accordion.
 */
function ActivityLogItemRow({ item }) {
  if (!item || typeof item !== "object") return null;

  return (
    <div style={activityLogStyles.detailItem}>
      <div style={activityLogStyles.detailItemLeft}>
        {item.productImageUrl ? (
          <img
            src={item.productImageUrl}
            alt={item.title || "Product"}
            style={activityLogStyles.itemImg}
          />
        ) : (
          <div
            style={{
              ...activityLogStyles.itemImg,
              backgroundColor: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <div>
          <div style={activityLogStyles.itemTitle}>
            {item.title || item.productId || "Store Metric"}
          </div>
          <div style={activityLogStyles.itemMsg}>
            {item.message ||
              (item.totalSales !== undefined
                ? `$${Number(item.totalSales).toFixed(2)} sales across ${item.totalOrders} orders`
                : JSON.stringify(item))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Clean Activity Log Card matching the screenshot design.
 */
export default function ActivityLogCard({ log, onMarkRead }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let detailsArray = [];
  if (Array.isArray(log.details)) {
    detailsArray = log.details;
  } else if (log.details && typeof log.details === "object") {
    detailsArray = [log.details];
  }

  const formatChannel = (channel) => {
    switch (channel) {
      case "EMAIL":
        return "Sent via Email";
      case "SLACK":
        return "Sent via Slack";
      case "IN_APP":
      default:
        return "In-App Audit Log";
    }
  };

  const isRead = Boolean(log.isRead);

  return (
    <div
      style={{
        ...activityLogStyles.card,
        border: isRead ? "1px solid #F3F4F6" : "1px solid #DDD6FE",
        backgroundColor: isRead ? "#FFFFFF" : "#FAF8FF",
        boxShadow: isRead
          ? "0 1px 2px rgba(0, 0, 0, 0.02)"
          : "0 2px 6px rgba(92, 40, 216, 0.06)",
        outline: "none",
      }}
    >
      <div style={activityLogStyles.cardHeader}>
        <div style={activityLogStyles.cardLeft}>
          <div style={activityLogStyles.iconBox}>
            <RecipeIcon slug={log.recipeSlug} size={20} color="#5C28D8" />
          </div>

          <div style={activityLogStyles.textGroup}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h3 style={activityLogStyles.recipeTitle}>{log.recipeName}</h3>
              {!log.isRead && (
                <span
                  style={activityLogStyles.unreadDot}
                  title="Unread notification"
                />
              )}
            </div>
            <p style={activityLogStyles.summaryText}>{log.summaryText}</p>
            <p style={activityLogStyles.channelText}>
              {formatChannel(log.channel)}
            </p>
          </div>
        </div>

        <div style={activityLogStyles.cardRight}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={activityLogStyles.timeText}>
              {formatActivityDate(log.createdAt)}
            </span>
            {detailsArray.length > 0 && (
              <button
                type="button"
                style={activityLogStyles.accordionToggleBtn}
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse details" : "Expand details"}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2.5"
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={
                log.status === "Completed"
                  ? activityLogStyles.statusCompleted
                  : activityLogStyles.statusFailed
              }
            >
              ● {log.status}
            </span>

            {!log.isRead && onMarkRead && (
              <button
                type="button"
                style={activityLogStyles.markReadBtn}
                onClick={() => onMarkRead(log.id)}
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && detailsArray.length > 0 && (
        <div style={activityLogStyles.accordionBody}>
          <h4 style={activityLogStyles.accordionTitle}>
            Breakdown ({detailsArray.length} items)
          </h4>
          <div style={activityLogStyles.detailsList}>
            {detailsArray.map((item, idx) => (
              <ActivityLogItemRow key={item.productId || idx} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
