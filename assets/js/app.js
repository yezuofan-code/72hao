/**
 * 推广站前端应用
 * 加载生成的 JSON 数据，渲染所有页面模块
 */

// ===== 数据 =====
let allProducts = [];
let promoData = null;
let currentFilter = 'all';
let searchTerm = '';

const OPERATOR_MAP = {
  '移动': { className: 'tag-移动', label: '移动' },
  '联通': { className: 'tag-联通', label: '联通' },
  '电信': { className: 'tag-电信', label: '电信' },
  '广电': { className: 'tag-广电', label: '广电' },
};

const OPERATOR_ORDER = ['移动', '联通', '电信', '广电'];

// ===== 工具函数 =====
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function getOperatorTag(op) {
  const info = OPERATOR_MAP[op] || { className: 'tag-移动', label: op };
  return `<span class="prod-tag ${info.className}">${info.label}</span>`;
}

function getOperatorBadge(op) {
  const info = OPERATOR_MAP[op] || { className: 'tag-移动', label: op };
  return `<span class="ranking-operator ${info.className}">${info.label}</span>`;
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

  const netAddr = product.netAddr || `https://haokawx.lot-ml.com/ProductEn/Detail/${product.productID}`;
  document.getElementById('modalOrderBtn').href = netAddr;

  const body = document.getElementById('modalBody');
  const age1 = product.age1 || 18;
  const age2 = product.age2 || 60;
  const taocan = product.taocan || product.productName || '暂无';

  body.innerHTML = `
    <img src="${product.mainPic || ''}" alt="${product.productName}" style="width:100%;border-radius:8px;margin-bottom:12px;" onerror="this.style.display='none'">
    <div class="detail-row"><span class="detail-label">运营商</span><span class="detail-value">${product.operator || '未知'}</span></div>
    <div class="detail-row"><span class="detail-label">归属地</span><span class="detail-value">${product.area || '随机'}</span></div>
    <div class="detail-row"><span class="detail-label">佣金</span><span class="detail-value price">${product.price || 0}元</span></div>
    <div class="detail-row"><span class="detail-label">返佣类型</span><span class="detail-value">${product.backMoneyType || '-'}</span></div>
    <div class="detail-row"><span class="detail-label">适用年龄</span><span class="detail-value">${age1}-${age2}岁</span></div>
    <div class="detail-row"><span class="detail-label">套餐说明</span><span class="detail-value" style="text-align:right;max-width:60%;">${taocan}</span></div>
    ${product.disableArea ? `<div class="detail-row"><span class="detail-label">禁发区域</span><span class="detail-value" style="text-align:right;max-width:60%;font-size:.78rem;color:#888;">${truncate(product.disableArea, 80)}</span></div>` : ''}
  `;

  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('productModal').classList.remove('show');
}

// 点击遮罩关闭
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeModal();
});

// ===== 渲染函数 =====

