export const CHARACTER_CONFIGS = {
    soldier: { id: 'soldier', label: 'LÍNH', modelFile: 'character-soldier.glb', color: '#22e6a5' },
    skeleton: { id: 'skeleton', label: 'KHUNG XƯƠNG', modelFile: 'character-skeleton.glb', color: '#ffe06a' },
    vampire: { id: 'vampire', label: 'MA CÀ RỒNG', modelFile: 'character-vampire.glb', color: '#ff5577' }
};

export function normalizeCharacter(id) {
    return CHARACTER_CONFIGS[id] ? id : 'soldier';
}
