import { getRecipeBySlug } from "../libs/recipes.config";

/**
 * Core GraphQL document for executing ShopifyQL queries on the Shopify Admin API.
 */
const SHOPIFYQL_QUERY = `#graphql
  query runShopifyQL($query: String!) {
    shopifyqlQuery(query: $query) {
      tableData {
        columns {
          name
          dataType
          displayName
        }
        rows
      }
      parseErrors
    }
  }
`;

/**
 * GraphQL document to fetch product inventory quantities for inventory-related recipes.
 * Fetches up to 100 variants to prevent missing stock on multi-variant products.
 */
const PRODUCT_INVENTORY_QUERY = `#graphql
  query getProductInventory($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        totalInventory
        featuredImage {
          url
        }
        variants(first: 100) {
          nodes {
            id
            title
            inventoryQuantity
          }
        }
      }
    }
  }
`;

/**
 * GraphQL document to fetch product details by its handle.
 */
const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query getProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      totalInventory
      featuredImage {
        url
      }
      variants(first: 100) {
        nodes {
          id
          title
          inventoryQuantity
        }
      }
    }
  }
`;

/**
 * GraphQL document to fetch recently created products within the launch window.
 */
const RECENT_PRODUCTS_QUERY = `#graphql
  query getRecentProducts($query: String!) {
    products(first: 50, query: $query) {
      nodes {
        id
        title
        createdAt
        featuredImage {
          url
        }
      }
    }
  }
`;

/**
 * Helper to ensure a product ID is formatted as a full Shopify GID.
 */
export function toProductGid(id) {
  if (!id) return "";
  const str = String(id);
  return str.startsWith("gid://shopify/Product/") ? str : `gid://shopify/Product/${str}`;
}

/**
 * Helper to extract raw numeric product ID from a GID or numeric string.
 */
export function toRawProductId(id) {
  if (!id) return "";
  return String(id).replace("gid://shopify/Product/", "");
}

/**
 * Extracts the product handle from a landing page path.
 * Supports /products/:handle, /collections/:col/products/:handle, locale prefixes, and query parameters.
 */
export function extractProductHandle(path) {
  if (!path || typeof path !== "string") return null;
  const cleanPath = path.split("?")[0].split("#")[0];
  const match = cleanPath.match(/\/products\/([a-zA-Z0-9\-_%]+)/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * Transforms raw ShopifyQL table data (columns + rows arrays) into a clean array of JS objects.
 */
export function formatShopifyQLData(tableData) {
  if (!tableData || !Array.isArray(tableData.columns) || !Array.isArray(tableData.rows)) {
    return [];
  }

  const columnNames = tableData.columns.map((col) => col.name);
  return tableData.rows.map((row) => {
    const rowObject = {};
    columnNames.forEach((colName, index) => {
      rowObject[colName] = row[index];
    });
    return rowObject;
  });
}

/**
 * Executes a raw ShopifyQL query string against the Shopify GraphQL Admin API.
 * Returns parsed rows and any diagnostic warnings.
 */
export async function executeShopifyQL(admin, queryString) {
  try {
    const response = await admin.graphql(SHOPIFYQL_QUERY, {
      variables: {
        query: queryString.trim(),
      },
    });

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      const errorMsg = result.errors.map((e) => e.message).join(", ");
      throw new Error(`ShopifyQL GraphQL Error: ${errorMsg}`);
    }

    const payload = result?.data?.shopifyqlQuery;
    if (payload?.parseErrors && payload.parseErrors.length > 0) {
      const parseErrors = payload.parseErrors
        .map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e)))
        .join("; ");
      throw new Error(`ShopifyQL Parse Error: ${parseErrors}`);
    }

    const rows = formatShopifyQLData(payload?.tableData);
    return {
      success: true,
      query: queryString,
      rows,
      rawColumns: payload?.tableData?.columns || [],
    };
  } catch (err) {
    console.error("Error executing ShopifyQL query:", err.message);
    return {
      success: false,
      query: queryString,
      error: err.message,
      rows: [],
    };
  }
}

/**
 * Fetches live inventory levels for an array of Shopify Product IDs.
 * Normalizes numeric IDs to GIDs and aggregates variant stock if needed.
 */
