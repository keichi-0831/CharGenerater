// ============================================================
//  AI 配置 / 生成
// ============================================================
function getProviders() { try { return JSON.parse(localStorage.getItem(LS_AI_PROVIDERS)) || {}; } catch (e) { return {}; } }
function saveProviders(p) { localStorage.setItem(LS_AI_PROVIDERS, JSON.stringify(p)); }
function getCurrentProviderId() { return localStorage.getItem(LS_AI_CURRENT_P) || null; }
function setCurrentProviderId(id) { localStorage.setItem(LS_AI_CURRENT_P, id); }
function generateProviderId() { return 'prov_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5); }

function getAiUiState() {
    try { return JSON.parse(localStorage.getItem(LS_AI_UI_STATE)) || {}; } catch (e) { return {}; }
}

function saveAiUiState(state) {
    localStorage.setItem(LS_AI_UI_STATE, JSON.stringify(state || {}));
}

function collectAiUiState() {
    const getVal = (id, fallback = '') => {
        const el = document.getElementById(id);
        return el ? el.value : fallback;
    };
    const getChecked = (id, fallback = false) => {
        const el = document.getElementById(id);
        return el ? !!el.checked : fallback;
    };
    const moduleChecks = {};
    document.querySelectorAll('input[name="aiModule"]').forEach(el => {
        moduleChecks[el.value] = !!el.checked;
    });
    const moduleGuides = {};
    // 人设卡各模块
    ['basic','background','appearance','personality','user_relation','behavior','speech','extra','nsfw',
     // 世界书各模块（世界观子标签）
     'world_statusbar','world_era_background','world_special_settings','world_npcs',
     'world_frontend_decor','world_persona_correction','world_state_specified','world_extra',
     // user 人设各模块
     'basic_user','personality_user','relation_user','preference_user','NSFW_user'
    ].forEach(k => {
        moduleGuides[k] = getVal('guide_' + k, '');
    });
    moduleGuides.opening_scene = getVal('guide_opening_scene', '');
    moduleGuides.about_me = getVal('guide_about_me', '');

    const instructionDrafts = {
        [AI_SUBTAB_PERSONA_CARD]: getVal('aiInstructionsChar', AppState.aiInstructionDrafts?.[AI_SUBTAB_PERSONA_CARD] || AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT),
        [AI_SUBTAB_WORLDVIEW]: getVal('aiInstructionsWorld', AppState.aiInstructionDrafts?.[AI_SUBTAB_WORLDVIEW] || AI_WORLDVIEW_INSTRUCTIONS_DEFAULT),
        [AI_SUBTAB_USER_PERSONA]: getVal('aiInstructionsUser', AppState.aiInstructionDrafts?.[AI_SUBTAB_USER_PERSONA] || AI_USER_PERSONA_INSTRUCTIONS_DEFAULT),
        [AI_SUBTAB_OPENING]: getVal('aiInstructionsOpening', AppState.aiInstructionDrafts?.[AI_SUBTAB_OPENING] || AI_OPENING_INSTRUCTIONS_DEFAULT),
        [AI_SUBTAB_FRONTEND_DECOR]: getVal('aiInstructionsStatus', AppState.aiInstructionDrafts?.[AI_SUBTAB_FRONTEND_DECOR] || AI_STATUS_INSTRUCTIONS_DEFAULT)
    };

    return {
        persona: getVal('aiPersona', ''),
        xpCore: getVal('aiXpCore', ''),
        trope: getVal('aiTrope', ''),
        openingWordCount: getVal('aiOpeningWordCount', '800-1000字'),
        openingUserPortrayalMode: document.querySelector('input[name="openingUserPortrayalMode"]:checked')?.value || 'disallow',
        sendTropeToAi: getChecked('sendTropeToAi', true),
        sendCharCardToAi: getChecked('sendCharCardToAi', true),
        sendWorldbookToAi: getChecked('sendWorldbookToAi', true),
        useNamerPoolForAi: getChecked('useNamerPoolForAi', false),
        enableStream: getChecked('enableStream', true),
        sendPersonalPronounsToAi: getChecked('sendPersonalPronounsToAi', false),
        charPronounMode: document.querySelector('input[name="charPronounMode"]:checked')?.value || 'third',
        userPronounMode: document.querySelector('input[name="userPronounMode"]:checked')?.value || 'second',
        // 这里原本使用了不存在的全局变量 currentTab，导致初始化/保存 UI 状态时报错
        // 改为使用现有的 AI 子标签状态：如果 AppState.aiActiveSubtab 尚未初始化，则回退到默认值
        activeSubtab: (typeof getActiveAiSubtab === 'function')
            ? getActiveAiSubtab()
            : (window.AppState?.aiActiveSubtab || AI_SUBTAB_PERSONA_CARD),
        moduleChecks,
        moduleGuides,
        instructionDrafts
    };
}

function persistAiUiState() {
    saveAiUiState(collectAiUiState());
}

function applyAiUiState(state) {
    if (!state || typeof state !== 'object') return;
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = String(val);
    };
    const setChecked = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.checked = !!val;
    };

    setVal('aiPersona', state.persona);
    setVal('aiXpCore', state.xpCore);
    if (!document.getElementById('aiTrope')?.value) setVal('aiTrope', state.trope || '');
    setVal('aiOpeningWordCount', state.openingWordCount);
    setChecked('sendTropeToAi', state.sendTropeToAi);
    // 兼容旧版本：如果只有 includeExistingContentToAi，则同时作为两种内容的默认勾选值
    const includeExistingLegacy = (state.includeExistingContentToAi !== undefined)
        ? state.includeExistingContentToAi
        : true;
    const sendCharCardToAi = (state.sendCharCardToAi !== undefined)
        ? state.sendCharCardToAi
        : includeExistingLegacy;
    const sendWorldbookToAi = (state.sendWorldbookToAi !== undefined)
        ? state.sendWorldbookToAi
        : includeExistingLegacy;
    setChecked('sendCharCardToAi', sendCharCardToAi);
    setChecked('sendWorldbookToAi', sendWorldbookToAi);
    setChecked('useNamerPoolForAi', state.useNamerPoolForAi);
    setChecked('enableStream', state.enableStream);
    setChecked('sendPersonalPronounsToAi', state.sendPersonalPronounsToAi);

    const openingUserPortrayalMode = state.openingUserPortrayalMode
        || (state.sendOpeningUserPortrayalToAi ? 'allow' : 'disallow');
    const openingUserPortrayalRadio = document.querySelector(`input[name="openingUserPortrayalMode"][value="${openingUserPortrayalMode}"]`);
    if (openingUserPortrayalRadio) openingUserPortrayalRadio.checked = true;

    if (state.charPronounMode) {
        const charRadio = document.querySelector(`input[name="charPronounMode"][value="${state.charPronounMode}"]`);
        if (charRadio) charRadio.checked = true;
    }
    if (state.userPronounMode) {
        const userRadio = document.querySelector(`input[name="userPronounMode"][value="${state.userPronounMode}"]`);
        if (userRadio) userRadio.checked = true;
    }

    if (state.moduleChecks && typeof state.moduleChecks === 'object') {
        document.querySelectorAll('input[name="aiModule"]').forEach(el => {
            if (state.moduleChecks[el.value] !== undefined) el.checked = !!state.moduleChecks[el.value];
        });
    }

    if (state.moduleGuides && typeof state.moduleGuides === 'object') {
        Object.entries(state.moduleGuides).forEach(([k, v]) => {
            const targetId = k === 'opening_scene' ? 'guide_opening_scene' : 'guide_' + k;
            setVal(targetId, v);
        });
    }

    const draftsFromState = (state.instructionDrafts && typeof state.instructionDrafts === 'object')
        ? state.instructionDrafts
        : {};
    AppState.aiInstructionDrafts = {
        [AI_SUBTAB_PERSONA_CARD]: draftsFromState[AI_SUBTAB_PERSONA_CARD]
            || state.instructionsChar
            || AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_WORLDVIEW]: draftsFromState[AI_SUBTAB_WORLDVIEW]
            || state.instructionsWorld
            || AI_WORLDVIEW_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_USER_PERSONA]: draftsFromState[AI_SUBTAB_USER_PERSONA]
            || state.instructionsUser
            || AI_USER_PERSONA_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_OPENING]: draftsFromState[AI_SUBTAB_OPENING]
            || state.instructionsOpening
            || AI_OPENING_INSTRUCTIONS_DEFAULT,
        [AI_SUBTAB_FRONTEND_DECOR]: draftsFromState[AI_SUBTAB_FRONTEND_DECOR]
            || state.instructionsStatus
            || AI_STATUS_INSTRUCTIONS_DEFAULT
    };
    AppState.aiActiveSubtab = state.activeSubtab || AppState.aiActiveSubtab || AI_SUBTAB_PERSONA_CARD;

    // 将指令草稿同步回各自独立的 textarea
    const insCharEl = document.getElementById('aiInstructionsChar');
    if (insCharEl) insCharEl.value = AppState.aiInstructionDrafts[AI_SUBTAB_PERSONA_CARD] || AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT;
    const insWorldEl = document.getElementById('aiInstructionsWorld');
    if (insWorldEl) insWorldEl.value = AppState.aiInstructionDrafts[AI_SUBTAB_WORLDVIEW] || AI_WORLDVIEW_INSTRUCTIONS_DEFAULT;
    const insUserEl = document.getElementById('aiInstructionsUser');
    if (insUserEl) insUserEl.value = AppState.aiInstructionDrafts[AI_SUBTAB_USER_PERSONA] || AI_USER_PERSONA_INSTRUCTIONS_DEFAULT;
    const insOpeningEl = document.getElementById('aiInstructionsOpening');
    if (insOpeningEl) insOpeningEl.value = AppState.aiInstructionDrafts[AI_SUBTAB_OPENING] || AI_OPENING_INSTRUCTIONS_DEFAULT;
    const insStatusEl = document.getElementById('aiInstructionsStatus');
    if (insStatusEl) insStatusEl.value = AppState.aiInstructionDrafts[AI_SUBTAB_FRONTEND_DECOR] || AI_STATUS_INSTRUCTIONS_DEFAULT;
}

