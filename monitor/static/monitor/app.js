const API = {
    keywords: '/api/keywords/',
    contentItems: '/api/content-items/',
    flags: '/api/flags/',
    fetch: '/api/fetch/',
    scan: '/api/scan/'
};

const dom = {
    keywordCount: document.getElementById('keyword-count'),
    contentCount: document.getElementById('content-count'),
    pendingCount: document.getElementById('pending-count'),
    keywordForm: document.getElementById('keyword-form'),
    fetchForm: document.getElementById('fetch-form'),
    scanForm: document.getElementById('scan-form'),
    contentSelect: document.getElementById('content-select'),
    flagSearch: document.getElementById('flag-search'),
    statusFilter: document.getElementById('status-filter'),
    pageSize: document.getElementById('page-size'),
    flagsList: document.getElementById('flags-list'),
    emptyState: document.getElementById('empty-state'),
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    pageInfo: document.getElementById('page-info'),
    refreshBtn: document.getElementById('refresh-btn'),
    toast: document.getElementById('toast')
};

let state = {
    keywords: [],
    contentItems: [],
    flags: []
};

let ui = {
    query: '',
    status: 'all',
    page: 1,
    perPage: 6
};

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

function showToast(message, isError = false) {
    dom.toast.textContent = message;
    dom.toast.style.background = isError ? '#942f2f' : '#2b2523';
    dom.toast.classList.add('show');

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
        dom.toast.classList.remove('show');
    }, 2100);
}

async function request(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch (_error) {
        payload = null;
    }

    if (!response.ok) {
        const detail = payload?.error || JSON.stringify(payload) || response.statusText;
        throw new Error(detail);
    }

    return payload;
}

function renderStats() {
    dom.keywordCount.textContent = state.keywords.length;
    dom.contentCount.textContent = state.contentItems.length;
    const pending = state.flags.filter((item) => item.status === 'pending').length;
    dom.pendingCount.textContent = pending;
}

function buildContentSelect() {
    dom.contentSelect.innerHTML = '';

    if (!state.contentItems.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No content available';
        dom.contentSelect.appendChild(option);
        dom.contentSelect.disabled = true;
        return;
    }

    state.contentItems.forEach((item) => {
        const option = document.createElement('option');
        option.value = item.id;
        const title = item.title.length > 70 ? `${item.title.slice(0, 67)}...` : item.title;
        option.textContent = `${item.id}: ${title}`;
        dom.contentSelect.appendChild(option);
    });

    dom.contentSelect.disabled = false;
}

