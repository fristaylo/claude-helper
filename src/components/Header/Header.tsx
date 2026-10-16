import type { State } from "../../host/api";
import { Spark } from "../../icons";
import { call, run } from "../../rpc";
import type { Scope } from "../../shared";
import { Button } from "../Button/Button";
import { Chip } from "../Chip/Chip";
import { Segmented } from "../Segmented/Segmented";
import styles from "./Header.module.scss";

export function Header({
	state,
	scope,
	locked,
	onScope,
}: {
	state: State;
	scope: Scope;
	locked: boolean;
	onScope: (s: Scope) => void;
}) {
	const isGlobal = scope === "global";
	return (
		<header className={styles.top}>
			<div className={styles.brand}>
				<span className={styles.logo}>
					<Spark />
				</span>
				<div>
					<h1>Claude Helper</h1>
					<p className="muted small">Claude Code config, plugins, notifications and commits</p>
				</div>
			</div>
			<div className={styles.scope}>
				<Segmented<Scope>
					className={styles.segmented}
					value={scope}
					onChange={onScope}
					options={[
						{
							value: "project",
							icon: "folder",
							label: state.project?.name ?? "Project",
							disabled: locked || !state.project,
							title: locked ? "Global only" : (state.project?.dir ?? "Open a folder to use project settings"),
						},
						{
							value: "global",
							icon: "globe",
							label: "Global",
							disabled: locked,
							title: locked ? "Global only" : state.global.dir,
						},
					]}
				/>
				{isGlobal && state.custom && <Chip accent>custom</Chip>}
				{isGlobal && (
					<Button
						variant="icon"
						icon="folder-opened"
						title="Choose folder"
						onClick={() => run(call("pickDir"))}
					/>
				)}
				{isGlobal && state.custom && (
					<Button
						variant="icon"
						icon="discard"
						title="Back to default folder"
						onClick={() => run(call("resetDir"))}
					/>
				)}
				<Button
					variant="icon"
					icon="link-external"
					title="Reveal in file explorer"
					onClick={() => run(call("reveal", scope))}
				/>
			</div>
		</header>
	);
}
