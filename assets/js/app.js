/**
 * 推广站前端应用
 * 加载生成的 JSON 数据，渲染所有页面模块
 */
const STORE_URL = 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';
let allProducts = [];
let cardProducts = [];
let bbProducts = [];
let promoData = null;

// 筛选状态
let cardOpFilter = 'all';
let cardAreaFilter = 'all';
let cardSearch = '';
let bbOpFilter = 'all';
let bbAreaFilter = 'all';
let bbSearch = '';

const OPERATOR_MAP = {
  '移动': { className: 'tag-移动', label: '移动' },
  '联通': { className: 'tag-联通', label: '联通' },
  '电信': { className: 'tag-电信', label: '电信' },
  '广电': { className: 'tag-广电', label: '广电' },
};
const OPERATOR_ORDER = ['移动', '联通', '电信', '广电'];

const AREA_GROUP = {
  '广东': '华南', '广西': '华南', '海南': '华南', '福建': '华南',
  '湖南': '华中', '湖北': '华中', '河南': '华中', '江西': '华中',
  '上海': '华东', '浙江': '华东', '江苏': '华东', '安徽': '华东', '山东': '华东',
  '北京': '华北', '天津': '华北', '河北': '华北', '山西': '华北', '内蒙古': '华北',
  '四川': '西南', '重庆': '西南', '云南': '西南', '贵州': '西南', '西藏': '西南',
  '陕西': '西北', '甘肃': '西北', '青海': '西北', '宁夏': '西北', '新疆': '西北',
  '辽宁': '东北', '吉林': '东北', '黑龙江': '东北',
};

function isBroadband(p) {
  return p.productName && (p.productName.includes('宽带') || p.productName.includes('单宽'));
}

function getAreaGroup(area) {
  if (!area || area === '随机' || area === '收货地为归属地' || area === '收货地') return '全国';
  for (const [key, val] of Object.entries(AREA_GROUP)) {
    if (area.includes(key)) return val;
  }
  return '全国';
}

