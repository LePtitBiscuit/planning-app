const { ipcMain, app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Ajoute ceci tout en haut de main.js
try {
  require("electron-reload")(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`),
  });
} catch (_) {}

// Désactiver le cache GPU
app.disableHardwareAcceleration();

// Configurer le cache
app.commandLine.appendSwitch("disable-gpu-cache");
app.commandLine.appendSwitch("disable-software-rasterizer");

let mainWindow;
let splashScreen;

function createSplashScreen() {
  splashScreen = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  splashScreen.loadFile("src/views/splash.html");
  splashScreen.center();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    autoHideMenuBar: true,
    frame: true,
  });

  mainWindow.setMenu(null);

  mainWindow.loadFile("src/views/index.html");
  //   mainWindow.webContents.openDevTools();

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Écouter l'événement app-loaded depuis le renderer
  ipcMain.once("app-loaded", () => {
    // Fermer l'écran de démarrage
    if (splashScreen) {
      splashScreen.destroy();
    }
    // Afficher la fenêtre principale
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createSplashScreen();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashScreen();
    createWindow();
  }
});

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function getFileContent(fileType, fileName) {
  let fileNameWithoutExt = path.basename(fileName, ".json");
  try {
    const userData = app.getPath("userData");
    const dir = path.join(userData, fileType === "planning" ? "plannings" : "models");
    const filePath = path.join(dir, `${fileNameWithoutExt}.json`);

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileContent);
    } else {
      console.error(`File noooott found: ${filePath}`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return null;
  }
}

function getFileContentById(fileType, id) {
  try {
    const userData = app.getPath("userData");
    const dir = path.join(userData, fileType === "planning" ? "plannings" : "models");

    // Ensure directory exists
    ensureDirExists(dir);

    // Read all files in the directory
    const files = fs.readdirSync(dir);

    // Iterate through each file to find matching ID
    for (const file of files) {
      const filePath = path.join(dir, file);

      try {
        const content = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(content);

        if (data?.id === id) {
          return data;
        }
      } catch (err) {
        console.error(`Error reading or parsing file ${file}: ${err.message}`);
        // Continue to next file
      }
    }

    console.error(`No file found with ID: ${id}`);
    return null;
  } catch (error) {
    console.error(`Error searching for file by ID: ${error.message}`);
    return null;
  }
}

ipcMain.handle("save", async (event, type, planningData) => {
  const userData = app.getPath("userData");
  const dir = path.join(userData, type === "planning" ? "plannings" : "models");
  ensureDirExists(dir);
  let filePath = path.join(dir, `${planningData.name}.json`);
  if (!planningData.id) {
    planningData.id = Date.now().toString();

    if (fs.existsSync(filePath)) {
      let i = 1;
      let newFilePath;
      let filePathWithoutExt = filePath.replace(".json", "");

      do {
        newFilePath = `${filePathWithoutExt}(${i}).json`;
        i++;
      } while (fs.existsSync(newFilePath));

      planningData.name = path.basename(newFilePath, ".json");
      fs.writeFileSync(newFilePath, JSON.stringify(planningData, null, 2), "utf8");
      return { status: "new file renamed", id: planningData.id };
    } else {
      fs.writeFileSync(filePath, JSON.stringify(planningData, null, 2), "utf8");
      return { status: "new file", id: planningData.id };
    }
  } else if (
    getFileContent(type, filePath)?.id === planningData.id &&
    getFileContent(type, filePath)?.name === planningData.name
  ) {
    fs.writeFileSync(filePath, JSON.stringify(planningData, null, 2), "utf8");
    return { status: "edited file", id: planningData.id };
  } else if (fs.existsSync(filePath)) {
    let i = 1;
    let newFilePath;
    let filePathWithoutExt = filePath.replace(".json", "");

    do {
      newFilePath = `${filePathWithoutExt}(${i}).json`;
      i++;
    } while (fs.existsSync(newFilePath));
    const oldFilePath = getFileContentById(type, planningData.id)?.name;
    planningData.name = path.basename(newFilePath, ".json");

    fs.writeFileSync(path.join(dir, `${oldFilePath}.json`), JSON.stringify(planningData, null, 2), "utf8");
    fs.renameSync(path.join(dir, `${oldFilePath}.json`), newFilePath);
    return { status: "renamed file", id: planningData.id };
  } else {
    // Find the existing file with the matching ID and update it
    const existingFilePath = getFileContentById(type, planningData.id)?.name;

    if (existingFilePath && existingFilePath !== path.basename(filePath)) {
      // Update the content in the existing file
      fs.writeFileSync(path.join(dir, `${existingFilePath}.json`), JSON.stringify(planningData, null, 2), "utf8");
      // Rename the file if the name has changed
      fs.renameSync(path.join(dir, `${existingFilePath}.json`), filePath);
      return { status: "edited and renamed file", id: planningData.id };
    }

    return { status: "cacao", id: planningData.id };
  }
});

ipcMain.handle("export-planning-pdf", async (event, defaultPath = "planning.pdf") => {
  const win = event.sender.getOwnerBrowserWindow();

  // Demande à l'utilisateur où sauvegarder le PDF
  const { filePath } = await dialog.showSaveDialog(win, {
    title: "Enregistrer le planning en PDF",
    defaultPath: defaultPath,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (!filePath) return { success: false, message: "Opération annulée" }; // Annulé

  try {
    // Génère le PDF
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      landscape: true,
      pageSize: "A4",
    });

    // Sauvegarde le PDF
    fs.writeFileSync(filePath, pdfData);

    // Renvoie une réponse de succès
    return { success: true, filePath, message: "PDF enregistré avec succès" };
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    return { success: false, message: `Erreur: ${error.message}` };
  }
});

// Get files list for dropdown
ipcMain.on("get-files", (event, fileType) => {
  const userData = app.getPath("userData");
  const dirPath = path.join(userData, fileType === "planning" ? "plannings" : "models");

  try {
    // Ensure directory exists
    ensureDirExists(dirPath);

    // Read directory and get file list
    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const fileName = path.basename(file, ".json");
        const filePath = path.join(dirPath, file);
        const id = getFileContent(fileType, fileName).id;
        const name = fileName; // Using filename as display name
        const stats = fs.statSync(filePath);

        // Read file content to get preview
        let preview = null;
        try {
          const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
          preview = content.preview || null;
        } catch (err) {
          console.error(`Error reading preview from ${filePath}:`, err);
        }

        return {
          id,
          fileName,
          name,
          preview,
          createdAt: stats.birthtime, // Date de création
          modifiedAt: stats.mtime || new Date(), // Date de dernière modification avec fallback
        };
      })
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt)); // Tri par date de modification (plus récent d'abord)

    event.reply("files-list", files);
  } catch (error) {
    console.error(`Error reading ${fileType} files:`, error);
    event.reply("files-list", []);
  }
});

// Get file content for selected file
ipcMain.on("get-file-content", (event, { fileType, fileName }) => {
  const userData = app.getPath("userData");
  const dirPath = path.join(userData, fileType === "planning" ? "plannings" : "models");
  ensureDirExists(dirPath);

  try {
    const filePath = path.join(dirPath, `${fileName}.json`);

    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
      event.reply("file-content", content);
    } else {
      console.error(`File not found: ${filePath}`);
      event.reply("file-content", null);
    }
  } catch (error) {
    console.error(`Error reading file content:`, error);
    event.reply("file-content", null);
  }
});

// Rename planning file
ipcMain.on("rename-file", (event, fileType, fileName, newName) => {
  const userData = app.getPath("userData");
  const dirPath = path.join(userData, fileType === "planning" ? "plannings" : "models");
  ensureDirExists(dirPath);

  try {
    const oldFilePath = path.join(dirPath, `${fileName}.json`);
    let newFilePath = path.join(dirPath, `${newName}.json`);

    // Check if the file exists
    if (fs.existsSync(oldFilePath)) {
      if (fs.existsSync(newFilePath)) {
        let i = 1;
        let renewFilePath;
        let filePathWithoutExt = newFilePath.replace(".json", "");

        do {
          renewFilePath = `${filePathWithoutExt}(${i}).json`;
          i++;
        } while (fs.existsSync(renewFilePath));
        newFilePath = renewFilePath;
      }
      // Use fs.renameSync to preserve file metadata (creation date, modification date)
      const content = getFileContent(fileType, fileName);
      content.name = path.basename(newFilePath, ".json");
      fs.writeFileSync(oldFilePath, JSON.stringify(content, null, 2), "utf8");
      fs.renameSync(oldFilePath, newFilePath);

      event.reply("rename-planning-success", { oldName: fileName, newName: newName });
    } else {
      console.error(`File not found: ${oldFilePath}`);
      event.reply("rename-planning-error", "File not found");
    }
  } catch (error) {
    console.error(`Error renaming planning file:`, error);
    event.reply("rename-planning-error", error.message);
  }
});

ipcMain.on("delete-file", (event, fileType, fileName) => {
  const userData = app.getPath("userData");
  const dirPath = path.join(userData, fileType === "planning" ? "plannings" : "models");
  ensureDirExists(dirPath);

  const filePath = path.join(dirPath, `${fileName}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    event.reply("file-deleted", true);
  } else {
    event.reply("file-deleted", false);
  }
});