function migrateOldAiConfig() {
    const providers = getProviders();
    if (Object.keys(providers).length > 0) return;
    try {
        const old = JSON.parse(localStorage.getItem(LS_AI_CONFIG));
        if (old && (old.baseUrl || old.apiKey)) {
            const id = generateProviderId();
            providers[id] = { name: '默认供应商', baseUrl: old.baseUrl || '', apiKey: old.apiKey || '', selectedModel: '' };
            saveProviders(providers);
            setCurrentProviderId(id);
        }
    } catch (e) {}
}

function initProviderSystem() {
    migrateOldAiConfig();
    applyAiUiState(getAiUiState());
    let providers = getProviders();
    let currentId = getCurrentProviderId();
    if (Object.keys(providers).length === 0) {
        const id = generateProviderId();
        providers[id] = { name: '默认供应商', baseUrl: '', apiKey: '', selectedModel: '' };
        saveProviders(providers);
        currentId = id;
        setCurrentProviderId(id);
    }
    if (!providers[currentId]) {
        currentId = Object.keys(providers)[0];
        setCurrentProviderId(currentId);
    }
    renderProviderSelect(providers, currentId);
    loadProviderConfig(currentId);
}

function renderProviderSelect(providers, currentId) {
    const sel = document.getElementById('providerSelect');
    sel.innerHTML = '';
    Object.entries(providers).forEach(([id, p]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = p.name;
        if (id === currentId) opt.selected = true;
        sel.appendChild(opt);
    });
}

function switchProvider(newId) {
    saveCurrentProviderConfig();
    persistAiUiState();
    setCurrentProviderId(newId);
    loadProviderConfig(newId);
    document.getElementById('modelList').innerHTML = '';
    setApiStatus('', '');
    AppState.selectedModel = '';
}

function loadProviderConfig(id) {
    const providers = getProviders();
    const p = providers[id];
    if (!p) return;
    document.getElementById('aiBaseUrl').value = p.baseUrl || '';
    document.getElementById('aiApiKey').value = p.apiKey || '';
    AppState.selectedModel = p.selectedModel || '';
    document.getElementById('modelList').innerHTML = '';
    if (AppState.selectedModel) setApiStatus('', `上次选择的模型: ${AppState.selectedModel}`);
    else setApiStatus('', '');
}

function saveCurrentProviderConfig() {
    const id = getCurrentProviderId();
    if (!id) return;
    const providers = getProviders();
    if (!providers[id]) return;
    providers[id].baseUrl = document.getElementById('aiBaseUrl').value.trim();
    providers[id].apiKey = document.getElementById('aiApiKey').value.trim();
    providers[id].selectedModel = AppState.selectedModel || '';
    saveProviders(providers);
    persistAiUiState();
    scheduleCloudConfigSync();
}

function newProvider() {
    const name = prompt('新建 API 供应商名称：', '新供应商');
    if (!name) return;
    saveCurrentProviderConfig();
    const providers = getProviders();
    const id = generateProviderId();
    providers[id] = { name: name.trim(), baseUrl: '', apiKey: '', selectedModel: '' };
    saveProviders(providers);
    setCurrentProviderId(id);
    renderProviderSelect(providers, id);
    loadProviderConfig(id);
    document.getElementById('modelList').innerHTML = '';
    setApiStatus('', '');
    AppState.selectedModel = '';
    showToast('✨ 已新建供应商：' + name.trim());
}

function renameProvider() {
    const id = getCurrentProviderId();
    if (!id) return;
    const providers = getProviders();
    const oldName = providers[id]?.name || '';
    const name = prompt('重命名供应商：', oldName);
    if (!name || name.trim() === oldName) return;
    providers[id].name = name.trim();
    saveProviders(providers);
    renderProviderSelect(providers, id);
    showToast('✏️ 已重命名为：' + name.trim());
}

function deleteProvider() {
    const id = getCurrentProviderId();
    if (!id) return;
    const providers = getProviders();
    if (Object.keys(providers).length <= 1) { alert('至少保留一个供应商！'); return; }
    if (!confirm(`确定删除供应商「${providers[id]?.name}」吗？`)) return;
    delete providers[id];
    saveProviders(providers);
    const newId = Object.keys(providers)[0];
    setCurrentProviderId(newId);
    renderProviderSelect(providers, newId);
    loadProviderConfig(newId);
    document.getElementById('modelList').innerHTML = '';
    setApiStatus('', '');
    AppState.selectedModel = '';
    showToast('🗑️ 供应商已删除');
}

function saveAiConfig() { saveCurrentProviderConfig(); }
function toggleApiKey() { const inp = document.getElementById('aiApiKey'); inp.type = inp.type === 'password' ? 'text' : 'password'; }

