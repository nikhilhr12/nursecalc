/* =========================================================
   NurseCalc — Complete Calculator Engine
   Created by Nikhil
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */

  const $ = (selector) => document.querySelector(selector);

  function num(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  function round(value, decimals = 2) {
    const p = Math.pow(10, decimals);
    return Math.round(value * p) / p;
  }

  function format(value, decimals = 2) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toFixed(decimals)).toString();
  }

  function showMessage(title, message) {
    alert(`${title}\n\n${message}`);
  }

  function info(text) {
    return `<span class="nurse-info" title="${text}">ⓘ</span>`;
  }

  /* ---------------------------------------------------------
     MODAL
  --------------------------------------------------------- */

  function openCalculator(title, html, calculateFunction) {

    const old = document.getElementById("nurseCalcModal");
    if (old) old.remove();

    const modal = document.createElement("div");
    modal.id = "nurseCalcModal";

    modal.innerHTML = `
      <div class="nc-overlay">
        <div class="nc-modal">

          <div class="nc-modal-header">
            <h2>${title}</h2>
            <button id="ncClose">×</button>
          </div>

          <div class="nc-modal-body">
            ${html}
          </div>

          <div class="nc-modal-footer">
            <button id="ncCalculate" class="nc-calculate">
              Calculate
            </button>
          </div>

          <div id="ncResult" class="nc-result" style="display:none;"></div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("ncClose").onclick = () => modal.remove();

    modal.querySelector(".nc-overlay").addEventListener("click", (e) => {
      if (e.target.classList.contains("nc-overlay")) {
        modal.remove();
      }
    });

    document.getElementById("ncCalculate").onclick = () => {

      try {
        const result = calculateFunction(modal);

        if (result) {
          const resultBox = document.getElementById("ncResult");
          resultBox.style.display = "block";
          resultBox.innerHTML = result;
        }

      } catch (error) {
        showMessage("Calculation Error", "Please check the entered values.");
        console.error(error);
      }
    };
  }

  /* ---------------------------------------------------------
     COMMON FIELD
  --------------------------------------------------------- */

  function field(label, id, unit = "", value = "", help = "") {

    return `
      <label class="nc-label">
        ${label} ${help ? info(help) : ""}
      </label>

      <div class="nc-input-wrap">
        <input
          id="${id}"
          type="number"
          step="any"
          value="${value}"
          placeholder="Enter value"
        >
        ${unit ? `<span>${unit}</span>` : ""}
      </div>
    `;
  }

  /* =========================================================
     1. DOSE CALCULATOR
  ========================================================= */

  function doseCalculator() {

    const html = `
      ${field(
        "Ordered Dose",
        "orderedDose",
        "mg",
        "",
        "Dose prescribed by the doctor."
      )}

      ${field(
        "Available Dose",
        "availableDose",
        "mg",
        "",
        "Strength available in the medication."
      )}

      ${field(
        "Available Volume",
        "availableVolume",
        "mL",
        "1",
        "Volume containing the available dose."
      )}

      <p class="nc-example">
        Example: Ordered 250 mg, Available 500 mg in 2 mL.
      </p>
    `;

    openCalculator("Dose Calculator", html, (modal) => {

      const ordered = num(modal.querySelector("#orderedDose").value);
      const available = num(modal.querySelector("#availableDose").value);
      const volume = num(modal.querySelector("#availableVolume").value);

      if (!ordered || !available || !volume) {
        showMessage("Missing Information", "Please enter all values.");
        return;
      }

      const result = (ordered / available) * volume;

      return `
        <strong>Result</strong>
        <div class="nc-big-result">
          ${format(result)} mL
        </div>

        <small>
          Formula: (Ordered Dose ÷ Available Dose) × Available Volume
        </small>
      `;
    });
  }

  /* =========================================================
     2. INJECTION VOLUME
  ========================================================= */

  function injectionVolumeCalculator() {

    const html = `

      <h3>Required / Available / Volume</h3>

      ${field(
        "Required Dose",
        "requiredDose",
        "mg",
        "",
        "Dose that needs to be administered."
      )}

      ${field(
        "Available Dose",
        "availableDose",
        "mg",
        "",
        "Dose available in the vial/ampoule."
      )}

      ${field(
        "Available Volume",
        "availableVolume",
        "mL",
        "",
        "Volume containing the available dose."
      )}

      <hr>

      <h3>More Options</h3>

      <label class="nc-label">Calculation Type</label>

      <select id="injType">
        <option value="normal">Normal Injection</option>
        <option value="reconstitution">Reconstitution</option>
        <option value="dilution">Dilution</option>
      </select>

      ${field(
        "Reconstituted / Final Volume",
        "finalVolume",
        "mL",
        "",
        "Final volume after reconstitution or dilution."
      )}

      ${field(
        "Final Concentration",
        "finalConcentration",
        "mg/mL",
        "",
        "Leave blank to calculate automatically."
      )}

      <p class="nc-example">
        The calculator will automatically determine concentration when possible.
      </p>
    `;

    openCalculator("Injection Volume", html, (modal) => {

      const required = num(modal.querySelector("#requiredDose").value);
      const available = num(modal.querySelector("#availableDose").value);
      const availableVolume = num(
        modal.querySelector("#availableVolume").value
      );

      const finalVolume = num(
        modal.querySelector("#finalVolume").value
      );

      let concentration = num(
        modal.querySelector("#finalConcentration").value
      );

      if (!required) {
        showMessage("Missing Information", "Enter the required dose.");
        return;
      }

      if (!concentration) {

        if (!available || !finalVolume) {
          showMessage(
            "Missing Information",
            "Enter available dose and final volume."
          );
          return;
        }

        concentration = available / finalVolume;

      }

      const result = required / concentration;

      return `
        <strong>Step-by-Step Result</strong>

        <p>
          Final concentration =
          ${format(concentration)} mg/mL
        </p>

        <p>
          Required volume =
          ${format(result)} mL
        </p>

        <div class="nc-big-result">
          ${format(result)} mL
        </div>

        <small>
          Formula: Required Dose ÷ Concentration
        </small>
      `;
    });
  }

  /* =========================================================
     3. IV FLOW RATE
  ========================================================= */

  function ivFlowRateCalculator() {

    const html = `

      ${field(
        "Total Volume",
        "volume",
        "mL",
        "",
        "Total IV fluid volume."
      )}

      ${field(
        "Time",
        "time",
        "hours",
        "",
        "Total infusion time."
      )}

      <p class="nc-example">
        Formula: Volume ÷ Time
      </p>
    `;

    openCalculator("IV Flow Rate", html, (modal) => {

      const volume = num(modal.querySelector("#volume").value);
      const hours = num(modal.querySelector("#time").value);

      if (!volume || !hours) {
        showMessage("Missing Information", "Enter volume and time.");
        return;
      }

      const mlHr = volume / hours;

      return `
        <strong>Result</strong>

        <div class="nc-big-result">
          ${format(mlHr)} mL/hr
        </div>

        <small>
          Formula: Volume ÷ Time
        </small>
      `;
    });
  }

  /* =========================================================
     4. DRIP RATE
     HOURS + MINUTES + DROP FACTOR
  ========================================================= */

  function dripRateCalculator() {

    const html = `

      ${field(
        "Total Volume",
        "dripVolume",
        "mL",
        "1000",
        "Total IV fluid volume."
      )}

      <label class="nc-label">
        Time
        ${info("You can enter hours and minutes separately.")}
      </label>

      <div class="nc-two">
        <input id="dripHours" type="number" min="0" step="1"
          placeholder="Hours">

        <input id="dripMinutes" type="number" min="0" step="1"
          placeholder="Minutes">
      </div>

      <label class="nc-label">
        Common Drop Factor
        ${info("Select the IV set drop factor printed on the package.")}
      </label>

      <select id="dropFactor">

        <option value="10">10 gtt/mL</option>
        <option value="15">15 gtt/mL</option>
        <option value="20" selected>20 gtt/mL</option>
        <option value="60">60 gtt/mL</option>

        <option value="custom">
          Custom Drop Factor
        </option>

      </select>

      <div id="customDropBox" style="display:none;">
        ${field(
          "Custom Drop Factor",
          "customDrop",
          "gtt/mL",
          "",
          "Enter the exact drop factor printed on the IV set."
        )}
      </div>

      <p class="nc-example">
        The final answer gives both the exact mathematical value
        and the practical whole-drop rate.
      </p>
    `;

    openCalculator("Drip Rate", html, (modal) => {

      const volume = num(
        modal.querySelector("#dripVolume").value
      );

      const hours = num(
        modal.querySelector("#dripHours").value
      );

      const minutes = num(
        modal.querySelector("#dripMinutes").value
      );

      let factor;

      const selected =
        modal.querySelector("#dropFactor").value;

      if (selected === "custom") {
        factor = num(
          modal.querySelector("#customDrop").value
        );
      } else {
        factor = num(selected);
      }

      if (!volume || !factor || (hours === 0 && minutes === 0)) {
        showMessage(
          "Missing Information",
          "Enter volume, time and drop factor."
        );
        return;
      }

      const totalMinutes = (hours * 60) + minutes;

      const exact =
        (volume * factor) / totalMinutes;

      const practical =
        Math.round(exact);

      return `
        <strong>Drip Rate Result</strong>

        <p>
          Total time:
          ${hours} hr ${minutes} min
        </p>

        <p>
          Exact calculation:
          <strong>${format(exact)} gtt/min</strong>
        </p>

        <div class="nc-big-result">
          ${practical} gtt/min
        </div>

        <small>
          Practical whole-drop rate: ${practical} drops/min
        </small>
      `;
    });

    setTimeout(() => {

      const select =
        document.querySelector("#dropFactor");

      if (select) {

        select.addEventListener("change", () => {

          const box =
            document.querySelector("#customDropBox");

          box.style.display =
            select.value === "custom"
              ? "block"
              : "none";
        });

      }

    }, 50);
  }

  /* =========================================================
     5. PEDIATRIC DOSE
  ========================================================= */

  function pediatricDoseCalculator() {

    const html = `

      ${field(
        "Child Weight",
        "pWeight",
        "kg",
        "",
        "Current patient weight."
      )}

      ${field(
        "Recommended Dose",
        "pDose",
        "mg/kg/dose",
        "",
        "Recommended dose per kg per dose."
      )}

      ${field(
        "Available Concentration",
        "pAvailable",
        "mg/mL",
        "",
        "Medication concentration."
      )}
    `;

    openCalculator("Pediatric Dose", html, (modal) => {

      const weight = num(modal.querySelector("#pWeight").value);
      const dose = num(modal.querySelector("#pDose").value);
      const concentration =
        num(modal.querySelector("#pAvailable").value);

      if (!weight || !dose || !concentration) {
        showMessage("Missing Information", "Enter all values.");
        return;
      }

      const doseMg = weight * dose;
      const volume = doseMg / concentration;

      return `
        <strong>Result</strong>

        <p>
          Required dose:
          ${format(doseMg)} mg
        </p>

        <div class="nc-big-result">
          ${format(volume)} mL
        </div>

        <small>
          Dose = Weight × mg/kg/dose
        </small>
      `;
    });
  }

  /* =========================================================
     6. BSA
     KG + CM
     FT + IN SUPPORT
  ========================================================= */

  function bsaCalculator() {

    const html = `

      ${field(
        "Weight",
        "bsaWeight",
        "kg",
        "",
        "Patient weight."
      )}

      <label class="nc-label">
        Height Unit
        ${info("Choose centimeters or feet/inches.")}
      </label>

      <select id="heightUnit">
        <option value="cm">Centimeters</option>
        <option value="ftin">Feet + Inches</option>
      </select>

      <div id="cmHeight">
        ${field("Height", "heightCm", "cm")}
      </div>

      <div id="ftHeight" style="display:none;">

        ${field("Height", "heightFt", "ft")}

        ${field("Height", "heightIn", "in")}

      </div>
    `;

    openCalculator("BSA Calculator", html, (modal) => {

      const weight =
        num(modal.querySelector("#bsaWeight").value);

      let heightCm;

      const unit =
        modal.querySelector("#heightUnit").value;

      if (unit === "cm") {

        heightCm =
          num(modal.querySelector("#heightCm").value);

      } else {

        const ft =
          num(modal.querySelector("#heightFt").value);
                const inches =
          num(modal.querySelector("#heightIn").value);

        heightCm =
          ((ft * 12) + inches) * 2.54;
      }

      if (!weight || !heightCm) {
        showMessage(
          "Missing Information",
          "Enter weight and height."
        );
        return;
      }

      // Mosteller formula
      const bsa =
        Math.sqrt((heightCm * weight) / 3600);

      return `
        <strong>Body Surface Area</strong>

        <div class="nc-big-result">
          ${format(bsa, 3)} m²
        </div>

        <small>
          Mosteller Formula:
          √[(Height(cm) × Weight(kg)) ÷ 3600]
        </small>
      `;
    });

    setTimeout(() => {

      const unit =
        document.querySelector("#heightUnit");

      if (unit) {

        unit.addEventListener("change", () => {

          document.querySelector("#cmHeight").style.display =
            unit.value === "cm" ? "block" : "none";

          document.querySelector("#ftHeight").style.display =
            unit.value === "ftin" ? "block" : "none";

        });

      }

    }, 50);
  }

  /* =========================================================
     7. DILUTION
  ========================================================= */

  function dilutionCalculator() {

    const html = `

      ${field(
        "Total Drug Available",
        "totalDrug",
        "mg",
        "",
        "Total amount of drug available."
      )}

      ${field(
        "Stock Concentration",
        "stockConcentration",
        "mg/mL",
        "",
        "Concentration of the stock solution."
      )}

      ${field(
        "Final Volume",
        "dilutionFinalVolume",
        "mL",
        "",
        "Final volume after dilution."
      )}
    `;

    openCalculator("Dilution Calculator", html, (modal) => {

      const totalDrug =
        num(modal.querySelector("#totalDrug").value);

      const stock =
        num(modal.querySelector("#stockConcentration").value);

      const finalVolume =
        num(modal.querySelector("#dilutionFinalVolume").value);

      if (!totalDrug || !stock || !finalVolume) {
        showMessage("Missing Information", "Enter all values.");
        return;
      }

      const stockVolume =
        totalDrug / stock;

      const finalConcentration =
        totalDrug / finalVolume;

      const diluent =
        finalVolume - stockVolume;

      return `
        <strong>Step-by-Step Dilution Result</strong>

        <p>
          Stock volume required:
          <strong>${format(stockVolume)} mL</strong>
        </p>

        <p>
          Diluent required:
          <strong>${format(diluent)} mL</strong>
        </p>

        <p>
          Final concentration:
          <strong>${format(finalConcentration)} mg/mL</strong>
        </p>

        <div class="nc-big-result">
          ${format(finalConcentration)} mg/mL
        </div>
      `;
    });
  }

  /* =========================================================
     8. PERCENTAGE
  ========================================================= */

  function percentageCalculator() {

    const html = `

      ${field("Part", "percentPart", "")}

      ${field("Whole", "percentWhole", "")}
    `;

    openCalculator("Percentage Calculator", html, (modal) => {

      const part =
        num(modal.querySelector("#percentPart").value);

      const whole =
        num(modal.querySelector("#percentWhole").value);

      if (!whole) {
        showMessage("Missing Information", "Enter the whole value.");
        return;
      }

      const result =
        (part / whole) * 100;

      return `
        <strong>Percentage</strong>

        <div class="nc-big-result">
          ${format(result)}%
        </div>
      `;
    });
  }

  /* =========================================================
     9. INSULIN
  ========================================================= */

  function insulinCalculator() {

    const html = `

      ${field(
        "Ordered Insulin Dose",
        "insulinOrdered",
        "units",
        "",
        "Dose ordered by the prescriber."
      )}

      ${field(
        "Available Insulin",
        "insulinAvailable",
        "units/mL",
        "",
        "Concentration of insulin available."
      )}

      <div class="nc-warning">
        ⚠️ Always verify insulin type, concentration,
        prescription and institutional protocol before administration.
      </div>

      <h3>Safety Reference</h3>

      <p>
        This calculator calculates volume from an ordered insulin dose
        and concentration. It does not provide a universal
        blood-glucose-to-insulin dosing chart.
      </p>
    `;

    openCalculator("Insulin Calculator", html, (modal) => {

      const ordered =
        num(modal.querySelector("#insulinOrdered").value);

      const available =
        num(modal.querySelector("#insulinAvailable").value);

      if (!ordered || !available) {
        showMessage("Missing Information", "Enter both values.");
        return;
      }

      const volume =
        ordered / available;

      return `
        <strong>Required Volume</strong>

        <div class="nc-big-result">
          ${format(volume)} mL
        </div>

        <div class="nc-warning">
          ⚠️ Verify insulin type and concentration independently
          before administration.
        </div>
      `;
    });
  }

  /* =========================================================
     10. HEPARIN
  ========================================================= */

  function heparinCalculator() {

    const html = `

      ${field(
        "Ordered Rate",
        "hepOrdered",
        "units/hr",
        "",
        "Prescribed heparin infusion rate."
      )}

      ${field(
        "Total Units in Vial/Bag",
        "hepTotalUnits",
        "units",
        "",
        "Total heparin units present."
      )}

      ${field(
        "Vial/Bag Volume",
        "hepVialVolume",
        "mL",
        "",
        "Total volume containing the listed units."
      )}

      <hr>

      <h3>Required mL Draw</h3>

      ${field(
        "Required Units",
        "hepRequiredUnits",
        "units",
        "",
        "Units that need to be drawn."
      )}
    `;

    openCalculator("Heparin Calculator", html, (modal) => {

      const ordered =
        num(modal.querySelector("#hepOrdered").value);

      const totalUnits =
        num(modal.querySelector("#hepTotalUnits").value);

      const vialVolume =
        num(modal.querySelector("#hepVialVolume").value);

      const requiredUnits =
        num(modal.querySelector("#hepRequiredUnits").value);

      if (!totalUnits || !vialVolume) {
        showMessage(
          "Missing Information",
          "Enter total units and vial/bag volume."
        );
        return;
      }

      const concentration =
        totalUnits / vialVolume;

      let html = `
        <strong>Heparin Concentration</strong>

        <p>
          ${format(concentration)} units/mL
        </p>
      `;

      if (ordered) {

        const mlHr =
          ordered / concentration;

        html += `
          <div class="nc-big-result">
            ${format(mlHr)} mL/hr
          </div>

          <small>
            Based on the ordered rate.
          </small>
        `;
      }

      if (requiredUnits) {

        const drawVolume =
          requiredUnits / concentration;

        html += `
          <hr>

          <strong>Required Draw Volume</strong>

          <div class="nc-big-result">
            ${format(drawVolume)} mL
          </div>
        `;
      }

      return html;
    });
  }

  /* =========================================================
     11. DRUG MATH
  ========================================================= */

  function drugMathCalculator() {

    const html = `

      ${field(
        "Ordered Dose",
        "drugOrdered",
        "mg"
      )}

      ${field(
        "Available Dose",
        "drugAvailable",
        "mg"
      )}

      ${field(
        "Available Volume",
        "drugVolume",
        "mL"
      )}
    `;

    openCalculator("Drug Math", html, (modal) => {

      const ordered =
        num(modal.querySelector("#drugOrdered").value);

      const available =
        num(modal.querySelector("#drugAvailable").value);

      const volume =
        num(modal.querySelector("#drugVolume").value);

      if (!ordered || !available || !volume) {
        showMessage("Missing Information", "Enter all values.");
        return;
      }

      const result =
        (ordered / available) * volume;

      return `
        <strong>Required Volume</strong>

        <div class="nc-big-result">
          ${format(result)} mL
        </div>
      `;
    });
  }

  /* =========================================================
     12. REFERENCES
  ========================================================= */

  function referencesCalculator() {

    showMessage(
      "Nursing References",
      "Always verify medication doses, concentrations, preparation instructions and institutional protocols before administration."
    );
  }

  /* =========================================================
     CALCULATOR ROUTER
  ========================================================= */

  const calculators = {

    dose:
      doseCalculator,

    "dose-calculator":
      doseCalculator,

    injection:
      injectionVolumeCalculator,

    "injection-volume":
      injectionVolumeCalculator,

    iv:
      ivFlowRateCalculator,

    "iv-flow":
      ivFlowRateCalculator,

    "iv-flow-rate":
      ivFlowRateCalculator,

    drip:
      dripRateCalculator,

    "drip-rate":
      dripRateCalculator,

    pediatric:
      pediatricDoseCalculator,

    "pediatric-dose":
      pediatricDoseCalculator,

    bsa:
      bsaCalculator,

    dilution:
      dilutionCalculator,

    percentage:
      percentageCalculator,

    insulin:
      insulinCalculator,

    heparin:
      heparinCalculator,

    "drug-math":
      drugMathCalculator,

    references:
      referencesCalculator
  };

  /* =========================================================
     CARD CLICK HANDLER
  ========================================================= */

  document.addEventListener("click", (event) => {

    const element =
      event.target.closest(
        "[data-calculator], [data-calc], .calculator-card, .calc-card"
      );

    if (!element) return;

    let key =
      element.dataset.calculator ||
      element.dataset.calc;

    if (!key) {

      const text =
        element.innerText.toLowerCase();

      if (text.includes("dose")) key = "dose";
      else if (text.includes("injection")) key = "injection";
      else if (text.includes("iv flow")) key = "iv-flow";
      else if (text.includes("drip")) key = "drip";
      else if (text.includes("pediatric")) key = "pediatric";
      else if (text.includes("bsa")) key = "bsa";
      else if (text.includes("dilution")) key = "dilution";
      else if (text.includes("percentage")) key = "percentage";
      else if (text.includes("insulin")) key = "insulin";
      else if (text.includes("heparin")) key = "heparin";
      else if (text.includes("drug math")) key = "drug-math";
      else if (text.includes("reference")) key = "references";
    }

    if (key && calculators[key]) {

      event.preventDefault();
      calculators[key]();

    }

  });

  /* =========================================================
     GLOBAL CALCULATOR BUTTON SUPPORT
  ========================================================= */

  document.querySelectorAll("button").forEach(button => {

    const text =
      button.innerText.toLowerCase();

    if (
      text.includes("dose calculator") ||
      text.includes("injection volume") ||
      text.includes("iv flow rate") ||
      text.includes("drip rate") ||
      text.includes("pediatric dose") ||
      text.includes("bsa calculator") ||
      text.includes("dilution") ||
      text.includes("percentage") ||
      text.includes("insulin") ||
      text.includes("heparin")
    ) {

      button.addEventListener("click", () => {

        if (text.includes("dose calculator"))
          doseCalculator();

        else if (text.includes("injection volume"))
          injectionVolumeCalculator();

        else if (text.includes("iv flow rate"))
          ivFlowRateCalculator();

        else if (text.includes("drip rate"))
          dripRateCalculator();

        else if (text.includes("pediatric dose"))
          pediatricDoseCalculator();

        else if (text.includes("bsa calculator"))
          bsaCalculator();

        else if (text.includes("dilution"))
          dilutionCalculator();

        else if (text.includes("percentage"))
          percentageCalculator();

        else if (text.includes("insulin"))
          insulinCalculator();

        else if (text.includes("heparin"))
          heparinCalculator();

      });

    }

  });

  console.log(
    "NurseCalc loaded successfully — Created by Nikhil"
  );

});
/* =========================================================
   NURSECALC - UI FEATURES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------------------------------------
     1. TOP THEME + GENDER CONTROLS
  --------------------------------------------------------- */

  const topControls = document.createElement("div");
  topControls.className = "nc-top-controls";

  topControls.innerHTML = `
    <button class="nc-theme-btn" id="ncThemeBtn">
      ☀️ Light
    </button>

    <div style="position:relative;">
      <button class="nc-gender-btn" id="ncGenderBtn">
        🎨 Theme
      </button>

      <div class="nc-gender-menu" id="ncGenderMenu">
        <button class="nc-gender-choice" data-gender="boy">
          👨 Boy — Blue
        </button>

        <button class="nc-gender-choice" data-gender="girl">
          👩 Girl — Pink
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(topControls);


  /* ---------------------------------------------------------
     2. LOAD SAVED THEME
  --------------------------------------------------------- */

  const savedTheme =
    localStorage.getItem("nurseCalcTheme");

  const savedGender =
    localStorage.getItem("nurseCalcGender");
    if (savedTheme === "dark") {
    document.body.classList.add("nc-dark");
  }

  if (savedGender === "boy") {
    document.body.classList.add("nc-boy");
  }

  if (savedGender === "girl") {
    document.body.classList.add("nc-girl");
  }


  /* ---------------------------------------------------------
     3. LIGHT / DARK BUTTON
  --------------------------------------------------------- */

  const themeBtn =
    document.getElementById("ncThemeBtn");

  function updateThemeButton() {

    const dark =
      document.body.classList.contains("nc-dark");

    themeBtn.textContent =
      dark ? "☀️ Light" : "🌙 Dark";
  }

  updateThemeButton();

  themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("nc-dark");

    const dark =
      document.body.classList.contains("nc-dark");

    localStorage.setItem(
      "nurseCalcTheme",
      dark ? "dark" : "light"
    );

    updateThemeButton();
  });


  /* ---------------------------------------------------------
     4. BOY / GIRL THEME
  --------------------------------------------------------- */

  const genderBtn =
    document.getElementById("ncGenderBtn");

  const genderMenu =
    document.getElementById("ncGenderMenu");

  genderBtn.addEventListener("click", () => {
    genderMenu.classList.toggle("show");
  });

  document.querySelectorAll(".nc-gender-choice")
    .forEach(button => {

      button.addEventListener("click", () => {

        const gender =
          button.dataset.gender;

        document.body.classList.remove(
          "nc-boy",
          "nc-girl"
        );

        document.body.classList.add(
          `nc-${gender}`
        );

        localStorage.setItem(
          "nurseCalcGender",
          gender
        );

        genderMenu.classList.remove("show");
      });

    });


  /* ---------------------------------------------------------
     5. CHANGE CALCULATE WITH CONFIDENCE ICON
  --------------------------------------------------------- */

  const welcomeIcon =
    document.querySelector(
      ".welcome-icon"
    );

  if (welcomeIcon) {

  welcomeIcon.classList.remove("nc-stethoscope");

  const isGirl =
    document.body.classList.contains("nc-girl");

  if (isGirl) {
    welcomeIcon.innerHTML = `
      <span class="welcome-deco heart">♥️</span>
      <span class="welcome-deco stethoscope">🩺</span>
      <span class="welcome-deco mask">😷</span>
    `;
  } else {
    welcomeIcon.innerHTML = `
      <span class="welcome-deco plus">➕</span>
      <span class="welcome-deco stethoscope">🩺</span>
      <span class="welcome-deco mask">😷</span>
    `;
  }

}


  /* ---------------------------------------------------------
     6. RECENT CALCULATIONS
  --------------------------------------------------------- */

  let recent =
    JSON.parse(
      localStorage.getItem(
        "nurseCalcRecent"
      ) || "[]"
    );

  function saveRecent(title, result) {

    const item = {
      title,
      result,
      time: new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )
    };

    recent =
      recent.filter(
        x => x.title !== title
      );

    recent.unshift(item);

    recent =
      recent.slice(0, 8);

    localStorage.setItem(
      "nurseCalcRecent",
      JSON.stringify(recent)
    );

    renderRecent();
  }


  function createRecentSection() {

    if (
      document.querySelector(
        ".nc-recent-section"
      )
    ) {
      return;
    }

    const section =
      document.createElement("section");

    section.className =
      "nc-recent-section";

    section.innerHTML = `
      <div class="nc-recent-title">
        <h2>🕘 Recent Calculations</h2>

        <button
          id="ncClearRecent"
          class="nc-gender-btn">
          Clear
        </button>
      </div>

      <div
        class="nc-recent-list"
        id="ncRecentList">
      </div>
    `;

    const main =
      document.querySelector(
        "main"
      );

    if (main) {

      main.appendChild(section);

    } else {

      document.body.appendChild(section);

    }

    document
      .getElementById("ncClearRecent")
      .addEventListener("click", () => {

        recent = [];

        localStorage.removeItem(
          "nurseCalcRecent"
        );

        renderRecent();

      });
  }


  function renderRecent() {

    createRecentSection();

    const list =
      document.getElementById(
        "ncRecentList"
      );

    if (!list) return;

    if (!recent.length) {

      list.innerHTML = `
        <div class="nc-recent-empty">
          No calculations yet.
          <br>
          Your recent calculations will appear here.
        </div>
      `;

      return;
    }

    list.innerHTML =
      recent.map(item => `
        <div class="nc-recent-item">

          <div>
            <strong>
              ${item.title}
            </strong>

            <small>
              ${item.result}
            </small>
          </div>

          <small>
            ${item.time}
          </small>

        </div>
      `).join("");
  }

  renderRecent();


  /* ---------------------------------------------------------
     7. WATCH CALCULATOR RESULTS
  --------------------------------------------------------- */

  const observer =
    new MutationObserver(() => {

      const modal =
        document.getElementById(
          "nurseCalcModal"
        );

      if (!modal) return;

      const calculate =
        modal.querySelector(
          "#ncCalculate"
        );

      if (
        calculate &&
        !calculate.dataset.recentAttached
      ) {

        calculate.dataset.recentAttached =
          "true";

        calculate.addEventListener(
          "click",
          () => {

            setTimeout(() => {

              const title =
                modal.querySelector(
                  ".nc-modal-header h2"
                )?.textContent;

              const result =
                modal.querySelector(
                  ".nc-result"
                )?.innerText;

              if (
                title &&
                result &&
                result.trim()
              ) {

                saveRecent(
                  title.trim(),
                  result.trim()
                    .replace(/\n+/g, " ")
                    .slice(0, 100)
                );

              }

            }, 100);

          }
        );
      }

    });

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );


  /* ---------------------------------------------------------
     8. BOTTOM NAVIGATION
  --------------------------------------------------------- */

  function openNavPanel(title, content) {

    const old =
      document.querySelector(
        ".nc-nav-panel"
      );

    if (old) old.remove();

    const panel =
      document.createElement("div");

    panel.className =
      "nc-nav-panel show";

    panel.innerHTML = `
      <div class="nc-nav-content">

        <button class="nc-nav-close">
          ×
        </button>

        <h2>${title}</h2>

        ${content}

      </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector(
      ".nc-nav-close"
    ).onclick = () => {
      panel.remove();
    };

    panel.addEventListener(
      "click",
      e => {

        if (
          e.target === panel
        ) {
          panel.remove();
        }

      }
    );
  }


  document.addEventListener(
    "click",
    event => {

      const nav =
        event.target.closest(
          ".nav-item"
        );

      if (!nav) return;

      const type =
        nav.dataset.nav;

      document
        .querySelectorAll(
          ".nav-item"
        )
        .forEach(x =>
          x.classList.remove(
            "nc-active"
          )
        );

      nav.classList.add(
        "nc-active"
      );


      /* HOME */

      if (type === "home") {

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        return;
      }


      /* CALCULATORS */

      if (
        type === "calculators" ||
        type === "calculator"
      ) {

        const section =
          document.querySelector(
            ".calculators-section"
          ) ||
          document.querySelector(
            "[data-section='calculators']"
          );

        if (section) {

          section.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        } else {

          window.scrollTo({
            top: 400,
            behavior: "smooth"
          });

        }

        return;
      }


      /* STUDY */

      if (type === "study") {

        const study =
          document.querySelector(
            ".study-section"
          ) ||
          document.querySelector(
            "[data-section='study']"
          ) ||
          [...document.querySelectorAll(
            "section"
          )].find(
            s =>
              s.innerText
                ?.toLowerCase()
                .includes("nursing study")
          );

        if (study) {

          study.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

        } else {

          openNavPanel(
            "📚 Nursing Study",
            `
              <div class="nc-nav-card">
                <strong>Nursing Notes</strong>
                <p>
                  Clinical notes and nursing study material.
                </p>
              </div>

              <div class="nc-nav-card">
                <strong>Exam Preparation</strong>
                <p>
                  Nursing calculations and clinical preparation.
                </p>
              </div>

              <div class="nc-nav-card">
                <strong>Clinical Topics</strong>
                <p>
                  More study modules will be added here.
                </p>
              </div>
            `
          );

        }

        return;
      }


      /* FAVORITES */

      if (type === "favorites") {

        let favoriteHTML = "";

        if (!recent.length) {

          favoriteHTML = `
            <div class="nc-nav-card">
              ⭐ No favorites yet.
              <p>
                Your frequently used calculators
                will appear here.
              </p>
            </div>
          `;

        } else {

          favoriteHTML =
            recent.map(item => `
              <div class="nc-nav-card">
                <strong>
                  ⭐ ${item.title}
                </strong>

                <p>
                  ${item.result}
                </p>
              </div>
            `).join("");

        }

        openNavPanel(
          "⭐ Favorites",
          favoriteHTML
        );

      }

    }
  );
  /* ================= PWA INSTALL ================= */

  let deferredPrompt = null;

  const installBtn = document.getElementById("installBtn");

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;

    if (installBtn) {
      installBtn.style.display = "block";
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        installBtn.style.display = "none";
      }

      deferredPrompt = null;
    });
  }

  window.addEventListener("appinstalled", () => {
    if (installBtn) {
      installBtn.style.display = "none";
    }
  });


/* ================= SEARCH ================= */

const searchBtn = document.getElementById("searchBtn");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const searchResults = document.getElementById("searchResults");

if (
  searchBtn &&
  searchPanel &&
  searchInput &&
  closeSearchBtn &&
  searchResults
) {

  searchBtn.addEventListener("click", () => {
    searchPanel.style.display = "block";
    searchInput.focus();
  });

  closeSearchBtn.addEventListener("click", () => {
    searchPanel.style.display = "none";
    searchInput.value = "";
    searchResults.innerHTML = "";
  });

  searchInput.addEventListener("input", () => {

    const query = searchInput.value.trim().toLowerCase();

    searchResults.innerHTML = "";

    if (!query) return;

    const items = document.querySelectorAll(
      ".calculator-card, .alert-card, .small-card, .study-card, .safety-card"
    );

    items.forEach((item) => {

      const text = item.innerText.toLowerCase();

      if (text.includes(query)) {

        const result = document.createElement("button");

        result.type = "button";
        result.className = "search-result";
        result.innerText = item.innerText.trim();

        result.addEventListener("click", () => {

          item.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

          searchPanel.style.display = "none";
          searchInput.value = "";
          searchResults.innerHTML = "";

        });

        searchResults.appendChild(result);
      }

    });

    if (!searchResults.children.length) {

      searchResults.innerHTML =
        `<div class="no-search-result">No results found.</div>`;

    }

  });

}
/* =========================================================
   FIRST TIME NAME SETUP
   ========================================================= */

const welcomeSetup = document.getElementById("welcomeSetup");
const userNameInput = document.getElementById("userNameInput");
const continueBtn = document.getElementById("continueBtn");

const savedUserName = localStorage.getItem("medSafeUserName");

function updateWelcomeMessage(name, returning = false) {
  const welcomeHeading = document.querySelector(".welcome-card h2");
  const welcomeText = document.querySelector(".welcome-card p");

  if (welcomeHeading) {
    welcomeHeading.textContent = returning
      ? `Welcome back, ${name} 👋`
      : `Welcome, ${name} 👋`;
  }

  if (welcomeText) {
    welcomeText.textContent = returning
      ? "Great to see you again! Let's continue calculating with confidence."
      : "Great to have you here! Let's start calculating with confidence.";
  }
}

if (savedUserName) {
  if (welcomeSetup) {
    welcomeSetup.style.display = "none";
  }

  updateWelcomeMessage(savedUserName, true);
}

if (continueBtn && userNameInput) {
  continueBtn.addEventListener("click", () => {
    const name = userNameInput.value.trim();

    if (!name) {
      userNameInput.focus();
      return;
    }

    localStorage.setItem("medSafeUserName", name);

    if (welcomeSetup) {
      welcomeSetup.style.display = "none";
    }

    updateWelcomeMessage(name, false);
  });
}
   const menuBtn = document.getElementById("menuBtn");
const mainMenu = document.getElementById("mainMenu");

if (menuBtn && mainMenu) {

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const isOpen = mainMenu.style.display === "block";

    mainMenu.style.display = isOpen ? "none" : "block";
  });

  document.addEventListener("click", (e) => {

    if (
      mainMenu.style.display === "block" &&
      !mainMenu.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {
      mainMenu.style.display = "none";
    }

  });
}
/* =========================================================
   PROFILE — SAVE / EDIT / LOAD
========================================================= */

const profileBtn = document.querySelector(
  '#mainMenu button[data-menu="profile"]'
);

const profilePanel = document.getElementById("profilePanel");

const profileName = document.getElementById("profileName");
const profileAge = document.getElementById("profileAge");
const profileGender = document.getElementById("profileGender");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const closeProfileBtn = document.getElementById("closeProfileBtn");


function loadProfile() {

  const savedProfile = JSON.parse(
    localStorage.getItem("medSafeProfile") || "null"
  );

  if (!savedProfile) return;

  profileName.value = savedProfile.name || "";
  profileAge.value = savedProfile.age || "";
  profileGender.value = savedProfile.gender || "";
}


function openProfile() {

  loadProfile();

  if (profilePanel) {
    profilePanel.style.display = "block";
  }

  if (mainMenu) {
    mainMenu.style.display = "none";
  }
}


function closeProfile() {

  if (profilePanel) {
    profilePanel.style.display = "none";
  }
}


if (profileBtn && profilePanel) {

  profileBtn.addEventListener("click", (e) => {

    e.preventDefault();
    e.stopPropagation();

    openProfile();

  });

}


if (saveProfileBtn) {

  saveProfileBtn.addEventListener("click", () => {

    const profile = {

      name: profileName.value.trim(),

      age: profileAge.value.trim(),

      gender: profileGender.value

    };


    localStorage.setItem(
      "medSafeProfile",
      JSON.stringify(profile)
    );


    // Welcome card ka naam bhi update rahe
    if (profile.name) {

      localStorage.setItem(
        "medSafeUserName",
        profile.name
      );

      if (typeof updateWelcomeMessage === "function") {
        updateWelcomeMessage(profile.name, true);
      }

    }


    // Save ke baad profile close
    closeProfile();

  });

}


if (closeProfileBtn) {

  closeProfileBtn.addEventListener("click", () => {

    closeProfile();

  });

}


loadProfile();
});
