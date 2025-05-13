import { loadPage } from "../main.js";
import { PlanningTableView } from "./planning-table-view.js";
import { SelectLogosPopup } from "./logos-selections.js";

/**
 * FileViewer class to handle listing and displaying planning files
 */
export class FileViewer {
  constructor(type) {
    this.type = type;
    this.view = (plannings = null) => this.renderPlanningsAsCards(plannings);
    this.planningsList = [];
    this.ipcRenderer = null;
    try {
      this.ipcRenderer = window.require("electron").ipcRenderer;
    } catch (error) {
      console.error("Error initializing Electron IPC:", error);
    }
  }

  /**
   * Initialize the file viewer
   * @param {HTMLElement} container - The container element where the table will be inserted
   */
  initialize(container) {
    this.container = container;
    this.page = this.container.closest(this.type === "model" ? "#my-models-container" : "#my-plannings-container");
    this.listButtonView = this.container.querySelector("#btn-vue-liste");
    this.cardButtonView = this.container.querySelector("#btn-vue-grille");
    this.planningListContainer = this.container.querySelector("#liste-plannings");
    this.planningCardContainer = this.container.querySelector("#grille-plannings");

    this.searchInput = this.container.querySelector("#search-input");

    this.loadPlanningsList();

    this.cardButtonView.classList.add("bg-blue-400");

    this.listButtonView.addEventListener("click", (e) => {
      this.listButtonView.classList.add("bg-blue-400");
      this.cardButtonView.classList.remove("bg-blue-400");
      this.view = (plannings = null) => this.renderPlanningsList(plannings);
      this.view();
    });

    this.cardButtonView.addEventListener("click", (e) => {
      this.cardButtonView.classList.add("bg-blue-400");
      this.listButtonView.classList.remove("bg-blue-400");
      this.view = (plannings = null) => this.renderPlanningsAsCards(plannings);
      this.view();
    });

    this.searchInput.addEventListener("input", (e) => {
      const searchValue = e.target.value.toLowerCase();
      const plannings = this.planningsList.filter((planning) => planning.name.toLowerCase().includes(searchValue));
      this.view(plannings);
    });
  }

