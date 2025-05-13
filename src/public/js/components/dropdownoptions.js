// Base class for dropdowns with common functionality
// Base class for dropdowns with common functionality
import { TimeRangeGenerator } from "../tools/timerangegenerator.js";

export class BaseDropdown {
  constructor(id, containerId, purpose = "config", goal = "planning", planningTable) {
    this.id = id;
    this.containerId = containerId;
    this.selectedValue = "";
    this.purpose = purpose;
    this.goal = goal;
  }

  init(page, planningTable, menuContainer) {
    // Get the container where we'll add our dropdown
    this.planningTable = planningTable;
    this.menuContainer = menuContainer;

    const containerElement = page.querySelector(`#${this.containerId}`);

    // Create dropdown container
    this.container = document.createElement("div");
    this.container.id = this.id;
    this.container.className = "relative inline-block";

    // Create dropdown button
    this.button = document.createElement("button");
    this.button.id = `dropdown-selected-${this.getButtonId()}`;
    this.button.type = "button";
    this.button.className = "flex items-center justify-center gap-2 text-blue-600 font-semibold focus:outline-none";

    // Create label span
    this.label = document.createElement("span");
    this.label.id = `dropdown-selected-${this.getButtonId()}-label`;
    this.label.textContent = this.selectedValue;

    // Create dropdown arrow SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "black");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("viewBox", "0 0 24 24");

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", "6 9 12 15 18 9");
    svg.appendChild(polyline);

    // Create options list
    this.optionsList = document.createElement("ul");
    this.optionsList.id = `dropdown-options-${this.getButtonId()}`;
    this.optionsList.className =
      "absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-auto hidden";

    // Assemble the dropdown
    this.button.appendChild(this.label);
    this.button.appendChild(svg);
    this.container.appendChild(this.button);
    this.container.appendChild(this.optionsList);

    // Add to the appropriate container
    containerElement.appendChild(this.container);

    // Add event listener
    this.button.addEventListener("click", () => this.toggle());

    // Add click event listener to close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (!this.container.contains(event.target)) {
        this.close();
      }
    });

    // Generate dropdown options
    if (this.purpose === "config") {
      this.generateOptions();
    }
  }

  getButtonId() {
    // To be overridden by child classes
    return "";
  }

  generateOptions() {
    // To be implemented by child classes
  }

  toggle() {
    this.optionsList.classList.toggle("hidden");

    // Check if dropdown would go off the bottom of the viewport
    if (!this.optionsList.classList.contains("hidden")) {
      const buttonRect = this.button.getBoundingClientRect();
      const dropdownHeight = this.optionsList.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate if there's enough space below
      const spaceBelow = viewportHeight - buttonRect.bottom;

      if (spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight) {
        // Not enough space below, but enough space above - show above
        this.optionsList.classList.add("bottom-[1.5rem]");
      } else {
        // Enough space below or not enough space above - show below
        this.optionsList.classList.remove("bottom-[1.5rem]");
        // this.optionsList.classList.add("mt-1");
      }

      // Scroll to active option if it exists
      const activeOption = this.optionsList.querySelector(".bg-blue-400");
      // if (activeOption) {
      //   setTimeout(() => {
      //     activeOption.scrollIntoView({ block: "center", behavior: "smooth" });
      //   }, 0);
      // }
    }
  }

  close() {
    this.optionsList.classList.add("hidden");
  }

  select(value) {
    if (!this.purpose.includes("planning")) {
      this.selectedValue = value;
      this.label.textContent = value;
      this.optionsList.classList.add("hidden");

      if (this.purpose === "config") {
        this.generateOptions();
        this.menuContainer.updateTimeDropdowns();
        this.menuContainer.updatePlanningTableTimeSlots();
        // this.updatePlanningTable();
      } else if (this.purpose === "row") {
        this.menuContainer.updateEndTimeBasedOnDuration(this.type);
        this.update(value, this.type);
      }
    } else {
      this.selectedValue = value;

      if (this.planningTable.updatePlanningTableTimeSlots(this.type, this.purpose)) {
        setTimeout(() => {
          this.generateOptions();
        }, 0);
        this.label.textContent = value;
      } else {
        this.selectedValue = this.label.textContent;
      }
      this.optionsList.classList.add("hidden");

      setTimeout(() => {
        this.menuContainer.updateTimeDropdowns();
      }, 0);
    }
  }

  update(value, type = null) {
    this.selectedValue = value;
    this.label.textContent = value;
    this.optionsList.classList.add("hidden");

    if (type) {
      let startTime;
      let endTime;
      let timeSlots;
      let slotDuration;
      startTime = parseInt(this.planningTable.timeSlots[0].split("h")[0]);
      endTime = parseInt(this.planningTable.timeSlots[this.planningTable.timeSlots.length - 1].split("h")[0]);
      timeSlots = this.planningTable.timeSlots;
      slotDuration = this.planningTable.slotDuration;

      if (type === "heure-fin") {
        this.generateOptions(startTime, endTime, slotDuration, timeSlots);
      } else if (type === "heure-debut") {
        this.generateOptions(startTime, endTime, slotDuration, timeSlots);
      } else if (type === "duree") {
        this.generateOptions(
          startTime,
          endTime - startTime,
          slotDuration,
          TimeRangeGenerator.generateTimeOptions(
            timeSlots[0],
            timeSlots[this.planningTable.timeSlots.length - 1],
            slotDuration
          )
        );
      }
    } else {
      this.generateOptions(); // Regenerate options to update active state
    }
  }
}
export class TimeDropdown extends BaseDropdown {
  constructor(
    id,
    type,
    minHour,
    maxHour,
    interval = 30,
    purpose = "config",
    timeSlots = null,
    selectedValue = null,
    goal = "planning"
  ) {
    let prefix;
    if (purpose === "planning-context-menu") {
      prefix = "planning-context-menu-";
    } else if (purpose === "planning") {
      prefix = "planning-";
    } else {
      prefix = "";
    }
    super(
      id,
      type === "heure-debut"
        ? `${prefix}start-time-container`
        : type === "duree"
        ? `${prefix}duration-container`
        : `${prefix}end-time-container`,
      purpose,
      goal
    );
    this.type = type;
    this.minHour = minHour;
    this.maxHour = maxHour;
    this.interval = interval; // Interval in minutes (15, 30, or 60)
    // Set default values based on dropdown type
    if (selectedValue) {
      this.selectedValue = selectedValue;
    } else if (timeSlots && timeSlots.length > 0) {
      this.selectedValue =
        this.type === "heure-debut"
          ? timeSlots[0]
          : this.type === "heure-fin"
          ? timeSlots[timeSlots.length - 1]
          : this.type === "duree"
          ? timeSlots[timeSlots.length - 1]
          : null;
    } else {
      this.selectedValue = this.type === "heure-debut" ? "06h00" : this.type === "heure-fin" ? "18h00" : "problème";
    }
    this.timeSlots = timeSlots;
  }

