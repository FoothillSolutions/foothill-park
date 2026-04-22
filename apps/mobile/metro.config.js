const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Let Metro see packages hoisted to the monorepo root node_modules
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Fix for monorepo: expo/AppEntry.js is hoisted to root node_modules
// so its "../../App" import resolves to the workspace root, not apps/mobile.
// Redirect it to expo-router's entry instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '../../App' &&
    context.originModulePath.includes('node_modules/expo/AppEntry')
  ) {
    const entryPath = require.resolve('expo-router/entry', { paths: [projectRoot] });
    return { filePath: entryPath, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
