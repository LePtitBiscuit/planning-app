import { TimeDropdown, StyleDropdown } from "./dropdownoptions.js";
import { ColumnInputs } from "./columninputs.js";
import { TimeRangeGenerator } from "../tools/timerangegenerator.js";

export class AddRowPlanningMenu {
  constructor() {}
  initialize(page, planningTable) {
    this.planningTable = planningTable;
    this.page = page;
    this.page.querySelector("#first-section").classList.add("pb-2");
    this.configurationSection = this.page.querySelector("#first-section");
    this.configurationSection.innerHTML = "";
    this.configurationSection.innerHTML = `<div class="mb-8">
    <div class="flex flex-col items-start">
      <span class="text-xl font-bold text-gray-900 absolute left-[1.5rem] top-[1rem]">Ajouter une ligne</span>
    </div>
  </div>
  `;
    this.createMenuStructure();
  }

  /**
   * Create the menu structure with all inputs
   */
  createMenuStructure() {
    // Create columns section
    this.createColumnsSection();

    // Create time range section
    this.createTimeRangeSection();

    this.createStyleSection();

    // Create create button
    this.createAddRowButton();
  }

  /**
   * Create the title input section
   * @returns {HTMLElement} The title section element
   */

  /**
   * Create the columns section
   * @returns {HTMLElement} The columns section element
   */
  createColumnsSection() {
    this.configurationSection.innerHTML += `
    <div id="columns-section" class="mb-3 w-fit">
    <span class="block font-bold mb-2">Colonnes</span>
    
    
  </div>`;

    setTimeout(() => {
      // Récupérer la section de colonnes depuis le DOM au lieu de la créer
      const section = this.page.querySelector("#columns-section");

      // Initialiser la classe ColumnInputs avec la section de colonnes
      this.columnInputs = new ColumnInputs("addrow", this.planningTable.columns);

      // Initialiser ColumnInputs avec la référence à la section dans le DOM
      this.columnInputs.init(section, this.planningTable);
    }, 0);
  }

  /**
   * Create the time range section
   * @returns {HTMLElement} The time range section element
   */
  createTimeRangeSection() {
    this.configurationSection.innerHTML += `<div id="time-range-and-style-section" class="flex gap-12">
    <div id="time-range-section">
    <span class="block  font-bold mb-2">Plage horaire</span>
    <div id="time-range-container" class="flex flex-row items-center gap-4 ml-2">
      <div id="start-time-container" class="flex items-center gap-2">
        <label class="font-medium min-w-fit">Heure de début :</label>
        <!-- Dropdown Heure Debut -->
      </div>

      <div id="end-time-container" class="flex items-center gap-2">
        <label class="font-medium min-w-fit">Heure de fin :</label>
        <!-- Dropdown Heure Fin -->
      </div>

      <div id="duration-container" class="flex items-center gap-2">
        <label class="font-medium min-w-fit">Durée:</label>
        <!-- Dropdown Duree -->
      </div>
    </div>
  </div>`;
    // Initialize time dropdowns using the TimeDropdown class
    let _ = null;
    const timeSlots = this.planningTable.timeSlots;
    const startTime = this.planningTable.timeSlots[0];
    const endTime = this.planningTable.timeSlots[this.planningTable.timeSlots.length - 1];
    const duration = this.planningTable.slotDuration;
    setTimeout(() => {
      this.timeDropdowns = {
        "heure-debut": new TimeDropdown("dropdown-heure-debut", "heure-debut", _, _, duration, "row", timeSlots),
        "heure-fin": new TimeDropdown("dropdown-heure-fin", "heure-fin", _, _, duration, "row", timeSlots),
        duree: new TimeDropdown(
          "dropdown-duree",
          "duree",
          _,
          _,
          duration,
          "row",
          TimeRangeGenerator.generateTimeOptions(startTime, endTime, duration)
        ),
      };
      setTimeout(() => {
        for (const dropdown of Object.values(this.timeDropdowns)) {
          dropdown.init(this.page, this.planningTable, this);
        }
      }, 0);
    }, 0);
  }

  /**
   * Create the create button
   * @returns {HTMLElement} The create button container
   */
  createAddRowButton() {
    this.configurationSection.innerHTML += `
    <div id="addrow-button-container" class="flex justify-center flex-col items-center">
      <!-- Button Ajouter une ligne -->
    </div>`;
    const container = this.page.querySelector("#addrow-button-container");

    const button = document.createElement("button");
    button.className =
      "bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-1 text-base transition-colors flex items-center justify-center gap-2";

    // Create image element
    const img = document.createElement("img");
    img.src = "../public/images/add-row.svg";
    img.alt = "Ajouter";

    // Create text span
    const text = document.createElement("span");
    text.textContent = "Ajouter une ligne";

    // Append image and text to button
    button.appendChild(img);
    button.appendChild(text);

    container.appendChild(button);

    // Create row count indicators
    const rowCountContainer = document.createElement("div");
    rowCountContainer.className = "flex justify-center gap-3 text-sm text-gray-600 mt-1";

    const totalRowsText = document.createElement("span");
    totalRowsText.id = "total-rows-text";
    totalRowsText.textContent = `Lignes: ${this.planningTable.rows.length}`;
    rowCountContainer.appendChild(totalRowsText);

    const maxRowsText = document.createElement("span");
    maxRowsText.textContent = "Max: 28";
    rowCountContainer.appendChild(maxRowsText);

    container.appendChild(rowCountContainer);

    // Add event listener to the button
    button.addEventListener("click", () => this.handleAddRow());
    if (this.planningTable.rows.length === 28) {
      this.toggleAddRowButton();
    }
  }

