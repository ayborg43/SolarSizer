// Shared micro-styles derived from the active theme tokens.
export function makeUiStyles(T) {
  return {
    infoBox: { background: T.infoBoxBg, border: `1px solid ${T.infoBoxBdr}`, borderRadius: "12px", padding: "14px 16px", fontSize: "13px", color: T.infoBoxClr, lineHeight: "1.65" },
    secBtn: { background: T.btnBg, border: `1px solid ${T.btnBdr}`, borderRadius: "12px", color: T.btnClr, padding: "11px 20px", fontSize: "14px", cursor: "pointer", width: "100%", marginTop: "10px", fontFamily: "'Outfit',sans-serif" },
    labelSt: { fontSize: "11px", color: T.label, textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600", marginBottom: "8px" },
    numInput: { background: T.inputBg, border: `1px solid ${T.inputBdr}`, borderRadius: "8px", color: T.inputClr, padding: "4px 6px", fontSize: "13px", fontFamily: "'Outfit',sans-serif" },
    primBtn: (extra) => ({ width: "100%", padding: "15px", borderRadius: "14px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginTop: "24px", letterSpacing: "0.2px", fontFamily: "'Outfit',sans-serif", ...extra }),
    card: { background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "16px", padding: "18px", marginBottom: "12px" },
  };
}
