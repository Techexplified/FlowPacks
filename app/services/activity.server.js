import db from "../db.server";

export async function createActivityLog(shopDomain, logData) {
    try {
        const record = await db.activityLog.create({
            data: {
                shop: shopDomain,
                recipeSlug: logData.recipeSlug,
                recipeName: logData.recipeName,
                summaryText: logData.summaryText,
                channel: logData.channel || "IN_APP",
                status: logData.status || "Completed",
                isRead: false,
                details: logData.details || [],
                createdAt: new Date(),
            },
        });
        return record;
    } catch (err) {
        console.error("Error in createActivityLog:", err);
        throw new Error("Failed to create activity log");
    }
}

export async function getActivityLogs(shopDomain, timeFilter = "7d", page = 1, pageSize = 10) {
    try {
        const now = new Date();
        const whereClause = { shop: shopDomain };

        if (timeFilter === "24h") {
            whereClause.createdAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        } else if (timeFilter === "7d") {
            whereClause.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        } else if (timeFilter === "30d") {
            whereClause.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        }
        // "all" has no createdAt restriction

        const totalCount = await db.activityLog.count({ where: whereClause });
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages));
        const skip = (currentPage - 1) * pageSize;

        const activities = await db.activityLog.findMany({
            where: whereClause,
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: pageSize,
        });

        return {
            activities,
            totalCount,
            totalPages,
            page: currentPage,
            pageSize,
        };

    } catch (err) {
        console.error("Error in getActivityLogs:", err);
        throw new Error("Failed to fetch activities");
    }
}

export async function getUnreadLogsCount(shopDomain) {
    try {
        const count = await db.activityLog.count({
            where: {
                shop: shopDomain,
                isRead: false
            }
        });

        return count;
    } catch (err) {
        console.error("Error in getUnreadLogsCount:", err);
        throw new Error("Failed to fetch unread count");
    }
}

export async function getLatestUnreadLogs(shopDomain, limit = 1) {
    try {
        const logs = await db.activityLog.findMany({
            where: {
                shop: shopDomain,
                isRead: false
            },
            orderBy: {
                createdAt: "desc"
            },
            take: limit
        });
        return logs;
    } catch (err) {
        console.error("Error in getLatestUnreadLogs:", err);
        return [];
    }
}

export async function markAsRead(shopDomain, logIds) {
    try {
        const idList = Array.isArray(logIds) ? logIds : [logIds];
        await db.activityLog.updateMany({
            where: {
                shop: shopDomain,
                id: { in: idList }
            },
            data: { isRead: true }
        });
        return { status: "ok" };
    } catch (err) {
        console.error("Error in markAsRead:", err);
        throw new Error("Failed to mark as read");
    }
}

export async function markAllAsRead(shopDomain) {
    try {
        await db.activityLog.updateMany({
            where: {
                shop: shopDomain,
                isRead: false
            },
            data: { isRead: true }
        });
        return { status: "ok" };
    } catch (err) {
        console.error("Error in markAllAsRead:", err);
        throw new Error("Failed to mark all as read");
    }
}