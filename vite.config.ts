import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(({ mode }) => ({
	plugins: [react(), cssInjectedByJsPlugin()],
	define: { "process.env.NODE_ENV": JSON.stringify(mode) },
	build: {
		outDir: "dist",
		emptyOutDir: false,
		sourcemap: mode !== "production",
		cssCodeSplit: false,
		lib: {
			entry: "src/view/main.tsx",
			formats: ["iife"],
			name: "ClaudeAgentsView",
			fileName: () => "view.js",
		},
	},
}));
