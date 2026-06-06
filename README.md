# SolarSizer

SolarSizer is a React/Vite solar setup estimator for home and small-business loads. It helps users estimate daily energy demand, panel sizing, battery bank layout, inverter size, MPPT charge controller size, roof-space needs, and installer verification notes.

## What It Does

- Captures goal, property type, location, and installer preference.
- Lets users choose load profiles or build a custom appliance list.
- Supports appliance quantity, daily runtime, must-run loads, and nice-to-have loads.
- Models surge demand for appliances such as fridges, freezers, AC units, pumps, washing machines, microwaves, and irons.
- Recommends battery bank size with practical 12V physical battery series/parallel layout.
- Estimates required solar panel array and approximate clear roof area.
- Exports a text summary, supports native share/copy, and provides browser PDF printing.

## Calculation Assumptions

- Daily energy is calculated as `watts × hours per day × quantity`.
- Running peak load is the sum of selected appliance watts.
- Surge load applies appliance-specific multipliers for high-startup devices.
- Inverter recommendation uses surge estimate plus 25% headroom.
- Battery capacity adjusts for selected battery depth of discharge.
- Battery layout assumes common 12V physical batteries and derives series and parallel strings from selected system voltage.
- Panel sizing uses local peak sun hours, selected battery efficiency, and a 25% safety factor.
- Roof space uses an approximate 2.2 square meters per panel.

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

- `src/SolarCalculator.jsx` - Main React UI.
- `src/solarCalculations.js` - Pure calculation and export-summary helpers.
- `test/solarCalculations.test.js` - Unit tests for sizing, voltage recommendation, and export summary.
- `src/index.css` - Global and print styles.