  getButtonId() {
    if (this.purpose === "planning-context-menu") {
      return `planning-context-menu-${this.type}`;
    } else if (this.purpose === "planning") {
      return `planning-${this.type}`;
    } else {
      return this.type;
    }
  }

  init(page, planningTable, menuContainer) {
    super.init(page, planningTable, menuContainer);

    // Add scrollbar with Tailwind classes
    this.optionsList.classList.add(
      "max-h-[200px]",
      "overflow-y-auto",
      "[&::-webkit-scrollbar]:w-1",
      "[&::-webkit-scrollbar-thumb]:bg-blue-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full"
    );
    this.generateOptions(this.minHour, this.maxHour, this.interval, this.timeSlots);
  }

  generateOptions(
    minHour = this.minHour,
    maxHour = this.maxHour,
    interval = this.planningTable.slotDuration,
    options = null
  ) {
    let timeOptions = [];
    this.optionsList.innerHTML = "";

    // Generate all time options first
    if (!options) {
      for (let hour = minHour; hour <= maxHour; hour++) {
        const hourStr = hour.toString().padStart(2, "0");

        // Add options based on interval

        timeOptions.push(`${hourStr}h00`);

        // Add interval-based options
        if (hour !== maxHour) {
          if (interval === 30) {
            timeOptions.push(`${hourStr}h30`);
          }

          if (interval === 15) {
            timeOptions.push(`${hourStr}h15`);
            timeOptions.push(`${hourStr}h30`);
            timeOptions.push(`${hourStr}h45`);
          }

          if (interval === 20) {
            timeOptions.push(`${hourStr}h20`);
            timeOptions.push(`${hourStr}h40`);
          }
        }
      }
      if (this.type === "heure-debut") {
        timeOptions.splice(timeOptions.length - 1, 1);
      }
    } else {
      timeOptions = options;
    }

    // Sort or reverse based on type
    if (this.type === "heure-fin" && this.purpose.includes("planning")) {
      timeOptions.reverse();
    }

    // Generate HTML for each option
    for (const time of timeOptions) {
      const isActive = time === this.selectedValue;
      let isDisabled = false;

      // Check if this is a duration option that would exceed max time
      if (this.type === "duree") {
        let startTime;
        if (this.goal === "planning") {
          startTime = this.menuContainer.timeDropdowns["heure-debut"].selectedValue;
        }

        if (startTime) {
          const [startHour, startMinute] = startTime.split("h").map(Number);
          const [durationHour, durationMinute] = time.split("h").map(Number);

          let endHour = startHour + durationHour;
          let endMinute = startMinute + durationMinute;

          if (endMinute >= 60) {
            endHour += Math.floor(endMinute / 60);
            endMinute %= 60;
          }

          const maxHour = this.planningTable.timeSlots[this.planningTable.timeSlots.length - 1].split("h")[0];
          // Check if resulting end time exceeds max hour
          if (endHour > maxHour || (endHour === maxHour && endMinute > 0)) {
            isDisabled = true;
          }
        }
      }

      if (this.purpose.includes("planning")) {
        // const startTime = window.planningTable.timeSlots[0];
        let baseTime;

        baseTime =
          this.type === "heure-debut"
            ? this.planningTable.timeSlots[this.planningTable.timeSlots.length - 1]
            : this.planningTable.timeSlots[0];

        if (time) {
          const [startHour, startMinute] = time.split("h").map(Number);
          const [baseHour, baseMinute] = baseTime.split("h").map(Number);

          // Check if resulting end time exceeds max hour
          if (this.type === "heure-debut") {
            if (startHour >= baseHour) {
              isDisabled = true;
            }
          } else {
            if (startHour <= baseHour) {
              isDisabled = true;
            }
          }
        }
      }

      const li = document.createElement("li");
      li.className = `flex items-center justify-center py-1 gap-2 ${
        isDisabled ? "text-gray-400 cursor-not-allowed" : "cursor-pointer hover:bg-blue-100"
      } ${isActive ? "bg-blue-400" : ""}`;

      const span = document.createElement("span");
      span.className = "min-w-[38px]";
      span.textContent = time;

      li.appendChild(span);

      // Add event listener to each option only if not disabled
      if (!isDisabled) {
        li.addEventListener("click", () => {
          this.select(time);
        });
      }

      this.optionsList.appendChild(li);
    }
  }
}