function renderRecommendations(products) {
  const grid = document.getElementById('recommendGrid');
  if (!grid || !products || !products.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">📱</div><p>暂无推荐商品</p></div>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card fade-in" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
      <img class="prod-img" src="${p.mainPic || ''}" alt="${p.productName}" loading="lazy" onerror="this.style.background='#f0f0f0';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2230%22>📱</text></svg>'">
      <div class="prod-info">
        <div class="prod-name">${p.productName}</div>
        <div class="prod-tags">
          ${getOperatorTag(p.operator)}
          ${p.backMoneyType === '秒返' ? '<span class="prod-tag" style="background:#fef3c7;color:#92400e;">秒返</span>' : ''}
        </div>
        <div class="prod-price">${p.price}<span>元佣金</span></div>
        <div class="prod-area">📌 ${p.area || '随机'}</div>
      </div>
    </div>
  `).join('');
}

function renderOperatorSection(byOperator) {
  const container = document.getElementById('operatorSection');
  if (!container || !byOperator) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (const op of OPERATOR_ORDER) {
    const products = byOperator[op];
    if (!products || !products.length) continue;

    const cls = { '移动': 'mobile', '联通': 'unicom', '电信': 'telecom', '广电': 'broadcast' }[op] || '';

    html += `
      <div class="op-section">
        <div class="op-title ${cls}">${op} · ${products.length}款</div>
        <div class="product-grid">
          ${products.map(p => `
            <div class="product-card fade-in" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
              <img class="prod-img" src="${p.mainPic || ''}" alt="${p.productName}" loading="lazy" onerror="this.style.display='none'">
              <div class="prod-info">
                <div class="prod-name">${p.productName}</div>
                <div class="prod-tags">
                  ${getOperatorTag(op)}
                  ${p.backMoneyType === '秒返' ? '<span class="prod-tag" style="background:#fef3c7;color:#92400e;">秒返</span>' : ''}
                </div>
                <div class="prod-price">${p.price}<span>元佣金</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html || '<p style="font-size:.85rem;color:#888;">暂无数据</p>';
}

function renderDailyArticle(article) {
  const container = document.getElementById('dailyArticle');
  if (!container || !article) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📝</div><p>今日暂无评测文章</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="article-title">${article.title}</div>
    <div class="article-body">${article.article.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')}</div>
    <div class="card-footer">
      <a class="order-btn small" href="${promoData?.recommendations?.[0]?.netAddr || 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6'}" target="_blank" rel="noopener">立即下单</a>
    </div>
  `;
}

function renderRanking(ranking) {
  const list = document.getElementById('rankingList');
  if (!list || !ranking || !ranking.length) {
    list.innerHTML = '<li class="empty-state"><p>暂无榜单数据</p></li>';
    return;
  }

  list.innerHTML = ranking.map((item, i) => {
    const cls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : 'normal';
    return `
      <li class="ranking-item fade-in">
        <div class="ranking-num ${cls}">${i + 1}</div>
        <div class="ranking-info">
          <div class="ranking-name">${item.productName}</div>
          <div class="ranking-desc">${item.desc || ''}</div>
        </div>
        ${getOperatorBadge(item.operator)}
        <div class="ranking-price">${item.price}元</div>
      </li>
    `;
  }).join('');
}

function renderBroadband(products) {
  const grid = document.getElementById('broadbandGrid');
  if (!grid || !products || !products.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🌐</div><p>暂无宽带商品</p></div>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card fade-in" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
      <div class="prod-info" style="padding:14px 10px;">
        <div class="prod-name">${p.productName}</div>
        <div class="prod-tags" style="margin-top:8px;">
          <span class="prod-tag tag-宽带">宽带</span>
          ${getOperatorTag(p.operator)}
        </div>
        <div class="prod-price">${p.price}<span>元佣金</span></div>
        <div class="prod-area">📌 ${p.area || '随机'}</div>
        <div class="prod-backmoney">返佣: ${p.backMoneyType || '-'}</div>
      </div>
    </div>
  `).join('');
}

function renderAllProducts(products) {
  const grid = document.getElementById('allProductGrid');
  const loading = document.getElementById('allLoading');
  if (loading) loading.style.display = 'none';

  if (!grid) return;

  let filtered = [...products];

  // 运营商筛选
  if (currentFilter !== 'all') {
    filtered = filtered.filter(p => p.operator === currentFilter);
  }

  // 搜索
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      (p.productName && p.productName.toLowerCase().includes(term)) ||
      (p.operator && p.operator.includes(term)) ||
      (p.area && p.area.includes(term))
    );
  }

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>没有找到匹配的商品</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="product-card fade-in" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
      <img class="prod-img" src="${p.mainPic || ''}" alt="${p.productName}" loading="lazy" onerror="this.style.background='#f0f0f0';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2230%22>📱</text></svg>'">
      <div class="prod-info">
        <div class="prod-name">${p.productName}</div>
        <div class="prod-tags">
          ${getOperatorTag(p.operator)}
          ${p.backMoneyType === '秒返' ? '<span class="prod-tag" style="background:#fef3c7;color:#92400e;">秒返</span>' : ''}
        </div>
        <div class="prod-price">${p.price}<span>元佣金</span></div>
        <div class="prod-area">📌 ${p.area || '随机'}</div>
      </div>
    </div>
  `).join('');
}

function renderFilterBar(products) {
  const bar = document.getElementById('filterBar');
  if (!bar) return;

  const ops = {};
  products.forEach(p => { ops[p.operator] = (ops[p.operator] || 0) + 1; });

  const opList = OPERATOR_ORDER.filter(op => ops[op]);
  bar.innerHTML = `
    <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">全部(${products.length})</button>
    ${opList.map(op => `<button class="filter-btn ${currentFilter === op ? 'active' : ''}" data-filter="${op}">${op}(${ops[op]})</button>`).join('')}
  `;

  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderFilterBar(products);
      renderAllProducts(allProducts);
    });
  });
}

function renderSEOTags(keywords) {
  const container = document.getElementById('seoTags');
  if (!container || !keywords) return;
  container.innerHTML = keywords.map(k => `<span class="seo-tag">${k}</span>`).join('');
}

function searchProducts() {
  const input = document.getElementById('searchInput');
  searchTerm = input.value.trim();
  // 切换到全部tab
  switchTab('all');
  renderAllProducts(allProducts);
}

// ===== Tab切换 =====
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  const target = document.getElementById('tab-' + tabId);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
}

// ===== 初始化 =====
function initSite() {
  // 显示日期
  const dateEl = document.getElementById('headerDate');
  if (dateEl) dateEl.textContent = '更新日期：' + formatDate(new Date().toISOString());

  // 加载数据
  fetch('./data.json?' + Date.now())
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      promoData = data;
      allProducts = data.products || [];

      renderRecommendations(data.recommendations);
      renderOperatorSection(data.byOperator);
      renderDailyArticle(data.dailyArticle);
      renderRanking(data.hotRanking);
      renderBroadband(data.broadband);
      renderAllProducts(allProducts);
      renderFilterBar(allProducts);
      renderSEOTags(data.seoKeywords);

      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
      });

      // 更新meta关键词
      if (data.seoKeywords && data.seoKeywords.length) {
        const meta = document.querySelector('meta[name="keywords"]');
        if (meta) meta.content = data.seoKeywords.join(',');
      }
    })
    .catch(err => {
      console.error('加载数据失败:', err);
      document.querySelectorAll('.tab-content').forEach(el => {
        el.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>数据加载失败，请刷新页面重试</p></div>`;
      });
    });
}
