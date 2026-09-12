import type { QualityPreset } from '../control/bot-state.js';
import type { ProcessingOptions } from '../types/media.js';
export interface PresetConfig {
    name: QualityPreset;
    label: string;
    description: string;
    imageQuality: number;
    videoFps: number;
    videoQuality: number;
    maxDurationSeconds: number;
}
export declare const PRESET_CONFIGS: Record<QualityPreset, PresetConfig>;
export declare function applyPresetToOptions(presetName: QualityPreset | undefined, baseOptions?: ProcessingOptions): ProcessingOptions;
