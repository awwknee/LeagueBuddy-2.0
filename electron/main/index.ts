import { app, BrowserWindow, shell, ipcMain } from "electron";
import { release } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";
import fetch from "node-fetch";
import { request } from 'undici'

import {
  Credentials,
  EventResponse,
  LeagueWebSocket,
  authenticate,
  createHttp1Request,
  createWebSocketConnection,
} from "league-connect";

import pkg from "electron-updater";
const { autoUpdater } = pkg;

import AccountsManager from "../../src/shared/AccountSingleton";
import Account from "../../src/shared/Account";
import Manager from "../../src/shared/lcu/Manager";
import Client from "../../src/shared/lcu/Client";

globalThis.__filename = fileURLToPath(import.meta.url);
globalThis.__dirname = dirname(__filename);

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.mjs");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    minWidth: 1312,
    minHeight: 738,
    title: "LeagueBuddy",
    autoHideMenuBar: true,
    icon: join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  win.on("ready-to-show", () => {
    if (!process.env.VITE_DEV_SERVER_URL) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    //win.loadURL('https://www.op.gg');
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml);
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow);

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

let accounts: AccountsManager;
ipcMain.on("get-accounts", (event) => {
  if (accounts == null) {
    accounts = new AccountsManager(app.getPath("documents"));
  }
  event.returnValue = accounts.load();
});

ipcMain.on("save-account", (event, accs: string) => {
  accounts.save(accs);
  event.returnValue = "";
});

ipcMain.handle("get-champions", async () => {
  const response = await fetch(
    "https://ddragon.leagueoflegends.com/cdn/14.6.1/data/en_US/champion.json"
  );
  return await response.json();
});

let manager: Manager;
let wsClient: LeagueWebSocket;
let credentials: Credentials;
ipcMain.handle("login-account", async (event, info: string) => {
  if (manager == null) {
    manager = new Manager();
  }

  const acc: Account = JSON.parse(info);
  const client = await manager.create(acc.username, acc.password);
  const bool = await client.login();

  wsClient = await createWebSocketConnection({
    authenticationOptions: {
      awaitConnection: true,
    },
  });

  credentials = await authenticate();
  win?.webContents.send("lol-client-open");

  attachListeners(wsClient);

  return bool;
});

function attachListeners(wsClient: LeagueWebSocket) {
  wsClient.subscribe("/lol-login/v1/session", (data, event) =>
    win?.webContents.send("lol-login-session", data, event)
  );
  wsClient.subscribe("/lol-summoner/v1/current-summoner", (data, event) =>
    win?.webContents.send("lol-current-summoner", data, event)
  );
  wsClient.subscribe("/lol-matchmaking/v1/search", (data, event) =>
    win?.webContents.send("lol-matchmaking-search", data, event)
  );
  wsClient.subscribe("/lol-store/v1/store-ready", (data, event) =>
    win?.webContents.send("lol-store-wallet", data, event)
  );
  wsClient.subscribe(
    "/lol-summoner/v1/current-summoner/summoner-profile",
    (data, event) =>
      win?.webContents.send("lol-current-summoner-profile", data, event)
  );

  wsClient.on("message", (message: string) => {
    const json = JSON.parse(message);
    const [res]: [EventResponse] = json.slice(2);
    //if (res.uri.startsWith('/lol-collections/v1/inventories/')) {
    //console.log(res.uri);
    //}
  });
}

ipcMain.handle("lol-matchmaking-accept", async () => {
  if (wsClient && credentials) {
    const response = await createHttp1Request(
      { method: "POST", url: "/lol-matchmaking/v1/ready-check/accept" },
      credentials
    );
    return response.ok;
  }
});

let opgg: string;
ipcMain.handle("opgg-build-id", async (event) => {
  if (opgg == null) {

    let response = await request('https://www.op.gg/', { headers: {
      "Content-Type": 'text/html',
      "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.129 Electron/29.1.4 Safari/537.36',
      "Accept-Language": "en-US,en;q=0.9"
    }});

    if (response.statusCode != 200) {
      if (response.headers['set-cookie']) {
        const cookie = response.headers['set-cookie'][0];
        response = await request('https://www.op.gg/', { headers: {
          "Content-Type": 'text/html',
          "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.129 Electron/29.1.4 Safari/537.36',
          "Accept-Language": "en-US,en;q=0.9",
          "cookie": cookie
        }});
      }
    }

    console.log(response);
    const html = await response.body.text();
    console.log(html);
    const buildIndex = html.indexOf('buildId":"');
    const endIndex = html.indexOf('",', buildIndex);
    opgg = html.substring(buildIndex + 10, endIndex);
  }
  return opgg;
});

ipcMain.handle("opgg-fetch-data", async (event, url: string) => {
  const response = await request(url);
  const data: any = await response.body.json();
  return data.pageProps.summoners;
});

ipcMain.handle("lol-wallet", async () => {
  if (credentials) {
    const response = await createHttp1Request(
      {
        method: "GET",
        url: `/lol-inventory/v1/wallet?currencyTypes=[%22RP%22,%22lol_blue_essence%22]`,
      },
      credentials
    );
    if (response.ok) {
      return await response.json();
    }
  }
});

ipcMain.handle("lol-backdrop", async (_, id) => {
  if (credentials) {
    const response = await createHttp1Request(
      { method: "GET", url: `/lol-collections/v1/inventories/${id}/backdrop` },
      credentials
    );
    if (response.ok) {
      return await response.json();
    } else {
      console.log(response);
    }
  }
});


ipcMain.handle('lol-summoner-profile', async(_, id) => {
  if (credentials) {
    const response = await createHttp1Request(
      { method: "GET", url: '/lol-summoner/v1/summoners/' + id },
      credentials
    );
    if (response.ok) {
      return await response.json();
    } else {
      console.log(response);
    }
  }
});

ipcMain.handle('lol-summoner-ranked', async(_, id) => {
  if (credentials) {
    const response = await createHttp1Request(
      { method: "GET", url: '/lol-ranked/v1/ranked-stats/' + id },
      credentials
    );
    if (response.ok) {
      return await response.json();
    } else {
      console.log(response);
    }
  }
});

autoUpdater.on("update-available", () => {
  win?.webContents.send("update-available");
});

autoUpdater.on("update-downloaded", () => {
  win?.webContents.send("update-downloaded");
});
