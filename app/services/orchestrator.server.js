import db from "../db.server";
import { runRecipeDataset } from "../services/shopifyql.server";
import { dispatchNotification, sendSlackNotification, sendEmailNotification } from "../services/notifier.server";
import { createActivityLog } from "../services/activity.server";
import { evaluateRecipe } from "../services/evaluator.server";
import { getDefaultThresholds, getAvailableChannels, getRecipeBySlug } from "../libs/recipes.config";
import { generateFingerprint } from "../utils/fingerprint";

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
            const currentFingerprint = generateFingerprint(recipeSlug, evaluationResult.flaggedItems);

            // Only deduplicate if NOT a forced manual run and fingerprint matches last alert
            const isDuplicate = !options.force && workflowSetting?.lastFingerprint === currentFingerprint;

            if (isDuplicate) {
                // 1. Update lastRunAt timestamp only
                await db.workflowSetting.upsert({
                    where: { shop_recipeSlug: { shop: shopDomain, recipeSlug } },
                    update: { lastRunAt: new Date() },
                    create: {
                        shop: shopDomain,
                        recipeSlug,
                        isActive: true,
                        lastRunAt: new Date(),
                        lastFingerprint: currentFingerprint,
                    },
                });

                // 2. Return deduplicated status without sending Slack/Email
                return {
                    success: true,
                    shouldAlert: true,
                    deduplicated: true,
                    reason: "Suppressed duplicate notification (fingerprint unchanged).",
                    evaluationResult,
                };
            }

            // If NOT duplicate (new items flagged or forced):
            // 1. Dispatch external notification (Slack / In-App / Email)
            let notificationResult;
            if (channel === "SLACK" && merchant?.slackWebhookUrl) {
                notificationResult = await sendSlackNotification(merchant.slackWebhookUrl, evaluationResult, shopDomain);
            } else if (channel === "EMAIL" && merchant?.notificationEmail) {
                notificationResult = await sendEmailNotification(merchant.notificationEmail, evaluationResult, shopDomain);
            } else {
                notificationResult = await dispatchNotification(shopDomain, evaluationResult);
            }


            // 2. Update DB with lastRunAt, lastAlertedAt, and the new lastFingerprint
            await db.workflowSetting.upsert({
                where: { shop_recipeSlug: { shop: shopDomain, recipeSlug } },
                update: {
                    lastRunAt: new Date(),
                    lastAlertedAt: new Date(),
                    lastFingerprint: currentFingerprint,
                },
                create: {
                    shop: shopDomain,
                    recipeSlug,
                    isActive: true,
                    lastRunAt: new Date(),
                    lastAlertedAt: new Date(),
                    lastFingerprint: currentFingerprint,
                },
            });

            return {
                success: true,
                shouldAlert: true,
                deduplicated: false,
                evaluationResult,
                notificationResult,
            };
        } else {
            // Update lastRunAt, and clear lastFingerprint so if an issue re-appears later, it alerts fresh
            await db.workflowSetting.upsert({
                where: { shop_recipeSlug: { shop: shopDomain, recipeSlug } },
                update: {
                    lastRunAt: new Date(),
                    lastFingerprint: null,
                },
                create: {
                    shop: shopDomain,
                    recipeSlug,
                    isActive: true,
                    lastRunAt: new Date(),
                    lastFingerprint: null,
                },
            });

            return {
                success: true,
                shouldAlert: false,
                evaluationResult,
                reason: "No alert triggered",
            };
        }
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