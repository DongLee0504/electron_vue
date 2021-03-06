import {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  Tray,
  Menu,
  powerMonitor,
  powerSaveBlocker,
  Notification,
  nativeImage
} from "electron";
import { autoUpdater } from "electron-updater";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
  global.__static = require("path")
    .join(__dirname, "/static")
    .replace(/\\/g, "\\\\");
}

let mainWindow;
let browserView;
let forceQuit = false; // 是否强制退出
const trayMenu = Menu.buildFromTemplate([
  {
    label: "退出",
    click: function() {
      forceQuit = true;
      app.quit();
    },
  },
]);
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`;

const previewIcon =
  process.env.NODE_ENV === "development"
    ? "static/icons/256x256.png"
    : `${global.__static}/icons/256x256.png`;
function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
  });

  mainWindow.loadURL(winURL);

  mainWindow.webContents.openDevTools();

  mainWindow.on("close", (e) => {
    if (forceQuit) return;
    e.preventDefault();
    // macOS全屏的处理
    if (mainWindow.isFullScreen()) {
      mainWindow.once("leave-full-screen", () => {
        mainWindow.hide();
      });
      mainWindow.setFullScreen(false);
    } else {
      mainWindow.hide(); // 隐藏窗口
    }
  });

  // 如果是windows系统模拟托盘菜单
  if (process.platform === "win32") {
    global.tray = new Tray(previewIcon);
    global.tray.setToolTip("robotpcclient"); // 鼠标悬停托盘显示的文字
    global.tray.setContextMenu(trayMenu); // 鼠标右键点击托盘菜单
    global.tray.on("double-click", () => {
      // 双击唤起
      mainWindow.show();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 休眠与唤醒
  powerMonitor.on("suspend", () => {
    console.log("The system is going to sleep");
  });
  powerMonitor.on("resume", () => {
    console.log("The system is going to awake");
  });

  // 阻止休眠
  var id = powerSaveBlocker.start("prevent-display-sleep");
  powerSaveBlocker.stop(id);

  // 打开嵌入的网页
  ipcMain.on("openVier", (e, data) => {
    browserView = new BrowserView();
    mainWindow.setBrowserView(browserView);
    browserView.setBounds({ x: 0, y: 0, width: 1000, height: 563 });
    browserView.webContents.loadURL(data.url);
  });
  ipcMain.on("pushNotify", (e, data) => {
    console.log(Notification.isSupported())
    new Notification(data.title, data.option);
  });

  // 显示气泡
  ipcMain.on('displayBalloon', (e, option) => {
    option.icon = previewIcon
    global.tray.displayBalloon(option)
  })

  handleUpdate();
}
function handleUpdate() {
  const message = {
    error: { status: -1, msg: "检测更新查询异常" },
    checking: { status: 0, msg: "正在检查应用程序更新" },
    updateAva: { status: 1, msg: "检测到新版本，正在下载,请稍后" },
    updateNotAva: { status: -1, msg: "您现在使用的版本为最新版本,无需更新!" },
  };
  //检查中
  autoUpdater.on("error", function(error) {
    sendUpdateMessage(message.error);
  });
  autoUpdater.on("checking-for-update", function() {
    sendUpdateMessage(message.checking);
  });
  autoUpdater.on("update-available", function(info) {
    sendUpdateMessage(message.updateAva);
  });
  autoUpdater.on("update-not-available", function(info) {
    sendUpdateMessage(message.updateNotAva);
  });
  // 更新下载进度事件
  autoUpdater.on("download-progress", function(progressObj) {
    mainWindow.webContents.send("downloadProgress", progressObj);
  });
  // 下载完成
  autoUpdater.on("update-downloaded", function() {
    autoUpdater.quitAndInstall();
  });
  ipcMain.on("checkUpdate", (event, data) => {
    autoUpdater.checkForUpdates();
  });
}

function sendUpdateMessage(text) {
  mainWindow.webContents.send("message", text);
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
