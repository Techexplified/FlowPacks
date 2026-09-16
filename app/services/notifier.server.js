import { createActivityLog } from "./activity.server";

/**
 * Core notification dispatcher.
 * Handles in-app audit logging for triggered automations.
 */
export async function dispatchNotification(shopDomain, evaluationResult, status = "Completed") {
    if (!evaluationResult || evaluationResult.shouldAlert === false) {
        return {
            delivered: false,
            reason: "No alert triggered",
        };
    }

    const channel = evaluationResult.deliveryChannel || "IN_APP";

    const logRecord = {
        recipeSlug: evaluationResult.recipeSlug,
        recipeName: evaluationResult.recipeName,
        summaryText: evaluationResult.summary,
        channel: channel,
        status: status,
        isRead: false,
        details: evaluationResult.flaggedItems,
    };

    const record = await createActivityLog(shopDomain, logRecord);

    return {
        delivered: true,
        channel: channel,
        logRecord: record,
    };
}

// Alias for backwards compatibility
export const dispatchNotfication = dispatchNotification;

// Handles slack notifcation and then calls dispatchNotification to log activity
export async function sendSlackNotification(webhookUrl, evaluationResult, shopDomain) {
  if (!webhookUrl) {
    return {
      delivered: false,
      reason: "No Slack webhook URL configured",
    };
  }

  if (!evaluationResult || evaluationResult.shouldAlert === false) {
    return {
      delivered: false,
      reason: "No alert triggered",
    };
  }

  try {
    // Format flagged items cleanly as bullet points
    const itemsList = Array.isArray(evaluationResult.flaggedItems) && evaluationResult.flaggedItems.length > 0
      ? evaluationResult.flaggedItems
          .slice(0, 5)
          .map((item) => {
            const desc = item.message || item.detail || item.reason || (item.totalSales !== undefined ? `$${Number(item.totalSales).toFixed(2)} sales across ${item.totalOrders} orders` : "");
            return `• *${item.title || item.name || item.productId || "Metric"}*: ${desc}`;
          })
          .join("\n")
      : null;

    // Standard Slack Block Kit payload
    const payload = {
      text: `⚠️ FlowPacks Alert: ${evaluationResult.recipeName || "Automation Triggered"}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `⚡ FlowPacks Alert: ${evaluationResult.recipeName || "Automation Triggered"}`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Store:* \`${shopDomain}\`\n*Summary:* ${evaluationResult.summary || "Conditions met."}`,
          },
        },
        ...(itemsList
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Flagged Items:*\n${itemsList}`,
                },
              },
            ]
          : []),
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const statusmsg = response.ok ? "Completed" : "Failed";
    const notificationResult = await dispatchNotification(shopDomain, evaluationResult, statusmsg);
    return notificationResult;
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    await dispatchNotification(shopDomain, evaluationResult, "Failed");
    return {
      delivered: false,
      error: error.message || "Network error sending Slack notification",
    };
  }
}