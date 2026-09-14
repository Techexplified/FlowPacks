import db from "../db.server";
import { getCatalogList, getDefaultThresholds, resolveDeliveryChannel } from "../libs/recipes.config";

/**
 * Retrieves existing merchant settings or creates initial default record.
 */
export async function getOrCreateMerchantSettings(shopDomain, defaultEmail = null) {
  try {
    let shopRecord = await db.merchantSettings.findUnique({
      where: { shop: shopDomain },
    });

    if (!shopRecord) {
      shopRecord = await db.merchantSettings.create({
        data: {
          shop: shopDomain,
          notificationEmail: defaultEmail,
          enabledNotificationTypes: ["EMAIL", "SLACK", "IN_APP"],
          hasCompletedOnboarding: false,
        },
      });
    }

    return shopRecord;
  } catch (err) {
    console.error("Error getting or creating merchant settings:", err);
    throw err;
  }
}

/**
 * Completes merchant onboarding, updates notification channels,
 * and automatically initializes default workflow settings for all 6 catalog recipes.
 */
export async function completeMerchantOnboarding(shopDomain, data) {
  try {
    const notificationEmail = data?.notificationEmail?.trim();
    const enabledNotificationTypes = data?.enabledNotificationTypes;

    if (!Array.isArray(enabledNotificationTypes) || enabledNotificationTypes.length === 0) {
      throw new Error("At least one notification channel must remain active.");
    }

    if (enabledNotificationTypes.includes("EMAIL")) {
      if (!notificationEmail || !notificationEmail.includes("@")) {
        throw new Error("A valid email address is required when Email alerts are enabled.");
      }
    }

    // 1. Update Merchant Settings
    const updatedSettings = await db.merchantSettings.update({
      where: { shop: shopDomain },
      data: {
        notificationEmail: notificationEmail || null,
        enabledNotificationTypes,
        hasCompletedOnboarding: true,
      },
    });

    // 2. Automatically seed/upsert default Workflow Settings for all catalog recipes
    const recipes = getCatalogList();
    for (const recipe of recipes) {
      const defaultThresholds = getDefaultThresholds(recipe.slug);
      const defaultChannel = resolveDeliveryChannel(recipe.slug, enabledNotificationTypes, "EMAIL");

      await db.workflowSetting.upsert({
        where: {
          shop_recipeSlug: {
            shop: shopDomain,
            recipeSlug: recipe.slug,
          },
        },
        create: {
          shop: shopDomain,
          recipeSlug: recipe.slug,
          isActive: false,
          deliveryChannel: defaultChannel || "EMAIL",
          config: defaultThresholds,
        },
        update: {
          deliveryChannel: defaultChannel || "EMAIL",
        },
      });
    }

    return updatedSettings;
  } catch (err) {
    console.error("Error completing merchant onboarding:", err);
    throw err;
  }
}