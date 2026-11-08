import { BATTERY_TYPES } from "../data";
import { INVERTER_EFFICIENCY, INVERTER_POWER_FACTOR, PANELS_PER_RACK_KIT, calcResults, calcRoi, formatInverterVA } from "../solarCalculations";
import Faq from "../components/Faq";
import { hexToRgb } from "../theme";

export default function StepResults({
  styles, T, isDesktop, helpBanner,
  results: r, appliances, sunHours, autonomyDays, batteryType,
  systemVoltage, installerPreference, assistantMode, setAssistantMode,
  backupSource, backupPrice, systemCost, setSystemCost, onAdjustAutonomy,
  onBack, onEditStep, onShare, onWhatsApp, onDownload, onReset,
}) {
  const { card, labelSt, primBtn, secBtn, infoBox, numInput } = styles;
  const roi = calcRoi({ totalWh: r.totalWh, backupSource, backupPrice, systemCost });
  const sourceLabel = backupSource === "grid" ? "Grid electricity" : backupSource === "diesel" ? "Diesel Generator" : "Petrol Generator";
  const naira = (n) => `₦${Math.round(n).toLocaleString()}`;
  const calcArgs = { appliances, sunHours, autonomyDays, batteryType, systemVoltage, batteryTypes: BATTERY_TYPES };
  const altAutonomy = autonomyDays < 4 ? calcResults({ ...calcArgs, autonomyDays: autonomyDays + 1 }) : null;
  const altVoltage = systemVoltage < 48 ? calcResults({ ...calcArgs, systemVoltage: systemVoltage === 12 ? 24 : 48 }) : null;
  const altLithium = batteryType !== "lithium" ? calcResults({ ...calcArgs, batteryType: "lithium" }) : null;
  const heavyLoads = appliances.filter((a) => a.watts >= 500).map((a) => a.name).slice(0, 3);
  const mustRunLoads = appliances.filter((a) => (a.priority || "must") === "must");
  const niceLoads = appliances.filter((a) => a.priority === "nice");
  const confidenceWarnings = [
    "This is an estimate. Ask an installer to confirm load test, cable size, roof space, and battery chemistry.",
    heavyLoads.length ? `High-draw loads detected: ${heavyLoads.join(", ")}. Confirm inverter surge rating before installation.` : null,
    appliances.some((a) => a.id.startsWith("ac_")) ? "AC selected: daily AC use needs careful inverter surge sizing, dedicated circuits, and realistic runtime expectations." : null,
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
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: T.label, cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "12px", display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Outfit',sans-serif" }}>← Back to Battery</button>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[["Goals", 0], ["Appliances", 1], ["Backup", 2], ["Battery", 3]].map(([label, s]) => (
          <button key={label} onClick={() => onEditStep(s)} style={{ padding: "7px 14px", borderRadius: "20px", border: `1px solid ${T.cardBorder}`, background: T.card, color: T.btnClr, cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "'Outfit',sans-serif" }}>
            Edit {label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: isDesktop ? "26px" : "22px", fontWeight: "800", color: T.sectionTitle, marginBottom: "4px", letterSpacing: "-0.5px" }}>Your Solar Setup</div>
      {helpBanner}
      <div style={{ fontSize: "14px", color: T.sectionSub, marginBottom: "24px", lineHeight: "1.6" }}>
        Based on {r.totalWh.toLocaleString()} Wh/day at {r.psh} peak sun hours/day.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1fr", gap: "12px", marginBottom: "20px" }}>
        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "16px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: T.label, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" }}>Peak Load</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: T.sectionTitle, marginTop: "4px" }}>{r.peakWatts.toLocaleString()} W</div>
          <div style={{ fontSize: "11px", color: T.sectionSub }}>Running simultaneously</div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "16px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: T.label, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" }}>Daily Energy</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: T.sectionTitle, marginTop: "4px" }}>{r.totalWh.toLocaleString()} Wh</div>
          <div style={{ fontSize: "11px", color: T.sectionSub }}>Total power needed daily</div>
        </div>
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: T.label, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" }}>Est. Backup Time</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>{r.battery.backupHours} hrs</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
            <button aria-label="Reduce backup days" disabled={autonomyDays <= 1} onClick={() => onAdjustAutonomy(-1)} style={{ width: "26px", height: "26px", borderRadius: "50%", border: `1px solid ${T.cardBorder}`, background: T.card, color: T.sectionTitle, cursor: "pointer", fontWeight: "800", opacity: autonomyDays <= 1 ? 0.35 : 1 }}>−</button>
            <span style={{ fontSize: "10px", fontWeight: "700", color: T.label, letterSpacing: "0.6px" }}>ADJUST · {autonomyDays} DAY{autonomyDays !== 1 ? "S" : ""}</span>
            <button aria-label="Increase backup days" disabled={autonomyDays >= 6} onClick={() => onAdjustAutonomy(1)} style={{ width: "26px", height: "26px", borderRadius: "50%", border: `1px solid ${T.cardBorder}`, background: T.card, color: T.sectionTitle, cursor: "pointer", fontWeight: "800", opacity: autonomyDays >= 6 ? 0.35 : 1 }}>+</button>
          </div>
          <div style={{ fontSize: "11px", color: T.sectionSub, marginTop: "4px" }}>At max load without sun</div>
        </div>
      </div>

      <div style={{ ...labelSt, marginBottom: "12px" }}>Recommended System — Bill of Materials</div>
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "repeat(1,1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { color: "#fbbf24", icon: "🔋", label: "1. Battery Bank", value: `${r.battery.physicalBatteryCount} × ${r.battery.ah}Ah`, sub: `${r.battery.baseVoltage}V batteries · ${r.battery.seriesCount}S × ${r.battery.parallelStrings}P` },
          { color: "#10b981", icon: "☀️", label: "2. Solar Panels", value: `${r.panels.count} × ${r.panels.watts}W`, sub: `${r.panels.totalWatts}W array · ~${r.panels.roofAreaSqm}sqm roof space` },
          { color: "#3b82f6", icon: "⚡", label: "3. Inverter Size", value: `${r.inverter}W`, sub: `${r.peakWatts}W running · ${r.surgeWatts}W surge · ≈${formatInverterVA(r.inverterVA)} shop size` },
          { color: "#8b5cf6", icon: "🔌", label: "4. Charge Controller", value: r.chargeControllerCount > 1 ? `${r.chargeControllerCount} × ${r.chargeController}A` : `${r.chargeController}A`, sub: r.chargeControllerCount > 1 ? "MPPT controllers in parallel" : "MPPT recommended" },
          { color: "#f97316", icon: "🔩", label: "5. Mounting Rack", value: `${r.panels.mountingKits} rack kit${r.panels.mountingKits !== 1 ? "s" : ""}`, sub: `Mounting for ${r.panels.count} panels (1 kit per ${PANELS_PER_RACK_KIT})` },
          { color: "#14b8a6", icon: "🎯", label: "Load Priority", value: `${mustRunLoads.length} must-run`, sub: `${niceLoads.length} nice-to-have load${niceLoads.length !== 1 ? "s" : ""}` },
        ].map((c) => (
          <div key={c.label} style={{ background: `rgba(${hexToRgb(c.color)},0.07)`, border: `1px solid rgba(${hexToRgb(c.color)},0.2)`, borderRadius: "18px", padding: isDesktop ? "20px" : "16px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>{c.icon}</div>
            <div style={{ fontSize: "11px", color: T.resultLbl, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.8px" }}>{c.label}</div>
            <div style={{ fontSize: isDesktop ? "24px" : "20px", fontWeight: "800", color: c.color }}>{c.value}</div>
            <div style={{ fontSize: "12px", color: T.resultLbl, marginTop: "4px" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[
          { key: "why", label: "Why this recommendation?" },
          { key: "whatif", label: "What if I change this?" },
        ].map((item) => (
          <button key={item.key} onClick={() => setAssistantMode(item.key)} style={{ flex: 1, minWidth: "140px", padding: "12px 14px", borderRadius: "14px", cursor: "pointer", border: item.key === assistantMode ? `2px solid #fbbf24` : `1px solid ${T.cardBorder}`, background: item.key === assistantMode ? "rgba(251,191,36,0.12)" : T.card, color: T.sectionTitle, fontWeight: item.key === assistantMode ? "700" : "600", fontSize: "13px", fontFamily: "'Outfit',sans-serif" }}>
            {item.label}
          </button>
        ))}
      </div>

      {assistantMode === "whatif" ? (
        <div style={{ background: T.infoBoxBg, border: `1px solid ${T.infoBoxBdr}`, borderRadius: "16px", padding: "18px", marginBottom: "20px", color: T.infoBoxClr, lineHeight: "1.75" }}>
          <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px" }}>Try these changes to see how the system shifts:</div>
          {altAutonomy && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: "700", color: "#d97706" }}>Add 1 more backup day</div>
              <div style={{ fontSize: "13px" }}>Your battery bank would grow to {altAutonomy.battery.physicalBatteryCount} × {altAutonomy.battery.ah}Ah batteries ({altAutonomy.battery.wiringText}), and the panel array would become {altAutonomy.panels.count} × {altAutonomy.panels.watts}W.</div>
            </div>
          )}
          {altVoltage && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: "700", color: "#10b981" }}>Move to {altVoltage.systemVoltage}V</div>
              <div style={{ fontSize: "13px" }}>A {altVoltage.systemVoltage}V system could reduce current and wiring complexity. It would need {altVoltage.battery.physicalBatteryCount} × {altVoltage.battery.ah}Ah batteries ({altVoltage.battery.wiringText}) and {altVoltage.panels.count} × {altVoltage.panels.watts}W panels.</div>
            </div>
          )}
          {altLithium && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: "700", color: "#10b981" }}>Choose Lithium</div>
              <div style={{ fontSize: "13px" }}>A LiFePO₄ battery offers more usable capacity and often fewer battery modules. This setup would need {altLithium.battery.physicalBatteryCount} × {altLithium.battery.ah}Ah batteries.</div>
            </div>
          )}
          {heavyLoads.length > 0 && (
            <div>
              <div style={{ fontWeight: "700", color: "#3b82f6" }}>Heavy loads matter</div>
              <div style={{ fontSize: "13px" }}>Your heavier appliances like {heavyLoads.join(", ")} are the main drivers of inverter and panel size. Reducing their use can improve runtime and reduce required system capacity.</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: T.explainBg, border: `1px solid ${T.explainBdr}`, borderRadius: "14px", padding: isDesktop ? "18px 20px" : "14px", fontSize: "13px", color: T.explainClr, lineHeight: "1.75", marginBottom: "20px" }}>
          <strong style={{ color: "#fbbf24" }}>🔋 Battery:</strong> {r.totalWh.toLocaleString()} Wh ÷ {Math.round(INVERTER_EFFICIENCY * 100)}% inverter efficiency × {autonomyDays} day(s), adjusted for {r.bat.name}'s {r.bat.dod * 100}% DoD → {r.battery.physicalBatteryCount} × {r.battery.ah}Ah {r.battery.baseVoltage}V batteries ({r.battery.wiringText}).<br /><br />
          <strong style={{ color: "#10b981" }}>☀️ Panels:</strong> {r.totalWh.toLocaleString()} Wh ÷ {Math.round(INVERTER_EFFICIENCY * 100)}% inverter efficiency ÷ {r.bat.efficiency * 100}% battery efficiency ÷ {r.psh} PSH × 1.25 safety factor = {r.panels.requiredPanelWatts.toLocaleString()}W required → {r.panels.count} × {r.panels.watts}W panels ({r.panels.totalWatts.toLocaleString()}W installed), needing roughly {r.panels.roofAreaSqm}sqm clear roof space.<br /><br />
          <strong style={{ color: "#3b82f6" }}>⚡ Inverter:</strong> Running peak {r.peakWatts}W, surge estimate {r.surgeWatts}W + 25% headroom = {r.inverter}W inverter. At {INVERTER_POWER_FACTOR} power factor that is ≈{formatInverterVA(r.inverterVA)} — the VA/kVA size to shop for.<br /><br />
          <strong style={{ color: "#8b5cf6" }}>🔌 Charge Controller:</strong> {r.panels.totalWatts}W ÷ {r.systemVoltage}V × 1.25 = {r.chargeControllerTotalAmps}A total{r.chargeControllerCount > 1 ? ` → ${r.chargeControllerCount} × ${r.chargeController}A MPPT controllers in parallel (100A-class units)` : ` → ${r.chargeController}A MPPT`}.
        </div>
      )}

      <div style={infoBox}>
        📋 <strong style={{ color: "#fbbf24" }}>Installation Tips</strong><br />
        • Panels should face <strong>south</strong>, angled at your city's latitude<br />
        • Use copper cables rated for your system's current<br />
        • Install a DC breaker between panels and charge controller<br />
        • Keep batteries cool and ventilated
      </div>
      <div style={{ ...infoBox, marginTop: "10px" }}>
        🔋 <strong style={{ color: "#fbbf24" }}>Battery Wiring Layout</strong><br />
        Use <strong>{r.battery.physicalBatteryCount} physical {r.battery.baseVoltage}V batteries</strong>: {r.battery.wiringText}. Installer must confirm final series/parallel wiring, fuse rating, and cable size.
      </div>
      <div style={{ ...infoBox, marginTop: "10px" }}>
        🏠 <strong style={{ color: "#fbbf24" }}>Roof Space Estimate</strong><br />
        Plan for roughly <strong>{r.panels.roofAreaSqm} square meters</strong> of clear, unshaded roof space for {r.panels.count} panels. Add service access space around the mounting rails.
      </div>
      <div style={{ ...infoBox, marginTop: "10px", background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.18)" }}>
        ⚠️ <strong style={{ color: "#ef4444" }}>Disclaimer:</strong> Sizing estimate only. Installer must verify on site.
      </div>
      <div style={{ ...card, marginTop: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: "800", color: "#d97706", marginBottom: "8px" }}>Best Next Action</div>
        <div style={{ fontSize: "13px", color: T.sectionSub, lineHeight: "1.7" }}>{nextAction}</div>
      </div>

      <div style={{ ...card, marginTop: "4px" }}>
        <div style={{ fontSize: "14px", fontWeight: "800", color: T.sectionTitle, marginBottom: "10px" }}>Confidence Warnings</div>
        {confidenceWarnings.map((item) => (
          <div key={item} style={{ fontSize: "13px", color: T.sectionSub, lineHeight: "1.6", marginBottom: "7px" }}>• {item}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: "12px", marginTop: "4px" }}>
        <div style={card}>
          <div style={{ fontSize: "14px", fontWeight: "800", color: T.sectionTitle, marginBottom: "10px" }}>Quote Comparison Checklist</div>
          {quoteChecklist.map((item) => (
            <label key={item} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: T.sectionSub, lineHeight: "1.5", marginBottom: "8px" }}>
              <input type="checkbox" style={{ marginTop: "3px" }} />
              <span>{item}</span>
            </label>
          ))}
        </div>

        <div style={card}>
          <div style={{ fontSize: "14px", fontWeight: "800", color: T.sectionTitle, marginBottom: "10px" }}>Maintenance Reminders</div>
          {maintenanceReminders.map((item) => (
            <div key={item} style={{ fontSize: "13px", color: T.sectionSub, lineHeight: "1.6", marginBottom: "8px" }}>• {item}</div>
          ))}
        </div>
      </div>

      <div style={{ ...card, marginTop: "4px", background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}>
        <div style={{ fontSize: "14px", fontWeight: "800", color: "#059669", marginBottom: "8px" }}>💰 Your Estimated Savings &amp; Payback</div>
        <div style={{ fontSize: "13px", color: T.sectionSub, lineHeight: "1.7" }}>
          Running this load on {sourceLabel} currently costs you approx. <strong style={{ color: T.sectionTitle }}>{naira(roi.monthlyCost)} / month</strong>
          {backupSource === "grid" ? " in grid electricity." : " in fuel."} That is {naira(roi.annualCost)} per year.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: T.label, fontWeight: "600" }}>Estimated system cost (₦)</span>
          <input type="number" aria-label="Estimated system cost in naira" placeholder="e.g. 3000000" value={systemCost || ""} min="0" onChange={(e) => setSystemCost(e.target.value === "" ? 0 : Number(e.target.value))} style={{ ...numInput, padding: "8px 10px", width: "170px" }} />
        </div>
        {roi.paybackMonths !== null ? (
          <div style={{ fontSize: "14px", color: T.sectionTitle, marginTop: "12px", lineHeight: "1.6" }}>
            This solar system will pay for itself in savings in just <strong style={{ color: "#059669" }}>{roi.paybackMonths} months</strong> — free electricity after that.
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: T.sectionSub, marginTop: "10px" }}>Enter an installer quote above to see the payback period.</div>
        )}
        <div style={{ fontSize: "11px", color: T.label, marginTop: "8px" }}>Estimate only: assumes all {roi.dailyKwh.toFixed(1)} kWh/day currently comes from {sourceLabel.toLowerCase()}{backupSource === "grid" ? "" : ` at ₦${Number(backupPrice).toLocaleString()}/litre`}. Generator maintenance and solar upkeep not included.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: "10px", marginTop: "4px" }}>
        <button onClick={() => onShare(r, reportSections)} style={{ ...secBtn, marginTop: 0, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#059669", fontWeight: "800" }}>Share / Copy Summary</button>
        <button onClick={() => onWhatsApp(r, reportSections)} style={{ ...secBtn, marginTop: 0, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.35)", color: "#128c4a", fontWeight: "800" }}>Chat on WhatsApp</button>
        <button onClick={() => onDownload(r, reportSections)} style={{ ...secBtn, marginTop: 0, background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.28)", color: "#d97706", fontWeight: "800" }}>Download Summary</button>
        <button onClick={() => window.print()} style={{ ...secBtn, marginTop: 0, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.22)", color: "#2563eb", fontWeight: "800" }}>Export as PDF</button>
      </div>

      <div style={{ marginTop: "12px" }}>
        <Faq T={T} styles={styles} />
      </div>

      <button style={primBtn({})} onClick={onReset}>↺ Start New Calculation</button>
    </>
  );
}
