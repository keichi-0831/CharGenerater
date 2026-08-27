// ============================================================
//  工具函数
// ============================================================
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function forceRefreshApp() {
    const url = new URL(window.location.href);
    url.searchParams.set('_fr', String(Date.now()));
    showToast('🔄 正在强制刷新到最新版本…');
    window.location.replace(url.toString());
}