  createStyleSection() {
    const timeRangeAndStyleSection = this.page.querySelector("#time-range-and-style-section");
    timeRangeAndStyleSection.innerHTML += `
    <div id="style-section" class="mb-4">
      <!-- Style Section -->
        <span class="block font-bold mb-2">Style</span>
        <div id="style-container" class="flex flex-row gap-4 items-end ml-2 relative">
          <label class="font-medium min-w-fit">Couleur :</label>
          <!-- Style Dropdown -->
        </div>
    </div>`;
    setTimeout(() => {
      this.styleDropdown = new StyleDropdown("style-dropdown", "style-container");
      this.styleDropdown.init(this.page);
    }, 0);
  }

  toggleAddRowButton() {
    const button = this.page.querySelector("#addrow-button-container button");
    if (button.disabled) {
      button.disabled = false;
      button.classList.remove("opacity-50");
      button.classList.add("hover:bg-blue-700");
    } else {
      button.disabled = true;
      button.classList.remove("hover:bg-blue-700");
      button.classList.add("opacity-50");
    }
  }

  updateRowCount() {
    const totalRowsText = this.page.querySelector("#total-rows-text");
    totalRowsText.textContent = `Lignes: ${this.planningTable.rows.length}`;
  }

  /**
   * Get the current configuration values
   * @returns {Object} The configuration values
   */
  getConfigValues() {
    const columnValues = this.columnInputs.columnsValues;
    const timeValues = {
      startTime: this.timeDropdowns["heure-debut"].selectedValue,
      endTime: this.timeDropdowns["heure-fin"].selectedValue,
    };

    const styleValues = {
      color: this.styleDropdown.colors.find((color) => color.name === this.styleDropdown.selectedValue).value,
    };

    setTimeout(() => {
      this.columnInputs.clearInputs();
    }, 0);

    return {
      columns: Object.values(columnValues),
      time: Object.values(timeValues),
      style: styleValues,
    };
  }

  /**
   * Handle the add row button click
   * Collects input values and calls the addRow function of the planning table
   */
  handleAddRow() {
    const config = this.getConfigValues();
    this.planningTable.addRow(config.columns, config.time, config.style.color);
    if (this.planningTable.rows.length === 28) {
      this.toggleAddRowButton();
    }
  }

  updateTimeDropdowns() {
    let timeSlots = this.planningTable.timeSlots;

    this.timeDropdowns["heure-debut"].update(timeSlots[0], "heure-debut");
    this.timeDropdowns["heure-fin"].update(timeSlots[timeSlots.length - 1], "heure-fin");
    this.timeDropdowns["heure-fin"].select(timeSlots[timeSlots.length - 1]);
  }

  updateEndTimeBasedOnDuration(type) {
    // Get values from all time dropdowns
    const startTime = this.timeDropdowns["heure-debut"].selectedValue;
    const endTime = this.timeDropdowns["heure-fin"].selectedValue;

    if (!startTime || !endTime) return;

    // Parse times
    const [startHour, startMinute] = startTime.split("h").map(Number);
    const [endHour, endMinute] = endTime.split("h").map(Number);

    // Handle different dropdown types
    if (type === "duree") {
      // Update end time based on start time and duration
      const [durationHours, durationMinutes] = this.timeDropdowns["duree"].selectedValue.split("h").map(Number);
      let newEndHour = startHour + durationHours;
      let newEndMinute = startMinute + durationMinutes;

      if (newEndMinute >= 60) {
        newEndHour += Math.floor(newEndMinute / 60);
        newEndMinute %= 60;
      }

      const formattedEndTime = `${String(newEndHour).padStart(2, "0")}h${String(newEndMinute).padStart(2, "0")}`;
      this.timeDropdowns["heure-fin"].update(formattedEndTime, "heure-fin");
    } else {
      // Update duration based on start and end times (for both start and end time changes)
      let durationHours = endHour - startHour;
      let durationMinutes = endMinute - startMinute;

      if (durationMinutes < 0) {
        durationHours -= 1;
        durationMinutes += 60;
      }

      if (durationHours < 0) {
        durationHours = 0;
        durationMinutes = 0;
      }
      const formattedDuration = `${String(durationHours).padStart(2, "0")}h${String(durationMinutes).padStart(2, "0")}`;
      this.timeDropdowns["duree"].update(formattedDuration, "duree");
    }
  }
}
