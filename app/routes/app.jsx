import { useState } from "react";
import {
  Outlet,
  useLoaderData,
  useRouteError,
  useFetcher,
  useLocation,
  useNavigate,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import {
  getUnreadLogsCount,
  getLatestUnreadLogs,
  markAsRead,
} from "../services/activity.server";
import NotificationToast from "../components/common/NotificationToast";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  let unreadCount = 0;
  let latestUnreadLogs = [];

  try {
    unreadCount = await getUnreadLogsCount(session.shop);
    latestUnreadLogs = await getLatestUnreadLogs(session.shop, 1);
  } catch (err) {
    console.error("Error loading activity log unread data:", err);
  }

  return {
    // eslint-disable-next-line no-undef
    apiKey: process.env.SHOPIFY_API_KEY || "",
    unreadCount,
    latestUnreadLog: latestUnreadLogs[0] || null,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
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
    return { success: false };
  } catch (err) {
    console.error("Error in app action:", err);
    return { success: false, error: err.message };
  }
};

export default function App() {
  const { apiKey, unreadCount = 0, latestUnreadLog = null } = useLoaderData();
  const fetcher = useFetcher();
  const location = useLocation();
  const navigate = useNavigate();

  const [dismissedId, setDismissedId] = useState(null);

  const isActivityLogPage = location.pathname.includes("/activity-log");
  const showPopup =
    !isActivityLogPage &&
    latestUnreadLog &&
    latestUnreadLog.id !== dismissedId &&
    unreadCount > 0;

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (latestUnreadLog) {
      setDismissedId(latestUnreadLog.id);
    }
  };

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    if (latestUnreadLog) {
      setDismissedId(latestUnreadLog.id);
      fetcher.submit(
        { actionType: "MARK_READ", logId: latestUnreadLog.id },
        { method: "post" }
      );
    }
  };

  const handleOpenActivityLog = () => {
    if (latestUnreadLog) {
      handleMarkAsRead({ stopPropagation: () => {} });
    }
    navigate("/app/activity-log");
  };

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/automation-library">Automation Library</s-link>
        <s-link href="/app/activity-log">
          {unreadCount > 0 ? `Activity Log (${unreadCount})` : "Activity Log"}
        </s-link>
      </s-app-nav>

      <Outlet />

      {/* Floating In-App Notification Toast */}
      {showPopup && (
        <NotificationToast
          log={latestUnreadLog}
          onDismiss={handleDismiss}
          onMarkAsRead={handleMarkAsRead}
          onViewLog={handleOpenActivityLog}
        />
      )}
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