export class TimeSlot extends BaseDropdown {
  constructor(id, purpose = "config", goal = "planning") {
    let prefix;
    if (purpose === "planning-context-menu") {
      prefix = "planning-context-menu-";
    } else if (purpose === "planning") {
      prefix = "planning-";
    } else {
      prefix = "";
    }
    super(id, `${prefix}duration-container`, purpose, goal);
    this.durations = ["15min", "20min", "30min", "1h"];
    this.type = "slot-duration";
  }

  getButtonId() {
    return "duree";
  }

  init(page, planningTable, menuContainer) {
    this.selectedValue = `${planningTable.slotDuration}min`;

    super.init(page, planningTable, menuContainer);

    // Add specific class for duration dropdown
    this.label.className = "min-w-[50px]";
    this.generateOptions();
  }

  generateOptions() {
    // Clear existing options
    this.optionsList.innerHTML = "";

    // Create and append each duration option
    this.durations.forEach((duration) => {
      const isActive = duration === this.selectedValue;

      const li = document.createElement("li");
      li.className = `flex items-center justify-center py-1 gap-2 cursor-pointer hover:bg-blue-100 ${
        isActive ? "bg-blue-200" : ""
      }`;

      const span = document.createElement("span");
      span.className = "min-w-[38px]";
      span.textContent = duration;

      li.appendChild(span);
      // Add event listener to each option
      li.addEventListener("click", () => {
        this.select(duration);
      });

      this.optionsList.appendChild(li);
    });
  }
}

