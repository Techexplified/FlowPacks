import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { Lightbulb, CheckCircle2, ArrowLeft, PlusCircle } from "lucide-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getOrCreateMerchantSettings, createSuggestion } from "../services/merchant.server";
import { useEmbedNavigate } from "../hooks/use-embed-navigate";
import { suggestStyles } from "../styles/suggest.styles";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const merchant = await getOrCreateMerchantSettings(session.shop);

  return {
    shop: session.shop,
    defaultEmail: merchant?.notificationEmail || "",
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const name = formData.get("name");
  const problem = formData.get("problem");
  const trigger = formData.get("trigger");
  const contactEmail = formData.get("contactEmail");

  try {
    const suggestion = await createSuggestion(session.shop, {
      name,
      problem,
      trigger,
      contactEmail,
    });

    return {
      success: true,
      suggestion,
      message: "Suggestion submitted successfully!",
    };
  } catch (err) {
    console.error("Error submitting suggestion:", err);
    return {
      success: false,
      error: err.message || "Failed to submit suggestion. Please try again.",
    };
  }
};

export default function SuggestAutomationPage() {
  const { defaultEmail } = useLoaderData();
  const fetcher = useFetcher();
  const embedNavigate = useEmbedNavigate();

  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");
  const [trigger, setTrigger] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail || "");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isSubmitting = fetcher.state === "submitting";
  const errorMessage = fetcher.data?.error || null;

  // Detect when submission finishes successfully
  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === "idle") {
      setIsSubmitted(true);
    }
  }, [fetcher.data, fetcher.state]);

  const handleResetForAnother = () => {
    setName("");
    setProblem("");
    setTrigger("");
    // keep contact email for convenience
    setIsSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetcher.submit(
      {
        name,
        problem,
        trigger,
        contactEmail,
      },
      { method: "post" }
    );
  };

  return (
    <div style={suggestStyles.pageWrapper}>
      <div style={suggestStyles.contentContainer}>
        {/* Top Purple Brand Header Banner */}
        <div style={suggestStyles.banner}>
          <div style={suggestStyles.bannerCurves}>
            <svg
              style={suggestStyles.bannerSvg}
              viewBox="0 0 1000 120"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M-50,20 C200,90 400,-20 650,50 C800,90 950,20 1050,40"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="4"
                fill="none"
              />
              <path
                d="M-20,70 C250,130 500,10 750,80 C900,110 1000,60 1080,70"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="6"
                fill="none"
              />
            </svg>
          </div>

          <div style={suggestStyles.brandGroup}>
            <div style={suggestStyles.logoWrapper}>
              <Lightbulb size={22} color="#5C28D8" strokeWidth={2.2} />
            </div>
            <div>
              <h1 style={suggestStyles.brandTitle}>Suggest an automation</h1>
              <p style={suggestStyles.brandSubtitle}>
                Tell us what you&apos;d want FlowPacks to monitor next.
              </p>
            </div>
          </div>

          <div style={suggestStyles.bannerRightGroup}>
            <div style={suggestStyles.tagline}>
              <span>Automate</span>
              <span style={suggestStyles.taglinePlus}>+</span>
              <span>Grow</span>
              <span style={suggestStyles.taglinePlus}>+</span>
              <span>Stay in control</span>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div style={suggestStyles.card}>
          {isSubmitted ? (
            /* Multi-Submission Success State */
            <div style={suggestStyles.successCard}>
              <div style={suggestStyles.successIconBox}>
                <CheckCircle2 size={30} strokeWidth={2.4} />
              </div>
              <h3 style={suggestStyles.successTitle}>Suggestion received!</h3>
              <p style={suggestStyles.successDesc}>
                Thank you for your feedback! We review merchant suggestions regularly to design new automation recipes for future updates.
              </p>
              <div style={suggestStyles.successActions}>
                <button
                  type="button"
                  style={suggestStyles.primarySmallBtn}
                  onClick={handleResetForAnother}
                >
                  <PlusCircle size={16} />
                  <span>Submit another suggestion</span>
                </button>
                <button
                  type="button"
                  style={suggestStyles.secondaryBtn}
                  onClick={() => embedNavigate("/app/automation-library")}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Automation Library</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Suggestion Form matching screenshot */
            <form onSubmit={handleSubmit}>
              <p style={suggestStyles.introText}>
                Don&apos;t see something you need? Tell us what you&apos;d want Flowpacks to watch for, and we&apos;ll consider it for a future update.
              </p>

              {errorMessage && (
                <div style={suggestStyles.errorBanner}>
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Field 1: Name */}
              <div style={suggestStyles.formGroup}>
                <label style={suggestStyles.label}>
                  What should we call this automation?
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. "Alert me when a discount code isn&apos;t being used"'
                  required
                  disabled={isSubmitting}
                  style={suggestStyles.input}
                />
              </div>

              {/* Field 2: Problem */}
              <div style={suggestStyles.formGroup}>
                <label style={suggestStyles.label}>
                  What problem would this solve for you?
                </label>
                <textarea
                  name="problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder='e.g. "I run promotions but never know if anyone&apos;s actually using the code"'
                  required
                  disabled={isSubmitting}
                  style={suggestStyles.textarea}
                  rows={3}
                />
              </div>

              {/* Field 3: Trigger */}
              <div style={suggestStyles.formGroup}>
                <label style={suggestStyles.label}>
                  What should trigger the alert?
                </label>
                <input
                  type="text"
                  name="trigger"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder='e.g. "If a discount code has 0 uses after 3 days"'
                  required
                  disabled={isSubmitting}
                  style={suggestStyles.input}
                />
              </div>

              {/* Field 4: Contact Email (Optional) */}
              <div style={suggestStyles.formGroup}>
                <label style={suggestStyles.label}>
                  Email (optional)
                </label>
                <span style={suggestStyles.subLabel}>
                  We&apos;ll let you know if we build this.
                </span>
                <input
                  type="email"
                  name="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@store.com"
                  disabled={isSubmitting}
                  style={suggestStyles.input}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !problem.trim() || !trigger.trim()}
                style={{
                  ...suggestStyles.submitBtn,
                  ...(isSubmitting || !name.trim() || !problem.trim() || !trigger.trim()
                    ? suggestStyles.submitBtnDisabled
                    : {}),
                }}
              >
                {isSubmitting ? "Submitting suggestion..." : "Submit suggestion"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
