import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

function withoutPwaPlugins(plugins: PluginOption[] | undefined): PluginOption[] {
  const resolvedPlugins: PluginOption[] = [];
  const visit = (plugin: PluginOption) => {
    if (Array.isArray(plugin)) {
      plugin.forEach(visit);
      return;
    }
    if (!plugin || plugin.name.startsWith("vite-plugin-pwa")) {
      return;
    }
    resolvedPlugins.push(plugin);
  };

  plugins?.forEach(visit);
  return resolvedPlugins;
}

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    // Storybook merges the application Vite config. Its preview must never
    // build or register the application PWA service worker, whose navigation
    // fallback would otherwise replace Storybook's iframe with app index.html.
    plugins: withoutPwaPlugins(viteConfig.plugins),
    publicDir: false,
  }),
};

export default config;
