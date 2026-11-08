import { SYSTEM_VOLTAGES } from "../data";
import { appliancePeakWatts, getRecommendedVoltage } from "../solarCalculations";

function getVoltageWarning(sel, rec, tw, pw, apls) {
  if (sel >= rec) return null;
  const heavy = apls.filter((a) => a.watts >= 500).map((a) => a.name);
  const reasons = [];
  if (pw > 2000 && sel < 48) reasons.push(`Your peak load is ${pw.toLocaleString()}W — at ${sel}V that means ${Math.round(pw / sel)}A of current, which needs dangerously thick cables.`);
  else if (pw > 500 && sel === 12) reasons.push(`Your peak load of ${pw}W draws ${Math.round(pw / 12)}A at 12V — significant energy loss and heat.`);
  if (heavy.length) reasons.push(`High-draw appliances detected: ${heavy.join(", ")}. These work far more efficiently at higher voltages.`);
  if (tw >= 1000 && sel === 12) reasons.push(`At ${tw.toLocaleString()} Wh/day, a 12V system needs very large battery banks with complex parallel wiring.`);
  return { recommendedV: rec, reasons };
}

export default function StepBackup({
  styles, T, isDesktop, helpBanner,
  appliances, totalWh, autonomyDays, setAutonomyDays,
  systemVoltage, setSystemVoltage, setVoltageManuallySet,
  onUpdateAppliance, onRemoveAppliance,
  backupSource, onBackupSourceChange, backupPrice, setBackupPrice,
  onBack, onContinue,
}) {
  const { infoBox, primBtn, labelSt, numInput, card } = styles;
  const peakWatts = appliances.reduce((s, a) => s + appliancePeakWatts(a), 0);
  const recommendedV = getRecommendedVoltage(totalWh, peakWatts);
  const warning = getVoltageWarning(systemVoltage, recommendedV, totalWh, peakWatts, appliances);

  return (
    <>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: T.label, cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "20px", display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Outfit',sans-serif" }}>← Back</button>
      <div style={{ fontSize: isDesktop ? "26px" : "22px", fontWeight: "800", color: T.sectionTitle, marginBottom: "4px", letterSpacing: "-0.5px" }}>Days of Backup</div>
      <div style={{ fontSize: "14px", color: T.sectionSub, marginBottom: "24px", lineHeight: "1.6" }}>How many days your batteries should run without any sunlight or grid charging.</div>
      {helpBanner}

      <div style={{ ...card, marginBottom: "18px" }}>
        <div style={{ ...labelSt, marginBottom: "10px" }}>Verify Your Load</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 64px 64px 28px", gap: "6px", fontSize: "10px", color: T.label, fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
          <span>Appliance</span><span>Qty</span><span>Watts</span><span>Hrs/Day</span><span />
        </div>
        {appliances.map((a) => (
          <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr 52px 64px 64px 28px", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: T.sectionTitle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.icon} {a.name}</span>
            <input type="number" aria-label={`${a.name} quantity`} value={a.qty || 1} min="1" max="50" onChange={(e) => onUpdateAppliance(a.id, "qty", e.target.value)} style={{ ...numInput, width: "100%", padding: "5px", boxSizing: "border-box" }} />
            <input type="number" aria-label={`${a.name} watts`} value={a.watts} min="1" max="10000" onChange={(e) => onUpdateAppliance(a.id, "watts", e.target.value)} style={{ ...numInput, width: "100%", padding: "5px", boxSizing: "border-box" }} />
            <input type="number" aria-label={`${a.name} hours per day`} value={a.hoursPerDay} min="0" max="24" step="0.5" onChange={(e) => onUpdateAppliance(a.id, "hoursPerDay", e.target.value)} style={{ ...numInput, width: "100%", padding: "5px", boxSizing: "border-box" }} />
            <button aria-label={`Remove ${a.name}`} onClick={() => onRemoveAppliance(a.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: "7px", color: "#ef4444", padding: "4px 0", cursor: "pointer", fontSize: "13px" }}>×</button>
          </div>
        ))}
        <div style={{ fontSize: "12px", color: T.sectionSub, marginTop: "8px" }}>Total: <strong style={{ color: "#d97706" }}>{totalWh.toLocaleString()} Wh/day</strong> — edit any value, changes apply everywhere instantly.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(6,1fr)" : "repeat(3,1fr)", gap: "10px", marginBottom: "20px" }}>
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <button key={d} onClick={() => setAutonomyDays(d)} style={{ padding: isDesktop ? "22px 8px" : "18px 8px", borderRadius: "14px", cursor: "pointer", textAlign: "center", border: autonomyDays === d ? "2px solid #fbbf24" : `1px solid ${T.cardBorder}`, background: autonomyDays === d ? "rgba(251,191,36,0.08)" : T.card, color: autonomyDays === d ? "#d97706" : T.btnClr, fontFamily: "'Outfit',sans-serif" }}>
            <div style={{ fontSize: "24px", fontWeight: "800" }}>{d}</div>
            <div style={{ fontSize: "11px", marginTop: "3px", opacity: 0.7 }}>{d === 1 ? "Day" : "Days"}</div>
          </button>
        ))}
      </div>

      <div style={infoBox}>
        ☀️ <strong style={{ color: "#fbbf24" }}>What is Autonomy?</strong><br />
        Autonomy = days your batteries last with zero solar input. In Nigeria, 1–2 days is typical. 3+ days means a much larger battery bank.
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 0 10px" }}>
        <div style={{ fontSize: "14px", fontWeight: "700", color: T.sectionTitle }}>System Voltage</div>
        <div style={{ fontSize: "11px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.22)", borderRadius: "20px", padding: "4px 12px", color: "#059669", fontWeight: "700" }}>✦ Recommended: {recommendedV}V</div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
        {SYSTEM_VOLTAGES.map((v) => {
          const isRec = v === recommendedV, isSel = systemVoltage === v;
          return (
            <button key={v} onClick={() => { setSystemVoltage(v); setVoltageManuallySet(true); }} style={{ flex: 1, padding: isRec ? "22px 14px 14px" : "16px 14px", borderRadius: "14px", cursor: "pointer", textAlign: "center", fontWeight: isSel ? "700" : "400", fontSize: "15px", position: "relative", border: isSel ? (isRec ? "2px solid #10b981" : "2px solid #ef4444") : `1px solid ${T.cardBorder}`, background: isSel ? (isRec ? "rgba(16,185,129,0.09)" : "rgba(239,68,68,0.07)") : T.card, color: isSel ? (isRec ? "#059669" : "#ef4444") : T.btnClr, fontFamily: "'Outfit',sans-serif" }}>
              {isRec && <div style={{ position: "absolute", top: "6px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", fontWeight: "700", color: "#059669", background: "rgba(16,185,129,0.1)", borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap" }}>✦ BEST FIT</div>}
              <span style={{ fontSize: "20px", fontWeight: "800" }}>{v}V</span>
            </button>
          );
        })}
      </div>

      {warning ? (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: "14px", padding: "14px 16px", marginBottom: "4px" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#ef4444", marginBottom: "10px" }}>⚠️ {systemVoltage}V is below what your load requires</div>
          {warning.reasons.map((r, i) => <div key={i} style={{ fontSize: "13px", color: T.infoBoxClr, lineHeight: "1.6", marginBottom: "5px" }}>• {r}</div>)}
          <button onClick={() => { setSystemVoltage(warning.recommendedV); setVoltageManuallySet(true); }} style={{ marginTop: "10px", padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#059669", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Switch to {warning.recommendedV}V (Recommended)</button>
        </div>
      ) : (
        <div style={{ ...infoBox, background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.2)", marginTop: 0 }}>
          ✅ <strong style={{ color: "#059669" }}>{systemVoltage}V is the right choice</strong> for your {totalWh.toLocaleString()} Wh/day load and {peakWatts.toLocaleString()}W peak demand.
        </div>
      )}

      <div style={{ ...infoBox, marginTop: "12px" }}>
        🔌 <strong style={{ color: "#fbbf24" }}>Why does voltage matter?</strong><br />
        • <strong>12V</strong> — Small setups only. Under 800Wh/day and 500W peak.<br />
        • <strong>24V</strong> — Most Nigerian homes. Handles 1,000–3,000Wh/day cleanly.<br />
        • <strong>48V</strong> — Heavy loads &amp; AC. Most efficient above 3,000Wh/day.
      </div>

      <div style={{ ...card, marginTop: "16px", marginBottom: 0 }}>
        <div style={{ ...labelSt, marginBottom: "10px" }}>Current Backup — for Savings &amp; Payback</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "12px", color: T.label, marginBottom: "6px" }}>What do you currently use for backup power?</div>
            <select aria-label="Current backup power" value={backupSource} onChange={(e) => onBackupSourceChange(e.target.value)} style={{ ...numInput, width: "100%", padding: "10px 12px", boxSizing: "border-box" }}>
              <option value="petrol">Petrol Generator</option>
              <option value="diesel">Diesel Generator</option>
              <option value="grid">I don't use a generator (Grid Only)</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: T.label, marginBottom: "6px" }}>{backupSource === "grid" ? "Grid tariff (₦ per kWh)" : "Current Fuel Price (₦ per Liter)"}</div>
            <input type="number" aria-label={backupSource === "grid" ? "Grid tariff per kWh" : "Fuel price per liter"} value={backupPrice} min="0" max="100000" onChange={(e) => setBackupPrice(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...numInput, width: "100%", padding: "10px 12px", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ fontSize: "11px", color: T.sectionSub, marginTop: "8px" }}>Used on the Results step to estimate monthly savings and payback. Assumes {backupSource === "grid" ? "all your daily energy currently comes from the grid" : `a ${backupSource} generator burns ${backupSource === "diesel" ? "0.35" : "0.6"} litres per kWh generated`}.</div>
      </div>

      <button style={primBtn({})} onClick={onContinue}>Continue → Choose Battery Type</button>
    </>
  );
}
