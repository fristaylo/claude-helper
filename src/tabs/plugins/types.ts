export interface Plugin {
	id: string;
	name: string;
	marketplace: string;
	version: string;
	enabled: boolean;
	description: string;
}
export interface Marketplace {
	name: string;
	source: string;
	plugins: number;
}
export interface CatalogEntry {
	name: string;
	marketplace: string;
	description: string;
	category?: string;
	installed: boolean;
}
export interface PluginsState {
	installed: Plugin[];
	marketplaces: Marketplace[];
	catalog: CatalogEntry[];
}