export async function fetchProductInventories(admin, productIds = []) {
  if (!productIds || productIds.length === 0) return {};

  try {
    const formattedIds = productIds.map(toProductGid).filter(Boolean);
    if (formattedIds.length === 0) return {};

    const response = await admin.graphql(PRODUCT_INVENTORY_QUERY, {
      variables: { ids: formattedIds },
    });

    const result = await response.json();
    const nodes = result?.data?.nodes || [];

    const inventoryMap = {};
    nodes.forEach((node) => {
      if (node && node.id) {
        let totalInv = typeof node.totalInventory === "number" ? node.totalInventory : 0;
        if (node.variants?.nodes && node.variants.nodes.length > 0) {
          const sumVar = node.variants.nodes.reduce(
            (acc, v) => acc + (Number(v.inventoryQuantity) || 0),
            0
          );
          if (node.totalInventory === null || node.totalInventory === undefined) {
            totalInv = sumVar;
          }
        }

        const info = {
          id: node.id,
          rawId: toRawProductId(node.id),
          title: node.title,
          totalInventory: totalInv,
          imageUrl: node.featuredImage?.url || null,
          variants: node.variants?.nodes || [],
        };

        inventoryMap[node.id] = info;
        inventoryMap[toRawProductId(node.id)] = info;
      }
    });

    return inventoryMap;
  } catch (err) {
    console.error("Error fetching product inventories:", err.message);
    return {};
  }
}

/**
 * Fetches product details by handles via Admin GraphQL.
 */
export async function fetchProductsByHandles(admin, handles = []) {
  if (!handles || handles.length === 0) return {};

  const uniqueHandles = Array.from(new Set(handles)).filter(Boolean);
  const productMap = {};

  await Promise.all(
    uniqueHandles.map(async (handle) => {
      try {
        const response = await admin.graphql(PRODUCT_BY_HANDLE_QUERY, {
          variables: { handle },
        });
        const result = await response.json();
        const prod = result?.data?.productByHandle;
        if (prod && prod.id) {
          productMap[handle] = {
            id: prod.id,
            rawId: toRawProductId(prod.id),
            title: prod.title,
            imageUrl: prod.featuredImage?.url || null,
            totalInventory: prod.totalInventory || 0,
          };
        }
      } catch (err) {
        console.warn(`Failed to resolve handle ${handle}:`, err.message);
      }
    })
  );

  return productMap;
}

/**
 * Fetches recently created products from Shopify Admin GraphQL API within launch window days.
 */
export async function fetchRecentlyCreatedProducts(admin, launchWindowDays = 14) {
  try {
    const dateQuery = `created_at:>=-${launchWindowDays}d`;
    const response = await admin.graphql(RECENT_PRODUCTS_QUERY, {
      variables: { query: dateQuery },
    });

    const result = await response.json();
    return result?.data?.products?.nodes || [];
  } catch (err) {
    console.error("Error fetching recently created products:", err.message);
    return [];
  }
}

/**
 * High-level runner: Compiles and executes the dataset needed for any of the 6 automation recipes.
 * Enriches query results with live product metadata, handle resolution, inventory, and sales data.
 *
 * @param {Object} admin - Authenticated Shopify Admin GraphQL client
 * @param {string} recipeSlug - Unique slug of the recipe
 * @param {Object} config - Merchant's customized threshold config
 * @returns {Promise<Object>} Formatted dataset ready for the Evaluation Engine
 */
