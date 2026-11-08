import { useState, useEffect } from "react";
import {
  appliancePeakWatts,
  applianceWh,
  buildShareText,
  calcResults,
  clampNumber,
  getRecommendedVoltage,
} from "./solarCalculations";
import {
  APPLIANCES,
  BATTERY_TYPES,
  INSTALLER_PREFS,
  LOAD_PROFILES,
  PROPERTY_TYPES,
} from "./data";
import { getTheme } from "./theme";
import { makeUiStyles } from "./uiStyles";
import {
  browserStorage,
  clearWizardState,
  loadWizardState,
  saveWizardState,
} from "./statePersistence";
import HelpBanner from "./components/HelpBanner";
import Stepper from "./components/Stepper";
import SummaryPanel from "./components/SummaryPanel";
import StepGoals from "./steps/StepGoals";
import StepAppliances from "./steps/StepAppliances";
import StepBackup from "./steps/StepBackup";
import StepBattery from "./steps/StepBattery";
import StepResults from "./steps/StepResults";

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

function calcArgsFor(state) {
  return {
    appliances: state.appliances,
    sunHours: state.sunHours,
    autonomyDays: state.autonomyDays,
    batteryType: state.batteryType,
    systemVoltage: state.systemVoltage,
    batteryTypes: BATTERY_TYPES,
  };
}

