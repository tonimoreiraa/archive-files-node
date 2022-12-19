const fs = require('fs');
const path = require('path');
const { readdir } = require('fs').promises

require('dotenv').config()

const {BASE_PATH: RAW_BASE_PATH, EXPORT_PATH: RAW_EXPORT_PATH, DATE, MODE, OVERRIDE} = process.env

fs.mkdirSync(RAW_EXPORT_PATH, {recursive: true})

const BASE_PATH = fs.realpathSync(RAW_BASE_PATH)
const EXPORT_PATH = fs.realpathSync(RAW_EXPORT_PATH)

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}


(async () => {
    const date = new Date(DATE)
    const files = (await getFiles(BASE_PATH))
    const exportFiles = files
    .map(path => ({path, ...fs.statSync(path)}))
    .filter(file => file.ctime <= date)

    for (const file of exportFiles) {
        const filePath = file.path.replace(BASE_PATH, EXPORT_PATH)
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises[MODE.toLowerCase() + 'File'](file.path, filePath)
    }
})()