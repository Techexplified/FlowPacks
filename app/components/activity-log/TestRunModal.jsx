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
        {/* Modal Header */}
        <div style={activityLogStyles.modalHeader}>
          <div style={activityLogStyles.modalTitleGroup}>
            <div style={{ ...activityLogStyles.iconBox, width: "32px", height: "32px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C28D8" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div>
              <h3 style={activityLogStyles.modalTitle}>On-Demand Store Audit</h3>
            </div>
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
            
            {/* Reassuring Background Automation Explainer Banner */}
            <div style={activityLogStyles.reassuranceBanner}>
              <div style={{ flexShrink: 0, marginTop: "1px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p style={activityLogStyles.reassuranceText}>
                <strong>Automated Monitoring Active:</strong> FlowPacks evaluates active automations in the background on schedule. You can trigger an on-demand audit here anytime to inspect live metrics.
              </p>
            </div>

            {/* Select Recipe Dropdown */}
            <div style={activityLogStyles.formGroup}>
              <label style={activityLogStyles.formLabel}>
                Select Automation to Audit
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

            {/* Recipe Info & Status Card */}
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
                      This automation is disabled in your Library. Enable it in the Automation Library to run evaluations.
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

            {/* Execution Result Box */}
            {displayedResult && (
              <>
                {displayedResult.shouldAlert ? (
                  <div style={activityLogStyles.resultBoxAlert}>
                    <div style={activityLogStyles.resultTitle}>
                      <span style={{ color: "#6D28D9", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>⚡</span>
                        <span>Alert Triggered & Dispatched</span>
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: "#EDE9FE",
                          color: "#5B21B6",
                          padding: "2px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        ● Recorded to Activity Log
                      </span>
                    </div>
                    <p style={activityLogStyles.resultDesc}>
                      {displayedResult.evaluationResult?.summary ||
                        "Store metrics triggered the configured threshold rule."}
                    </p>
                    {displayedResult.evaluationResult?.flaggedItems?.length > 0 && (
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "11.5px",
                          color: "#5B21B6",
                          fontWeight: "600",
                        }}
                      >
                        📊 {displayedResult.evaluationResult.flaggedItems.length} item(s) flagged • Live notification dispatched.
                      </div>
                    )}
                  </div>
                ) : displayedResult.skipped ? (
                  <div style={activityLogStyles.resultBoxWarning}>
                    <div style={activityLogStyles.resultTitle}>
                      <span style={{ color: "#B45309", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>⚠️</span>
                        <span>Audit Skipped</span>
                      </span>
                    </div>
                    <p style={{ ...activityLogStyles.resultDesc, color: "#92400E" }}>
                      {displayedResult.reason || "Automation could not be evaluated."}
                    </p>
                  </div>
                ) : (
                  <div style={activityLogStyles.resultBoxHealthy}>
                    <div style={activityLogStyles.resultTitle}>
                      <span style={{ color: "#047857", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>✓</span>
                        <span>No Alert Triggered</span>
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: "#D1FAE5",
                          color: "#065F46",
                          padding: "2px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        ● Evaluated
                      </span>
                    </div>
                    <p style={{ ...activityLogStyles.resultDesc, color: "#065F46" }}>
                      {displayedResult.evaluationResult?.summary ||
                        displayedResult.reason ||
                        "Store data evaluated successfully. No threshold conditions were met."}
                    </p>
                  </div>
                )}
              </>
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
                  ? "Enable this automation in the Library to run an audit"
                  : !hasValidChannels
                  ? "Enable Email or Slack in settings to run this automation"
                  : "Run on-demand audit now"
              }
            >
              {isRunning ? (
                <span>Evaluating Store Data...</span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Run Audit Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
