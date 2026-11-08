# SolarSizer

SolarSizer is a React/Vite solar setup estimator for home and small-business loads. It helps users estimate daily energy demand, panel sizing, battery bank layout, inverter size, MPPT charge controller size, roof-space needs, and installer verification notes.

## What It Does

- Captures goal, property type, location, and installer preference.
- Lets users choose load profiles or build a custom appliance list.
- Supports appliance quantity, daily runtime, must-run loads, and nice-to-have loads.
- Models surge demand for appliances such as fridges, freezers, AC units, pumps, washing machines, microwaves, and irons.
- Recommends battery bank size with practical 12V physical battery series/parallel layout.
- Estimates required solar panel array and approximate clear roof area.
- Exports a text summary, supports native share/copy, WhatsApp sharing, and browser PDF printing.
- Estimates generator/grid savings and payback from backup source (petrol/diesel/grid), fuel price or tariff, and a user-entered system cost. Fuel burn assumes 0.6 L/kWh (petrol) or 0.35 L/kWh (diesel).
- Shows estimated backup time at peak load, adjustable via backup days on the Results step.

## Calculation Assumptions

- Daily energy is calculated as `watts × hours per day × quantity`.
- Running peak load is the sum of selected appliance watts.
- Surge load applies appliance-specific multipliers for high-startup devices.
- Inverter recommendation uses surge estimate plus 25% headroom, and is also shown as a VA/kVA market size at 0.8 power factor (the size to shop for).
- Charge controller sizing splits arrays needing more than 100A across parallel 100A-class MPPT controllers.
- Mounting estimate assumes one rack kit per 4 panels.
- Inverter efficiency of 90% (`INVERTER_EFFICIENCY`) is applied to battery and panel sizing.
- Battery capacity adjusts for selected battery depth of discharge.
- Battery layout assumes common 12V physical batteries and derives series and parallel strings from selected system voltage. Lithium banks are commonly sold as single 24V/48V units in practice; the module count is an equivalent-capacity guide.
- Panel sizing uses local peak sun hours, selected battery efficiency, and a 25% safety factor.
- Roof space uses an approximate 2.2 square meters per panel.
- Peak sun hour values are approximate long-term averages (NASA POWER / Global Solar Atlas).

## Limitations

SolarSizer is an estimate, not a final engineering design. It does not replace an installer site survey, roof inspection, cable sizing calculation, protection design, grounding design, or battery compatibility check.

Disclaimer: Sizing estimate only. Installer must verify on site.

## Run Locally

```powershell
npm install
npm.cmd run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

## Checks

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## Project Structure

- `src/SolarCalculator.jsx` - Wizard state, persistence, and layout orchestration.
- `src/steps/` - One component per wizard step (Goals, Appliances, Backup, Battery, Results).
- `src/components/` - Shared UI pieces (Stepper, HelpBanner, SummaryPanel, SummaryRow).
- `src/statePersistence.js` - Sanitized localStorage save/restore of wizard state.
- `src/uiStyles.js` - Theme-derived shared micro-styles.
- `src/solarCalculations.js` - Pure calculation and export-summary helpers.
- `src/solarCalculations.test.js` - Unit tests for sizing, voltage recommendation, and export summary (`node --test`).
- `src/data.js` - Appliance catalogue, country/state PSH data, battery types, load profiles.
- `src/theme.js` - Light/dark theme tokens.
- `src/ErrorBoundary.jsx` - Top-level error fallback.
- `src/index.css` - Global and print styles.
