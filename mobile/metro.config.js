// Metro config: lets the app bundle selected modules from the web app's
// `../src` (see docs/ARCHITECTURE.md §5).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const webSrc = path.resolve(projectRoot, "..", "src");
const mobileSrc = path.resolve(projectRoot, "src");
// Resolving from here makes a package import behave as if written in mobile/.
const mobileOrigin = path.join(projectRoot, "package.json");

const config = getDefaultConfig(projectRoot);

// Watch the web source so edits there hot-reload in the app.
config.watchFolders = [...(config.watchFolders ?? []), webSrc];

// Path aliases. `~/` is the app's own source; `@web/` is the web source;
// `@/` is what web modules use for their own imports.
const ALIASES = [
  ["~/", mobileSrc],
  ["@web/", webSrc],
  ["@/", webSrc],
];

const isBarePackage = (name) => !name.startsWith(".") && !path.isAbsolute(name);
const isInWebSrc = (file) => !!file && !path.relative(webSrc, file).startsWith("..");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [prefix, target] of ALIASES) {
    if (moduleName.startsWith(prefix)) {
      return context.resolveRequest(context, path.join(target, moduleName.slice(prefix.length)), platform);
    }
  }
  // A package imported by a web module (e.g. zod) must come from
  // mobile/node_modules, never the web app's node_modules: that tree holds
  // React DOM and a second React. Normal nested lookup stays on for everything
  // else (SDK 58 nests some dependencies, e.g. under expo-router).
  if (isBarePackage(moduleName) && isInWebSrc(context.originModulePath)) {
    return context.resolveRequest({ ...context, originModulePath: mobileOrigin }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
