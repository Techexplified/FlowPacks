import { authenticate, unauthenticated } from "../shopify.server";
import db from "../db.server";
import { runWorkflow } from "../services/orchestrator.server";

export const action = async ({ request }) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`[Webhook] Received ${topic} for ${shop}. Order ID: ${payload?.id || "unknown"}`);

  try {
    let adminClient = admin;
    if (!adminClient) {
      const context = await unauthenticated.admin(shop);
      adminClient = context.admin;
    }

    if (!adminClient) {
      console.warn(`[Webhook orders/create] No admin context available for ${shop}`);
      return new Response(null, { status: 200 });
    }

    // Check if Rising Demand & Falling Stock workflow is active
    const risingDemandWorkflow = await db.workflowSetting.findUnique({
      where: {
        shop_recipeSlug: {
          shop,
          recipeSlug: "rising-demand-falling-stock",
        },
      },
    });

    if (risingDemandWorkflow && risingDemandWorkflow.isActive) {
      console.log(`[Webhook orders/create] Triggering rising-demand-falling-stock evaluation for ${shop}`);
      await runWorkflow(adminClient, shop, "rising-demand-falling-stock", { force: true });
    }
  } catch (err) {
    console.error(`[Webhook orders/create] Error handling order creation for ${shop}:`, err);
  }

  return new Response(null, { status: 200 });
};
