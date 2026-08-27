// ============================================================
//  Supabase 同步 & 云端配置
// ============================================================
function getCloudMetaConfigSnapshot() {
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
    ['basic','background','appearance','personality','user_relation','behavior','speech','extra','nsfw',
     'basic_user','personality_user','relation_user','preference_user','NSFW_user'].forEach(k => {
        moduleGuides[k] = getVal('guide_' + k, '');
    });
    moduleGuides.opening_scene = getVal('guide_opening_scene', '');
    moduleGuides.about_me = getVal('guide_about_me', '');

    const pronouns = {
        sendPersonalPronounsToAi: getChecked('sendPersonalPronounsToAi', false),
        charPronounMode: document.querySelector('input[name="charPronounMode"]:checked')?.value || 'third',
        userPronounMode: document.querySelector('input[name="userPronounMode"]:checked')?.value || 'second'
    };

    return {
        version: 1,
        currentCharId: getCurrentId(),
        inspoPool: getInspoPool(),
        lastRolledInspo: getLastRolledInspo(),
        namer: {
            surnames: getNamerPool('surname'),
            charnames: getNamerPool('charname'),
            nameLength: getVal('nameLength', '3'),
            nameCount: getVal('nameCount', '6'),
            nameNoDuplicate: getChecked('nameNoDuplicate', true),
        },
        ai: {
            providers: (() => {
                const providers = getProviders();
                const sanitized = {};
                Object.entries(providers).forEach(([id, p]) => {
                    sanitized[id] = { name: p.name || '', baseUrl: '', apiKey: '', selectedModel: p.selectedModel || '' };
                });
                return sanitized;
            })(),
            currentProviderId: getCurrentProviderId(),
            selectedModel: AppState.selectedModel,
            activeSubtab: getActiveAiSubtab ? getActiveAiSubtab() : AI_SUBTAB_PERSONA_CARD,
            persona: getVal('aiPersona', ''),
            xpCore: getVal('aiXpCore', ''),
            instructionsChar: getVal('aiInstructionsChar', ''),
            instructionsWorld: getVal('aiInstructionsWorld', ''),
            instructionsUser: getVal('aiInstructionsUser', ''),
            instructionsOpening: getVal('aiInstructionsOpening', ''),
            openingWordCount: getVal('aiOpeningWordCount', '800-1000字'),
            sendTropeToAi: getChecked('sendTropeToAi', true),
            // 兼容：旧字段 includeExistingContentToAi 已被拆分为 sendCharCardToAi / sendWorldbookToAi
            sendCharCardToAi: getChecked('sendCharCardToAi', true),
            sendWorldbookToAi: getChecked('sendWorldbookToAi', true),
            useNamerPoolForAi: getChecked('useNamerPoolForAi', false),
            enableStream: getChecked('enableStream', true),
            pronouns,
            moduleChecks,
            moduleGuides,
            trope: getVal('aiTrope', ''),
            instructionDrafts: AppState.aiInstructionDrafts || {},
        }
    };
}

function applyCloudMetaConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    AppState.isApplyingCloudConfig = true;
    try {
        if (Array.isArray(cfg.inspoPool)) localStorage.setItem(LS_INSPO, JSON.stringify(cfg.inspoPool));
        if (Array.isArray(cfg.lastRolledInspo)) localStorage.setItem(LS_INSPO_LAST_ROLL, JSON.stringify(cfg.lastRolledInspo));
        if (cfg.namer && typeof cfg.namer === 'object') {
            if (Array.isArray(cfg.namer.surnames)) localStorage.setItem(LS_SURNAMES, JSON.stringify(cfg.namer.surnames));
            if (Array.isArray(cfg.namer.charnames)) localStorage.setItem(LS_CHARNAMES, JSON.stringify(cfg.namer.charnames));
            const nameLengthEl = document.getElementById('nameLength');
            const nameCountEl = document.getElementById('nameCount');
            const nameNoDupEl = document.getElementById('nameNoDuplicate');
            if (nameLengthEl && cfg.namer.nameLength !== undefined) nameLengthEl.value = String(cfg.namer.nameLength);
            if (nameCountEl && cfg.namer.nameCount !== undefined) nameCountEl.value = String(cfg.namer.nameCount);
            if (nameNoDupEl && cfg.namer.nameNoDuplicate !== undefined) nameNoDupEl.checked = !!cfg.namer.nameNoDuplicate;
        }
        if (cfg.ai && typeof cfg.ai === 'object') {
            if (cfg.ai.selectedModel !== undefined) AppState.selectedModel = cfg.ai.selectedModel || '';
            if (cfg.ai.activeSubtab) AppState.aiActiveSubtab = cfg.ai.activeSubtab;
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.value = val;
            };
            const setChecked = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined) el.checked = !!val;
            };
            setVal('aiPersona', cfg.ai.persona);
            setVal('aiXpCore', cfg.ai.xpCore);
            setVal('aiTrope', cfg.ai.trope);
            setVal('aiInstructionsChar', cfg.ai.instructionsChar);
            setVal('aiInstructionsWorld', cfg.ai.instructionsWorld);
            setVal('aiInstructionsUser', cfg.ai.instructionsUser);
            setVal('aiInstructionsOpening', cfg.ai.instructionsOpening);
            setVal('aiOpeningWordCount', cfg.ai.openingWordCount);
            if (cfg.ai.instructionDrafts && typeof cfg.ai.instructionDrafts === 'object') {
                AppState.aiInstructionDrafts = {
                    [AI_SUBTAB_PERSONA_CARD]: AI_PERSONA_CARD_INSTRUCTIONS_DEFAULT,
                    [AI_SUBTAB_WORLDVIEW]: AI_WORLDVIEW_INSTRUCTIONS_DEFAULT,
                    [AI_SUBTAB_USER_PERSONA]: AI_USER_PERSONA_INSTRUCTIONS_DEFAULT,
                    [AI_SUBTAB_OPENING]: AI_OPENING_INSTRUCTIONS_DEFAULT,
                    ...cfg.ai.instructionDrafts
                };
            }
            setChecked('sendTropeToAi', cfg.ai.sendTropeToAi);
            // 云配置兼容：如果只有 includeExistingContentToAi，则同时作为两种内容的默认勾选值
            const includeExistingLegacy = (cfg.ai.includeExistingContentToAi !== undefined)
                ? cfg.ai.includeExistingContentToAi
                : true;
            const sendCharCardToAi = (cfg.ai.sendCharCardToAi !== undefined)
                ? cfg.ai.sendCharCardToAi
                : includeExistingLegacy;
            const sendWorldbookToAi = (cfg.ai.sendWorldbookToAi !== undefined)
                ? cfg.ai.sendWorldbookToAi
                : includeExistingLegacy;
            setChecked('sendCharCardToAi', sendCharCardToAi);
            setChecked('sendWorldbookToAi', sendWorldbookToAi);
            setChecked('useNamerPoolForAi', cfg.ai.useNamerPoolForAi);
            setChecked('enableStream', cfg.ai.enableStream);
            if (cfg.ai.pronouns && typeof cfg.ai.pronouns === 'object') {
                setChecked('sendPersonalPronounsToAi', cfg.ai.pronouns.sendPersonalPronounsToAi);
                const charPronoun = cfg.ai.pronouns.charPronounMode || 'third';
                const userPronoun = cfg.ai.pronouns.userPronounMode || 'second';
                const charRadio = document.querySelector(`input[name="charPronounMode"][value="${charPronoun}"]`);
                const userRadio = document.querySelector(`input[name="userPronounMode"][value="${userPronoun}"]`);
                if (charRadio) charRadio.checked = true;
                if (userRadio) userRadio.checked = true;
            }
            if (cfg.ai.moduleChecks && typeof cfg.ai.moduleChecks === 'object') {
                document.querySelectorAll('input[name="aiModule"]').forEach(el => {
                    if (cfg.ai.moduleChecks[el.value] !== undefined) el.checked = !!cfg.ai.moduleChecks[el.value];
                });
            }
            if (cfg.ai.moduleGuides && typeof cfg.ai.moduleGuides === 'object') {
                Object.entries(cfg.ai.moduleGuides).forEach(([k, v]) => {
                    const el = document.getElementById('guide_' + k);
                    if (el && v !== undefined && v !== null) el.value = String(v);
                });
                if (cfg.ai.moduleGuides.opening_scene !== undefined) setVal('guide_opening_scene', cfg.ai.moduleGuides.opening_scene);
            }
        }
        if (cfg.currentCharId) setCurrentId(cfg.currentCharId);
    } finally {
        AppState.isApplyingCloudConfig = false;
    }

    renderInspoTags();
    renderCurrentInspoDisplay();
    renderNamerTags('surname');
    renderNamerTags('charname');
    initProviderSystem();
    if (typeof updateAiInstructionsByActiveTab === 'function') updateAiInstructionsByActiveTab(true);
    if (typeof syncAiTabUI === 'function') syncAiTabUI();
    if (AppState.aiActiveSubtab) {
        document.querySelectorAll('.ai-subtab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.aiTab === AppState.aiActiveSubtab);
        });
        document.querySelectorAll('.ai-subtab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === 'ai-subtab-' + AppState.aiActiveSubtab);
        });
    }
    updateModulePreview();
}

