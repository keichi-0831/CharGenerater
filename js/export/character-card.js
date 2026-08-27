// ============================================================
//  完整角色卡 JSON 导出（SillyTavern Character Card V3）
// ============================================================

function createExportId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
        const random = Math.floor(Math.random() * 16);
        const value = char === 'x' ? random : ((random & 0x3) | 0x8);
        return value.toString(16);
    });
}

function mapWorldbookPosition(position) {
    return Number(position) === 0 ? 'before_char' : 'after_char';
}

function convertWorldbookEntryToCardV3(entry, index) {
    const keys = Array.isArray(entry.key) ? entry.key : [];
    const secondaryKeys = Array.isArray(entry.keysecondary) ? entry.keysecondary : [];
    return {
        id: index,
        keys,
        secondary_keys: secondaryKeys,
        comment: String(entry.comment || ''),
        content: String(entry.content || ''),
        constant: entry.constant !== false,
        selective: entry.selective !== false,
        insertion_order: Number.isFinite(Number(entry.order)) ? Number(entry.order) : 100,
        enabled: entry.disable !== true,
        position: mapWorldbookPosition(entry.position),
        use_regex: true,
        extensions: {
            position: Number.isFinite(Number(entry.position)) ? Number(entry.position) : 2,
            exclude_recursion: entry.excludeRecursion === true,
            display_index: index,
            probability: Number.isFinite(Number(entry.probability)) ? Number(entry.probability) : 100,
            useProbability: entry.useProbability !== false,
            depth: Number.isFinite(Number(entry.depth)) ? Number(entry.depth) : 2,
            selectiveLogic: Number.isFinite(Number(entry.selectiveLogic)) ? Number(entry.selectiveLogic) : 0,
            outlet_name: '',
            group: String(entry.group || ''),
            group_override: entry.groupOverride === true,
            group_weight: Number.isFinite(Number(entry.groupWeight)) ? Number(entry.groupWeight) : 100,
            prevent_recursion: entry.preventRecursion === true,
            delay_until_recursion: entry.delayUntilRecursion === true,
            scan_depth: entry.scanDepth ?? null,
            match_whole_words: entry.matchWholeWords ?? null,
            use_group_scoring: entry.useGroupScoring === true,
            case_sensitive: entry.caseSensitive ?? null,
            automation_id: String(entry.automationId || ''),
            role: Number.isFinite(Number(entry.role)) ? Number(entry.role) : 0,
            vectorized: entry.vectorized === true,
            sticky: Number.isFinite(Number(entry.sticky)) ? Number(entry.sticky) : 0,
            cooldown: Number.isFinite(Number(entry.cooldown)) ? Number(entry.cooldown) : 0,
            delay: Number.isFinite(Number(entry.delay)) ? Number(entry.delay) : 0,
            match_persona_description: entry.matchPersonaDescription === true,
            match_character_description: entry.matchCharacterDescription === true,
            match_character_personality: entry.matchCharacterPersonality === true,
            match_character_depth_prompt: entry.matchCharacterDepthPrompt === true,
            match_scenario: entry.matchScenario === true,
            match_creator_notes: entry.matchCreatorNotes === true,
            triggers: [],
            ignore_budget: false
        }
    };
}

function buildEmbeddedCharacterBook(bookName) {
    const rawEntries = typeof buildWorldbookEntriesFromForm === 'function'
        ? buildWorldbookEntriesFromForm()
        : {};
    const entries = Object.keys(rawEntries || {})
        .sort((a, b) => Number(a) - Number(b))
        .map((key, index) => convertWorldbookEntryToCardV3(rawEntries[key], index));
    return { entries, name: bookName };
}

function getCachedAiRaw(tabKey) {
    if (typeof getCurrentCharAiCache !== 'function') return '';
    const cache = getCurrentCharAiCache(tabKey);
    if (!cache) return '';
    if (typeof cache === 'string') return cache.trim();
    return String(cache.raw || cache.content || cache.reply || '').trim();
}

function getOpeningMessageForCard() {
    const tabKey = typeof AI_SUBTAB_OPENING === 'string' ? AI_SUBTAB_OPENING : 'opening';
    return getCachedAiRaw(tabKey);
}

function getRegexScriptsForCard() {
    const tabKey = typeof AI_SUBTAB_FRONTEND_DECOR === 'string'
        ? AI_SUBTAB_FRONTEND_DECOR
        : 'frontend-decor';
    const raw = getCachedAiRaw(tabKey);
    if (!raw || typeof extractFrontendDecorFromText !== 'function') return [];
    const parsed = extractFrontendDecorFromText(raw);
    const regex = parsed?.statusRegexJson;
    if (!regex || typeof regex !== 'object') return [];
    return [{
        ...regex,
        scriptName: regex.scriptName || '状态栏',
        id: regex.id || createExportId()
    }];
}

function buildCharacterCardJson() {
    const value = id => (document.getElementById(id)?.value || '').trim();
    const currentCharName = typeof getCurrentCharObject === 'function'
        ? String(getCurrentCharObject()?.name || '').trim()
        : '';
    const internalName = value('char_name');
    const displayName = value('chinese_name') || internalName || currentCharName || '未命名角色';
    const description = typeof generateYaml === 'function' ? generateYaml() : '';
    const firstMessage = getOpeningMessageForCard();
    const regexScripts = getRegexScriptsForCard();
    const bookBaseName = internalName || displayName;
    const bookName = `${bookBaseName}_worldbook`;
    const characterBook = buildEmbeddedCharacterBook(bookName);
    const createdAt = new Date().toISOString();
    const talkativeness = '0.5';
    const favorite = false;

    const data = {
        name: displayName,
        description,
        personality: '',
        scenario: '',
        first_mes: firstMessage,
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        tags: [],
        creator: '',
        character_version: '',
        alternate_greetings: [],
        extensions: {
            talkativeness,
            fav: favorite,
            world: bookName,
            depth_prompt: {
                prompt: '',
                depth: 4,
                role: 'system'
            },
            regex_scripts: regexScripts,
            tavern_helper: {
                scripts: [],
                variables: {}
            }
        },
        group_only_greetings: [],
        character_book: characterBook
    };

    return {
        name: displayName,
        description,
        personality: '',
        scenario: '',
        first_mes: firstMessage,
        mes_example: '',
        creatorcomment: '',
        avatar: 'none',
        talkativeness,
        fav: favorite,
        tags: [],
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data,
        create_date: createdAt
    };
}

function sanitizeCharacterCardFilename(name) {
    const safeName = String(name || 'character')
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/[. ]+$/g, '')
        .trim();
    return `${safeName || 'character'}.json`;
}

function exportCharacterCardJson() {
    const payload = buildCharacterCardJson();
    const json = JSON.stringify(payload, null, 2);
    const filename = sanitizeCharacterCardFilename(payload.name);
    if (typeof downloadTextFile === 'function') {
        downloadTextFile(filename, json, 'application/json');
    } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
    if (typeof showToast === 'function') {
        const worldbookCount = payload.data.character_book.entries.length;
        const regexCount = payload.data.extensions.regex_scripts.length;
        showToast(`💾 已导出完整角色卡（世界书 ${worldbookCount} 条，正则 ${regexCount} 条）`);
    }
}