export class StyleDropdown extends BaseDropdown {
  constructor(id, containerId, type = null, goal = "planning") {
    super(id, containerId, type, goal);
    this.selectedValue = "Bleu"; // Couleur par défaut
    this.colors = [
      { name: "Bleu", value: "blue-200" },
      { name: "Vert", value: "green-200" },
      { name: "Violet", value: "purple-200" },
      { name: "Orange", value: "orange-200" },
      { name: "Rose", value: "pink-200" },
    ];
  }

  getButtonId() {
    return "style";
  }

  init(page, rowIndex = null, planningTable = null) {
    super.init(page);
    this.rowIndex = rowIndex;
    this.planningTable = planningTable;

    // Add scrollbar with Tailwind classes
    this.optionsList.classList.add(
      "h-fit",
      "overflow-y-auto",
      "[&::-webkit-scrollbar]:w-1",
      "[&::-webkit-scrollbar-thumb]:bg-blue-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full",
      "w-fit",
      "pl-2"
    );

    this.label.className = "w-fit";

    this.button.className = "flex items-center justify-center gap-2  font-semibold focus:outline-none";

    const colorCircle = document.createElement("div");
    colorCircle.className = `w-4 h-4 rounded-2xl bg-${
      this.colors.find((color) => color.name === this.selectedValue).value
    }`;
    colorCircle.id = "color-circle";

    this.button.prepend(colorCircle);
    this.generateOptions();
  }

  generateOptions() {
    this.optionsList.innerHTML = "";

    for (const color of this.colors) {
      const li = document.createElement("li");
      li.className = `flex items-center py-2 px-3 gap-2 cursor-pointer hover:bg-gray-100 ${
        color.name === this.selectedValue ? "bg-gray-50" : ""
      }`;

      // Créer le rond coloré
      const colorCircle = document.createElement("div");
      colorCircle.className = `w-4 h-4 rounded-2xl bg-${color.value}`;

      // Créer le texte du nom de la couleur
      const colorName = document.createElement("span");
      colorName.textContent = color.name;

      // Ajouter les éléments au li
      li.appendChild(colorCircle);
      li.appendChild(colorName);

      // Ajouter l'événement de clic
      li.addEventListener("click", () => {
        this.select(color.name);
      });

      this.optionsList.appendChild(li);
    }
  }

  select(value) {
    this.button.querySelector("#color-circle").remove();
    this.selectedValue = value;
    this.label.textContent = value;
    this.optionsList.classList.add("hidden");
    this.generateOptions(); // Regenerate options to update active state
    const colorCircle = document.createElement("div");
    colorCircle.className = `w-4 h-4 rounded-2xl bg-${this.colors.find((color) => color.name === value).value}`;
    colorCircle.id = "color-circle";

    this.button.prepend(colorCircle);

    if (this.rowIndex !== null) {
      this.planningTable.changeRowColor(this.rowIndex, this.colors.find((color) => color.name === value).value);
      this.planningTable.closeRowContextMenu();
    }
  }
}

export class FileDropdown extends BaseDropdown {
  constructor(id, containerId, purpose = "config", goal = "planning", fileType = "model") {
    super(id, containerId, purpose, goal);
    this.fileType = fileType; // Type of files to load (model, planning, etc.)
    this.files = []; // Will store the list of files
  }

  getButtonId() {
    return this.id.replace("dropdown-", "");
  }