export default function SolarCalculator() {
  const [restored] = useState(() => {
    const storage = typeof window !== "undefined" ? browserStorage() : null;
    return storage ? loadWizardState(storage) : null;
  });
  const restoredHasLoad = restored
    ? restored.appliances.reduce((s, a) => s + applianceWh(a), 0) > 0
    : false;

  const [step, setStep] = useState(() => (restored?.step === 4 && !restoredHasLoad ? 3 : restored?.step ?? 0));
  const [sunHours, setSunHours] = useState(restored?.sunHours ?? 5);
  const [appliances, setAppliances] = useState(restored?.appliances ?? []);
  const [customName, setCustomName] = useState("");
  const [customWatts, setCustomWatts] = useState("");
  const [customHours, setCustomHours] = useState("");
  const [backupTarget, setBackupTarget] = useState(restored?.backupTarget ?? "overnight");
  const [propertyType, setPropertyType] = useState(restored?.propertyType ?? "flat");
  const [installerPreference, setInstallerPreference] = useState(restored?.installerPreference ?? "compare");
  const [fridgeOvernight, setFridgeOvernight] = useState(restored?.fridgeOvernight ?? true);
  const [acDaily, setAcDaily] = useState(restored?.acDaily ?? false);
  const [autonomyDays, setAutonomyDays] = useState(restored?.autonomyDays ?? 1);
  const [batteryType, setBatteryType] = useState(restored?.batteryType ?? "agm");
  const [systemVoltage, setSystemVoltage] = useState(restored?.systemVoltage ?? 24);
  const [expandedBattery, setExpandedBattery] = useState(restored?.expandedBattery ?? "agm");
  // Results are derived live from the current inputs, so the sidebar estimate
  // and the Results step always recalculate as the user edits — no stale snapshot.
  const [addingCustom, setAddingCustom] = useState(false);
  const [activeProfile, setActiveProfile] = useState(restored?.activeProfile ?? null);
  const [darkMode, setDarkMode] = useState(restored?.darkMode ?? false);
  const [showStepHelp, setShowStepHelp] = useState(restored?.showStepHelp ?? true);
  const [assistantMode, setAssistantMode] = useState("why");
  const [windowWidth, setWindowWidth] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth : 1200)
  );
  const [toast, setToast] = useState(null);
  const [voltageManuallySet, setVoltageManuallySet] = useState(restored?.voltageManuallySet ?? false);
  const [backupSource, setBackupSource] = useState(restored?.backupSource ?? "petrol");
  const [backupPrice, setBackupPrice] = useState(restored?.backupPrice ?? 1000);
  const [systemCost, setSystemCost] = useState(restored?.systemCost ?? 0);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);


  // Persist wizard state so a reload resumes where the user left off.
  useEffect(() => {
    const storage = browserStorage();
    if (!storage) return;
    saveWizardState(storage, {
      step, sunHours, appliances, backupTarget, propertyType,
      installerPreference, fridgeOvernight, acDaily, autonomyDays, batteryType,
      systemVoltage, expandedBattery, activeProfile, darkMode, showStepHelp,
      voltageManuallySet, backupSource, backupPrice, systemCost,
    });
  }, [step, sunHours, appliances, backupTarget, propertyType, installerPreference, fridgeOvernight, acDaily, autonomyDays, batteryType, systemVoltage, expandedBattery, activeProfile, darkMode, showStepHelp, voltageManuallySet, backupSource, backupPrice, systemCost]);

  const isDesktop = windowWidth >= 900;
  const totalWh = appliances.reduce((s, a) => s + applianceWh(a), 0);
  const liveResults = totalWh > 0
    ? calcResults(calcArgsFor({ appliances, sunHours, autonomyDays, batteryType, systemVoltage }))
    : null;
  const totalApplianceUnits = appliances.reduce((s, a) => s + (a.qty || 1), 0);

  function applyProfile(profile) {
    const loaded = profile.appliances
      .map((p) => { const b = APPLIANCES.find((a) => a.id === p.id); return b ? { ...b, hoursPerDay: p.hoursPerDay, qty: p.qty || 1, priority: "must" } : null; })
      .filter(Boolean);
    setAppliances(loaded);
    setActiveProfile(profile.id);
  }

  function clearProfile() { setAppliances([]); setActiveProfile(null); }

  function addAppliance(appl) {
    const existing = appliances.find((a) => a.id === appl.id);
    if (existing) {
      updateAppliance(appl.id, "qty", (existing.qty || 1) + 1);
      setActiveProfile(null);
      return;
    }
    setAppliances([...appliances, { ...appl, hoursPerDay: appl.defaultHours ?? 4, qty: 1, priority: "must" }]);
    setActiveProfile(null);
  }
  function decrementAppliance(id) {
    const existing = appliances.find((a) => a.id === id);
    if (!existing) return;
    if ((existing.qty || 1) <= 1) removeAppliance(id);
    else updateAppliance(id, "qty", (existing.qty || 1) - 1);
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
      sunHours,
      backupTargetLabel: getBackupTargetLabel(),
      propertyTypeLabel: getPropertyTypeLabel(),
      installerPreferenceLabel: getInstallerPreferenceLabel(),
      ...reportSections,
    });
  }

  async function shareRecommendation(r, reportSections) {
    const text = createExportText(r, reportSections);
    if (navigator.share) {
      try {
        await navigator.share({ title: "SolarSizer recommendation", text });
        setToast("✅ Summary shared");
        return;
      } catch (err) {
        if (err?.name === "AbortError") {
          setToast("Share cancelled — use Copy or Download instead");
          return;
        }
      }
    }
    const ok = await copyTextToClipboard(text);
    setToast(ok ? "✅ Summary copied to clipboard" : "⚠️ Copy failed — use Download instead");
  }

  function handleBackupSourceChange(source) {
    setBackupSource(source);
    setBackupPrice(source === "grid" ? 225 : source === "diesel" ? 1200 : 1000);
  }

  function adjustAutonomy(delta) {
    setAutonomyDays((d) => Math.min(6, Math.max(1, d + delta)));
  }

  function whatsAppRecommendation(r, reportSections) {
    const text = createExportText(r, reportSections);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setToast("✅ Opening WhatsApp with your summary");
  }

  function downloadRecommendation(r, reportSections) {
    const text = createExportText(r, reportSections);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solarsizer-recommendation.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast("✅ Summary downloaded");
  }


  function compute() {
    if (totalWh <= 0) {
      setToast("⚠️ Add at least one appliance with usage hours first");
      return;
    }
    setStep(4);
  }

  function resetCalculation() {
    const storage = browserStorage();
    if (storage) clearWizardState(storage);
    setStep(0);
    setSunHours(5);
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
    setAddingCustom(false);
    setActiveProfile(null);
    setAssistantMode("why");
    setVoltageManuallySet(false);
    setBackupSource("petrol");
    setBackupPrice(1000);
    setSystemCost(0);
    setShowMobileSummary(false);
    setToast(null);
  }

  const T = getTheme(darkMode);
  const styles = makeUiStyles(T);
  const steps = ["Goals", "Appliances", "Backup", "Battery", "Results"];
  const selBattery = BATTERY_TYPES.find((b) => b.id === batteryType);
  const selProfile = LOAD_PROFILES.find((p) => p.id === activeProfile);

  const helpBanner = (
    <HelpBanner
      styles={styles}
      step={step}
      showStepHelp={showStepHelp}
      darkMode={darkMode}
      onHide={() => setShowStepHelp(false)}
    />
  );

  const summaryPanel = (
    <SummaryPanel
      T={T}
      darkMode={darkMode}
      step={step}
      steps={steps}
      sunHours={sunHours}
      backupTargetLabel={getBackupTargetLabel()}
      propertyTypeLabel={getPropertyTypeLabel()}
      installerPreferenceLabel={getInstallerPreferenceLabel()}
      selProfile={selProfile}
      appliances={appliances}
      totalApplianceUnits={totalApplianceUnits}
      totalWh={totalWh}
      systemVoltage={systemVoltage}
      autonomyDays={autonomyDays}
      selBattery={selBattery}
      results={liveResults}
    />
  );

  function renderStepContent() {
    if (step === 0) {
      return (
        <StepGoals
          styles={styles} T={T} isDesktop={isDesktop} helpBanner={helpBanner}
          backupTarget={backupTarget} setBackupTarget={setBackupTarget} setAutonomyDays={setAutonomyDays}
          propertyType={propertyType} setPropertyType={setPropertyType}
          installerPreference={installerPreference} setInstallerPreference={setInstallerPreference}
          fridgeOvernight={fridgeOvernight} setFridgeOvernight={setFridgeOvernight}
          acDaily={acDaily} setAcDaily={setAcDaily}
          sunHours={sunHours} setSunHours={setSunHours}
          onContinue={() => setStep(1)}
        />
      );
    }
    if (step === 1) {
      return (
        <StepAppliances
          styles={styles} T={T} isDesktop={isDesktop} helpBanner={helpBanner}
          appliances={appliances} activeProfile={activeProfile} selProfile={selProfile}
          fridgeOvernight={fridgeOvernight} acDaily={acDaily}
          addingCustom={addingCustom} setAddingCustom={setAddingCustom}
          customName={customName} setCustomName={setCustomName}
          customWatts={customWatts} setCustomWatts={setCustomWatts}
          customHours={customHours} setCustomHours={setCustomHours}
          totalWh={totalWh} totalApplianceUnits={totalApplianceUnits}
          onBack={() => setStep(0)}
          onApplyProfile={applyProfile} onClearProfile={clearProfile}
          onAddAppliance={addAppliance} onDecrementAppliance={decrementAppliance} onRemoveAppliance={removeAppliance}
          onUpdateAppliance={updateAppliance} onAddCustomAppliance={addCustomAppliance}
          onContinue={() => {
            if (!voltageManuallySet) {
              const pw = appliances.reduce((s, a) => s + appliancePeakWatts(a), 0);
              setSystemVoltage(getRecommendedVoltage(totalWh, pw));
            }
            setStep(2);
          }}
        />
      );
    }
    if (step === 2) {
      return (
        <StepBackup
          styles={styles} T={T} isDesktop={isDesktop} helpBanner={helpBanner}
          appliances={appliances} totalWh={totalWh}
          autonomyDays={autonomyDays} setAutonomyDays={setAutonomyDays}
          systemVoltage={systemVoltage} setSystemVoltage={setSystemVoltage}
          setVoltageManuallySet={setVoltageManuallySet}
          onUpdateAppliance={updateAppliance} onRemoveAppliance={removeAppliance}
          backupSource={backupSource} onBackupSourceChange={handleBackupSourceChange}
          backupPrice={backupPrice} setBackupPrice={setBackupPrice}
          onBack={() => setStep(1)} onContinue={() => setStep(3)}
        />
      );
    }
    if (step === 3) {
      return (
        <StepBattery
          styles={styles} T={T} isDesktop={isDesktop} helpBanner={helpBanner}
          batteryType={batteryType} setBatteryType={setBatteryType}
          expandedBattery={expandedBattery} setExpandedBattery={setExpandedBattery}
          selBattery={selBattery}
          onBack={() => setStep(2)} onCalculate={compute}
        />
      );
    }
    if (step === 4 && liveResults) {
      return (
        <StepResults
          styles={styles} T={T} isDesktop={isDesktop} helpBanner={helpBanner}
          results={liveResults} appliances={appliances}
          sunHours={sunHours}
          autonomyDays={autonomyDays} batteryType={batteryType} systemVoltage={systemVoltage}
          acDaily={acDaily} installerPreference={installerPreference}
          assistantMode={assistantMode} setAssistantMode={setAssistantMode}
          backupSource={backupSource} backupPrice={backupPrice}
          systemCost={systemCost} setSystemCost={setSystemCost}
          onAdjustAutonomy={adjustAutonomy}
          onBack={() => setStep(3)} onEditStep={setStep}
          onShare={shareRecommendation} onWhatsApp={whatsAppRecommendation} onDownload={downloadRecommendation}
          onReset={resetCalculation}
        />
      );
    }
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: T.appBg, fontFamily: "'Outfit',sans-serif", color: T.appColor }}>
      {toast && (
        <div role="status" aria-live="polite" style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: darkMode ? "#0d1b2a" : "#111827", color: "#fff", padding: "12px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: "600", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", maxWidth: "90vw" }}>
          {toast}
        </div>
      )}

      <header style={{ background: T.headerBg, borderBottom: `1px solid ${T.headerBorder}`, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: isDesktop ? "0 40px" : "0 20px", height: isDesktop ? "72px" : "58px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ fontSize: isDesktop ? "34px" : "28px", lineHeight: 1 }}>☀️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isDesktop ? "20px" : "18px", fontWeight: "800", color: "#f59e0b", letterSpacing: "-0.4px" }}>SolarSizer</div>
            <div style={{ fontSize: "11px", color: T.headerSub, marginTop: "1px" }}>Solar Setup Calculator & Guide</div>
          </div>

          {isDesktop && (
            <div style={{ fontSize: "13px", color: T.label, borderRight: `1px solid ${T.divider}`, paddingRight: "20px", marginRight: "6px" }}>
              {steps[step]} — Step {step + 1} of {steps.length}
            </div>
          )}

          <button aria-label={showStepHelp ? "Hide help" : "Show help"} onClick={() => setShowStepHelp(!showStepHelp)} style={{ background: T.toggleBg, border: `1px solid ${T.toggleBdr}`, borderRadius: "20px", padding: isDesktop ? "7px 16px" : "6px 12px", cursor: "pointer", color: T.toggleClr, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", flexShrink: 0, fontFamily: "'Outfit',sans-serif", marginRight: "8px" }}>
            ❓ {isDesktop && <span>{showStepHelp ? "Hide Help" : "Show Help"}</span>}
          </button>
          <button aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDarkMode(!darkMode)} style={{ background: T.toggleBg, border: `1px solid ${T.toggleBdr}`, borderRadius: "20px", padding: isDesktop ? "7px 16px" : "6px 12px", cursor: "pointer", color: T.toggleClr, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>
            {darkMode ? "☀️" : "🌙"} {isDesktop && <span>{darkMode ? "Light" : "Dark"}</span>}
          </button>
        </div>
      </header>

      {isDesktop ? (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 48px" }}>
          <Stepper T={T} steps={steps} step={step} isDesktop={isDesktop} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "28px", alignItems: "start" }}>
            <div>{renderStepContent()}</div>
            <div style={{ position: "sticky", top: "90px" }}>{summaryPanel}</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: "0 20px" }}>
            <Stepper T={T} steps={steps} step={step} isDesktop={isDesktop} />
            <button
              aria-expanded={showMobileSummary}
              onClick={() => setShowMobileSummary(!showMobileSummary)}
              style={{ width: "100%", marginTop: "12px", padding: "10px 14px", borderRadius: "12px", background: T.card, border: `1px solid ${T.cardBorder}`, color: T.sectionTitle, fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}
            >
              📋 Setup Summary {showMobileSummary ? "▲" : "▼"}
            </button>
            {showMobileSummary && <div style={{ marginTop: "10px" }}>{summaryPanel}</div>}
          </div>
          <div style={{ padding: "20px 20px 40px" }}>{renderStepContent()}</div>
        </>
      )}
    </div>
  );
}
