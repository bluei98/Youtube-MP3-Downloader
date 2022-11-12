const { app, BrowserWindow, ipcMain, nativeTheme, ipcRenderer, dialog } = require('electron');
const path = require('path');

var isDev = false;
if(__dirname.includes('app.asar')) {
    var _path_base = "./"
}
else {
    require('electron-reload')(__dirname);
    var _path_base = "./";
    isDev = true;
}

nativeTheme.themeSource = 'dark';

function createWindow() {
    const win  = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'icon.png'),
        resizable: false,
        // // frame: false,
        title: 'Youtube MP3 Downloader',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    win.removeMenu();
    if(isDev) win.webContents.toggleDevTools();
    win.loadFile(path.join(__dirname, 'resources/frontend/index.html'));

    ipcMain.handle('dark-mode:toggle', () => {
        if (nativeTheme.shouldUseDarkColors) {
            nativeTheme.themeSource = 'light'
        } else {
            nativeTheme.themeSource = 'dark'
        }
        
        return nativeTheme.shouldUseDarkColors
    });

    ipcMain.handle('dark-mode:system', () => {
        nativeTheme.themeSource = 'system'
    });
}

app.once('ready-to-show', () => {
    win.maximize()
})

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('selectFile', (event, json) => {
    var path = dialog.showOpenDialogSync({
        // properties: ['openDirectory']
    });
    if(typeof(path) == "undefined") var path = false;
    else var path = path[0];  

    event.returnValue = path;
});

ipcMain.on('selectFolder', (event, json) => {
    var path = dialog.showOpenDialogSync({
        properties: ['openDirectory']
    });
    if(typeof(path) == "undefined") var path = false;
    else var path = path[0];  

    event.returnValue = path;
});