function flagCard(flag) {
    const card = document.createElement('article');
    card.className = 'flag-card';

    const title = document.createElement('div');
    title.className = 'flag-title';
    title.textContent = flag.content_title;

    const meta = document.createElement('p');
    meta.className = 'flag-meta';
    meta.textContent = `Keyword: ${flag.keyword_name}`;

    const badges = document.createElement('div');
    badges.className = 'badges';

    const scoreBadge = document.createElement('span');
    scoreBadge.className = 'badge';
    scoreBadge.textContent = `Score ${flag.score}`;

    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${flag.status}`;
    statusBadge.textContent = flag.status;

    badges.append(scoreBadge, statusBadge);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const relevantBtn = document.createElement('button');
    relevantBtn.type = 'button';
    relevantBtn.textContent = 'Mark Relevant';
    relevantBtn.addEventListener('click', () => updateFlagStatus(flag.id, 'relevant'));

    const irrelevantBtn = document.createElement('button');
    irrelevantBtn.type = 'button';
    irrelevantBtn.textContent = 'Mark Irrelevant';
    irrelevantBtn.addEventListener('click', () => updateFlagStatus(flag.id, 'irrelevant'));

    const pendingBtn = document.createElement('button');
    pendingBtn.type = 'button';
    pendingBtn.textContent = 'Reset Pending';
    pendingBtn.addEventListener('click', () => updateFlagStatus(flag.id, 'pending'));

    actions.append(relevantBtn, irrelevantBtn, pendingBtn);
    card.append(title, meta, badges, actions);
    return card;
}

function renderFlags() {
    const filteredFlags = state.flags.filter((flag) => {
        const statusMatch = ui.status === 'all' || flag.status === ui.status;
        const searchText = `${flag.content_title} ${flag.keyword_name}`.toLowerCase();
        const queryMatch = !ui.query || searchText.includes(ui.query);
        return statusMatch && queryMatch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredFlags.length / ui.perPage));
    if (ui.page > totalPages) {
        ui.page = totalPages;
    }

    const start = (ui.page - 1) * ui.perPage;
    const pagedFlags = filteredFlags.slice(start, start + ui.perPage);

    dom.flagsList.innerHTML = '';

    if (!pagedFlags.length) {
        dom.emptyState.classList.remove('hidden');
        dom.pagination.classList.add('hidden');
        dom.pageInfo.textContent = 'Page 1 of 1';
        return;
    }

    dom.emptyState.classList.add('hidden');
    pagedFlags.forEach((flag) => {
        dom.flagsList.appendChild(flagCard(flag));
    });

    dom.pagination.classList.remove('hidden');
    dom.pageInfo.textContent = `Page ${ui.page} of ${totalPages}`;
    dom.prevPage.disabled = ui.page <= 1;
    dom.nextPage.disabled = ui.page >= totalPages;
}

async function refreshData() {
    const [keywords, contentItems, flags] = await Promise.all([
        request(API.keywords, { method: 'GET' }),
        request(API.contentItems, { method: 'GET' }),
        request(API.flags, { method: 'GET' })
    ]);

    state = { keywords, contentItems, flags };

    renderStats();
    buildContentSelect();
    renderFlags();
}

async function addKeyword(event) {
    event.preventDefault();
    const input = event.currentTarget.keyword;

    try {
        await request(API.keywords, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') || '' },
            body: JSON.stringify({ name: input.value.trim() })
        });
        input.value = '';
        await refreshData();
        showToast('Keyword added');
    } catch (error) {
        showToast(`Keyword error: ${error.message}`, true);
    }
}

async function fetchNews(event) {
    event.preventDefault();
    const query = event.currentTarget.query.value.trim() || 'technology';

    try {
        const payload = await request(API.fetch, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') || '' },
            body: JSON.stringify({ query })
        });

        await refreshData();
        showToast(payload.message || 'Fetch complete');
    } catch (error) {
        showToast(`Fetch error: ${error.message}`, true);
    }
}

async function runScan(event) {
    event.preventDefault();
    const contentId = Number(event.currentTarget.content_id.value);
    if (!contentId) {
        showToast('Please choose a content item', true);
        return;
    }

    try {
        const payload = await request(API.scan, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') || '' },
            body: JSON.stringify({ content_id: contentId })
        });

        await refreshData();
        showToast(payload.message || 'Scan complete');
    } catch (error) {
        showToast(`Scan error: ${error.message}`, true);
    }
}

async function updateFlagStatus(flagId, status) {
    try {
        await request(`${API.flags}${flagId}/`, {
            method: 'PATCH',
            headers: { 'X-CSRFToken': getCookie('csrftoken') || '' },
            body: JSON.stringify({ status })
        });

        await refreshData();
        showToast(`Flag updated to ${status}`);
    } catch (error) {
        showToast(`Update error: ${error.message}`, true);
    }
}

function bindEvents() {
    dom.keywordForm.addEventListener('submit', addKeyword);
    dom.fetchForm.addEventListener('submit', fetchNews);
    dom.scanForm.addEventListener('submit', runScan);
    dom.flagSearch.addEventListener('input', (event) => {
        ui.query = event.currentTarget.value.trim().toLowerCase();
        ui.page = 1;
        renderFlags();
    });
    dom.statusFilter.addEventListener('change', (event) => {
        ui.status = event.currentTarget.value;
        ui.page = 1;
        renderFlags();
    });
    dom.pageSize.addEventListener('change', (event) => {
        ui.perPage = Number(event.currentTarget.value);
        ui.page = 1;
        renderFlags();
    });
    dom.prevPage.addEventListener('click', () => {
        if (ui.page > 1) {
            ui.page -= 1;
            renderFlags();
        }
    });
    dom.nextPage.addEventListener('click', () => {
        ui.page += 1;
        renderFlags();
    });
    dom.refreshBtn.addEventListener('click', async () => {
        try {
            await refreshData();
            showToast('Data refreshed');
        } catch (error) {
            showToast(`Refresh error: ${error.message}`, true);
        }
    });
}

async function start() {
    bindEvents();
    try {
        await refreshData();
        showToast('Console ready');
    } catch (error) {
        showToast(`Load error: ${error.message}`, true);
    }
}

start();
