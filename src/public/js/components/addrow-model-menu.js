import { ColumnInputs } from "./columninputs.js";

export class AddRowModelMenu {
  constructor() {}
  initialize(page, modelTable) {
    this.modelTable = modelTable;
    this.page = page;
    this.configurationSection = this.page.querySelector("#first-section");
    this.page.querySelector("#first-section").classList.add("pb-2");

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
    
    <div id="column-inputs" class="flex flex-row gap-4 items-end ml-2 relative">
      <!-- Columns Inputs  -->
    </div>
  </div>`;

    setTimeout(() => {
      // Récupérer la section de colonnes depuis le DOM au lieu de la créer
      const section = this.page.querySelector("#columns-section");

      // Initialiser la classe ColumnInputs avec la section de colonnes
      this.columnInputs = new ColumnInputs("addrow", this.modelTable.columns, "model");

      // Initialiser ColumnInputs avec la référence à la section dans le DOM
      this.columnInputs.init(section, this.modelTable);
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
    totalRowsText.textContent = `Lignes: ${this.modelTable.rows.length}`;
    rowCountContainer.appendChild(totalRowsText);

    const maxRowsText = document.createElement("span");
    maxRowsText.textContent = "Max: 28";
    rowCountContainer.appendChild(maxRowsText);

    container.appendChild(rowCountContainer);

    // Add event listener to the button
    button.addEventListener("click", () => this.handleAddRow());
    if (this.modelTable.rows.length === 28) {
      this.toggleAddRowButton();
    }
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
    totalRowsText.textContent = `Lignes: ${this.modelTable.rows.length}`;
  }

  /**
   * Get the current configuration values
   * @returns {Object} The configuration values
   */
  getConfigValues() {
    const columnValues = this.columnInputs.columnsValues;

    setTimeout(() => {
      this.columnInputs.clearInputs();
    }, 0);

    return {
      columns: Object.values(columnValues),
      time: [],
      style: { color: null },
    };
  }

  /**
   * Handle the add row button click
   * Collects input values and calls the addRow function of the planning table
   */
  handleAddRow() {
    const config = this.getConfigValues();
    this.modelTable.addRow(config.columns, config.time, config.style.color);
    if (this.modelTable.rows.length === 28) {
      this.toggleAddRowButton();
    }
  }
}
