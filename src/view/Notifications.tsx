import { useEffect, useState } from "react";
import {
	type EventConfig,
	NOTIFY_EVENTS,
	type NotifyEvent,
	type NotifyPatch,
	type NotifySettings,
} from "../shared";
import { call, run } from "./rpc";
import { Icon } from "./ui";

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
		<div className="page notifications">
			<div className="notify-head">
				<div className="avatar">
					<Icon name={off ? "bell-slash" : "bell"} />
				</div>
				<div className="grow">
					<h3>Notifications</h3>
					<div className="muted small">Sounds and popups for Claude Code in this window</div>
					<div className="muted small">Same as the bell in the status bar</div>
				</div>
				<input
					type="checkbox"
					role="switch"
					aria-checked={settings.enabled}
					className="switch"
					title={off ? "Turn on" : "Turn off"}
					checked={settings.enabled}
					onChange={(e) => save({ enabled: e.target.checked })}
				/>
			</div>

			<table className={`notify-table ${off ? "off" : ""}`}>
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
									<div className="event">
										<Icon name={INFO[e].icon} />
										<div>
											<div>{INFO[e].label}</div>
											{INFO[e].hint && <div className="muted small">{INFO[e].hint}</div>}
										</div>
									</div>
								</td>
								<td>
									<input
										type="checkbox"
										className="check"
										title="Sound"
										disabled={off}
										checked={cfg.sound}
										onChange={(x) => setEvent(e, { sound: x.target.checked })}
									/>
								</td>
								<td>
									<input
										type="checkbox"
										className="check"
										title="Popup"
										disabled={off}
										checked={cfg.popup}
										onChange={(x) => setEvent(e, { popup: x.target.checked })}
									/>
								</td>
								<td>
									<div className="sound-pick">
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

function SoundControls({
	cfg,
	off,
	onVolume,
}: {
	cfg: EventConfig;
	off: boolean;
	onVolume: (volume: number) => void;
}) {
	const [volume, setVolume] = useState(cfg.volume);
	useEffect(() => setVolume(cfg.volume), [cfg.volume]);
	const commit = () => volume !== cfg.volume && onVolume(volume);
	const disabled = off || !cfg.sound;

	return (
		<>
			<div className="volume">
				<button type="button" className="icon-btn" title={`Volume ${volume}%`} disabled={disabled}>
					<Icon name={volume === 0 ? "mute" : "unmute"} />
				</button>
				{!disabled && (
					<div className="volume-pop">
						<input
							type="range"
							min={0}
							max={100}
							value={volume}
							aria-label="Volume"
							onChange={(x) => setVolume(Number(x.target.value))}
							onPointerUp={commit}
							onKeyUp={commit}
						/>
						<span className="small">{volume}%</span>
					</div>
				)}
			</div>
			<button
				type="button"
				className="icon-btn"
				title="Preview"
				disabled={off}
				onClick={() => run(call("previewSound", cfg.file, volume))}
			>
				<Icon name="play" />
			</button>
		</>
	);
}