  /**
   * Load the list of planning files from the main process
   */
  loadPlanningsList() {
    // Send IPC request to main process to get planning files

    if (this.ipcRenderer) {
      this.ipcRenderer.send("get-files", this.type);

      // Listen for the response from main process
      this.ipcRenderer.once("files-list", (event, plannings) => {
        this.planningsList = plannings
          .map((planning) => ({
            ...planning,
            name: planning.name.replace(/_/g, " ").replace(/-/g, "/"),
            createdAt: planning.createdAt.toDateString(),
            modifiedAt: planning.modifiedAt.toDateString(),
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        this.view();
      });
    } else {
      console.error("Electron IPC not available");
      // For development/testing without Electron
      this.renderPlanningsList([
        { name: "Planning Mars 2024", createdAt: "04 Mars 2024", updatedAt: "05 Mars 2024" },
        { name: "Planning Avril 2024", createdAt: "01 Avril 2024", updatedAt: "02 Avril 2024" },
      ]);
    }
  }

  /**
   * Render the list of planning files in the container
   * @param {Array} plannings - Optional array of plannings to render (for testing)
   */
  renderPlanningsList(plannings = null) {
    if (this.planningCardContainer) {
      this.planningCardContainer.classList.add("hidden");
    }
    if (this.planningListContainer) {
      this.planningListContainer.classList.remove("hidden");
    }
    const data = plannings || this.planningsList;
    const tbody = this.container.querySelector("tbody");

    if (!tbody) {
      console.error("No tbody element found in container");
      return;
    }

    if (data.length === 0) {
      // Clear existing rows
      tbody.innerHTML = "";

      // Create a single row with a message spanning all columns
      const tr = document.createElement("tr");

      // Get the number of columns in the table (assuming the table has headers)
      const headerCells = this.container.querySelectorAll("thead th");
      const colSpan = headerCells.length || 4; // Default to 4 if headers not found

      const messageText = this.type === "model" ? "Aucun modèle" : "Aucun planning";

      // Create a cell that spans all columns
      const td = document.createElement("td");
      td.colSpan = colSpan;
      td.className = "px-6 py-10 text-center";

      td.innerHTML = `
        <div class="text-gray-500 text-xl font-medium mb-2">${messageText}</div>
        <p class="text-gray-400">Cliquez sur le bouton "Nouveau ${
          this.type === "model" ? "modèle" : "planning"
        }" pour en créer un nouveau</p>
      `;

      tr.appendChild(td);
      tbody.appendChild(tr);

      return; // Exit early since there's nothing else to render
    }

    // Clear existing rows
    tbody.innerHTML = "";

    // Generate rows for each planning
    data.forEach((planning) => {
      const tr = document.createElement("tr");
      tr.className =
        "border-b group hover:bg-blue-100 hover:translate-x-1 transition-all duration-200 ease-in-out cursor-pointer";
      tr.id = `planning-row-${planning.fileName}`;

      tr.innerHTML = `
        <td class="px-6 py-3 text-left translate-x-2">${planning.name}</td>
        <td class="px-6 py-3 text-center">${planning.createdAt}</td>
        <td class="px-6 py-3 text-center">${planning.modifiedAt}</td>
        <td class="w-fit px-6 py-3 flex justify-center gap-5">
          <img
            src="../public/images/rename.svg"
            alt="rename"
            class="w-5 h-5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            title="Renommer"
            data-action="rename"
            data-id="${planning.fileName || ""}"
          />
          <img
            src="../public/images/edit.svg"
            alt="Éditer"
            class="w-5 h-5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            title="Éditer"
            data-action="edit"
            data-id="${planning.fileName || ""}"
          />
          <img
            src="../public/images/print.svg"
            alt="Imprimer"
            class="w-5 h-5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            title="Imprimer"
            data-action="print"
            data-id="${planning.fileName || ""}"
          />
          <img
            src="../public/images/delete.svg"
            alt="Supprimer"
            class="w-5 h-5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            title="Supprimer"
            data-action="delete"
            data-id="${planning.fileName || ""}"
          />
        </td>
      `;

      // Add event listeners for action buttons
      tr.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent row click event
          const action = e.target.getAttribute("data-action");
          const id = e.target.getAttribute("data-id");
          this.handleAction(action, id, planning, "list");
        });
      });

      // Add click event to show preview modal
      tr.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "input") {
          return; // Do nothing if the target is an input
        }
        this.showPreviewModal(planning);
      });

      tbody.appendChild(tr);
    });
  }

  /**
   * Render the list of planning files as cards in a grid layout
   * @param {HTMLElement} container - The container element where the cards will be inserted
   * @param {Array} plannings - Optional array of plannings to render (for testing)
   */
  renderPlanningsAsCards(plannings = null) {
    if (this.planningListContainer) {
      this.planningListContainer.classList.add("hidden");
    }
    if (this.planningCardContainer) {
      this.planningCardContainer.classList.remove("hidden");
    }
    const data = plannings || this.planningsList;

    // Clear existing content
    this.planningCardContainer.innerHTML = "";

    // Check if there are no plannings/models to display
    if (data.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "w-full flex flex-col items-center justify-center py-10";

      const messageText = this.type === "model" ? "Aucun modèle" : "Aucun planning";

      emptyMessage.innerHTML = `
        <div class="text-gray-500 text-xl font-medium mb-2">${messageText}</div>
        <p class="text-gray-400">Cliquez sur le bouton "Nouveau ${
          this.type === "model" ? "modèle" : "planning"
        }" pour en créer un nouveau</p>
      `;

      this.planningCardContainer.appendChild(emptyMessage);
      return; // Exit early since there's nothing else to render
    }

    // Generate card for each planning
    data.forEach((planning, index) => {
      const card = document.createElement("div");
      card.className =
        "group flex flex-col items-center transform transition-transform duration-300 hover:scale-105 cursor-pointer flex-1 min-w-[200px] max-w-[250px]";
      card.id = `planning-card-${planning.id || index}`;

      card.innerHTML = `
        <div class="w-full h-[140px] shadow-md bg-gray-300 rounded-lg mb-2 relative overflow-hidden">
          ${
            planning.preview
              ? `<img src="${planning.preview}" alt="${planning.name}" class="w-full h-full object-cover">`
              : ""
          }
          <div
            class="absolute bottom-0 left-0 right-0 flex justify-center gap-6 p-2 bg-gradient-to-t from-gray-800/50 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"
          >
            <img 
              src="../public/images/rename.svg" 
              alt="Renommer" 
              class="w-5 h-5 cursor-pointer" 
              title="Renommer" 
              data-action="rename"
              data-id="${planning.fileName || ""}"
            />
            <img 
              src="../public/images/edit.svg" 
              alt="Éditer" 
              class="w-5 h-5 cursor-pointer" 
              title="Éditer" 
              data-action="edit"
              data-id="${planning.fileName || ""}"
            />
            <img
              src="../public/images/print.svg"
              alt="Imprimer"
              class="w-5 h-5 cursor-pointer"
              title="Imprimer"
              data-action="print"
            data-id="${planning.fileName || ""}"
            />
            <img 
              src="../public/images/delete.svg" 
              alt="Supprimer" 
              class="w-5 h-5 cursor-pointer" 
              title="Supprimer" 
              data-action="delete"
              data-id="${planning.fileName || ""}"
            />
          </div>
        </div>
        <div class="text-center font-medium text-gray-800" id="planning-name">${planning.name}</div>
      `;

      // Add event listeners for action buttons
      card.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent card click event
          const action = e.target.getAttribute("data-action");
          const id = e.target.getAttribute("data-id");
          this.handleAction(action, id, planning, "card");
        });
      });

      // Add click event to show preview modal
      card.addEventListener("click", (e) => {
        // Check if the click target is an input element
        if (e.target.tagName.toLowerCase() === "input") {
          return; // Do nothing if the target is an input
        }

        this.showPreviewModal(planning);
      });

      this.planningCardContainer.appendChild(card);
    });
  }

  /**
   * Show a modal with the planning preview
   * @param {Object} planning - The planning object
   */
  showPreviewModal(planning) {
    // Remove any existing modal
    const existingModal = document.getElementById("preview-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal container
    const modal = document.createElement("div");
    modal.id = "preview-modal";
    modal.className = "absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50";

    // Modal content
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="text-xl font-semibold text-gray-900">${planning.name}</h3>
          <button id="close-modal" class="text-gray-400 hover:text-gray-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-auto flex-grow flex items-center justify-center">
          ${
            planning.preview
              ? `<img src="${planning.preview}" alt="${planning.name}" class="max-w-full max-h-[70vh] object-contain">`
              : `<div class="text-gray-500 text-center p-10">Aucun aperçu disponible pour ce planning</div>`
          }
        </div>
        <div class="border-t p-4 flex justify-between">
          <div class="flex space-x-3">
            <button id="edit-planning-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition" data-id="${
              planning.fileName || ""
            }">
              Éditer ce planning
            </button>
            <button id="export-pdf-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition" data-id="${
              planning.fileName || ""
            }">
              Exporter en PDF
            </button>
            <button id="print-planning-btn" class="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition" data-id="${
              planning.fileName || ""
            }">
              Imprimer
            </button>
          </div>
          <button id="delete-planning-btn" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" data-id="${
            planning.fileName || ""
          }">
            Supprimer
          </button>
        </div>
      </div>
    `;

    // Add to DOM
    this.page.appendChild(modal);

    // Add event listeners
    document.getElementById("close-modal").addEventListener("click", () => {
      modal.remove();
    });

    // Close on click outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Edit button
    const editBtn = document.getElementById("edit-planning-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        this.editPlanning(planning.fileName, planning);
        modal.remove();
      });
    }

    // Delete button
    const deleteBtn = document.getElementById("delete-planning-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        this.deletePlanning(planning.fileName, planning);
        modal.remove();
      });
    }

    // Export PDF button
    const exportPdfBtn = document.getElementById("export-pdf-btn");
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener("click", () => {
        this.exportPlanning(planning.fileName, "pdf");
        // const selectLogosPopup = document.querySelector(".select-logos-popup");
        // if (selectLogosPopup) {
        //   const exportPdfButton = selectLogosPopup.querySelector("#export-pdf-button");
        //   if (exportPdfButton) {
        //     exportPdfButton.click();
        //   }
        // }
        // setTimeout(() => {
        //   modal.remove();
        // }, 50);
      });
    }

    // Print button
    const printBtn = document.getElementById("print-planning-btn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        this.exportPlanning(planning.fileName, "print");
        // const selectLogosPopup = document.querySelector(".select-logos-popup");
        // if (selectLogosPopup) {
        //   const printButton = selectLogosPopup.querySelector("#print-button");
        //   if (printButton) {
        //     printButton.click();
        //   }
        // }
        // setTimeout(() => {
        //   modal.remove();
        // }, 5000);
      });
    }

    // Close on escape key
    document.addEventListener("keydown", function closeOnEsc(e) {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", closeOnEsc);
      }
    });
  }

  /**
   * Handle actions on planning items
   * @param {string} action - The action to perform (duplicate, edit, print, delete)
   * @param {string} id - The ID of the planning
   * @param {Object} planning - The planning object
   */
  handleAction(action, fileName, planning, view) {
    if (!this.ipcRenderer) {
      console.error("Electron IPC not available for action:", action);
      return;
    }

    switch (action) {
      case "rename":
        this.renamePlanning(fileName, planning, view);
        break;
      case "edit":
        this.editPlanning(fileName, planning);
        break;
      case "print":
        this.exportPlanning(fileName, "print");
        break;
      case "delete":
        this.deletePlanning(fileName, planning);
        break;
      default:
        console.error("Unknown action:", action);
    }
  }

  /**
   * Refresh the list of planning files
   */
  refresh() {
    this.loadPlanningsList();
  }

  renamePlanning(fileName, planning, view) {
    let input;
    let currentName;
    let nameElement;
    if (view === "list") {
      const row = this.container.querySelector(`img[data-id="${fileName}"]`).closest("td").closest("tr");
      nameElement = row.querySelector("td");
      currentName = planning.name;

      // Create input element
      input = document.createElement("input");
      input.type = "text";
      input.value = currentName;
      input.className =
        "w-1/2 border border-blue-400 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500";

      // Replace the name cell content with input
      nameElement.textContent = "";
      nameElement.appendChild(input);
    } else if (view === "card") {
      const card = this.container.querySelector(`#planning-card-${planning.id}`);
      nameElement = card.querySelector("#planning-name");
      currentName = planning.name;

      // Create input element
      input = document.createElement("input");
      input.type = "text";
      input.value = currentName;
      input.className =
        "w-1/2 border border-blue-400 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500";

      nameElement.textContent = "";
      nameElement.appendChild(input);
    }

    // Focus on the input
    input.focus();
    input.select();

    // Function to save the new name
    const saveName = () => {
      const newName = input.value.trim();
      if (newName) {
        if (newName !== currentName) {
          // Update UI first

          // Send to backend
          if (this.ipcRenderer) {
            this.ipcRenderer.send("rename-file", this.type, fileName, newName.replace(/\s+/g, "_").replace(/\//g, "-"));
          }
          this.refresh();
        } else {
          // If empty or unchanged, revert to original name
          nameElement.textContent = currentName;
        }
      }
    };

    // Save on enter key
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      } else if (e.key === "Escape") {
        // Cancel on escape key
        nameCell.textContent = currentName;
      }
    });

    // Save on blur (when clicking outside)
    input.addEventListener("blur", saveName);
  }

  editPlanning(fileName, planning) {
    this.ipcRenderer.send("get-file-content", { fileType: this.type, fileName: fileName });
    this.ipcRenderer.once("file-content", (event, content) => {
      if (this.type === "planning") {
        loadPage("edit-planning.html", {
          edit: true,
          planning: {
            ...content,
            name: content?.name.replace(/_/g, " ").replace(/-/g, "/"),
            title: content.title.replace(/_/g, " ").replace(/-/g, "/"),
          },
        });
      } else if (this.type === "model") {
        loadPage("edit-model.html", {
          edit: true,
          model: {
            ...content,
            name: content.name.replace(/_/g, " ").replace(/-/g, "/"),
            title: content.title.replace(/_/g, " ").replace(/-/g, "/"),
          },
        });
      }
    });
  }

  exportPlanning(fileName, exportType) {
    if (document.getElementById("print-container")) {
      document.getElementById("print-container").remove();
    }
    const container = document.createElement("div");
    container.id = "print-container";
    const planningContainer = document.createElement("div");
    planningContainer.id = "planning-container";
    planningContainer.classList.add("print-planning");

    const mainContent = this.container.closest("#main-content");
    container.appendChild(planningContainer);
    mainContent.appendChild(container);

    const printPlanning = new PlanningTableView();
    this.ipcRenderer.send("get-file-content", { fileType: this.type, fileName: fileName });
    this.ipcRenderer.once("file-content", (event, content) => {
      printPlanning.initialize(
        container,
        {
          name: content?.name || null,
          id: content?.id || null,
          title: content?.title || null,
          startTime: content?.timeSlots[0] || "06h00",
          endTime: content?.timeSlots[content?.timeSlots.length - 1] || "18h00",
          slotDuration: content?.slotDuration || 15,
          columns: content?.columns || [],
          rows: content?.rows || [],
          showTimeSlots: true,
        },
        0
      );
      const selectLogosPopup = new SelectLogosPopup(this.page, printPlanning);
      selectLogosPopup.show(exportType);
    });
  }

  deletePlanning(fileName, planning) {
    // Create confirmation popup
    const popup = document.createElement("div");
    popup.className = "absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50";

    const popupContent = document.createElement("div");
    popupContent.className = "bg-white rounded-lg p-6 shadow-lg max-w-md";

    const title = document.createElement("h3");
    title.className = "text-xl font-semibold mb-4";
    title.textContent = "Confirmation de suppression";

    const message = document.createElement("p");
    message.className = "mb-6";
    message.textContent = `Êtes-vous sûr de vouloir supprimer ce ${this.type === "model" ? "modèle" : "planning"} ?`;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex justify-center space-x-6";

    const cancelButton = document.createElement("button");
    cancelButton.className = "px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300";
    cancelButton.textContent = "Annuler";

    const deleteButton = document.createElement("button");
    deleteButton.className = "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700";
    deleteButton.textContent = "Supprimer";

    // Add event listeners
    cancelButton.addEventListener("click", () => {
      popup.remove();
    });

    deleteButton.addEventListener("click", () => {
      popup.remove();
      this.ipcRenderer.send("delete-file", this.type, fileName);
      this.ipcRenderer.once("file-deleted", (event, deleted) => {
        if (deleted) {
          this.refresh();
        }
      });
    });

    // Assemble popup
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(deleteButton);

    popupContent.appendChild(title);
    popupContent.appendChild(message);
    popupContent.appendChild(buttonContainer);

    popup.appendChild(popupContent);
    this.page.appendChild(popup);
  }
}
