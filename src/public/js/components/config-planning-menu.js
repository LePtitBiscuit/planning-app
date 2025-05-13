import { TimeDropdown, TimeSlot, FileDropdown } from "./dropdownoptions.js";
import { ColumnInputs } from "./columninputs.js";
import { AddRowPlanningMenu } from "./addrow-planning-menu.js";
export class ConfigPlanningMenu {
  constructor() {}

  initialize(page, planningTable) {
    this.planningTable = planningTable;
    this.page = page;
    this.configurationSection = this.page.querySelector("#first-section");
    this.configurationSection.innerHTML = `<div class="mb-3">
    <div class="flex flex-col items-start">
      <span class="text-xl font-bold text-gray-900 absolute left-[1.5rem] top-[1rem]">Configuration</span>
      <div class="w-full flex justify-center">
        <div class="flex flex-col items-center max-h-[65px] mt-8">
          <label class=" font-bold mb-1 self-start" for="select-model">Model</label>
          <div id="dropdown-model" class="relative">
            
          </div>
        </div>
      </div>
    </div>
  </div>
  
  
  `;
    this.createMenuStructure();
  }

  /**
   * Create the menu structure with all inputs
   */
  createMenuStructure() {
    // Create model section
    this.createModelSection();

    // Create title section
    this.createTitleSection();

    // Create columns section
    this.createColumnsSection();

    // Create time range section
    this.createTimeRangeSection();

    // Create create button
    this.createCreateButton();
  }

  /**
   * Create the title input section
   * @returns {HTMLElement} The title section element
   */
  createTitleSection() {
    this.configurationSection.innerHTML += `
      <div id="title-section" class="mb-3 max-h-[65px]">
          <label class="block  font-bold mb-1" for="titre">Titre</label>
          <!-- Input titre -->
      </div>`;

    setTimeout(() => {
      const titleSection = this.page.querySelector("#title-section");

      const input = document.createElement("input");
      input.id = "titre";
      input.type = "text";
      input.placeholder = "Entrez le titre du planning";
      input.className =
        "w-[250px] max-h-[40px] border border-gray-200 rounded-lg ml-2 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

      titleSection.appendChild(input);

      input.addEventListener("input", (event) => {
        if (this.planningTable) {
          this.planningTable.updateTitle(event.target.value);
        } else {
          console.error("Planning table instance not found in window object");
        }
      });
    }, 0); // 100ms de délai
  }

  /**
   * Create the model section
   * @returns {HTMLElement} The model section element
   */
  createModelSection() {
    setTimeout(() => {
      // Initialize model dropdown
      window.modelDropdown = new FileDropdown("dropdown-model", "dropdown-model", "config", "planning");
      window.modelDropdown.init(this.page, this.planningTable);
    }, 0);
  }

  /**
   * Create the columns section
   * @returns {HTMLElement} The columns section element
   */
  createColumnsSection() {
    this.configurationSection.innerHTML += `
    <div id="columns-section" class="mb-3 w-fit">
    <span class="block font-bold mb-2">Colonnes</span>

  </div>`;

    // Ajouter un délai avant d'initialiser les colonnes
    setTimeout(() => {
      // Récupérer la section de colonnes depuis le DOM au lieu de la créer
      const section = this.page.querySelector("#columns-section");

      // Initialiser la classe ColumnInputs avec la section de colonnes
      this.columnInputs = new ColumnInputs("config");

      // Initialiser ColumnInputs avec la référence à la section dans le DOM
      this.columnInputs.init(section, this.planningTable);
    }, 0); // 100ms de délai

    return this.page.querySelector("#columns-section");
  }

  /**
   * Create the time range section
   * @returns {HTMLElement} The time range section element
   */
  createTimeRangeSection() {
    this.configurationSection.innerHTML += `<div class="mb-4">
    <span class="block  font-bold mb-2">Plage horaire</span>
    <div id="time-range-container" class="flex flex-row items-center gap-4 ml-2">
      <div id="planning-start-time-container" class="flex items-center gap-2">
        <label class="font-medium min-w-fit">Heure de début :</label>
        <!-- Dropdown Heure Debut -->
      </div>

      <div id="planning-end-time-container" class="flex items-center gap-2">
        <label class="font-medium min-w-fit">Heure de fin :</label>
        <!-- Dropdown Heure Fin -->
      </div>

      <div id="planning-duration-container" class="flex items-center gap-2">
        <label class="font-medium min-w-fit">Durée d'un créneau :</label>
        <!-- Dropdown Duree -->
      </div>
    </div>
  </div>`;

    // Add a delay before initializing time dropdowns
    setTimeout(() => {
      // Initialize time dropdowns using the TimeDropdown class

      this.timeDropdowns = {
        "heure-debut": new TimeDropdown("dropdown-heure-debut", "heure-debut", 6, 18, 15, "planning"),
        "heure-fin": new TimeDropdown("dropdown-heure-fin", "heure-fin", 7, 18, 15, "planning"),
        duree: new TimeSlot("dropdown-duree", "planning"),
      };
      setTimeout(() => {
        for (const dropdown of Object.values(this.timeDropdowns)) {
          dropdown.init(this.page, this.planningTable, this);
          dropdown.generateOptions();
        }
      }, 0);
    }, 0); // 100ms delay
  }

