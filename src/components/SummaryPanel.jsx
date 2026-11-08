import SummaryRow from "./SummaryRow";
import { hexToRgb } from "../theme";
import { formatInverterVA } from "../solarCalculations";

export default function SummaryPanel({
  T, darkMode, step, steps, sunHours,
  selProfile, appliances, totalApplianceUnits, totalWh,
  systemVoltage, autonomyDays, selBattery, results,
}) {
  return (
    <div style={{ background: T.panelBg, border: `1px solid ${T.panelBorder}`, borderRadius: "20px", overflow: "hidden", boxShadow: T.cardShadow }}>
      <div style={{ padding: "16px 18px", background: darkMode ? "rgba(251,191,36,0.06)" : "rgba(251,191,36,0.07)", borderBottom: `1px solid ${T.summaryBorder}` }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#d97706" }}>📋 Setup Summary</div>
        <div style={{ fontSize: "11px", color: T.sectionSub, marginTop: "2px" }}>Updates as you progress</div>
      </div>

      <SummaryRow
        T={T}
        icon="☀️"
        label="Sunlight"
        value={`${sunHours} hrs/day`}
        sub="Peak sun hours (your estimate)"
      />


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

      {step >= 2 && (
        <>
          <SummaryRow T={T} icon="⚡" label="System Voltage" value={`${systemVoltage}V DC`} sub={`${autonomyDays} day${autonomyDays > 1 ? "s" : ""} battery autonomy`} />
          <SummaryRow T={T} icon={selBattery?.icon || "🔋"} label="Battery Type" value={selBattery?.name || "—"} sub={`${(selBattery?.dod || 0) * 100}% DoD · ${selBattery?.lifespan}`} />
        </>
      )}

      {results ? (
        <div style={{ padding: "14px 0 4px" }}>
          <div style={{ padding: "0 14px 8px", fontSize: "10px", fontWeight: "700", color: T.label, textTransform: "uppercase", letterSpacing: "1px" }}>
            {step === 4 ? "Recommended System" : "Live Estimate — updates as you edit"}
          </div>
          {[
            { color: "#d97706", icon: "🔋", label: "Battery Bank", value: `${results.battery.physicalBatteryCount} × ${results.battery.ah}Ah`, sub: `${results.battery.seriesCount}S × ${results.battery.parallelStrings}P at ${results.systemVoltage}V` },
            { color: "#059669", icon: "☀️", label: "Panels", value: `${results.panels.count} × ${results.panels.watts}W`, sub: `${results.panels.totalWatts}W · ~${results.panels.roofAreaSqm}sqm · ${results.panels.mountingKits} rack kit${results.panels.mountingKits !== 1 ? "s" : ""}` },
            { color: "#d97706", icon: "⚡", label: "Inverter", value: `${results.inverter}W ≈${formatInverterVA(results.inverterVA)}`, sub: `Surge estimate: ${results.surgeWatts}W` },
            { color: "#0f766e", icon: "🔌", label: "Controller", value: `${results.chargeControllerCount > 1 ? `${results.chargeControllerCount} × ` : ""}${results.chargeController}A MPPT`, sub: `${results.psh} PSH/day` },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", borderBottom: `1px solid ${T.summaryBorder}` }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `rgba(${hexToRgb(r.color)},0.1)`, border: `1px solid rgba(${hexToRgb(r.color)},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{r.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10px", color: T.label, textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: "600" }}>{r.label}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: r.color }}>{r.value}</div>
                <div style={{ fontSize: "11px", color: T.sectionSub }}>{r.sub}</div>
              </div>
            </div>
          ))}
        </div>
      ) : step < 4 && appliances.length === 0 ? (
        <div style={{ padding: "20px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔌</div>
          <div style={{ fontSize: "12px", color: T.sectionSub, lineHeight: "1.6" }}>Add appliances to see your load →</div>
        </div>
      ) : null}

      <div style={{ padding: "12px 14px", background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= step ? "#fbbf24" : T.stepDotInactive, transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ fontSize: "10px", color: T.label, marginTop: "6px", textAlign: "right" }}>Step {step + 1} of {steps.length}</div>
      </div>
    </div>
  );
}
