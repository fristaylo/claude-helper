import { type CSSProperties, useState } from "react";
import { Banner } from "../../../components/Banner/Banner";
import { Button } from "../../../components/Button/Button";
import { Count } from "../../../components/Count/Count";
import { Empty } from "../../../components/Empty/Empty";
import { Search } from "../../../components/Search/Search";
import { Segmented } from "../../../components/Segmented/Segmented";
import { Icon } from "../../../icons";
import { call, run, toast } from "../../../rpc";
import type { Scope } from "../../../shared";
import { RuleBuilder } from "../RuleBuilder/RuleBuilder";
import { RuleItem } from "../RuleItem/RuleItem";
import { KINDS, KIND_INFO, type Kind, type Rules } from "../types";
import styles from "./Permissions.module.scss";

export function Permissions({
	scope,
	rules,
	settingsFile,
	error,
}: {
	scope: Scope;
	rules: Rules;
	settingsFile: string;
	error?: string;
}) {
	const [kind, setKind] = useState<Kind>("deny");
	const [q, setQ] = useState("");
	const list = rules[kind];
	const needle = q.toLowerCase();
	const shown = list.filter((r) => r.toLowerCase().includes(needle));

	const apply = (patch: Partial<Rules>, ok?: string) => run(call("setRules", scope, patch), ok);

	const add = async (rule: string) => {
		const owner = KINDS.find((k) => rules[k].includes(rule));
		if (owner) {
			toast(`Already in ${KIND_INFO[owner].label}`, true);
			return false;
		}
		await apply({ [kind]: [...list, rule] }, `Added to ${KIND_INFO[kind].label}`);
		return true;
	};
	const move = (rule: string, to: Kind) =>
		apply(
			{ [kind]: list.filter((r) => r !== rule), [to]: [...rules[to], rule] },
			`Moved to ${KIND_INFO[to].label}`,
		);
	const remove = (rule: string) => apply({ [kind]: list.filter((r) => r !== rule) }, "Rule removed");
	const edit = (rule: string, text: string) => apply({ [kind]: list.map((r) => (r === rule ? text : r)) });

	return (
		<div className="page">
			<div className="toolbar">
				<Segmented
					value={kind}
					onChange={setKind}
					options={KINDS.map((k) => ({
						value: k,
						icon: KIND_INFO[k].icon,
						color: KIND_INFO[k].color,
						label: (
							<>
								{KIND_INFO[k].label}
								<Count>{rules[k].length}</Count>
							</>
						),
					}))}
				/>
				<span className="grow" />
				<Button variant="ghost" icon="json" onClick={() => run(call("open", scope, settingsFile))}>
					{settingsFile}
				</Button>
			</div>

			{error && (
				<Banner kind="error" icon="error">
					{error}
				</Banner>
			)}

			<p className={styles.hint} style={{ "--k": KIND_INFO[kind].color } as CSSProperties}>
				<Icon name={KIND_INFO[kind].icon} /> {KIND_INFO[kind].hint}
			</p>

			<RuleBuilder kind={kind} disabled={!!error} onAdd={add} />

			{list.length > 4 && (
				<Search wide icon="filter" value={q} onChange={setQ} placeholder={`Filter ${list.length} rules`} />
			)}

			{list.length === 0 ? (
				<Empty icon={KIND_INFO[kind].icon} title={`No ${KIND_INFO[kind].label.toLowerCase()} rules`}>
					<p>
						Rules look like <code>Bash(npm run test:*)</code>, <code>Read(./.env)</code> or just{" "}
						<code>WebSearch</code>.
					</p>
				</Empty>
			) : (
				<ul className={styles.rules}>
					{shown.map((rule) => (
						<RuleItem
							key={`${kind}:${rule}`}
							rule={rule}
							kind={kind}
							disabled={!!error}
							onEdit={(text) => edit(rule, text)}
							onMove={(to) => move(rule, to)}
							onRemove={() => remove(rule)}
						/>
					))}
				</ul>
			)}
		</div>
	);
}
