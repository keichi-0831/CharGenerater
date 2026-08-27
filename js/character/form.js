// ============================================================
//  角色管理 / 表单 / 自动保存 / Tabs
// ============================================================
function getChars() {
    try { return JSON.parse(localStorage.getItem(LS_CHARS)) || {}; } catch (e) { return {}; }
}

function saveChars(chars) { localStorage.setItem(LS_CHARS, JSON.stringify(chars)); }
function getCurrentId() { return localStorage.getItem(LS_CURRENT) || null; }
function setCurrentId(id) { localStorage.setItem(LS_CURRENT, id); }
function generateId() { return 'char_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }

function ensureCharShape(charObj, fallbackName = '未命名角色') {
    const safeChar = (charObj && typeof charObj === 'object') ? charObj : {};
    if (!safeChar.data || typeof safeChar.data !== 'object') safeChar.data = {};
    if (!safeChar.aiCache || typeof safeChar.aiCache !== 'object') safeChar.aiCache = {};
    if (!safeChar.name) safeChar.name = fallbackName;
    return safeChar;
}

function getCurrentCharObject() {
    const id = getCurrentId();
    if (!id) return null;
    const chars = getChars();
    if (!chars[id]) return null;
    return ensureCharShape(chars[id]);
}

function getCurrentCharAiCache(tabKey = AppState.aiActiveSubtab || AI_SUBTAB_PERSONA_CARD) {
    const charObj = getCurrentCharObject();
    if (!charObj) return null;
    return charObj.aiCache?.[tabKey] || null;
}

function saveCurrentCharAiCache(tabKey, payload) {
    const id = getCurrentId();
    if (!id || !tabKey) return;
    const chars = getChars();
    if (!chars[id]) return;
    const charObj = ensureCharShape(chars[id]);
    if (!payload || (typeof payload === 'object' && !String(payload.raw || '').trim())) {
        delete charObj.aiCache[tabKey];
    } else {
        charObj.aiCache[tabKey] = payload;
    }
    chars[id] = charObj;
    saveChars(chars);
    scheduleCloudConfigSync();
}

function initCharSystem() {
    let chars = getChars();
    let currentId = getCurrentId();
    if (Object.keys(chars).length === 0) {
        const id = generateId();
        chars[id] = ensureCharShape({ name: '角色一', data: {}, aiCache: {} }, '角色一');
        saveChars(chars);
        currentId = id;
        setCurrentId(id);
    }
    Object.entries(chars).forEach(([id, charObj]) => {
        chars[id] = ensureCharShape(charObj, charObj?.name || '未命名角色');
    });
    saveChars(chars);
    if (!chars[currentId]) {
        currentId = Object.keys(chars)[0];
        setCurrentId(currentId);
    }
    renderCharSelect(chars, currentId);
    loadCharacter(currentId);
}

function renderCharSelect(chars, currentId) {
    const sel = document.getElementById('charSelect');
    sel.innerHTML = '';
    Object.entries(chars).forEach(([id, c]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = c.name;
        if (id === currentId) opt.selected = true;
        sel.appendChild(opt);
    });
}

function switchCharacter(newId) {
    const oldId = getCurrentId();
    if (oldId) saveCurrentCharData(oldId);
    setCurrentId(newId);
    loadCharacter(newId);
    scheduleCloudConfigSync();
}

function newCharacter() {
    const name = prompt('新角色名称：', '新角色');
    if (!name) return;
    const oldId = getCurrentId();
    if (oldId) saveCurrentCharData(oldId);
    const chars = getChars();
    const id = generateId();
    chars[id] = ensureCharShape({ name: name.trim(), data: {}, aiCache: {} }, name.trim());
    saveChars(chars);
    setCurrentId(id);
    renderCharSelect(chars, id);
    clearFormFields();
    scheduleCloudConfigSync();
    showToast('✨ 已新建角色：' + name);
}

function renameCharacter() {
    const id = getCurrentId();
    if (!id) return;
    const chars = getChars();
    const oldName = chars[id]?.name || '';
    const name = prompt('重命名角色：', oldName);
    if (!name || name.trim() === oldName) return;
    chars[id].name = name.trim();
    saveChars(chars);
    renderCharSelect(chars, id);
    showToast('✏️ 已重命名为：' + name.trim());
}

function deleteCharacter() {
    const id = getCurrentId();
    if (!id) return;
    const chars = getChars();
    if (Object.keys(chars).length <= 1) { alert('至少保留一个角色！'); return; }
    if (!confirm(`确定删除角色「${chars[id]?.name}」吗？此操作不可撤销。`)) return;
    delete chars[id];
    saveChars(chars);
    const newId = Object.keys(chars)[0];
    setCurrentId(newId);
    renderCharSelect(chars, newId);
    loadCharacter(newId);
    scheduleCloudConfigSync();
    showToast('🗑️ 角色已删除');
}

function createCustomWorldbookEntryId() {
    return 'custom_worldbook_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function updateCustomWorldbookEmptyState() {
    const container = document.getElementById('custom-worldbook-container');
    const empty = document.getElementById('custom-worldbook-empty');
    if (!container || !empty) return;
    empty.style.display = container.children.length ? 'none' : 'block';
}

function createCustomWorldbookEntryElement(entry = {}) {
    const item = document.createElement('article');
    item.className = 'custom-worldbook-entry';
    item.dataset.entryId = entry.id || createCustomWorldbookEntryId();
    item.innerHTML = `
        <div class="custom-worldbook-entry-head">
            <strong>自定义条目</strong>
            <button type="button" class="btn btn-danger" data-action="remove-custom-worldbook">删除</button>
        </div>
        <div class="form-group">
            <label>标题</label>
            <input type="text" data-field="title" placeholder="例如：魔法体系、城市禁令、隐藏组织">
        </div>
        <div class="form-group">
            <label>正文</label>
            <textarea data-field="content" rows="5" placeholder="填写这个自定义世界书条目的完整内容……"></textarea>
        </div>
        <div class="custom-worldbook-config">
            <div class="form-row">
                <div class="form-group">
                    <label>导出条目名称 <span class="optional">（留空则使用标题）</span></label>
                    <input type="text" data-field="comment" placeholder="默认跟随标题">
                </div>
                <div class="form-group">
                    <label>触发方式</label>
                    <select data-field="constant">
                        <option value="true">常量触发（始终生效）</option>
                        <option value="false">关键词触发</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>关键字（逗号分隔，可留空）</label>
                    <input type="text" data-field="key" placeholder="例如：魔法, 法术">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>插入位置</label>
                    <select data-field="position">
                        <option value="0">0 = 角色描述前</option>
                        <option value="1">1 = 角色描述后</option>
                        <option value="2">2 = 示例对话前</option>
                        <option value="3">3 = 示例对话后</option>
                        <option value="4">4 = 作者的话/聊天中</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>插入深度</label>
                    <input type="number" data-field="depth" value="2" min="0">
                </div>
                <div class="form-group">
                    <label>插入顺序</label>
                    <input type="number" data-field="order" value="100" min="0">
                </div>
            </div>
        </div>`;

    const setValue = (field, value, fallback = '') => {
        const el = item.querySelector(`[data-field="${field}"]`);
        if (el) el.value = value !== undefined && value !== null ? String(value) : fallback;
    };
    setValue('title', entry.title);
    setValue('content', entry.content);
    setValue('comment', entry.comment);
    setValue('constant', entry.constant, 'true');
    setValue('key', entry.key);
    setValue('position', entry.position, '2');
    setValue('depth', entry.depth, '2');
    setValue('order', entry.order, '100');

    item.querySelector('[data-action="remove-custom-worldbook"]')?.addEventListener('click', () => {
        item.remove();
        updateCustomWorldbookEmptyState();
        triggerAutoSave();
    });
    return item;
}

function collectCustomWorldbookEntries() {
    const container = document.getElementById('custom-worldbook-container');
    if (!container) return [];
    return Array.from(container.querySelectorAll('.custom-worldbook-entry')).map(item => {
        const value = field => item.querySelector(`[data-field="${field}"]`)?.value || '';
        return {
            id: item.dataset.entryId || createCustomWorldbookEntryId(),
            title: value('title'),
            content: value('content'),
            comment: value('comment'),
            constant: value('constant') || 'true',
            key: value('key'),
            position: value('position') || '2',
            depth: value('depth') || '2',
            order: value('order') || '100'
        };
    });
}

function renderCustomWorldbookEntries(entries) {
    const container = document.getElementById('custom-worldbook-container');
    if (!container) return;
    container.innerHTML = '';
    (Array.isArray(entries) ? entries : []).forEach(entry => {
        container.appendChild(createCustomWorldbookEntryElement(entry));
    });
    updateCustomWorldbookEmptyState();
}

function addCustomWorldbookEntry() {
    const container = document.getElementById('custom-worldbook-container');
    if (!container) return;
    const item = createCustomWorldbookEntryElement();
    container.appendChild(item);
    updateCustomWorldbookEmptyState();
    item.querySelector('[data-field="title"]')?.focus();
    triggerAutoSave();
}

function serializeForm() {
    const data = {};
    SIMPLE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });
    ARRAY_DEFS.forEach(([cid, cls]) => {
        const container = document.getElementById(cid);
        if (container) {
            data[cid] = Array.from(container.querySelectorAll('.' + cls)).map(el => el.value);
        }
    });
    data.customWorldbookEntries = collectCustomWorldbookEntries();
    return data;
}

