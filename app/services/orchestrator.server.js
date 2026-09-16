import db from "../db.server";
import { runRecipeDataset } from "../services/shopifyql.server";
import { dispatchNotification, sendSlackNotification } from "../services/notifier.server";
import { createActivityLog } from "../services/activity.server";
import { evaluateRecipe } from "../services/evaluator.server";
import { getDefaultThresholds, getAvailableChannels, getRecipeBySlug } from "../libs/recipes.config";

export async function runWorkflow(admin, shopDomain, recipeSlug, options = { force: false }) {
    try {
        const recipe = getRecipeBySlug(recipeSlug);
        if (!recipe) {
            throw new Error(`Recipe not found: ${recipeSlug}`);
        }

        const workflowSetting = await db.workflowSetting.findUnique({
            where: {
                shop_recipeSlug: {
                    shop: shopDomain,
                    recipeSlug: recipeSlug,
                },
            },
        });

        if ((!workflowSetting || !workflowSetting.isActive) && !options.force) {
            return {
                success: false,
                skipped: true,
                reason: "This automation is currently disabled in your Automation Library.",
            };
        }

        const merchant = await db.merchantSettings.findUnique({
            where: { shop: shopDomain },
        });
        const enabledTypes = merchant?.enabledNotificationTypes || ["IN_APP"];
        const availableChannels = getAvailableChannels(recipeSlug, enabledTypes);

        // Core Rule: If no allowed channels are available (e.g. Email/Slack disabled for weekly digest), do NOT fire
        if (availableChannels.length === 0) {
            return {
                success: false,
                skipped: true,
                reason: `No valid notification channel (${recipe.allowedNotificationTypes.join(" or ")}) is enabled. Notification will not fire.`,
            };
        }

        const config = workflowSetting?.config || getDefaultThresholds(recipeSlug);
        const channel = availableChannels.includes(workflowSetting?.deliveryChannel)
            ? workflowSetting.deliveryChannel
            : availableChannels[0];

        const datasetResult = await runRecipeDataset(admin, recipeSlug, config);
        const evaluationResult = await evaluateRecipe(datasetResult, channel);

        if (evaluationResult.shouldAlert === true) {
            let notificationResult;
            if (channel === "SLACK" && merchant?.slackWebhookUrl) {
                notificationResult = await sendSlackNotification(
                    merchant.slackWebhookUrl,
                    evaluationResult,
                    shopDomain
                );
            } else {
                notificationResult = await dispatchNotification(shopDomain, evaluationResult);
            }

            return {
                success: true,
                shouldAlert: true,
                evaluationResult,
                notificationResult,
            };
        }

        return {
            success: true,
            shouldAlert: false,
            evaluationResult,
            reason: "No alert triggered",
        };

    } catch (err) {
        console.error(`Error running workflow ${recipeSlug}:`, err);
        try {
            const recipe = getRecipeBySlug(recipeSlug);
            await createActivityLog(shopDomain, {
                recipeSlug: recipeSlug,
                recipeName: recipe?.name || recipeSlug,
                summaryText: `Automation failed: ${err.message || "Execution error"}`,
                channel: "IN_APP",
                status: "Failed",
                isRead: false,
                details: [{ message: err.message || "An error occurred while executing this automation." }],
            });
        } catch (logErr) {
            console.error("Failed to log activity failure:", logErr);
        }
        throw new Error(`Failed to run workflow: ${err.message}`);
    }
}

export async function runAllActiveWorkflows(admin, shopDomain) {
    try {
        const activeWorkflows = await db.workflowSetting.findMany({
            where: {
                shop: shopDomain,
                isActive: true,
            },
        });

        const results = [];
        for (const workflow of activeWorkflows) {
            const result = await runWorkflow(admin, shopDomain, workflow.recipeSlug);
            results.push(result);
        }

        return results;
    } catch (err) {
        console.error("Error in runAllActiveWorkflows:", err);
        throw new Error("Failed to run all workflows");
    }
}