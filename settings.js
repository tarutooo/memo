const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let settingsPath = null;
let data = {
  autoLaunch: false
};

function init() {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf8');
      data = Object.assign(data, JSON.parse(raw));
    } else {
      save();
    }
  } catch (e) {
    console.warn('settings init failed:', e.message);
  }
}

function save() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('settings save failed:', e.message);
  }
}

function get(key) {
  return data[key];
}

function set(key, val) {
  data[key] = val;
  save();
}

module.exports = { init, get, set };
