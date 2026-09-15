import React, { useState, useEffect } from "react";
import RecipeIcon from "../common/RecipeIcon";

export default function RecipeEditModal({
  recipe,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) {
  const [formData, setFormData] = useState({});
  const [channel, setChannel] = useState("EMAIL");
  const [errors, setErrors] = useState({});

  const allowedTypes = recipe?.allowedNotificationTypes || ["EMAIL", "SLACK", "IN_APP"];
  const availableChannels = (recipe?.availableChannels || []).filter((ch) => allowedTypes.includes(ch));
  const hasAvailableChannels = availableChannels.length > 0;

  useEffect(() => {
    if (recipe) {
      setFormData(recipe.config || {});
      const allowed = recipe.allowedNotificationTypes || ["EMAIL", "SLACK", "IN_APP"];
      const active = (recipe.availableChannels || []).filter((ch) => allowed.includes(ch));
      if (active.length > 0) {
        const initialChannel = active.includes(recipe.deliveryChannel)
          ? recipe.deliveryChannel
          : active[0];
        setChannel(initialChannel);
      } else {
        setChannel("");
      }
      setErrors({});
    }
  }, [recipe]);

  if (!isOpen || !recipe) return null;

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    recipe.fields.forEach((field) => {
      const val = formData[field.key];
      if (field.type === "number") {
        const num = Number(val);
        if (val === undefined || val === "" || Number.isNaN(num)) {
          newErrors[field.key] = "Please enter a valid number.";
        } else if (field.min !== undefined && num < field.min) {
          newErrors[field.key] = `Cannot be less than ${field.min}.`;
        } else if (field.max !== undefined && num > field.max) {
          newErrors[field.key] = `Cannot exceed ${field.max}.`;
        }
      }
    });

    if (!hasAvailableChannels) {
      newErrors.channel = "Please enable Email or Slack in your settings to activate this automation.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(recipe.slug, formData, channel);
  };

  const getChannelLabel = (ch) => {
    switch (ch) {
      case "EMAIL":
        return "Email";
      case "SLACK":
        return "Slack";
      case "IN_APP":
        return "In-app only";
      default:
        return ch;
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>
              <RecipeIcon slug={recipe.slug} size={22} color="#5C28D8" />
            </div>
            <div>
              <h2 style={styles.modalTitle}>Edit automation</h2>
              <div style={styles.recipeName}>{recipe.name}</div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Soft Purple Description Box */}
        <div style={styles.descBox}>
          {recipe.description}
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {recipe.fields.map((field) => {
            const hasError = Boolean(errors[field.key]);
            return (
              <div key={field.key} style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>{field.label}</label>

                {field.type === "number" ? (
                  <div style={styles.inputWithSuffix}>
                    <input
                      type="number"
                      step={field.step || "1"}
                      min={field.min}
                      max={field.max}
                      value={formData[field.key] ?? field.defaultValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      style={{
                        ...styles.inputNumber,
                        ...(hasError ? styles.inputError : {}),
                      }}
                    />
                    {field.suffix && (
                      <span style={styles.suffixText}>{field.suffix}</span>
                    )}
                  </div>
                ) : field.type === "select" ? (
                  <select
                    value={formData[field.key] ?? field.defaultValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    style={{
                      ...styles.selectInput,
                      ...(hasError ? styles.inputError : {}),
                    }}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData[field.key] ?? field.defaultValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    style={styles.inputText}
                  />
                )}

                {hasError && <div style={styles.errorText}>{errors[field.key]}</div>}
                {field.helperText && (
                  <div style={styles.helperText}>{field.helperText}</div>
                )}
              </div>
            );
          })}

          {/* Delivery Channel Selector */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Send alert to</label>
            <div style={styles.selectWrapper}>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={{
                  ...styles.selectInput,
                  ...(!hasAvailableChannels ? styles.selectDisabled : {}),
                }}
                disabled={!hasAvailableChannels}
              >
                {!hasAvailableChannels ? (
                  <option value="">No delivery channel enabled</option>
                ) : (
                  availableChannels.map((ch) => (
                    <option key={ch} value={ch}>
                      {getChannelLabel(ch)}
                    </option>
                  ))
                )}
              </select>
              <div style={styles.selectArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {!hasAvailableChannels ? (
              <div style={styles.warningNote}>
                {recipe.slug === "weekly-performance-digest"
                  ? "⚠️ This automation requires Email or Slack, but neither is enabled in your notification settings."
                  : "⚠️ No delivery channels are available for this automation in your notification settings."}
              </div>
            ) : (
              <div style={styles.helperText}>
                {recipe.slug === "weekly-performance-digest"
                  ? "Weekly digests are sent directly to your Email or Slack."
                  : "Choose where you want to receive alerts."}
              </div>
            )}
            {errors.channel && <div style={styles.errorText}>{errors.channel}</div>}
          </div>

          {/* Footer Actions */}
          <div style={styles.footer}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.saveBtn}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "16px",
    boxSizing: "border-box",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "540px",
    padding: "24px 28px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    maxHeight: "94vh",
    overflowY: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    backgroundColor: "#F3EEFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 2px 0",
    letterSpacing: "-0.01em",
  },
  recipeName: {
    fontSize: "13px",
    color: "#6B7280",
    fontWeight: "500",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
  },
  descBox: {
    backgroundColor: "#F4EFFE",
    color: "#374151",
    fontSize: "13.5px",
    lineHeight: "1.4",
    padding: "11px 15px",
    borderRadius: "10px",
    marginBottom: "15px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
  },
  fieldLabel: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: "6px",
  },
  inputWithSuffix: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  inputNumber: {
    width: "110px",
    height: "38px",
    borderRadius: "8px",
    border: "1.5px solid #D1D5DB",
    padding: "0 14px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    boxSizing: "border-box",
    outline: "none",
  },
  inputText: {
    height: "38px",
    borderRadius: "8px",
    border: "1.5px solid #D1D5DB",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111827",
    boxSizing: "border-box",
    outline: "none",
  },
  selectWrapper: {
    position: "relative",
    width: "100%",
  },
  selectInput: {
    width: "100%",
    height: "38px",
    borderRadius: "8px",
    border: "1.5px solid #D1D5DB",
    padding: "0 34px 0 14px",
    fontSize: "14px",
    color: "#111827",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    outline: "none",
    appearance: "none",
    cursor: "pointer",
  },
  selectArrow: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  },
  selectDisabled: {
    backgroundColor: "#F9FAFB",
    color: "#9CA3AF",
    borderColor: "#E5E7EB",
    cursor: "not-allowed",
  },
  warningNote: {
    fontSize: "12px",
    color: "#92400E",
    backgroundColor: "#FEF3C7",
    border: "1px solid #FDE68A",
    borderRadius: "8px",
    padding: "8px 12px",
    marginTop: "6px",
    lineHeight: "1.45",
  },
  inputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  suffixText: {
    fontSize: "13.5px",
    color: "#6B7280",
    fontWeight: "500",
  },
  helperText: {
    fontSize: "12px",
    color: "#6B7280",
    marginTop: "4px",
  },
  errorText: {
    fontSize: "12px",
    color: "#DC2626",
    fontWeight: "500",
    marginTop: "3px",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "6px",
    paddingTop: "14px",
    borderTop: "1px solid #F3F4F6",
  },
  cancelBtn: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #E5E7EB",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#374151",
    cursor: "pointer",
  },
  saveBtn: {
    backgroundColor: "#5C28D8",
    border: "none",
    borderRadius: "8px",
    padding: "9px 20px",
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#FFFFFF",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(92, 40, 216, 0.3)",
  },
};
