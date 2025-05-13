export class SelectLogosPopup {
  constructor(page, planning) {
    this.page = page;
    this.planning = planning;
    this.selectedLogos = [];
    this.popup = null;
    this.maxLogos = 3; // Nombre maximum de logos sélectionnables
  }

  async fetchLogos() {
    // Récupérer les logos disponibles via IPC
    const result = await window.require("electron").ipcRenderer.invoke("get-logos");
    return result.logos || [];
  }

  async refreshLogos() {
    // Récupère les logos et met à jour l'affichage sans fermer le popup
    const logos = await this.fetchLogos();

    // Récupère le conteneur de logos existant
    const logoContainer = this.popup.querySelector(".flex.flex-wrap.gap-2");
    if (!logoContainer) return;

    // Vide le conteneur
    logoContainer.innerHTML = "";

    // Ajoute les logos ou un message s'il n'y en a pas
    if (logos && logos.length > 0) {
      logos.forEach((logo) => {
        const logoItem = this.createLogoItem(logo, logoContainer);
        logoContainer.appendChild(logoItem);
      });
    } else {
      const noLogosMessage = document.createElement("div");
      noLogosMessage.className = "text-center py-4 w-full";
      noLogosMessage.textContent = "Aucun logo";
      logoContainer.appendChild(noLogosMessage);
    }

    // Met à jour le compteur de logos
    this.updateLogoCounter();

    logoContainer.scrollTo({ top: logoContainer.scrollHeight, behavior: "smooth" });
  }

  async show(exportType) {
    this.exportType = exportType;

    this.selectedLogos = [];
    // Récupérer les logos disponibles via IPC
    const logos = await this.fetchLogos();

    // Créer le popup de sélection de logo
    this.popup = document.createElement("div");
    this.popup.className =
      "fixed w-[calc(100vw-210px)] right-0 top-0 h-full bg-black bg-opacity-50 flex items-center justify-center z-50";
    this.popup.id = "logo-selection-popup";

    // Ajouter un gestionnaire d'événements pour fermer le popup quand on clique sur le fond
    this.popup.addEventListener("mousedown", (e) => {
      // Vérifier si le clic est directement sur le fond (this.popup) et non sur un élément enfant
      if (e.target === this.popup) {
        // Stocker l'élément sur lequel le clic a commencé
        this.clickTarget = e.target;
      }
    });

    this.popup.addEventListener("mouseup", (e) => {
      // Fermer le popup seulement si le clic a commencé et s'est terminé sur le fond
      if (e.target === this.popup && this.clickTarget === this.popup) {
        this.popup.remove();
        // Réactiver le scroll quand le popup est fermé
        window.removeEventListener("wheel", this.preventScroll, { passive: false });
        window.removeEventListener("touchmove", this.preventScroll, { passive: false });
      }
      // Réinitialiser la cible du clic
      this.clickTarget = null;
    });

    // Définir la fonction preventScroll comme une méthode de classe pour pouvoir la supprimer plus tard
    this.preventScroll = (e) => {
      e.preventDefault();
    };

    // Désactiver le scroll
    window.addEventListener("wheel", this.preventScroll, { passive: false });
    window.addEventListener("touchmove", this.preventScroll, { passive: false });

    // Ajouter un gestionnaire pour nettoyer les événements quand le popup est fermé
    const removePopup = () => {
      window.removeEventListener("wheel", this.preventScroll, { passive: false });
      window.removeEventListener("touchmove", this.preventScroll, { passive: false });
    };

    // S'assurer que les événements sont nettoyés quand le popup est fermé par d'autres moyens

    const popupContent = document.createElement("div");
    popupContent.className = "flex flex-col items-center bg-white rounded-lg p-6 w-[350px]";

    const title = document.createElement("h3");
    title.className = "text-lg font-semibold mb-4 text-left w-full";
    title.textContent = "Ajouter un logo sur le planning";

    // Bouton pour ajouter un logo (centré)
    const addLogoBtn = document.createElement("button");
    addLogoBtn.className = "hover:text-blue-700 hover:underline text-blue-600 px-2 py-1 text-md self-center mb-2";
    addLogoBtn.textContent = "Importer un Logo";
    addLogoBtn.addEventListener("click", async () => {
      await window.require("electron").ipcRenderer.invoke("add-logo");
      // Rafraîchir les logos sans fermer le popup
      this.refreshLogos();
    });

    // Conteneur pour les logos avec titre et bouton d'ajout
    const myLogosContainer = document.createElement("div");
    myLogosContainer.className = "my-logos w-full";

    // Créer un conteneur flex pour le titre et le bouton
    const headerContainer = document.createElement("div");
    headerContainer.className = "flex justify-between items-center mb-2 w-full";

    const myLogosTitle = document.createElement("h4");
    myLogosTitle.className = "font-medium";
    myLogosTitle.textContent = "Mes logos";

    // Ajouter le titre au conteneur d'en-tête
    headerContainer.appendChild(myLogosTitle);
    myLogosContainer.appendChild(headerContainer);

    const logoContainer = document.createElement("div");
    logoContainer.className = "flex flex-wrap gap-2 mb-4 max-h-[300px] w-fit overflow-x-hidden overflow-y-auto ";
    logoContainer.classList.add(
      "[&::-webkit-scrollbar]:w-1",
      "[&::-webkit-scrollbar-thumb]:bg-blue-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full"
    );

    // Ajouter les logos ou un message s'il n'y en a pas
    if (logos && logos.length > 0) {
      logos.forEach((logo) => {
        const logoItem = this.createLogoItem(logo, logoContainer);
        logoContainer.appendChild(logoItem);
      });
    } else {
      const noLogosMessage = document.createElement("div");
      noLogosMessage.className = "text-center py-4 w-full";
      noLogosMessage.textContent = "Aucun logo";
      logoContainer.appendChild(noLogosMessage);
    }

    myLogosContainer.appendChild(logoContainer);

    // Compteur de logos sélectionnés
    const logoCounter = document.createElement("div");
    logoCounter.className = "text-center text-sm text-gray-600 mb-1 w-full";
    logoCounter.id = "logo-counter";
    logoCounter.textContent = `${this.selectedLogos.length} / ${this.maxLogos} logos sélectionnés`;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex justify-end gap-2 mt-4";

    const cancelButton = document.createElement("button");
    cancelButton.className =
      "flex-1 border border-blue-500 text-blue-600 rounded-lg px-4 py-2 font-semibold hover:bg-blue-50";
    cancelButton.textContent = "Annuler";
    cancelButton.addEventListener("click", () => {
      this.popup.remove();
      removePopup();
    });
    cancelButton.addEventListener("click", () => {
      this.popup.remove();
      removePopup();
    });
    const printButton = document.createElement("button");
    printButton.className = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-[200px]";
    if (this.exportType === "pdf") {
      printButton.textContent = "Enregistrer sans logo";
    } else {
      printButton.textContent = "Imprimer sans logo";
    }
    printButton.addEventListener("click", () => {
      if (this.exportType === "pdf") {
        this.planning.exportPDF(this.selectedLogos);
      } else {
        this.planning.print(this.selectedLogos);
      }
      this.popup.remove();
      removePopup();
    });

    printButton.addEventListener("click", () => {
      if (this.exportType === "pdf") {
        this.planning.exportPDF(this.selectedLogos);
      } else {
        this.planning.print(this.selectedLogos);
      }
      this.popup.remove();
      removePopup();
    });

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(printButton);

    popupContent.appendChild(title);
    popupContent.appendChild(addLogoBtn);
    popupContent.appendChild(myLogosContainer);
    popupContent.appendChild(logoCounter); // Ajout du compteur de logos
    popupContent.appendChild(buttonContainer);
    this.popup.appendChild(popupContent);

    this.page.appendChild(this.popup);
  }

  updateLogoCounter() {
    const logoCounter = this.popup.querySelector("#logo-counter");
    if (logoCounter) {
      logoCounter.textContent = `${this.selectedLogos.length} / ${this.maxLogos} logos sélectionnés`;
    }
  }

  createLogoItem(logo, logoContainer) {
    const logoItem = document.createElement("div");
    logoItem.className = "p-2 cursor-pointer rounded-md hover:bg-blue-100 flex flex-col items-center relative";
    logoItem.dataset.logoPath = logo.path;

    const logoImg = document.createElement("img");
    logoImg.src = logo.path;
    logoImg.className = "w-32 h-32 object-cover";
    logoImg.style.aspectRatio = "1/1";

    // Ajouter l'icône "moreoptions.svg" qui apparaît au survol
    const moreOptionsIcon = document.createElement("img");
    moreOptionsIcon.src = "../public/images/moreoptions.svg";
    moreOptionsIcon.className = "absolute top-2 right-2 w-[24px] h-[24px] opacity-0 transition-opacity duration-200";
    moreOptionsIcon.style.pointerEvents = "auto"; // Permettre les interactions avec l'icône

    // Créer l'icône de sélection (flèche bleue) - Déplacée en haut à gauche
    const selectionIcon = document.createElement("div");
    selectionIcon.className =
      "absolute top-[-15px] right-[-10px] w-[48px] h-[48px] rounded-full flex items-center justify-center hidden z-20";
    selectionIcon.innerHTML = `
      <img src="../public/images/checked.svg" class="h-8 w-8" alt="Selected" />
    `;
    logoItem.appendChild(selectionIcon);

    // Menu contextuel pour les options du logo
    const contextMenu = document.createElement("div");
    contextMenu.className = "absolute top-8 right-2 bg-white shadow-md rounded-md py-1 hidden z-10";

    const deleteOption = document.createElement("div");
    deleteOption.className = "px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm";
    deleteOption.textContent = "Supprimer";
    deleteOption.addEventListener("click", async (e) => {
      e.stopPropagation(); // Empêcher le clic de se propager au logoItem

      await window.require("electron").ipcRenderer.invoke("delete-logo", logo.path);
      logoItem.remove(); // Retirer le logo de l'UI

      // Si ce logo était sélectionné, le retirer de la liste des sélectionnés
      const index = this.selectedLogos.findIndex((l) => l.path === logo.path);
      if (index !== -1) {
        this.selectedLogos.splice(index, 1);
        this.updateLogoCounter();
      }

      contextMenu.classList.add("hidden");
    });

    contextMenu.appendChild(deleteOption);
    logoItem.appendChild(contextMenu);

    // Afficher l'icône au survol
    logoItem.addEventListener("mouseenter", () => {
      if (!logoItem.classList.contains("selected")) {
        moreOptionsIcon.classList.remove("opacity-0");
        moreOptionsIcon.classList.add("opacity-100");
      }
    });

    // Masquer l'icône quand la souris quitte l'élément
    logoItem.addEventListener("mouseleave", () => {
      moreOptionsIcon.classList.remove("opacity-100");
      moreOptionsIcon.classList.add("opacity-0");
      // Masquer le menu contextuel après un court délai
      setTimeout(() => {
        if (!contextMenu.matches(":hover")) {
          contextMenu.classList.add("hidden");
        }
      }, 300);
    });

    // Ajouter un événement de clic à l'icône d'options
    moreOptionsIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // Empêcher le clic de se propager au logoItem
      // Afficher/masquer le menu contextuel
      contextMenu.classList.toggle("hidden");
    });

    logoItem.appendChild(logoImg);
    logoItem.appendChild(moreOptionsIcon);

    logoItem.addEventListener("click", () => {
      // Vérifier si le logo est déjà sélectionné
      const index = this.selectedLogos.findIndex((l) => l.path === logo.path);

      if (index !== -1) {
        // Si déjà sélectionné, le désélectionner
        this.selectedLogos.splice(index, 1);
        logoImg.classList.remove("opacity-50");
        selectionIcon.classList.add("hidden");
        logoItem.classList.remove("selected");
      } else {
        // Si pas encore sélectionné et moins de 3 logos sont sélectionnés
        if (this.selectedLogos.length < this.maxLogos) {
          this.selectedLogos.push(logo);
          logoImg.classList.add("opacity-50");
          selectionIcon.classList.remove("hidden");
          logoItem.classList.add("selected");
          moreOptionsIcon.classList.add("opacity-0");
        }
      }

      // Mettre à jour le compteur de logos
      this.updateLogoCounter();

      // Mettre à jour le texte du bouton d'impression en fonction de la sélection
      const printButton = this.popup.querySelector("button:last-child");
      if (this.selectedLogos.length > 0) {
        if (this.exportType === "pdf") {
          printButton.textContent = "Enregistrer";
        } else {
          printButton.textContent = "Imprimer";
        }
      } else {
        if (this.exportType === "pdf") {
          printButton.textContent = "Enregistrer sans logo";
        } else {
          printButton.textContent = "Imprimer sans logo";
        }
      }
    });

    return logoItem;
  }

  updateLogoCounter() {
    const logoCounter = this.popup.querySelector("#logo-counter");
    if (logoCounter) {
      logoCounter.textContent = `${this.selectedLogos.length} / ${this.maxLogos} logos sélectionnés`;
    }
  }

  showMaxLogosMessage() {
    // Cette méthode n'est plus utilisée car nous utilisons maintenant le compteur
    // mais nous la gardons pour compatibilité avec le code existant
    this.updateLogoCounter();
  }
}