async function fetchModels() {
    const baseUrl = document.getElementById('aiBaseUrl').value.trim().replace(/\/+$/, '');
    const apiKey = document.getElementById('aiApiKey').value.trim();
    if (!baseUrl) { showToast('请先填写 API 地址'); return; }
    setApiStatus('loading', '正在获取模型列表…');
    document.getElementById('modelList').innerHTML = '';
    AppState.selectedModel = '';
    try {
        const res = await fetch(`${baseUrl}/v1/models`, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const models = (data.data || data.models || []).map(m => m.id || m).filter(Boolean);
        if (models.length === 0) throw new Error('未找到可用模型');
        setApiStatus('valid', `已连接 · ${models.length} 个模型可用`);
        renderModelList(models);
        saveAiConfig();
    } catch (err) {
        setApiStatus('invalid', `连接失败：${err.message}`);
    }
}

function setApiStatus(state, text) {
    document.getElementById('apiDot').className = 'api-dot ' + state;
    document.getElementById('apiStatusText').textContent = text;
}

function renderModelList(models) {
    const list = document.getElementById('modelList');
    list.innerHTML = '';
    models.forEach(id => {
        const card = document.createElement('div');
        card.className = 'model-card';
        card.dataset.model = id;
        card.innerHTML = `<span class="model-dot"></span>${escapeHtml(id)}`;
        card.onclick = () => {
            document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            AppState.selectedModel = id;
            saveCurrentProviderConfig();
            scheduleCloudConfigSync();
        };
        list.appendChild(card);
        if (!AppState.selectedModel) card.click();
        else if (AppState.selectedModel === id) card.classList.add('selected');
    });
}

function getSelectedModules() {
    const active = getActiveAiSubtab();
    return Array.from(document.querySelectorAll('input[name="aiModule"]:checked'))
        .filter(el => {
            // 没有显式 data-ai-tab 的，默认归类到人设卡子标签
            const tab = el.dataset.aiTab || AI_SUBTAB_PERSONA_CARD;
            return tab === active;
        })
        .map(el => el.value);
}

function getActiveAiSubtab() {
    return AppState.aiActiveSubtab || AI_SUBTAB_PERSONA_CARD;
}

function buildAiCachePayload(raw, modules) {
    return {
        raw: String(raw || ''),
        modules: Array.isArray(modules) ? modules : [],
        updatedAt: Date.now()
    };
}

function inferModulesFromParsedJson(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    return Object.keys(parsed).filter(key => Object.prototype.hasOwnProperty.call(MODULE_LABELS, key));
}

function normalizeAiCacheEntry(entry, tabKey = getActiveAiSubtab()) {
    if (!entry) return null;
    if (typeof entry === 'string') {
        const parsed = tabKey === AI_SUBTAB_PERSONA_CARD ? extractJsonFromText(entry) : null;
        return {
            raw: entry,
            modules: inferModulesFromParsedJson(parsed),
            parsed,
            updatedAt: null
        };
    }
    if (typeof entry !== 'object') return null;

    const raw = typeof entry.raw === 'string'
        ? entry.raw
        : (typeof entry.content === 'string'
            ? entry.content
            : (typeof entry.reply === 'string' ? entry.reply : ''));
    if (!raw.trim()) return null;

    let parsed = null;
    if (tabKey === AI_SUBTAB_PERSONA_CARD) parsed = extractJsonFromText(raw);
    else if (tabKey === AI_SUBTAB_WORLDVIEW) parsed = extractWorldbookFromText(raw);
    else if (tabKey === AI_SUBTAB_FRONTEND_DECOR) parsed = extractFrontendDecorFromText(raw);
    const modules = Array.isArray(entry.modules) && entry.modules.length
        ? entry.modules
        : inferModulesFromParsedJson(parsed);

    return {
        ...entry,
        raw,
        modules,
        parsed
    };
}

function parseCachedAiEntry(entry, tabKey) {
    const normalized = normalizeAiCacheEntry(entry, tabKey);
    if (!normalized) return null;
    if (tabKey === AI_SUBTAB_PERSONA_CARD || tabKey === AI_SUBTAB_WORLDVIEW || tabKey === AI_SUBTAB_FRONTEND_DECOR) return normalized.parsed || null;
    return null;
}

function refreshAiCacheDisplay() {
    const rawSection = document.getElementById('aiRawReplySection');
    const rawContent = document.getElementById('aiRawReplyContent');
    const resultSection = document.getElementById('aiResultSection');
    const decorResultSection = document.getElementById('aiDecorResultSection');
    const resultContent = document.getElementById('aiRawResult');
    const badges = document.getElementById('aiFillBadges');
    const fillBtn = document.querySelector('.btn-ai-fill');
    if (!rawSection || !rawContent || !resultSection || !resultContent || !badges) return;

    const tabKey = getActiveAiSubtab();
    const cache = typeof getCurrentCharAiCache === 'function' ? getCurrentCharAiCache(tabKey) : null;
    const normalizedCache = normalizeAiCacheEntry(cache, tabKey);
    AppState.aiLastJson = parseCachedAiEntry(normalizedCache, tabKey);
    AppState.aiLastModules = Array.isArray(normalizedCache?.modules) ? normalizedCache.modules : [];
    const generateStatusEl = document.getElementById('aiGenerateStatus') || document.getElementById('aiStatusText');

    if (!normalizedCache || !normalizedCache.raw) {
        rawSection.style.display = 'none';
        resultSection.style.display = 'none';
        if (decorResultSection) decorResultSection.style.display = 'none';
        rawContent.textContent = '等待生成…';
        resultContent.textContent = '';
        badges.innerHTML = '';
        if (generateStatusEl) generateStatusEl.textContent = '';
        if (fillBtn) fillBtn.style.display = (isOpeningMode() || isUserPersonaMode() || isFrontendDecorMode()) ? 'none' : '';
        return;
    }

    rawSection.style.display = '';
    rawContent.textContent = normalizedCache.raw;
    showAiResult(normalizedCache.raw, normalizedCache.modules || []);
    if (generateStatusEl) {
        let msg = '已恢复上次 AI 生成缓存';
        if (isOpeningMode()) msg = '已恢复上次生成的开场白缓存';
        if (isFrontendDecorMode()) msg = '已恢复上次生成的前端美化缓存';
        generateStatusEl.textContent = msg;
        generateStatusEl.className = 'ai-status-text success';
    }
}

function isFrontendDecorMode() {
    return getActiveAiSubtab() === AI_SUBTAB_FRONTEND_DECOR;
}

function isOpeningMode() {
    return getActiveAiSubtab() === AI_SUBTAB_OPENING;
}

function isUserPersonaMode() {
    return getActiveAiSubtab() === AI_SUBTAB_USER_PERSONA;
}

function getSelectedPronoun(role) {
    return document.querySelector(`input[name="${role}PronounMode"]:checked`)?.value || (role === 'char' ? 'third' : 'second');
}

function getPronounInstructionLine(roleLabel, mode, placeholder) {
    if (mode === 'first') return `${roleLabel}：使用第一人称。`;
    if (mode === 'second') return `${roleLabel}：使用第二人称。`;
    return `${roleLabel}：使用第三人称，并统一使用 ${placeholder} 作为指代占位符。`;
}

function buildPersonalPronounsBlock() {
    const enabled = !!document.getElementById('sendPersonalPronounsToAi')?.checked;
    if (!enabled) return '';
    const charMode = getSelectedPronoun('char');
    const userMode = getSelectedPronoun('user');
    return `<PersonalPronouns>\n${getPronounInstructionLine('character', charMode, '{{char}}')}\n${getPronounInstructionLine('user', userMode, '{{user}}')}\n</PersonalPronouns>\n\n`;
}

function buildOpeningUserPortrayalBlock() {
    const mode = document.querySelector('input[name="openingUserPortrayalMode"]:checked')?.value || 'disallow';
    if (mode === 'allow') {
        return `<UserPortrayal>\n允许在开场白中适度描写 {{user}} 的言行举止、即时反应与心理活动，用于推进互动张力与场景节奏。\n描写 {{user}} 时请保持自然、克制、贴合当前情境，不要喧宾夺主，也不要让 {{user}} 的表现脱离已给出的设定与场景需求。\n</UserPortrayal>\n\n`;
    }
    return `<UserPortrayal>\n严令禁止描写 {{user}} 的任何言行举止、即时反应与心理活动。\n你只能描写 {{char}}、环境、氛围与客观可见的信息，不得替 {{user}} 说话、行动、做决定、产生心理活动，也不得补写任何属于 {{user}} 的主观或客观表现。\n</UserPortrayal>\n\n`;
}

function buildNamerPoolBlock() {
    const enabled = !!document.getElementById('useNamerPoolForAi')?.checked;
    if (!enabled || isOpeningMode()) return '';
    const surnames = (typeof getNamerPool === 'function' ? getNamerPool('surname') : []).filter(Boolean);
    const charnames = (typeof getNamerPool === 'function' ? getNamerPool('charname') : []).filter(Boolean);
    if (surnames.length === 0 && charnames.length === 0) return '';
    return `<naming_reference>\n当你需要为角色起名时，请优先从以下字池中选择并组合：\n姓池：${surnames.length ? surnames.join('、') : '（空）'}\n名池：${charnames.length ? charnames.join('、') : '（空）'}\n请尽量优先使用这些字；如果没有符合设定、音律或气质要求的组合，再自由发挥。\n</naming_reference>\n\n`;
}

function updateAiInstructionsByActiveTab(force = false) {
    const map = {
        [AI_SUBTAB_PERSONA_CARD]: { id: 'aiInstructionsChar', def: AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT },
        [AI_SUBTAB_WORLDVIEW]: { id: 'aiInstructionsWorld', def: AI_WORLDVIEW_INSTRUCTIONS_DEFAULT },
        [AI_SUBTAB_USER_PERSONA]: { id: 'aiInstructionsUser', def: AI_USER_PERSONA_INSTRUCTIONS_DEFAULT },
        [AI_SUBTAB_OPENING]: { id: 'aiInstructionsOpening', def: AI_OPENING_INSTRUCTIONS_DEFAULT },
        [AI_SUBTAB_FRONTEND_DECOR]: { id: 'aiInstructionsStatus', def: AI_STATUS_INSTRUCTIONS_DEFAULT }
    };
    Object.entries(map).forEach(([tabKey, cfg]) => {
        const el = document.getElementById(cfg.id);
        if (!el) return;
        const draftValue = AppState.aiInstructionDrafts && AppState.aiInstructionDrafts[tabKey] !== undefined
            ? AppState.aiInstructionDrafts[tabKey]
            : cfg.def;
        if (force) el.value = draftValue || cfg.def;
        else if (!el.value.trim()) el.value = draftValue || cfg.def;
    });
}

function syncAiTabUI() {
    const namingPoolOption = document.getElementById('aiNamingPoolOption');
    const previewTitle = document.getElementById('aiPreviewTitle');
    const fillBtn = document.querySelector('.btn-ai-fill');
    const isOpening = isOpeningMode();
    const isUserPersona = isUserPersonaMode();
    const isDecor = isFrontendDecorMode();
    if (namingPoolOption) namingPoolOption.style.display = (isOpening || isDecor) ? 'none' : '';
    if (previewTitle) previewTitle.textContent = '📋 本次将发送的消息预览';
    if (fillBtn) fillBtn.style.display = (isOpening || isUserPersona || isDecor) ? 'none' : '';
}

function buildOpeningPreview() {
    const xpCore = document.getElementById('aiXpCore')?.value.trim() || '';
    const trope = document.getElementById('aiTrope')?.value.trim() || '';
    const sendTrope = !!document.getElementById('sendTropeToAi')?.checked;
    const openingScene = document.getElementById('guide_opening_scene')?.value.trim() || '';
    const wordCount = document.getElementById('aiOpeningWordCount')?.value.trim() || '800-1000字';
    const instructionsEl = document.getElementById('aiInstructionsOpening');
    const instructions = instructionsEl?.value.trim() || AI_OPENING_INSTRUCTIONS_DEFAULT;
    const tropeBlock = (sendTrope && trope) ? `<trope>\n${trope}\n</trope>\n\n` : '';
    const pronounsBlock = buildPersonalPronounsBlock();
    const userPortrayalBlock = buildOpeningUserPortrayalBlock();
    const charCardBlock = buildCharCardYamlForAi();
    const worldbookBlock = buildWorldbookJsonForAi();
    return `${tropeBlock}<XP_core>\n${xpCore}\n</XP_core>\n\n${charCardBlock}${worldbookBlock}${pronounsBlock}${userPortrayalBlock}<OpeningScene>\n现在，我需要你为这个角色创作故事的开场白：\n${openingScene}\n</OpeningScene>\n\n<WordCount>\n${wordCount}\n</WordCount>\n\n<instructions_opening>\n${instructions}\n</instructions_opening>`;
}

function buildAiMessages() {
    const persona = document.getElementById('aiPersona').value.trim();
    const trope = document.getElementById('aiTrope').value.trim();
    const sendTrope = document.getElementById('sendTropeToAi').checked;
    const xpCore = document.getElementById('aiXpCore').value.trim();
    const modules = getSelectedModules();
    const openingScene = document.getElementById('guide_opening_scene')?.value.trim() || '';
    const aboutMe = document.getElementById('guide_about_me')?.value.trim() || '';
    const wordCount = document.getElementById('aiOpeningWordCount')?.value.trim() || '800-1000字';
    const activeTab = getActiveAiSubtab();
    let instructions = '';
    if (activeTab === AI_SUBTAB_PERSONA_CARD) {
        const el = document.getElementById('aiInstructionsChar');
        instructions = el?.value.trim() || AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT;
    } else if (activeTab === AI_SUBTAB_WORLDVIEW) {
        const el = document.getElementById('aiInstructionsWorld');
        instructions = el?.value.trim() || AI_WORLDVIEW_INSTRUCTIONS_DEFAULT;
    } else if (activeTab === AI_SUBTAB_USER_PERSONA) {
        const el = document.getElementById('aiInstructionsUser');
        instructions = el?.value.trim() || AI_USER_PERSONA_INSTRUCTIONS_DEFAULT;
    } else if (activeTab === AI_SUBTAB_OPENING) {
        const el = document.getElementById('aiInstructionsOpening');
        instructions = el?.value.trim() || AI_OPENING_INSTRUCTIONS_DEFAULT;
    } else if (activeTab === AI_SUBTAB_FRONTEND_DECOR) {
        const el = document.getElementById('aiInstructionsStatus');
        instructions = el?.value.trim() || AI_STATUS_INSTRUCTIONS_DEFAULT;
    }

    const tropeBlock = (sendTrope && trope) ? `<trope>\n${trope}\n</trope>\n\n` : '';
    const systemMsg = `<persona>\n${persona}\n</persona>`;
    let userMsg = '';

    if (isOpeningMode()) {
        const pronounsBlock = buildPersonalPronounsBlock();
        const userPortrayalBlock = buildOpeningUserPortrayalBlock();
        const charCardBlock = buildCharCardYamlForAi();
        const worldbookBlock = buildWorldbookJsonForAi();
        userMsg = `${tropeBlock}<XP_core>\n${xpCore}\n</XP_core>\n\n${charCardBlock}${worldbookBlock}${pronounsBlock}${userPortrayalBlock}<OpeningScene>\n现在，我需要你为这个角色创作故事的开场白：\n${openingScene}\n</OpeningScene>\n\n<WordCount>\n${wordCount}\n</WordCount>\n\n<instructions_opening>\n${instructions}\n</instructions_opening>`;
    } else if (isUserPersonaMode()) {
        const guideTexts = modules.map(m => {
            const guideEl = document.getElementById('guide_' + m);
            const guideText = guideEl ? guideEl.value.trim() : '';
            return guideText ? `${MODULE_JSON_SCHEMA[m] || `<${m}></${m}>`}\n${guideText}` : '';
        }).filter(Boolean);

        const charCardBlock = buildCharCardYamlForAi();
        const worldbookBlock = buildWorldbookJsonForAi();
        userMsg = `${tropeBlock}<XP_core>\n${xpCore}\n</XP_core>\n\n${charCardBlock}${worldbookBlock}<about_me>\n${aboutMe}\n</about_me>\n\n<requested_modules>\n${modules.join('、')}\n</requested_modules>\n\n<module_guides>\n${guideTexts.join('\n\n')}\n</module_guides>\n\n<instructiongs_user>\n${instructions}\n</instructiongs_user>`;
    } else if (isFrontendDecorMode()) {
        const charCardBlock = buildCharCardYamlForAi();
        const worldbookBlock = buildWorldbookJsonForAi();
        const statusStyle = document.getElementById('guide_status_style')?.value.trim() || '';
        userMsg = `${tropeBlock}<XP_core>\n${xpCore}\n</XP_core>\n\n${charCardBlock}${worldbookBlock}<status_style>\n${statusStyle}\n</status_style>\n\n<instructions_status>\n${instructions}\n</instructions_status>`;
    } else {
        const moduleNames = modules.map(m => MODULE_LABELS[m] || m).join('、');
        const guideTexts = modules.map(m => {
            const guideEl = document.getElementById('guide_' + m);
            const guideText = guideEl ? guideEl.value.trim() : '';
            return guideText ? `【${MODULE_LABELS[m] || m}】${guideText}` : '';
        }).filter(Boolean);

        // ==== 根据子标签选择不同的 JSON schema ====
        // 人设卡：按模块拼出各字段；
        // 世界观：根据勾选的世界书子模块，动态组合 worldbook 内部结构，
        //        只包含用户勾选生成的字段，避免 AI 误填未请求部分。

        let selectedSchema = [];
        if (activeTab === AI_SUBTAB_WORLDVIEW) {
            const worldbookFields = modules
                .map(m => MODULE_JSON_SCHEMA[m] || '')
                .filter(Boolean);
            if (worldbookFields.length) {
                // 生成形如："worldbook": { ... } 的整体结构，但内部字段只包含勾选的那些
                const inner = worldbookFields.join(',\n');
                selectedSchema = [
                    `  "worldbook": {\n${inner}\n  }`
                ];
            } else {
                selectedSchema = [];
            }
        } else {
            selectedSchema = modules.map(m => MODULE_JSON_SCHEMA[m] || '').filter(Boolean);
        }

        const schemaHeader = '请严格按照以下 JSON 结构回复，不要包含任何其他文字或 markdown 标记。只需填写被请求的模块，其余留空。';
        const dynamicInstructions = (instructions || (activeTab === AI_SUBTAB_WORLDVIEW ? AI_WORLDVIEW_INSTRUCTIONS_DEFAULT : AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT))
            + '\n\n' + schemaHeader;

        // 人设卡 YAML / 世界书 JSON 作为参考内容，由两个独立复选框控制
        const charCardBlock = buildCharCardYamlForAi();
        const worldbookBlock = buildWorldbookJsonForAi();

        // 起名参考只用于人设卡子标签
        const namingRef = (activeTab === AI_SUBTAB_WORLDVIEW) ? '' : buildNamerPoolBlock();
        const instructionsTag = (activeTab === AI_SUBTAB_WORLDVIEW) ? 'instructions_worldinfo' : 'instructions_char';
        userMsg = `${tropeBlock}<XP_core>\n${xpCore}\n</XP_core>\n\n<requested_modules>\n${moduleNames}\n</requested_modules>\n\n${namingRef}${charCardBlock}${worldbookBlock}<module_guides>\n${guideTexts.join('\n\n')}\n</module_guides>\n\n<reply_json_schema>\n{\n${selectedSchema.join(',\n')}\n}\n</reply_json_schema>\n\n<${instructionsTag}>\n${dynamicInstructions}\n</${instructionsTag}>`;
    }

    return { systemMsg, userMsg, modules };
}

function togglePromptPreview() {
    const preview = document.getElementById('aiPromptPreviewContent');
    const toggle = document.getElementById('promptPreviewToggle');
    if (!preview || !toggle) return;
    if (preview.style.display === 'none') {
        preview.style.display = '';
        toggle.classList.add('open');
        updatePromptPreview();
    } else {
        preview.style.display = 'none';
        toggle.classList.remove('open');
    }
}

function updatePromptPreview() {
    const el = document.getElementById('aiPromptPreviewContent');
    if (!el || el.style.display === 'none') return;
    const { systemMsg, userMsg } = buildAiMessages();
    el.textContent = `[system]\n${systemMsg}\n\n[user]\n${userMsg}`;
}

function pruneEmptyDeep(value) {
    if (Array.isArray(value)) {
        return value
            .map(v => pruneEmptyDeep(v))
            .filter(v => !(v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)));
    }
    if (value && typeof value === 'object') {
        const out = {};
        Object.entries(value).forEach(([k, v]) => {
            const cleaned = pruneEmptyDeep(v);
            const isEmpty = cleaned === '' || cleaned === null || cleaned === undefined || (Array.isArray(cleaned) && cleaned.length === 0) || (typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0);
            if (!isEmpty) out[k] = cleaned;
        });
        return out;
    }
    return typeof value === 'string' ? value.trim() : value;
}

