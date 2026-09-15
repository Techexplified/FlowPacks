import { useState } from "react";
import { useLoaderData, useFetcher, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getActivityLogs,
  getUnreadLogsCount,
  markAsRead,
  markAllAsRead,
} from "../services/activity.server";
import { runWorkflow } from "../services/orchestrator.server";
import { getMerchantWorkflows } from "../services/merchant.server";
import ActivityLogHeaderBanner from "../components/activity-log/ActivityLogHeaderBanner";
import ActivityLogHeader from "../components/activity-log/ActivityLogHeader";
import ActivityLogCard from "../components/activity-log/ActivityLogCard";
import ActivityLogPagination from "../components/activity-log/ActivityLogPagination";
import TestRunModal from "../components/activity-log/TestRunModal";
import { activityLogStyles } from "../styles/activity-log.styles";

/**
 * Server Loader: Fetches paginated activity logs filtered by time window and unread count.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const timeFilter = url.searchParams.get("timeFilter") || "7d";
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const { activities, totalCount, totalPages, page: currentPage, pageSize } =
    await getActivityLogs(session.shop, timeFilter, page, 10);
  const unreadCount = await getUnreadLogsCount(session.shop);
  const { recipes = [] } = await getMerchantWorkflows(session.shop);

  return {
    shop: session.shop,
    activities,
    totalCount,
    totalPages,
    page: currentPage,
    pageSize,
    unreadCount,
    timeFilter,
    catalog: recipes,
  };
};

/**
 * Server Action: Handles marking individual logs, marking all as read, and manual test runs.
 */
export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  try {
    if (actionType === "MARK_READ") {
      const logId = formData.get("logId");
      if (logId) {
        await markAsRead(session.shop, logId);
      }
      return { success: true };
    }

    if (actionType === "MARK_ALL_READ") {
      await markAllAsRead(session.shop);
      return { success: true, message: "All logs marked as read" };
    }

    if (actionType === "TEST_RUN") {
      const recipeSlug = formData.get("recipeSlug");
      const result = await runWorkflow(admin, session.shop, recipeSlug, {
        force: false,
      });
      if (result.skipped) {
        return { success: false, skipped: true, recipeSlug, reason: result.reason };
      }
      return {
        success: true,
        result: { ...result, recipeSlug },
        message: "Test automation completed!",
      };
    }

    return { success: false, error: "Unknown action" };
  } catch (err) {
    console.error("Activity Log Action Error:", err);
    return { success: false, error: err.message };
  }
};

export default function ActivityLogPage() {
  const {
    activities = [],
    totalCount = 0,
    totalPages = 1,
    page = 1,
    pageSize = 10,
    unreadCount = 0,
    timeFilter = "7d",
    catalog = [],
  } = useLoaderData();

  const fetcher = useFetcher();
  const [, setSearchParams] = useSearchParams();

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleTimeFilterChange = (newFilter) => {
    setSearchParams({ timeFilter: newFilter, page: "1" });
  };

  const handleMarkRead = (logId) => {
    fetcher.submit({ actionType: "MARK_READ", logId }, { method: "post" });
  };

  const handleMarkAllRead = () => {
    fetcher.submit({ actionType: "MARK_ALL_READ" }, { method: "post" });
    setToastMessage("All activity logs marked as read");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleExecuteTestRun = (recipeSlug) => {
    fetcher.submit({ actionType: "TEST_RUN", recipeSlug }, { method: "post" });
  };

  const isTestRunning =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("actionType") === "TEST_RUN";

  const lastTestResult = fetcher.data?.result || null;

  return (
    <div style={activityLogStyles.pageWrapper}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={activityLogStyles.toast}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FlowPacks Purple Top Header Banner */}
      <ActivityLogHeaderBanner />

      {/* Main Container Card matching screenshot */}
      <div style={activityLogStyles.mainCard}>
        {/* Top Header Row with Title and Controls */}
        <ActivityLogHeader
          unreadCount={unreadCount}
          timeFilter={timeFilter}
          onTimeFilterChange={handleTimeFilterChange}
          onMarkAllRead={handleMarkAllRead}
          onOpenTestRun={() => setIsTestModalOpen(true)}
        />

        {/* Activity Logs Card Feed */}
        <div style={activityLogStyles.cardsList}>
          {activities.length === 0 ? (
            <div style={activityLogStyles.emptyState}>
              <div style={activityLogStyles.emptyIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5C28D8"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 4px 0",
                  fontSize: "15px",
                }}
              >
                No activity logs recorded yet
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                When automations trigger or actions are performed, they will appear here.
              </p>
            </div>
          ) : (
            activities.map((log) => (
              <ActivityLogCard
                key={log.id}
                log={log}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>

        {/* Pagination Controls */}
        <ActivityLogPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          timeFilter={timeFilter}
        />
      </div>

      {/* Manual Test Run Modal */}
      <TestRunModal
        isOpen={isTestModalOpen}
        catalog={catalog}
        onClose={() => setIsTestModalOpen(false)}
        onSubmitRun={handleExecuteTestRun}
        isRunning={isTestRunning}
        lastResult={lastTestResult}
      />
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
