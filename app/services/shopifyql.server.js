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
      parseErrors {
        code
        message
      }
    }
  }
`;

/**
 * GraphQL document to fetch product inventory quantities for inventory-related recipes.
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
        variants(first: 10) {
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
      const parseErrors = payload.parseErrors.map((e) => e.message).join("; ");
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
 */
export async function fetchProductInventories(admin, productIds = []) {
  if (!productIds || productIds.length === 0) return {};

  try {
    const formattedIds = productIds.map((id) =>
      String(id).startsWith("gid://shopify/Product/") ? id : `gid://shopify/Product/${id}`
    );

    const response = await admin.graphql(PRODUCT_INVENTORY_QUERY, {
      variables: { ids: formattedIds },
    });

    const result = await response.json();
    const nodes = result?.data?.nodes || [];

    const inventoryMap = {};
    nodes.forEach((node) => {
      if (node && node.id) {
        inventoryMap[node.id] = {
          title: node.title,
          totalInventory: Number(node.totalInventory || 0),
          imageUrl: node.featuredImage?.url || null,
          variants: node.variants?.nodes || [],
        };
      }
    });

    return inventoryMap;
  } catch (err) {
    console.error("Error fetching product inventories:", err.message);
    return {};
  }
}

/**
 * High-level runner: Compiles and executes the dataset needed for any of the 6 automation recipes.
 * Enriches query results with live product metadata / inventory when needed.
 *
 * @param {Object} admin - Authenticated Shopify Admin GraphQL client
 * @param {string} recipeSlug - Unique slug of the recipe
 * @param {Object} config - Merchant's customized threshold config
 * @returns {Promise<Object>} Formatted dataset ready for the Evaluation Engine (Step 2)
 */
export async function runRecipeDataset(admin, recipeSlug, config = {}) {
  const recipe = getRecipeBySlug(recipeSlug);
  if (!recipe) {
    throw new Error(`Unknown automation recipe: ${recipeSlug}`);
  }

  // 1. Compile the recipe's tailored ShopifyQL query
  const query = recipe.compileShopifyQL(config);

  // 2. Execute via Shopify GraphQL Admin API
  const queryResult = await executeShopifyQL(admin, query);

  // 3. Enrich specific recipes with supplementary Shopify metadata
  let enrichedRows = queryResult.rows;

  if (recipeSlug === "rising-demand-falling-stock" && enrichedRows.length > 0) {
    const productIds = enrichedRows
      .map((r) => r.product_id)
      .filter(Boolean);

    const inventoryMap = await fetchProductInventories(admin, productIds);

    enrichedRows = enrichedRows.map((row) => {
      const gid = String(row.product_id).startsWith("gid://shopify/Product/")
        ? row.product_id
        : `gid://shopify/Product/${row.product_id}`;

      const inv = inventoryMap[gid] || { totalInventory: 0 };
      return {
        ...row,
        currentInventory: inv.totalInventory,
        productImageUrl: inv.imageUrl,
        netItemsSold: Number(row.net_items_sold || 0),
      };
    });
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
