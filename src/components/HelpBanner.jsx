function getStepHelp(step) {
  switch (step) {
    case 0:
      return "Set your goal, property type, and location first. This helps the assistant recommend a practical setup instead of only calculating raw equipment sizes.";
    case 1:
      return "Start with a profile or add the appliances you actually use. The more accurate your daily hours, the closer your system recommendation will be.";
    case 2:
      return "Battery autonomy means how many days your system should run without sun. One day is common. More days give more reliability but requires a larger battery bank.";
    case 3:
      return "Pick a battery type based on how much maintenance you want and how long you plan to keep the system. Lithium supports deeper discharge and usually lasts much longer.";
    case 4:
      return "Review the recommendation, then use the 'What if I change this?' mode to explore safer or more economical alternatives.";
    default:
      return "Use the guide to help you move through the steps. Each step affects the final system size and reliability.";
  }
}

export default function HelpBanner({ styles, step, showStepHelp, darkMode, onHide }) {
  if (!showStepHelp) return null;
  return (
    <div style={{ ...styles.infoBox, marginBottom: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontSize: "13px", fontWeight: "700", color: darkMode ? "#fbbf24" : "#d97706" }}>💡 Step Guidance</div>
      <div style={{ fontSize: "13px", lineHeight: "1.7" }}>{getStepHelp(step)}</div>
      <button onClick={onHide} style={{ ...styles.secBtn, marginTop: 0, background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: darkMode ? "#fff" : "#111827" }}>Hide help</button>
    </div>
  );
}