function deserializeForm(data) {
    if (!data) { clearFormFields(); return; }
    SIMPLE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && data[id] !== undefined) el.value = data[id];
    });
    ARRAY_DEFS.forEach(([cid, cls, isTextarea]) => {
        const container = document.getElementById(cid);
        if (!container) return;
        let values = data[cid];
        if (!values || values.length === 0) values = [''];
        container.innerHTML = '';
        values.forEach(val => {
            const div = document.createElement('div');
            div.className = 'array-item';
            if (isTextarea) {
                const ta = document.createElement('textarea');
                ta.className = cls;
                ta.name = cls;
                ta.value = val;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-remove';
                btn.textContent = '✕';
                btn.onclick = function() { removeArrayItem(this); };
                div.appendChild(ta);
                div.appendChild(btn);
            } else {
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.className = cls;
                inp.name = cls;
                inp.value = val;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-remove';
                btn.textContent = '✕';
                btn.onclick = function() { removeArrayItem(this); };
                div.appendChild(inp);
                div.appendChild(btn);
            }
            container.appendChild(div);
        });
    });
    renderCustomWorldbookEntries(data.customWorldbookEntries);
}

function clearFormFields() {
    SIMPLE_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && id !== 'replace_target') el.value = '';
    });
    ARRAY_DEFS.forEach(([cid, cls, isTextarea]) => {
        const container = document.getElementById(cid);
        if (!container) return;
        container.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'array-item';
        if (isTextarea) {
            div.innerHTML = `<textarea class="${cls}" name="${cls}"></textarea><button type="button" class="btn btn-remove" onclick="removeArrayItem(this)">✕</button>`;
        } else {
            div.innerHTML = `<input type="text" class="${cls}" name="${cls}"><button type="button" class="btn btn-remove" onclick="removeArrayItem(this)">✕</button>`;
        }
        container.appendChild(div);
    });
    renderCustomWorldbookEntries([]);
}