  init(page, planningTable) {
    // Get the container where we'll add our dropdown
    this.planningTable = planningTable;
    const containerElement = page.querySelector(`#${this.containerId}`);

    // Create dropdown container
    this.container = document.createElement("div");
    this.container.id = this.id;
    this.container.className = "relative inline-block";

    // Create dropdown button
    this.button = document.createElement("button");
    this.button.id = `dropdown-selected-${this.getButtonId()}`;
    this.button.type = "button";
    this.button.className =
      "w-[270px] flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400";

    // Create label container
    const labelContainer = document.createElement("span");
    labelContainer.className = "flex items-center gap-2";

    // Create icon
    this.icon = document.createElement("img");
    this.icon.src = "../public/images/null.svg";
    this.icon.alt = "Aucun";
    this.icon.className = "w-5 h-5";
    this.icon.id = `dropdown-selected-${this.getButtonId()}-icon`;

    // Create label span
    this.label = document.createElement("span");
    this.label.id = `dropdown-selected-${this.getButtonId()}-label`;
    this.label.textContent = "Aucun";

    // Create dropdown arrow SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("viewBox", "0 0 24 24");

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", "6 9 12 15 18 9");
    svg.appendChild(polyline);

    // Create options list
    this.optionsList = document.createElement("ul");
    this.optionsList.id = `dropdown-options-${this.getButtonId()}`;
    this.optionsList.className =
      "absolute left-0 w-[270px] bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-auto hidden";
    this.optionsList.classList.add(
      "[&::-webkit-scrollbar]:w-1",
      "[&::-webkit-scrollbar-thumb]:bg-blue-600",
      "[&::-webkit-scrollbar-thumb]:rounded-full"
    );
    this.optionsList.tabIndex = "-1";
    this.optionsList.role = "listbox";

    // Assemble the dropdown
    labelContainer.appendChild(this.icon);
    labelContainer.appendChild(this.label);
    this.button.appendChild(labelContainer);
    this.button.appendChild(svg);
    this.container.appendChild(this.button);
    this.container.appendChild(this.optionsList);

    // Add to the appropriate container
    containerElement.appendChild(this.container);

    // Add event listener
    this.button.addEventListener("click", () => this.toggle());

    // Add click event listener to close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (!this.container.contains(event.target)) {
        this.close();
      }
    });

    // Load files and generate options
    this.loadFiles();
  }

  toggle() {
    if (this.optionsList.classList.contains("hidden")) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    this.optionsList.classList.remove("hidden");
    // this.generateOptions();
  }

  close() {
    this.optionsList.classList.add("hidden");
  }

  loadFiles() {
    // Use IPC to request file list from main process
    window.require("electron").ipcRenderer.send("get-files", this.fileType);

    // Listen for the response
    window.require("electron").ipcRenderer.once("files-list", (event, files) => {
      this.files = files;
      this.generateOptions();
    });
  }

  generateOptions() {
    // Clear existing options
    this.optionsList.innerHTML = "";

    // Add "None" option
    const noneOption = document.createElement("li");
    noneOption.className = "flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-100";
    noneOption.dataset.value = "aucun";
    noneOption.role = "option";
    noneOption.id = "option-aucun";
    noneOption.innerHTML = `
      <img src="../public/images/null.svg" alt="Aucun" class="w-5 h-5" />
      <span>Aucun</span>
    `;
    noneOption.addEventListener("click", () => {
      this.select("aucun", "Aucun", "../public/images/null.svg");
    });
    this.optionsList.appendChild(noneOption);

    // Add file options
    this.files.forEach((file) => {
      const option = document.createElement("li");
      option.className = "flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-100";
      option.dataset.value = file.id;
      option.role = "option";
      option.id = `option-${file.id}`;
      option.innerHTML = `
        <img src="../public/images/template.svg" alt="${file.name}" class="w-5 h-5" />
        <span>${file.name.replace(/_/g, " ").replace(/-/g, "/")}</span>
      `;
      option.addEventListener("click", () => {
        this.select(file.name, file.name.replace(/_/g, " ").replace(/-/g, "/"), "../public/images/template.svg");
      });
      this.optionsList.appendChild(option);
    });
  }

  select(value, label, iconSrc) {
    this.selectedValue = value;
    this.label.textContent = label;
    this.icon.src = iconSrc;
    this.icon.alt = label;
    this.optionsList.classList.add("hidden");

    // If not "None" option, load the file content
    if (value === "aucun") {
      this.planningTable.firstSection.loadModel(null);
    } else {
      this.loadFileContent(value);
    }
  }

  loadFileContent(fileId) {
    // Use IPC to request file content from main process
    window.require("electron").ipcRenderer.send("get-file-content", { fileType: this.fileType, fileName: fileId });

    // Listen for the response
    window.require("electron").ipcRenderer.once("file-content", (event, content) => {
      // Process the file content
      this.planningTable.firstSection.loadModel(content);
    });
  }
}
