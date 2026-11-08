export default function Stepper({ T, steps, step, isDesktop, onStepClick }) {
  return (
    <nav aria-label="Progress" style={{ position: "relative", display: "flex", gap: isDesktop ? "6px" : "4px", padding: isDesktop ? "26px 0 22px" : "14px 0 0", overflowX: "auto" }}>
      {/* connector track */}
      <div aria-hidden="true" style={{ position: "absolute", top: isDesktop ? "43px" : "28px", left: "10%", right: "10%", height: "2px", background: T.stepDotInactive, borderRadius: "1px" }} />
      <div aria-hidden="true" style={{ position: "absolute", top: isDesktop ? "43px" : "28px", left: "10%", height: "2px", borderRadius: "1px", background: "#f59e0b", width: `${(step / (steps.length - 1)) * 80}%`, transition: "width 0.6s cubic-bezier(0.32,0.72,0,1)" }} />
      {steps.map((s, i) => {
        const done = i < step;
        const current = i === step;
        const circle = (
          <>
            <div style={{ width: isDesktop ? "34px" : "28px", height: isDesktop ? "34px" : "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isDesktop ? "12px" : "11px", fontWeight: "700", background: done ? "#f59e0b" : current ? "rgba(245,158,11,0.14)" : T.card, border: current || done ? "2px solid #f59e0b" : `2px solid ${T.stepDotBorder}`, color: done ? "#1a1205" : current ? "#d97706" : T.stepLabelOff, position: "relative", zIndex: 1, boxShadow: current ? "0 0 0 5px rgba(245,158,11,0.14)" : undefined, transition: "all 0.35s cubic-bezier(0.32,0.72,0,1)" }}>
              {done ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: isDesktop ? "10px" : "9px", color: current || done ? "#d97706" : T.stepLabelOff, textAlign: "center", fontWeight: current ? "700" : "500", whiteSpace: "nowrap", letterSpacing: "0.4px", textTransform: "uppercase" }}>{s}</div>
          </>
        );
        const wrapStyle = { flex: 1, minWidth: isDesktop ? "64px" : "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", background: "transparent", border: "none", padding: 0, fontFamily: "'Outfit',sans-serif" };
        return done && onStepClick ? (
          <button key={s} aria-label={`Go back to ${s}`} onClick={() => onStepClick(i)} style={{ ...wrapStyle, cursor: "pointer" }}>{circle}</button>
        ) : (
          <div key={s} aria-current={current ? "step" : undefined} style={wrapStyle}>{circle}</div>
        );
      })}
    </nav>
  );
}
