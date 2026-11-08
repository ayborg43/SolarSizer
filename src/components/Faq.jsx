import { useState } from "react";

const FAQS = [
  {
    q: "How is my solar power requirement calculated?",
    a: "Each appliance's watts × hours per day × quantity gives daily watt-hours. SolarSizer sums these, adds inverter and battery losses, divides by your entered peak sun hours, and applies a 25% safety factor for panels. Battery size also accounts for backup days and depth of discharge.",
  },
  {
    q: "What size inverter do I need for my home?",
    a: "Your inverter must handle everything running at once, plus startup surges from fridges, pumps, and ACs. SolarSizer estimates surge, adds 25% headroom, and also shows the VA/kVA market size to shop for at 0.8 power factor.",
  },
  {
    q: "How many solar panels do I need?",
    a: "It depends on daily energy and sunlight. A 5kVA-class home often needs roughly 8–12 modern high-wattage panels, but your count here is calculated from your actual load and your state's peak sun hours — not a rule of thumb.",
  },
  {
    q: "Why does the battery count use depth of discharge?",
    a: "Draining a battery to zero destroys it early. Lead-acid banks should only use about 50% of rated capacity; LiFePO₄ about 90%. The bank is sized so your usable energy fits inside that safe limit.",
  },
  {
    q: "Monocrystalline or polycrystalline panels?",
    a: "Monocrystalline panels are more efficient and perform better in low light, so they need less roof space. Polycrystalline panels are cheaper but larger for the same output. SolarSizer's roof estimate assumes modern mono panels at about 2.2sqm each.",
  },
  {
    q: "Will the system work in rainy season or on cloudy days?",
    a: "Panels need daylight, not heat, so they still charge when cloudy — just slower. Backup days (autonomy) in your sizing cover stretches of poor sun. More backup days means a larger battery bank.",
  },
  {
    q: "How long do solar batteries last?",
    a: "LiFePO₄ typically lasts 10–15 years (2,000–5,000 cycles). AGM and gel last about 4–8 years, flooded lead-acid 3–5 years with regular water top-ups. Lithium costs more upfront but far less per year of service.",
  },
  {
    q: "How much maintenance is required?",
    a: "Very little: clean panels every 4–8 weeks (more in dry, dusty season), keep batteries cool and ventilated, check terminals for corrosion, and test breakers and cable heat after installation and after major load changes.",
  },
];

export default function Faq({ T, styles }) {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ ...styles.card, marginTop: "4px" }}>
      <div style={{ fontSize: "14px", fontWeight: "800", color: T.sectionTitle, marginBottom: "10px" }}>Frequently Asked Questions</div>
      {FAQS.map((item, i) => (
        <div key={item.q} style={{ borderTop: i === 0 ? "none" : `1px solid ${T.batExpBdr}` }}>
          <button
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", background: "transparent", border: "none", padding: "11px 0", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit',sans-serif" }}
          >
            <span style={{ fontSize: "13px", fontWeight: "700", color: T.sectionTitle }}>{item.q}</span>
            <span style={{ color: T.label, fontSize: "13px", flexShrink: 0 }}>{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <div style={{ fontSize: "13px", color: T.sectionSub, lineHeight: "1.65", paddingBottom: "12px" }}>{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
