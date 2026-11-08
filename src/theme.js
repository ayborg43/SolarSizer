export function hexToRgb(hex) {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

const DARK = {
  appBg:"radial-gradient(1100px 500px at 85% -5%, rgba(245,158,11,0.09), transparent 60%), radial-gradient(900px 480px at -10% 0%, rgba(16,185,129,0.06), transparent 55%), linear-gradient(165deg,#070b14 0%,#0a1322 55%,#07140d 100%)", cardShadow:"0 1px 2px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)",
  appColor:"#e2eae4",pageBg:"transparent",
  headerBg:"rgba(10,16,30,0.92)",headerBorder:"rgba(255,195,0,0.12)",headerSub:"rgba(255,255,255,0.35)",
  stepDotInactive:"rgba(255,255,255,0.05)",stepDotBorder:"rgba(255,255,255,0.09)",stepLabelOff:"rgba(255,255,255,0.22)",
  sectionTitle:"#f1f5f2",sectionSub:"rgba(255,255,255,0.42)",label:"rgba(255,255,255,0.3)",
  card:"rgba(255,255,255,0.035)",cardBorder:"rgba(255,255,255,0.075)",
  panelBg:"rgba(255,255,255,0.03)",panelBorder:"rgba(255,255,255,0.07)",
  inputBg:"rgba(255,255,255,0.07)",inputBdr:"rgba(255,255,255,0.11)",inputClr:"#fff",
  btnBg:"rgba(255,255,255,0.05)",btnBdr:"rgba(255,255,255,0.09)",btnClr:"rgba(255,255,255,0.55)",
  infoBoxBg:"rgba(251,191,36,0.06)",infoBoxBdr:"rgba(251,191,36,0.18)",infoBoxClr:"rgba(255,255,255,0.6)",
  totalBarBg:"linear-gradient(90deg,rgba(251,191,36,0.12),rgba(16,185,129,0.08))",totalBarBdr:"rgba(251,191,36,0.22)",totalLbl:"rgba(255,255,255,0.45)",
  pillBg:"rgba(255,255,255,0.04)",pillBdr:"rgba(255,255,255,0.07)",pillClr:"rgba(255,255,255,0.38)",
  toggleBg:"rgba(255,255,255,0.07)",toggleBdr:"rgba(255,255,255,0.11)",toggleClr:"rgba(255,255,255,0.65)",
  dropdownBg:"#0d1b2a",dropdownBdr:"rgba(251,191,36,0.28)",dropdownItemBdr:"rgba(255,255,255,0.04)",
  dropdownClr:"rgba(255,255,255,0.72)",dropdownMuted:"rgba(255,255,255,0.28)",dropdownFooter:"rgba(255,255,255,0.06)",
  batExpBdr:"rgba(255,255,255,0.05)",metaItemBg:"rgba(255,255,255,0.04)",metaLbl:"rgba(255,255,255,0.32)",metaVal:"#fff",
  proCardBg:"rgba(16,185,129,0.05)",proCardBdr:"rgba(16,185,129,0.13)",conCardBg:"rgba(239,68,68,0.05)",conCardBdr:"rgba(239,68,68,0.13)",proConsItem:"rgba(255,255,255,0.55)",
  educNoteBg:"rgba(251,191,36,0.06)",educNoteBdr:"rgba(251,191,36,0.18)",educNoteClr:"rgba(255,255,255,0.57)",
  bestFor:"rgba(255,255,255,0.4)",explainBg:"rgba(255,255,255,0.03)",explainBdr:"rgba(255,255,255,0.065)",explainClr:"rgba(255,255,255,0.52)",
  resultLbl:"rgba(255,255,255,0.32)",shadow:"0 20px 60px rgba(0,0,0,0.65)",
  profileCardBg:"rgba(255,255,255,0.03)",profileCardBdr:"rgba(255,255,255,0.07)",profileDesc:"rgba(255,255,255,0.37)",profileWh:"rgba(255,255,255,0.22)",
  divider:"rgba(255,255,255,0.07)",summaryRow:"rgba(255,255,255,0.03)",summaryBorder:"rgba(255,255,255,0.06)",
};

const LIGHT = {
  appBg:"radial-gradient(1100px 500px at 85% -5%, rgba(245,158,11,0.10), transparent 60%), radial-gradient(900px 480px at -10% 0%, rgba(16,185,129,0.07), transparent 55%), linear-gradient(165deg,#fffdf8 0%,#f4f8fc 55%,#f2faf5 100%)", cardShadow:"0 1px 2px rgba(120,80,10,0.05), 0 12px 32px rgba(120,80,10,0.07), inset 0 1px 0 rgba(255,255,255,0.7)",
  appColor:"#111827",pageBg:"transparent",
  headerBg:"rgba(255,255,255,0.88)",headerBorder:"rgba(245,158,11,0.18)",headerSub:"#9ca3af",
  stepDotInactive:"rgba(0,0,0,0.05)",stepDotBorder:"rgba(0,0,0,0.1)",stepLabelOff:"#9ca3af",
  sectionTitle:"#111827",sectionSub:"#6b7280",label:"#9ca3af",
  card:"#ffffff",cardBorder:"rgba(0,0,0,0.07)",
  panelBg:"#ffffff",panelBorder:"rgba(0,0,0,0.08)",
  inputBg:"rgba(0,0,0,0.04)",inputBdr:"rgba(0,0,0,0.11)",inputClr:"#111827",
  btnBg:"#ffffff",btnBdr:"rgba(0,0,0,0.09)",btnClr:"#374151",
  infoBoxBg:"rgba(251,191,36,0.07)",infoBoxBdr:"rgba(245,158,11,0.28)",infoBoxClr:"#4b5563",
  totalBarBg:"linear-gradient(90deg,rgba(251,191,36,0.1),rgba(16,185,129,0.07))",totalBarBdr:"rgba(245,158,11,0.28)",totalLbl:"#6b7280",
  pillBg:"rgba(0,0,0,0.04)",pillBdr:"rgba(0,0,0,0.08)",pillClr:"#6b7280",
  toggleBg:"rgba(0,0,0,0.055)",toggleBdr:"rgba(0,0,0,0.09)",toggleClr:"#374151",
  dropdownBg:"#ffffff",dropdownBdr:"rgba(245,158,11,0.38)",dropdownItemBdr:"rgba(0,0,0,0.04)",
  dropdownClr:"#374151",dropdownMuted:"#9ca3af",dropdownFooter:"rgba(0,0,0,0.055)",
  batExpBdr:"rgba(0,0,0,0.06)",metaItemBg:"rgba(0,0,0,0.04)",metaLbl:"#9ca3af",metaVal:"#111827",
  proCardBg:"rgba(16,185,129,0.05)",proCardBdr:"rgba(16,185,129,0.18)",conCardBg:"rgba(239,68,68,0.04)",conCardBdr:"rgba(239,68,68,0.16)",proConsItem:"#4b5563",
  educNoteBg:"rgba(251,191,36,0.07)",educNoteBdr:"rgba(245,158,11,0.22)",educNoteClr:"#4b5563",
  bestFor:"#6b7280",explainBg:"rgba(0,0,0,0.03)",explainBdr:"rgba(0,0,0,0.07)",explainClr:"#4b5563",
  resultLbl:"#9ca3af",shadow:"0 20px 60px rgba(0,0,0,0.12)",
  profileCardBg:"#ffffff",profileCardBdr:"rgba(0,0,0,0.08)",profileDesc:"#6b7280",profileWh:"#9ca3af",
  divider:"rgba(0,0,0,0.07)",summaryRow:"rgba(0,0,0,0.02)",summaryBorder:"rgba(0,0,0,0.06)",
};

export function getTheme(darkMode) {
  return darkMode ? DARK : LIGHT;
}
