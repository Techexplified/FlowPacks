import { useState, useMemo } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getMerchantWorkflows,
  toggleWorkflowActive,
  updateWorkflowConfig,
} from "../services/merchant.server";
import LibraryHeaderBanner from "../components/library/LibraryHeaderBanner";
import LibraryFilterBar from "../components/library/LibraryFilterBar";
import RecipeCard from "../components/library/RecipeCard";
import SuggestBanner from "../components/library/SuggestBanner";
import RecipeEditModal from "../components/library/RecipeEditModal";
import { useEmbedNavigate } from "../hooks/use-embed-navigate";
import { libraryStyles } from "../styles/library.styles";

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

export default function AutomationLibraryPage() {
  const { recipes = [] } = useLoaderData();
  const editFetcher = useFetcher();
  const embedNavigate = useEmbedNavigate();

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
    <div style={libraryStyles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={libraryStyles.toast}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <LibraryHeaderBanner />

      {/* Filter & Search Bar */}
      <LibraryFilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Recipe Cards List */}
      <div style={libraryStyles.cardsList}>
        {filteredRecipes.length === 0 ? (
          <div style={libraryStyles.emptyState}>
            <p>No automations found matching &ldquo;{searchQuery}&rdquo; in {selectedCategory}.</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.slug}
              recipe={recipe}
              onEdit={setEditingRecipe}
            />
          ))
        )}
      </div>

      {/* Bottom Suggestion Banner */}
      <SuggestBanner
        onSuggestClick={() => embedNavigate("/app/suggest-automation")}
      />

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
