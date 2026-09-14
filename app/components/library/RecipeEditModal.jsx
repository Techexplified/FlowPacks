import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    if (recipe) {
      setFormData(recipe.config || {});
      setChannel(recipe.deliveryChannel || "EMAIL");
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(recipe.slug, formData, channel);
  };

  const channelOptions = recipe.availableChannels && recipe.availableChannels.length > 0
    ? recipe.availableChannels
    : ["EMAIL", "SLACK", "IN_APP"];

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
                style={styles.selectInput}
              >
                {channelOptions.map((ch) => (
                  <option key={ch} value={ch}>
                    {getChannelLabel(ch)}
                  </option>
                ))}
              </select>
              <div style={styles.selectArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            <div style={styles.helperText}>Choose where you want to receive alerts.</div>
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
    padding: "20px",
    boxSizing: "border-box",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "540px",
    padding: "28px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "18px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
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
    lineHeight: "1.45",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "22px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
  },
  fieldLabel: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: "8px",
  },
  inputWithSuffix: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  inputNumber: {
    width: "110px",
    height: "40px",
    borderRadius: "8px",
    border: "1.5px solid #D1D5DB",
    padding: "0 14px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#111827",
    boxSizing: "border-box",
    outline: "none",
  },
  inputText: {
    height: "40px",
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
    height: "40px",
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
    marginTop: "6px",
  },
  errorText: {
    fontSize: "12px",
    color: "#DC2626",
    fontWeight: "500",
    marginTop: "4px",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "12px",
    paddingTop: "16px",
    borderTop: "1px solid #F3F4F6",
  },
  cancelBtn: {
    backgroundColor: "#FFFFFF",
    border: "1.5px solid #E5E7EB",
    borderRadius: "8px",
    padding: "9px 20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    cursor: "pointer",
  },
  saveBtn: {
    backgroundColor: "#5C28D8",
    border: "none",
    borderRadius: "8px",
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#FFFFFF",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(92, 40, 216, 0.3)",
  },
};
