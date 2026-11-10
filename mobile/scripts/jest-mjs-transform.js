/**
 * Jest transformer for .mjs files (lucide-react-native's per-icon modules).
 *
 * jest-expo only transforms .js/.jsx/.ts/.tsx, so tests that render an icon
 * failed to load lucide's ESM icon files. This reuses jest-expo's own Babel
 * transformer and options, resolved at runtime, so it stays portable (no
 * machine-specific paths) and in step with the installed jest-expo.
 */
const preset = require("jest-expo/jest-preset");

const jsKey = Object.keys(preset.transform).find((k) => k.includes("[jt]sx"));
const [transformerPath, options] = preset.transform[jsKey];
const babelJest = require(transformerPath);
const createTransformer = babelJest.createTransformer ?? babelJest.default?.createTransformer;

module.exports = createTransformer(options);
