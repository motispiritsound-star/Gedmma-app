const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

// The app lives in an npm workspace, so Metro has to watch the repo root to
// resolve @khidma/shared and the hoisted node_modules.
const workspaceRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