function scheduleCloudConfigSync() {
    if (AppState.isApplyingCloudConfig) return;
    AppState.hasPendingCloudChanges = true;
    clearTimeout(AppState.configSyncTimer);
    AppState.configSyncTimer = setTimeout(() => {
        // 改为手动上传：仅标记本地有待上传变更，不自动推送到云端
    }, 700);
}

function syncCloudMetaConfigToCloud() {
    if (!AppState.supabaseClient || !AppState.syncUserId) return;
    const snapshot = getCloudMetaConfigSnapshot();
    AppState.supabaseClient
        .from('character_cards')
        .upsert([{ user_id: AppState.syncUserId, char_id: CLOUD_META_CONFIG_ID, char_data: snapshot }], { onConflict: 'user_id,char_id' })
        .then(({ error }) => {
            if (error) console.warn('[Cloud Config Upsert Error]', error.message);
        });
}

function initSupabaseClient() {
    if (AppState.supabaseClient) return AppState.supabaseClient;
    if (!window.supabase || !window.supabase.createClient) return null;
    AppState.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return AppState.supabaseClient;
}

function getSyncIds() {
    try {
        const arr = JSON.parse(localStorage.getItem(LS_SYNC_USERS));
        if (!Array.isArray(arr)) return [];
        return [...new Set(arr.map(v => String(v || '').trim()).filter(Boolean))];
    } catch (e) {
        return [];
    }
}

function saveSyncIds(ids) {
    const clean = [...new Set((ids || []).map(v => String(v || '').trim()).filter(Boolean))];
    localStorage.setItem(LS_SYNC_USERS, JSON.stringify(clean));
}

function getCurrentSyncId() {
    return (localStorage.getItem(LS_SYNC_USER_CURRENT) || localStorage.getItem(LS_SYNC_USER) || '').trim();
}

function updateCurrentSyncIdDisplay() {
    const el = document.getElementById('currentSyncIdText');
    if (!el) return;
    el.textContent = AppState.syncUserId || '-';
}

function renderSyncIdSelect() {
    const sel = document.getElementById('syncIdSelect');
    if (!sel) return;
    const ids = getSyncIds();
    const current = getCurrentSyncId();
    sel.innerHTML = '';
    ids.forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        if (id === current) opt.selected = true;
        sel.appendChild(opt);
    });
}

function setCurrentSyncId(id) {
    const val = String(id || '').trim();
    localStorage.setItem(LS_SYNC_USER_CURRENT, val);
    localStorage.setItem(LS_SYNC_USER, val);
    AppState.syncUserId = val;
    updateCurrentSyncIdDisplay();
    renderSyncIdSelect();
}

function ensureSyncIdSystem() {
    let ids = getSyncIds();
    if (ids.length === 0) {
        const legacy = (localStorage.getItem(LS_SYNC_USER) || '').trim();
        if (legacy) ids = [legacy];
    }
    if (ids.length === 0) return;
    saveSyncIds(ids);
    let current = getCurrentSyncId();
    if (!ids.includes(current)) current = ids[0];
    setCurrentSyncId(current);
}