// Function to handle adding a logo
ipcMain.handle("add-logo", async (event) => {
  try {
    const userData = app.getPath("userData");
    const logosDir = path.join(userData, "logos");
    ensureDirExists(logosDir);

    // Open a file dialog to select an image file
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "svg"] }],
      title: "Sélectionner un logo",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: "Sélection annulée" };
    }

    const logoPath = result.filePaths[0];
    const fileName = path.basename(logoPath);
    const destPath = path.join(logosDir, fileName);

    // Copy the selected logo file to the logos directory
    fs.copyFileSync(logoPath, destPath);

    return { success: true, path: destPath };
  } catch (error) {
    console.error("Error adding logo:", error);
    return { success: false, error: error.message };
  }
});

// Function to get all logos
ipcMain.handle("get-logos", async (event) => {
  try {
    const userData = app.getPath("userData");
    const logosDir = path.join(userData, "logos");
    ensureDirExists(logosDir);

    // Read all files in the logos directory
    const files = fs.readdirSync(logosDir);

    // Filter for image files, get stats, and create full paths
    const logoFiles = files
      .filter((file) => /\.(jpg|jpeg|png|gif|svg)$/i.test(file))
      .map((file) => {
        const filePath = path.join(logosDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          createdAt: stats.birthtime,
        };
      })
      // Sort by creation date (oldest first)
      .sort((a, b) => a.createdAt - b.createdAt);

    return { success: true, logos: logoFiles };
  } catch (error) {
    console.error("Error getting logos:", error);
    return { success: false, error: error.message };
  }
});

// Function to delete a logo
ipcMain.handle("delete-logo", async (event, logoPath) => {
  try {
    // Check if the file exists
    if (!fs.existsSync(logoPath)) {
      return { success: false, error: "Le fichier n'existe pas" };
    }

    // Delete the file
    fs.unlinkSync(logoPath);

    return { success: true, message: "Logo supprimé avec succès" };
  } catch (error) {
    console.error("Error deleting logo:", error);
    return { success: false, error: error.message };
  }
});
