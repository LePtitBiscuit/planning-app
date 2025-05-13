import { PlanningTableView } from "./components/planning-table-view.js";
import { ConfigPlanningMenu } from "./components/config-planning-menu.js";
import { ConfigModelMenu } from "./components/config-model-menu.js";
import { ModelTableView } from "./components/model-table-view.js";
import { FileViewer } from "./components/fileviewer.js";
import { AddRowPlanningMenu } from "./components/addrow-planning-menu.js";
import { AddRowModelMenu } from "./components/addrow-model-menu.js";

const pages = {
  plannings: {
    page: null,
    pageContainer: null,
    pageConetentType: "planning",
    pageId: "my-plannings-container",
    buttonId: "btn-nouveau-planning",
    buttonLink: "create-planning.html",
    navId: "nav-mes-plannings",
  },
  models: {
    page: null,
    pageContainer: null,
    pageConetentType: "model",
    pageId: "my-models-container",
    buttonId: "btn-nouveau-model",
    buttonLink: "create-model.html",
    navId: "nav-mes-modeles",
  },
  createPlanning: {
    type: "planning",
    pageContainer: null,
    planning: null,
    pageId: "create-planning-container",
    navId: "nav-creer-planning",
  },
  createModel: {
    type: "model",
    pageContainer: null,
    planning: null,
    pageId: "create-model-container",
    navId: "nav-creer-model",
  },
  editModel: {
    type: "model",
    pageContainer: null,
    planning: null,
    pageId: "edit-model-container",
    navId: "nav-mes-modeles",
  },
  editPlanning: {
    type: "planning",
    pageContainer: null,
    planning: null,
    pageId: "edit-planning-container",
    navId: "nav-mes-plannings",
  },
};
// Code JavaScript principal
export async function loadPage(page, data = { ...arguments, force: false }) {
  let response;
  if (page === "edit-planning.html" || page === "edit-model.html") {
    response = await fetch(`../views/pages/create-${page.split("-")[1]}`);
  } else {
    response = await fetch(`../views/pages/${page}`);
  }
  const html = await response.text();

  if (page === "my-plannings.html") {
    addActiveClassToNavLink(pages.plannings.navId);
    if (pages.editPlanning.pageContainer && !data.force) {
      showPage(pages.editPlanning);
    } else if (pages.editPlanning.pageContainer && data.force) {
      // Masquer la page d'édition de planning
      if (pages.editPlanning.planning.unsavedChanges) {
        await saveLastPlanning(pages.editPlanning);
      }
      pages.editPlanning.pageContainer.remove();
      pages.editPlanning.pageContainer = null;
      // Récupérer la page des plannings
      pages.plannings.page.refresh();
      // Afficher la page des plannings
      showPage(pages.plannings);
    } else {
      if (pages.plannings.page) {
        pages.plannings.page.refresh();
      } else {
        createPage(pages.plannings, html);
      }
      showPage(pages.plannings);
    }
  } else if (page === "my-models.html") {
    addActiveClassToNavLink(pages.models.navId);
    if (pages.editModel.pageContainer && !data.force) {
      showPage(pages.editModel);

      // Sauvegarde le modèle avant de retourner sur la page des modèles
    } else if (pages.editModel.pageContainer && data.force) {
      if (pages.editModel.planning.unsavedChanges) {
        await saveLastPlanning(pages.editModel);
      }
      pages.editModel.pageContainer.remove();
      pages.editModel.pageContainer = null;
      pages.models.page.refresh();
      showPage(pages.models);
    } else {
      if (pages.models.page) {
        pages.models.page.refresh();
      } else {
        createPage(pages.models, html);
      }
      showPage(pages.models);
    }
  } else if (page === "create-model.html") {
    addActiveClassToNavLink(pages.createModel.navId);
    if (!pages.createModel.planning) {
      createPlanningsPage(pages.createModel, html);
    } else if (data.force) {
      if (
        pages.createModel.planning.firstSection.constructor.name !== "ConfigModelMenu" &&
        pages.createModel.planning.unsavedChanges
      ) {
        showPage(pages.createModel);
        await saveLastPlanning(pages.createModel);
        pages.createModel.pageContainer.remove();
        pages.createModel.pageContainer = null;
        createPlanningsPage(pages.createModel, html);
      } else {
        pages.createModel.pageContainer.remove();
        pages.createModel.pageContainer = null;
        createPlanningsPage(pages.createModel, html);
      }
    }
    showPage(pages.createModel);
  } else if (page === "create-planning.html") {
    addActiveClassToNavLink(pages.createPlanning.navId);
    if (!pages.createPlanning.planning) {
      createPlanningsPage(pages.createPlanning, html);
    } else if (data.force) {
      if (
        pages.createPlanning.planning.firstSection.constructor.name !== "ConfigPlanningMenu" &&
        pages.createPlanning.planning.unsavedChanges
      ) {
        showPage(pages.createPlanning);
        await saveLastPlanning(pages.createPlanning);
        pages.createPlanning.pageContainer.remove();
        pages.createPlanning.pageContainer = null;
        createPlanningsPage(pages.createPlanning, html);
      } else {
        pages.createPlanning.pageContainer.remove();
        pages.createPlanning.pageContainer = null;
        createPlanningsPage(pages.createPlanning, html);
      }
    }
    showPage(pages.createPlanning);
  } else if (page === "edit-planning.html") {
    addActiveClassToNavLink(pages.editPlanning.navId);
    if (pages.editPlanning.pageContainer) {
      pages.editPlanning.pageContainer.remove();
    }
    createPlanningsPage(pages.editPlanning, html, data.planning);
    showPage(pages.editPlanning);
  } else if (page === "edit-model.html") {
    addActiveClassToNavLink(pages.editModel.navId);
    if (pages.editModel.pageContainer) {
      pages.editModel.pageContainer.remove();
    }
    createPlanningsPage(pages.editModel, html, data.model);
    showPage(pages.editModel);
  }
}

