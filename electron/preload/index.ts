import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    let validChannels = ["login-account", 'lol-matchmaking-accept', 'lol-matchmaking-search', 'lol-wallet', 'lol-backdrop', 'get-champions', 'lol-summoner-profile', 'lol-summoner-ranked'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...omit);
    }
  },
  sendSync(...args: Parameters<typeof ipcRenderer.sendSync>) {
    const [channel, ...omit] = args
    const value = ipcRenderer.sendSync(channel, ...omit)
    return value;
  },

  // You can expose other APTs you need here.
  // ...
});




