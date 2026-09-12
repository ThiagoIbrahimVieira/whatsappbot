export const PRESET_CONFIGS = {
    original: {
        name: 'original',
        label: 'Original',
        description: 'Fidelidade visual máxima balanceada para WhatsApp',
        imageQuality: 80,
        videoFps: 12,
        videoQuality: 50,
        maxDurationSeconds: 10,
    },
    best_quality: {
        name: 'best_quality',
        label: 'Best Quality',
        description: 'Alta nitidez com parâmetros de qualidade refinados',
        imageQuality: 90,
        videoFps: 15,
        videoQuality: 65,
        maxDurationSeconds: 10,
    },
    small_file: {
        name: 'small_file',
        label: 'Small File',
        description: 'Compressão agressiva para menor tamanho e dados móveis',
        imageQuality: 45,
        videoFps: 8,
        videoQuality: 25,
        maxDurationSeconds: 6,
    },
    fast: {
        name: 'fast',
        label: 'Fast',
        description: 'Conversão ultrarrápida com menor taxa de quadros',
        imageQuality: 60,
        videoFps: 8,
        videoQuality: 35,
        maxDurationSeconds: 5,
    },
    meme: {
        name: 'meme',
        label: 'Meme',
        description: 'Otimizado para legibilidade máxima de textos e legendas',
        imageQuality: 85,
        videoFps: 10,
        videoQuality: 45,
        maxDurationSeconds: 8,
    },
};
export function applyPresetToOptions(presetName, baseOptions = {}) {
    const preset = PRESET_CONFIGS[presetName || 'original'] || PRESET_CONFIGS.original;
    return {
        ...baseOptions,
        quality: baseOptions.quality || preset.imageQuality,
        fps: baseOptions.fps || preset.videoFps,
        maxDurationSeconds: baseOptions.maxDurationSeconds || preset.maxDurationSeconds,
    };
}
//# sourceMappingURL=presets.js.map