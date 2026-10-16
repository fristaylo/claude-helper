import { Avatar } from "../../../components/Avatar/Avatar";
import { Checkbox } from "../../../components/Checkbox/Checkbox";
import { Switch } from "../../../components/Switch/Switch";
import { Icon } from "../../../icons";
import { call, run } from "../../../rpc";
import { SoundControls } from "../SoundControls/SoundControls";
import {
	type EventConfig,
	NOTIFY_EVENTS,
	type NotifyEvent,
	type NotifyPatch,
	type NotifySettings,
} from "../types";
import styles from "./Notifications.module.scss";

const INFO: Record<NotifyEvent, { icon: string; label: string; hint?: string }> = {
	done: { icon: "pass", label: "Task finished", hint: "Claude finished answering" },
	permission: { icon: "shield", label: "Needs permission", hint: "Waiting for tool approval" },
	question: { icon: "question", label: "Question", hint: "AskUserQuestion" },
	subagent: { icon: "hubot", label: "Subagent finished" },
	commit: { icon: "git-commit", label: "Commit message ready", hint: "Generated from Source Control" },
};

export function Notifications({ settings }: { settings: NotifySettings }) {
	const off = !settings.enabled;
	const save = (patch: NotifyPatch) => run(call("setNotify", patch));
	const setEvent = (e: NotifyEvent, patch: Partial<EventConfig>) =>
		save({ events: { [e]: { ...settings.events[e], ...patch } } });

	return (
		<div className="page">
			<div className={styles.head}>
				<Avatar icon={off ? "bell-slash" : "bell"} />
				<div className="grow">
					<h3>Notifications</h3>
					<div className="muted small">Sounds and popups for Claude Code in this window</div>
					<div className="muted small">Same as the bell in the status bar</div>
				</div>
				<Switch
					title={off ? "Turn on" : "Turn off"}
					checked={settings.enabled}
					onChange={(e) => save({ enabled: e.target.checked })}
				/>
			</div>

			<table className={`${styles.table} ${off ? styles.off : ""}`}>
				<thead>
					<tr>
						<th />
						<th title="Sound">
							<Icon name="unmute" />
						</th>
						<th title="Popup">
							<Icon name="window" />
						</th>
						<th title="Sound file">
							<Icon name="music" />
						</th>
					</tr>
				</thead>
				<tbody>
					{NOTIFY_EVENTS.map((e) => {
						const cfg = settings.events[e];
						return (
							<tr key={e}>
								<td>
									<div className={styles.event}>
										<Icon name={INFO[e].icon} />
										<div>
											<div>{INFO[e].label}</div>
											{INFO[e].hint && <div className="muted small">{INFO[e].hint}</div>}
										</div>
									</div>
								</td>
								<td>
									<Checkbox
										title="Sound"
										disabled={off}
										checked={cfg.sound}
										onChange={(x) => setEvent(e, { sound: x.target.checked })}
									/>
								</td>
								<td>
									<Checkbox
										title="Popup"
										disabled={off}
										checked={cfg.popup}
										onChange={(x) => setEvent(e, { popup: x.target.checked })}
									/>
								</td>
								<td>
									<div className={styles.sound}>
										<select
											value={cfg.file}
											disabled={off || !cfg.sound}
											onChange={(x) => setEvent(e, { file: x.target.value })}
										>
											{settings.sounds.map((s) => (
												<option key={s} value={s}>
													{soundLabel(s)}
												</option>
											))}
										</select>
										<SoundControls cfg={cfg} off={off} onVolume={(volume) => setEvent(e, { volume })} />
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function soundLabel(file: string): string {
	const name = file.replaceAll("-", " ");
	return name.charAt(0).toUpperCase() + name.slice(1);
}
