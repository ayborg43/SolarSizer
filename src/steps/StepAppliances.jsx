import { APPLIANCES, LOAD_PROFILES } from "../data";
import { applianceWh } from "../solarCalculations";
import { hexToRgb } from "../theme";

function profileEstimatedWh(profile) {
  return profile.appliances.reduce((s, p) => {
    const b = APPLIANCES.find((a) => a.id === p.id);
    return s + (b ? b.watts * p.hoursPerDay * (p.qty || 1) : 0);
  }, 0);
}

export default function StepAppliances({
  styles, T, isDesktop, helpBanner,
  appliances, activeProfile, selProfile,
  addingCustom, setAddingCustom, customName, setCustomName,
  customWatts, setCustomWatts, customHours, setCustomHours,
  totalWh, totalApplianceUnits,
  onBack, onApplyProfile, onClearProfile, onAddAppliance, onDecrementAppliance, onRemoveAppliance,
  onUpdateAppliance, onAddCustomAppliance, onContinue,
}) {
  const { card, labelSt, numInput, primBtn, secBtn, infoBox } = styles;
  return (
    <>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: T.label, cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Outfit',sans-serif" }}>← Back</button>
      <div style={{ fontSize: isDesktop ? "26px" : "22px", fontWeight: "800", color: T.sectionTitle, marginBottom: "4px", letterSpacing: "-0.5px" }}>What will you power?</div>
      <div style={{ fontSize: "14px", color: T.sectionSub, marginBottom: "24px", lineHeight: "1.6" }}>Pick a profile template to start instantly, or build your list manually below.</div>
      {helpBanner}

      <div style={labelSt}>Load Profile Templates</div>
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4,1fr)" : "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {LOAD_PROFILES.map((profile) => {
          const isActive = activeProfile === profile.id;
          const estKwh = (profileEstimatedWh(profile) / 1000).toFixed(1);
          const appNames = profile.appliances.slice(0, 3).map((p) => APPLIANCES.find((a) => a.id === p.id)?.name).filter(Boolean);
          const extra = profile.appliances.length - 3;
          return (
            <button key={profile.id} onClick={() => onApplyProfile(profile)} style={{ padding: isDesktop ? "16px" : "14px", borderRadius: "14px", cursor: "pointer", textAlign: "left", background: isActive ? `rgba(${hexToRgb(profile.tagColor)},0.09)` : T.profileCardBg, border: isActive ? `2px solid ${profile.tagColor}` : `1px solid ${T.profileCardBdr}`, position: "relative", fontFamily: "'Outfit',sans-serif" }}>
              {isActive && <div style={{ position: "absolute", top: "10px", right: "10px", width: "18px", height: "18px", borderRadius: "50%", background: profile.tagColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: "700" }}>✓</div>}
              <div style={{ fontSize: isDesktop ? "28px" : "24px", marginBottom: "6px" }}>{profile.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: T.sectionTitle, marginBottom: "4px" }}>{profile.name}</div>
              <div style={{ display: "inline-block", fontSize: "10px", fontWeight: "700", color: profile.tagColor, background: `rgba(${hexToRgb(profile.tagColor)},0.1)`, border: `1px solid rgba(${hexToRgb(profile.tagColor)},0.25)`, borderRadius: "20px", padding: "2px 8px", marginBottom: "6px" }}>{profile.tag}</div>
              {isDesktop && <div style={{ fontSize: "11px", color: T.profileDesc, lineHeight: "1.4", marginBottom: "8px" }}>{profile.description}</div>}
              <div style={{ fontSize: "10px", color: T.profileWh, marginBottom: "4px" }}>{appNames.join(", ")}{extra > 0 ? ` & ${extra} more` : ""}</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: isActive ? profile.tagColor : "#d97706" }}>~{estKwh} kWh/day</div>
            </button>
          );
        })}
      </div>

      {activeProfile && selProfile && (
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: "12px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <span style={{ fontSize: "16px" }}>{selProfile.icon}</span>
          <div style={{ flex: 1, fontSize: "13px", color: T.sectionSub }}>
            <strong style={{ color: "#34d399" }}>"{selProfile.name}" loaded</strong> — {appliances.length} appliances. Adjust hours below or add more.
          </div>
          <button onClick={onClearProfile} style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#ef4444", padding: "5px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "700", flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>Clear ✕</button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 16px" }}>
        <div style={{ flex: 1, height: "1px", background: T.divider }} />
        <span style={{ ...labelSt, marginBottom: 0, whiteSpace: "nowrap" }}>Or Add Manually</span>
        <div style={{ flex: 1, height: "1px", background: T.divider }} />
      </div>

      <div style={{ fontSize: "12px", color: T.sectionSub, marginBottom: "8px" }}>Tap a card to add one more. Tap the red count badge to reduce.</div>
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(6,1fr)" : "repeat(auto-fill,minmax(100px,1fr))", gap: "8px", marginBottom: "14px" }}>
        {APPLIANCES.map((a) => {
          const selected = appliances.find((x) => x.id === a.id);
          const added = !!selected;
          const qty = selected?.qty || 0;
          return (
            <div key={a.id} style={{ position: "relative" }}>
              <button aria-label={`Add one ${a.name}`} onClick={() => onAddAppliance(a)} style={{ width: "100%", padding: "12px 6px", borderRadius: "12px", cursor: "pointer", textAlign: "center", fontSize: "12px", border: added ? "2px solid rgba(16,185,129,0.55)" : `1px solid ${T.cardBorder}`, background: added ? "rgba(16,185,129,0.07)" : T.card, color: added ? "#059669" : T.btnClr, fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ fontSize: "22px", marginBottom: "4px" }}>{a.icon}</div>
                <div style={{ fontWeight: "500", fontSize: "11px", lineHeight: "1.3" }}>{a.name}</div>
                <div style={{ fontSize: "10px", color: added ? "#059669" : T.label, marginTop: "2px" }}>{a.watts}W · {a.defaultHours}h/day</div>
                {added && <div style={{ fontSize: "10px", color: "#34d399", marginTop: "2px", fontWeight: "600" }}>✓ Added</div>}
              </button>
              {added && (
                <button aria-label={`Remove one ${a.name}`} title="Click to reduce quantity" onClick={() => onDecrementAppliance(a.id)} style={{ position: "absolute", top: "-6px", right: "-6px", minWidth: "22px", height: "22px", padding: "0 5px", borderRadius: "11px", border: "2px solid #fff", background: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: "800", cursor: "pointer", fontFamily: "'Outfit',sans-serif", zIndex: 2 }}>
                  {qty}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!addingCustom ? (
        <button style={secBtn} onClick={() => setAddingCustom(true)}>+ Add Custom Appliance</button>
      ) : (
        <div style={card}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", color: "#fbbf24" }}>Custom Appliance</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input aria-label="Custom appliance name" placeholder="Name (e.g. CCTV Camera)" value={customName} onChange={(e) => setCustomName(e.target.value)} style={{ ...numInput, width: "100%", textAlign: "left", padding: "10px 12px", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <input aria-label="Custom appliance watts" placeholder="Watts" type="number" value={customWatts} onChange={(e) => setCustomWatts(e.target.value)} style={{ ...numInput, flex: 1, textAlign: "left", padding: "10px 12px" }} />
              <input aria-label="Custom appliance hours per day" placeholder="Hrs/day" type="number" value={customHours} onChange={(e) => setCustomHours(e.target.value)} style={{ ...numInput, flex: 1, textAlign: "left", padding: "10px 12px" }} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={primBtn({ marginTop: 0, flex: 1, padding: "10px" })} onClick={onAddCustomAppliance}>Add</button>
              <button style={{ ...secBtn, marginTop: 0, flex: 1, padding: "10px" }} onClick={() => setAddingCustom(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {appliances.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ ...labelSt, marginBottom: "10px" }}>Your Appliances — tap any value to edit</div>
          {appliances.map((a) => {
            const wh = applianceWh(a);
            const baseAppl = APPLIANCES.find((x) => x.id === a.id);
            const isCustomW = baseAppl ? a.watts !== baseAppl.watts : false;
            return (
              <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{a.icon}</span>
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: "600", color: T.sectionTitle }}>{a.name}</span>
                  {isCustomW && <span style={{ fontSize: "10px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.28)", color: "#d97706", borderRadius: "6px", padding: "2px 7px", fontWeight: "600" }}>Custom W</span>}
                  <button aria-label={`Remove ${a.name}`} onClick={() => onRemoveAppliance(a.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "8px", color: "#ef4444", padding: "4px 9px", cursor: "pointer", fontSize: "14px" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr 92px" : "1fr 1fr", gap: "8px", alignItems: "end" }}>
                  <div>
                    <div style={{ ...labelSt, marginBottom: "3px" }}>⚡ Watts</div>
                    <div style={{ position: "relative" }}>
                      <input type="number" aria-label={`${a.name} watts`} value={a.watts} min="1" max="10000" onChange={(e) => onUpdateAppliance(a.id, "watts", e.target.value)} style={{ ...numInput, width: "100%", textAlign: "left", padding: "7px 28px 7px 10px", boxSizing: "border-box" }} />
                      <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: T.label, pointerEvents: "none" }}>W</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...labelSt, marginBottom: "3px" }}>⏱ Hrs / Day</div>
                    <div style={{ position: "relative" }}>
                      <input type="number" aria-label={`${a.name} hours per day`} value={a.hoursPerDay} min="0" max="24" step="0.5" onChange={(e) => onUpdateAppliance(a.id, "hoursPerDay", e.target.value)} style={{ ...numInput, width: "100%", textAlign: "left", padding: "7px 24px 7px 10px", boxSizing: "border-box" }} />
                      <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: T.label, pointerEvents: "none" }}>h</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...labelSt, marginBottom: "3px" }}>Qty</div>
                    <input type="number" aria-label={`${a.name} quantity`} value={a.qty || 1} min="1" max="50" step="1" onChange={(e) => onUpdateAppliance(a.id, "qty", e.target.value)} style={{ ...numInput, width: "100%", textAlign: "left", padding: "7px 10px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ textAlign: isDesktop ? "right" : "left" }}>
                    <div style={{ ...labelSt, marginBottom: "3px" }}>Daily</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: wh > 1000 ? "#f97316" : "#d97706" }}>{wh >= 1000 ? `${(wh / 1000).toFixed(1)}kWh` : `${wh}Wh`}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { id: "must", label: "Must run" },
                    { id: "nice", label: "Nice to have" },
                  ].map((p) => (
                    <button key={p.id} onClick={() => onUpdateAppliance(a.id, "priority", p.id)} style={{ padding: "6px 10px", borderRadius: "20px", border: (a.priority || "must") === p.id ? "1px solid rgba(245,158,11,0.55)" : `1px solid ${T.cardBorder}`, background: (a.priority || "must") === p.id ? "rgba(245,158,11,0.1)" : T.pillBg, color: (a.priority || "must") === p.id ? "#d97706" : T.pillClr, cursor: "pointer", fontSize: "11px", fontWeight: "700", fontFamily: "'Outfit',sans-serif" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ background: T.totalBarBg, border: `1px solid ${T.totalBarBdr}`, borderRadius: "14px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <div>
              <div style={{ fontSize: "12px", color: T.totalLbl }}>Total Daily Energy</div>
              <div style={{ fontSize: "11px", color: T.label, marginTop: "2px" }}>{totalApplianceUnits} total unit{totalApplianceUnits !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#d97706" }}>{totalWh.toLocaleString()} Wh/day</div>
          </div>
        </div>
      )}

      <div style={{ ...infoBox, marginTop: "16px" }}>
        💡 <strong style={{ color: "#fbbf24" }}>Tip:</strong> Be honest about usage hours. A fridge typically runs 8–12 hrs/day. An AC might run 5–6 hrs. Accurate inputs = accurate sizing.
      </div>

      <button style={{ ...primBtn({}), opacity: appliances.length === 0 || totalWh <= 0 ? 0.4 : 1 }} disabled={appliances.length === 0 || totalWh <= 0} onClick={onContinue}>
        Continue → Backup Duration
      </button>
    </>
  );
}
