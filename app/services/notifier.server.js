import { createActivityLog } from "./activity.server";
import { Resend } from "resend";
import { generateAlertEmailHtml } from "./email-template.server";


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

function getRecipeEmoji(slug) {
  switch (slug) {
    case "rising-demand-falling-stock":
      return "📦";
    case "high-traffic-low-conversion":
      return "📉";
    case "weekly-performance-digest":
      return "📊";
    case "slowing-down-bestseller":
      return "⚠️";
    case "abandoned-momentum":
      return "⚡";
    case "new-product-underperforming":
      return "🚀";
    default:
      return "⚡";
  }
}

// Handles slack notification and then calls dispatchNotification to log activity
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
    const totalFlagged = Array.isArray(evaluationResult.flaggedItems)
      ? evaluationResult.flaggedItems.length
      : 0;
    const displayItems = Array.isArray(evaluationResult.flaggedItems)
      ? evaluationResult.flaggedItems.slice(0, 5)
      : [];

    let itemsList = null;
    if (displayItems.length > 0) {
      const rows = displayItems.map((item) => {
        const rawTitle = item.title || item.name || item.productId || "Store Metric";
        const title = rawTitle
          .replace(/[\r\n]+/g, " ")
          .replace(/\*/g, "") // avoid raw asterisks breaking Slack mrkdwn
          .trim();
        const desc =
          item.message ||
          item.detail ||
          item.reason ||
          (item.totalSales !== undefined
            ? `$${Number(item.totalSales).toFixed(2)} sales across ${item.totalOrders} orders`
            : "");
        return `• *${title}*: ${desc}`;
      });

      if (totalFlagged > 5) {
        rows.push(`_...and ${totalFlagged - 5} more items in FlowPacks._`);
      }
      itemsList = rows.join("\n");
    }

    const emoji = getRecipeEmoji(evaluationResult.recipeSlug);
    const recipeName = evaluationResult.recipeName || "Automation Alert";
    const activityLogUrl = `https://${shopDomain}/admin/apps/flowpacks/app/activity-log`;

    // Standard Slack Block Kit payload
    const payload = {
      text: `${emoji} FlowPacks Alert: ${recipeName} (${shopDomain})`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${emoji} FlowPacks Alert: ${recipeName}`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Store:*\n\`${shopDomain}\``,
            },
            {
              type: "mrkdwn",
              text: `*Status:*\n⚡ Attention Needed`,
            },
          ],
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Summary:*\n${evaluationResult.summary || "Automation conditions met."}`,
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
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `FlowPacks Automation Monitor • <${activityLogUrl}|Open Activity Log →>`,
            },
          ],
        },
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

// Email Notifications
export async function sendEmailNotification(toEmail, evaluationResult, shopDomain) {
  if (!toEmail) {
    console.warn("[Resend] No destination email configured for shop:", shopDomain);
    await dispatchNotification(shopDomain, evaluationResult, "Failed");
    return {
      delivered: false,
      reason: "No destination Email configured",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY missing in environment variables. Skipping Email Notification.");
    await dispatchNotification(shopDomain, evaluationResult, "Failed");
    return {
      delivered: false,
      reason: "RESEND_API_KEY missing in environment variables",
    };
  }

  if (!evaluationResult || evaluationResult.shouldAlert === false) {
    return {
      delivered: false,
      reason: "No alert triggered",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "FlowPacks <onboarding@resend.dev>";
    const recipeName = evaluationResult.recipeName || "Automation Alert";
    const subject = `[FlowPacks] Alert: ${recipeName} (${shopDomain})`;
    const html = generateAlertEmailHtml({ evaluationResult, shopDomain });

    console.log(`[Resend] Sending alert email to ${toEmail} from ${fromEmail}...`);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject,
      html,
    });

    if (error) {
      console.error("[Resend] API error response:", error);
      await dispatchNotification(shopDomain, evaluationResult, "Failed");
      return { delivered: false, error: error.message };
    }

    console.log(`[Resend] Email sent successfully! Message ID: ${data?.id}`);
    const notificationResult = await dispatchNotification(shopDomain, evaluationResult, "Completed");
    return {
      ...notificationResult,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("[Resend] Failed to send email notification:", error);
    await dispatchNotification(shopDomain, evaluationResult, "Failed");
    return {
      delivered: false,
      error: error.message || "Network error sending email",
    };
  }
}