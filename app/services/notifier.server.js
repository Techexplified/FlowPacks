import { createActivityLog } from "./activity.server";

export async function dispatchNotification(shopDomain, evaluationResult) {
    if (!evaluationResult || evaluationResult.shouldAlert === false) {
        return {
            delivered: false,
            reason: "No alert triggered"
        };
    }

    const channel = evaluationResult.deliveryChannel || "IN_APP";

    const logRecord = {
        recipeSlug: evaluationResult.recipeSlug,
        recipeName: evaluationResult.recipeName,
        summaryText: evaluationResult.summary,
        channel: channel,
        status: "Completed",
        isRead: false,
        details: evaluationResult.flaggedItems,
    };

    const record = await createActivityLog(shopDomain, logRecord);

    return {
        delivered: true,
        channel: channel,
        logRecord: record
    };
}

// Alias to maintain compatibility with dispatchNotfication spelling
export const dispatchNotfication = dispatchNotification;