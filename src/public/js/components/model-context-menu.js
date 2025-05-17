import { TimeDropdown, TimeSlot } from "./dropdownoptions.js";
import { SelectLogosPopup } from "./logos-selections.js";
export class ModelContextMenu {
  /**
   * @param {HTMLElement|string} container - Le container DOM ou son id où injecter le menu
   * @param {Object} planningInstance - L'instance du planning affilié
   */
  constructor(container, modelInstance) {
    this.page = modelInstance.page;
    this.container = container;
    this.model = modelInstance;
    this.menuId = "model-context-menu-popup";
    this.buttonId = "model-context-menu-btn";
    this.menuContainer = document.createElement("div");
    this.isOpen = false;
    this.timeDropdowns = {};
    this.selectLogosPopup = new SelectLogosPopup(this.page, this.model);

    this.renderButton();
  }

  renderButton() {
    // Crée le bouton d'ouverture du menu contextuel
    const btn = document.createElement("button");
    btn.id = this.buttonId;
    btn.className = "flex items-center gap-2 pb-2 rounded hover:bg-gray-100 focus:outline-none ml-auto";
    btn.innerHTML = `<img src="../public/images/planning-settings.svg" alt="Menu" class="w-6 h-6" />`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Créer un conteneur flex pour aligner le bouton à droite
    this.menuContainer.className = "relative flex justify-end w-full";
    this.menuContainer.appendChild(btn);

    this.container.querySelector("#planning").insertAdjacentElement("beforebegin", this.menuContainer);
    document.addEventListener("click", (e) => {
      if (this.isOpen && !e.target.closest(`#${this.menuId}`) && !e.target.closest(`#${this.buttonId}`)) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.closeMenu(); // Pour éviter les doublons

    if (!this.container.querySelector(`#${this.menuId}`)) {
      const menu = document.createElement("div");
      menu.id = this.menuId;
      menu.className =
        "w-fit absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 right-[2rem] top-0 mt-2 animate-fade-in";
      menu.innerHTML = this.getMenuHTML();
      this.menuContainer.appendChild(menu);

      this.isOpen = true;
      this.initDropdowns();

      // Ajout listeners exportation (à compléter selon besoins)
      menu.querySelector("#save-planning").addEventListener("click", () => this.handleSave());
      menu.querySelector("#print-planning").addEventListener("click", () => this.handlePrint());
      menu.querySelector("#pdf-planning").addEventListener("click", () => this.handlePDF());
    } else {
      const menu = this.container.querySelector(`#${this.menuId}`);
      menu.classList.remove("hidden");
      this.isOpen = true;
    }
  }

  closeMenu() {
    const menu = this.container.querySelector(`#${this.menuId}`);
    if (menu) menu.classList.add("hidden");
    this.isOpen = false;
  }

  getMenuHTML() {
    return `
      <div class="mb-2">
        <span class="font-bold text-gray-900">Exportation</span>
        <div class="flex flex-col gap-2 mt-2">
          <button id="save-planning" class="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1">
            <img src="../public/images/save.svg" alt="Enregistrer" class="w-5 h-5" />
            Sauvegarder
          </button>
          <button id="print-planning" class="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1">
            <img src="../public/images/print.svg" alt="Imprimer" class="w-5 h-5" />
            Imprimer
          </button>
          <button id="pdf-planning" class="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1">
            <img src="../public/images/pdf.svg" alt="PDF" class="w-5 h-5" />
            Enregistrer au format PDF
          </button>
        </div>
      </div>
      <hr class="my-2">
      <div>
        <span class="font-bold text-gray-900">Plage & Intervale</span>
        <div class="mt-2">
          <div id="planning-context-menu-start-time-container" class="flex items-center gap-2 mb-2">
            <label class="min-w-fit">Début :</label>
            <!-- Dropdown Heure Debut -->
          </div>
          <div id="planning-context-menu-end-time-container" class="flex items-center gap-2 mb-2">
            <label class="min-w-fit">Fin :</label>
            <!-- Dropdown Heure Fin -->
          </div>
          <div id="planning-context-menu-duration-container" class="flex items-center gap-2">
            <label class="min-w-fit">Créneau</label>
            <!-- Dropdown Duree -->
          </div>
        </div>
      </div>
    `;
  }

  initDropdowns() {
    // Instanciation comme dans config-planning-menu.js
    const _ = null;
    this.timeDropdowns = {
      "heure-debut": new TimeDropdown(
        "dropdown-heure-debut",
        "heure-debut",
        6,
        17,
        this.model.slotDuration,
        "planning-context-menu",
        _,
        this.model.timeSlots[0],
        "model"
      ),
      "heure-fin": new TimeDropdown(
        "dropdown-heure-fin",
        "heure-fin",
        7,
        18,
        this.model.slotDuration,
        "planning-context-menu",
        _,
        this.model.timeSlots[this.model.timeSlots.length - 1],
        "model"
      ),
      duree: new TimeSlot("dropdown-duree", "planning-context-menu", "model"),
    };

    setTimeout(() => {
      for (const dropdown of Object.values(this.timeDropdowns)) {
        dropdown.init(this.page, this.model, this);
        dropdown.generateOptions();
      }
    }, 0);
  }

  // Méthodes d'exportation à compléter selon la logique de votre app
  handleSave(replace = false) {
    // Vérifie si un popup existe déjà
    if (this.page.querySelector("#planning-save-modal")) this.page.querySelector("#planning-save-modal").remove();

    // Crée le fond sombre
    const overlay = document.createElement("div");
    overlay.id = "planning-save-modal";
    // overlay.className =
    //   "absolute top-0 left-0 w-full h-full bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50";
    overlay.classList.add(
      "fixed",
      "top-0",
      "right-0",
      "w-[calc(100vw-210px)]",
      "h-full",
      "bg-black",
      "bg-opacity-50",
      "flex",
      "items-center",
      "justify-center",
      "z-50"
    );

    // Crée la modale
    const modal = document.createElement("div");
    modal.className = "bg-white rounded-xl p-6 shadow-lg w-[350px] flex flex-col gap-6";

    // Empêche la propagation des clics sur la modale vers l'overlay
    modal.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Titre
    const title = document.createElement("h2");
    title.className = "text-xl font-bold text-left";
    title.textContent = "Enregistrement planning";

    // Label + input
    const inputContainer = document.createElement("div");
    inputContainer.className = "flex flex-col gap-1";

    const label = document.createElement("label");
    label.className = "block font-semibold";
    label.textContent = "Nom du planning";

    const input = document.createElement("input");
    input.type = "text";
    input.value = this.model.name || "";
    input.className =
      "w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-black-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500";
    input.autofocus = true;

    inputContainer.appendChild(label);
    inputContainer.appendChild(input);

    // Boutons
    const btnContainer = document.createElement("div");
    btnContainer.className = "flex justify-between gap-2";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Annuler";
    cancelBtn.className = "flex-1 border border-blue-500 text-blue-600 rounded-lg py-2 font-semibold hover:bg-blue-50";
    cancelBtn.onclick = () => overlay.remove();

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Enregistrer";
    saveBtn.className = "flex-1 bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700";
    saveBtn.onclick = async () => {
      // Mets à jour le titre du planning
      this.model.name = input.value;

      await this.model.save(input.value); // Appelle la vraie sauvegarde ici
      overlay.remove();
    };

    // Variables pour suivre l'état du clic
    let mouseDownOnModal = false;

    // Ajoute des écouteurs pour gérer le cas où l'utilisateur commence à cliquer sur le modal
    // et relâche sur l'overlay
    modal.addEventListener("mousedown", () => {
      mouseDownOnModal = true;
    });

    modal.addEventListener("mouseup", () => {
      mouseDownOnModal = false;
    });

    // Ferme le popup seulement si le clic commence et se termine sur l'overlay
    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) {
        mouseDownOnModal = false;
      }
    });

    overlay.addEventListener("mouseup", (e) => {
      if (e.target === overlay && !mouseDownOnModal) {
        overlay.remove();
      }
      mouseDownOnModal = false;
    });

    // Assemble
    btnContainer.append(cancelBtn, saveBtn);
    modal.append(title, inputContainer, btnContainer);
    overlay.appendChild(modal);
    this.page.appendChild(overlay);

    // Focus sur l'input
    input.focus();
  }

  handlePrint() {
    this.selectLogosPopup.show();
  }
  handlePDF() {
    this.model.exportPDF();
  }

  handleDisplayRangeChange(range) {
    if (range === "default") {
      this.model.adjustTimeSlots = false;
      this.model.generateTimeSlots();
    } else if (range === "custom") {
      if (this.model.rows.length > 0) {
        this.model.adjustTimeSlots = true;
        this.model.generateTimeSlots();
      }
    }
  }

  updateTimeDropdowns() {
    this.timeDropdowns["heure-debut"].generateOptions();
    this.timeDropdowns["heure-fin"].generateOptions();
    // this.timeDropdowns["duree"].generateOptions();
  }
}
