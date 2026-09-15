import db from "../db.server";
import { runRecipeDataset } from "../services/shopifyql.server";
import { dispatchNotification } from "../services/notifier.server";
import { evaluateRecipe } from "../services/evaluator.server";
import { getDefaultThresholds } from "../libs/recipes.config";

export async function runWorkflow(admin, shopDomain, recipeSlug, options = { force: false }) {
    try {
        const workflowSetting = await db.workflowSetting.findUnique({
            where: {
                shop_recipeSlug: {
                    shop: shopDomain,
                    recipeSlug: recipeSlug,
                },
            },
        });

        if (workflowSetting && !workflowSetting.isActive && !options.force) {
            return {
                success: false,
                skipped: true,
                reason: "Workflow is currently inactive",
            };
        }

        const config = workflowSetting?.config || getDefaultThresholds(recipeSlug);
        const channel = workflowSetting?.deliveryChannel || "IN_APP";

        const datasetResult = await runRecipeDataset(admin, recipeSlug, config);
        const evaluationResult = await evaluateRecipe(datasetResult, channel);

        if (evaluationResult.shouldAlert === true) {
            const notificationResult = await dispatchNotification(shopDomain, evaluationResult);

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