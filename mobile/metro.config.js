// Metro config: lets the app bundle selected modules from the web app's
// `../src` (see docs/ARCHITECTURE.md §5).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const webSrc = path.resolve(projectRoot, "..", "src");
const mobileSrc = path.resolve(projectRoot, "src");

const config = getDefaultConfig(projectRoot);

// Watch the web source so edits there hot-reload in the app.
config.watchFolders = [...(config.watchFolders ?? []), webSrc];

// Resolve every package from mobile/node_modules only. Without this, a web
// module would pick up the web app's node_modules (React DOM, a second React,
// zod twice…).
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];
config.resolver.disableHierarchicalLookup = true;

// Path aliases. `~/` is the app's own source; `@web/` is the web source;
// `@/` is what web modules use for their own imports.
const ALIASES = [
  ["~/", mobileSrc],
  ["@web/", webSrc],
  ["@/", webSrc],
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [prefix, target] of ALIASES) {
    if (moduleName.startsWith(prefix)) {
      return context.resolveRequest(
        context,
        path.join(target, moduleName.slice(prefix.length)),
        platform,
      );
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
