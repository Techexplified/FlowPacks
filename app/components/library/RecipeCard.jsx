import React from "react";
import { useFetcher } from "react-router";
import RecipeIcon from "../common/RecipeIcon";
import { libraryStyles } from "../../styles/library.styles";

/**
 * Subcomponent for an individual Automation Recipe Card.
 * Uses an isolated useFetcher() instance per card so optimistic updates and submissions never collide.
 */
export default function RecipeCard({ recipe, onEdit }) {
  const fetcher = useFetcher();

  const isPending =
    fetcher.formData &&
    fetcher.formData.get("actionType") === "TOGGLE_RECIPE" &&
    fetcher.formData.get("recipeSlug") === recipe.slug;

  const active = isPending
    ? fetcher.formData.get("isActive") === "true"
    : Boolean(recipe.isActive);

  const handleToggle = () => {
    const nextState = !active;
    fetcher.submit(
      {
        actionType: "TOGGLE_RECIPE",
        recipeSlug: recipe.slug,
        isActive: String(nextState),
      },
      { method: "post" }
    );
  };

  return (
    <div style={libraryStyles.card}>
      <div style={libraryStyles.cardLeft}>
        <div style={libraryStyles.iconBox}>
          <RecipeIcon slug={recipe.slug} size={22} color="#5C28D8" />
        </div>
        <div>
          <h3 style={libraryStyles.cardTitle}>{recipe.name}</h3>
          <p style={libraryStyles.cardDesc}>{recipe.description}</p>
        </div>
      </div>

      <div style={libraryStyles.cardRight}>
        {/* Edit Button */}
        <button
          type="button"
          style={libraryStyles.editBtn}
          onClick={() => onEdit(recipe)}
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
          onClick={handleToggle}
          style={{
            ...libraryStyles.toggleTrack,
            backgroundColor: active ? "#5C28D8" : "#E5E7EB",
          }}
        >
          <div
            style={{
              ...libraryStyles.toggleThumb,
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
}