function formatDate(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}年${dt.getMonth()+1}月${dt.getDate()}日`;
}

function getOperatorTag(op) {
  const info = OPERATOR_MAP[op] || { className: 'tag-移动', label: op };
  return `<span class="prod-tag ${info.className}">${info.label}</span>`;
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

// ===== 弹窗 =====
function openModal(product) {
  const modal = document.getElementById('productModal');
  if (!modal || !product) return;
  document.getElementById('modalTitle').textContent = product.productName || '商品详情';
  document.getElementById('modalOrderBtn').href = promoData?.storeUrl || STORE_URL;
  const body = document.getElementById('modalBody');
  const age1 = product.age1 || 18;
  const age2 = product.age2 || 60;
  const taocan = (product.taocan || product.productName || '暂无').replace(/佣金[^。]*。?/g, '').replace(/佣金[^，]*。?/g, '').replace(/佣金/g, '');
  body.innerHTML = `
    <img src="${product.mainPic || ''}" alt="${product.productName}" style="width:100%;border-radius:8px;margin-bottom:12px;" onerror="this.style.display='none'">
    <div class="detail-row"><span class="detail-label">运营商</span><span class="detail-value">${product.operator || '未知'}</span></div>
    <div class="detail-row"><span class="detail-label">归属地</span><span class="detail-value">${product.area || '随机'}</span></div>
    <div class="detail-row"><span class="detail-label">适用年龄</span><span class="detail-value">${age1}-${age2}岁</span></div>
    <div class="detail-row"><span class="detail-label">套餐说明</span><span class="detail-value" style="text-align:right;max-width:60%;">${taocan}</span></div>
    ${product.disableArea ? `<div class="detail-row"><span class="detail-label">禁发区域</span><span class="detail-value" style="text-align:right;max-width:60%;font-size:.78rem;color:#888;">${truncate(product.disableArea, 80)}</span></div>` : ''}
  `;
  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('productModal').classList.remove('show');
}
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeModal(); });

// ===== 商品卡片渲染 =====
function renderCard(p) {
  return `
    <div class="product-card fade-in" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
      <img class="prod-img" src="${p.mainPic || ''}" alt="${p.productName}" loading="lazy" onerror="this.style.background='#f0f0f0';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2230%22>📱</text></svg>'">
      <div class="prod-info">
        <div class="prod-name">${p.productName}</div>
        <div class="prod-tags">
          ${getOperatorTag(p.operator)}
          ${p.backMoneyType === '秒返' ? '<span class="prod-tag" style="background:#fef3c7;color:#92400e;">秒返</span>' : ''}
        </div>
        <div class="prod-area">📌 ${p.area || '随机'}</div>
      </div>
    </div>`;
}

// ===== 号卡专区 =====
function renderCardProducts() {
  const grid = document.getElementById('cardProductGrid');
  const loading = document.getElementById('cardLoading');
  if (loading) loading.style.display = 'none';
  if (!grid) return;

  let filtered = [...cardProducts];
  if (cardOpFilter !== 'all') filtered = filtered.filter(p => p.operator === cardOpFilter);
  if (cardAreaFilter !== 'all') filtered = filtered.filter(p => getAreaGroup(p.area) === cardAreaFilter);
  if (cardSearch) {
    const t = cardSearch.toLowerCase();
    filtered = filtered.filter(p =>
      (p.productName && p.productName.toLowerCase().includes(t)) ||
      (p.area && p.area.includes(t))
    );
  }

  grid.innerHTML = filtered.length
    ? filtered.map(renderCard).join('')
    : '<div class="empty-state"><div class="icon">🔍</div><p>没有匹配的号卡</p></div>';
}

function renderCardFilters() {
  const ops = {}; const areas = {};
  cardProducts.forEach(p => {
    ops[p.operator] = (ops[p.operator] || 0) + 1;
    const ag = getAreaGroup(p.area);
    areas[ag] = (areas[ag] || 0) + 1;
  });

  const opBar = document.getElementById('cardOperatorBar');
  if (opBar) {
    const opList = OPERATOR_ORDER.filter(o => ops[o]);
    opBar.innerHTML = `
      <button class="filter-btn ${cardOpFilter === 'all' ? 'active' : ''}" data-cat="card-op" data-filter="all">全部(${cardProducts.length})</button>
      ${opList.map(o => `<button class="filter-btn ${cardOpFilter === o ? 'active' : ''}" data-cat="card-op" data-filter="${o}">${o}(${ops[o]})</button>`).join('')}
    `;
    opBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cardOpFilter = btn.dataset.filter;
        document.querySelectorAll('#cardOperatorBar .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === cardOpFilter));
        renderCardProducts();
      });
    });
  }

  const areaBar = document.getElementById('cardAreaBar');
  if (areaBar) {
    const areaList = Object.keys(areas).sort((a,b) => b.localeCompare(a, 'zh'));
    const areaAll = '全 国(' + (areas['全国']||0) + ')';
    areaBar.innerHTML = `
      <button class="filter-btn ${cardAreaFilter === 'all' ? 'active' : ''}" data-cat="card-area" data-filter="all">全部</button>
      ${areaList.map(a => `<button class="filter-btn ${cardAreaFilter === a ? 'active' : ''}" data-cat="card-area" data-filter="${a}">${a}(${areas[a]})</button>`).join('')}
    `;
    areaBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cardAreaFilter = btn.dataset.filter;
        document.querySelectorAll('#cardAreaBar .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === cardAreaFilter));
        renderCardProducts();
      });
    });
  }
}

function searchCardProducts() {
  cardSearch = document.getElementById('cardSearchInput').value.trim();
  switchTab('card');
  renderCardProducts();
}

// ===== 宽带专区 =====
function renderBBProducts() {
  const grid = document.getElementById('bbProductGrid');
  const loading = document.getElementById('bbLoading');
  if (loading) loading.style.display = 'none';
  if (!grid) return;

  let filtered = [...bbProducts];
  if (bbOpFilter !== 'all') filtered = filtered.filter(p => p.operator === bbOpFilter);
  if (bbAreaFilter !== 'all') filtered = filtered.filter(p => getAreaGroup(p.area) === bbAreaFilter);
  if (bbSearch) {
    const t = bbSearch.toLowerCase();
    filtered = filtered.filter(p =>
      (p.productName && p.productName.toLowerCase().includes(t)) ||
      (p.area && p.area.includes(t))
    );
  }

  grid.innerHTML = filtered.length
    ? filtered.map(renderCard).join('')
    : '<div class="empty-state"><div class="icon">🔍</div><p>没有匹配的宽带</p></div>';
}

function renderBBFilters() {
  const ops = {}; const areas = {};
  bbProducts.forEach(p => {
    ops[p.operator] = (ops[p.operator] || 0) + 1;
    const ag = getAreaGroup(p.area);
    areas[ag] = (areas[ag] || 0) + 1;
  });

  const opBar = document.getElementById('bbOperatorBar');
  if (opBar) {
    const opList = OPERATOR_ORDER.filter(o => ops[o]);
    opBar.innerHTML = `
      <button class="filter-btn ${bbOpFilter === 'all' ? 'active' : ''}" data-cat="bb-op" data-filter="all">全部(${bbProducts.length})</button>
      ${opList.map(o => `<button class="filter-btn ${bbOpFilter === o ? 'active' : ''}" data-cat="bb-op" data-filter="${o}">${o}(${ops[o]})</button>`).join('')}
    `;
    opBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bbOpFilter = btn.dataset.filter;
        document.querySelectorAll('#bbOperatorBar .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === bbOpFilter));
        renderBBProducts();
      });
    });
  }

  const areaBar = document.getElementById('bbAreaBar');
  if (areaBar) {
    const areaList = Object.keys(areas).sort((a,b) => b.localeCompare(a, 'zh'));
    areaBar.innerHTML = `
      <button class="filter-btn ${bbAreaFilter === 'all' ? 'active' : ''}" data-cat="bb-area" data-filter="all">全部</button>
      ${areaList.map(a => `<button class="filter-btn ${bbAreaFilter === a ? 'active' : ''}" data-cat="bb-area" data-filter="${a}">${a}(${areas[a]})</button>`).join('')}
    `;
    areaBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bbAreaFilter = btn.dataset.filter;
        document.querySelectorAll('#bbAreaBar .filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === bbAreaFilter));
        renderBBProducts();
      });
    });
  }
}

function searchBBProducts() {
  bbSearch = document.getElementById('bbSearchInput').value.trim();
  switchTab('broadband');
  renderBBProducts();
}

// ===== 今日推荐 / 运营商分组 =====
function renderRecommendations(products) {
  const grid = document.getElementById('recommendGrid');
  if (!grid) return;
  grid.innerHTML = (products || []).length
    ? products.map(p => `
    <div class="product-card fade-in" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
      <img class="prod-img" src="${p.mainPic || ''}" alt="${p.productName}" loading="lazy" onerror="this.style.background='#f0f0f0'">
      <div class="prod-info">
        <div class="prod-name">${p.productName}</div>
        <div class="prod-tags">${getOperatorTag(p.operator)}${p.backMoneyType === '秒返' ? '<span class="prod-tag" style="background:#fef3c7;color:#92400e;">秒返</span>' : ''}</div>
        <div class="prod-area">📌 ${p.area || '随机'}</div>
      </div>
    </div>`).join('')
    : '<div class="empty-state"><div class="icon">📱</div><p>暂无推荐</p></div>';
}

function renderOperatorSection(byOperator) {
  const container = document.getElementById('operatorSection');
  if (!container || !byOperator) { container.innerHTML = ''; return; }
  let html = '';
  for (const op of OPERATOR_ORDER) {
    const products = byOperator[op];
    if (!products || !products.length) continue;
    const cls = { '移动': 'mobile', '联通': 'unicom', '电信': 'telecom', '广电': 'broadcast' }[op] || '';
    html += `<div class="op-section"><div class="op-title ${cls}">${op} · ${products.length}款</div>
      <div class="product-grid">${products.map(p => `
        <div class="product-card fade-in" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
          <img class="prod-img" src="${p.mainPic || ''}" alt="${p.productName}" loading="lazy" onerror="this.style.display='none'">
          <div class="prod-info"><div class="prod-name">${p.productName}</div>
          <div class="prod-tags">${getOperatorTag(op)}${p.backMoneyType === '秒返' ? '<span class="prod-tag" style="background:#fef3c7;color:#92400e;">秒返</span>' : ''}</div></div>
        </div>`).join('')}</div></div>`;
  }
  container.innerHTML = html || '<p style="font-size:.85rem;color:#888;">暂无数据</p>';
}

function renderDailyArticle(article) {
  const container = document.getElementById('dailyArticle');
  if (!container) return;
  if (!article) { container.innerHTML = '<div class="empty-state"><div class="icon">📝</div><p>今日暂无文章</p></div>'; return; }
  container.innerHTML = `
    <div class="article-title">${article.title}</div>
    <div class="article-body">${article.article.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')}</div>
    <div class="card-footer"><a class="order-btn small" href="${promoData?.storeUrl || STORE_URL}" target="_blank" rel="noopener">进店选购</a></div>`;
}

function renderRanking(ranking) {
  const list = document.getElementById('rankingList');
  if (!list) return;
  if (!ranking || !ranking.length) { list.innerHTML = '<li class="empty-state"><p>暂无数据</p></li>'; return; }
  list.innerHTML = ranking.map((item, i) => {
    const cls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : 'normal';
    return `<li class="ranking-item fade-in">
      <div class="ranking-num ${cls}">${i+1}</div>
      <div class="ranking-info"><div class="ranking-name">${item.productName}</div><div class="ranking-desc">${item.desc||''}</div></div>
      ${((m)=>{const i=OPERATOR_MAP[item.operator];return i?`<span class="ranking-operator ${i.className}">${i.label}</span>`:'';})()}
    </li>`;
  }).join('');
}

function renderSEOTags(kw) {
  const c = document.getElementById('seoTags');
  if (c && kw) c.innerHTML = kw.map(k => `<span class="seo-tag">${k}</span>`).join('');
}

// ===== 文章归档 =====
function renderArticleArchive(articles) {
  const c = document.getElementById('articleArchive');
  if (!c) return;
  if (!articles || !articles.length) {
    c.innerHTML = '<div class="empty-state"><div class="icon">📝</div><p>暂无历史文章</p></div>';
    return;
  }
  c.innerHTML = articles.map((a, i) => {
    const date = a.date || '';
    const title = a.title || a.productName || '文章';
    const preview = (a.article || '').slice(0, 120).replace(/[#*\[\]]/g, '') + '...';
    return `
      <div class="archive-item fade-in" style="padding:14px 0;border-bottom:1px solid #f0f0f0;${i === 0 ? '' : ''}">
        <div style="font-size:.75rem;color:#999;margin-bottom:4px;">${date}</div>
        <div style="font-size:.9rem;font-weight:600;color:#1e3a5f;margin-bottom:4px;">${title}</div>
        <div style="font-size:.82rem;color:#666;line-height:1.6;">${preview}</div>
      </div>`;
  }).join('');
}

// ===== Tab切换 =====
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  const target = document.getElementById('tab-' + tabId);
  if (target) target.style.display = 'block';
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tabId));
}

// ===== 初始化 =====
function initSite() {
  const dateEl = document.getElementById('headerDate');
  if (dateEl) dateEl.textContent = '更新日期：' + formatDate(new Date().toISOString());

  fetch('./data.json?' + Date.now())
    .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(data => {
      promoData = data;
      allProducts = data.products || [];
      // 分离号卡和宽带
      cardProducts = allProducts.filter(p => !isBroadband(p));
      bbProducts = allProducts.filter(p => isBroadband(p));

      renderRecommendations(data.recommendations);
      renderOperatorSection(data.byOperator);
      renderDailyArticle(data.dailyArticle);
      renderRanking(data.hotRanking);
      renderSEOTags(data.seoKeywords);
      renderArticleArchive(data.articles);

      // 号卡专区
      renderCardFilters();
      renderCardProducts();

      // 宽带专区
      renderBBFilters();
      renderBBProducts();

      // Tab切换
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
      });

      if (data.seoKeywords) {
        const meta = document.querySelector('meta[name="keywords"]');
        if (meta) meta.content = data.seoKeywords.join(',');
      }
    })
    .catch(err => {
      console.error('加载失败:', err);
      document.querySelectorAll('.tab-content').forEach(el => {
        el.innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><p>数据加载失败</p></div>';
      });
    });
}
