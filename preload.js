// preload.js - 必要なら将来的に安全な IPC をここで公開します
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 今は空。将来的にファイル保存などのネイティブ機能をここで公開できます。
});