function buildExistingContentForModules(modules) {
    const f = serializeForm();
    const arr = k => (f[k] || []).map(v => String(v || '').trim()).filter(Boolean);
    const out = {};

    if (modules.includes('basic')) {
        out.basic = { char_name: f.char_name || '', chinese_name: f.chinese_name || '', nickname: f.nickname || '', age: f.age || '', birthday_date: f.birthday_date || '', birthday_zodiac: f.birthday_zodiac || '', gender: f.gender || '', height: f.height || '', identity: arr('identity-container'), archetype: arr('archetype-container'), social: arr('social-container') };
    }
    if (modules.includes('background')) {
        out.background = { childhood_range: f.age_range_childhood || '', childhood: arr('childhood-container'), teenage_range: f.age_range_teenage || '', teenage: arr('teenage-container'), youth_range: f.age_range_youth || '', youth: arr('youth-container'), current_range: f.age_range_current || '', current: arr('current-container') };
    }
    if (modules.includes('appearance')) {
        out.appearance = { hair: f.hair || '', eyes: f.eyes || '', skin: f.skin || '', face_style: f.face_style || '', build: arr('build-container'), attire_formal: f.attire_formal || '', attire_business: f.attire_business || '', attire_casual: f.attire_casual || '', attire_home: f.attire_home || '' };
    }
    if (modules.includes('personality')) {
        out.personality = { core_traits: arr('core-traits-container'), romantic_traits: arr('romantic-traits-container'), weakness: arr('weakness-container'), likes: arr('likes-container'), dislikes: arr('dislikes-container'), goals: arr('goals-container') };
    }
    if (modules.includes('user_relation')) {
        out.user_relation = { past_events: arr('past_events-container'), impression: arr('impression-container'), notes: arr('relation_notes-container') };
    }
    if (modules.includes('behavior')) {
        out.behavior = { lifestyle: arr('lifestyle-container'), work_behaviors: arr('work-container'), emotional_angry: f.emotional_angry || '', emotional_happy: f.emotional_happy || '', emotional_sad: f.emotional_sad || '', boundaries: arr('boundaries-container'), work_skills: arr('work-skills-container'), life_skills: arr('life-skills-container'), hobby_skills: arr('hobby-skills-container') };
    }
    if (modules.includes('speech')) {
        out.speech = { speech_with_user: f.speech_with_user || '', speech_reasoning: f.speech_reasoning || '', speech_accent: f.speech_accent || '', speech_online: f.speech_online || '' };
    }
    if (modules.includes('extra')) {
        out.extra = { additional_notes: f.additional_notes || '', catchphrases: arr('catchphrase-container'), mannerisms: arr('mannerisms-container'), trauma: arr('trauma-container'), values: arr('values-container'), conflicts: arr('conflicts-container'), secrets: arr('secrets-container'), relationships: arr('relationships-container'), defining_moments: arr('defining-moments-container') };
    }
    if (modules.includes('nsfw')) {
        out.nsfw = { experiences: f.nsfw_experiences || '', sexual_orientation: f.nsfw_orientation || '', sexual_role: arr('nsfw-role-container'), sexual_habits: arr('nsfw-habits-container'), kinks: arr('kinks-container'), limits: arr('limits-container') };
    }

    const cleaned = pruneEmptyDeep(out);
    return Object.keys(cleaned).length ? JSON.stringify(cleaned, null, 2) : '';
}

