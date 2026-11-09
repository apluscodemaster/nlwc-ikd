/**
 * Expo config plugin: make CMake shorten long object-file paths.
 *
 * React Native compiles codegen C++ for some libraries (e.g.
 * react-native-gesture-handler) inside the app module. CMake names each
 * object file after the full source path, nested under the build folder, and
 * on Windows these exceed the 260-character limit (ninja: "Filename longer
 * than 260 characters"). CMake replaces over-long object paths with a hash
 * when they exceed CMAKE_OBJECT_PATH_MAX, but Android's toolchain sets no
 * limit, so it never does. Setting one turns the shortening on. It's harmless
 * on macOS/Linux, where paths are short anyway.
 *
 * Applied to android/app/build.gradle on every `expo prebuild`, because the
 * android/ folder is generated (Continuous Native Generation).
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "-DCMAKE_OBJECT_PATH_MAX=";
const LINE = `        externalNativeBuild { cmake { arguments "${MARKER}240" } }`;

module.exports = function withCmakeObjectPathMax(config) {
  return withAppBuildGradle(config, (cfg) => {
    const src = cfg.modResults.contents;
    if (src.includes(MARKER)) return cfg; // already applied
    const anchor = /(defaultConfig\s*\{)/;
    if (!anchor.test(src)) {
      throw new Error("withCmakeObjectPathMax: no defaultConfig block found in android/app/build.gradle");
    }
    cfg.modResults.contents = src.replace(anchor, `$1\n${LINE}`);
    return cfg;
  });
};
