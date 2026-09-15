import { unauthenticated } from "../shopify.server";
import db from "../db.server";
import { runAllActiveWorkflows, runWorkflow } from "../services/orchestrator.server";

/**
 * Validates request authorization if CRON_SECRET is defined in the environment.
 */
function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Open in local dev if no secret configured

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const authHeader = request.headers.get("Authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  return querySecret === cronSecret || bearerSecret === cronSecret;
}

/**
 * Core handler to execute scheduled automations across stores.
 */
async function handleCronExecution(request) {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const targetShop = url.searchParams.get("shop");
  const targetRecipe = url.searchParams.get("recipe");

  try {
    const shopsToProcess = [];

    if (targetShop) {
      shopsToProcess.push(targetShop);
    } else {
      // Find all distinct shops with at least one active workflow
      const activeWorkflows = await db.workflowSetting.findMany({
        where: { isActive: true },
        select: { shop: true },
        distinct: ["shop"],
      });
      shopsToProcess.push(...activeWorkflows.map((w) => w.shop));
    }

    const executionSummary = [];

    for (const shop of shopsToProcess) {
      try {
        const { admin } = await unauthenticated.admin(shop);

        if (targetRecipe) {
          const result = await runWorkflow(admin, shop, targetRecipe, { force: true });
          executionSummary.push({
            shop,
            recipe: targetRecipe,
            status: "completed",
            result,
          });
        } else {
          const results = await runAllActiveWorkflows(admin, shop);
          executionSummary.push({
            shop,
            status: "completed",
            activeWorkflowsExecuted: results.length,
            results,
          });
        }
      } catch (shopErr) {
        console.error(`[Cron Runner] Failed execution for shop ${shop}:`, shopErr.message);
        executionSummary.push({
          shop,
          status: "failed",
          error: shopErr.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        shopsTargeted: shopsToProcess.length,
        executions: executionSummary,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[Cron Runner] Fatal error running automations:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const loader = async ({ request }) => {
  return handleCronExecution(request);
};

export const action = async ({ request }) => {
  return handleCronExecution(request);
};