// 世界书：构建当前表单内容的 JSON，供世界观子标签在 prompt 中作为参考
function buildExistingWorldbookContent() {
    const v = id => (document.getElementById(id)?.value || '').trim();
    // 复用 export/yaml.js 中的数组读取逻辑（若不可用则优雅降级）
    const getArr = (cid, cls) => {
        if (typeof getArrayValues === 'function') return getArrayValues(cid, cls);
        const container = document.getElementById(cid);
        if (!container) return [];
        return Array.from(container.querySelectorAll('.' + cls))
            .map(el => el.value.trim())
            .filter(Boolean);
    };

    const worldbook = {
        statusbar: v('world_statusbar'),
        era_background: v('world_era_background'),
        special_settings: v('world_special_settings'),
        npcs: getArr('world_npc-container', 'world_npc-item'),
        frontend_decor: v('world_frontend_decor'),
        persona_correction: v('world_persona_correction'),
        state_specified: v('world_state_specified'),
        extra: v('world_extra')
    };

    const cleaned = pruneEmptyDeep(worldbook);
    if (!cleaned || Object.keys(cleaned).length === 0) return '';
    return JSON.stringify({ worldbook: cleaned }, null, 2);
}

// 用户手写的自定义世界书只作为只读上下文发送，不进入 AI 生成 schema 或回填流程。
function buildUserDefinedWorldbookForAi() {
    if (typeof collectCustomWorldbookEntries !== 'function') return '';
    const entries = collectCustomWorldbookEntries()
        .map((entry, index) => ({
            title: String(entry.title || '').trim() || `自定义条目 ${index + 1}`,
            content: String(entry.content || '').trim()
        }))
        .filter(entry => entry.content);
    if (!entries.length) return '';

    const safeXmlText = text => String(text || '')
        .replace(/<\/?UserDefined\b/gi, match => match.replace('<', '&lt;'));
    const markdown = entries.map(entry => {
        const title = safeXmlText(entry.title).replace(/\r?\n/g, ' ');
        return `## ${title}\n${safeXmlText(entry.content)}`;
    }).join('\n\n');
    const block = `<UserDefined>\n${markdown}\n</UserDefined>\n\n`;
    return typeof applyUserAlias === 'function' ? applyUserAlias(block) : block;
}

// 根据复选框状态构建「人设卡 YAML」参考块
function buildCharCardYamlForAi() {
    const sendChar = !!document.getElementById('sendCharCardToAi')?.checked;
    if (!sendChar) return '';
    if (typeof generateYaml !== 'function') return '';
    const yamlCard = (generateYaml() || '').trim();
    if (!yamlCard) return '';
    return `<character_card_yaml>\n以下是这个角色当前的人设卡 YAML，请严格参考其中设定，避免与既有人设冲突：\n${yamlCard}\n</character_card_yaml>\n\n`;
}

// 根据复选框状态构建「世界书 JSON」参考块
function buildWorldbookJsonForAi() {
    const sendWorld = !!document.getElementById('sendWorldbookToAi')?.checked;
    if (!sendWorld) return '';
    const worldbookJson = buildExistingWorldbookContent();
    const standardBlock = worldbookJson
        ? `<worldbook_json>\n以下是当前世界书内容的 JSON，请参考其中的世界观设定和剧情语境，但不要整段抄录：\n${worldbookJson}\n</worldbook_json>\n\n`
        : '';
    return standardBlock + buildUserDefinedWorldbookForAi();
}

function updateModulePreview() { updatePromptPreview(); }

function bindModuleCheckboxes() {
    document.querySelectorAll('input[name="aiModule"]').forEach(cb => {
        cb.addEventListener('change', () => {
            persistAiUiState();
            updateModulePreview();
            updatePromptPreview();
            scheduleCloudConfigSync();
        });
    });
}

function bindAiSubTabEvents() {
    document.querySelectorAll('.ai-subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ai-subtab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.ai-subtab-panel').forEach(panel => panel.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById('ai-subtab-' + btn.dataset.aiTab);
            if (panel) panel.classList.add('active');
            AppState.aiActiveSubtab = btn.dataset.aiTab;
            persistAiUiState();
            syncAiTabUI();
            updateModulePreview();
            updatePromptPreview();
            refreshAiCacheDisplay();
            scheduleCloudConfigSync();
        });
    });

    const instructionsMap = [
        [AI_SUBTAB_PERSONA_CARD, 'aiInstructionsChar'],
        [AI_SUBTAB_WORLDVIEW, 'aiInstructionsWorld'],
        [AI_SUBTAB_USER_PERSONA, 'aiInstructionsUser'],
        [AI_SUBTAB_OPENING, 'aiInstructionsOpening'],
        [AI_SUBTAB_FRONTEND_DECOR, 'aiInstructionsStatus']
    ];
    instructionsMap.forEach(([tabKey, elId]) => {
        const el = document.getElementById(elId);
        if (!el) return;
        el.addEventListener('input', () => {
            AppState.aiInstructionDrafts[tabKey] = el.value;
            persistAiUiState();
            scheduleCloudConfigSync();
            updateModulePreview();
            updatePromptPreview();
        });
    });

    ['guide_opening_scene', 'guide_about_me', 'guide_status_style', 'aiOpeningWordCount', 'aiXpCore'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                persistAiUiState();
                if (isOpeningMode() || isUserPersonaMode() || isFrontendDecorMode()) updateModulePreview();
                updatePromptPreview();
                scheduleCloudConfigSync();
            });
        }
    });

    ['aiPersona', 'aiTrope', 'aiXpCore', 'sendTropeToAi', 'sendCharCardToAi', 'sendWorldbookToAi', 'useNamerPoolForAi', 'sendPersonalPronounsToAi'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const eventName = el.type === 'checkbox' ? 'change' : 'input';
        el.addEventListener(eventName, () => {
            persistAiUiState();
            updatePromptPreview();
            scheduleCloudConfigSync();
        });
    });

    const enableStreamEl = document.getElementById('enableStream');
    if (enableStreamEl) {
        enableStreamEl.addEventListener('change', () => {
            persistAiUiState();
            scheduleCloudConfigSync();
        });
    }

    document.querySelectorAll('input[name="charPronounMode"], input[name="userPronounMode"]').forEach(el => {
        el.addEventListener('change', () => {
            persistAiUiState();
            scheduleCloudConfigSync();
            updatePromptPreview();
        });
    });

    document.querySelectorAll('input[name="openingUserPortrayalMode"]').forEach(el => {
        el.addEventListener('change', () => {
            persistAiUiState();
            scheduleCloudConfigSync();
            updatePromptPreview();
        });
    });

    document.querySelectorAll('[id^="guide_"]').forEach(el => {
        el.addEventListener('input', () => {
            persistAiUiState();
            updatePromptPreview();
            scheduleCloudConfigSync();
        });
    });

    updateAiInstructionsByActiveTab(true);
    syncAiTabUI();
    persistAiUiState();
    refreshAiCacheDisplay();
}

function extractJsonFromText(rawText) {
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
        let jsonStr = cleaned.slice(start, end + 1);
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.warn('[JSON整体解析失败，尝试正则逐块提取]', e.message);
        }
    }

    const result = {};
    const moduleKeys = ['basic', 'background', 'appearance', 'personality', 'user_relation', 'behavior', 'speech', 'extra', 'nsfw'];
    for (let i = 0; i < moduleKeys.length; i++) {
        const key = moduleKeys[i];
        const regex = new RegExp(`"${key}"\\s*:\\s*\\{`);
        const match = regex.exec(cleaned);
        if (!match) continue;
        let braceCount = 0;
        const blockStart = match.index + match[0].length - 1;
        let blockEnd = -1;
        for (let j = blockStart; j < cleaned.length; j++) {
            if (cleaned[j] === '{') braceCount++;
            else if (cleaned[j] === '}') {
                braceCount--;
                if (braceCount === 0) { blockEnd = j; break; }
            }
        }
        if (blockEnd > blockStart) {
            let blockStr = cleaned.slice(blockStart, blockEnd + 1);
            blockStr = blockStr.replace(/,\s*([\]}])/g, '$1');
            try { result[key] = JSON.parse(blockStr); } catch (e) { console.warn(`[正则提取模块 ${key} 解析失败]`, e.message); }
        }
    }
    return Object.keys(result).length > 0 ? result : null;
}