// Charger la page d'accueil par défaut au démarrage
window.addEventListener("DOMContentLoaded", () => {
  loadPage("my-models.html");

  setTimeout(() => {
    loadPage("create-planning.html");

    setTimeout(() => {
      loadPage("create-model.html");

      setTimeout(() => {
        loadPage("my-plannings.html");

        // Signaler au processus principal que l'application a fini de charger
        const { ipcRenderer } = require("electron");
        ipcRenderer.send("app-loaded");
      }, 100);
    }, 100);
  }, 100);
});

async function saveLastPlanning(planningPage) {
  showSavingChangesPopup(planningPage.pageContainer);
  await planningPage.planning.save();
  hideSavingChangesPopup(planningPage.pageContainer);
}

async function showSavingChangesPopup(container) {
  if (!container.querySelector("#warning-popup")) {
    const warningPopup = document.createElement("div");
    warningPopup.id = "warning-popup";
    warningPopup.classList.add(
      "absolute",
      "top-0",
      "left-0",
      "w-full",
      "h-full",
      "bg-black",
      "bg-opacity-50",
      "flex",
      "items-center",
      "justify-center",
      "z-50"
    );
    // Créer le contenu du popup
    const popupContent = `
    <div class="p-4 bg-white rounded-lg shadow-md">
      <p class="mb-4">Sauvegarde des modifications en cours</p>
    </div>
    `;
    container.appendChild(warningPopup);
    warningPopup.innerHTML = popupContent;
  } else {
    warningPopup.classList.remove("hidden");
  }
}

function hideSavingChangesPopup(container) {
  container.querySelector("#warning-popup").classList.add("hidden");
}

function addActiveClassToNavLink(navId) {
  const nav = document.getElementById(navId);
  document.querySelectorAll("a").forEach((link) => {
    if (link !== nav) {
      link.classList.remove("bg-blue-800");
    } else {
      link.classList.add("bg-blue-800");
    }
  });
}

function showPage(page) {
  page.pageContainer.classList.remove("hidden");
  Object.values(pages).forEach((p) => {
    if (p !== page) {
      if (p.pageContainer) {
        p.pageContainer.classList.add("hidden");
      }
    }
  });
}

