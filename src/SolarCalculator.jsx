import { useState, useEffect, useRef } from "react";
import {
  appliancePeakWatts,
  applianceWh,
  autonomyDaysForTarget,
  buildShareText,
  calcResults,
  clampNumber,
  getRecommendedVoltage,
  INVERTER_EFFICIENCY,
} from "./solarCalculations";
import {
  APPLIANCES,
  BATTERY_TYPES,
  COUNTRIES,
  INSTALLER_PREFS,
  LOAD_PROFILES,
  PROPERTY_TYPES,
  SYSTEM_VOLTAGES,
} from "./data";
import { getTheme, hexToRgb } from "./theme";

// ─── Helpers ───────────────────────────────────────────────────────────────
function profileEstimatedWh(profile) {
  return profile.appliances.reduce((s, p) => {
    const b = APPLIANCES.find((a) => a.id === p.id);
    return s + (b ? b.watts * p.hoursPerDay * (p.qty || 1) : 0);
  }, 0);
}

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

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to legacy copy */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

// ─── Summary row (module level so React doesn't remount it each render) ────
function SummaryRow({ T, icon, label, value, sub, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", borderBottom:`1px solid ${T.summaryBorder}` }}>
      <span style={{ fontSize:"18px", flexShrink:0 }} aria-hidden="true">{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"10px", color:T.label, fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.8px" }}>{label}</div>
        <div style={{ fontSize:"13px", fontWeight:"700", color: color||T.sectionTitle, marginTop:"1px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{value}</div>
        {sub && <div style={{ fontSize:"11px", color:T.sectionSub, marginTop:"1px" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function SolarCalculator() {
  const [step,                setStep]               = useState(0);
  const [country,             setCountry]            = useState("NG");
  const [location,            setLocation]           = useState("Lagos");
  const [appliances,          setAppliances]         = useState([]);
  const [customName,          setCustomName]         = useState("");
  const [customWatts,         setCustomWatts]        = useState("");
  const [customHours,         setCustomHours]        = useState("");
  const [backupTarget,        setBackupTarget]       = useState("overnight");
  const [propertyType,        setPropertyType]       = useState("flat");
  const [installerPreference, setInstallerPreference]= useState("compare");
  const [fridgeOvernight,     setFridgeOvernight]    = useState(true);
  const [acDaily,             setAcDaily]            = useState(false);
  const [autonomyDays,        setAutonomyDays]       = useState(1);
  const [batteryType,         setBatteryType]        = useState("agm");
  const [systemVoltage,       setSystemVoltage]      = useState(24);
  const [expandedBattery,     setExpandedBattery]    = useState("agm");
  const [results,             setResults]            = useState(null);
  const [countryDropdownOpen, setCountryDropdownOpen]= useState(false);
  const [countrySearch,       setCountrySearch]      = useState("");
  const [activeZone,          setActiveZone]         = useState(() => {
    const cd = COUNTRIES.find((c) => c.code === "NG");
    return cd.states.find((s) => s.name === "Lagos")?.zone || cd.states[0].zone;
  });
  const [addingCustom,  setAddingCustom]  = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [darkMode,      setDarkMode]      = useState(false);
  const [showStepHelp, setShowStepHelp] = useState(true);
  const [assistantMode, setAssistantMode] = useState("why");
  const [windowWidth,   setWindowWidth]   = useState(
    () => (typeof window !== "undefined" ? window.innerWidth : 1200)
  );
  const [toast, setToast] = useState(null);
  const [voltageManuallySet, setVoltageManuallySet] = useState(false);
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Auto-dismiss toast notifications.
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Close country dropdown on outside click.
  useEffect(() => {
    if (!countryDropdownOpen) return undefined;
    const onPointerDown = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setCountryDropdownOpen(false);
        setCountrySearch("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [countryDropdownOpen]);

  const isDesktop = windowWidth >= 900;

  const totalWh = appliances.reduce((s, a) => s + applianceWh(a), 0);
  const totalApplianceUnits = appliances.reduce((s, a) => s + (a.qty || 1), 0);

  // ── Handlers ──
  function applyProfile(profile) {
    const loaded = profile.appliances
      .map((p) => { const b = APPLIANCES.find((a) => a.id === p.id); return b ? { ...b, hoursPerDay: p.hoursPerDay, qty: p.qty || 1, priority: "must" } : null; })
      .filter(Boolean);
    setAppliances(loaded);
    setActiveProfile(profile.id);
  }

  function clearProfile() { setAppliances([]); setActiveProfile(null); }

  function addAppliance(appl) {
    if (appliances.find((a) => a.id === appl.id)) return;
    setAppliances([...appliances, { ...appl, hoursPerDay: 4, qty: 1, priority: "must" }]);
    setActiveProfile(null);
  }
  function removeAppliance(id) { setAppliances(appliances.filter((a) => a.id !== id)); setActiveProfile(null); }
  function updateAppliance(id, field, val) {
    setAppliances(appliances.map((a) => {
      if (a.id !== id) return a;
      if (field === "priority") return { ...a, priority: val };
      if (field === "qty") return { ...a, qty: clampNumber(val, 1, 50, 1) };
      if (field === "hoursPerDay") return { ...a, hoursPerDay: clampNumber(val, 0, 24, 1) };
      if (field === "watts") return { ...a, watts: clampNumber(val, 1, 10000, a.watts) };
      return { ...a, [field]: val };
    }));
  }

  function addCustomAppliance() {
    if (!customName || !customWatts || !customHours) return;
    const watts = clampNumber(customWatts, 1, 10000, 1);
    const hours = clampNumber(customHours, 0, 24, 1);
    setAppliances([...appliances, { id: "custom_" + Date.now(), name: customName, icon: "🔌", watts, hoursPerDay: hours, qty: 1, priority: "nice" }]);
    setCustomName(""); setCustomWatts(""); setCustomHours(""); setAddingCustom(false); setActiveProfile(null);
  }

  function getBackupTargetLabel(value = backupTarget) {
    if (value === "generator") return "Generator replacement";
    if (value === "full-day") return "Full day backup";
    if (value === "daytime") return "Daytime essentials";
    return "Overnight backup";
  }

  function getPropertyTypeLabel() {
    return PROPERTY_TYPES.find((p) => p.id === propertyType)?.label || "Property";
  }

  function getInstallerPreferenceLabel() {
    return INSTALLER_PREFS.find((p) => p.id === installerPreference)?.label || "Installer verification";
  }

  function createExportText(r, reportSections) {
    return buildShareText({
      results: r,
      appliances,
      location,
      countryName: cd?.name || "Selected country",
      backupTargetLabel: getBackupTargetLabel(),
      propertyTypeLabel: getPropertyTypeLabel(),
      installerPreferenceLabel: getInstallerPreferenceLabel(),
      ...reportSections,
    });
  }

  async function shareRecommendation(r, reportSections) {
    const text = createExportText(r, reportSections);
    if (navigator.share) {
      try { await navigator.share({ title: "SolarSizer recommendation", text }); return; }
      catch (err) {
        // User dismissed the share sheet — don't copy behind their back.
        if (err?.name === "AbortError") return;
      }
    }
    const ok = await copyTextToClipboard(text);
    setToast(ok ? "✅ Summary copied to clipboard" : "⚠️ Copy failed — use Download instead");
  }

  function downloadRecommendation(r, reportSections) {
    const text = createExportText(r, reportSections);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solarsizer-${location.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "recommendation"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getVoltageWarning(sel, rec, tw, pw, apls) {
    if (sel >= rec) return null;
    const heavy   = apls.filter((a) => a.watts >= 500).map((a) => a.name);
    const reasons = [];
    if (pw > 2000 && sel < 48)  reasons.push(`Your peak load is ${pw.toLocaleString()}W — at ${sel}V that means ${Math.round(pw/sel)}A of current, which needs dangerously thick cables.`);
    else if (pw > 500 && sel === 12) reasons.push(`Your peak load of ${pw}W draws ${Math.round(pw/12)}A at 12V — significant energy loss and heat.`);
    if (heavy.length) reasons.push(`High-draw appliances detected: ${heavy.join(", ")}. These work far more efficiently at higher voltages.`);
    if (tw >= 1000 && sel === 12) reasons.push(`At ${tw.toLocaleString()} Wh/day, a 12V system needs very large battery banks with complex parallel wiring.`);
    return { recommendedV: rec, reasons };
  }

  function handleCountryChange(code) {
    const cd = COUNTRIES.find((c) => c.code === code);
    setCountry(code); setLocation(cd.defaultState);
    setActiveZone(cd.states.find((s) => s.name === cd.defaultState)?.zone || cd.states[0].zone);
    setCountryDropdownOpen(false); setCountrySearch("");
  }

  function handleStateChange(name) {
    const cd = COUNTRIES.find((c) => c.code === country);
    setLocation(name);
    setActiveZone(cd.states.find((s) => s.name === name)?.zone || activeZone);
  }

  function compute() {
    if (totalWh <= 0) {
      setToast("⚠️ Add at least one appliance with usage hours first");
      return;
    }
    setResults(calcResults({ appliances, country, location, autonomyDays, batteryType, systemVoltage, batteryTypes: BATTERY_TYPES, countries: COUNTRIES }));
    setStep(4);
  }

  function resetCalculation() {
    setStep(0);
    setCountry("NG");
    setLocation("Lagos");
    setActiveZone("South West");
    setAppliances([]);
    setCustomName("");
    setCustomWatts("");
    setCustomHours("");
    setBackupTarget("overnight");
    setPropertyType("flat");
    setInstallerPreference("compare");
    setFridgeOvernight(true);
    setAcDaily(false);
    setAutonomyDays(1);
    setBatteryType("agm");
    setSystemVoltage(24);
    setExpandedBattery("agm");
    setResults(null);
    setCountryDropdownOpen(false);
    setCountrySearch("");
    setAddingCustom(false);
    setActiveProfile(null);
    setAssistantMode("why");
    setVoltageManuallySet(false);
    setToast(null);
  }

  // ── Theme ──────────────────────────────────────────────────────────────────
  const T = getTheme(darkMode);

  // ── Shared micro-styles ────────────────────────────────────────────────────
  const infoBox  = { background:T.infoBoxBg, border:`1px solid ${T.infoBoxBdr}`, borderRadius:"12px", padding:"14px 16px", fontSize:"13px", color:T.infoBoxClr, lineHeight:"1.65" };
  const secBtn   = { background:T.btnBg, border:`1px solid ${T.btnBdr}`, borderRadius:"12px", color:T.btnClr, padding:"11px 20px", fontSize:"14px", cursor:"pointer", width:"100%", marginTop:"10px", fontFamily:"'Outfit',sans-serif" };
  const labelSt  = { fontSize:"11px", color:T.label, textTransform:"uppercase", letterSpacing:"1px", fontWeight:"600", marginBottom:"8px" };
  const numInput = { background:T.inputBg, border:`1px solid ${T.inputBdr}`, borderRadius:"8px", color:T.inputClr, padding:"4px 6px", fontSize:"13px", fontFamily:"'Outfit',sans-serif" };
  const primBtn  = (extra) => ({ width:"100%", padding:"15px", borderRadius:"14px", background:"linear-gradient(135deg,#f59e0b,#d97706)", border:"none", color:"#fff", fontSize:"15px", fontWeight:"700", cursor:"pointer", marginTop:"24px", letterSpacing:"0.2px", fontFamily:"'Outfit',sans-serif", ...extra });
  const card     = { background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:"16px", padding:"18px", marginBottom:"12px" };

  const steps = ["Goals","Appliances","Backup","Battery","Results"];

  // ── Summary Panel (desktop sidebar) ───────────────────────────────────────
  const cd           = COUNTRIES.find((c) => c.code === country);
  const stateInfo    = cd?.states.find((s) => s.name === location);
  const selBattery   = BATTERY_TYPES.find((b) => b.id === batteryType);
  const selProfile   = LOAD_PROFILES.find((p) => p.id === activeProfile);

  function renderHelpBanner() {
    if (!showStepHelp) return null;
    return (
      <div style={{ ...infoBox, marginBottom:"18px", display:"flex", flexDirection:"column", gap:"10px" }}>
        <div style={{ fontSize:"13px", fontWeight:"700", color:darkMode?"#fbbf24":"#d97706" }}>💡 Step Guidance</div>
        <div style={{ fontSize:"13px", lineHeight:"1.7" }}>{getStepHelp(step)}</div>
        <button onClick={() => setShowStepHelp(false)} style={{ ...secBtn, marginTop:0, background:darkMode?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.05)", color:darkMode?"#fff":"#111827" }}>Hide help</button>
      </div>
    );
  }

  function renderSummaryPanel() {
    const incomplete = step < 4 || !results;
    return (
      <div style={{ background:T.panelBg, border:`1px solid ${T.panelBorder}`, borderRadius:"20px", overflow:"hidden", boxShadow: darkMode?"0 4px 24px rgba(0,0,0,0.3)":"0 4px 24px rgba(0,0,0,0.07)" }}>
        {/* Panel header */}
        <div style={{ padding:"16px 18px", background: darkMode?"rgba(251,191,36,0.06)":"rgba(251,191,36,0.07)", borderBottom:`1px solid ${T.summaryBorder}` }}>
          <div style={{ fontSize:"13px", fontWeight:"700", color:"#d97706" }}>📋 Setup Summary</div>
          <div style={{ fontSize:"11px", color:T.sectionSub, marginTop:"2px" }}>Updates as you progress</div>
        </div>

        {/* Location */}
        <SummaryRow
          T={T}
          icon={cd?.flag || "📍"}
          label="Location"
          value={`${location}, ${cd?.name}`}
          sub={stateInfo ? `☀️ ${stateInfo.psh} peak sun hrs/day · ${stateInfo.zone}` : undefined}
        />

        <SummaryRow
          T={T}
          icon="🎯"
          label="Goal"
          value={getBackupTargetLabel()}
          sub={`${getPropertyTypeLabel()} · ${getInstallerPreferenceLabel()}`}
        />

        {/* Load */}
        {step >= 1 && (
          <SummaryRow
            T={T}
            icon={selProfile ? selProfile.icon : "🔌"}
            label="Load Profile"
            value={selProfile ? selProfile.name : appliances.length ? "Custom setup" : "Not configured"}
            sub={appliances.length ? `${totalApplianceUnits} units · ${totalWh.toLocaleString()} Wh/day` : "No appliances added yet"}
            color={appliances.length ? T.sectionTitle : T.label}
          />
        )}

        {/* System */}
        {step >= 2 && (
          <>
            <SummaryRow T={T} icon="⚡" label="System Voltage" value={`${systemVoltage}V DC`} sub={`${autonomyDays} day${autonomyDays > 1 ? "s" : ""} battery autonomy`} />
            <SummaryRow T={T} icon={selBattery?.icon || "🔋"} label="Battery Type" value={selBattery?.name || "—"} sub={`${(selBattery?.dod||0)*100}% DoD · ${selBattery?.lifespan}`} />
          </>
        )}

        {/* Results (step 4) */}
        {step === 4 && results ? (
          <div style={{ padding:"14px 0 4px" }}>
            <div style={{ padding:"0 14px 8px", fontSize:"10px", fontWeight:"700", color:T.label, textTransform:"uppercase", letterSpacing:"1px" }}>Recommended System</div>
            {[
              { color:"#fbbf24", icon:"🔋", label:"Battery Bank", value:`${results.battery.physicalBatteryCount} × ${results.battery.ah}Ah`, sub:`${results.battery.seriesCount}S × ${results.battery.parallelStrings}P at ${results.systemVoltage}V` },
              { color:"#10b981", icon:"☀️", label:"Panels",       value:`${results.panels.count} × ${results.panels.watts}W`, sub:`${results.panels.totalWatts}W · ~${results.panels.roofAreaSqm}sqm` },
              { color:"#3b82f6", icon:"⚡", label:"Inverter",     value:`${results.inverter}W`, sub:`Surge estimate: ${results.surgeWatts}W` },
              { color:"#8b5cf6", icon:"🔌", label:"Controller",   value:`${results.chargeController}A MPPT`, sub:`${results.psh} PSH/day` },
            ].map((r) => (
              <div key={r.label} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 14px", borderBottom:`1px solid ${T.summaryBorder}` }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`rgba(${hexToRgb(r.color)},0.1)`, border:`1px solid rgba(${hexToRgb(r.color)},0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>{r.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"10px", color:T.label, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:"600" }}>{r.label}</div>
                  <div style={{ fontSize:"14px", fontWeight:"700", color:r.color }}>{r.value}</div>
                  <div style={{ fontSize:"11px", color:T.sectionSub }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        ) : incomplete && step < 4 ? (
          <div style={{ padding:"20px 16px", textAlign:"center" }}>
            <div style={{ fontSize:"28px", marginBottom:"8px" }}>
              {step === 0 ? "🎯" : step === 1 ? "🔌" : step === 2 ? "⚡" : "🔋"}
            </div>
            <div style={{ fontSize:"12px", color:T.sectionSub, lineHeight:"1.6" }}>
              {step === 0 && "Set your goal and location →"}
              {step === 1 && "Add appliances to see your load →"}
              {step === 2 && "Set backup days & voltage →"}
              {step === 3 && "Choose a battery type to calculate →"}
            </div>
          </div>
        ) : null}

        {/* Step progress */}
        <div style={{ padding:"12px 14px", background: darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
          <div style={{ display:"flex", gap:"4px" }}>
            {steps.map((_, i) => (
              <div key={i} style={{ flex:1, height:"3px", borderRadius:"2px", background: i <= step ? "#fbbf24" : T.stepDotInactive, transition:"background 0.3s" }} />
            ))}
          </div>
          <div style={{ fontSize:"10px", color:T.label, marginTop:"6px", textAlign:"right" }}>Step {step + 1} of {steps.length}</div>
        </div>
      </div>
    );
  }

  // ── Stepper ────────────────────────────────────────────────────────────────
  function renderStepper() {
    return (
      <div style={{ display:"flex", gap: isDesktop?"6px":"4px", padding: isDesktop?"24px 0 20px":"14px 0 0", overflowX:"auto" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex:1, minWidth: isDesktop?"64px":"40px", display:"flex", flexDirection:"column", alignItems:"center", gap:"5px" }}>
            <div style={{ width: isDesktop?"34px":"28px", height: isDesktop?"34px":"28px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize: isDesktop?"12px":"11px", fontWeight:"700", background: i<step?"#fbbf24": i===step?"rgba(251,191,36,0.15)":T.stepDotInactive, border: i<=step?"2px solid #fbbf24":`2px solid ${T.stepDotBorder}`, color: i<step?"#0a0f1e": i===step?"#fbbf24":T.stepLabelOff, transition:"all 0.3s" }}>
              {i < step ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: isDesktop?"10px":"9px", color: i<=step?"#fbbf24":T.stepLabelOff, textAlign:"center", fontWeight: i===step?"600":"400", whiteSpace:"nowrap" }}>{s}</div>
          </div>
        ))}
      </div>
    );
  }

  // ── Step content ───────────────────────────────────────────────────────────
  function renderStepContent() {
    // ── STEP 0 ──
    if (step === 0) {
      const zones           = [...new Set(cd.states.map((s) => s.zone))];
      const zoneStates      = cd.states.filter((s) => s.zone === activeZone);
      const selectedState   = cd.states.find((s) => s.name === location);
      const filteredCountries = COUNTRIES.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

      return (
        <>
          <div style={{ fontSize: isDesktop?"26px":"22px", fontWeight:"800", color:T.sectionTitle, marginBottom:"4px", letterSpacing:"-0.5px" }}>What should this solar setup achieve?</div>
          <div style={{ fontSize:"14px", color:T.sectionSub, marginBottom:"24px", lineHeight:"1.6" }}>Start with your goal, then location. The assistant will use this context to guide reliability, sizing, and installer decisions.</div>
          {renderHelpBanner()}

          <div style={{ ...card, marginBottom:"18px" }}>
            <div style={{ ...labelSt, marginBottom:"12px" }}>Goal Intake</div>
            <div style={{ display:"grid", gridTemplateColumns: isDesktop?"1fr 1fr":"1fr", gap:"12px" }}>
              <div>
                <div style={{ fontSize:"12px", color:T.label, marginBottom:"6px" }}>Backup target</div>
                <select aria-label="Backup target" value={backupTarget} onChange={(e) => { setBackupTarget(e.target.value); setAutonomyDays(autonomyDaysForTarget(e.target.value)); }} style={{ ...numInput, width:"100%", padding:"11px 12px", boxSizing:"border-box" }}>
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
                  <div style={{ fontSize:"12px", color:T.label, marginBottom:"6px" }}>{label}</div>
                  <select aria-label={label} value={selected} onChange={(e) => setter(e.target.value)} style={{ ...numInput, width:"100%", padding:"11px 12px", boxSizing:"border-box" }}>
                    {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ ...labelSt, marginTop:"18px", marginBottom:"10px" }}>Assistant Questions</div>
            <div style={{ display:"grid", gridTemplateColumns: isDesktop?"1fr 1fr":"1fr", gap:"10px" }}>
              {[
                { label:"Do you want fridge overnight?", value:fridgeOvernight, setter:setFridgeOvernight },
                { label:"Will AC run daily?", value:acDaily, setter:setAcDaily },
              ].map((q) => (
                <button key={q.label} onClick={() => q.setter(!q.value)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", padding:"12px 14px", borderRadius:"12px", border:q.value?"2px solid #10b981":`1px solid ${T.cardBorder}`, background:q.value?"rgba(16,185,129,0.08)":T.card, color:q.value?"#059669":T.btnClr, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <span style={{ fontSize:"13px", fontWeight:"700" }}>{q.label}</span>
                  <span style={{ fontSize:"12px", fontWeight:"800" }}>{q.value ? "Yes" : "No"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Country dropdown */}
          <div style={labelSt} id="country-label">Country</div>
          <div ref={countryDropdownRef} onKeyDown={(e) => { if (e.key === "Escape") { setCountryDropdownOpen(false); setCountrySearch(""); } }} style={{ position:"relative", marginBottom:"24px" }}>
            <button aria-haspopup="listbox" aria-expanded={countryDropdownOpen} aria-labelledby="country-label" onClick={() => { setCountryDropdownOpen(!countryDropdownOpen); setCountrySearch(""); }} style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"14px 18px", borderRadius:"14px", cursor:"pointer", textAlign:"left", background: countryDropdownOpen?"rgba(251,191,36,0.07)":T.card, border: countryDropdownOpen?`2px solid #f59e0b`:`1px solid ${T.cardBorder}`, color:T.appColor, fontFamily:"'Outfit',sans-serif" }}>
              <span style={{ fontSize:"22px" }} aria-hidden="true">{cd.flag}</span>
              <span style={{ fontSize:"15px", fontWeight:"600", flex:1 }}>{cd.name}</span>
              <span style={{ color:T.dropdownMuted, transform: countryDropdownOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}>▼</span>
            </button>
            {countryDropdownOpen && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:100, background:T.dropdownBg, border:`1px solid ${T.dropdownBdr}`, borderRadius:"14px", overflow:"hidden", boxShadow:T.shadow }}>
                <div style={{ padding:"10px 12px", borderBottom:`1px solid ${T.dropdownFooter}` }}>
                  <input autoFocus aria-label="Search country" placeholder="Search country…" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} style={{ width:"100%", padding:"9px 12px", borderRadius:"8px", background:T.inputBg, border:`1px solid ${T.inputBdr}`, color:T.inputClr, fontSize:"14px", outline:"none", boxSizing:"border-box", fontFamily:"'Outfit',sans-serif" }} />
                </div>
                <div style={{ maxHeight:"240px", overflowY:"auto" }}>
                  {filteredCountries.length === 0
                    ? <div style={{ padding:"16px", textAlign:"center", fontSize:"13px", color:T.dropdownMuted }}>No country found</div>
                    : filteredCountries.map((c) => (
                      <button key={c.code} onClick={() => handleCountryChange(c.code)} style={{ width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"12px 18px", cursor:"pointer", border:"none", textAlign:"left", background: country===c.code?"rgba(251,191,36,0.08)":"transparent", borderBottom:`1px solid ${T.dropdownItemBdr}`, fontFamily:"'Outfit',sans-serif" }}>
                        <span style={{ fontSize:"20px" }}>{c.flag}</span>
                        <span style={{ flex:1, fontSize:"14px", color: country===c.code?"#d97706":T.dropdownClr, fontWeight: country===c.code?"700":"400" }}>{c.name}</span>
                        {country===c.code && <span style={{ color:"#d97706", fontWeight:"700" }}>✓</span>}
                      </button>
                    ))
                  }
                </div>
                <div style={{ padding:"8px 12px", borderTop:`1px solid ${T.dropdownFooter}` }}>
                  <button onClick={() => setCountryDropdownOpen(false)} style={{ ...secBtn, marginTop:0, padding:"8px" }}>Close</button>
                </div>
              </div>
            )}
          </div>

          {/* Zone pills */}
          <div style={labelSt}>{cd.code === "NG" ? "State" : "Region"}</div>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"14px" }}>
            {zones.map((z) => (
              <button key={z} onClick={() => setActiveZone(z)} style={{ padding:"6px 14px", borderRadius:"20px", fontSize:"12px", cursor:"pointer", fontWeight:"600", background: activeZone===z?"rgba(251,191,36,0.12)":T.pillBg, border: activeZone===z?"1px solid rgba(251,191,36,0.45)":`1px solid ${T.pillBdr}`, color: activeZone===z?"#d97706":T.pillClr, fontFamily:"'Outfit',sans-serif" }}>
                {z}
              </button>
            ))}
          </div>

          {/* State grid */}
          <div style={{ display:"grid", gridTemplateColumns: isDesktop?"repeat(auto-fill,minmax(120px,1fr))":"repeat(auto-fill,minmax(130px,1fr))", gap:"8px", marginBottom:"16px" }}>
            {zoneStates.map((s) => {
              const sel      = location === s.name;
              const pshColor = s.psh >= 5.5 ? "#f97316" : s.psh >= 5.0 ? "#fbbf24" : "#34d399";
              return (
                <button key={s.name} onClick={() => handleStateChange(s.name)} style={{ padding:"12px 8px", borderRadius:"12px", cursor:"pointer", textAlign:"center", border: sel?"2px solid #fbbf24":`1px solid ${T.cardBorder}`, background: sel?"rgba(251,191,36,0.09)":T.card, color: sel?"#f59e0b":T.btnClr, fontSize:"13px", fontFamily:"'Outfit',sans-serif" }}>
                  <div style={{ fontWeight: sel?"700":"500" }}>{s.name}</div>
                  <div style={{ fontSize:"10px", marginTop:"4px", color: sel?pshColor:T.label }}>☀️ {s.psh} h</div>
                </button>
              );
            })}
          </div>

          {/* PSH legend */}
          <div style={{ display:"flex", gap:"14px", marginBottom:"16px", flexWrap:"wrap" }}>
            {[{c:"#34d399",l:"< 5.0 hrs"},{c:"#fbbf24",l:"5.0–5.4 hrs"},{c:"#f97316",l:"5.5+ hrs"}].map((i) => (
              <div key={i.l} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:T.label }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:i.c }} />
                {i.l}
              </div>
            ))}
          </div>

          <div style={infoBox}>
            💡 <strong style={{ color:"#fbbf24" }}>What are Peak Sun Hours?</strong><br />
            PSH counts only hours where sunlight intensity is sufficient for panels to produce their rated output. Northern/inland areas get more PSH than coastal zones. Values shown are approximate long-term averages (NASA POWER / Global Solar Atlas).
          </div>

          {selectedState && (
            <div style={{ ...infoBox, background:"rgba(16,185,129,0.06)", borderColor:"rgba(16,185,129,0.22)", marginTop:"10px" }}>
              ✅ <strong style={{ color:"#34d399" }}>{cd.flag} {location}, {cd.name}</strong>
              {" — "}<strong style={{ color:"#34d399" }}>{selectedState.psh} peak sun hours/day</strong>
              {selectedState.zone && <span style={{ color:T.label }}> · {selectedState.zone}</span>}
            </div>
          )}

          <button style={primBtn({})} onClick={() => setStep(1)}>Continue → Add Appliances</button>
        </>
      );
    }

    // ── STEP 1 ──
    if (step === 1) {
      return (
        <>
          <button onClick={() => setStep(0)} style={{ background:"transparent", border:"none", color:T.label, cursor:"pointer", fontSize:"13px", padding:0, marginBottom:"20px", display:"flex", alignItems:"center", gap:"4px", fontFamily:"'Outfit',sans-serif" }}>← Back</button>
          <div style={{ fontSize: isDesktop?"26px":"22px", fontWeight:"800", color:T.sectionTitle, marginBottom:"4px", letterSpacing:"-0.5px" }}>What will you power?</div>
          <div style={{ fontSize:"14px", color:T.sectionSub, marginBottom:"24px", lineHeight:"1.6" }}>Pick a profile template to start instantly, or build your list manually below.</div>
          {renderHelpBanner()}

          {((fridgeOvernight && !appliances.some((a) => a.id === "fridge")) || (acDaily && !appliances.some((a) => a.id.startsWith("ac_")))) && (
            <div style={{ ...infoBox, marginBottom:"16px", background:"rgba(59,130,246,0.06)", borderColor:"rgba(59,130,246,0.22)" }}>
              <strong style={{ color:"#2563eb" }}>Assistant prompt:</strong>{" "}
              {fridgeOvernight && !appliances.some((a) => a.id === "fridge") ? "You said the fridge should run overnight, so add Refrigerator before calculating. " : ""}
              {acDaily && !appliances.some((a) => a.id.startsWith("ac_")) ? "You said AC will run daily, so include the correct AC size and hours." : ""}
            </div>
          )}

          {/* Profile cards */}
          <div style={labelSt}>Load Profile Templates</div>
          <div style={{ display:"grid", gridTemplateColumns: isDesktop?"repeat(4,1fr)":"1fr 1fr", gap:"10px", marginBottom:"16px" }}>
            {LOAD_PROFILES.map((profile) => {
              const isActive = activeProfile === profile.id;
              const estKwh   = (profileEstimatedWh(profile) / 1000).toFixed(1);
              const appNames = profile.appliances.slice(0,3).map((p) => APPLIANCES.find((a) => a.id === p.id)?.name).filter(Boolean);
              const extra    = profile.appliances.length - 3;
              return (
                <button key={profile.id} onClick={() => applyProfile(profile)} style={{ padding: isDesktop?"16px":"14px", borderRadius:"14px", cursor:"pointer", textAlign:"left", background: isActive?`rgba(${hexToRgb(profile.tagColor)},0.09)`:T.profileCardBg, border: isActive?`2px solid ${profile.tagColor}`:`1px solid ${T.profileCardBdr}`, position:"relative", fontFamily:"'Outfit',sans-serif" }}>
                  {isActive && <div style={{ position:"absolute", top:"10px", right:"10px", width:"18px", height:"18px", borderRadius:"50%", background:profile.tagColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:"#fff", fontWeight:"700" }}>✓</div>}
                  <div style={{ fontSize: isDesktop?"28px":"24px", marginBottom:"6px" }}>{profile.icon}</div>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:T.sectionTitle, marginBottom:"4px" }}>{profile.name}</div>
                  <div style={{ display:"inline-block", fontSize:"10px", fontWeight:"700", color:profile.tagColor, background:`rgba(${hexToRgb(profile.tagColor)},0.1)`, border:`1px solid rgba(${hexToRgb(profile.tagColor)},0.25)`, borderRadius:"20px", padding:"2px 8px", marginBottom:"6px" }}>{profile.tag}</div>
                  {isDesktop && <div style={{ fontSize:"11px", color:T.profileDesc, lineHeight:"1.4", marginBottom:"8px" }}>{profile.description}</div>}
                  <div style={{ fontSize:"10px", color:T.profileWh, marginBottom:"4px" }}>{appNames.join(", ")}{extra > 0 ? ` & ${extra} more` : ""}</div>
                  <div style={{ fontSize:"13px", fontWeight:"700", color: isActive?profile.tagColor:"#d97706" }}>~{estKwh} kWh/day</div>
                </button>
              );
            })}
          </div>

          {/* Active profile banner */}
          {activeProfile && selProfile && (
            <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.22)", borderRadius:"12px", padding:"10px 14px", display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
              <span style={{ fontSize:"16px" }}>{selProfile.icon}</span>
              <div style={{ flex:1, fontSize:"13px", color:T.sectionSub }}>
                <strong style={{ color:"#34d399" }}>"{selProfile.name}" loaded</strong> — {appliances.length} appliances. Adjust hours below or add more.
              </div>
              <button onClick={clearProfile} style={{ background:"rgba(239,68,68,0.09)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"8px", color:"#ef4444", padding:"5px 12px", cursor:"pointer", fontSize:"12px", fontWeight:"700", flexShrink:0, fontFamily:"'Outfit',sans-serif" }}>Clear ✕</button>
            </div>
          )}

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"20px 0 16px" }}>
            <div style={{ flex:1, height:"1px", background:T.divider }} />
            <span style={{ ...labelSt, marginBottom:0, whiteSpace:"nowrap" }}>Or Add Manually</span>
            <div style={{ flex:1, height:"1px", background:T.divider }} />
          </div>

          {/* Appliance grid */}
          <div style={{ display:"grid", gridTemplateColumns: isDesktop?"repeat(6,1fr)":"repeat(auto-fill,minmax(100px,1fr))", gap:"8px", marginBottom:"14px" }}>
            {APPLIANCES.map((a) => {
              const added = !!appliances.find((x) => x.id === a.id);
              return (
                <button key={a.id} onClick={() => added ? removeAppliance(a.id) : addAppliance(a)} style={{ padding:"12px 6px", borderRadius:"12px", cursor:"pointer", textAlign:"center", fontSize:"12px", border: added?"2px solid rgba(16,185,129,0.55)":`1px solid ${T.cardBorder}`, background: added?"rgba(16,185,129,0.07)":T.card, color: added?"#059669":T.btnClr, fontFamily:"'Outfit',sans-serif" }}>
                  <div style={{ fontSize:"22px", marginBottom:"4px" }}>{a.icon}</div>
                  <div style={{ fontWeight:"500", fontSize:"11px", lineHeight:"1.3" }}>{a.name}</div>
                  <div style={{ fontSize:"10px", color: added?"#059669":T.label, marginTop:"2px" }}>{a.watts}W</div>
                  {added && <div style={{ fontSize:"10px", color:"#34d399", marginTop:"2px", fontWeight:"600" }}>✓ Added</div>}
                </button>
              );
            })}
          </div>

          {/* Custom appliance */}
          {!addingCustom ? (
            <button style={secBtn} onClick={() => setAddingCustom(true)}>+ Add Custom Appliance</button>
          ) : (
            <div style={card}>
              <div style={{ fontSize:"13px", fontWeight:"700", marginBottom:"12px", color:"#fbbf24" }}>Custom Appliance</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                <input aria-label="Custom appliance name" placeholder="Name (e.g. CCTV Camera)" value={customName} onChange={(e) => setCustomName(e.target.value)} style={{ ...numInput, width:"100%", textAlign:"left", padding:"10px 12px", boxSizing:"border-box" }} />
                <div style={{ display:"flex", gap:"8px" }}>
                  <input aria-label="Custom appliance watts" placeholder="Watts" type="number" value={customWatts} onChange={(e) => setCustomWatts(e.target.value)} style={{ ...numInput, flex:1, textAlign:"left", padding:"10px 12px" }} />
                  <input aria-label="Custom appliance hours per day" placeholder="Hrs/day" type="number" value={customHours} onChange={(e) => setCustomHours(e.target.value)} style={{ ...numInput, flex:1, textAlign:"left", padding:"10px 12px" }} />
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button style={primBtn({ marginTop:0, flex:1, padding:"10px" })} onClick={addCustomAppliance}>Add</button>
                  <button style={{ ...secBtn, marginTop:0, flex:1, padding:"10px" }} onClick={() => setAddingCustom(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Selected list */}
          {appliances.length > 0 && (
            <div style={{ marginTop:"20px" }}>
              <div style={{ ...labelSt, marginBottom:"10px" }}>Your Appliances — tap any value to edit</div>
              {appliances.map((a) => {
                const wh          = applianceWh(a);
                const baseAppl    = APPLIANCES.find((x) => x.id === a.id);
                const isCustomW   = baseAppl ? a.watts !== baseAppl.watts : false;
                return (
                  <div key={a.id} style={{ display:"flex", flexDirection:"column", gap:"8px", padding:"12px 14px", background:T.card, border:`1px solid ${T.cardBorder}`, borderRadius:"14px", marginBottom:"8px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ fontSize:"20px" }}>{a.icon}</span>
                      <span style={{ flex:1, fontSize:"13px", fontWeight:"600", color:T.sectionTitle }}>{a.name}</span>
                      {isCustomW && <span style={{ fontSize:"10px", background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.28)", color:"#d97706", borderRadius:"6px", padding:"2px 7px", fontWeight:"600" }}>Custom W</span>}
                      <button aria-label={`Remove ${a.name}`} onClick={() => removeAppliance(a.id)} style={{ background:"rgba(239,68,68,0.1)", border:"none", borderRadius:"8px", color:"#ef4444", padding:"4px 9px", cursor:"pointer", fontSize:"14px" }}>✕</button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns: isDesktop?"1fr 1fr 1fr 92px":"1fr 1fr", gap:"8px", alignItems:"end" }}>
                      <div>
                        <div style={{ ...labelSt, marginBottom:"3px" }}>⚡ Watts</div>
                        <div style={{ position:"relative" }}>
                          <input type="number" aria-label={`${a.name} watts`} value={a.watts} min="1" max="10000" onChange={(e) => updateAppliance(a.id,"watts",e.target.value)} style={{ ...numInput, width:"100%", textAlign:"left", padding:"7px 28px 7px 10px", boxSizing:"border-box" }} />
                          <span style={{ position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)", fontSize:"10px", color:T.label, pointerEvents:"none" }}>W</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ ...labelSt, marginBottom:"3px" }}>⏱ Hrs / Day</div>
                        <div style={{ position:"relative" }}>
                          <input type="number" aria-label={`${a.name} hours per day`} value={a.hoursPerDay} min="0" max="24" step="0.5" onChange={(e) => updateAppliance(a.id,"hoursPerDay",e.target.value)} style={{ ...numInput, width:"100%", textAlign:"left", padding:"7px 24px 7px 10px", boxSizing:"border-box" }} />
                          <span style={{ position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)", fontSize:"10px", color:T.label, pointerEvents:"none" }}>h</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ ...labelSt, marginBottom:"3px" }}>Qty</div>
                        <input type="number" aria-label={`${a.name} quantity`} value={a.qty || 1} min="1" max="50" step="1" onChange={(e) => updateAppliance(a.id,"qty",e.target.value)} style={{ ...numInput, width:"100%", textAlign:"left", padding:"7px 10px", boxSizing:"border-box" }} />
                      </div>
                      <div style={{ textAlign:isDesktop?"right":"left" }}>
                        <div style={{ ...labelSt, marginBottom:"3px" }}>Daily</div>
                        <div style={{ fontSize:"14px", fontWeight:"700", color: wh>1000?"#f97316":"#d97706" }}>{wh>=1000?`${(wh/1000).toFixed(1)}kWh`:`${wh}Wh`}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                      {[
                        { id:"must", label:"Must run" },
                        { id:"nice", label:"Nice to have" },
                      ].map((p) => (
                        <button key={p.id} onClick={() => updateAppliance(a.id, "priority", p.id)} style={{ padding:"6px 10px", borderRadius:"20px", border:(a.priority || "must")===p.id?"1px solid rgba(245,158,11,0.55)":`1px solid ${T.cardBorder}`, background:(a.priority || "must")===p.id?"rgba(245,158,11,0.1)":T.pillBg, color:(a.priority || "must")===p.id?"#d97706":T.pillClr, cursor:"pointer", fontSize:"11px", fontWeight:"700", fontFamily:"'Outfit',sans-serif" }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div style={{ background:T.totalBarBg, border:`1px solid ${T.totalBarBdr}`, borderRadius:"14px", padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"8px" }}>
                <div>
                  <div style={{ fontSize:"12px", color:T.totalLbl }}>Total Daily Energy</div>
                  <div style={{ fontSize:"11px", color:T.label, marginTop:"2px" }}>{totalApplianceUnits} total unit{totalApplianceUnits!==1?"s":""}</div>
                </div>
                <div style={{ fontSize:"20px", fontWeight:"800", color:"#d97706" }}>{totalWh.toLocaleString()} Wh/day</div>
              </div>
            </div>
          )}

          <div style={{ ...infoBox, marginTop:"16px" }}>
            💡 <strong style={{ color:"#fbbf24" }}>Tip:</strong> Be honest about usage hours. A fridge typically runs 8–12 hrs/day. An AC might run 5–6 hrs. Accurate inputs = accurate sizing.
          </div>

          <button style={{ ...primBtn({}), opacity: appliances.length===0||totalWh<=0?0.4:1 }} disabled={appliances.length===0||totalWh<=0}
            onClick={() => {
              if (!voltageManuallySet) {
                const pw = appliances.reduce((s,a) => s + appliancePeakWatts(a), 0);
                setSystemVoltage(getRecommendedVoltage(totalWh, pw));
              }
              setStep(2);
            }}>
            Continue → Backup Duration
          </button>
        </>
      );
    }

    // ── STEP 2 ──
    if (step === 2) {
      const peakWatts    = appliances.reduce((s,a) => s + appliancePeakWatts(a), 0);
      const recommendedV = getRecommendedVoltage(totalWh, peakWatts);
      const warning      = getVoltageWarning(systemVoltage, recommendedV, totalWh, peakWatts, appliances);

      return (
        <>
          <button onClick={() => setStep(1)} style={{ background:"transparent", border:"none", color:T.label, cursor:"pointer", fontSize:"13px", padding:0, marginBottom:"20px", display:"flex", alignItems:"center", gap:"4px", fontFamily:"'Outfit',sans-serif" }}>← Back</button>
          <div style={{ fontSize: isDesktop?"26px":"22px", fontWeight:"800", color:T.sectionTitle, marginBottom:"4px", letterSpacing:"-0.5px" }}>Days of Backup</div>
          <div style={{ fontSize:"14px", color:T.sectionSub, marginBottom:"24px", lineHeight:"1.6" }}>How many days your batteries should run without any sunlight or grid charging.</div>
          {renderHelpBanner()}

          <div style={{ display:"grid", gridTemplateColumns: isDesktop?"repeat(4,1fr)":"repeat(2,1fr)", gap:"10px", marginBottom:"20px" }}>
            {[1,2,3,4].map((d) => (
              <button key={d} onClick={() => setAutonomyDays(d)} style={{ padding: isDesktop?"22px 8px":"18px 8px", borderRadius:"14px", cursor:"pointer", textAlign:"center", border: autonomyDays===d?"2px solid #fbbf24":`1px solid ${T.cardBorder}`, background: autonomyDays===d?"rgba(251,191,36,0.08)":T.card, color: autonomyDays===d?"#d97706":T.btnClr, fontFamily:"'Outfit',sans-serif" }}>
                <div style={{ fontSize:"24px", fontWeight:"800" }}>{d}</div>
                <div style={{ fontSize:"11px", marginTop:"3px", opacity:0.7 }}>{d===1?"Day":"Days"}</div>
              </button>
            ))}
          </div>

          <div style={infoBox}>
            ☀️ <strong style={{ color:"#fbbf24" }}>What is Autonomy?</strong><br />
            Autonomy = days your batteries last with zero solar input. In Nigeria, 1–2 days is typical. 3+ days means a much larger battery bank.
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"20px 0 10px" }}>
            <div style={{ fontSize:"14px", fontWeight:"700", color:T.sectionTitle }}>System Voltage</div>
            <div style={{ fontSize:"11px", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.22)", borderRadius:"20px", padding:"4px 12px", color:"#059669", fontWeight:"700" }}>✦ Recommended: {recommendedV}V</div>
          </div>

          <div style={{ display:"flex", gap:"10px", marginBottom:"12px" }}>
            {SYSTEM_VOLTAGES.map((v) => {
              const isRec = v === recommendedV, isSel = systemVoltage === v;
              return (
                <button key={v} onClick={() => { setSystemVoltage(v); setVoltageManuallySet(true); }} style={{ flex:1, padding: isRec?"22px 14px 14px":"16px 14px", borderRadius:"14px", cursor:"pointer", textAlign:"center", fontWeight: isSel?"700":"400", fontSize:"15px", position:"relative", border: isSel?(isRec?"2px solid #10b981":"2px solid #ef4444"):`1px solid ${T.cardBorder}`, background: isSel?(isRec?"rgba(16,185,129,0.09)":"rgba(239,68,68,0.07)"):T.card, color: isSel?(isRec?"#059669":"#ef4444"):T.btnClr, fontFamily:"'Outfit',sans-serif" }}>
                  {isRec && <div style={{ position:"absolute", top:"6px", left:"50%", transform:"translateX(-50%)", fontSize:"9px", fontWeight:"700", color:"#059669", background:"rgba(16,185,129,0.1)", borderRadius:"4px", padding:"1px 6px", whiteSpace:"nowrap" }}>✦ BEST FIT</div>}
                  <span style={{ fontSize:"20px", fontWeight:"800" }}>{v}V</span>
                </button>
              );
            })}
          </div>

          {warning ? (
            <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:"14px", padding:"14px 16px", marginBottom:"4px" }}>
              <div style={{ fontSize:"13px", fontWeight:"700", color:"#ef4444", marginBottom:"10px" }}>⚠️ {systemVoltage}V is below what your load requires</div>
              {warning.reasons.map((r,i) => <div key={i} style={{ fontSize:"13px", color:T.infoBoxClr, lineHeight:"1.6", marginBottom:"5px" }}>• {r}</div>)}
              <button onClick={() => { setSystemVoltage(warning.recommendedV); setVoltageManuallySet(true); }} style={{ marginTop:"10px", padding:"8px 16px", borderRadius:"10px", border:"1px solid rgba(16,185,129,0.3)", background:"rgba(16,185,129,0.1)", color:"#059669", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Switch to {warning.recommendedV}V (Recommended)</button>
            </div>
          ) : (
            <div style={{ ...infoBox, background:"rgba(16,185,129,0.06)", borderColor:"rgba(16,185,129,0.2)", marginTop:0 }}>
              ✅ <strong style={{ color:"#059669" }}>{systemVoltage}V is the right choice</strong> for your {totalWh.toLocaleString()} Wh/day load and {peakWatts.toLocaleString()}W peak demand.
            </div>
          )}

          <div style={{ ...infoBox, marginTop:"12px" }}>
            🔌 <strong style={{ color:"#fbbf24" }}>Why does voltage matter?</strong><br />
            • <strong>12V</strong> — Small setups only. Under 800Wh/day and 500W peak.<br />
            • <strong>24V</strong> — Most Nigerian homes. Handles 1,000–3,000Wh/day cleanly.<br />
            • <strong>48V</strong> — Heavy loads & AC. Most efficient above 3,000Wh/day.
          </div>

          <button style={primBtn({})} onClick={() => setStep(3)}>Continue → Choose Battery Type</button>
        </>
      );
    }

    // ── STEP 3 ──
    if (step === 3) {
      return (
        <>
          <button onClick={() => setStep(2)} style={{ background:"transparent", border:"none", color:T.label, cursor:"pointer", fontSize:"13px", padding:0, marginBottom:"20px", display:"flex", alignItems:"center", gap:"4px", fontFamily:"'Outfit',sans-serif" }}>← Back</button>
          <div style={{ fontSize: isDesktop?"26px":"22px", fontWeight:"800", color:T.sectionTitle, marginBottom:"4px", letterSpacing:"-0.5px" }}>Choose Your Battery</div>
          <div style={{ fontSize:"14px", color:T.sectionSub, marginBottom:"24px", lineHeight:"1.6" }}>Tap any battery to expand and learn more. Your choice affects maintenance, usable capacity, and system longevity.</div>
          {renderHelpBanner()}

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
                style={{ background: isSel?`rgba(${hexToRgb(bat.color)},0.07)`:T.card, border: isSel?`2px solid ${bat.color}`:`1px solid ${T.cardBorder}`, borderRadius:"16px", marginBottom:"10px", overflow:"hidden", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"14px", padding: isDesktop?"16px 20px":"14px 16px" }}>
                  <span style={{ fontSize:"24px" }}>{bat.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:"700", fontSize: isDesktop?"15px":"14px", color:T.sectionTitle }}>{bat.name}</div>
                    <div style={{ fontSize:"12px", color:T.label, marginTop:"1px" }}>{bat.lifespan} · {bat.cycles}</div>
                  </div>
                  <span style={{ fontSize:"11px", padding:"4px 10px", borderRadius:"20px", background:`rgba(${hexToRgb(bat.color)},0.1)`, color:bat.color, fontWeight:"700" }}>{bat.short}</span>
                  <span style={{ color:T.label, fontSize:"13px", marginLeft:"4px" }}>{isExp?"▲":"▼"}</span>
                </div>
                {isExp && (
                  <div style={{ padding:"0 20px 18px", borderTop:`1px solid ${T.batExpBdr}` }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ background:T.educNoteBg, border:`1px solid ${T.educNoteBdr}`, borderRadius:"12px", padding:"12px 14px", fontSize:"13px", color:T.educNoteClr, lineHeight:"1.65", margin:"14px 0" }}>
                      📚 <strong style={{ color:"#fbbf24" }}>Learn: </strong>{bat.educationNote}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns: isDesktop?"repeat(4,1fr)":"1fr 1fr", gap:"8px", marginBottom:"14px" }}>
                      {[["Depth of Discharge",`${bat.dod*100}%`],["Efficiency",`${bat.efficiency*100}%`],["Lifespan",bat.lifespan],["Cycles",bat.cycles]].map(([l,v]) => (
                        <div key={l} style={{ background:T.metaItemBg, borderRadius:"10px", padding:"12px" }}>
                          <div style={{ fontSize:"10px", color:T.metaLbl, marginBottom:"4px" }}>{l}</div>
                          <div style={{ fontSize:"14px", fontWeight:"700", color:T.metaVal }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
                      <div style={{ background:T.proCardBg, border:`1px solid ${T.proCardBdr}`, borderRadius:"12px", padding:"12px 14px" }}>
                        <div style={{ fontSize:"12px", fontWeight:"700", color:"#34d399", marginBottom:"8px" }}>✅ Pros</div>
                        {bat.pros.map((p,i) => <div key={i} style={{ fontSize:"12px", color:T.proConsItem, marginBottom:"5px", lineHeight:"1.4" }}>• {p}</div>)}
                      </div>
                      <div style={{ background:T.conCardBg, border:`1px solid ${T.conCardBdr}`, borderRadius:"12px", padding:"12px 14px" }}>
                        <div style={{ fontSize:"12px", fontWeight:"700", color:"#f87171", marginBottom:"8px" }}>⚠️ Cons</div>
                        {bat.cons.map((c,i) => <div key={i} style={{ fontSize:"12px", color:T.proConsItem, marginBottom:"5px", lineHeight:"1.4" }}>• {c}</div>)}
                      </div>
                    </div>
                    <div style={{ fontSize:"13px", color:T.bestFor, marginBottom:"14px", fontStyle:"italic" }}>🎯 Best for: {bat.bestFor}</div>
                    <button onClick={() => setBatteryType(bat.id)} style={{ width:"100%", padding:"11px", borderRadius:"12px", background:`rgba(${hexToRgb(bat.color)},0.1)`, border:`1px solid ${bat.color}`, color:bat.color, fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                      {isSel ? "✓ Selected" : `Select ${bat.name}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div style={infoBox}>
            🏆 Currently selected: <strong style={{ color:selBattery?.color }}>{selBattery?.name}</strong>
          </div>

          <button style={primBtn({})} onClick={compute}>Calculate My Solar Setup →</button>
        </>
      );
    }

    // ── STEP 4 ──
    if (step === 4 && results) {
      const r = results;
      const calcArgs = { appliances, country, location, autonomyDays, batteryType, systemVoltage, batteryTypes: BATTERY_TYPES, countries: COUNTRIES };
      const altAutonomy = autonomyDays < 4 ? calcResults({ ...calcArgs, autonomyDays: autonomyDays + 1 }) : null;
      const altVoltage = systemVoltage < 48 ? calcResults({ ...calcArgs, systemVoltage: systemVoltage === 12 ? 24 : 48 }) : null;
      const altLithium = batteryType !== "lithium" ? calcResults({ ...calcArgs, batteryType: "lithium" }) : null;
      const heavyLoads = appliances.filter((a) => a.watts >= 500).map((a) => a.name).slice(0,3);
      const mustRunLoads = appliances.filter((a) => (a.priority || "must") === "must");
      const niceLoads = appliances.filter((a) => a.priority === "nice");
      const confidenceWarnings = [
        "This is an estimate. Ask an installer to confirm load test, cable size, roof space, and battery chemistry.",
        heavyLoads.length ? `High-draw loads detected: ${heavyLoads.join(", ")}. Confirm inverter surge rating before installation.` : null,
        acDaily ? "Daily AC use needs careful inverter surge sizing, dedicated circuits, and realistic runtime expectations." : null,
        r.battery.parallelStrings > 3 && batteryType !== "lithium" ? `${r.battery.parallelStrings} parallel battery strings exceeds the recommended maximum of 3 for lead-acid banks. Consider a higher system voltage, larger batteries, or lithium.` : null,
        batteryType === "lithium" ? "Lithium banks are commonly sold as single 24V or 48V rack units — the 12V module count shown is an equivalent-capacity guide, not a shopping list." : null,
      ].filter(Boolean);
      const nextAction = installerPreference === "diy"
          ? "Next best action: create a parts list and have a licensed technician verify cable sizing, breakers, grounding, and battery protection."
          : "Next best action: request 3 installer quotes using the checklist below and compare equipment brands line by line.";
      const maintenanceReminders = [
        batteryType === "flooded" ? "Flooded batteries: check water level monthly and install in a ventilated area." : null,
        batteryType !== "lithium" ? "Lead-acid batteries: avoid deep discharge and check terminals for corrosion." : "Lithium batteries: confirm the inverter/charger supports LiFePO₄ charging profiles.",
        "Panels: clean dust and bird droppings every 4–8 weeks, especially in dry season.",
        "System: test breakers, fuses, and cable heat after installation and after major load changes.",
      ].filter(Boolean);
      const quoteChecklist = [
        "Panel brand, wattage, warranty, and total array size",
        "Battery chemistry, usable capacity, warranty, and expected service life",
        "Inverter continuous rating, surge rating, and charger compatibility",
        "MPPT controller rating, breakers, fuses, earthing, and cable sizes",
        "Mounting structure, roof inspection, labour, after-sales support, and timeline",
      ];
      const reportSections = { confidenceWarnings, quoteChecklist, maintenanceReminders };
      return (
        <>
          <div style={{ fontSize: isDesktop?"26px":"22px", fontWeight:"800", color:T.sectionTitle, marginBottom:"4px", letterSpacing:"-0.5px" }}>Your Solar Setup</div>
          {renderHelpBanner()}
          <div style={{ fontSize:"14px", color:T.sectionSub, marginBottom:"24px", lineHeight:"1.6" }}>
            Based on {r.totalWh.toLocaleString()} Wh/day in {location}, {cd?.name} {cd?.flag}
            {r.zone && <span style={{ color:T.label }}> · {r.zone}</span>}.
          </div>

          {/* Result grid */}
          <div style={{ ...labelSt, marginBottom:"12px" }}>Recommended System</div>
          <div style={{ display:"grid", gridTemplateColumns: isDesktop?"repeat(2,1fr)":"repeat(1,1fr)", gap:"12px", marginBottom:"24px" }}>
            {[
              { color:"#fbbf24", icon:"🔋", label:"Battery Bank",      value:`${r.battery.physicalBatteryCount} × ${r.battery.ah}Ah`, sub:`${r.battery.baseVoltage}V batteries · ${r.battery.seriesCount}S × ${r.battery.parallelStrings}P` },
              { color:"#10b981", icon:"☀️", label:"Solar Panels",      value:`${r.panels.count} × ${r.panels.watts}W`, sub:`${r.panels.totalWatts}W array · ~${r.panels.roofAreaSqm}sqm roof space` },
              { color:"#3b82f6", icon:"⚡", label:"Inverter Size",      value:`${r.inverter}W`, sub:`${r.peakWatts}W running · ${r.surgeWatts}W surge estimate` },
              { color:"#8b5cf6", icon:"🔌", label:"Charge Controller", value:`${r.chargeController}A`, sub:"MPPT recommended" },
              { color:"#14b8a6", icon:"🎯", label:"Load Priority", value:`${mustRunLoads.length} must-run`, sub:`${niceLoads.length} nice-to-have load${niceLoads.length!==1?"s":""}` },
            ].map((c) => (
              <div key={c.label} style={{ background:`rgba(${hexToRgb(c.color)},0.07)`, border:`1px solid rgba(${hexToRgb(c.color)},0.2)`, borderRadius:"18px", padding: isDesktop?"20px":"16px" }}>
                <div style={{ fontSize:"28px", marginBottom:"10px" }}>{c.icon}</div>
                <div style={{ fontSize:"11px", color:T.resultLbl, marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.8px" }}>{c.label}</div>
                <div style={{ fontSize: isDesktop?"24px":"20px", fontWeight:"800", color:c.color }}>{c.value}</div>
                <div style={{ fontSize:"12px", color:T.resultLbl, marginTop:"4px" }}>{c.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }}>
            {[
              { key:"why", label:"Why this recommendation?" },
              { key:"whatif", label:"What if I change this?" },
            ].map((item) => (
              <button key={item.key} onClick={() => setAssistantMode(item.key)} style={{ flex:1, minWidth:"140px", padding:"12px 14px", borderRadius:"14px", cursor:"pointer", border:item.key===assistantMode?`2px solid #fbbf24`:`1px solid ${T.cardBorder}`, background:item.key===assistantMode?"rgba(251,191,36,0.12)":T.card, color:T.sectionTitle, fontWeight:item.key===assistantMode?"700":"600", fontSize:"13px", fontFamily:"'Outfit',sans-serif" }}>
                {item.label}
              </button>
            ))}
          </div>

          {assistantMode === "whatif" ? (
            <div style={{ background:T.infoBoxBg, border:`1px solid ${T.infoBoxBdr}`, borderRadius:"16px", padding:"18px", marginBottom:"20px", color:T.infoBoxClr, lineHeight:"1.75" }}>
              <div style={{ fontSize:"13px", fontWeight:"700", marginBottom:"10px" }}>Try these changes to see how the system shifts:</div>
              {altAutonomy && (
                <div style={{ marginBottom:"10px" }}>
                  <div style={{ fontWeight:"700", color:"#d97706" }}>Add 1 more backup day</div>
                  <div style={{ fontSize:"13px" }}>Your battery bank would grow to {altAutonomy.battery.physicalBatteryCount} × {altAutonomy.battery.ah}Ah batteries ({altAutonomy.battery.wiringText}), and the panel array would become {altAutonomy.panels.count} × {altAutonomy.panels.watts}W.</div>
                </div>
              )}
              {altVoltage && (
                <div style={{ marginBottom:"10px" }}>
                  <div style={{ fontWeight:"700", color:"#10b981" }}>Move to {altVoltage.systemVoltage}V</div>
                  <div style={{ fontSize:"13px" }}>A {altVoltage.systemVoltage}V system could reduce current and wiring complexity. It would need {altVoltage.battery.physicalBatteryCount} × {altVoltage.battery.ah}Ah batteries ({altVoltage.battery.wiringText}) and {altVoltage.panels.count} × {altVoltage.panels.watts}W panels.</div>
                </div>
              )}
              {altLithium && (
                <div style={{ marginBottom:"10px" }}>
                  <div style={{ fontWeight:"700", color:"#10b981" }}>Choose Lithium</div>
                  <div style={{ fontSize:"13px" }}>A LiFePO₄ battery offers more usable capacity and often fewer battery modules. This setup would need {altLithium.battery.physicalBatteryCount} × {altLithium.battery.ah}Ah batteries.</div>
                </div>
              )}
              {heavyLoads.length > 0 && (
                <div>
                  <div style={{ fontWeight:"700", color:"#3b82f6" }}>Heavy loads matter</div>
                  <div style={{ fontSize:"13px" }}>Your heavier appliances like {heavyLoads.join(", ")} are the main drivers of inverter and panel size. Reducing their use can improve runtime and reduce required system capacity.</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:T.explainBg, border:`1px solid ${T.explainBdr}`, borderRadius:"14px", padding: isDesktop?"18px 20px":"14px", fontSize:"13px", color:T.explainClr, lineHeight:"1.75", marginBottom:"20px" }}>
              <strong style={{ color:"#fbbf24" }}>🔋 Battery:</strong> {r.totalWh.toLocaleString()} Wh ÷ {Math.round(INVERTER_EFFICIENCY*100)}% inverter efficiency × {autonomyDays} day(s), adjusted for {r.bat.name}'s {r.bat.dod*100}% DoD → {r.battery.physicalBatteryCount} × {r.battery.ah}Ah {r.battery.baseVoltage}V batteries ({r.battery.wiringText}).<br /><br />
              <strong style={{ color:"#10b981" }}>☀️ Panels:</strong> {r.totalWh.toLocaleString()} Wh ÷ {Math.round(INVERTER_EFFICIENCY*100)}% inverter efficiency ÷ {r.bat.efficiency*100}% battery efficiency ÷ {r.psh} PSH × 1.25 safety factor = {r.panels.totalWatts}W → {r.panels.count} × {r.panels.watts}W panels, needing roughly {r.panels.roofAreaSqm}sqm clear roof space.<br /><br />
              <strong style={{ color:"#3b82f6" }}>⚡ Inverter:</strong> Running peak {r.peakWatts}W, surge estimate {r.surgeWatts}W + 25% headroom = {r.inverter}W inverter.<br /><br />
              <strong style={{ color:"#8b5cf6" }}>🔌 Charge Controller:</strong> {r.panels.totalWatts}W ÷ {r.systemVoltage}V × 1.25 = {r.chargeController}A MPPT.
            </div>
          )}

          <div style={infoBox}>
            📋 <strong style={{ color:"#fbbf24" }}>Installation Tips</strong><br />
            • Panels should face <strong>south</strong>, angled at your city's latitude<br />
            • Use copper cables rated for your system's current<br />
            • Install a DC breaker between panels and charge controller<br />
            • Keep batteries cool and ventilated
          </div>
          <div style={{ ...infoBox, marginTop:"10px" }}>
            🔋 <strong style={{ color:"#fbbf24" }}>Battery Wiring Layout</strong><br />
            Use <strong>{r.battery.physicalBatteryCount} physical {r.battery.baseVoltage}V batteries</strong>: {r.battery.wiringText}. Installer must confirm final series/parallel wiring, fuse rating, and cable size.
          </div>
          <div style={{ ...infoBox, marginTop:"10px" }}>
            🏠 <strong style={{ color:"#fbbf24" }}>Roof Space Estimate</strong><br />
            Plan for roughly <strong>{r.panels.roofAreaSqm} square meters</strong> of clear, unshaded roof space for {r.panels.count} panels. Add service access space around the mounting rails.
          </div>
          <div style={{ ...infoBox, marginTop:"10px", background:"rgba(239,68,68,0.06)", borderColor:"rgba(239,68,68,0.18)" }}>
            ⚠️ <strong style={{ color:"#ef4444" }}>Disclaimer:</strong> Sizing estimate only. Installer must verify on site.
          </div>
          <div style={{ ...card, marginTop:"16px" }}>
            <div style={{ fontSize:"14px", fontWeight:"800", color:"#d97706", marginBottom:"8px" }}>Best Next Action</div>
            <div style={{ fontSize:"13px", color:T.sectionSub, lineHeight:"1.7" }}>{nextAction}</div>
          </div>

          <div style={{ ...card, marginTop:"4px" }}>
            <div style={{ fontSize:"14px", fontWeight:"800", color:T.sectionTitle, marginBottom:"10px" }}>Confidence Warnings</div>
            {confidenceWarnings.map((item) => (
              <div key={item} style={{ fontSize:"13px", color:T.sectionSub, lineHeight:"1.6", marginBottom:"7px" }}>• {item}</div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isDesktop?"1fr 1fr":"1fr", gap:"12px", marginTop:"4px" }}>
            <div style={card}>
              <div style={{ fontSize:"14px", fontWeight:"800", color:T.sectionTitle, marginBottom:"10px" }}>Quote Comparison Checklist</div>
              {quoteChecklist.map((item) => (
                <label key={item} style={{ display:"flex", gap:"8px", alignItems:"flex-start", fontSize:"13px", color:T.sectionSub, lineHeight:"1.5", marginBottom:"8px" }}>
                  <input type="checkbox" style={{ marginTop:"3px" }} />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <div style={card}>
              <div style={{ fontSize:"14px", fontWeight:"800", color:T.sectionTitle, marginBottom:"10px" }}>Maintenance Reminders</div>
              {maintenanceReminders.map((item) => (
                <div key={item} style={{ fontSize:"13px", color:T.sectionSub, lineHeight:"1.6", marginBottom:"8px" }}>• {item}</div>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns: isDesktop?"repeat(3,1fr)":"1fr", gap:"10px", marginTop:"4px" }}>
            <button onClick={() => shareRecommendation(r, reportSections)} style={{ ...secBtn, marginTop:0, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)", color:"#059669", fontWeight:"800" }}>Share / Copy Summary</button>
            <button onClick={() => downloadRecommendation(r, reportSections)} style={{ ...secBtn, marginTop:0, background:"rgba(245,158,11,0.09)", border:"1px solid rgba(245,158,11,0.28)", color:"#d97706", fontWeight:"800" }}>Download Summary</button>
            <button onClick={() => window.print()} style={{ ...secBtn, marginTop:0, background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.22)", color:"#2563eb", fontWeight:"800" }}>Export as PDF</button>
          </div>

          <button style={primBtn({})} onClick={resetCalculation}>↺ Start New Calculation</button>
        </>
      );
    }

    return null;
  }

  // ── Root render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:T.appBg, fontFamily:"'Outfit',sans-serif", color:T.appColor }}>
      {/* ── Toast ── */}
      {toast && (
        <div role="status" aria-live="polite" style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", zIndex:200, background: darkMode?"#0d1b2a":"#111827", color:"#fff", padding:"12px 20px", borderRadius:"12px", fontSize:"13px", fontWeight:"600", boxShadow:"0 8px 30px rgba(0,0,0,0.35)", maxWidth:"90vw" }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ background:T.headerBg, borderBottom:`1px solid ${T.headerBorder}`, backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto", padding: isDesktop?"0 40px":"0 20px", height: isDesktop?"72px":"58px", display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ fontSize: isDesktop?"34px":"28px", lineHeight:1 }}>☀️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize: isDesktop?"20px":"18px", fontWeight:"800", color:"#f59e0b", letterSpacing:"-0.4px" }}>SolarSizer</div>
            <div style={{ fontSize:"11px", color:T.headerSub, marginTop:"1px" }}>Solar Setup Calculator & Guide</div>
          </div>

          {isDesktop && (
            <div style={{ fontSize:"13px", color:T.label, borderRight:`1px solid ${T.divider}`, paddingRight:"20px", marginRight:"6px" }}>
              {steps[step]} — Step {step + 1} of {steps.length}
            </div>
          )}

          <button aria-label={showStepHelp ? "Hide help" : "Show help"} onClick={() => setShowStepHelp(!showStepHelp)} style={{ background:T.toggleBg, border:`1px solid ${T.toggleBdr}`, borderRadius:"20px", padding: isDesktop?"7px 16px":"6px 12px", cursor:"pointer", color:T.toggleClr, fontSize:"13px", display:"flex", alignItems:"center", gap:"6px", fontWeight:"600", flexShrink:0, fontFamily:"'Outfit',sans-serif", marginRight:"8px" }}>
            ❓ {isDesktop && <span>{showStepHelp ? "Hide Help" : "Show Help"}</span>}
          </button>
          <button aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDarkMode(!darkMode)} style={{ background:T.toggleBg, border:`1px solid ${T.toggleBdr}`, borderRadius:"20px", padding: isDesktop?"7px 16px":"6px 12px", cursor:"pointer", color:T.toggleClr, fontSize:"13px", display:"flex", alignItems:"center", gap:"6px", fontWeight:"600", flexShrink:0, fontFamily:"'Outfit',sans-serif" }}>
            {darkMode ? "☀️" : "🌙"} {isDesktop && <span>{darkMode ? "Light" : "Dark"}</span>}
          </button>
        </div>
      </header>

      {/* ── Page body ── */}
      {isDesktop ? (
        // ── Desktop: two-column ──
        <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 40px 48px" }}>
          {renderStepper()}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"28px", alignItems:"start" }}>
            <div>{renderStepContent()}</div>
            <div style={{ position:"sticky", top:"90px" }}>{renderSummaryPanel()}</div>
          </div>
        </div>
      ) : (
        // ── Mobile: single column ──
        <>
          <div style={{ padding:"0 20px" }}>{renderStepper()}</div>
          <div style={{ padding:"20px 20px 40px" }}>{renderStepContent()}</div>
        </>
      )}

    </div>
  );
}
