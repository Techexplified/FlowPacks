/**
 * libs/recipes.config.js
 * Central blueprint for FlowPacks automation library (Catalog as Code).
 */

export const NOTIFICATION_TYPES = Object.freeze({
  EMAIL: 'EMAIL',
  SLACK: 'SLACK',
  IN_APP: 'IN_APP',
});

export const NOTIFICATION_TYPE_LABELS = Object.freeze({
  [NOTIFICATION_TYPES.EMAIL]: 'Email',
  [NOTIFICATION_TYPES.SLACK]: 'Slack',
  [NOTIFICATION_TYPES.IN_APP]: 'In-App Audit Log',
});

export const DEFAULT_NOTIFICATION_TYPES = Object.freeze([
  NOTIFICATION_TYPES.EMAIL,
  NOTIFICATION_TYPES.SLACK,
  NOTIFICATION_TYPES.IN_APP,
]);

export const CATEGORIES = Object.freeze([
  'All',
  'Sales & Revenue',
  'Inventory',
  'Products',
  'Reporting',
]);

export const AUTOMATION_RECIPES = Object.freeze({
  'rising-demand-falling-stock': Object.freeze({
    slug: 'rising-demand-falling-stock',
    name: 'Rising demand, falling stock',
    category: 'Inventory',
    description: 'Get alerted when a product is selling fast but inventory is running low.',
    allowedNotificationTypes: Object.freeze([
      NOTIFICATION_TYPES.EMAIL,
      NOTIFICATION_TYPES.SLACK,
      NOTIFICATION_TYPES.IN_APP,
    ]),
    fields: Object.freeze([
      {
        key: 'stockLimit',
        label: 'Alert when stock drops below',
        type: 'number',
        suffix: 'units',
        helperText: "You'll be notified when inventory goes below this number.",
        defaultValue: 20,
        min: 1,
        max: 10000,
      },
      {
        key: 'velocityPct',
        label: 'Sales velocity increase threshold',
        type: 'number',
        suffix: '% week over week',
        helperText: 'Trigger when sales increase by this percentage compared to the previous week.',
        defaultValue: 15,
        min: 1,
        max: 1000,
      },
    ]),
    /**
     * Flow Execution Architecture Note:
     * - ShopifyQL extracts product sales momentum over the lookback window.
     * - `stockLimit`: Evaluated in the compiled Shopify Flow Condition step against the
     *   product variant's live inventory (`inventoryQuantity < stockLimit`).
     * - `velocityPct`: Evaluated in the Flow Condition step comparing current vs previous period.
     */
    compileShopifyQL: (config = {}) => {
      return `
        FROM sales
        SHOW net_items_sold
        TIMESERIES day
        SINCE -7d
        GROUP BY product_id, product_title
        ORDER BY net_items_sold DESC
      `.trim();
    },
  }),

  'high-traffic-low-conversion': Object.freeze({
    slug: 'high-traffic-low-conversion',
    name: 'High traffic, low conversion',
    category: 'Sales & Revenue',
    description: 'Get notified when a product gets high views but few sales.',
    allowedNotificationTypes: Object.freeze([
      NOTIFICATION_TYPES.EMAIL,
      NOTIFICATION_TYPES.SLACK,
      NOTIFICATION_TYPES.IN_APP,
    ]),
    fields: Object.freeze([
      {
        key: 'minSessions',
        label: 'Minimum sessions to qualify as high traffic',
        type: 'number',
        suffix: 'sessions / week',
        helperText: 'Only evaluate products receiving at least this volume of traffic.',
        defaultValue: 500,
        min: 1,
        max: 1000000,
      },
      {
        key: 'conversionCeilingPct',
        label: 'Alert when conversion rate is below',
        type: 'number',
        suffix: '%',
        helperText: 'Flag items converting beneath this percentage.',
        defaultValue: 1.0,
        min: 0,
        max: 100,
        step: 0.1,
      },
      {
        key: 'sustainedDays',
        label: 'Sustained for at least',
        type: 'number',
        suffix: 'days',
        helperText: 'Avoid daily noise by confirming trend over consecutive days.',
        defaultValue: 3,
        min: 1,
        max: 30,
      },
    ]),
    /**
     * Flow Execution Architecture Note:
     * - ShopifyQL extracts session counts, orders, and conversion rates by product.
     * - `minSessions`, `conversionCeilingPct`, and `sustainedDays` are evaluated in Flow's condition nodes.
     */
    compileShopifyQL: (config = {}) => {
      return `
        FROM online_store
        SHOW sessions, orders, conversion_rate
        SINCE -7d
        GROUP BY product_id, product_title
        ORDER BY sessions DESC
      `.trim();
    },
  }),

  'weekly-performance-digest': Object.freeze({
    slug: 'weekly-performance-digest',
    name: 'Weekly performance digest',
    category: 'Reporting',
    description: 'Send a weekly summary of key store metrics to your email or Slack.',
    // Weekly digests require external delivery channels (Email or Slack)
    allowedNotificationTypes: Object.freeze([
      NOTIFICATION_TYPES.EMAIL,
      NOTIFICATION_TYPES.SLACK,
    ]),
    fields: Object.freeze([
      {
        key: 'sendDay',
        label: 'Send on',
        type: 'select',
        options: Object.freeze([
          { label: 'Monday', value: 'Monday' },
          { label: 'Tuesday', value: 'Tuesday' },
          { label: 'Wednesday', value: 'Wednesday' },
          { label: 'Thursday', value: 'Thursday' },
          { label: 'Friday', value: 'Friday' },
          { label: 'Saturday', value: 'Saturday' },
          { label: 'Sunday', value: 'Sunday' },
        ]),
        defaultValue: 'Monday',
      },
      {
        key: 'sendTime',
        label: 'Send time',
        type: 'select',
        options: Object.freeze([
          { label: '08:00 AM', value: '08:00' },
          { label: '09:00 AM', value: '09:00' },
          { label: '12:00 PM', value: '12:00' },
          { label: '06:00 PM', value: '18:00' },
        ]),
        defaultValue: '09:00',
      },
    ]),
    /**
     * Flow Execution Architecture Note:
     * - `sendDay` and `sendTime` configure the scheduled cron trigger in Shopify Flow.
     * - ShopifyQL retrieves 7-day sales and order totals compared to the previous period.
     */
    compileShopifyQL: () => {
      return `
        FROM sales
        SHOW net_sales, orders_count
        SINCE -7d
        COMPARE TO -14d
      `.trim();
    },
  }),

  'slowing-down-bestseller': Object.freeze({
    slug: 'slowing-down-bestseller',
    name: 'Slowing-down bestseller',
    category: 'Sales & Revenue',
    description: "Get alerted when a top seller's sales are dropping.",
    allowedNotificationTypes: Object.freeze([
      NOTIFICATION_TYPES.EMAIL,
      NOTIFICATION_TYPES.SLACK,
      NOTIFICATION_TYPES.IN_APP,
    ]),
    fields: Object.freeze([
      {
        key: 'topProductsCount',
        label: 'Consider a product a bestseller if in top',
        type: 'number',
        suffix: 'products by revenue',
        helperText: 'Identify your flagship catalog items based on gross sales.',
        defaultValue: 10,
        min: 1,
        max: 100,
      },
      {
        key: 'salesDropPct',
        label: 'Alert when recent sales drop by',
        type: 'number',
        suffix: '% vs. 30-day average',
        helperText: 'Triggers when pace falls drastically below historical average.',
        defaultValue: 30,
        min: 1,
        max: 100,
      },
    ]),
    /**
     * Flow Execution Architecture Note:
     * - `topProductsCount`: Directly interpolated into the ShopifyQL LIMIT clause.
     * - `salesDropPct`: Evaluated in the Flow Condition step against baseline comparison data.
     */
    compileShopifyQL: (config = {}) => {
      const topCount = Number(config.topProductsCount || 10);
      return `
        FROM sales
        SHOW net_sales
        SINCE -7d
        COMPARE TO -30d
        GROUP BY product_id, product_title
        ORDER BY net_sales DESC
        LIMIT ${topCount}
      `.trim();
    },
  }),

  'abandoned-momentum': Object.freeze({
    slug: 'abandoned-momentum',
    name: 'Abandoned momentum',
    category: 'Sales & Revenue',
    description: 'Find products with a sudden spike in traffic that are not converting.',
    allowedNotificationTypes: Object.freeze([
      NOTIFICATION_TYPES.EMAIL,
      NOTIFICATION_TYPES.SLACK,
      NOTIFICATION_TYPES.IN_APP,
    ]),
    fields: Object.freeze([
      {
        key: 'trafficSpikePct',
        label: 'Alert when traffic spikes above',
        type: 'number',
        suffix: '% vs. 7-day average',
        helperText: 'Detect viral surges from TikTok, PR, or ad campaigns.',
        defaultValue: 100,
        min: 1,
        max: 1000,
      },
      {
        key: 'windowHours',
        label: 'Within a window of',
        type: 'number',
        suffix: 'hours',
        helperText: 'Short lookback interval to catch momentum in real time.',
        defaultValue: 24,
        min: 1,
        max: 168,
      },
    ]),
    /**
     * Flow Execution Architecture Note:
     * - `windowHours`: Directly defines the SINCE interval in ShopifyQL.
     * - `trafficSpikePct`: Evaluated in the Flow Condition step.
     */
    compileShopifyQL: (config = {}) => {
      const hours = Number(config.windowHours || 24);
      return `
        FROM online_store
        SHOW sessions, orders
        SINCE -${hours}h
        COMPARE TO -7d
        GROUP BY product_id, product_title
      `.trim();
    },
  }),

  'new-product-underperforming': Object.freeze({
    slug: 'new-product-underperforming',
    name: 'New product underperforming',
    category: 'Products',
    description: 'Get alerted when a new product is not gaining expected traction.',
    allowedNotificationTypes: Object.freeze([
      NOTIFICATION_TYPES.EMAIL,
      NOTIFICATION_TYPES.SLACK,
      NOTIFICATION_TYPES.IN_APP,
    ]),
    fields: Object.freeze([
      {
        key: 'launchWindowDays',
        label: 'Apply to products launched within',
        type: 'number',
        suffix: 'days',
        helperText: 'Evaluates items created inside this initial release timeframe.',
        defaultValue: 14,
        min: 1,
        max: 90,
      },
      {
        key: 'minSalesExpected',
        label: 'Alert if sales are below',
        type: 'number',
        suffix: 'units in that window',
        helperText: 'Minimum viable units required to consider launch successful.',
        defaultValue: 5,
        min: 0,
        max: 10000,
      },
    ]),
    /**
     * Flow Execution Architecture Note:
     * - `launchWindowDays`: Sets the SINCE window for sales analysis in ShopifyQL.
     * - `minSalesExpected`: Evaluated in the Flow Condition step (`net_items_sold < minSalesExpected`).
     */
    compileShopifyQL: (config = {}) => {
      const days = Number(config.launchWindowDays || 14);
      return `
        FROM sales
        SHOW net_items_sold
        SINCE -${days}d
        GROUP BY product_id, product_title
      `.trim();
    },
  }),
});

