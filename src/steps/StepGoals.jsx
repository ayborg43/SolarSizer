import { COUNTRIES, INSTALLER_PREFS, PROPERTY_TYPES } from "../data";
import { autonomyDaysForTarget } from "../solarCalculations";

export default function StepGoals({
  styles, T, isDesktop, helpBanner,
  backupTarget, setBackupTarget, setAutonomyDays,
  propertyType, setPropertyType, installerPreference, setInstallerPreference,
  fridgeOvernight, setFridgeOvernight, acDaily, setAcDaily,
  cd, country, location, activeZone, setActiveZone,
  countryDropdownOpen, setCountryDropdownOpen, countrySearch, setCountrySearch,
  countryDropdownRef, onCountryChange, onStateChange, onContinue,
}) {
  const { card, labelSt, numInput, primBtn, secBtn, infoBox } = styles;
  const zones = [...new Set(cd.states.map((s) => s.zone))];
  const zoneStates = cd.states.filter((s) => s.zone === activeZone);
  const selectedState = cd.states.find((s) => s.name === location);
  const filteredCountries = COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

  return (
    <>
      <div style={{ fontSize: isDesktop ? "26px" : "22px", fontWeight: "800", color: T.sectionTitle, marginBottom: "4px", letterSpacing: "-0.5px" }}>What should this solar setup achieve?</div>
      <div style={{ fontSize: "14px", color: T.sectionSub, marginBottom: "24px", lineHeight: "1.6" }}>Start with your goal, then location. The assistant will use this context to guide reliability, sizing, and installer decisions.</div>
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

        <div style={{ ...labelSt, marginTop: "18px", marginBottom: "10px" }}>Assistant Questions</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: "10px" }}>
          {[
            { label: "Do you want fridge overnight?", value: fridgeOvernight, setter: setFridgeOvernight },
            { label: "Will AC run daily?", value: acDaily, setter: setAcDaily },
          ].map((q) => (
            <button key={q.label} onClick={() => q.setter(!q.value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 14px", borderRadius: "12px", border: q.value ? "2px solid #10b981" : `1px solid ${T.cardBorder}`, background: q.value ? "rgba(16,185,129,0.08)" : T.card, color: q.value ? "#059669" : T.btnClr, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>{q.label}</span>
              <span style={{ fontSize: "12px", fontWeight: "800" }}>{q.value ? "Yes" : "No"}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={labelSt} id="country-label">Country</div>
      <div ref={countryDropdownRef} onKeyDown={(e) => { if (e.key === "Escape") { setCountryDropdownOpen(false); setCountrySearch(""); } }} style={{ position: "relative", marginBottom: "24px" }}>
        <button aria-haspopup="listbox" aria-expanded={countryDropdownOpen} aria-labelledby="country-label" onClick={() => { setCountryDropdownOpen(!countryDropdownOpen); setCountrySearch(""); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", cursor: "pointer", textAlign: "left", background: countryDropdownOpen ? "rgba(251,191,36,0.07)" : T.card, border: countryDropdownOpen ? `2px solid #f59e0b` : `1px solid ${T.cardBorder}`, color: T.appColor, fontFamily: "'Outfit',sans-serif" }}>
          <span style={{ fontSize: "22px" }} aria-hidden="true">{cd.flag}</span>
          <span style={{ fontSize: "15px", fontWeight: "600", flex: 1 }}>{cd.name}</span>
          <span style={{ color: T.dropdownMuted, transform: countryDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
        </button>
        {countryDropdownOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: T.dropdownBg, border: `1px solid ${T.dropdownBdr}`, borderRadius: "14px", overflow: "hidden", boxShadow: T.shadow }}>
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.dropdownFooter}` }}>
              <input autoFocus aria-label="Search country" placeholder="Search country…" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", background: T.inputBg, border: `1px solid ${T.inputBdr}`, color: T.inputClr, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'Outfit',sans-serif" }} />
            </div>
            <div style={{ maxHeight: "240px", overflowY: "auto" }}>
              {filteredCountries.length === 0
                ? <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: T.dropdownMuted }}>No country found</div>
                : filteredCountries.map((c) => (
                  <button key={c.code} onClick={() => onCountryChange(c.code)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", cursor: "pointer", border: "none", textAlign: "left", background: country === c.code ? "rgba(251,191,36,0.08)" : "transparent", borderBottom: `1px solid ${T.dropdownItemBdr}`, fontFamily: "'Outfit',sans-serif" }}>
                    <span style={{ fontSize: "20px" }}>{c.flag}</span>
                    <span style={{ flex: 1, fontSize: "14px", color: country === c.code ? "#d97706" : T.dropdownClr, fontWeight: country === c.code ? "700" : "400" }}>{c.name}</span>
                    {country === c.code && <span style={{ color: "#d97706", fontWeight: "700" }}>✓</span>}
                  </button>
                ))
              }
            </div>
            <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.dropdownFooter}` }}>
              <button onClick={() => setCountryDropdownOpen(false)} style={{ ...secBtn, marginTop: 0, padding: "8px" }}>Close</button>
            </div>
          </div>
        )}
      </div>

      <div style={labelSt}>{cd.code === "NG" ? "State" : "Region"}</div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {zones.map((z) => (
          <button key={z} onClick={() => setActiveZone(z)} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", fontWeight: "600", background: activeZone === z ? "rgba(251,191,36,0.12)" : T.pillBg, border: activeZone === z ? "1px solid rgba(251,191,36,0.45)" : `1px solid ${T.pillBdr}`, color: activeZone === z ? "#d97706" : T.pillClr, fontFamily: "'Outfit',sans-serif" }}>
            {z}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill,minmax(120px,1fr))" : "repeat(auto-fill,minmax(130px,1fr))", gap: "8px", marginBottom: "16px" }}>
        {zoneStates.map((s) => {
          const sel = location === s.name;
          const pshColor = s.psh >= 5.5 ? "#f97316" : s.psh >= 5.0 ? "#fbbf24" : "#34d399";
          return (
            <button key={s.name} onClick={() => onStateChange(s.name)} style={{ padding: "12px 8px", borderRadius: "12px", cursor: "pointer", textAlign: "center", border: sel ? "2px solid #fbbf24" : `1px solid ${T.cardBorder}`, background: sel ? "rgba(251,191,36,0.09)" : T.card, color: sel ? "#f59e0b" : T.btnClr, fontSize: "13px", fontFamily: "'Outfit',sans-serif" }}>
              <div style={{ fontWeight: sel ? "700" : "500" }}>{s.name}</div>
              <div style={{ fontSize: "10px", marginTop: "4px", color: sel ? pshColor : T.label }}>☀️ {s.psh} h</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "14px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[{ c: "#34d399", l: "< 5.0 hrs" }, { c: "#fbbf24", l: "5.0–5.4 hrs" }, { c: "#f97316", l: "5.5+ hrs" }].map((i) => (
          <div key={i.l} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.label }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: i.c }} />
            {i.l}
          </div>
        ))}
      </div>

      <div style={infoBox}>
        💡 <strong style={{ color: "#fbbf24" }}>What are Peak Sun Hours?</strong><br />
        PSH counts only hours where sunlight intensity is sufficient for panels to produce their rated output. Northern/inland areas get more PSH than coastal zones. Values shown are approximate long-term averages (NASA POWER / Global Solar Atlas).
      </div>

      {selectedState && (
        <div style={{ ...infoBox, background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.22)", marginTop: "10px" }}>
          ✅ <strong style={{ color: "#34d399" }}>{cd.flag} {location}, {cd.name}</strong>
          {" — "}<strong style={{ color: "#34d399" }}>{selectedState.psh} peak sun hours/day</strong>
          {selectedState.zone && <span style={{ color: T.label }}> · {selectedState.zone}</span>}
        </div>
      )}

      <button style={primBtn({})} onClick={onContinue}>Continue → Add Appliances</button>
    </>
  );
}