function saveCurrentCharData(id) {
    if (!id) return;
    const chars = getChars();
    if (!chars[id]) return;
    chars[id] = ensureCharShape(chars[id], chars[id]?.name || '未命名角色');
    chars[id].data = serializeForm();
    saveChars(chars);
}

function loadCharacter(id) {
    const chars = getChars();
    if (chars[id]) {
        chars[id] = ensureCharShape(chars[id], chars[id]?.name || '未命名角色');
        saveChars(chars);
    }
    const charData = chars[id]?.data || {};
    deserializeForm(charData);
    if (typeof refreshAiCacheDisplay === 'function') refreshAiCacheDisplay();
    setSaveStatus('saved');
}

function triggerAutoSave() {
    setSaveStatus('saving');
    clearTimeout(AppState.saveTimer);
    AppState.saveTimer = setTimeout(() => {
        const id = getCurrentId();
        if (id) {
            saveCurrentCharData(id);
            scheduleCloudConfigSync();
        }
        setSaveStatus('saved');
    }, 900);
}

function setSaveStatus(state) {
    const el = document.getElementById('saveStatus');
    const text = document.getElementById('saveText');
    el.className = 'save-status ' + state;
    if (state === 'saving') text.textContent = '保存中…';
    else if (state === 'saved') text.textContent = '已自动保存';
    else text.textContent = '等待编辑';
}

function addArrayItem(containerId, className) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'array-item';
    div.innerHTML = `<input type="text" class="${className}" name="${className}"><button type="button" class="btn btn-remove" onclick="removeArrayItem(this)">✕</button>`;
    container.appendChild(div);
    div.querySelector('input').focus();
}

function addTextareaItem(containerId, className) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'array-item';
    div.innerHTML = `<textarea class="${className}" name="${className}"></textarea><button type="button" class="btn btn-remove" onclick="removeArrayItem(this)">✕</button>`;
    container.appendChild(div);
    div.querySelector('textarea').focus();
}

function removeArrayItem(btn) {
    const container = btn.parentElement.parentElement;
    if (container.querySelectorAll('.array-item').length > 1) {
        btn.parentElement.remove();
    } else {
        btn.parentElement.querySelector('input, textarea').value = '';
    }
    triggerAutoSave();
}

function bindTabEvents() {
    // 绑定顶级标签事件（人设卡 / 世界书 / 灵感池 / AI 辅助）
    document.querySelectorAll('.top-tab-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            // 防止位于 <form> 内部的按钮触发表单提交，造成整张人设卡被拼进 URL
            if (event && typeof event.preventDefault === 'function') event.preventDefault();
            document.querySelectorAll('.top-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.top-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById('tab-' + btn.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // 绑定子级标签事件（人设卡内部的基础信息 / 背景故事等）
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            // 同样阻止子级标签按钮触发表单的默认提交行为
            if (event && typeof event.preventDefault === 'function') event.preventDefault();
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });
}

function bindCharacterFormAutoSave() {
    document.getElementById('characterForm').addEventListener('input', triggerAutoSave);
    document.getElementById('characterForm').addEventListener('change', triggerAutoSave);
}
