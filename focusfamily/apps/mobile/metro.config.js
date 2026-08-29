const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/**
 * Monorepo wiring: Metro has to watch the workspace root so that changes in
 * @focusfamily/domain are picked up, and it has to resolve modules from both
 * the app's own node_modules and the hoisted root one.
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