function switchSyncId(newId) {
    if (!newId || newId === getCurrentSyncId()) return;
    setCurrentSyncId(newId);
    showToast('已切换同步ID，可点击“恢复同步”读取云端，或“保存上传”推送本地数据');
}

function addSyncId() {
    const input = (prompt('请输入新的同步ID：\n\n⚠️ 安全提示：同步ID是你访问云端数据的唯一凭证，请使用复杂的字符串（建议混合大小写字母、数字、符号，20位以上），切勿使用简单词语，否则可能被他人猜到并访问你的数据！') || '').trim();
    if (!input) return;
    const ids = getSyncIds();
    if (ids.includes(input)) {
        setCurrentSyncId(input);
        showToast('该ID已存在，已切换到此ID');
        return;
    }
    ids.push(input);
    saveSyncIds(ids);
    setCurrentSyncId(input);
    showToast('✨ 已新增并切换到ID：' + input + '，可手动“恢复同步”或“保存上传”');
}

async function deleteSyncId() {
    const current = getCurrentSyncId();
    if (!current) return;
    const ids = getSyncIds();
    if (!confirm(`确定要删除同步ID「${current}」吗？`)) return;
    const alsoDeleteCloud = confirm(`是否同时删除该ID在云端的所有数据？\n\n【确定】= 删本地ID + 彻底清除云端数据（不可恢复！）\n【取消】= 只删本地ID列表，云端数据保留`);
    if (alsoDeleteCloud) {
        initSupabaseClient();
        if (AppState.supabaseClient) {
            showToast('🗑️ 正在清除云端数据…');
            const { error } = await AppState.supabaseClient.from('character_cards').delete().eq('user_id', current);
            if (error) {
                showToast('❌ 云端数据删除失败：' + error.message);
                return;
            }
        } else {
            showToast('⚠️ 未连接云端，跳过云端删除，仅删本地ID');
        }
    }
    const nextIds = ids.filter(id => id !== current);
    saveSyncIds(nextIds);
    if (nextIds.length > 0) {
        setCurrentSyncId(nextIds[0]);
        showToast(alsoDeleteCloud ? '☁️🗑️ 已删除ID并清除云端数据，已切换到：' + nextIds[0] : '🗑️ 已删除ID，已切换到：' + nextIds[0]);
    } else {
        localStorage.removeItem(LS_SYNC_USER_CURRENT);
        localStorage.removeItem(LS_SYNC_USER);
        AppState.syncUserId = '';
        updateCurrentSyncIdDisplay();
        renderSyncIdSelect();
        showToast(alsoDeleteCloud ? '☁️🗑️ 已彻底清除云端数据，当前为纯本地模式' : '🗑️ 已删除全部同步ID，当前为纯本地模式');
    }
}

async function restoreSyncForCurrentId() {
    initSupabaseClient();
    AppState.syncUserId = getCurrentSyncId();
    updateCurrentSyncIdDisplay();
    if (!AppState.supabaseClient || !AppState.syncUserId) return;
    if (!confirm('恢复同步将以云端数据覆盖当前浏览器本地缓存。确定继续吗？')) return;
    await pullCloudCharacters(true);
    AppState.hasPendingCloudChanges = false;
}

