import React from "react";
import { libraryStyles } from "../../styles/library.styles";

export default function LibraryFilterBar({
  categories = [],
  selectedCategory = "All",
  onSelectCategory,
  searchQuery = "",
  onSearchChange,
}) {
  return (
    <div style={libraryStyles.filterBar}>
      <div style={libraryStyles.pillsList}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              style={{
                ...libraryStyles.pillBtn,
                ...(isSelected ? libraryStyles.pillActive : libraryStyles.pillInactive),
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div style={libraryStyles.searchWrapper}>
        <svg
          style={libraryStyles.searchIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search automations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={libraryStyles.searchInput}
        />
      </div>
    </div>
  );
}