export async function runRecipeDataset(admin, recipeSlug, config = {}) {
  const recipe = getRecipeBySlug(recipeSlug);
  if (!recipe) {
    throw new Error(`Unknown automation recipe: ${recipeSlug}`);
  }

  // 1. Compile the recipe's tailored ShopifyQL query
  const query = recipe.compileShopifyQL(config);

  // 2. Execute primary ShopifyQL query
  const queryResult = await executeShopifyQL(admin, query);

  // 3. Enrich specific recipes with supplementary Shopify metadata
  let enrichedRows = queryResult.rows;

  // Recipe 1: Rising demand & falling stock (Enrich with live inventory)
  if (recipeSlug === "rising-demand-falling-stock" && enrichedRows.length > 0) {
    const productIds = enrichedRows
      .map((r) => r.product_id)
      .filter(Boolean);

    const inventoryMap = await fetchProductInventories(admin, productIds);

    enrichedRows = enrichedRows.map((row) => {
      const inv = inventoryMap[row.product_id] || inventoryMap[toProductGid(row.product_id)] || { totalInventory: 0 };
      return {
        ...row,
        currentInventory: inv.totalInventory,
        productImageUrl: inv.imageUrl || null,
        netItemsSold: Number(row.net_items_sold || 0),
      };
    });
  }

  // Recipe 2: High traffic, low conversion (Resolve landing_page_path to products & join 7-day sales)
  if (recipeSlug === "high-traffic-low-conversion" && enrichedRows.length > 0) {
    // 1. Extract product handles from landing page paths
    const handleRowPairs = enrichedRows
      .map((row) => ({
        row,
        handle: extractProductHandle(row.landing_page_path),
      }))
      .filter((item) => Boolean(item.handle));

    const handles = handleRowPairs.map((item) => item.handle);
    const productMap = await fetchProductsByHandles(admin, handles);

    // 2. Fetch companion 7-day sales data to determine orders per product
    const salesQuery = `
      FROM sales
      SHOW orders, net_items_sold
      SINCE -7d
      GROUP BY product_id
    `.trim();

    const salesResult = await executeShopifyQL(admin, salesQuery);
    const salesMap = {};
    if (salesResult.success && Array.isArray(salesResult.rows)) {
      salesResult.rows.forEach((s) => {
        const rawId = toRawProductId(s.product_id);
        const gid = toProductGid(s.product_id);
        salesMap[rawId] = s;
        salesMap[gid] = s;
      });
    }

    // 3. Combine sessions and orders per resolved product
    const combinedRows = [];
    for (const { row, handle } of handleRowPairs) {
      const product = productMap[handle];
      if (!product) continue;

      const salesData = salesMap[product.rawId] || salesMap[product.id] || { orders: 0, net_items_sold: 0 };
      const sessions = Number(row.sessions || 0);
      const orders = Number(salesData.orders || 0);
      const conversionRate = sessions > 0 ? (orders / sessions) * 100 : 0;

      combinedRows.push({
        product_id: product.rawId,
        product_title: product.title,
        productHandle: handle,
        landing_page_path: row.landing_page_path,
        sessions,
        orders,
        conversionRate,
        productImageUrl: product.imageUrl || null,
      });
    }

    enrichedRows = combinedRows;
  }

  // Recipe 5: Abandoned momentum (Resolve landing_page_path to products & join recent sales)
  if (recipeSlug === "abandoned-momentum" && enrichedRows.length > 0) {
    const hours = Number(config.windowHours || 24);

    // 1. Extract product handles
    const handleRowPairs = enrichedRows
      .map((row) => ({
        row,
        handle: extractProductHandle(row.landing_page_path),
      }))
      .filter((item) => Boolean(item.handle));

    const handles = handleRowPairs.map((item) => item.handle);
    const productMap = await fetchProductsByHandles(admin, handles);

    // 2. Fetch companion sales for the lookback window
    const salesQuery = `
      FROM sales
      SHOW orders
      SINCE -${hours}h
      GROUP BY product_id
    `.trim();

    const salesResult = await executeShopifyQL(admin, salesQuery);
    const salesMap = {};
    if (salesResult.success && Array.isArray(salesResult.rows)) {
      salesResult.rows.forEach((s) => {
        const rawId = toRawProductId(s.product_id);
        const gid = toProductGid(s.product_id);
        salesMap[rawId] = s;
        salesMap[gid] = s;
      });
    }

    // 3. Combine traffic momentum with order data
    const combinedRows = [];
    for (const { row, handle } of handleRowPairs) {
      const product = productMap[handle];
      if (!product) continue;

      const salesData = salesMap[product.rawId] || salesMap[product.id] || { orders: 0 };
      const orders = Number(salesData.orders || 0);

      combinedRows.push({
        ...row,
        product_id: product.rawId,
        product_title: product.title,
        productHandle: handle,
        sessions: Number(row.sessions || 0),
        orders,
        productImageUrl: product.imageUrl || null,
      });
    }

    enrichedRows = combinedRows;
  }

  // Recipe 6: New product underperforming (Join newly created products, including zero sales)
  if (recipeSlug === "new-product-underperforming") {
    const launchDays = Number(config.launchWindowDays || 14);
    const recentProducts = await fetchRecentlyCreatedProducts(admin, launchDays);

    const salesByProductId = new Map();
    for (const row of enrichedRows) {
      const rawId = toRawProductId(row.product_id);
      const gid = toProductGid(row.product_id);
      salesByProductId.set(rawId, row);
      salesByProductId.set(gid, row);
    }

    const mergedList = [];
    const seenIds = new Set();

    for (const prod of recentProducts) {
      const rawId = toRawProductId(prod.id);
      const gid = toProductGid(prod.id);
      seenIds.add(rawId);
      seenIds.add(gid);

      const salesRow = salesByProductId.get(gid) || salesByProductId.get(rawId);

      mergedList.push({
        product_id: rawId,
        product_title: prod.title,
        net_items_sold: salesRow ? Number(salesRow.net_items_sold || 0) : 0,
        productImageUrl: prod.featuredImage?.url || null,
        createdAt: prod.createdAt,
      });
    }

    for (const row of enrichedRows) {
      const rawId = toRawProductId(row.product_id);
      const gid = toProductGid(row.product_id);
      if (!seenIds.has(rawId) && !seenIds.has(gid)) {
        mergedList.push({
          ...row,
          product_id: rawId,
          net_items_sold: Number(row.net_items_sold || 0),
        });
      }
    }

    enrichedRows = mergedList;
  }

  return {
    recipeSlug,
    recipeName: recipe.name,
    category: recipe.category,
    config,
    query,
    success: queryResult.success,
    error: queryResult.error || null,
    data: enrichedRows,
  };
}
