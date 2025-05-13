import { StyleDropdown } from "./dropdownoptions.js";
import { PlanningContextMenu } from "./planning-context-menu.js";
const html2canvas = require("html2canvas");
export class PlanningTableView {
  constructor() {
    this.title = `Planning du ${new Date().toLocaleDateString("fr-FR")}`;
    this.showTimeSlots = false;
    this.titleElement = null;
    this.table = null;
    this.timeSlots = [];
    this.timeSlotsAdjusted = [];
    this.adjustTimeSlots = false;
    this.slotDuration = null;
    this.columns = [];
    this.rows = [];
    this.firstSection = null;
  }

  /**
   * Initialize the planning table
   * @param {HTMLElement} container - The container element where the table will be inserted
   * @param {Object} config - Configuration object containing startTime, endTime, slotDuration, and columns
   */
  initialize(container, config) {
    this.page = container;
    this.container = this.page.querySelector("#planning-container");
    // Create title element
    const titleContainer = document.createElement("div");
    titleContainer.className = "pb-4 px-4 text-center";
    titleContainer.id = "planning-title-container";
    this.titleElement = document.createElement("h3");
    this.titleElement.className = "text-xl font-semibold";
    titleContainer.appendChild(this.titleElement);

    // Add title to the main container
    this.container.appendChild(titleContainer);

    // Create the container div with the provided classes
    this.tableContainer = document.createElement("div");
    this.tableContainer.className =
      "bg-white rounded-2xl border border-gray-200 shadow-md w-full mx-auto max-h-[497px] overflow-y-auto relative";
    this.tableContainer.classList.add(
      "[&::-webkit-scrollbar]:w-2",
      "[&::-webkit-scrollbar-thumb]:bg-blue-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full"
    );
    this.tableContainer.id = "planning";

    // Create the table element
    this.table = document.createElement("table");
    this.table.className = "border-collapse w-full ";

    this.title = config?.title || this.title;
    this.titleElement.textContent = this.title;

    this.name = config?.name || this.title;
    this.id = config?.id || null;
    this.startHour = config.startTime;
    this.endHour = config.endTime;
    this.slotDuration = config.slotDuration;
    this.rows = config.rows || [];
    this.showTimeSlots = config.showTimeSlots || false;

    // Set columns
    this.columns = config.columns || [];
    // Create table structure
    this.createTableStructure();

    // Generate time slots based on configuration

    this.generateTimeSlots(config.startTime, config.endTime, config.slotDuration);

    // Append table to the table container
    this.tableContainer.appendChild(this.table);

    // Append the table container to the main container
    this.container.appendChild(this.tableContainer);

    // Add double-click event listener to the title element
    this.titleElement.addEventListener("dblclick", (event) => {
      event.preventDefault();

      // Create input element to replace the title
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = this.title;
      titleInput.className =
        "text-xl font-semibold w-[300px] text-center border border-blue-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500";

      // Replace the title with the input
      this.titleElement.textContent = "";
      this.titleElement.appendChild(titleInput);

      // Focus on the input
      titleInput.focus();
      titleInput.select();

      // Function to save the new title
      const saveTitle = () => {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
          this.updateTitle(newTitle);
        } else {
          // If empty, revert to original title
          this.titleElement.textContent = this.title;
        }
      };

      // Save on enter key
      titleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveTitle();
        } else if (e.key === "Escape") {
          // Cancel on escape key
          this.titleElement.textContent = this.title;
        }
      });

      // Save on blur (when clicking outside)
      titleInput.addEventListener("blur", saveTitle);
    });

    // Add event listener to the document to close the context menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".row-context-menu")) {
        this.closeRowContextMenu();
      }
    });

    if (this.rows.length > 0) {
      this.rows.forEach((row, index) => {
        this.addRow(Object.values(row.columns), row.schedule, row.color, true, index);
      });
    }
    this.unsavedChanges = false;
  }

  showPlanningSettingsButton() {
    this.page.querySelector(".pb-4").classList.remove("pb-4");
    this.planningSettingsMenu = new PlanningContextMenu(this.container, this);
  }

  /**
   * Generate time slots array based on start time, end time and duration
   * @param {string} startTime - Start time in format "HH:MM"
   * @param {string} endTime - End time in format "HH:MM"
   * @param {number} duration - Duration in minutes
   */
  generateTimeSlots(startTime, endTime, duration, changeRange = false, fromDurationDropdown = false) {
    if (this.adjustTimeSlots && !changeRange) {
      startTime = this.getMinStartTime(this.getScheduleValues());
      endTime = this.getMaxEndTime(this.getScheduleValues());
      duration = duration ? duration : this.slotDuration;
    }

    changeRange = fromDurationDropdown ? true : changeRange;

    let response = {
      timeSlotError: false,
      startTimeError: false,
      endTimeError: false,
      newTimeSlots: [],
    };

    if (!startTime || !endTime || !duration) {
      startTime = this.startHour;
      endTime = this.endHour;
      duration = this.slotDuration;
    }
    const [startHour, startMinute] = startTime.split("h").map(Number);
    const [endHour, endMinute] = endTime.split("h").map(Number);
    let currentHour = startHour;
    let currentMinute = startMinute;
    let newTimeSlots = [];
    if (startMinute % duration !== 0) {
      currentMinute = 0;
      response.startTimeError = true;
      response.newTimeSlots = newTimeSlots;
    }

    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, "0")}h${currentMinute.toString().padStart(2, "0")}`;
      newTimeSlots.push(timeString);

      currentMinute += duration;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute = 0;
      }
    }

    if (this.rows.length > 0) {
      // Generate a list of all schedule values from this.rows
      const scheduleValues = this.getScheduleValues();
      scheduleValues.forEach((timeSlot) => {
        if (!newTimeSlots.includes(timeSlot)) {
          response.timeSlotError = true;
        }
      });
    }

    if (endMinute % duration !== 0) {
      response.endTimeError = true;
      response.newTimeSlots = newTimeSlots;
    }

    if (changeRange && !this.adjustTimeSlots && !response.timeSlotError) {
      // console.log("1111111111111111111111111");
      this.startHour = startTime;
      this.endHour = endTime;
      this.timeSlots = newTimeSlots;
      this.slotDuration = duration;
      this.updateTimeSlotsColumns(newTimeSlots);
      return response;
    } else if (changeRange && fromDurationDropdown && !response.timeSlotError) {
      // console.log("2222222222222222222222222");
      this.slotDuration = duration;
      this.updateTimeSlotsColumns(newTimeSlots);
      return response;
    } else if (changeRange && this.adjustTimeSlots && !response.timeSlotError) {
      // console.log("3333333333333333333333333");
      this.startHour = startTime;
      this.endHour = endTime;
      this.timeSlots = newTimeSlots;
      this.slotDuration = duration;
      this.generateTimeSlots();
      return response;
    } else if (!response.timeSlotError) {
      // console.log("4444444444444444444444444");
      this.slotDuration = duration;
      this.updateTimeSlotsColumns(newTimeSlots);
    }
    return response;
  }

  getMinStartTime(timeSlots) {
    if (timeSlots.length > 0) {
      let min = timeSlots[0];
      for (let i = 1; i < timeSlots.length; i++) {
        const [minHour, minMinute] = min.split("h").map(Number);
        const [currHour, currMinute] = timeSlots[i].split("h").map(Number);

        if (currHour < minHour || (currHour === minHour && currMinute < minMinute)) {
          min = timeSlots[i];
        }
      }

      return min;
    } else {
      return null;
    }
  }

  getMaxEndTime(timeSlots) {
    if (timeSlots.length > 0) {
      let max = timeSlots[0];
      for (let i = 1; i < timeSlots.length; i++) {
        const [maxHour, maxMinute] = max.split("h").map(Number);
        const [currHour, currMinute] = timeSlots[i].split("h").map(Number);

        if (currHour > maxHour || (currHour === maxHour && currMinute > maxMinute)) {
          max = timeSlots[i];
        }
      }

      return max;
    } else {
      return null;
    }
  }

  getScheduleValues() {
    const scheduleValues = [];
    this.rows.forEach((row) => {
      row.schedule.forEach((timeSlot) => {
        if (!scheduleValues.includes(timeSlot)) {
          scheduleValues.push(timeSlot);
        }
      });
    });
    return scheduleValues;
  }

  updateTimeSlotsColumns(newTimeSlots) {
    // Get the table header row
    const headerRow = this.table.querySelector("#planning-header-row");
    const firstTimeSlotLabel = this.container.querySelector("span.first-timeslot-label");
    if (firstTimeSlotLabel) {
      firstTimeSlotLabel.textContent = newTimeSlots[0];
    }
    if (headerRow) {
      // Find all time slot th elements and remove them
      // We keep the column headers and the empty th, so we start from the columns.length + 1
      const timeSlotElements = Array.from(headerRow.querySelectorAll("th")).slice(this.columns.length + 1);
      timeSlotElements.forEach((th) => th.remove());

      // Remove the time slots container if it exists
      const existingTimeSlotsContainer = headerRow.querySelector("th.p-0.border-0");
      if (existingTimeSlotsContainer) {
        existingTimeSlotsContainer.remove();
      }

      // Create a new container th for time slots
      const timeSlotsContainer = document.createElement("th");
      timeSlotsContainer.className = "p-0 border-0";
      timeSlotsContainer.colSpan = newTimeSlots.length - 1;

      // Create a div to contain all time slots and distribute them evenly
      const timeSlotsDiv = document.createElement("div");
      timeSlotsDiv.className = "flex w-full border-b-gray-200";

      // Add time slot headers inside the div
      newTimeSlots.forEach((timeSlot, index) => {
        // Only add the label for timeslots after the first one
        if (index > 0) {
          const timeSlotDiv = document.createElement("div");
          timeSlotDiv.className =
            "flex-1 text-center py-3 h-[50px] border-r border-gray-200 text-xs font-normal relative";
          const span = document.createElement("span");
          span.className = "timeslot-label";
          span.textContent = timeSlot;
          timeSlotDiv.appendChild(span);
          timeSlotsDiv.appendChild(timeSlotDiv);
        }
      });

      // Append the time slots div to the container
      timeSlotsContainer.appendChild(timeSlotsDiv);

      // Append the container to the header row
      headerRow.appendChild(timeSlotsContainer);
    }

    // Update all rows with new time slots
    if (this.showTimeSlots) {
      const tableRows = this.table.querySelectorAll("tr:not(#planning-header-row)");

      tableRows.forEach((row, index) => {
        // Remove all existing timeslot cells

        const timeslotCells = row.querySelectorAll("td.timeslot-cell");
        timeslotCells.forEach((cell) => cell.remove());

        // Add new timeslot cells based on the new time slots
        for (let i = 0; i < newTimeSlots.length - 1; i++) {
          if (row.id !== "tmp-row") {
            const td = document.createElement("td");
            let colored =
              i >= newTimeSlots.findIndex((timeSlot) => timeSlot === this.rows[index].schedule[0]) &&
              i <= newTimeSlots.findIndex((timeSlot) => timeSlot === this.rows[index].schedule[1])
                ? true
                : false;
            td.className = `timeslot-cell cell-border border-gray-200 text-center ${
              colored ? `bg-${this.rows[index].color}` : ""
            }`;
            td.dataset.timeSlot = newTimeSlots[i];
            td.dataset.index = i;
            td.dataset.colored = colored;
            row.appendChild(td);
          } else {
            const td = document.createElement("td");
            td.className = `timeslot-cell p-0`;
            td.dataset.timeSlot = newTimeSlots[i];
            td.dataset.index = i;
            td.dataset.colored = false;
            row.appendChild(td);
          }
        }
        // Add right-click event listener to show context menu
      });
    }

    if (this.adjustTimeSlots) {
      this.timeSlotsAdjusted = newTimeSlots;
    } else {
      this.timeSlots = newTimeSlots;
      this.startHour = newTimeSlots[0];
      this.endHour = newTimeSlots[newTimeSlots.length - 1];
      this.slotDuration = this.slotDuration;
      this.unsavedChanges = true;
    }
  }

  updateTimeDropdowns() {
    let timeSlots = this.timeSlots;
    this.firstSection.timeDropdowns["heure-debut"].update(timeSlots[0], "heure-debut");
    this.firstSection.timeDropdowns["heure-fin"].update(timeSlots[timeSlots.length - 1], "heure-fin");
    this.firstSection.timeDropdowns["heure-fin"].select(timeSlots[timeSlots.length - 1]);
  }

  updatePlanningTableTimeSlots(type, sender) {
    let dropdownContainer;
    if (sender === "planning-context-menu") {
      dropdownContainer = this.planningSettingsMenu.timeDropdowns;
    } else if (sender === "planning") {
      // dropdownContainer = window.timeDropdowns;
      dropdownContainer = this.firstSection.timeDropdowns;
    }
    const durationText = dropdownContainer["duree"].selectedValue;
    let duration = 15;
    if (durationText === "20min") {
      duration = 20;
    } else if (durationText === "30min") {
      duration = 30;
    } else if (durationText === "1h") {
      duration = 60;
    }
    let response = this.generateTimeSlots(
      dropdownContainer["heure-debut"].selectedValue,
      dropdownContainer["heure-fin"].selectedValue,
      duration,
      type !== "slot-duration",
      type === "slot-duration"
    );
    if (response.timeSlotError) {
      // Créer un popup d'alerte
      const alertPopup = document.createElement("div");
      alertPopup.className =
        "fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-50";
      alertPopup.innerHTML = `
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd"></path>
          </svg>
          <span>Impossible de modifier la plage horaire du planning car certains créneaux utilisé risquerait de disparaitre.</span>
        </div>
      `;
      document.body.appendChild(alertPopup);

      // Supprimer le popup après 5 secondes
      setTimeout(() => {
        alertPopup.remove();
      }, 5000);
      return false;
    } else {
      if (response.startTimeError) {
        dropdownContainer["heure-debut"].update(response.newTimeSlots[0]);
      }
      if (response.endTimeError) {
        dropdownContainer["heure-fin"].update(response.newTimeSlots[response.newTimeSlots.length - 1]);
      }
      if (sender === "planning-context-menu") {
        this.updateTimeDropdowns();
      }
      return true;
    }
  }

  /**
   * Create the table structure with header and body
   */
  createTableStructure() {
    // Create tbody directly (no separate thead)
    const tableBody = document.createElement("tbody");
    tableBody.className = "";

    // Create header row with unique ID
    const headerRow = document.createElement("tr");
    headerRow.id = "planning-header-row";
    headerRow.className = "h-[50px] bg-white sticky top-[-1px] z-10";

    // Add column headers with fixed width using Tailwind
    this.columns.forEach((column) => {
      const th = document.createElement("th");
      th.className = "text-center h-full p-0  border-r-gray-200 w-[110px] truncate";
      const div = document.createElement("div");
      div.className = "flex w-full  border-b-gray-200";
      const p = document.createElement("p");
      p.className = "column-title h-[50px] w-full";
      p.textContent = column;
      div.appendChild(p);
      th.appendChild(div);
      headerRow.appendChild(th);
    });

    // Create a container th for time slots
    const timeSlotsContainer = document.createElement("th");
    timeSlotsContainer.className = "p-0 border-0";

    // Create a div to contain all time slots and distribute them evenly
    const timeSlotsDiv = document.createElement("div");
    timeSlotsDiv.className = "flex w-full border-b-gray-200";

    const th = document.createElement("th");
    th.className = "border border-gray-200 w-[25px] sticky ";
    th.textContent = "";
    th.rowSpan = 500;

    const span = document.createElement("span");
    span.className = "first-timeslot-label z-10";
    span.textContent = this.startHour;

    th.appendChild(span);

    timeSlotsContainer.appendChild(timeSlotsDiv);
    headerRow.appendChild(th);
    headerRow.appendChild(timeSlotsContainer);

    // Add header row to tbody
    tableBody.appendChild(headerRow);

    // Add data row with unique ID

    // Add column cells
    for (let i = 0; i < 11; i++) {
      const tempRow = document.createElement("tr");
      tempRow.id = "tmp-row";
      tempRow.className = "h-[40px]";
      const td = document.createElement("td");
      td.className = "h-[40px]";
      tempRow.appendChild(td);

      // Add data row to tbody
      tableBody.appendChild(tempRow);
    }

    // Add tbody to table
    this.table.appendChild(tableBody);
  }

  /**
   * Add a new column to the table
   * @param {number} columnIndex - The index where to insert the column (0-based). If not provided, adds to the end.
   */
  addColumn(columnIndex = null) {
    // If columnIndex is null, add to the end
    if (columnIndex === null) {
      columnIndex = this.columns.length;
    }

    // Check if the column index is valid
    if (columnIndex < 0 || columnIndex > this.columns.length) {
      console.error(`Column index ${columnIndex} is out of bounds. Available columns: 0-${this.columns.length}`);
      return;
    }

    // Add the column to the internal array at the specified index
    this.columns.splice(columnIndex, 0, `Colonne ${columnIndex + 1}`);

    // Update the header row
    const headerRow = this.table.querySelector("#planning-header-row");
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll("th");

      // Create new header cell
      // const th = document.createElement("th");
      // th.className = "text-center h-full p-0  border-r-gray-200 w-[110px] truncate";
      // const div = document.createElement("div");
      // div.className = "flex w-full  border-b-gray-200";
      // const p = document.createElement("p");
      // p.className = "column-title h-[50px] w-full";
      // p.textContent = column;
      const th = document.createElement("th");
      th.className = "text-center h-full p-0 border-r-gray-200 w-[110px] truncate";
      const div = document.createElement("div");
      div.className = "flex w-full border-b-gray-200";
      const p = document.createElement("p");
      p.className = "column-title h-[50px] w-full";
      p.textContent = `Colonne ${columnIndex + 1}`;
      div.appendChild(p);
      th.appendChild(div);

      // Insert at the correct position
      if (headerCells.length > 0 && columnIndex < headerCells.length) {
        headerRow.insertBefore(th, headerCells[columnIndex]);
      } else {
        // If adding at the end, insert before the time slots container
        const timeSlotsContainer = headerRow.querySelector("th:last-child");
        headerRow.insertBefore(th, timeSlotsContainer);
      }

      this.reorganizeColumnsTitles();
    }

    // Update all data rows
    const rows = this.table.querySelectorAll("#planning-data-row");
    // Skip the first row (index 0) and process the rest
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll("td");

      // Create new cell
      const newCell = document.createElement("td");
      newCell.className = "h-[40px] cell-border border-gray-200 text-center";

      // Insert at the correct position
      if (cells.length > 0 && columnIndex < cells.length - 1) {
        // -1 because of the time slots cell
        row.insertBefore(newCell, cells[columnIndex]);
      } else {
        // If adding at the end, insert before the time slots cell
        const timeSlotCell = row.querySelector("td:last-child");
        row.insertBefore(newCell, timeSlotCell);
      }

      this.addRowEditListeners(row);
      this.reorganizeColumnsTitles();
      this.unsavedChanges = true;
    }
  }

  /**
   * Delete a column from the table
   * @param {number} columnIndex - The index of the column to delete (0-based)
   */
  deleteColumn(columnIndex) {
    // Check if the column index is valid
    if (columnIndex < 0 || columnIndex >= this.columns.length) {
      console.error(`Column index ${columnIndex} is out of bounds. Available columns: 0-${this.columns.length - 1}`);
      return;
    }

    // Remove the column from the internal array
    this.columns.splice(columnIndex, 1);

    // Update the table structure
    const headerRow = this.table.querySelector("#planning-header-row");
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll("th");
      if (headerCells && headerCells.length > columnIndex) {
        // Remove the header cell
        headerCells[columnIndex].remove();
      }
    }

    // Update all data rows
    const rows = this.table.querySelectorAll("#planning-data-row");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells && cells.length > columnIndex) {
        // Remove the cell at the specified index
        cells[columnIndex].remove();
        this.addRowEditListeners(row);
      }
    });

    // If this was the last column, you might want to add a placeholder or notify the user
    if (this.columns.length === 0) {
      console.warn("All columns have been deleted. Consider adding a new column.");
    }

    this.reorganizeColumnsTitles();
    this.unsavedChanges = true;
  }

  reorganizeColumnsTitles() {
    this.columns.forEach((column, index) => {
      if (column.includes("Colonne")) {
        this.updateColumnTitle(`Colonne ${index + 1}`, index);
      }
    });
  }

  /**
   * Update the title of a specific column
   * @param {string} title - The new title for the column
   * @param {number} columnIndex - The index of the column to update (0-based)
   */
  updateColumnTitle(title, columnIndex) {
    // Check if the column index is valid
    if (columnIndex < 0 || columnIndex >= this.columns.length) {
      console.error(`Column index ${columnIndex} is out of bounds. Available columns: 0-${this.columns.length - 1}`);
      return;
    }

    // Update the column in the internal array
    this.columns[columnIndex] = title;

    // Update the column header in the DOM
    const headerRow = this.table.querySelector("#planning-header-row");
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll("th > div > p");
      if (headerCells && headerCells.length > columnIndex) {
        // Update the th content directly
        headerCells[columnIndex].textContent = title;
      }
    }
    this.unsavedChanges = true;
  }
  // /**
  //  * Update the time slots in the table
  //  * @param {string} startTime - Start time in format "HH:MM"
  //  * @param {string} endTime - End time in format "HH:MM"
  //  * @param {number} duration - Duration in minutes
  //  */
  // updateTimeSlots(startTime, endTime, duration) {
  //   this.generateTimeSlots(startTime, endTime, duration);
  //   this.table.innerHTML = "";
  //   this.startHour = startTime;
  //   this.createTableStructure();
  // }

  updateTitle(title) {
    this.title = title;
    this.titleElement.textContent = this.title;
    this.unsavedChanges = true;
  }

  /**
   * Display a context menu for a row with options to delete the row or change its color
   * @param {HTMLElement} row - The row element
   * @param {Event} event - The event that triggered the menu
   */
  showRowContextMenu(row, event) {
    event.preventDefault();
    const index = this.rows.findIndex((item) => item.row === row);

    // Remove any existing context menu
    const existingMenu = this.container.querySelector(".row-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create the context menu
    const contextMenu = document.createElement("div");
    contextMenu.className = "row-context-menu absolute bg-white shadow-lg rounded-lg py-2 z-50 w-fit";

    // Add to DOM to calculate dimensions
    this.container.appendChild(contextMenu);

    // Calculate if there's enough space below
    const menuHeight = 100;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - event.clientY;

    // Position the menu based on available space
    if (spaceBelow < menuHeight && event.clientY > menuHeight) {
      // Not enough space below, but enough space above - show above
      contextMenu.style.left = `${event.pageX - 206}px`;
      contextMenu.style.top = `${event.pageY - menuHeight}px`;
    } else {
      // Enough space below or not enough space above - show below
      contextMenu.style.left = `${event.pageX - 206}px`;
      contextMenu.style.top = `${event.pageY}px`;
    }

    // Delete row option
    const deleteOption = document.createElement("div");
    deleteOption.className =
      "px-4 py-2 cursor-pointer flex items-center hover:bg-blue-100 hover:translate-x-1 transition-all duration-200 ease-in-out";
    deleteOption.innerHTML =
      '<img src="../public/images/delete.svg" class="w-4 h-4 mr-2" alt="Delete"> <span>Supprimer la ligne</span>';
    deleteOption.addEventListener("click", () => {
      this.deleteRow(row);
      contextMenu.remove();
    });
    contextMenu.appendChild(deleteOption);

    if (this.showTimeSlots) {
      // Change color option with dropdown
      const colorOption = document.createElement("div");
      colorOption.className =
        "px-4 py-2 cursor-pointer flex items-center hover:bg-blue-100 hover:translate-x-1 transition-all duration-200 ease-in-out";

      // Create container for the dropdown
      const colorDropdownContainer = document.createElement("div");
      colorDropdownContainer.className = "relative";
      colorOption.appendChild(colorDropdownContainer);

      // Set ID for the dropdown container
      const colorDropdownId = "color-dropdown";
      colorDropdownContainer.id = colorDropdownId;

      // Add options to menu
      contextMenu.appendChild(colorOption);

      // Initialize the StyleDropdown
      setTimeout(() => {
        let _ = null;
        const rowMenu = new StyleDropdown("style-dropdown", colorDropdownId, _, "planning");
        rowMenu.selectedValue = rowMenu.colors.find((color) => color.value === this.rows[index].color)?.name || "Bleu";
        rowMenu.init(this.page, index, this);
      }, 0);
    }
  }

  closeRowContextMenu() {
    const existingMenu = this.container.querySelector(".row-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  showPlanningSettingsMenu() {
    const existingMenu = this.container.querySelector(".planning-settings-menu");
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  /**
   * Delete a row from the table
   * @param {HTMLElement} row - The row to delete
   */
  deleteRow(row) {
    const index = this.rows.findIndex((item) => item.row === row);
    if (index > -1) {
      // Remove the row object from the this.rows array
      const removedRow = this.rows.splice(index, 1)[0];

      // Remove the actual DOM element
      if (this.rows.length < 11) {
        const tbody = this.container.querySelector("tbody");
        const tempRow = document.createElement("tr");
        tempRow.id = "tmp-row";
        tempRow.className = "h-[40px]";
        const td = document.createElement("td");
        td.className = "h-[40px]";
        tempRow.appendChild(td);

        // Add temprow to tbody
        tbody.appendChild(tempRow);
      }
      removedRow.row.remove();

      // If we need to do any cleanup with the row's data (color, columns, schedule)
      // we could do it here, but simple removal is sufficient
      this.closeRowContextMenu();
      this.unsavedChanges = true;

      if (this.rows.length === 27) {
        if (this.firstSection.constructor.name === "AddRowPlanningMenu") {
          this.firstSection.toggleAddRowButton();
        }
      }

      if (this.firstSection && this.firstSection.constructor.name === "AddRowPlanningMenu") {
        this.firstSection.updateRowCount();
      }
    }
  }

  /**
   * Change the color of a row's colored cells
   * @param {HTMLElement} row - The row to change color
   * @param {string} color - The new color class to apply
   */
  changeRowColor(rowIndex, color) {
    const coloredCells = this.rows[rowIndex].row.querySelectorAll('td[data-colored="true"]');
    coloredCells.forEach((cell) => {
      // Remove existing color classes
      const classes = cell.className.split(" ");
      const newClasses = classes.filter((cls) => !cls.startsWith("bg-"));
      cell.className = [...newClasses, `bg-${color}`].join(" ");
    });
    this.rows[rowIndex].color = color;
    this.unsavedChanges = true;
  }

  /**
   * Add a new row to the table
   * @param {Array} row - The row data to be added
   * @param {Array} schedule - The schedule data to be added
   * @param {string} color - The color to apply to the cells
   */
  addRow(columns, schedule, color, fromModel = false, index = null) {
    const tbody = this.container.querySelector("tbody");
    const dataRow = document.createElement("tr");
    dataRow.id = "planning-data-row";
    dataRow.className = "relative"; // Add relative positioning to the row

    // Add column cells

    for (let i = 0; i <= this.columns.length - 1; i++) {
      const td = document.createElement("td");
      td.className = "h-[40px] cell-border border-gray-200 text-center";
      td.textContent = columns[i];
      dataRow.appendChild(td);
    }

    if (this.showTimeSlots) {
      this.timeSlots.slice(1).forEach((timeSlot, index) => {
        if (
          this.timeSlots.indexOf(timeSlot) > this.timeSlots.indexOf(schedule[0]) &&
          this.timeSlots.indexOf(timeSlot) <= this.timeSlots.indexOf(schedule[1])
        ) {
          const td = document.createElement("td");
          td.className = `timeslot-cell h-[40px] bg-${color} p-0 cell-border border-gray-200 text-center`;
          td.textContent = "";
          td.dataset.timeSlot = timeSlot;
          td.dataset.index = index;
          td.dataset.colored = "true";
          dataRow.appendChild(td);
        } else {
          const td = document.createElement("td");
          td.className = "timeslot-cell h-[40px] p-0 cell-border border-gray-200 text-center";
          td.textContent = "";
          td.dataset.timeSlot = timeSlot;
          td.dataset.index = index;
          td.dataset.colored = "false";
          dataRow.appendChild(td);
        }
      });
    }
    // Create a columns object dynamically based on the actual number of columns
    const columnsObj = {};
    this.columns.forEach((columnValue, index) => {
      columnsObj[index + 1] = columns[index] || "";
    });

    if (!fromModel) {
      this.rows.push({
        row: dataRow,
        color: color,
        columns: columnsObj,
        schedule: schedule,
      });
    } else {
      this.rows[index].row = dataRow;
    }

    const tempRow = this.container.querySelector("#tmp-row");
    if (tempRow) {
      // Replace the temporary row with the data row
      tempRow.parentNode.replaceChild(dataRow, tempRow);
    } else {
      // If no temporary row exists, append the data row to tbody
      tbody.appendChild(dataRow);
    }

    if (this.adjustTimeSlots) {
      this.generateTimeSlots();
    }

    // Add event listeners to the row
    this.addRowEditListeners(dataRow);
    // this.addRowDragAndDropListeners(dataRow);
    this.addRowDragListeners(dataRow, this.rows[this.rows.findIndex((item) => item.row === dataRow)]);

    // Add right-click event listener to show context menu
    dataRow.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.showRowContextMenu(dataRow, event);
    });

    if (this.firstSection && this.firstSection.constructor.name === "AddRowPlanningMenu") {
      this.firstSection.updateRowCount();

      this.unsavedChanges = true;
    }

    if (!fromModel) {
      this.tableContainer.scrollTo({
        top: this.tableContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }

  /**
   * Adds drag and drop functionality to a row for coloring time slots
   * @param {HTMLElement} dataRow - The table row to add drag listeners to
   * @param {string} color - The color to apply to the cells
   */
  addRowDragListeners(dataRow, row) {
    // Variables for drag functionality
    let isDragging = false;
    let startCell = null;
    let startWasColored = false;
    let lastColoredCell = null;
    let self = this;

    // Mouse down event to start dragging
    dataRow.addEventListener("mousedown", (event) => {
      // Only process left mouse button clicks (button 0)
      if (event.button !== 0) return;

      event.preventDefault();
      const clickedCell = event.target;
      // Only handle clicks on time slot cells (not column cells)
      if (clickedCell.tagName === "TD" && clickedCell.dataset.timeSlot) {
        isDragging = true;
        startCell = clickedCell;
        startWasColored = clickedCell.dataset.colored === "true";

        // Toggle color on the first clicked cell
        if (startWasColored) {
          removeColor(clickedCell, row.color);
        } else {
          addColor(clickedCell, row.color);
        }

        lastColoredCell = clickedCell;
      }
    });

    // Mouse move event for dragging
    dataRow.addEventListener("mousemove", (event) => {
      event.preventDefault();

      if (isDragging) {
        const currentCell = event.target;

        if (currentCell.tagName === "TD" && currentCell.dataset.timeSlot && currentCell !== lastColoredCell) {
          // Check if we're still in the same row
          if (!dataRow.contains(currentCell)) {
            // If we've moved to a different row, stop dragging
            isDragging = false;
            startCell = null;
            lastColoredCell = null;
            return;
          }

          // Get all time slot cells in this row
          const cells = Array.from(dataRow.querySelectorAll("td[data-time-slot]"));
          const startIndex = parseInt(startCell.dataset.index);
          const currentIndex = parseInt(currentCell.dataset.index);

          // Determine direction of drag
          const min = Math.min(startIndex, currentIndex);
          const max = Math.max(startIndex, currentIndex);

          // Apply color based on whether the start cell was colored or not
          cells.forEach((cell) => {
            const cellIndex = parseInt(cell.dataset.index);
            if (cellIndex >= min && cellIndex <= max) {
              if (!startWasColored) {
                addColor(cell, row.color);
              } else {
                removeColor(cell, row.color);
              }
            }
          });

          lastColoredCell = currentCell;
        }
      }
    });

    // Mouse up event to end dragging
    document.addEventListener("mouseup", () => {
      if (isDragging) {
        // After dragging, fill all cells between first and last colored cells
        const cells = Array.from(dataRow.querySelectorAll("td[data-time-slot]"));

        // Find the first and last colored cells
        let firstColoredIndex = -1;
        let lastColoredIndex = -1;

        cells.forEach((cell, index) => {
          if (cell.dataset.colored === "true") {
            if (firstColoredIndex === -1) {
              firstColoredIndex = index;
            }
            lastColoredIndex = index;
          }
        });

        // If we found colored cells, fill everything between them
        if (firstColoredIndex !== -1 && lastColoredIndex !== -1) {
          cells.forEach((cell, index) => {
            if (index >= firstColoredIndex && index <= lastColoredIndex) {
              addColor(cell, row.color);
            }
            if (this.adjustTimeSlots) {
              row.schedule[0] = this.timeSlotsAdjusted[firstColoredIndex];
              row.schedule[1] = this.timeSlotsAdjusted[lastColoredIndex + 1];
            } else {
              row.schedule[0] = this.timeSlots[firstColoredIndex];
              row.schedule[1] = this.timeSlots[lastColoredIndex + 1];
            }
          });
        } else {
          row.schedule = [];
        }
        isDragging = false;
        startCell = null;
        lastColoredCell = null;
        self.unsavedChanges = true;
      }
    });

    // Helper function to add color to a cell
    function addColor(cell, color) {
      cell.classList.add(`bg-${color}`);
      // cell.classList.add(`border-${color}`);
      cell.classList.add("border-b-gray-200");
      cell.classList.remove("border-gray-200");
      cell.dataset.colored = "true";
    }

    // Helper function to remove color from a cell
    function removeColor(cell, color) {
      cell.classList.remove(`bg-${color}`);
      cell.classList.remove(`border-${color}`);
      cell.classList.remove("border-b-gray-200");
      cell.classList.add("border-gray-200");
      cell.dataset.colored = "false";
    }
  }

  /**
   * Adds event listeners to a row to enable editing of the first columns by double-clicking
   * @param {HTMLElement} row - The table row to add event listeners to
   */
  addRowEditListeners(row) {
    // Get all cells in the row
    const cells = row.querySelectorAll("td");

    // We'll only make the first columns editable
    // Assuming the first columns are the ones before the time slots
    const editableCells = Array.from(cells).filter((cell) => !cell.classList.contains("timeslot-cell"));

    // Remove existing double-click event listeners if they exist
    editableCells.forEach((cell) => {
      if (cell._hasDoubleClickListener) {
        // Clone the cell to remove all event listeners
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
        // Update the reference in the array
        editableCells[editableCells.indexOf(cell)] = newCell;
      }
    });

    const currentRowIndex = this.rows.findIndex((item) => item.row === row);
    const self = this; // Store reference to 'this' for use in event listeners

    editableCells.forEach((cell, cellIndex) => {
      // Skip if the cell already has a double-click event listener
      if (cell._hasDoubleClickListener) {
        return;
      }

      // Mark the cell as having a double-click event listener
      cell._hasDoubleClickListener = true;

      // Add double-click event listener
      cell.addEventListener("dblclick", function () {
        // Store the current content
        const currentContent = cell.textContent;

        // Create an input element
        const input = document.createElement("input");
        input.type = "text";
        input.value = currentContent;
        input.className = "w-full px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-400";

        // Clear the cell and add the input
        cell.textContent = "";
        cell.appendChild(input);

        // Focus the input
        input.focus();

        // Handle input blur (when user clicks away)
        input.addEventListener("blur", function () {
          cell.textContent = input.value;
          self.rows[currentRowIndex].columns[cellIndex + 1] = input.value;
          self.unsavedChanges = true;
        });

        // Handle Enter key press and Tab key for navigation
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            cell.textContent = input.value;
          } else if (e.key === "Escape") {
            cell.textContent = currentContent;
          } else if (e.key === "Tab") {
            e.preventDefault(); // Prevent default tab behavior
            cell.textContent = input.value;

            // Handle Shift+Tab for backward navigation
            if (e.shiftKey) {
              // Try to find the previous editable cell in the current row
              if (cellIndex > 0) {
                // Move to the previous cell in the same row
                const prevCell = editableCells[cellIndex - 1];
                prevCell.dispatchEvent(new MouseEvent("dblclick"));
              } else {
                // Try to move to the last editable cell in the previous row
                if (currentRowIndex > 0) {
                  const prevRow = self.rows[currentRowIndex - 1];
                  const prevRowEditableCells = Array.from(prevRow.querySelectorAll("td")).filter(
                    (cell) => !cell.classList.contains("timeslot-cell")
                  );

                  if (prevRowEditableCells.length > 0) {
                    prevRowEditableCells[prevRowEditableCells.length - 1].dispatchEvent(new MouseEvent("dblclick"));
                  } else {
                    // No more editable cells, just blur
                    input.blur();
                  }
                } else {
                  // No more rows, just blur
                  input.blur();
                }
              }
            } else {
              // Regular Tab navigation (forward)
              // Try to find the next editable cell in the current row
              if (cellIndex < editableCells.length - 1) {
                // Move to the next cell in the same row
                const nextCell = editableCells[cellIndex + 1];
                nextCell.dispatchEvent(new MouseEvent("dblclick"));
              } else {
                // Try to move to the first editable cell in the next row
                if (currentRowIndex < self.rows.length - 1) {
                  const nextRow = self.rows[currentRowIndex + 1].row;
                  const nextRowEditableCells = Array.from(nextRow.querySelectorAll("td")).filter(
                    (cell) => !cell.classList.contains("timeslot-cell")
                  );

                  if (nextRowEditableCells.length > 0) {
                    nextRowEditableCells[0].dispatchEvent(new MouseEvent("dblclick"));
                  } else {
                    // No more editable cells, just blur
                    input.blur();
                  }
                } else {
                  // No more rows, just blur
                  input.blur();
                }
              }
            }
          }
        });
      });
    });
  }

  // addRowDragAndDropListeners(dataRow) {
  //   let draggedRow = null;
  //   let placeholder = null;
  //   let initialY = 0;
  //   let initialRowTop = 0;

  //   // Créer un élément fantôme pour le drag
  //   const ghost = document.createElement("div");
  //   ghost.className = "absolute bg-blue-100 opacity-50 pointer-events-none";
  //   ghost.style.height = "40px";
  //   ghost.style.width = "100%";
  //   ghost.style.zIndex = "50";
  //   ghost.style.display = "none";
  //   this.container.appendChild(ghost);

  //   dataRow.addEventListener("mousedown", (e) => {
  //     // Ne déclencher que sur la première cellule (pour éviter les conflits avec le drag des timeslots)
  //     if (e.target === dataRow.querySelector("td:first-child")) {
  //       draggedRow = dataRow;
  //       initialY = e.clientY;
  //       initialRowTop = dataRow.getBoundingClientRect().top;

  //       // Créer un placeholder
  //       placeholder = document.createElement("tr");
  //       placeholder.className = "h-[40px] bg-gray-100";
  //       placeholder.style.height = "40px";

  //       // Configurer le fantôme
  //       ghost.style.display = "block";
  //       ghost.style.width = `${dataRow.offsetWidth}px`;
  //       ghost.style.height = `${dataRow.offsetHeight}px`;

  //       // Ajouter les classes de style pour le drag
  //       dataRow.style.position = "relative";
  //       dataRow.style.zIndex = "40";
  //       dataRow.style.opacity = "0.5";
  //     }
  //   });

  //   document.addEventListener("mousemove", (e) => {
  //     if (draggedRow) {
  //       e.preventDefault();

  //       // Mettre à jour la position du fantôme
  //       const deltaY = e.clientY - initialY;
  //       ghost.style.top = `${initialRowTop + deltaY}px`;
  //       ghost.style.left = `${draggedRow.getBoundingClientRect().left}px`;

  //       // Trouver la ligne la plus proche
  //       const rows = Array.from(this.table.querySelectorAll("tr:not(#planning-header-row)"));
  //       const currentRowRect = ghost.getBoundingClientRect();
  //       const currentRowCenter = currentRowRect.top + currentRowRect.height / 2;

  //       let closestRow = null;
  //       let closestDistance = Infinity;

  //       rows.forEach((row) => {
  //         if (row !== draggedRow && row.id !== "tmp-row") {
  //           const rect = row.getBoundingClientRect();
  //           const center = rect.top + rect.height / 2;
  //           const distance = Math.abs(currentRowCenter - center);

  //           if (distance < closestDistance) {
  //             closestDistance = distance;
  //             closestRow = row;
  //           }
  //         }
  //       });

  //       // Déplacer le placeholder
  //       if (closestRow) {
  //         const rect = closestRow.getBoundingClientRect();
  //         if (currentRowCenter < rect.top + rect.height / 2) {
  //           closestRow.parentNode.insertBefore(placeholder, closestRow);
  //         } else {
  //           closestRow.parentNode.insertBefore(placeholder, closestRow.nextSibling);
  //         }
  //       }
  //     }
  //   });

  //   document.addEventListener("mouseup", () => {
  //     if (draggedRow) {
  //       // Réinsérer la ligne à la position du placeholder
  //       if (placeholder && placeholder.parentNode) {
  //         placeholder.parentNode.insertBefore(draggedRow, placeholder);
  //       }

  //       // Réinitialiser les styles
  //       draggedRow.style.position = "";
  //       draggedRow.style.zIndex = "";
  //       draggedRow.style.opacity = "";
  //       ghost.style.display = "none";

  //       // Supprimer le placeholder
  //       if (placeholder && placeholder.parentNode) {
  //         placeholder.parentNode.removeChild(placeholder);
  //       }

  //       // Mettre à jour l'ordre des lignes dans this.rows
  //       const newRows = Array.from(this.table.querySelectorAll("tr:not(#planning-header-row)"))
  //         .filter((row) => row.id === "planning-data-row")
  //         .map((row) => this.rows.find((r) => r.row === row))
  //         .filter(Boolean);

  //       this.rows = newRows;
  //       console.log(this.rows);
  //       this.unsavedChanges = true;

  //       draggedRow = null;
  //       placeholder = null;
  //     }
  //   });
  // }

  async save() {
    // Capture l'aperçu du planning
    const firstTimeslotLabel = this.table.querySelector(".first-timeslot-label");
    firstTimeslotLabel.classList.add("first-timeslot-label-2");
    firstTimeslotLabel.classList.remove("first-timeslot-label");
    const header = this.table.querySelector("#planning-header-row");
    header.classList.remove("sticky");
    const canvas = await html2canvas(this.table, {
      scale: 2, // Pour une meilleure qualité
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });

    // Convertir le canvas en base64
    const previewImage = canvas.toDataURL("image/png");
    const planningData = {
      name: this.name.trim().replace(/\s+/g, "_").replace(/\//g, "-"),
      id: this.id,
      title: this.title,
      columns: this.columns,
      timeSlots: this.timeSlots,
      slotDuration: this.slotDuration,
      preview: previewImage, // Ajout de l'aperçu
      rows: this.rows.map((row) => ({
        columns: row.columns,
        color: row.color,
        schedule: row.schedule,
      })),
    };

    const status = await window.require("electron").ipcRenderer.invoke("save", "planning", planningData);
    firstTimeslotLabel.classList.add("first-timeslot-label");
    firstTimeslotLabel.classList.remove("first-timeslot-label-2");
    header.classList.add("sticky");
    if (status.status === "new file") {
      this.id = status.id;
    }
    this.unsavedChanges = false;
    return status;
  }

  print(logoPath) {
    // Ajouter les logos si nécessaire
    if (logoPath && logoPath.length > 0) {
      // Créer un conteneur pour les logos
      const logosContainer = document.createElement("div");
      logosContainer.id = "logos-planning-container";
      logosContainer.className = "print-planning absolute top-4 left-4 flex gap-2";

      // Ajouter chaque logo au conteneur
      for (const logo of logoPath) {
        const logoElement = document.createElement("img");
        logoElement.src = logo.path;
        logoElement.className = "h-16 object-contain";
        logosContainer.appendChild(logoElement);
      }

      // Ajouter le conteneur de logos au planning
      this.container.appendChild(logosContainer);
    }

    // Imprimer
    // this.container.classList.add("print-only");
    window.print();

    // this.container.classList.remove("print-only");

    // Supprimer les logos après impression
    const logosContainer = document.getElementById("logos-planning-container");
    if (logosContainer) {
      this.container.removeChild(logosContainer);
    }

    if (this.page.id === "print-container") {
      this.page.remove();
    }
  }

  exportPDF(logoPath) {
    // Ajouter les logos si nécessaire
    if (logoPath && logoPath.length > 0) {
      // Créer un conteneur pour les logos
      const logosContainer = document.createElement("div");
      logosContainer.id = "logos-planning-container";
      logosContainer.className = "print-planning absolute top-4 left-4 flex gap-2";

      // Ajouter chaque logo au conteneur
      for (const logo of logoPath) {
        const logoElement = document.createElement("img");
        logoElement.src = logo.path;
        logoElement.className = "h-16 object-contain";
        logosContainer.appendChild(logoElement);
      }

      // Ajouter le conteneur de logos au planning
      this.container.appendChild(logosContainer);
    }
    window
      .require("electron")
      .ipcRenderer.invoke("export-planning-pdf", this.name.trim().replace(/\s+/g, "_").replace(/\//g, "-") + ".pdf")
      .then((response) => {
        // Supprimer les logos après l'export PDF
        const logosContainer = document.getElementById("logos-planning-container");
        if (logosContainer) {
          this.container.removeChild(logosContainer);
        }
        if (this.page.id === "print-container") {
          this.page.remove();
        }
      })
      .catch((error) => {
        console.error("Erreur lors de l'export PDF:", error);
        // Supprimer les logos même en cas d'erreur
        const logosContainer = document.getElementById("logos-planning-container");
        if (logosContainer) {
          this.container.removeChild(logosContainer);
        }
        if (this.page.id === "print-container") {
          this.page.remove();
        }
      });
  }
}
