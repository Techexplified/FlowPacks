// 1. Rising Demand and Falling Stock
function evaluateRisingDemand(data, config = {}) {
    const stockLimit = Number(config.stockLimit || 20);
    let flaggedItems = [];

    for (const item of data) {
        const currentStock = Number(item.currentInventory || 0);
        const unitsSold = Number(item.netItemsSold || item.net_items_sold || 0);

        if (currentStock < stockLimit && unitsSold > 0) {
            const temp = {
                productId: item.product_id,
                title: item.product_title,
                currentStock: currentStock,
                unitsSold: unitsSold,
                message: `Stock is ${currentStock} while units ${unitsSold} sold recently `,
            };
            flaggedItems.push(temp);
        }
    }
    const summary = `${flaggedItems.length} products have high demand but low stock`;
    return { flaggedItems: flaggedItems, summary: summary };
}

// 2. High Traffic Low Conversion
function evaluateHighTrafficLowConversion(data, config = {}) {
    const minSessions = Number(config.minSessions || 500);
    const maxConversion = Number(config.conversionCeilingPct || 1.0);
    let flaggedItems = [];

    for (const item of data) {
        const sessions = Number(item.sessions || 0);
        const conversionRate = Number(item.conversion_rate || 0);

        if (sessions >= minSessions && conversionRate < maxConversion) {
            const temp = {
                productId: item.product_id,
                title: item.product_title,
                sessions: sessions,
                conversionRate: conversionRate,
                message: `Product has ${sessions} sessions but only conversion rate of ${conversionRate} `,
            };
            flaggedItems.push(temp);
        }
    }
    const summary = `${flaggedItems.length} products have high traffic but low conversion`;
    return { flaggedItems: flaggedItems, summary: summary };
}

// 3. Weekly Performance Digest
function evaluateWeeklyPerformanceDigest(data, config = {}) {
    let totalSales = 0;
    let totalOrders = 0;

    for (const row of data) {
        totalSales += Number(row.net_sales || 0);
        totalOrders += Number(row.orders_count || 0);
    }

    const summary = `Weekly Digest: total sales of $${totalSales.toFixed(2)} across ${totalOrders} orders`;

    return { shouldAlert: true, flaggedItems: [{ totalSales: totalSales, totalOrders: totalOrders }], summary: summary };
}

// 4. Slowing - down Bestseller
function evaluateSlowingBestSeller(data, config = {}) {
    const dropThresholdPct = Number(config.salesDropPct || 30);
    let flaggedItems = [];

    for (const item of data) {
        const currentSales = Number(item.net_sales || 0);
        const baselineSales = Number(item.previous_net_sales || currentSales);

        if (baselineSales > 0) {
            const declinPct = ((baselineSales - currentSales) / baselineSales) * 100;
            if (declinPct >= dropThresholdPct) {
                const temp = {
                    productId: item.product_id,
                    title: item.product_title,
                    declinePct: declinPct.toFixed(1),
                    message: `Sales dropped by ${declinPct.toFixed(1)}% compared to baseline`,
                };
                flaggedItems.push(temp);
            }
        };
    }

    const summary = `${flaggedItems.length} best sellers experiencing sales slowdown`;
    return { flaggedItems: flaggedItems, summary: summary };
}

//5. Abandoned Momentum
function evaluateAbandonedMomentum(data, config = {}) {
    const spikePctThreshold = Number(config.trafficSpikePct || 100);
    let flaggedItems = [];

    for (const item of data) {
        const currentSessions = Number(item.sessions || 0);
        const orders = Number(item.orders || 0);

        if (currentSessions > 50 && orders == 0) {
            const temp = {
                productId: item.product_id,
                title: item.product_title,
                sessions: currentSessions,
                orders: orders,
                message: `Traffic spiked with ${currentSessions} visits but 0 orders`,
            };
            flaggedItems.push(temp);
        }
    }

    const summary = `${flaggedItems.length} product(s) had traffic spikes with zero orders`;
    return { flaggedItems: flaggedItems, summary: summary };
}

// 6. New Product UnderPerforming
function evaluateNewProductPerformance(data, config = {}) {
    const minSales = Number(config.minSalesExpected || 5);
    let flaggedItems = [];

    for (const item of data) {
        const unitsSold = Number(item.net_items_sold || item.netItemsSold || 0);
        if (unitsSold < minSales) {
            const temp = {
                productId: item.product_id,
                title: item.product_title,
                unitsSold: unitsSold,
                message: `New product sold only ${unitsSold} units (expected atleast ${minSales})`,
            }
            flaggedItems.push(temp);
        }
    }

    const summary = `${flaggedItems.length} new products underperforming`
    return { flaggedItems: flaggedItems, summary: summary };
}

// Core Evaluator
export function evaluateRecipe(datasetResult, deliveryChannel = "EMAIL") {
    if (!datasetResult) {
        return { shouldAlert: false, reason: "No data available" };
    }

    const { recipeSlug, config = {}, data = [] } = datasetResult;
    const today = new Date();
    if (data.length == 0) {
        return { shouldAlert: false, reason: "No data available" };
    };

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