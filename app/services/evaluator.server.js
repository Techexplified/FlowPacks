/**
 * Helper to sanitize product titles and avoid formatting bugs in Slack/In-App.
 */
function cleanTitle(title) {
    if (!title || typeof title !== "string") return "Product";
    return title
        .replace(/[\r\n]+/g, " ")
        .replace(/\s*\|\s*$/, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Helper to safely extract comparison values from ShopifyQL rows.
 * Handles dynamic column prefixes like `comparison_net_sales__sub_14d`, `previous_net_sales`, etc.
 */
function getComparisonValue(row, baseName) {
    if (!row || typeof row !== "object") return 0;

    for (const [key, val] of Object.entries(row)) {
        if (
            key === `previous_${baseName}` ||
            key === `comparison_${baseName}` ||
            key.startsWith(`comparison_${baseName}__`) ||
            key.startsWith(`previous_${baseName}__`)
        ) {
            const num = parseFloat(val);
            return Number.isNaN(num) ? 0 : num;
        }
    }
    return 0;
}

// 1. Rising Demand and Falling Stock
function evaluateRisingDemand(data, config = {}) {
    const stockLimit = Number(config.stockLimit || 100);
    const flaggedItems = [];

    for (const item of data) {
        const currentStock = parseFloat(item.currentInventory ?? item.totalInventory ?? 0);
        const unitsSold = parseFloat(item.net_items_sold ?? item.netItemsSold ?? 0);

        if (currentStock < stockLimit && unitsSold > 0) {
            flaggedItems.push({
                productId: item.product_id,
                title: cleanTitle(item.product_title),
                currentInventory: currentStock,
                salesUnits: unitsSold,
                productImageUrl: item.productImageUrl || null,
                message: `${currentStock} in stock • ${unitsSold} sold recently`,
            });
        }
    }
    const summary = flaggedItems.length > 0
        ? `${flaggedItems.length} product(s) with fast-moving sales are running low on inventory`
        : "All evaluated products maintain healthy inventory levels relative to recent sales";
    return { flaggedItems, summary };
}

// 2. High Traffic Low Conversion
function evaluateHighTrafficLowConversion(data, config = {}) {
    const minSessions = Number(config.minSessions || 500);
    const maxConversion = Number(config.conversionCeilingPct || 1.0);
    const flaggedItems = [];

    for (const item of data) {
        const sessions = parseFloat(item.sessions || 0);
        const orders = parseFloat(item.orders || 0);
        const conversionRate = sessions > 0 ? (orders / sessions) * 100 : 0;

        if (sessions >= minSessions && conversionRate < maxConversion) {
            flaggedItems.push({
                productId: item.product_id,
                title: cleanTitle(item.product_title),
                sessions,
                orders,
                conversionRate: conversionRate.toFixed(2),
                productImageUrl: item.productImageUrl || null,
                message: `${sessions.toLocaleString()} sessions • ${orders} order(s) (${conversionRate.toFixed(2)}% conversion)`,
            });
        }
    }
    const summary = flaggedItems.length > 0
        ? `${flaggedItems.length} high-traffic product(s) have conversion rates below ${maxConversion}%`
        : "No high-traffic products with low conversion detected. Store traffic is converting within healthy thresholds";
    return { flaggedItems, summary };
}

// 3. Weekly Performance Digest
function evaluateWeeklyPerformanceDigest(data) {
    let totalSales = 0;
    let totalOrders = 0;
    let previousSales = 0;
    let previousOrders = 0;

    for (const row of data) {
        totalSales += parseFloat(row.net_sales || 0);
        totalOrders += parseFloat(row.orders || row.orders_count || 0);
        previousSales += getComparisonValue(row, "net_sales");
        previousOrders += getComparisonValue(row, "orders");
    }

    let summary = `Weekly Store Digest: $${totalSales.toFixed(2)} net sales across ${totalOrders} order(s)`;
    let comparisonText = "";
    if (previousSales > 0) {
        const diffPct = ((totalSales - previousSales) / previousSales) * 100;
        const sign = diffPct >= 0 ? "+" : "";
        comparisonText = ` (${sign}${diffPct.toFixed(1)}% vs previous period)`;
        summary += comparisonText;
    }

    return {
        shouldAlert: true,
        flaggedItems: [
            {
                totalSales,
                totalOrders,
                previousSales,
                previousOrders,
                title: "Weekly Store Performance",
                message: `Gross: $${totalSales.toFixed(2)} • ${totalOrders} orders${comparisonText}`,
            },
        ],
        summary,
    };
}

// 4. Slowing-down Bestseller
function evaluateSlowingBestSeller(data, config = {}) {
    const dropThresholdPct = Number(config.salesDropPct || 30);
    const flaggedItems = [];

    for (const item of data) {
        const currentSales = parseFloat(item.net_sales || 0);
        const baselineSales =
            getComparisonValue(item, "net_sales") ||
            parseFloat(item.previous_net_sales || 0);

        if (baselineSales > 0) {
            const declinePct = ((baselineSales - currentSales) / baselineSales) * 100;
            if (declinePct >= dropThresholdPct) {
                flaggedItems.push({
                    productId: item.product_id,
                    title: cleanTitle(item.product_title),
                    currentSales,
                    baselineSales,
                    dropPercentage: declinePct.toFixed(1),
                    productImageUrl: item.productImageUrl || null,
                    message: `Sales down ${declinePct.toFixed(1)}% ($${currentSales.toFixed(2)} vs $${baselineSales.toFixed(2)} baseline)`,
                });
            }
        }
    }

    const summary = flaggedItems.length > 0
        ? `${flaggedItems.length} top-selling product(s) experienced a sales drop exceeding ${dropThresholdPct}%`
        : "Top-selling products are maintaining steady sales momentum. No significant sales slowdown detected";
    return { flaggedItems, summary };
}

// 5. Abandoned Momentum
function evaluateAbandonedMomentum(data, config = {}) {
    const spikeThresholdPct = Number(config.trafficSpikePct || 100);
    const flaggedItems = [];

    for (const item of data) {
        const currentSessions = parseFloat(item.sessions || 0);
        const orders = parseFloat(item.orders || 0);
        const baselineSessions = getComparisonValue(item, "sessions");

        let isSpike = false;
        let growthPct = 0;
        if (baselineSessions > 0) {
            growthPct = ((currentSessions - baselineSessions) / baselineSessions) * 100;
            isSpike = growthPct >= spikeThresholdPct;
        } else if (currentSessions > 50) {
            isSpike = true;
        }

        if (isSpike && orders === 0) {
            flaggedItems.push({
                productId: item.product_id,
                title: cleanTitle(item.product_title),
                sessions: currentSessions,
                orders,
                growthPercentage: growthPct > 0 ? growthPct.toFixed(1) : undefined,
                productImageUrl: item.productImageUrl || null,
                message: `${currentSessions.toLocaleString()} visits (${growthPct > 0 ? `+${growthPct.toFixed(0)}% spike` : "high traffic"}) • 0 orders`,
            });
        }
    }

    const summary = flaggedItems.length > 0
        ? `${flaggedItems.length} product(s) experienced a sudden traffic surge without generating sales`
        : "No traffic spikes with zero conversions detected over the evaluation window";
    return { flaggedItems, summary };
}

// 6. New Product Underperforming
function evaluateNewProductPerformance(data, config = {}) {
    const minSales = Number(config.minSalesExpected ?? 5);
    const flaggedItems = [];

    for (const item of data) {
        const unitsSold = parseFloat(item.net_items_sold ?? item.netItemsSold ?? 0);
        if (unitsSold < minSales) {
            flaggedItems.push({
                productId: item.product_id,
                title: cleanTitle(item.product_title),
                salesUnits: unitsSold,
                createdAt: item.createdAt || null,
                productImageUrl: item.productImageUrl || null,
                message: `${unitsSold} unit(s) sold (expected at least ${minSales})`,
            });
        }
    }

    const summary = flaggedItems.length > 0
        ? `${flaggedItems.length} newly launched product(s) are below target sales velocity (${minSales} units)`
        : "All newly launched products meet or exceed target sales velocity";
    return { flaggedItems, summary };
}

// Core Evaluator
export function evaluateRecipe(datasetResult, deliveryChannel = "IN_APP") {
    if (!datasetResult) {
        return { shouldAlert: false, reason: "Store metrics evaluated successfully. No threshold conditions were met." };
    }

    const { recipeSlug, config = {}, data = [] } = datasetResult;
    const today = new Date();
    if (data.length === 0) {
        if (recipeSlug === "weekly-performance-digest") {
            const fallbackResult = evaluateWeeklyPerformanceDigest([{ net_sales: 0, orders: 0 }]);
            return {
                shouldAlert: true,
                recipeSlug,
                recipeName: datasetResult.recipeName,
                summary: fallbackResult.summary,
                flaggedItems: fallbackResult.flaggedItems,
                deliveryChannel,
                timestamp: today,
            };
        }

        let emptySummary = "Store metrics evaluated successfully. No threshold conditions were met.";
        switch (recipeSlug) {
            case "rising-demand-falling-stock":
                emptySummary = "All evaluated products maintain healthy inventory levels relative to recent sales.";
                break;
            case "high-traffic-low-conversion":
                emptySummary = "No high-traffic products with low conversion detected. Store traffic is converting within healthy thresholds.";
                break;
            case "slowing-down-bestseller":
                emptySummary = "Top-selling products are maintaining steady sales momentum. No significant sales slowdown detected.";
                break;
            case "abandoned-momentum":
                emptySummary = "No traffic spikes with zero conversions detected over the evaluation window.";
                break;
            case "new-product-underperforming":
                emptySummary = "All newly launched products meet or exceed target sales velocity.";
                break;
            default:
                emptySummary = "Store metrics evaluated successfully. No threshold conditions were met.";
        }

        return {
            shouldAlert: false,
            recipeSlug,
            recipeName: datasetResult.recipeName,
            summary: emptySummary,
            flaggedItems: [],
            deliveryChannel,
            timestamp: today,
        };
    }

    let result;
    switch (recipeSlug) {
        case "rising-demand-falling-stock":
            result = evaluateRisingDemand(data, config);
            break;

        case "high-traffic-low-conversion":
            result = evaluateHighTrafficLowConversion(data, config);
            break;

        case "weekly-performance-digest":
            result = evaluateWeeklyPerformanceDigest(data, config);
            break;

        case "slowing-down-bestseller":
            result = evaluateSlowingBestSeller(data, config);
            break;

        case "abandoned-momentum":
            result = evaluateAbandonedMomentum(data, config);
            break;

        case "new-product-underperforming":
            result = evaluateNewProductPerformance(data, config);
            break;

        default:
            return { shouldAlert: false, reason: "Unknown recipe" };
    }

    return {
        shouldAlert: Boolean(result.shouldAlert || (result.flaggedItems && result.flaggedItems.length > 0)),
        recipeSlug: recipeSlug,
        recipeName: datasetResult.recipeName,
        summary: result.summary,
        flaggedItems: result.flaggedItems || [],
        deliveryChannel: deliveryChannel,
        timestamp: today,
    };
}