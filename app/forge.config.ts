import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { execSync } from "node:child_process";

const config: ForgeConfig = {
  packagerConfig: {
    name: "Flow Chamber",
    executableName: "flow-chamber",
    // asar disabled so externalized native deps (serialport/bindings-cpp) are
    // resolvable at runtime via node_modules. The Vite plugin marks native
    // modules as external; forge's packager doesn't auto-include them in the
    // asar, so we ship the raw node_modules tree instead. Larger on disk but
    // reliable. Re-enable asar + tune `extraResource` later if we want to slim.
    asar: false,
    appBundleId: "org.flowchamber.app",
    appCategoryType: "public.app-category.education",
    // Bundle the demo study with the packaged app so File → Open Demo Study
    // works on shipped binaries (not just the dev tree). Lands at
    // `<resources>/demo_study/` — main.ts looks for it at process.resourcesPath.
    extraResource: ["../examples/demo_study"],
    // Plugin-vite's default ignore strips node_modules. Re-add production deps
    // by running `npm install --omit=dev` inside the staged buildPath. Slow on
    // first run; cached afterward.
    afterCopy: [
      (buildPath, _electronVersion, _platform, _arch, callback) => {
        try {
          console.log(`[afterCopy] Installing production deps in ${buildPath}`);
          execSync("npm install --omit=dev --no-package-lock --no-audit --no-fund", {
            cwd: buildPath,
            stdio: "inherit",
          });
          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "FlowChamber",
      authors: "Saffari, Rocca, Matthews, Lewis",
      description: "Operator app for the parametric flow chamber",
    }),
    new MakerDMG({
      name: "Flow Chamber",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    // AutoUnpackNativesPlugin removed: only relevant when asar is enabled.
    // With asar:false, native node_modules are present on disk directly.
    new VitePlugin({
      build: [
        {
          entry: "electron/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "electron/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      // asar integrity / OnlyLoadAppFromAsar disabled because asar itself is
      // disabled in packagerConfig. Re-enable both if asar is turned back on.
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
