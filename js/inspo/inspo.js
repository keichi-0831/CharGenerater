// ============================================================
//  灵感池
// ============================================================
function getInspoPool() {
    try { return JSON.parse(localStorage.getItem(LS_INSPO)) || []; } catch (e) { return []; }
}

function saveInspoPool(pool) { localStorage.setItem(LS_INSPO, JSON.stringify(pool)); }

function getLastRolledInspo() {
    try { return JSON.parse(localStorage.getItem(LS_INSPO_LAST_ROLL)) || []; } catch (e) { return []; }
}

function saveLastRolledInspo(words) {
    localStorage.setItem(LS_INSPO_LAST_ROLL, JSON.stringify(words || []));
}

function renderCurrentInspoDisplay() {
    const words = getLastRolledInspo();
    const container = document.getElementById('currentInspoTags');
    if (!container) return;
    container.innerHTML = '';
    if (!words.length) {
        container.innerHTML = '<span class="current-inspo-empty">尚未选择灵感词条</span>';
    } else {
        words.forEach(word => {
            const tag = document.createElement('span');
            tag.className = 'current-inspo-tag';
            tag.textContent = word;
            container.appendChild(tag);
        });
    }
    syncTropeFromCurrentInspo();
}

function syncTropeFromCurrentInspo() {
    const trope = document.getElementById('aiTrope');
    if (!trope) return;
    const words = getLastRolledInspo();
    trope.value = words.join(' / ');
}

function renderInspoTags() {
    const pool = getInspoPool();
    const current = getLastRolledInspo();
    const container = document.getElementById('inspoTags');
    container.innerHTML = '';
    if (pool.length === 0) {
        container.innerHTML = '<span class="inspo-tag-empty">词库为空，添加一些碎片词汇吧～</span>';
        return;
    }
    pool.forEach((word, i) => {
        const tag = document.createElement('span');
        const selectedClass = current.includes(word) ? ' selected' : '';
        tag.className = 'inspo-tag' + selectedClass;
        tag.onclick = () => toggleCurrentInspoWord(word);
        tag.innerHTML = `${escapeHtml(word)}<span class="inspo-tag-del" onclick="removeInspoWord(${i}, event)" title="删除">×</span>`;
        container.appendChild(tag);
    });
}

function addInspoWord() {
    const input = document.getElementById('inspoInput');
    const word = input.value.trim();
    if (!word) return;
    const pool = getInspoPool();
    if (!pool.includes(word)) {
        pool.push(word);
        saveInspoPool(pool);
        renderInspoTags();
        scheduleCloudConfigSync();
    }
    input.value = '';
    input.focus();
}

function inspoInputKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addInspoWord();
    }
}

function removeInspoWord(index, event) {
    if (event) event.stopPropagation();
    const pool = getInspoPool();
    const removed = pool[index];
    pool.splice(index, 1);
    saveInspoPool(pool);
    const current = getLastRolledInspo().filter(w => w !== removed);
    saveLastRolledInspo(current);
    renderInspoTags();
    renderCurrentInspoDisplay();
    scheduleCloudConfigSync();
}

function toggleCurrentInspoWord(word) {
    const current = getLastRolledInspo();
    const idx = current.indexOf(word);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(word);
    saveLastRolledInspo(current);
    renderInspoTags();
    renderCurrentInspoDisplay();
    scheduleCloudConfigSync();
}

function clearCurrentInspo() {
    saveLastRolledInspo([]);
    renderInspoTags();
    renderCurrentInspoDisplay();
    scheduleCloudConfigSync();
    showToast('🧹 已清空灵感时刻');
}

function clearInspoPool() {
    if (!confirm('确定清空所有灵感词汇吗？')) return;
    saveInspoPool([]);
    renderInspoTags();
    saveLastRolledInspo([]);
    renderCurrentInspoDisplay();
    scheduleCloudConfigSync();
    document.getElementById('inspoRollResult').innerHTML = '<span class="inspo-roll-empty">词库已清空</span>';
}

function openImportModal() {
    document.getElementById('importTextarea').value = '';
    document.getElementById('importModal').classList.add('active');
}

function closeImportModal() { document.getElementById('importModal').classList.remove('active'); }

function confirmBatchImport() {
    const raw = document.getElementById('importTextarea').value;
    const words = raw.split(/[\n,，]/).map(w => w.trim()).filter(w => w.length > 0);
    if (words.length === 0) { closeImportModal(); return; }
    const pool = getInspoPool();
    let added = 0;
    words.forEach(w => { if (!pool.includes(w)) { pool.push(w); added++; } });
    saveInspoPool(pool);
    renderInspoTags();
    closeImportModal();
    scheduleCloudConfigSync();
    showToast(`✅ 导入了 ${added} 个词语`);
}

function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const words = text.split(/[\n,，]/).map(w => w.trim()).filter(w => w.length > 0);
        const pool = getInspoPool();
        let added = 0;
        words.forEach(w => { if (!pool.includes(w)) { pool.push(w); added++; } });
        saveInspoPool(pool);
        renderInspoTags();
        scheduleCloudConfigSync();
        showToast(`📁 从文件导入了 ${added} 个词语`);
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
}

function copyInspoPool() {
    const pool = getInspoPool();
    if (pool.length === 0) { showToast('词库是空的，没什么可以复制的～'); return; }
    navigator.clipboard.writeText(pool.join('\n')).then(() => {
        showToast(`✅ 已复制 ${pool.length} 个词语`);
    }).catch(() => { alert('复制失败'); });
}

function rollInspo() {
    const pool = getInspoPool();
    if (pool.length === 0) { showToast('词库为空，先添加一些词汇吧～'); return; }
    const count = Math.min(parseInt(document.getElementById('rollCount').value) || 4, pool.length);
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picked = shuffled.slice(0, count);
    saveLastRolledInspo(picked);
    renderCurrentInspoDisplay();
    scheduleCloudConfigSync();
    const result = document.getElementById('inspoRollResult');
    result.innerHTML = '';
    picked.forEach((word, i) => {
        const tag = document.createElement('span');
        tag.className = 'inspo-rolled-tag';
        tag.style.animationDelay = (i * 0.07) + 's';
        tag.textContent = word;
        result.appendChild(tag);
    });
}