function createPage(page, html) {
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = html;
  while (tempContainer.firstChild) {
    document.getElementById("main-content").appendChild(tempContainer.firstChild);
  }

  page.pageContainer = document.getElementById(page.pageId);
  document
    .getElementById(page.buttonId)
    .addEventListener("click", () => loadPage(page.buttonLink, { edit: false, force: true }));

  page.page = new FileViewer(page.pageConetentType);
  page.page.initialize(page.pageContainer);
}

function createPlanningsPage(page, html, planning) {
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = html;
  tempContainer.firstChild.id = page.pageId;
  if (page.pageId.includes("edit")) {
    const h1 = tempContainer.firstChild.querySelector("h1");
    h1.innerHTML = "";
    h1.classList.add("flex", "items-center"); // Add flex and align items to center

    // Create first span (Models/Plannings)
    const firstSpan = document.createElement("span");
    firstSpan.textContent = page.type === "model" ? "Modèles" : "Plannings";
    firstSpan.classList.add("cursor-pointer", "hover:underline", "hover:text-blue-500", "inline-block");
    firstSpan.addEventListener("click", () => {
      loadPage(page.type === "model" ? "my-models.html" : "my-plannings.html", { force: true });
    });

    // Create arrow span
    const arrowSpan = document.createElement("span");
    arrowSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>`;
    arrowSpan.classList.add("mx-2", "inline-block");

    // Create third span (Modification text)
    const thirdSpan = document.createElement("span");
    thirdSpan.textContent = page.type === "model" ? "Modification modèle" : "Modification planning";
    thirdSpan.classList.add("inline-block", "text-blue-600");

    // Append all spans to h1
    h1.appendChild(firstSpan);
    h1.appendChild(arrowSpan);
    h1.appendChild(thirdSpan);
  }
  while (tempContainer.firstChild) {
    document.getElementById("main-content").appendChild(tempContainer.firstChild);
  }

  page.pageContainer = document.getElementById(page.pageId);

  setTimeout(() => {
    if (page.type === "model") {
      page.planning = new ModelTableView();
      page.planning.initialize(
        page.pageContainer,
        {
          name: planning?.name || null,
          id: planning?.id || null,
          title: planning?.title || null,
          startTime: planning?.timeSlots[0] || "06h00",
          endTime: planning?.timeSlots[planning?.timeSlots.length - 1] || "18h00",
          slotDuration: planning?.slotDuration || 15,
          columns: planning?.columns || [],
          rows: planning?.rows || [],
        },
        0
      );
    } else {
      page.planning = new PlanningTableView();
      page.planning.initialize(
        page.pageContainer,
        {
          name: planning?.name || null,
          id: planning?.id || null,
          title: planning?.title || null,
          startTime: planning?.timeSlots[0] || "06h00",
          endTime: planning?.timeSlots[planning?.timeSlots.length - 1] || "18h00",
          slotDuration: planning?.slotDuration || 15,
          columns: planning?.columns || [],
          rows: planning?.rows || [],
          showTimeSlots: page.pageId.includes("edit") ? true : false,
        },
        0
      );
    }
  });

  if (page.pageId.includes("edit")) {
    setTimeout(() => {
      page.planning.showPlanningSettingsButton();
    }, 0);
  }

  if (!planning) {
    setTimeout(() => {
      if (page.type === "model") {
        page.planning.firstSection = new ConfigModelMenu(page.planning);
        page.planning.firstSection.initialize(page.pageContainer, page.planning);
      } else {
        page.planning.firstSection = new ConfigPlanningMenu(page.planning);
        page.planning.firstSection.initialize(page.pageContainer, page.planning);
      }
    }, 0);
  } else {
    setTimeout(() => {
      if (page.type === "model") {
        page.planning.firstSection = new AddRowModelMenu(page.planning);
        page.planning.firstSection.initialize(page.pageContainer, page.planning);
      } else {
        page.planning.firstSection = new AddRowPlanningMenu(page.planning);
        page.planning.firstSection.initialize(page.pageContainer, page.planning);
      }
    }, 0);
  }
}
