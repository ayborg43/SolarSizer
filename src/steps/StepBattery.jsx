import { BATTERY_TYPES } from "../data";
import { hexToRgb } from "../theme";

export default function StepBattery({
  styles, T, isDesktop, helpBanner,
  batteryType, setBatteryType, expandedBattery, setExpandedBattery, selBattery,
  onBack, onCalculate,
}) {
  const { infoBox, primBtn } = styles;
  return (
    <>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: T.label, cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Outfit',sans-serif" }}>← Back</button>
      <div style={{ fontSize: isDesktop ? "26px" : "22px", fontWeight: "800", color: T.sectionTitle, marginBottom: "4px", letterSpacing: "-0.5px" }}>Choose Your Battery</div>
      <div style={{ fontSize: "14px", color: T.sectionSub, marginBottom: "24px", lineHeight: "1.6" }}>Tap any battery to expand and learn more. Your choice affects maintenance, usable capacity, and system longevity.</div>
      {helpBanner}

      {BATTERY_TYPES.map((bat) => {
        const isSel = batteryType === bat.id;
        const isExp = expandedBattery === bat.id;
        return (
          <div
            key={bat.id}
            role="button"
            tabIndex={0}
            aria-expanded={isExp}
            aria-label={`${bat.name} — ${isExp ? "collapse" : "expand"} details`}
            onClick={() => setExpandedBattery(isExp ? null : bat.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedBattery(isExp ? null : bat.id); } }}
            style={{ background: isSel ? `rgba(${hexToRgb(bat.color)},0.07)` : T.card, border: isSel ? `2px solid ${bat.color}` : `1px solid ${T.cardBorder}`, borderRadius: "16px", marginBottom: "10px", overflow: "hidden", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: isDesktop ? "16px 20px" : "14px 16px" }}>
              <span style={{ fontSize: "24px" }}>{bat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: isDesktop ? "15px" : "14px", color: T.sectionTitle }}>{bat.name}</div>
                <div style={{ fontSize: "12px", color: T.label, marginTop: "1px" }}>{bat.lifespan} · {bat.cycles}</div>
              </div>
              <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", background: `rgba(${hexToRgb(bat.color)},0.1)`, color: bat.color, fontWeight: "700" }}>{bat.short}</span>
              <span style={{ color: T.label, fontSize: "13px", marginLeft: "4px" }}>{isExp ? "▲" : "▼"}</span>
            </div>
            {isExp && (
              <div style={{ padding: "0 20px 18px", borderTop: `1px solid ${T.batExpBdr}` }} onClick={(e) => e.stopPropagation()}>
                <div style={{ background: T.educNoteBg, border: `1px solid ${T.educNoteBdr}`, borderRadius: "12px", padding: "12px 14px", fontSize: "13px", color: T.educNoteClr, lineHeight: "1.65", margin: "14px 0" }}>
                  📚 <strong style={{ color: "#fbbf24" }}>Learn: </strong>{bat.educationNote}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4,1fr)" : "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                  {[["Depth of Discharge", `${bat.dod * 100}%`], ["Efficiency", `${bat.efficiency * 100}%`], ["Lifespan", bat.lifespan], ["Cycles", bat.cycles]].map(([l, v]) => (
                    <div key={l} style={{ background: T.metaItemBg, borderRadius: "10px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: T.metaLbl, marginBottom: "4px" }}>{l}</div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: T.metaVal }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ background: T.proCardBg, border: `1px solid ${T.proCardBdr}`, borderRadius: "12px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#34d399", marginBottom: "8px" }}>✅ Pros</div>
                    {bat.pros.map((p, i) => <div key={i} style={{ fontSize: "12px", color: T.proConsItem, marginBottom: "5px", lineHeight: "1.4" }}>• {p}</div>)}
                  </div>
                  <div style={{ background: T.conCardBg, border: `1px solid ${T.conCardBdr}`, borderRadius: "12px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#f87171", marginBottom: "8px" }}>⚠️ Cons</div>
                    {bat.cons.map((c, i) => <div key={i} style={{ fontSize: "12px", color: T.proConsItem, marginBottom: "5px", lineHeight: "1.4" }}>• {c}</div>)}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: T.bestFor, marginBottom: "14px", fontStyle: "italic" }}>🎯 Best for: {bat.bestFor}</div>
                <button onClick={() => setBatteryType(bat.id)} style={{ width: "100%", padding: "11px", borderRadius: "12px", background: `rgba(${hexToRgb(bat.color)},0.1)`, border: `1px solid ${bat.color}`, color: bat.color, fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {isSel ? "✓ Selected" : `Select ${bat.name}`}
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div style={infoBox}>
        🏆 Currently selected: <strong style={{ color: selBattery?.color }}>{selBattery?.name}</strong>
      </div>

      <button style={primBtn({})} onClick={onCalculate}>Calculate My Solar Setup →</button>
    </>
  );
}
