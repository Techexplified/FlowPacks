import db from "../db.server";
import {
  getCatalogList,
  getRecipeBySlug,
  getDefaultThresholds,
  resolveDeliveryChannel,
  validateRecipeConfig,
  getAvailableChannels,
} from "../libs/recipes.config";

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

/**
 * Retrieves all catalog recipes merged with current merchant workflow settings.
 * Seeds any missing records with default configurations.
 */
export async function getMerchantWorkflows(shopDomain) {
  try {
    const merchant = await getOrCreateMerchantSettings(shopDomain);
    const existingWorkflows = await db.workflowSetting.findMany({
      where: { shop: shopDomain },
    });

    const workflowMap = new Map(existingWorkflows.map((w) => [w.recipeSlug, w]));
    const catalog = getCatalogList();
    const mergedRecipes = [];

    for (const recipe of catalog) {
      let setting = workflowMap.get(recipe.slug);

      if (!setting) {
        const defaultThresholds = getDefaultThresholds(recipe.slug);
        const defaultChannel = resolveDeliveryChannel(
          recipe.slug,
          merchant.enabledNotificationTypes,
          "EMAIL"
        );

        setting = await db.workflowSetting.create({
          data: {
            shop: shopDomain,
            recipeSlug: recipe.slug,
            isActive: false,
            deliveryChannel: defaultChannel || "EMAIL",
            config: defaultThresholds,
          },
        });
      }

      mergedRecipes.push({
        ...recipe,
        isActive: setting.isActive,
        deliveryChannel: setting.deliveryChannel,
        config: setting.config || getDefaultThresholds(recipe.slug),
        availableChannels: getAvailableChannels(recipe.slug, merchant.enabledNotificationTypes),
        settingId: setting.id,
      });
    }

    return {
      merchant,
      recipes: mergedRecipes,
    };
  } catch (err) {
    console.error("Error fetching merchant workflows:", err);
    throw err;
  }
}

/**
 * Toggles a workflow's active status (1-click active/inactive switch).
 */
export async function toggleWorkflowActive(shopDomain, recipeSlug, isActive) {
  try {
    const recipe = getRecipeBySlug(recipeSlug);
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeSlug}`);
    }

    const updated = await db.workflowSetting.upsert({
      where: {
        shop_recipeSlug: {
          shop: shopDomain,
          recipeSlug,
        },
      },
      create: {
        shop: shopDomain,
        recipeSlug,
        isActive: Boolean(isActive),
        deliveryChannel: "EMAIL",
        config: getDefaultThresholds(recipeSlug),
      },
      update: {
        isActive: Boolean(isActive),
      },
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        shop: shopDomain,
        recipeSlug,
        recipeName: recipe.name,
        summaryText: `Automation ${isActive ? "activated" : "deactivated"}`,
        channel: updated.deliveryChannel,
        status: "Completed",
      },
    });

    return updated;
  } catch (err) {
    console.error(`Error toggling workflow ${recipeSlug}:`, err);
    throw err;
  }
}

/**
 * Updates a workflow's custom threshold configuration and delivery channel.
 */
export async function updateWorkflowConfig(shopDomain, recipeSlug, rawConfig, deliveryChannel) {
  try {
    const recipe = getRecipeBySlug(recipeSlug);
    if (!recipe) {
      throw new Error(`Recipe not found: ${recipeSlug}`);
    }

    const validation = validateRecipeConfig(recipeSlug, rawConfig);
    if (!validation.isValid) {
      const errorMsg = Object.values(validation.errors).join(", ");
      throw new Error(`Validation failed: ${errorMsg}`);
    }

    const merchant = await getOrCreateMerchantSettings(shopDomain);
    const availableChannels = getAvailableChannels(recipeSlug, merchant.enabledNotificationTypes);
    const validChannel = availableChannels.includes(deliveryChannel)
      ? deliveryChannel
      : resolveDeliveryChannel(recipeSlug, merchant.enabledNotificationTypes, "EMAIL");

    const updated = await db.workflowSetting.upsert({
      where: {
        shop_recipeSlug: {
          shop: shopDomain,
          recipeSlug,
        },
      },
      create: {
        shop: shopDomain,
        recipeSlug,
        isActive: true,
        deliveryChannel: validChannel || "EMAIL",
        config: validation.sanitizedConfig,
      },
      update: {
        deliveryChannel: validChannel || "EMAIL",
        config: validation.sanitizedConfig,
      },
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        shop: shopDomain,
        recipeSlug,
        recipeName: recipe.name,
        summaryText: `Thresholds updated and saved`,
        channel: updated.deliveryChannel,
        status: "Completed",
      },
    });

    return updated;
  } catch (err) {
    console.error(`Error updating workflow config ${recipeSlug}:`, err);
    throw err;
  }
}

/**
 * Submits a new automation idea from merchant.
 */
export async function createSuggestion(shopDomain, triggerIdea, notes = "") {
  try {
    if (!triggerIdea || !triggerIdea.trim()) {
      throw new Error("Trigger idea is required.");
    }

    const suggestion = await db.suggestion.create({
      data: {
        shop: shopDomain,
        triggerIdea: triggerIdea.trim(),
        notes: notes ? notes.trim() : null,
      },
    });

    return suggestion;
  } catch (err) {
    console.error("Error creating suggestion:", err);
    throw err;
  }
}