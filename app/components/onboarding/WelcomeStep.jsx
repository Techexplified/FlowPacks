export default function WelcomeStep({ onContinue }) {
  return (
    <div style={styles.container}>
      {/* Top Brand Banner matching unified aesthetic */}
      <div style={styles.banner}>
        {/* Ambient background curves */}
        <div style={styles.bannerCurves}>
          <svg
            style={styles.bannerSvg}
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

        <div style={styles.brandGroup}>
          <div style={styles.logoWrapper}>
            <img
              src="/Flowpacks-logo.png"
              alt="FlowPacks"
              style={styles.logoImg}
            />
          </div>
          <span style={styles.brandTitle}>FlowPacks</span>
        </div>

        <div style={styles.tagline}>
          <span>Automate</span>
          <span style={styles.taglinePlus}>+</span>
          <span>Grow</span>
          <span style={styles.taglinePlus}>+</span>
          <span>Stay in control</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div style={styles.card}>
        <div style={styles.contentGrid}>
          {/* Left Column: Value Prop */}
          <div style={styles.leftCol}>
            <div style={styles.badge}>GET STARTED</div>
            <h1 style={styles.mainHeading}>Welcome to FlowPacks</h1>
            <p style={styles.subHeading}>
              Turn your store&apos;s data into automatic action.
            </p>
            <p style={styles.description}>
              FlowPacks gives you a library of ready to run automations based on your sales,
              traffic, inventory and other store signals so you can save time and focus on what
              matters most.
            </p>

            {/* Checklist */}
            <div style={styles.checklist}>
              <div style={styles.checkItem}>
                <div style={styles.checkIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C5FEE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={styles.checkText}>No setup required, automations work out of the box</span>
              </div>

              <div style={styles.checkItem}>
                <div style={styles.checkIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C5FEE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={styles.checkText}>Runs in the background as your store changes</span>
              </div>

              <div style={styles.checkItem}>
                <div style={styles.checkIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C5FEE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={styles.checkText}>You stay in control, pause or turn off anytime</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Res Diagram Graphic */}
          <div style={styles.rightCol}>
            <div style={styles.imageWrapper}>
              <img
                src="/welcome-home.png"
                alt="Automations that work for you"
                style={styles.heroImg}
              />
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div style={styles.footerBar}>
          <div style={styles.statusIndicator}>
            <div style={styles.greenCheck}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span style={styles.statusText}>FlowPacks is ready to automate.</span>
          </div>

          <button
            type="button"
            onClick={onContinue}
            style={styles.continueButton}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#4338CA")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4F46E5")}
          >
            <span>Continue</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1080px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    paddingBottom: "32px",
  },
  banner: {
    position: "relative",
    background: "linear-gradient(90deg, #5B29D7 0%, #6835E3 40%, #5824CE 100%)",
    borderRadius: "14px",
    height: "72px",
    padding: "0 36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#FFFFFF",
    boxShadow: "0 8px 24px rgba(88, 36, 206, 0.25)",
    overflow: "hidden",
    marginBottom: "16px",
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
    backgroundColor: "#EEF0FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    flexShrink: 0,
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scale(1.36)",
  },
  brandTitle: {
    fontSize: "22px",
    fontWeight: "600",
    letterSpacing: "-0.01em",
    color: "#FFFFFF",
  },
  tagline: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13.5px",
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: "0.01em",
  },
  taglinePlus: {
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "400",
    fontSize: "13px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "36px 36px 24px 36px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: "36px",
    alignItems: "center",
    marginBottom: "28px",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
  },
  badge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#4F46E5",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "10px",
  },
  mainHeading: {
    fontSize: "30px",
    fontWeight: "800",
    color: "#111827",
    letterSpacing: "-0.03em",
    margin: "0 0 10px 0",
    lineHeight: 1.2,
  },
  subHeading: {
    fontSize: "17px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 12px 0",
    lineHeight: 1.3,
  },
  description: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#6B7280",
    margin: "0 0 24px 0",
  },
  checklist: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  checkIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#EEF2FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1F2937",
  },
  rightCol: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrapper: {
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  heroImg: {
    width: "100%",
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 10px 20px rgba(79, 70, 229, 0.08))",
  },
  footerBar: {
    borderTop: "1px solid #F1F5F9",
    paddingTop: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  greenCheck: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#059669",
  },
  continueButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
};
