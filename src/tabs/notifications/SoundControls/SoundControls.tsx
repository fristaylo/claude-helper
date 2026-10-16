import { useEffect, useState } from "react";
import { Button } from "../../../components/Button/Button";
import { call, run } from "../../../rpc";
import type { EventConfig } from "../types";
import styles from "./SoundControls.module.scss";

export function SoundControls({
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
			<div className={styles.volume}>
				<Button
					variant="icon"
					icon={volume === 0 ? "mute" : "unmute"}
					title={`Volume ${volume}%`}
					disabled={disabled}
				/>
				{!disabled && (
					<div className={styles.pop}>
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
			<Button
				variant="icon"
				icon="play"
				title="Preview"
				disabled={off}
				onClick={() => run(call("previewSound", cfg.file, volume))}
			/>
		</>
	);
}