// 针对世界观 / 世界书子标签，从 AI 回复中提取 worldbook 结构
function extractWorldbookFromText(rawText) {
    let cleaned = String(rawText || '').trim();
    if (!cleaned) return null;

    // 去掉可能的 ```json 包裹
    cleaned = cleaned
        .replace(/^```(?:json|JSON)?\s*\n?/, '')
        .replace(/\n?\s*```\s*$/, '')
        .trim();

    // 尝试整体解析
    const tryParse = (text) => {
        try { return JSON.parse(text); } catch (e) { return null; }
    };

    let obj = tryParse(cleaned);
    if (obj && typeof obj === 'object') {
        // 兼容两种结构：
        // 1) { "worldbook": { ... } }
        // 2) 直接就是 { "statusbar": "...", ... }（万一模型少包了一层）
        if (obj.worldbook && typeof obj.worldbook === 'object') return obj.worldbook;
        const keys = Object.keys(obj);
        const expected = ['statusbar','era_background','special_settings','npcs','frontend_decor','persona_correction','state_specified','extra'];
        const hasAny = expected.some(k => Object.prototype.hasOwnProperty.call(obj, k));
        if (hasAny) return obj;
    }

    // 回退：用正则尝试抓取 "worldbook": { ... } 结构
    const wbMatch = /"worldbook"\s*:\s*\{/.exec(cleaned);
    if (wbMatch) {
        let braceCount = 0;
        const start = wbMatch.index + wbMatch[0].indexOf('{');
        let end = -1;
        for (let i = start; i < cleaned.length; i++) {
            const ch = cleaned[i];
            if (ch === '{') braceCount++;
            else if (ch === '}') {
                braceCount--;
                if (braceCount === 0) { end = i; break; }
            }
        }
        if (end > start) {
            let block = cleaned.slice(start, end + 1);
            block = block.replace(/,\s*([\]}])/g, '$1');
            const parsed = tryParse(block);
            if (parsed && typeof parsed === 'object') return parsed;
        }
    }

    return null;
}

function extractTagContent(rawText, tagName) {
    const text = String(rawText || '');
    if (!text.trim() || !tagName) return '';
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = regex.exec(text);
    return match ? match[1].trim() : '';
}

function extractFrontendDecorFromText(rawText) {
    const statusPrompt = extractTagContent(rawText, 'status_prompt');
    const statusRegexText = extractTagContent(rawText, 'status_regex');
    let statusRegexJson = null;

    if (statusRegexText) {
        try {
            statusRegexJson = JSON.parse(statusRegexText);
        } catch (e) {
            const start = statusRegexText.indexOf('{');
            const end = statusRegexText.lastIndexOf('}');
            if (start !== -1 && end > start) {
                try {
                    statusRegexJson = JSON.parse(statusRegexText.slice(start, end + 1));
                } catch (_) {}
            }
        }
    }

    return {
        statusPrompt,
        statusRegexText,
        statusRegexJson
    };
}

function copyRawReply() {
    const content = document.getElementById('aiRawReplyContent').textContent;
    navigator.clipboard.writeText(content).then(() => showToast('📋 已复制AI原始回复'));
}

function setGenerateUiState(isGenerating) {
    const btn = document.getElementById('btnGenerate');
    const stopBtn = document.getElementById('btnStopGenerate');
    if (btn) btn.disabled = !!isGenerating;
    if (stopBtn) stopBtn.style.display = isGenerating ? '' : 'none';
    const continueBtn = document.getElementById('btnContinueGenerate');
    if (continueBtn) continueBtn.disabled = !!isGenerating;
}

function stopGenerateAI() {
    if (!AppState.currentAbortController) {
        showToast('当前没有正在进行的生成任务');
        return;
    }
    AppState.currentAbortController.abort();
    setGenerateUiState(false);
    setAiStatus('⚠️ 已手动停止生成', '');
}

async function generateWithAI() {
    const baseUrl = document.getElementById('aiBaseUrl').value.trim().replace(/\/+$/, '');
    const apiKey = document.getElementById('aiApiKey').value.trim();
    const xpCore = document.getElementById('aiXpCore').value.trim();
    const { systemMsg, userMsg, modules } = buildAiMessages();
    const useStream = document.getElementById('enableStream').checked;
    const openingScene = document.getElementById('guide_opening_scene')?.value.trim() || '';
    const aboutMe = document.getElementById('guide_about_me')?.value.trim() || '';

    if (!baseUrl) { showToast('请先填写 API 地址'); return; }
    if (!AppState.selectedModel) { showToast('请先获取并选择一个模型'); return; }
    if (!xpCore) { showToast('请填写"这次我想要…"'); return; }
    if (!isOpeningMode() && !isFrontendDecorMode() && modules.length === 0) { showToast('请至少勾选一个生成模块'); return; }
    if (isOpeningMode() && !openingScene) { showToast('请填写开场白需求描述'); return; }
    if (isUserPersonaMode() && !aboutMe) { showToast('请先填写 <about_me>，简单描述你想要的 user'); return; }

    const tabKey = getActiveAiSubtab();
    // 记录本次请求使用的 system / user 消息，供“继续生成”复用
    AppState.aiLastSystemMsgs = AppState.aiLastSystemMsgs || {}; 
    AppState.aiLastUserMsgs = AppState.aiLastUserMsgs || {};
    AppState.aiLastSystemMsgs[tabKey] = systemMsg;
    AppState.aiLastUserMsgs[tabKey] = userMsg;

    setGenerateUiState(true);
    setAiStatus('⏳ 生成中，请稍候…', '');
    document.getElementById('aiResultSection').style.display = 'none';

    const rawReplySection = document.getElementById('aiRawReplySection');
    rawReplySection.style.display = '';
    const rawReplyContent = document.getElementById('aiRawReplyContent');
    rawReplyContent.textContent = '⏳ 等待AI回复…';

    // 开始新一轮生成前，先隐藏“继续生成”按钮，避免误操作
    const continueBtn = document.getElementById('btnContinueGenerate');
    if (continueBtn) {
        continueBtn.style.display = 'none';
        continueBtn.disabled = true;
    }

    try {
        let raw = '';
        if (useStream) raw = await generateStream(baseUrl, apiKey, systemMsg, userMsg, modules, rawReplyContent);
        else raw = await generateNonStream(baseUrl, apiKey, systemMsg, userMsg, modules, rawReplyContent);

        if (raw && raw.trim()) {
            processAiResult(raw, modules);
            if (continueBtn) {
                continueBtn.style.display = '';
                continueBtn.disabled = false;
            }
        } else {
            setAiStatus('⚠️ 未收到任何内容', 'error');
        }
    } catch (err) {
        console.error('[AI Generate Error]', err);
        setAiStatus(`❌ 出错：${err.message}`, 'error');
    } finally {
        setGenerateUiState(false);
        AppState.currentAbortController = null;
    }
}

// 基于上一次请求与回复进行续写
async function continueGenerateWithAI() {
    const baseUrl = document.getElementById('aiBaseUrl').value.trim().replace(/\/+$/, '');
    const apiKey = document.getElementById('aiApiKey').value.trim();
    const useStream = document.getElementById('enableStream')?.checked;
    const tabKey = getActiveAiSubtab();

    if (!baseUrl) { showToast('请先填写 API 地址'); return; }
    if (!AppState.selectedModel) { showToast('请先获取并选择一个模型'); return; }

    const lastSystem = AppState.aiLastSystemMsgs?.[tabKey];
    const lastUser = AppState.aiLastUserMsgs?.[tabKey];
    if (!lastSystem || !lastUser) {
        showToast('当前没有可续写的请求，请先点击“AI 开始生成”完成一次生成。');
        return;
    }

    const rawReplySection = document.getElementById('aiRawReplySection');
    const rawReplyContent = document.getElementById('aiRawReplyContent');
    if (!rawReplySection || !rawReplyContent) return;

    // 读取上一条回复文本 & 模块信息
    const cache = typeof getCurrentCharAiCache === 'function' ? getCurrentCharAiCache(tabKey) : null;
    const normalizedCache = normalizeAiCacheEntry(cache, tabKey);
    const prevRaw = (normalizedCache && normalizedCache.raw) 
        ? String(normalizedCache.raw)
        : String(rawReplyContent.textContent || '');
    const modules = (normalizedCache && Array.isArray(normalizedCache.modules) && normalizedCache.modules.length)
        ? normalizedCache.modules
        : (AppState.aiLastModules || []);

    if (!prevRaw.trim()) {
        showToast('当前没有上一条 AI 回复内容，无法续写。');
        return;
    }

    const CONTINUE_SYSTEM_MSG = '上一条消息被截断了。请严格从中断的地方继续生成，不要重复前面的任何内容。';
    const messages = [
        { role: 'system', content: lastSystem },
        { role: 'user', content: lastUser },
        { role: 'assistant', content: prevRaw },
        { role: 'system', content: CONTINUE_SYSTEM_MSG }
    ];

    setGenerateUiState(true);
    setAiStatus('⏳ 正在续写，请稍候…', '');
    rawReplySection.style.display = '';

    const continueBtn = document.getElementById('btnContinueGenerate');
    if (continueBtn) continueBtn.disabled = true;

    try {
        let newRaw = '';
        if (useStream) newRaw = await generateStream(baseUrl, apiKey, null, null, modules, rawReplyContent, messages);
        else newRaw = await generateNonStream(baseUrl, apiKey, null, null, modules, rawReplyContent, messages);

        if (newRaw && newRaw.trim()) {
            const concatenated = prevRaw + newRaw;
            rawReplyContent.textContent = concatenated;
            rawReplyContent.scrollTop = rawReplyContent.scrollHeight;
            processAiResult(concatenated, modules);
            if (continueBtn) {
                continueBtn.style.display = '';
                continueBtn.disabled = false;
            }
        } else {
            setAiStatus('⚠️ 续写请求未返回任何新内容', 'error');
            if (continueBtn) continueBtn.disabled = false;
        }
    } catch (err) {
        console.error('[AI Continue Error]', err);
        setAiStatus(`❌ 续写出错：${err.message}`, 'error');
        if (continueBtn) continueBtn.disabled = false;
    } finally {
        setGenerateUiState(false);
        AppState.currentAbortController = null;
    }
}

