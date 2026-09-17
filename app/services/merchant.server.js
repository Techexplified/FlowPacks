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
 * Uses an atomic database transaction to guarantee consistency.
 */
export async function completeMerchantOnboarding(shopDomain, data) {
  try {
    const notificationEmail = data?.notificationEmail?.trim();
    const enabledNotificationTypes = data?.enabledNotificationTypes;
    const webhookUrl = data?.webhookUrl ? data.webhookUrl.trim() : null;
    const workspaceName = data?.workspaceName ? data.workspaceName.trim() : null;
    const channelName = data?.channelName ? data.channelName.trim() : null;

    if (!Array.isArray(enabledNotificationTypes) || enabledNotificationTypes.length === 0) {
      throw new Error("At least one notification channel must remain active.");
    }

    if (enabledNotificationTypes.includes("EMAIL")) {
      if (!notificationEmail || !notificationEmail.includes("@")) {
        throw new Error("A valid email address is required when Email alerts are enabled.");
      }
    }

    // Check existing settings for Slack configuration
    const existingMerchant = await db.merchantSettings.findUnique({
      where: { shop: shopDomain },
    });

    if (enabledNotificationTypes.includes("SLACK")) {
      const hasExistingSlack = Boolean(existingMerchant?.slackWebhookUrl);
      const hasNewWebhook = Boolean(webhookUrl && webhookUrl.startsWith("https://"));

      if (!hasExistingSlack && !hasNewWebhook) {
        throw new Error("Please connect a valid Slack webhook URL before enabling Slack alerts.");
      }
    }

    // Atomic Database Transaction for Merchant Settings + 6 Workflow Settings
    const result = await db.$transaction(async (tx) => {
      // 1. Update Merchant Settings
      const updatedSettings = await tx.merchantSettings.update({
        where: { shop: shopDomain },
        data: {
          notificationEmail: notificationEmail || null,
          enabledNotificationTypes,
          hasCompletedOnboarding: true,
          ...(webhookUrl
            ? {
                slackWebhookUrl: webhookUrl,
                slackWorkspaceName: workspaceName || "Slack Workspace",
                slackChannelName: channelName || "#general",
              }
            : {}),
        },
      });

      // 2. Automatically seed/upsert default Workflow Settings for all catalog recipes
      const recipes = getCatalogList();
      for (const recipe of recipes) {
        const defaultThresholds = getDefaultThresholds(recipe.slug);
        const defaultChannel = resolveDeliveryChannel(
          recipe.slug,
          enabledNotificationTypes,
          "EMAIL"
        );

        await tx.workflowSetting.upsert({
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
    });

    return result;
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

// Update merchant email
export async function updateMerchantEmail(shopDomain, email) {
  try {
    const trimmedEmail = email ? email.trim() : null;
    const current = await db.merchantSettings.findUnique({
      where: { shop: shopDomain },
      select: { enabledNotificationTypes: true },
    });

    const types = new Set(current?.enabledNotificationTypes || []);
    if (trimmedEmail && trimmedEmail.includes("@")) {
      types.add("EMAIL");
    } else {
      types.delete("EMAIL");
    }

    const updatedSettings = await db.merchantSettings.update({
      where: { shop: shopDomain },
      data: {
        notificationEmail: trimmedEmail,
        enabledNotificationTypes: Array.from(types),
      },
    });
    return updatedSettings;
  } catch (err) {
    console.error("Error updating merchant email:", err);
    throw err;
  }
}

// For Connecting Slack
export async function connectSlackWebhook(shop, { webhookUrl, workspaceName, channelName }) {
  try {
    const cleanUrl = webhookUrl ? webhookUrl.trim() : "";
    if (!cleanUrl || !cleanUrl.startsWith("https://")) {
      throw new Error("Please provide a valid HTTPS Slack webhook URL.");
    }

    const ping = await fetch(cleanUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "FlowPacks connected successfully! 🚀" }),
    });

    if (!ping.ok) {
      throw new Error("Invalid Slack webhook URL or channel not reachable.");
    }

    const current = await db.merchantSettings.findUnique({
      where: { shop },
      select: { enabledNotificationTypes: true },
    });

    const types = new Set(current?.enabledNotificationTypes || []);
    types.add("SLACK");

    const updatedSettings = await db.merchantSettings.update({
      where: { shop },
      data: {
        slackWebhookUrl: cleanUrl,
        slackWorkspaceName: workspaceName ? workspaceName.trim() : "Slack Workspace",
        slackChannelName: channelName ? channelName.trim() : "#general",
        enabledNotificationTypes: Array.from(types),
      },
    });

    return updatedSettings;
  } catch (err) {
    console.error("Error connecting Slack webhook:", err);
    throw err;
  }
}

// For Disconnecting Slack
export async function disconnectSlackWebhook(shop) {
  try {
    const current = await db.merchantSettings.findUnique({
      where: { shop },
      select: { enabledNotificationTypes: true },
    });
    const types = new Set(current?.enabledNotificationTypes || []);
    types.delete("SLACK");
    const updatedSettings = await db.merchantSettings.update({
      where: { shop },
      data: {
        slackWebhookUrl: null,
        slackWorkspaceName: null,
        slackChannelName: null,
        enabledNotificationTypes: Array.from(types),
      },
    });
    return updatedSettings;
  } catch (err) {
    console.error("Error disconnecting Slack webhook:", err);
    throw err;
  }
}

// Toggle in-app notifications
export async function toggleInAppNotifications(shop, isEnabled) {
  try {
    const current = await db.merchantSettings.findUnique({
      where: { shop },
      select: { enabledNotificationTypes: true },
    });

    const types = new Set(current?.enabledNotificationTypes || []);
    if (isEnabled) {
      types.add("IN_APP");
    } else {
      types.delete("IN_APP");
    }

    const updatedSettings = await db.merchantSettings.update({
      where: { shop },
      data: {
        enabledNotificationTypes: Array.from(types),
      },
    });

    return updatedSettings;
  } catch (err) {
    console.error("Error toggling in-app notifications:", err);
    throw err;
  }
}

// Update notification alert preferences (checkboxes)
export async function updateAlertPreferences(shop, { alertOnTriggered, alertOnFailed, alertWeeklyDigest }) {
  try {
    const updatedSettings = await db.merchantSettings.update({
      where: { shop },
      data: {
        ...(alertOnTriggered !== undefined ? { alertOnTriggered: Boolean(alertOnTriggered) } : {}),
        ...(alertOnFailed !== undefined ? { alertOnFailed: Boolean(alertOnFailed) } : {}),
        ...(alertWeeklyDigest !== undefined ? { alertWeeklyDigest: Boolean(alertWeeklyDigest) } : {}),
      },
    });

    return updatedSettings;
  } catch (err) {
    console.error("Error updating alert preferences:", err);
    throw err;
  }
}

// Toggle any notification channel (EMAIL, SLACK, IN_APP) independently
export async function toggleChannelNotification(shop, channelType, isEnabled) {
  try {
    const current = await db.merchantSettings.findUnique({
      where: { shop },
      select: {
        enabledNotificationTypes: true,
        notificationEmail: true,
        slackWebhookUrl: true,
      },
    });

    const types = new Set(current?.enabledNotificationTypes || []);
    if (isEnabled) {
      if (channelType === "EMAIL" && (!current?.notificationEmail || !current?.notificationEmail.includes("@"))) {
        throw new Error("Please configure a valid email address first before enabling email alerts.");
      }
      if (channelType === "SLACK" && !current?.slackWebhookUrl) {
        throw new Error("Please connect a Slack webhook URL first before enabling Slack alerts.");
      }
      types.add(channelType);
    } else {
      types.delete(channelType);
    }

    const updatedSettings = await db.merchantSettings.update({
      where: { shop },
      data: {
        enabledNotificationTypes: Array.from(types),
      },
    });

    return updatedSettings;
  } catch (err) {
    console.error(`Error toggling channel ${channelType}:`, err);
    throw err;
  }
}
