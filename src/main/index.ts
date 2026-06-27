import { watch, type FSWatcher } from 'chokidar';
import { app, BrowserWindow, ipcMain, net, protocol, shell } from 'electron';
import { readFile, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { MarkdownDocumentState } from '../shared/markdown';

protocol.registerSchemesAsPrivileged([
  {
    privileges: {
      corsEnabled: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
    scheme: 'mdview-asset',
  },
]);

const targetFilePath = process.env.MDVIEW_FILE ? resolve(process.env.MDVIEW_FILE) : null;

if (!targetFilePath) {
  console.error('Usage: mdview <file.md>');
  process.exit(1);
}

const targetDirectoryPath = dirname(targetFilePath);

let latestDocument: MarkdownDocumentState | null = null;
let mainWindow: BrowserWindow | null = null;
let readSerial = 0;
let watcher: FSWatcher | null = null;

const readMarkdownDocument = async (filePath: string): Promise<MarkdownDocumentState> => {
  try {
    const [fileStat, markdown] = await Promise.all([stat(filePath), readFile(filePath, 'utf8')]);

    return {
      byteLength: fileStat.size,
      fileName: basename(filePath),
      filePath,
      markdown,
      status: 'ready',
      updatedAt: new Date(fileStat.mtimeMs).toISOString(),
    };
  } catch (error) {
    return {
      fileName: basename(filePath),
      filePath,
      message: error instanceof Error ? error.message : String(error),
      status: 'error',
      updatedAt: new Date().toISOString(),
    };
  }
};

const publishDocumentUpdate = async () => {
  const currentReadSerial = ++readSerial;
  const document = await readMarkdownDocument(targetFilePath);

  if (currentReadSerial !== readSerial) {
    return;
  }

  latestDocument = document;
  mainWindow?.setTitle(`mdview - ${document.fileName}`);
  mainWindow?.webContents.send('markdown:changed', document);
};

const isWithinTargetDirectory = (filePath: string) => {
  const relativePath = relative(targetDirectoryPath, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
};

const registerAssetProtocol = () => {
  protocol.handle('mdview-asset', async (request) => {
    const requestUrl = new URL(request.url);
    const relativeAssetPath = decodeURIComponent(requestUrl.pathname.slice(1));
    const assetPath = resolve(targetDirectoryPath, relativeAssetPath);

    if (!relativeAssetPath || !isWithinTargetDirectory(assetPath)) {
      return new Response('Not found', { status: 404 });
    }

    return net.fetch(pathToFileURL(assetPath).toString());
  });
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#f8fafc',
    height: 820,
    minHeight: 460,
    minWidth: 560,
    show: false,
    title: `mdview - ${basename(targetFilePath)}`,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
    width: 1080,
  });

  mainWindow.setMenu(null);
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow?.webContents.getURL();

    if (currentUrl && url !== currentUrl) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
};

const startFileWatcher = () => {
  watcher = watch(targetFilePath, {
    awaitWriteFinish: {
      pollInterval: 25,
      stabilityThreshold: 100,
    },
    ignoreInitial: true,
  });

  watcher.on('add', publishDocumentUpdate);
  watcher.on('change', publishDocumentUpdate);
  watcher.on('unlink', publishDocumentUpdate);
  watcher.on('error', (error) => {
    latestDocument = {
      fileName: basename(targetFilePath),
      filePath: targetFilePath,
      message: error instanceof Error ? error.message : String(error),
      status: 'error',
      updatedAt: new Date().toISOString(),
    };
    mainWindow?.webContents.send('markdown:changed', latestDocument);
  });
};

ipcMain.handle('markdown:get-initial', async () => {
  latestDocument ??= await readMarkdownDocument(targetFilePath);
  return latestDocument;
});

app.whenReady().then(async () => {
  registerAssetProtocol();
  await createWindow();
  await publishDocumentUpdate();
  startFileWatcher();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

app.on('before-quit', () => {
  void watcher?.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
