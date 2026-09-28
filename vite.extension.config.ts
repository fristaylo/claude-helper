import { builtinModules } from "node:module";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
	ssr: { noExternal: true },
	build: {
		outDir: "dist",
		emptyOutDir: true,
		target: "node18",
		ssr: "src/extension.ts",
		sourcemap: mode !== "production",
		minify: mode === "production",
		rollupOptions: {
			external: ["vscode", ...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
			output: { format: "cjs", entryFileNames: "extension.js" },
		},
	},
}));