  /**
   * Create the create button
   * @returns {HTMLElement} The create button container
   */
  createCreateButton() {
    this.configurationSection.innerHTML += `
    <div id="create-button-container" class="flex justify-center">
      <!-- Button Créer le planning -->
    </div>`;
    const container = this.page.querySelector("#create-button-container");

    const button = document.createElement("button");
    button.className =
      "bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-1 text-base transition-colors";
    button.textContent = "Créer le planning";

    container.appendChild(button);

    button.addEventListener("click", () => {
      // window.planningTable.addRow(this.getColumnValues(), this.getConfiguration());
      this.planningTable.firstSection = new AddRowPlanningMenu();
      this.planningTable.firstSection.initialize(this.page, this.planningTable);
      // Code pour affichier le bouton de paramètre du planning
      this.planningTable.showPlanningSettingsButton();
      this.planningTable.showTimeSlots = true;
      this.planningTable.generateTimeSlots();
    });
  }

  /**
   * Get the current column values
   * @returns {Array} The column values
   */
  getColumnValues() {
    const columnInputs = this.page.querySelectorAll('#column-inputs input[type="text"]');
    return Array.from(columnInputs).map((input) => input.value);
  }

  loadModel(content) {
    console.log("content", content);
    const section = this.page.querySelector("#columns-section");
    let columnInputs = this.page.querySelectorAll("#column-inputs");
    columnInputs.forEach((input) => {
      input.remove();
    });
    this.page.querySelector("#titre").value = content?.title.replace(/_/g, " ").replace(/-/g, "/") || "";

    this.columnInputs = new ColumnInputs("config", content?.columns || []);
    this.columnInputs.init(section, this.planningTable);

    this.timeDropdowns["heure-debut"].select(content?.timeSlots[0] || "06h00");
    this.timeDropdowns["heure-fin"].select(content?.timeSlots[content?.timeSlots.length - 1] || "18h00");
    let slotDuration = "15min";
    if (content) {
      slotDuration =
        content?.slotDuration === 15
          ? "15min"
          : content?.slotDuration === 20
          ? "20min"
          : content?.slotDuration === 30
          ? "30min"
          : "1h";
    }

    this.timeDropdowns["duree"].select(slotDuration);

    setTimeout(() => {
      columnInputs = this.page.querySelectorAll("#column-inputs input[type='text']");
      columnInputs.forEach((input, index) => {
        input.value = content?.columns[index] || "";
      });
    }, 0);

    this.page.querySelector("#planning-container").innerHTML = "";

    this.planningTable.initialize(this.page, {
      title:
        content?.title.replace(/_/g, " ").replace(/-/g, "/") || "Planning du " + new Date().toLocaleDateString("fr-FR"),
      startTime: content?.timeSlots[0] || "06h00",
      endTime: content?.timeSlots[content?.timeSlots.length - 1] || "18h00",
      slotDuration: content?.slotDuration || 15,
      columns: content?.columns || ["Colonne 1"],
      rows: content?.rows || [],
    });
  }

  updateTimeDropdowns() {
    this.timeDropdowns["heure-debut"].generateOptions();
    this.timeDropdowns["heure-fin"].generateOptions();
    // this.timeDropdowns["duree"].generateOptions();
  }

  updatePlanningTableTimeSlots() {
    const durations = ["15min", "20min", "30min", "1h"];
    let startTime = this.timeDropdowns["heure-debut"].selectedValue;
    let endTime = this.timeDropdowns["heure-fin"].selectedValue;
    let duration = durations[this.timeDropdowns["duree"].selectedIndex];

    this.planningTable.updateTimeSlots(startTime, endTime, duration);
  }
}