async function generateNonStream(baseUrl, apiKey, systemMsg, userMsg, modules, rawReplyEl, overrideMessages) {
    let res;
    try {
        res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: AppState.selectedModel,
                messages: (overrideMessages && Array.isArray(overrideMessages) && overrideMessages.length)
                    ? overrideMessages
                    : [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
                temperature: 0.85,
                stream: false
            })
        });
    } catch (fetchErr) {
        throw new Error(`网络请求失败：${fetchErr.message}`);
    }
    if (!res.ok) {
        let errBody = '';
        try { errBody = await res.text(); } catch (_) {}
        throw new Error(`HTTP ${res.status} — ${(errBody || '').slice(0, 500)}`);
    }
    let data;
    try { data = await res.json(); } catch (jsonErr) { throw new Error(`非JSON响应: ${jsonErr.message}`); }
    const raw = data.choices?.[0]?.message?.content || '';
    if (!raw) throw new Error('API返回的choices为空');
    rawReplyEl.textContent = raw;
    return raw;
}

async function generateStream(baseUrl, apiKey, systemMsg, userMsg, modules, rawReplyEl, overrideMessages) {
    AppState.currentAbortController = new AbortController();
    let res;
    try {
        res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: AppState.selectedModel,
                messages: (overrideMessages && Array.isArray(overrideMessages) && overrideMessages.length)
                    ? overrideMessages
                    : [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
                temperature: 0.85,
                stream: true
            }),
            signal: AppState.currentAbortController.signal
        });
    } catch (fetchErr) {
        if (fetchErr.name === 'AbortError') { setAiStatus('⚠️ 已中断', ''); return; }
        throw new Error(`网络请求失败：${fetchErr.message}`);
    }
    if (!res.ok) {
        let errBody = '';
        try { errBody = await res.text(); } catch (_) {}
        throw new Error(`HTTP ${res.status} — ${(errBody || '').slice(0, 500)}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    rawReplyEl.textContent = '';
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;
                const dataStr = trimmed.slice(5).trim();
                if (dataStr === '[DONE]') continue;
                try {
                    const chunk = JSON.parse(dataStr);
                    const delta = chunk.choices?.[0]?.delta?.content || '';
                    if (delta) {
                        fullText += delta;
                        rawReplyEl.textContent = fullText;
                        rawReplyEl.scrollTop = rawReplyEl.scrollHeight;
                    }
                } catch (e) {}
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') setAiStatus('⚠️ 已中断，已接收到的内容已显示', '');
        else console.warn('[Stream read error]', err);
    }
    if (fullText) {
        rawReplyEl.textContent = fullText;
        return fullText;
    }
    return '';
}

function processAiResult(raw, modules) {
    const tabKey = getActiveAiSubtab();
    saveCurrentCharAiCache(tabKey, buildAiCachePayload(raw, modules));
    persistAiUiState();
    AppState.aiLastModules = Array.isArray(modules) ? modules : [];
    if (isOpeningMode()) {
        AppState.aiLastJson = null;
        showAiResult(raw, []);
        setAiStatus('✅ 开场白生成成功！', 'success');
        return;
    }
    if (isUserPersonaMode()) {
        AppState.aiLastJson = null;
        showAiResult(raw, modules);
        setAiStatus('✅ user 人设生成成功！', 'success');
        return;
    }
    if (isFrontendDecorMode()) {
        AppState.aiLastJson = extractFrontendDecorFromText(raw);
        showAiResult(raw, modules);
        setAiStatus('✅ 前端美化生成成功！', 'success');
        return;
    }
    if (tabKey === AI_SUBTAB_WORLDVIEW) AppState.aiLastJson = extractWorldbookFromText(raw);
    else AppState.aiLastJson = extractJsonFromText(raw);
    if (AppState.aiLastJson) {
        showAiResult(raw, modules);
        setAiStatus('✅ 生成成功！确认后点击"填入表单"', 'success');
    } else {
        showAiResult(raw, modules);
        setAiStatus('⚠️ 无法自动解析JSON，但原始内容已显示。你可以手动复制修正。', 'error');
    }
}

function setAiStatus(text, cls) {
    const el = document.getElementById('aiGenerateStatus') || document.getElementById('aiStatusText');
    if (!el) return;
    el.textContent = text;
    el.className = 'ai-status-text' + (cls ? ' ' + cls : '');
}

function showAiResult(raw, modules) {
    const section = document.getElementById('aiResultSection');
    const decorSection = document.getElementById('aiDecorResultSection');
    
    if (isFrontendDecorMode()) {
        section.style.display = 'none';
        if (decorSection) {
            decorSection.style.display = '';
            renderDecorPreview();
        }
        return;
    }

    if (decorSection) decorSection.style.display = 'none';
    section.style.display = '';
    const badges = document.getElementById('aiFillBadges');
    badges.innerHTML = (modules || []).length
        ? modules.map(m => `<span class="ai-fill-badge">${MODULE_LABELS[m] || m}</span>`).join('')
        : (isOpeningMode() ? '<span class="ai-fill-badge">开场白</span>' : '');
    document.getElementById('aiRawResult').textContent = raw;
    const shouldHideResult = !isOpeningMode() && !(modules || []).length && !AppState.aiLastJson && !String(raw || '').trim();
    if (shouldHideResult) section.style.display = 'none';
}

function renderDecorPreview() {
    const container = document.getElementById('decorPreviewArea');
    const promptContainer = document.getElementById('decorPromptPreviewArea');
    const regexContainer = document.getElementById('decorRegexPreviewArea');
    if (!container) return;
    const data = AppState.aiLastJson;
    const promptText = data?.statusPrompt || '';
    const regexJson = data?.statusRegexJson || null;
    const regexText = data?.statusRegexText || '';

    if (promptContainer) {
        promptContainer.textContent = promptText || '暂无可用的 <status_prompt> 内容。';
    }
    if (regexContainer) {
        regexContainer.textContent = regexJson
            ? JSON.stringify(regexJson, null, 2)
            : (regexText || '暂无可用的 <status_regex> 内容。');
    }

    if (!regexJson || !regexJson.replaceString) {
        container.innerHTML = '<div style="color:var(--text-sub); text-align:center;">暂无有效的 HTML 预览内容，请检查 AI 回复中的 <status_regex> JSON 是否完整。</div>';
        return;
    }
    
    let html = regexJson.replaceString;
    // Remove group references like $1, $2 with empty strings for preview
    html = html.replace(/\$\d+/g, '');
    container.innerHTML = html;
}

function copyDecorPrompt() {
    const data = AppState.aiLastJson;
    if (!data || !data.statusPrompt) {
        showToast('⚠️ 未找到提取的状态栏提示词');
        return;
    }
    navigator.clipboard.writeText(data.statusPrompt).then(() => showToast('📋 已复制状态栏提示词'));
}

function importDecorPromptToWorldStatusbar() {
    const data = AppState.aiLastJson;
    const promptText = String(data?.statusPrompt || '').trim();
    if (!promptText) {
        showToast('⚠️ 未找到可导入的 <status_prompt> 内容');
        return;
    }

    const target = document.getElementById('world_statusbar');
    if (!target) {
        showToast('⚠️ 未找到世界书中的“状态栏”输入框');
        return;
    }

    const existing = String(target.value || '').trim();
    if (existing && existing !== promptText) {
        const shouldReplace = confirm('世界书 → 状态栏 已有内容，是否用当前 AI 提取的状态栏提示词覆盖？');
        if (!shouldReplace) return;
    }

    target.value = promptText;

    // 自动切换到“世界书”页，方便用户立即检查
    document.querySelectorAll('.top-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.top-tab-content').forEach(panel => panel.classList.remove('active'));
    const worldTabBtn = document.querySelector('.top-tab-btn[data-tab="world-book"]');
    const worldTabPanel = document.getElementById('tab-world-book');
    if (worldTabBtn) worldTabBtn.classList.add('active');
    if (worldTabPanel) worldTabPanel.classList.add('active');

    target.focus();
    target.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof triggerAutoSave === 'function') triggerAutoSave();

    showToast('📥 已导入到世界书 → 状态栏');
}

function downloadDecorJson() {
    const data = AppState.aiLastJson;
    const regexJson = data?.statusRegexJson;
    if (!regexJson) {
        showToast('⚠️ 无可用数据');
        return;
    }
    const exportData = {
        ...regexJson,
        scriptName: regexJson.scriptName || '状态栏'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regex-状态栏.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 正在下载正则文件');
}

// 将 AI 解析后的结果填回表单
function fillFormFromAI() {
    const d = AppState.aiLastJson;
    const tabKey = getActiveAiSubtab();
    if (!d) {
        showToast('⚠️ 当前没有可用的解析结果，请先让 AI 生成并成功解析 JSON');
        return;
    }

    const filled = [];

    // ===== 世界观 / 世界书填充逻辑 =====
    if (tabKey === AI_SUBTAB_WORLDVIEW) {
        function setVal(id, val) {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null && val !== '') el.value = val;
        }
        function fillArray(containerId, cls, values, isTextarea) {
            if (!values || !values.length) return;
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            values.forEach(v => {
                if (!v) return;
                const div = document.createElement('div');
                div.className = 'array-item';
                const el = document.createElement(isTextarea ? 'textarea' : 'input');
                if (!isTextarea) el.type = 'text';
                el.className = cls;
                el.value = v;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-remove';
                btn.textContent = '✕';
                btn.onclick = function() { removeArrayItem(this); };
                div.appendChild(el);
                div.appendChild(btn);
                container.appendChild(div);
            });
        }

        if (d.statusbar !== undefined) { setVal('world_statusbar', d.statusbar); filled.push('状态栏'); }
        if (d.era_background !== undefined) { setVal('world_era_background', d.era_background); filled.push('时代背景'); }
        if (d.special_settings !== undefined) { setVal('world_special_settings', d.special_settings); filled.push('特殊设定'); }

        // NPCs：兼容 AI 返回字符串数组或对象数组两种形式
        // 例如：
        // "npcs": [
        //   { "name": "许承明", "relation": "…", "function": "…", "traits": "…" },
        //   ...
        // ]
        if (Array.isArray(d.npcs)) {
            const npcTexts = d.npcs
                .map(n => {
                    if (!n) return '';
                    if (typeof n === 'string') return n; // 旧格式：直接就是一段描述
                    if (typeof n === 'object') {
                        const lines = [];
                        if (n.name) lines.push(`【姓名】${n.name}`);
                        if (n.relation) lines.push(`【关系】${n.relation}`);
                        if (n.function) lines.push(`【作用】${n.function}`);
                        if (n.traits) lines.push(`【特征】${n.traits}`);
                        const text = lines.join('\n').trim();
                        return text || '';
                    }
                    return '';
                })
                .filter(Boolean);

            if (npcTexts.length) {
                fillArray('world_npc-container', 'world_npc-item', npcTexts, true);
                filled.push('NPCs');
            }
        }

        if (d.frontend_decor !== undefined) { setVal('world_frontend_decor', d.frontend_decor); filled.push('前端美化'); }
        if (d.persona_correction !== undefined) { setVal('world_persona_correction', d.persona_correction); filled.push('人设纠偏'); }
        if (d.state_specified !== undefined) { setVal('world_state_specified', d.state_specified); filled.push('指定状态'); }
        if (d.extra !== undefined) { setVal('world_extra', d.extra); filled.push('额外补充'); }

        triggerAutoSave();
        if (filled.length) showToast(`✨ 已填入世界书：${filled.join('、')}`);
        else showToast('⚠️ JSON 已解析，但未找到可填入世界书的字段');
        return;
    }

    // ===== 人设卡填充逻辑 =====
    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null && val !== '') el.value = val;
    }
    function fillArray(containerId, cls, values, isTextarea) {
        if (!values || !values.length) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        values.forEach(v => {
            if (!v) return;
            const div = document.createElement('div');
            div.className = 'array-item';
            const el = document.createElement(isTextarea ? 'textarea' : 'input');
            if (!isTextarea) el.type = 'text';
            el.className = cls;
            el.value = v;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-remove';
            btn.textContent = '✕';
            btn.onclick = function() { removeArrayItem(this); };
            div.appendChild(el);
            div.appendChild(btn);
            container.appendChild(div);
        });
    }

    if (d.basic) {
        setVal('char_name', d.basic.char_name); setVal('chinese_name', d.basic.chinese_name); setVal('nickname', d.basic.nickname); setVal('age', d.basic.age); setVal('birthday_date', d.basic.birthday_date); setVal('birthday_zodiac', d.basic.birthday_zodiac); setVal('gender', d.basic.gender); setVal('height', d.basic.height);
        fillArray('identity-container', 'identity-item', d.basic.identity, false);
        fillArray('archetype-container', 'archetype-item', d.basic.archetype, false);
        fillArray('social-container', 'social-item', d.basic.social, false);
        filled.push('基础信息');
    }
    if (d.background) {
        setVal('age_range_childhood', d.background.childhood_range); setVal('age_range_teenage', d.background.teenage_range); setVal('age_range_youth', d.background.youth_range); setVal('age_range_current', d.background.current_range);
        fillArray('childhood-container', 'childhood-item', d.background.childhood, true);
        fillArray('teenage-container', 'teenage-item', d.background.teenage, true);
        fillArray('youth-container', 'youth-item', d.background.youth, true);
        fillArray('current-container', 'current-item', d.background.current, true);
        filled.push('背景故事');
    }
    if (d.appearance) {
        setVal('hair', d.appearance.hair); setVal('eyes', d.appearance.eyes); setVal('skin', d.appearance.skin); setVal('face_style', d.appearance.face_style); setVal('attire_formal', d.appearance.attire_formal); setVal('attire_business', d.appearance.attire_business); setVal('attire_casual', d.appearance.attire_casual); setVal('attire_home', d.appearance.attire_home);
        fillArray('build-container', 'build-item', d.appearance.build, false);
        filled.push('外貌穿着');
    }
    if (d.personality) {
        fillArray('core-traits-container', 'core-traits-item', d.personality.core_traits, false);
        fillArray('romantic-traits-container', 'romantic-traits-item', d.personality.romantic_traits, false);
        fillArray('weakness-container', 'weakness-item', d.personality.weakness, false);
        fillArray('likes-container', 'likes-item', d.personality.likes, false);
        fillArray('dislikes-container', 'dislikes-item', d.personality.dislikes, false);
        fillArray('goals-container', 'goals-item', d.personality.goals, false);
        filled.push('性格特质');
    }
    if (d.user_relation) {
        fillArray('past_events-container', 'past_events-item', d.user_relation.past_events, true);
        fillArray('impression-container', 'impression-item', d.user_relation.impression, true);
        fillArray('relation_notes-container', 'relation_notes-item', d.user_relation.notes, true);
        filled.push('{{user}}相关');
    }
    if (d.behavior) {
        fillArray('lifestyle-container', 'lifestyle-item', d.behavior.lifestyle, true);
        fillArray('work-container', 'work-item', d.behavior.work_behaviors, true);
        fillArray('boundaries-container', 'boundaries-item', d.behavior.boundaries, true);
        fillArray('work-skills-container', 'work-skills-item', d.behavior.work_skills, false);
        fillArray('life-skills-container', 'life-skills-item', d.behavior.life_skills, false);
        fillArray('hobby-skills-container', 'hobby-skills-item', d.behavior.hobby_skills, false);
        setVal('emotional_angry', d.behavior.emotional_angry); setVal('emotional_happy', d.behavior.emotional_happy); setVal('emotional_sad', d.behavior.emotional_sad);
        filled.push('行为习惯');
    }
    if (d.speech) {
        setVal('speech_with_user', d.speech.speech_with_user); setVal('speech_reasoning', d.speech.speech_reasoning); setVal('speech_accent', d.speech.speech_accent); setVal('speech_online', d.speech.speech_online);
        filled.push('说话风格');
    }
    if (d.extra) {
        setVal('additional_notes', d.extra.additional_notes);
        fillArray('catchphrase-container', 'catchphrase-item', d.extra.catchphrases, false);
        fillArray('mannerisms-container', 'mannerisms-item', d.extra.mannerisms, false);
        fillArray('trauma-container', 'trauma-item', d.extra.trauma, true);
        fillArray('values-container', 'values-item', d.extra.values, false);
        fillArray('conflicts-container', 'conflicts-item', d.extra.conflicts, true);
        fillArray('secrets-container', 'secrets-item', d.extra.secrets, true);
        fillArray('relationships-container', 'relationships-item', d.extra.relationships, true);
        fillArray('defining-moments-container', 'defining-moments-item', d.extra.defining_moments, true);
        filled.push('额外补充');
    }
    if (d.nsfw) {
        setVal('nsfw_experiences', d.nsfw.experiences); setVal('nsfw_orientation', d.nsfw.sexual_orientation);
        fillArray('nsfw-role-container', 'nsfw-role-item', d.nsfw.sexual_role, true);
        fillArray('nsfw-habits-container', 'nsfw-habits-item', d.nsfw.sexual_habits, true);
        fillArray('kinks-container', 'kinks-item', d.nsfw.kinks, false);
        fillArray('limits-container', 'limits-item', d.nsfw.limits, false);
        filled.push('🔞 NSFW信息');
    }

    triggerAutoSave();
    showToast(`✨ 已填入：${filled.join('、')}`);
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const basicBtn = document.querySelector('[data-tab="basic"]');
    const basicTab = document.getElementById('tab-basic');
    if (basicBtn) basicBtn.classList.add('active');
    if (basicTab) basicTab.classList.add('active');
}
