const { promisify } = require("util");
const { resolve } = require("path");
const fs = require("fs");
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const getFiles = async (dir) => {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );
  return files.reduce((a, f) => a.concat(f), []);
};

const makeDir = async (fileName) => {
  var lastSlash = fileName.lastIndexOf("/");
  var folderPath = lastSlash == -1 ? fileName : fileName.substr(0, lastSlash);
  if (!fs.existsSync(__dirname + "/" + folderPath)) {
    await mkdir(__dirname + "/" + folderPath, { recursive: true });
  }
};

module.exports = { getFiles, makeDir };