/**
 * Returns an array of all recipe objects.
 */
export const getCatalogList = () => Object.values(AUTOMATION_RECIPES);

/**
 * Retrieves a single recipe by its slug.
 */
export const getRecipeBySlug = (slug) => AUTOMATION_RECIPES[slug] || null;

/**
 * Extracts default thresholds for seeding a new workflow setting or modal form.
 */
export const getDefaultThresholds = (recipeSlug) => {
  const recipe = getRecipeBySlug(recipeSlug);
  if (!recipe) return {};
  return recipe.fields.reduce((acc, field) => {
    acc[field.key] = field.defaultValue;
    return acc;
  }, {});
};

/**
 * Computes available notification channels:
 * Intersection between recipe.allowedNotificationTypes and merchant.enabledNotificationTypes.
 */
export const getAvailableChannels = (recipeSlug, enabledNotificationTypes = []) => {
  const recipe = getRecipeBySlug(recipeSlug);
  if (!recipe) return [];
  const enabledSet = new Set(enabledNotificationTypes);
  return recipe.allowedNotificationTypes.filter((type) => enabledSet.has(type));
};

/**
 * Resolves the active delivery channel with fallback priority:
 * EMAIL -> SLACK -> IN_APP.
 * Returns null if no valid channel is available.
 */
