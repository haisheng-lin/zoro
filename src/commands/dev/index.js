const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

const { ZORO_JSON_FILENAME } = require('../../constants');
const { currentPath } = require('../../paths');
const log = require('../../utils/log');
const getPluginPath = require('../../tools/getPluginPath');
const checkAndResolveZoroJSON = require('../../tools/checkAndResolveZoroJSON');
const { installPackageSync } = require('../../tools/installPackage');

const dev = async () => {
  try {
    const resolvedZoroJSON = checkAndResolveZoroJSON();

    const pluginName = resolvedZoroJSON.plugin;
    const pluginPath = getPluginPath(pluginName);

    if (!fs.existsSync(pluginPath)) {
      throw new Error(`cannot find ${pluginName}, maybe try to install`);
    }

    const existNodeModules = fs.existsSync(
      path.resolve(pluginPath, 'node_modules')
    );
    const packageType = resolvedZoroJSON.package;
    if (!existNodeModules) {
      log.info(`[PKG] ${packageType} is installing packages`);
      installPackageSync(packageType, { cwd: pluginPath, stdio: 'inherit' });
      log.info(`[PKG] ${packageType} completed installation`);
    }

    const childDevServerPath = path.resolve(__dirname, 'childDevServer');

    // fork 子进程
    let childDevProcess = fork(childDevServerPath);

    fs.watchFile(path.resolve(currentPath, ZORO_JSON_FILENAME), () => {
      log.info(
        `${ZORO_JSON_FILENAME} has been changed, reexecute dev command ...`
      );
      childDevProcess.kill('SIGINT');
      childDevProcess = fork(childDevServerPath);
    });
  } catch (e) {
    log.error(e.message);
  }
};

module.exports = dev;
