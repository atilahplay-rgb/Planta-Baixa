const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  save: (name, data) => ipcRenderer.invoke('save', name, data),
  pdf: (png) => ipcRenderer.invoke('pdf', png)
});
