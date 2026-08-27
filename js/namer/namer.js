// ============================================================
//  起名器
// ============================================================
function getNamerPool(type) {
    const key = type === 'surname' ? LS_SURNAMES : LS_CHARNAMES;
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
}

function saveNamerPool(type, pool) {
    localStorage.setItem(type === 'surname' ? LS_SURNAMES : LS_CHARNAMES, JSON.stringify(pool));
    scheduleCloudConfigSync();
}

function renderNamerTags(type) {
    const pool = getNamerPool(type);
    const container = document.getElementById(type === 'surname' ? 'surnamePool' : 'charnamePool');
    container.innerHTML = '';
    if (pool.length === 0) {
        container.innerHTML = `<span class="namer-tag-empty">${type === 'surname' ? '还没有姓氏～' : '还没有字～'}</span>`;
        return;
    }
    pool.forEach((word, i) => {
        const tag = document.createElement('span');
        tag.className = `namer-tag ${type}`;
        tag.innerHTML = `${escapeHtml(word)}<span class="namer-tag-del" onclick="removeNamerWord('${type}',${i})">×</span>`;
        container.appendChild(tag);
    });
}

function addNamerWord(type) {
    const input = document.getElementById(type === 'surname' ? 'surnameInput' : 'charnameInput');
    const words = input.value.trim().split('').filter(c => c.trim());
    if (words.length === 0) return;
    const pool = getNamerPool(type);
    let added = 0;
    words.forEach(w => { if (!pool.includes(w)) { pool.push(w); added++; } });
    saveNamerPool(type, pool);
    renderNamerTags(type);
    input.value = '';
    input.focus();
}

function namerInputKeydown(e, type) { if (e.key === 'Enter') { e.preventDefault(); addNamerWord(type); } }
function removeNamerWord(type, index) { const pool = getNamerPool(type); pool.splice(index, 1); saveNamerPool(type, pool); renderNamerTags(type); }
function clearNamerPool(type) { if (!confirm(`确定清空${type === 'surname' ? '姓氏' : '名字字'}池吗？`)) return; saveNamerPool(type, []); renderNamerTags(type); }

function loadDefaultSurnames() {
    const merged = [...new Set([...getNamerPool('surname'), ...DEFAULT_SURNAMES])];
    saveNamerPool('surname', merged);
    renderNamerTags('surname');
    showToast(`✅ 已载入 ${DEFAULT_SURNAMES.length} 个常用姓氏`);
}

function loadDefaultCharnames() {
    const merged = [...new Set([...getNamerPool('charname'), ...DEFAULT_CHARNAMES])];
    saveNamerPool('charname', merged);
    renderNamerTags('charname');
    showToast(`✅ 已载入 ${DEFAULT_CHARNAMES.length} 个常用名字字`);
}

function rollNames() {
    const surnames = getNamerPool('surname');
    const charnames = getNamerPool('charname');
    if (surnames.length === 0) { showToast('姓氏池是空的～'); return; }
    if (charnames.length === 0) { showToast('名字字池是空的～'); return; }
    const nameLen = parseInt(document.getElementById('nameLength').value);
    const count = Math.max(1, parseInt(document.getElementById('nameCount').value) || 6);
    const charCount = nameLen - 1;
    const noDuplicate = document.getElementById('nameNoDuplicate').checked;
    const result = document.getElementById('namerResult');
    result.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        let namePart = '';
        if (noDuplicate && charnames.length >= charCount) {
            const pool = [...charnames];
            for (let k = pool.length - 1; k > 0; k--) {
                const j = Math.floor(Math.random() * (k + 1));
                [pool[k], pool[j]] = [pool[j], pool[k]];
            }
            namePart = pool.slice(0, charCount).join('');
        } else {
            for (let j = 0; j < charCount; j++) namePart += charnames[Math.floor(Math.random() * charnames.length)];
        }
        const fullName = surname + namePart;
        const tag = document.createElement('span');
        tag.className = 'namer-rolled-name';
        tag.style.animationDelay = (i * 0.06) + 's';
        tag.textContent = fullName;
        tag.title = '点击复制';
        tag.onclick = () => { navigator.clipboard.writeText(fullName).then(() => showToast(`📋 已复制：${fullName}`)); };
        result.appendChild(tag);
    }
}

function copyNamerPool(type) {
    const pool = getNamerPool(type);
    if (pool.length === 0) { showToast('池子是空的～'); return; }
    navigator.clipboard.writeText(pool.join('\n')).then(() => {
        showToast(`✅ 已复制 ${pool.length} 个${type === 'surname' ? '姓氏' : '名字字'}`);
    });
}

function openNamerImport(type) {
    AppState.namerImportType = type;
    document.getElementById('namerImportTitle').textContent = '📋 批量导入' + (type === 'surname' ? '姓氏' : '名字字');
    document.getElementById('namerImportTextarea').value = '';
    document.getElementById('namerImportModal').classList.add('active');
}

function closeNamerImport() { document.getElementById('namerImportModal').classList.remove('active'); }

function confirmNamerImport() {
    const raw = document.getElementById('namerImportTextarea').value;
    const words = raw.split(/[\n,，\s]+/).map(w => w.trim()).filter(w => w.length > 0);
    if (words.length === 0) { closeNamerImport(); return; }
    const pool = getNamerPool(AppState.namerImportType);
    let added = 0;
    words.forEach(w => { if (!pool.includes(w)) { pool.push(w); added++; } });
    saveNamerPool(AppState.namerImportType, pool);
    renderNamerTags(AppState.namerImportType);
    closeNamerImport();
    showToast(`✅ 导入了 ${added} 个${AppState.namerImportType === 'surname' ? '姓氏' : '名字字'}`);
}