async function saveUploadForCurrentId() {
    initSupabaseClient();
    AppState.syncUserId = getCurrentSyncId();
    updateCurrentSyncIdDisplay();
    if (!AppState.supabaseClient || !AppState.syncUserId) { showToast('未连接云端或同步ID为空'); return; }
    const currentId = getCurrentId();
    if (currentId) saveCurrentCharData(currentId);
    const chars = getChars();
    const rows = Object.entries(chars).map(([charId, charData]) => ({ user_id: AppState.syncUserId, char_id: charId, char_data: charData }));
    rows.push({ user_id: AppState.syncUserId, char_id: CLOUD_META_CONFIG_ID, char_data: getCloudMetaConfigSnapshot() });
    const { error: upsertError } = await AppState.supabaseClient.from('character_cards').upsert(rows, { onConflict: 'user_id,char_id' });
    if (upsertError) {
        console.warn('[Cloud Save Upload Error]', upsertError.message);
        showToast('❌ 保存上传失败：' + upsertError.message);
        return;
    }
    const { data: cloudRows, error: listError } = await AppState.supabaseClient.from('character_cards').select('char_id').eq('user_id', AppState.syncUserId);
    if (!listError && Array.isArray(cloudRows)) {
        const localIds = new Set(Object.keys(chars));
        localIds.add(CLOUD_META_CONFIG_ID);
        const staleIds = cloudRows.map(r => r && r.char_id).filter(id => id && !localIds.has(id));
        if (staleIds.length > 0) {
            const { error: delError } = await AppState.supabaseClient.from('character_cards').delete().eq('user_id', AppState.syncUserId).in('char_id', staleIds);
            if (delError) console.warn('[Cloud Cleanup Error]', delError.message);
        }
    }
    AppState.hasPendingCloudChanges = false;
    showToast(`☁️ 已保存上传 ${Object.keys(chars).length} 个角色到云端`);
}

function normalizeCloudChar(charId, charData) {
    if (charData && typeof charData === 'object' && 'name' in charData && 'data' in charData) {
        return ensureCharShape(charData, charData.name || `云端角色-${String(charId).slice(-4)}`);
    }
    return ensureCharShape({
        name: `云端角色-${String(charId).slice(-4)}`,
        data: (charData && typeof charData === 'object') ? charData : {},
        aiCache: {}
    }, `云端角色-${String(charId).slice(-4)}`);
}

async function pullCloudCharacters(overwriteLocal = false) {
    if (!AppState.supabaseClient || !AppState.syncUserId) return;
    const { data, error } = await AppState.supabaseClient.from('character_cards').select('char_id,char_data').eq('user_id', AppState.syncUserId);
    if (error) {
        console.warn('[Cloud Pull Error]', error.message);
        showToast('❌ 云端恢复失败：' + error.message);
        return;
    }
    if (!data || data.length === 0) {
        showToast('☁️ 云端暂无可恢复数据');
        return;
    }
    const chars = overwriteLocal ? {} : getChars();
    let cloudMetaCfg = null;
    data.forEach(row => {
        if (!row?.char_id) return;
        if (row.char_id === CLOUD_META_CONFIG_ID) { cloudMetaCfg = row.char_data; return; }
        chars[row.char_id] = normalizeCloudChar(row.char_id, row.char_data);
    });
    saveChars(chars);
    if (cloudMetaCfg) applyCloudMetaConfig(cloudMetaCfg);
    let nextId = getCurrentId();
    if (!nextId || !chars[nextId]) nextId = Object.keys(chars)[0];
    if (nextId) {
        setCurrentId(nextId);
        renderCharSelect(chars, nextId);
        loadCharacter(nextId);
    }
    const roleCount = data.filter(r => r?.char_id && r.char_id !== CLOUD_META_CONFIG_ID).length;
    showToast(`☁️ 已同步 ${roleCount} 个云端角色`);
}

function getOrCreateVisitorId() {
    let visitorId = localStorage.getItem(LS_VISITOR_ID);
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(LS_VISITOR_ID, visitorId);
    }
    return visitorId;
}

async function trackUniqueVisitor() {
    if (!AppState.supabaseClient) return;
    const existed = !!localStorage.getItem(LS_VISITOR_ID);
    const visitorId = getOrCreateVisitorId();
    if (existed) return;
    const { error } = await AppState.supabaseClient.from('page_views').insert([{ visitor_id: visitorId }]);
    if (error) console.warn('[Visitor Insert Error]', error.message);
}

async function initCloudSync() {
    initSupabaseClient();
    ensureSyncIdSystem();
    AppState.syncUserId = getCurrentSyncId();
    updateCurrentSyncIdDisplay();
    renderSyncIdSelect();
    if (!AppState.supabaseClient || !AppState.syncUserId) return;
    await trackUniqueVisitor();
}