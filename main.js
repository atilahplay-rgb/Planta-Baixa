const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
let win;

function create() {
  win = new BrowserWindow({
    width: 1280, height: 800, title: 'Planta Baixa', backgroundColor: '#14201f',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());

async function askPath(name) {
  const ext = path.extname(name).slice(1);
  const r = await dialog.showSaveDialog(win, { defaultPath: name, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return r.canceled ? null : r.filePath;
}

ipcMain.handle('save', async (e, name, data) => {
  const file = await askPath(name);
  if (!file) throw new Error('declined');
  fs.writeFileSync(file, typeof data === 'string' ? data : Buffer.from(data));
  return { status: 'saved' };
});

ipcMain.handle('pdf', async (e, png) => {
  const file = await askPath('planta-baixa.pdf');
  if (!file) throw new Error('declined');
  const b64 = Buffer.from(png).toString('base64');
  const html = '<style>@page{size:A4 landscape;margin:10mm}body{margin:0}img{width:100%;max-height:185mm;object-fit:contain}</style><img src="data:image/png;base64,' + b64 + '">';
  const w = new BrowserWindow({ show: false });
  await w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  const pdf = await w.webContents.printToPDF({ landscape: true, pageSize: 'A4', printBackground: true });
  w.destroy();
  fs.writeFileSync(file, pdf);
  return { status: 'saved' };
});
