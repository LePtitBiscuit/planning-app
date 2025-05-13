export class ColumnInputs {
  constructor(type = "config", columns = [], purpose = "planning") {
    this.type = type;
    this.columns = columns;
    this.currentCount = 0;
    this.maxColumns = 4;
    this.container = null;
    this.columnsValues = {};
    this.activeContextMenu = null;
    this.purpose = purpose;
  }

  init(columnsSection, planningTable) {
    // Create the column inputs container
    this.planningTable = planningTable;
    this.container = document.createElement("div");
    this.container.id = "column-inputs";
    this.container.className = "flex flex-row gap-4 items-end ml-2 relative";

    // Append the container to columns section
    columnsSection.appendChild(this.container);
    // Create add button

    if (this.type === "config") {
      this.addButton = document.createElement("button");
      this.addButton.id = "add-column";
      this.addButton.className =
        "absolute right-[-5px] top-0 text-2xl text-gray-700 hover:text-blue-600 cursor-pointer focus:outline-none focus:text-blue-600";
      this.addButton.title = "Ajouter";
      this.addButton.textContent = "+";
      this.addButton.addEventListener("click", () => this.addColumn());

      // Append add button to the container
      this.container.appendChild(this.addButton);

      if (this.type === "config" && this.columns.length === 0) {
        this.addColumn();
      } else if (this.type === "config" && this.columns.length > 0) {
        this.columns.forEach((column) => {
          this.addColumn();
        });
      }
      setTimeout(() => {
        this.updateDeleteButtons();
      }, 0);
    }

    if (this.type === "addrow") {
      this.columns.forEach((column) => {
        this.addColumn(column);
      });
    }

    // Add click event listener to document to close context menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        this.activeContextMenu &&
        !this.activeContextMenu.contains(e.target) &&
        !e.target.closest(".column-more-options")
      ) {
        this.closeContextMenu();
      }
    });
  }

  addColumn(columnname = "Colonne", element = this.container, position = "beforeend") {
    if (this.currentCount >= this.maxColumns) return;
    const newIndex = this.currentCount + 1;
    const columnDiv = document.createElement("div");
    columnDiv.className = "flex flex-col max-h-[65px]";
    columnDiv.innerHTML = `
            <label class="text-gray-700 font-medium mb-1"><span id="column-label-${newIndex}">
                ${this.type === "config" ? `${columnname} ${newIndex}` : columnname}</span>
                ${
                  this.type === "config"
                    ? `<span class="inline-block cursor-pointer text-gray-400 hover:text-red-500 delete-column">
                        <img src="../public/images/delete.svg" alt="Supprimer" title="Supprimer" class="w-4 h-4 inline" />
                    </span>`
                    : `<span class="inline-block cursor-pointer text-gray-400 hover:text-gray-600 column-more-options">
                        <img src="../public/images/moreoptions.svg" alt="Options" title="Options" class="w-4 h-4 inline" />
                    </span>`
                }
            </label>
            <input
                id="column-input-${newIndex}"
                type="text"
                ${
                  this.type == "config"
                    ? `placeholder="Libellé pour la colonne"`
                    : `placeholder="Valeur pour la colonne '${columnname}'"`
                }
                class="w-[250px] max-h-[40px] truncate border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
        `;
    setTimeout(() => {
      element.insertAdjacentElement(position, columnDiv);
    }, 0);

    // Focus on the newly added input instead of the last one
    if (this.type === "config") {
      this.planningTable.addColumn(this.currentCount);

      this.currentCount++;
      const newInput = columnDiv.querySelector("input");
      setTimeout(() => {
        if (newInput && this.currentCount !== 1) {
          newInput.focus();
          newInput.select();
        }
      }, 0);

      columnDiv.querySelector(".delete-column").addEventListener("click", () => {
        this.deleteColumn(columnDiv);
      });

      newInput.addEventListener("input", () => {
        this.planningTable.updateColumnTitle(newInput.value, this.getColumnIndex(columnDiv));
      });

      setTimeout(() => {
        this.updateDeleteButtons();
      }, 0);

      setTimeout(() => {
        this.container.append(this.addButton);
      }, 0);

      // this.updatePlanningTable();
    } else if (this.type === "addrow") {
      this.currentCount++;
      const newInput = columnDiv.querySelector("input");
      newInput.addEventListener("input", () => {
        this.columnsValues[newInput.id] = newInput.value;
      });

      // Add event listener for more options button
      const moreOptionsBtn = columnDiv.querySelector(".column-more-options");
      if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.showColumnOptionsMenu(e, columnDiv);
        });
      }
    }
  }

  showColumnOptionsMenu(event, columnDiv) {
    // Close any existing context menu
    this.closeContextMenu();

    // Create context menu
    const contextMenu = document.createElement("div");
    contextMenu.className = "absolute bg-white shadow-lg rounded-lg py-2 z-50 w-fit";
    contextMenu.style.top = `${event.clientY}px`;
    contextMenu.style.left = `${event.clientX}px`;

    // Check if column limit is reached
    const currentColumnCount = this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\]").length;
    const maxColumnsReached = this.maxColumns && currentColumnCount >= this.maxColumns;

    // Check if this is the last column (for delete option)
    const isLastColumn = currentColumnCount <= 1;

    // Create menu options
    const options = [
      { text: "Renommer la colonne", icon: "edit", action: () => this.renameColumn(columnDiv), disabled: false },
      {
        text: "Supprimer la colonne",
        icon: "delete",
        action: () => this.deleteColumn(columnDiv),
        disabled: isLastColumn,
      },
      {
        text: "Ajouter une colonne à droite",
        icon: "add-right",
        action: () => this.addColumnAfter(columnDiv),
        disabled: maxColumnsReached,
      },
      {
        text: "Ajouter une colonne à gauche",
        icon: "add-left",
        action: () => this.addColumnBefore(columnDiv),
        disabled: maxColumnsReached,
      },
    ];

    options.forEach((option) => {
      const menuItem = document.createElement("div");

      // Apply different styles for disabled items
      if (option.disabled) {
        menuItem.className = "px-4 py-2 flex items-center text-gray-400 cursor-not-allowed opacity-60";
      } else {
        menuItem.className =
          "px-4 py-2 cursor-pointer flex items-center hover:bg-blue-100 hover:translate-x-1 transition-all duration-200 ease-in-out";
      }

      menuItem.innerHTML = `
        <span class="mr-2">
          <img src="../public/images/${option.icon}.svg" alt="${option.text}" class="w-4 h-4 inline" style="opacity: ${
        option.disabled ? "0.5" : "1"
      }; pointer-events: ${option.disabled ? "none" : "auto"};" />
        </span>
        ${option.text}
      `;

      // Only add click event if not disabled
      if (!option.disabled) {
        menuItem.addEventListener("click", () => {
          option.action();
          this.closeContextMenu();
        });
      }

      contextMenu.appendChild(menuItem);
    });

    // Add to document
    document.body.appendChild(contextMenu);
    this.activeContextMenu = contextMenu;

    // Adjust position if menu goes off screen
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
  }

  closeContextMenu() {
    if (this.activeContextMenu) {
      this.activeContextMenu.remove();
      this.activeContextMenu = null;
    }
  }

  renameColumn(columnDiv) {
    const label = columnDiv.querySelector("label");
    if (label) {
      // Get the current column name (extract text without the delete button)
      const currentText = label.textContent.trim();
      const columnName = currentText;

      // Create input element
      const input = document.createElement("input");
      input.type = "text";
      input.value = columnName || `Colonne ${this.getColumnIndex(columnDiv) + 1}`;
      input.className = "w-[100px] px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400";

      // Clear the label and add the input
      label.innerHTML = "";
      label.appendChild(input);

      // Focus the input
      input.focus();
      input.select();

      // Variable to track if space key was pressed
      let escapeKeyPressed = false;

      // Handle input blur (when user clicks away)
      input.addEventListener("blur", () => {
        // Only save if space key wasn't pressed
        if (!escapeKeyPressed) {
          this.saveColumnName(columnDiv, input.value);
        }
        // Reset the flag
        escapeKeyPressed = false;
      });

      // Handle key press events
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          input.blur();
        } else if (e.key === "Escape") {
          e.stopPropagation();
          this.saveColumnName(columnDiv, columnName);
          // Set the flag when space is pressed
          escapeKeyPressed = true;
          // Reset the flag after a short delay to allow for the space to be entered
          setTimeout(() => {
            escapeKeyPressed = false;
          }, 100);
        }
      });
    }
  }

  saveColumnName(columnDiv, name) {
    const label = columnDiv.querySelector("label");
    const newIndex = this.getColumnIndex(columnDiv);
    setTimeout(() => {
      label.innerHTML = `
                ${name}</span>

                    <span class="inline-block cursor-pointer text-gray-400 hover:text-gray-600 column-more-options">
                        <img src="../public/images/moreoptions.svg" alt="Options" title="Options" class="w-4 h-4 inline" />
                    </span>
                
            `;
    }, 0);

    setTimeout(() => {
      const moreOptionsBtn = label.querySelector(".column-more-options");
      const input = columnDiv.querySelector("input");
      input.placeholder = `Valeur pour la colonne '${name}'`;
      if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.showColumnOptionsMenu(e, columnDiv);
        });
      }
    }, 0);

    this.planningTable.updateColumnTitle(name, newIndex);
  }

  getColumnIndex(columnDiv) {
    const columns = Array.from(this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\]"));

    return columns.indexOf(columnDiv);
  }

  addColumnAfter(columnDiv) {
    const columns = Array.from(this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\]"));
    const index = columns.indexOf(columnDiv);

    if (columns.length < this.maxColumns) {
      // Create new column
      this.addColumn(`Colonne ${index + 2}`, columnDiv, "afterend");
    }
    this.updateColumnLabels();

    this.planningTable.addColumn(index + 1);
  }

  addColumnBefore(columnDiv) {
    const columns = Array.from(this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\]"));
    const index = columns.indexOf(columnDiv);

    if (columns.length < this.maxColumns) {
      // Create new column
      this.addColumn(`Colonne ${index + 1}`, columnDiv, "beforebegin");
    }
    setTimeout(() => {
      this.updateColumnLabels();
    }, 0);

    this.planningTable.addColumn(index);
  }

  deleteColumn(button) {
    if (this.type === "config") {
      const columnDiv = button.closest(".flex.flex-col.max-h-\\[65px\\]");
      if (columnDiv) {
        this.planningTable.deleteColumn(this.getColumnIndex(columnDiv));

        columnDiv.remove();
        this.updateDeleteButtons();

        // this.updatePlanningTable();
      }
    } else if (this.type === "addrow") {
      const columnDiv = button.closest(".flex.flex-col.max-h-\\[65px\\]");
      if (columnDiv) {
        this.planningTable.deleteColumn(this.getColumnIndex(columnDiv));

        columnDiv.remove();
      }
    }
    this.currentCount--;
    setTimeout(() => {
      this.updateColumnLabels();
    }, 0);
  }

  updateColumnLabels() {
    const columns = this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\]");
    columns.forEach((column, index) => {
      const label = column.querySelector("label");
      const labelSpan = column.querySelector("span[id^='column-label-']");
      const labelText = label.querySelector("span");
      const input = column.querySelector("input");
      if (labelText.textContent.includes("Colonne")) {
        labelSpan.innerHTML = `Colonne ${index + 1}`;
      }
      if (labelSpan) {
        labelSpan.id = `column-label-${index + 1}`;
      }
      if (input) {
        input.id = `column-input-${index + 1}`;
      }
    });
  }

  updateDeleteButtons() {
    const columns = this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\]");
    const deleteButtons = this.container.querySelectorAll('img[src="../public/images/delete.svg"]');

    // Désactiver le bouton de suppression si une seule colonne
    if (columns.length === 1) {
      deleteButtons[0].parentElement.style.pointerEvents = "none";
      deleteButtons[0].style.opacity = "0.5";
    } else {
      deleteButtons.forEach((button) => {
        button.parentElement.style.pointerEvents = "auto";
        button.style.opacity = "1";
      });
    }

    // Désactiver le bouton d'ajout si nombre maximum de colonnes atteint
    if (columns.length >= this.maxColumns) {
      this.addButton.style.pointerEvents = "none";
      this.addButton.style.opacity = "0.5";
    } else {
      this.addButton.style.pointerEvents = "auto";
      this.addButton.style.opacity = "1";
    }
  }

  updatePlanningTable() {
    // Get all column inputs and extract their values
    const columns = this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\] input");
    const columnValues = Array.from(columns).map(
      (input) => input.value || `Colonne ${Array.from(columns).indexOf(input) + 1}`
    );

    // Update the planning table columns
    this.planningTable.updateColumns(columnValues);
  }

  clearInputs() {
    // Get all column inputs and clear their values
    const inputs = this.container.querySelectorAll(".flex.flex-col.max-h-\\[65px\\] input");
    inputs.forEach((input) => {
      input.value = "";

      // If in addrow mode, also clear the stored values
      if (this.type === "addrow") {
        this.columnsValues[input.id] = "";
      }
    });
  }
}
