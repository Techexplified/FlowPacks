import { useState, useEffect } from "react";
import RecipeIcon from "../common/RecipeIcon";
import { activityLogStyles } from "../../styles/activity-log.styles";

export default function TestRunModal({
  isOpen,
  catalog = [],
  onClose,
  onSubmitRun,
  isRunning = false,
  lastResult = null,
}) {
  const [selectedRecipeSlug, setSelectedRecipeSlug] = useState(
    catalog[0]?.slug || "rising-demand-falling-stock"
  );
  const [displayedResult, setDisplayedResult] = useState(null);

  // Sync result only when it belongs to the currently selected recipe
  useEffect(() => {
    if (lastResult && lastResult.recipeSlug === selectedRecipeSlug) {
      setDisplayedResult(lastResult);
    } else {
      setDisplayedResult(null);
    }
  }, [lastResult, selectedRecipeSlug]);

  // Reset displayed result when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setDisplayedResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRecipe =
    catalog.find((r) => r.slug === selectedRecipeSlug) || catalog[0];
  const isCurrentActive = Boolean(currentRecipe?.isActive);
  const availableChannels = currentRecipe?.availableChannels || [];
  const hasValidChannels = availableChannels.length > 0;

  const handleSelectChange = (e) => {
    const newSlug = e.target.value;
    setSelectedRecipeSlug(newSlug);
    setDisplayedResult(null); // Clear previous recipe result immediately
  };

  const handleCloseModal = () => {
    setDisplayedResult(null);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isCurrentActive || !hasValidChannels) return;
    setDisplayedResult(null);
    onSubmitRun(selectedRecipeSlug);
  };

  return (
    <div style={activityLogStyles.modalOverlay} onClick={handleCloseModal}>
      <div
        style={activityLogStyles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={activityLogStyles.modalHeader}>
          <div style={activityLogStyles.modalTitleGroup}>
            <div style={{ ...activityLogStyles.iconBox, width: "32px", height: "32px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C28D8" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <h3 style={activityLogStyles.modalTitle}>Manual Automation Runner</h3>
          </div>
          <button
            type="button"
            style={activityLogStyles.modalCloseBtn}
            onClick={handleCloseModal}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={activityLogStyles.modalBody}>
            <div style={activityLogStyles.formGroup}>
              <label style={activityLogStyles.formLabel}>
                Select Automation to Test
              </label>
              <select
                value={selectedRecipeSlug}
                onChange={handleSelectChange}
                style={activityLogStyles.modalSelect}
                disabled={isRunning}
              >
                {catalog.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} ({r.isActive ? "Active" : "Disabled"})
                  </option>
                ))}
              </select>
            </div>

            {currentRecipe && (
              <div style={activityLogStyles.recipeInfoCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <RecipeIcon slug={currentRecipe.slug} size={18} color="#5C28D8" />
                    <h4 style={activityLogStyles.recipeInfoTitle}>
                      {currentRecipe.name}
                    </h4>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      backgroundColor: isCurrentActive ? "#ECFDF5" : "#F3F4F6",
                      color: isCurrentActive ? "#059669" : "#6B7280",
                    }}
                  >
                    {isCurrentActive ? "● Active in Library" : "○ Disabled in Library"}
                  </span>
                </div>
                <p style={activityLogStyles.recipeInfoDesc}>
                  {currentRecipe.description}
                </p>

                {!isCurrentActive && (
                  <div
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #FEE2E2",
                      borderRadius: "6px",
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>🔒</span>
                    <span style={{ fontSize: "12px", color: "#991B1B", fontWeight: "500" }}>
                      This automation is disabled in your Library. Enable it in the Automation Library to run test evaluations.
                    </span>
                  </div>
                )}

                {isCurrentActive && !hasValidChannels && (
                  <div
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#FEF3C7",
                      border: "1px solid #FDE68A",
                      borderRadius: "6px",
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>⚠️</span>
                    <span style={{ fontSize: "12px", color: "#92400E", fontWeight: "500" }}>
                      {currentRecipe.slug === "weekly-performance-digest"
                        ? "This automation requires Email or Slack. Since neither is enabled in your settings, notifications will not fire."
                        : "No valid delivery channels are enabled in your settings. Notifications will not fire."}
                    </span>
                  </div>
                )}
              </div>
            )}

            {displayedResult && (
              <div style={activityLogStyles.resultBox}>
                <h4 style={activityLogStyles.resultTitle}>
                  {displayedResult.shouldAlert
                    ? "⚡ Alert Triggered!"
                    : "✓ Evaluated (No Alert Triggered)"}
                </h4>
                <p style={activityLogStyles.resultDesc}>
                  {displayedResult.evaluationResult?.summary ||
                    displayedResult.reason ||
                    "Automation ran successfully against store data."}
                </p>
              </div>
            )}
          </div>

          <div style={activityLogStyles.modalFooter}>
            <button
              type="button"
              style={activityLogStyles.cancelBtn}
              onClick={handleCloseModal}
              disabled={isRunning}
            >
              Close
            </button>
            <button
              type="submit"
              style={{
                ...activityLogStyles.runSubmitBtn,
                ...(!isCurrentActive || !hasValidChannels
                  ? {
                      opacity: 0.5,
                      cursor: "not-allowed",
                      backgroundColor: "#9CA3AF",
                      boxShadow: "none",
                    }
                  : {}),
              }}
              disabled={isRunning || !isCurrentActive || !hasValidChannels}
              title={
                !isCurrentActive
                  ? "Enable this automation in the Library to test it"
                  : !hasValidChannels
                  ? "Enable Email or Slack in settings to run this automation"
                  : "Execute test run"
              }
            >
              {isRunning ? (
                <span>Running Query...</span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Execute Test Run</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