export const resolveDeliveryChannel = (
  recipeSlug,
  enabledNotificationTypes = [],
  preferredChannel = NOTIFICATION_TYPES.EMAIL
) => {
  const available = getAvailableChannels(recipeSlug, enabledNotificationTypes);
  if (available.length === 0) {
    const recipe = getRecipeBySlug(recipeSlug);
    return recipe?.allowedNotificationTypes?.[0] || NOTIFICATION_TYPES.EMAIL;
  }
  if (preferredChannel && available.includes(preferredChannel)) {
    return preferredChannel;
  }
  const priority = [
    NOTIFICATION_TYPES.EMAIL,
    NOTIFICATION_TYPES.SLACK,
    NOTIFICATION_TYPES.IN_APP,
  ];
  return priority.find((channel) => available.includes(channel)) || available[0];
};

/**
 * Validates and sanitizes a recipe configuration against its field specifications.
 */
export const validateRecipeConfig = (recipeSlug, config = {}) => {
  const recipe = getRecipeBySlug(recipeSlug);
  if (!recipe) {
    return { isValid: false, errors: { recipe: 'Unknown recipe' }, sanitizedConfig: {} };
  }

  const errors = {};
  const sanitizedConfig = {};

  for (const field of recipe.fields) {
    const rawVal = config[field.key];
    if (field.type === 'number') {
      const num = Number(rawVal !== undefined && rawVal !== null && rawVal !== '' ? rawVal : field.defaultValue);
      if (Number.isNaN(num)) {
        errors[field.key] = `${field.label} must be a valid number.`;
      } else if (field.min !== undefined && num < field.min) {
        errors[field.key] = `${field.label} cannot be less than ${field.min}.`;
      } else if (field.max !== undefined && num > field.max) {
        errors[field.key] = `${field.label} cannot exceed ${field.max}.`;
      } else {
        sanitizedConfig[field.key] = num;
      }
    } else if (field.type === 'select') {
      const selected = rawVal || field.defaultValue;
      const validOptions = field.options.map((opt) => opt.value);
      if (!validOptions.includes(selected)) {
        errors[field.key] = `Invalid option selected for ${field.label}.`;
      } else {
        sanitizedConfig[field.key] = selected;
      }
    } else {
      sanitizedConfig[field.key] = rawVal ?? field.defaultValue;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedConfig,
  };
};