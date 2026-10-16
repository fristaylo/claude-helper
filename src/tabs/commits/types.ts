export type CommitModel = "haiku" | "sonnet" | "opus";
export const COMMIT_MODELS: CommitModel[] = ["haiku", "sonnet", "opus"];
export interface CommitSettings {
	prompt: string;
	model: CommitModel;
	effort: string;
	claudePath: string;
	untracked: boolean;
}
