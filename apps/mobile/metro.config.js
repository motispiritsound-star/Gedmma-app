const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

// The app lives in an npm workspace, so Metro has to watch the repo root to
// resolve @buurklus/shared and the hoisted node_modules.
const workspaceRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Expo's web modules register themselves under their class name and throw
// "Module implementation must be a class" when the minifier strips it, so the
// names have to survive minification.
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    ...(config.transformer.minifierConfig?.mangle ?? {}),
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = config;
