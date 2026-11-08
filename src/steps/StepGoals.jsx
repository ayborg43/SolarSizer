import { INSTALLER_PREFS, PROPERTY_TYPES } from "../data";
import { autonomyDaysForTarget } from "../solarCalculations";

export default function StepGoals({
  styles, T, isDesktop, helpBanner,
  backupTarget, setBackupTarget, setAutonomyDays,
  propertyType, setPropertyType, installerPreference, setInstallerPreference,
  sunHours, setSunHours,
  onContinue,
}) {
  const { card, labelSt, numInput, primBtn, infoBox } = styles;
  const clamped = Math.min(10, Math.max(1, Number(sunHours) || 5));

  return (
    <>
      <div style={{ fontSize: isDesktop ? "26px" : "22px", fontWeight: "800", color: T.sectionTitle, marginBottom: "4px", letterSpacing: "-0.5px" }}>What should this solar setup achieve?</div>
      <div style={{ fontSize: "14px", color: T.sectionSub, marginBottom: "24px", lineHeight: "1.6" }}>Start with your goal, then tell us how much strong sunlight your area gets. The assistant will use this context to guide reliability, sizing, and installer decisions.</div>
      {helpBanner}

      <div style={{ ...card, marginBottom: "18px" }}>
        <div style={{ ...labelSt, marginBottom: "12px" }}>Goal Intake</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: T.label, marginBottom: "6px" }}>Backup target</div>
            <select aria-label="Backup target" value={backupTarget} onChange={(e) => { setBackupTarget(e.target.value); setAutonomyDays(autonomyDaysForTarget(e.target.value)); }} style={{ ...numInput, width: "100%", padding: "11px 12px", boxSizing: "border-box" }}>
              <option value="daytime">Daytime essentials</option>
              <option value="overnight">Overnight backup</option>
              <option value="full-day">Full day backup</option>
              <option value="generator">Generator replacement</option>
            </select>
          </div>
          {[
            ["Property", PROPERTY_TYPES, propertyType, setPropertyType],
            ["Installer", INSTALLER_PREFS, installerPreference, setInstallerPreference],
          ].map(([label, options, selected, setter]) => (
            <div key={label}>
              <div style={{ fontSize: "12px", color: T.label, marginBottom: "6px" }}>{label}</div>
              <select aria-label={label} value={selected} onChange={(e) => setter(e.target.value)} style={{ ...numInput, width: "100%", padding: "11px 12px", boxSizing: "border-box" }}>
                {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>

      </div>

      <div style={{ ...card, marginBottom: "18px" }}>
        <div style={{ ...labelSt, marginBottom: "6px" }}>Sunlight Hours</div>
        <div style={{ fontSize: "13px", color: T.sectionSub, lineHeight: "1.6", marginBottom: "14px" }}>
          How many hours of strong, direct sunlight do your panels get on a typical day? This is called <strong>peak sun hours</strong> — not total daylight. Most of Nigeria and Ghana get about 4–6 hours; use a lower number (3.5–4.5) for cloudy coastal or rainy-season conditions.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <input
            type="range"
            aria-label="Sunlight hours slider"
            min="2"
            max="8"
            step="0.1"
            value={clamped}
            onChange={(e) => setSunHours(Number(e.target.value))}
            style={{ flex: "1 1 220px", accentColor: "#f59e0b" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="number"
              aria-label="Sunlight hours per day"
              min="1"
              max="10"
              step="0.1"
              value={sunHours}
              onChange={(e) => setSunHours(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={() => setSunHours(clamped)}
              style={{ ...numInput, width: "90px", padding: "10px 12px", textAlign: "center", fontSize: "16px", fontWeight: "700" }}
            />
            <span style={{ fontSize: "13px", color: T.sectionSub, fontWeight: "600" }}>hrs/day</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "14px" }}>
          {[3.5, 4, 4.5, 5, 5.5, 6].map((h) => (
            <button key={h} onClick={() => setSunHours(h)} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", fontWeight: "600", background: clamped === h ? "rgba(251,191,36,0.12)" : T.pillBg, border: clamped === h ? "1px solid rgba(251,191,36,0.45)" : `1px solid ${T.pillBdr}`, color: clamped === h ? "#d97706" : T.pillClr, fontFamily: "'Outfit',sans-serif" }}>
              {h} hrs
            </button>
          ))}
        </div>
        <div style={{ ...infoBox, marginTop: "16px" }}>
          ☀️ <strong style={{ color: "#fbbf24" }}>{clamped} peak sun hours/day</strong> — fewer sun hours means more panels are needed for the same daily energy. When in doubt, estimate low: a slightly larger array is safer than an undersized one.
        </div>
      </div>

      <button style={primBtn({})} onClick={onContinue}>Continue → Add Appliances</button>
    </>
  );
}
