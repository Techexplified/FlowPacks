import { useEffect } from "react";
import { ExternalLink, CheckCircle } from "lucide-react";

/**
 * Step-by-step modal guide for creating and connecting a Slack Incoming Webhook.
 */
export default function SlackGuideModal({ isOpen = false, onClose }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      number: "1",
      title: "Open the Slack Apps Dashboard",
      description:
        'Go to api.slack.com/apps in a new tab, click "Create New App", and select "From Scratch". Name it FlowPacks Alerts and pick your target workspace.',
      actionUrl: "https://api.slack.com/apps",
      actionLabel: "Open Slack Apps Dashboard",
    },
    {
      number: "2",
      title: "Turn on Incoming Webhooks",
      description:
        'In the left sidebar under the "Features" section, click "Incoming Webhooks". Toggle the switch for "Activate Incoming Webhooks" to ON.',
    },
    {
      number: "3",
      title: "Pick Your Channel & Copy the URL",
      description:
        'Scroll down and click "Add New Webhook to Workspace". Choose the channel (e.g. #flowpacks-alerts or #general) where FlowPacks should post, click "Allow", and copy the generated Webhook URL.',
    },
    {
      number: "4",
      title: "Paste & Connect in FlowPacks",
      description:
        'Return to FlowPacks and paste your copied URL into the Webhook URL field. Enter your Workspace Name and Channel Name, then click "Connect Slack".',
    },
  ];

  return (
    <div
      style={modalStyles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div style={modalStyles.container}>
        {/* Modal Header */}
        <div style={modalStyles.header}>
          <div style={modalStyles.headerLeft}>
            <div style={modalStyles.iconBox}>
              <img
                src="/Slack_Symbol_0.svg"
                alt="Slack"
                style={{ width: "42px", height: "42px", objectFit: "contain" }}
              />
            </div>
            <div>
              <h3 style={modalStyles.title}>How to connect Slack Webhook</h3>
              <p style={modalStyles.subtitle}>
                Follow these 4 quick steps to create your incoming webhook.
              </p>
            </div>
          </div>
          <button
            type="button"
            style={modalStyles.closeBtn}
            onClick={onClose}
            title="Close guide"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Steps List */}
        <div style={modalStyles.body}>
          <div style={modalStyles.stepsList}>
            {steps.map((step) => (
              <div key={step.number} style={modalStyles.stepRow}>
                <div style={modalStyles.stepBadge}>{step.number}</div>
                <div style={modalStyles.stepContent}>
                  <h4 style={modalStyles.stepTitle}>{step.title}</h4>
                  <p style={modalStyles.stepDesc}>{step.description}</p>
                  {step.actionUrl && (
                    <a
                      href={step.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={modalStyles.externalLinkBtn}
                    >
                      <span>{step.actionLabel}</span>
                      <ExternalLink size={13} strokeWidth={2.2} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={modalStyles.footer}>
          <button
            type="button"
            style={modalStyles.doneBtn}
            onClick={onClose}
          >
            <CheckCircle size={15} strokeWidth={2.2} />
            <span>Got it, back to setup</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "20px",
    boxSizing: "border-box",
    animation: "fadeIn 0.15s ease-out",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "540px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
  },
  header: {
    padding: "18px 22px",
    borderBottom: "1px solid #F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBox: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#FFF7ED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  title: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 2px 0",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "12.5px",
    color: "#6B7280",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    lineHeight: "1",
    borderRadius: "4px",
  },
  body: {
    padding: "20px 24px",
    maxHeight: "65vh",
    overflowY: "auto",
  },
  stepsList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  stepRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  stepBadge: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    backgroundColor: "#F3EEFF",
    color: "#5C28D8",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  stepDesc: {
    fontSize: "13px",
    color: "#4B5563",
    margin: "0 0 8px 0",
    lineHeight: "1.45",
  },
  externalLinkBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#F3EEFF",
    color: "#5C28D8",
    border: "1px solid #E0D4FC",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "600",
    textDecoration: "none",
    marginTop: "2px",
    transition: "background-color 0.15s ease",
  },
  footer: {
    padding: "14px 24px",
    backgroundColor: "#F9FAFB",
    borderTop: "1px solid #F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  doneBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#5C28D8",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(92, 40, 216, 0.3)",
    transition: "background-color 0.15s ease",
  },
};
