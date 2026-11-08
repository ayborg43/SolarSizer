export default function SummaryRow({ T, icon, label, value, sub, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: `1px solid ${T.summaryBorder}` }}>
      <span style={{ fontSize: "18px", flexShrink: 0 }} aria-hidden="true">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "10px", color: T.label, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: color || T.sectionTitle, marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
        {sub && <div style={{ fontSize: "11px", color: T.sectionSub, marginTop: "1px" }}>{sub}</div>}
      </div>
    </div>
  );
}
