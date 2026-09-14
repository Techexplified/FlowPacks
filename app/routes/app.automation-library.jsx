import React, { useState, useMemo } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getMerchantWorkflows,
  toggleWorkflowActive,
  updateWorkflowConfig,
} from "../services/merchant.server";
import RecipeEditModal from "../components/library/RecipeEditModal";

/**
 * Server Loader: Authenticates session and fetches catalog merged with merchant state.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const data = await getMerchantWorkflows(session.shop);
  return {
    shop: session.shop,
    merchantSettings: data.merchant,
    recipes: data.recipes,
  };
};

/**
 * Server Action: Handles 1-click toggles, config edits, and suggestions.
 */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  try {
    if (actionType === "TOGGLE_RECIPE") {
      const recipeSlug = formData.get("recipeSlug");
      const isActive = formData.get("isActive") === "true";
      const updated = await toggleWorkflowActive(session.shop, recipeSlug, isActive);
      return { success: true, updated };
    }

    if (actionType === "UPDATE_CONFIG") {
      const recipeSlug = formData.get("recipeSlug");
      const deliveryChannel = formData.get("deliveryChannel");
      const configJson = formData.get("config");
      const parsedConfig = JSON.parse(configJson || "{}");

      const updated = await updateWorkflowConfig(
        session.shop,
        recipeSlug,
        parsedConfig,
        deliveryChannel
      );
      return { success: true, updated };
    }

    return { success: false, error: "Unknown action type" };
  } catch (err) {
    console.error("Action error:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Icons mapped to each automation recipe slug.
 */
function RecipeIcon({ slug, size = 22, color = "#5C28D8" }) {
  switch (slug) {
    case "rising-demand-falling-stock":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "high-traffic-low-conversion":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case "weekly-performance-digest":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case "slowing-down-bestseller":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "abandoned-momentum":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "new-product-underperforming":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function AutomationLibraryPage() {
  const { recipes = [] } = useLoaderData();
  const toggleFetcher = useFetcher();
  const editFetcher = useFetcher();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const categories = ["All", "Sales & Revenue", "Inventory", "Products", "Reporting"];

  // Filtered recipe list based on category and live search query
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesCategory =
        selectedCategory === "All" || recipe.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q) ||
        recipe.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [recipes, selectedCategory, searchQuery]);

  // Handle 1-click toggle with optimistic state
  const handleToggle = (recipeSlug, currentIsActive) => {
    const nextState = !currentIsActive;
    toggleFetcher.submit(
      {
        actionType: "TOGGLE_RECIPE",
        recipeSlug,
        isActive: String(nextState),
      },
      { method: "post" }
    );
  };

  // Determine current active status considering pending fetcher submission
  const getIsActive = (recipe) => {
    if (
      toggleFetcher.formData &&
      toggleFetcher.formData.get("recipeSlug") === recipe.slug
    ) {
      return toggleFetcher.formData.get("isActive") === "true";
    }
    return recipe.isActive;
  };

  // Handle saving recipe thresholds
  const handleSaveConfig = (recipeSlug, config, deliveryChannel) => {
    editFetcher.submit(
      {
        actionType: "UPDATE_CONFIG",
        recipeSlug,
        config: JSON.stringify(config),
        deliveryChannel,
      },
      { method: "post" }
    );
    setEditingRecipe(null);
    setToastMessage("Automation thresholds saved successfully!");
    setTimeout(() => setToastMessage(""), 3500);
  };

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={styles.toast}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner matching exact screenshot cross-section */}
      <div style={styles.banner}>
        {/* Exact multi-layered organic fluid cross-section matching design */}
        <div style={styles.bannerCurves}>
          <svg style={styles.bannerSvg} viewBox="0 0 1000 100" preserveAspectRatio="none">
            {/* Layer 1: Ambient soft secondary wave flowing from mid-bottom */}
            <path
              d="M 500 100 C 540 80, 580 45, 620 15 C 640 3, 670 0, 700 0 L 1000 0 L 1000 100 Z"
              fill="rgba(42, 14, 98, 0.32)"
            />

            {/* Layer 2: Main organic curved lobe wrapping right behind tagline */}
            <path
              d="M 605 0 C 575 20, 555 45, 560 64 C 568 82, 630 96, 730 100 L 1000 100 L 1000 0 Z"
              fill="#331075"
              opacity="0.75"
            />

            {/* Layer 3: Subtle ambient depth wave towards bottom right */}
            <path
              d="M 730 100 C 810 95, 890 92, 950 95 C 980 97, 995 98, 1000 100 L 1000 100 Z"
              fill="rgba(25, 5, 65, 0.2)"
            />
          </svg>
        </div>

        <div style={styles.brandGroup}>
          <div style={styles.logoWrapper}>
            <img src="/Flowpacks-logo.png" alt="FlowPacks" style={styles.logoImg} />
          </div>
          <div>
            <h1 style={styles.brandTitle}>Automation Library</h1>
            <p style={styles.brandSubtitle}>Ready-to-run automations for your store.</p>
          </div>
        </div>

        <div style={styles.bannerRightGroup}>
          <div style={styles.tagline}>
            <span>Automate</span>
            <span style={styles.taglinePlus}>+</span>
            <span>Grow</span>
            <span style={styles.taglinePlus}>+</span>
            <span>Stay in control</span>
          </div>

          <button
            style={styles.activityLogBtn}
            onClick={() => {
              setToastMessage("Activity Log page coming soon");
              setTimeout(() => setToastMessage(""), 3000);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Activity log</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={styles.filterBar}>
        <div style={styles.pillsList}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.pillBtn,
                  ...(isSelected ? styles.pillActive : styles.pillInactive),
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div style={styles.searchWrapper}>
          <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Recipe Cards List */}
      <div style={styles.cardsList}>
        {filteredRecipes.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No automations found matching &ldquo;{searchQuery}&rdquo; in {selectedCategory}.</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const active = getIsActive(recipe);
            return (
              <div key={recipe.slug} style={styles.card}>
                <div style={styles.cardLeft}>
                  <div style={styles.iconBox}>
                    <RecipeIcon slug={recipe.slug} size={22} color="#5C28D8" />
                  </div>
                  <div>
                    <h3 style={styles.cardTitle}>{recipe.name}</h3>
                    <p style={styles.cardDesc}>{recipe.description}</p>
                  </div>
                </div>

                <div style={styles.cardRight}>
                  {/* Edit Button */}
                  <button
                    type="button"
                    style={styles.editBtn}
                    onClick={() => setEditingRecipe(recipe)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit</span>
                  </button>

                  {/* 1-Click Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => handleToggle(recipe.slug, active)}
                    style={{
                      ...styles.toggleTrack,
                      backgroundColor: active ? "#5C28D8" : "#E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        ...styles.toggleThumb,
                        transform: active ? "translateX(24px)" : "translateX(3px)",
                      }}
                    >
                      {active && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5C28D8" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Suggestion Banner */}
      <div style={styles.bottomBanner}>
        <div style={styles.bottomLeft}>
          <div style={styles.sparkleBox}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5C28D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h4 style={styles.bottomTitle}>Have an idea in mind?</h4>
            <p style={styles.bottomSubtitle}>Tell us what you want to automate and we&apos;ll help you set it up.</p>
          </div>
        </div>

        <button
          type="button"
          style={styles.suggestBtn}
          onClick={() => {
            setToastMessage("Suggest an automation page coming soon");
            setTimeout(() => setToastMessage(""), 3000);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
          <span>Suggest an automation</span>
        </button>
      </div>

      {/* Edit Automation Modal */}
      <RecipeEditModal
        recipe={editingRecipe}
        isOpen={Boolean(editingRecipe)}
        onClose={() => setEditingRecipe(null)}
        onSave={handleSaveConfig}
        isSaving={editFetcher.state === "submitting"}
      />
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

const styles = {
  container: {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "24px 20px 48px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
  },
  toast: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    backgroundColor: "#111827",
    color: "#FFFFFF",
    padding: "12px 20px",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: 10000,
    animation: "fadeIn 0.2s ease-out",
  },
  banner: {
    position: "relative",
    background: "linear-gradient(90deg, #5925D8 0%, #632DE0 55%, #5924CE 100%)",
    borderRadius: "14px",
    minHeight: "72px",
    padding: "16px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#FFFFFF",
    boxShadow: "0 8px 24px rgba(88, 36, 206, 0.22)",
    overflow: "hidden",
    marginBottom: "20px",
    boxSizing: "border-box",
  },
  bannerCurves: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  bannerSvg: {
    width: "100%",
    height: "100%",
  },
  brandGroup: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logoWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    flexShrink: 0,
  },
  logoImg: {
    width: "28px",
    height: "28px",
    objectFit: "contain",
  },
  brandTitle: {
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "-0.01em",
    color: "#FFFFFF",
    margin: 0,
  },
  brandSubtitle: {
    fontSize: "13px",
    color: "rgba(255, 255, 255, 0.85)",
    margin: "2px 0 0 0",
  },
  bannerRightGroup: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  tagline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: "0.01em",
  },
  taglinePlus: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "400",
    fontSize: "13px",
  },
  activityLogBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "8px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#FFFFFF",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    backdropFilter: "blur(4px)",
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
    gap: "16px",
    flexWrap: "wrap",
  },
  pillsList: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  pillBtn: {
    border: "none",
    borderRadius: "20px",
    padding: "8px 18px",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  pillActive: {
    backgroundColor: "#5C28D8",
    color: "#FFFFFF",
    boxShadow: "0 2px 6px rgba(92, 40, 216, 0.25)",
  },
  pillInactive: {
    backgroundColor: "#F3EEFB",
    color: "#4B5563",
  },
  searchWrapper: {
    position: "relative",
    width: "240px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    height: "38px",
    borderRadius: "20px",
    border: "1.5px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: "0 14px 0 36px",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
  },
  cardsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "14px",
    padding: "18px 22px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 14px rgba(0,0,0,0.02)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    border: "1px solid #F3F4F6",
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  iconBox: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#F3EEFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 3px 0",
    letterSpacing: "-0.01em",
  },
  cardDesc: {
    fontSize: "13px",
    color: "#6B7280",
    margin: 0,
  },
  cardRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexShrink: 0,
  },
  editBtn: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #E5E7EB",
    borderRadius: "8px",
    padding: "7px 16px",
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#374151",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  toggleTrack: {
    width: "52px",
    height: "28px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    position: "relative",
    padding: 0,
    transition: "background-color 0.2s ease",
    display: "flex",
    alignItems: "center",
  },
  toggleThumb: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
    transition: "transform 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBanner: {
    backgroundColor: "#F4EFFE",
    borderRadius: "14px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    border: "1px solid #EDE5FC",
  },
  bottomLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  sparkleBox: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    backgroundColor: "#E9DDFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bottomTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 2px 0",
  },
  bottomSubtitle: {
    fontSize: "13px",
    color: "#4B5563",
    margin: 0,
  },
  suggestBtn: {
    backgroundColor: "#5C28D8",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#FFFFFF",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 8px rgba(92, 40, 216, 0.25)",
    flexShrink: 0,
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: "14px",
    padding: "48px 24px",
    textAlign: "center",
    color: "#6B7280",
    fontSize: "14px",
    border: "1px dashed #D1D5DB",
  },
};
