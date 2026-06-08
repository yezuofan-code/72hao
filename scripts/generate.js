/**
 * 静态站点生成器
 * 生成: 首页、文章页、商品页、归档页、sitemap.xml
 * 所有页面内容直接写入 HTML（非 JS 渲染），利于 SEO
 */
const fs = require('fs');
const path = require('path');
const { getProducts, analyzeProducts } = require('./api');
const { generateAll } = require('./generator');
const ai = require('./ai');

const STORE_URL = 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';
const SITE_URL = process.env.SITE_URL || 'https://72hao.pages.dev';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ARTICLES_DIR = path.join(DIST_DIR, 'articles');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attrJson(obj) {
  return escapeHtml(JSON.stringify(obj));
}

function mdToHtml(md) {
  md = md.replace(/^# .*\n?/, '');
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>\n')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.*$)/gm, '<li>$1</li>');
}

function head(title, desc, keywords, canonical) {
  const url = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc || '海洋号卡 - 正规运营商流量卡·电话卡·宽带免费办理')}">
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ''}
  <link rel="canonical" href="${url}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml((desc || '').slice(0, 200))}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📶</text></svg>">
</head>
<body>`;
}

function header(currentPage) {
  return `<header class="header">
  <div class="header-inner">
    <h1>海洋号卡 <small>· 流量卡 · 宽带</small></h1>
    <nav class="header-nav">
      <a href="/"${currentPage === 'index' ? ' style="color:#1c1c1e;font-weight:600"' : ''}>首页</a>
      <a href="/products.html"${currentPage === 'products' ? ' style="color:#1c1c1e;font-weight:600"' : ''}>号卡</a>
      <a href="/archive.html"${currentPage === 'archive' ? ' style="color:#1c1c1e;font-weight:600"' : ''}>归档</a>
      <a href="${STORE_URL}" target="_blank">店铺</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="footer">
  <p>海洋号卡 · 正规运营商授权推广平台 · <a href="/sitemap.xml">站点地图</a></p>
</footer>`;
}

function footJs() {
  return `<script src="/assets/js/app.js"></script></body></html>`;
}

function wrapPage(body, title, desc, keywords, currentPage, canonical) {
  return head(title, desc, keywords, canonical) + header(currentPage) + body + footer() + footJs();
}

// ===== 生成首页 =====
function generateIndex(products, content, archiveArticles) {
  const dateStr = content.date;
  const today = content.dailyArticle;

  // Hero 文章（今日推荐第一篇或今日评测）
  const hero = content.recommendations?.[0] || today;
  const heroTitle = hero?.title || hero?.productName || '海洋号卡';
  const heroExcerpt = hero?.taocan || (hero?.article || '').replace(/[#*\[\]]/g, '').slice(0, 100) || '';
  const heroImg = hero?.promoImage || hero?.mainPic || '';
  const heroDate = content.date;
  const heroLink = today ? `/articles/article-${dateStr}.html` : (hero?.netAddr || STORE_URL);

  // 最近 4 篇文章（去掉今天的）
  const recentArticles = archiveArticles.filter(a => a.date !== dateStr).slice(0, 4);

  // 推荐商品条（6 个）
  const recProducts = content.recommendations || [];

  // 运营商分组
  const byOp = content.byOperator || {};

  let heroHtml = '';
  if (today) {
    heroHtml = `<a href="${heroLink}" class="hero">
      ${heroImg ? `<img class="hero-img" src="${heroImg}" alt="${escapeHtml(heroTitle)}" loading="lazy">` : '<div class="hero-img" style="background:#e8e6e1"></div>'}
      <div class="hero-body">
        <div class="hero-tag">今日评测</div>
        <h2 class="hero-title">${escapeHtml(heroTitle)}</h2>
        <p class="hero-excerpt">${escapeHtml(heroExcerpt)}</p>
        <div class="hero-meta">${heroDate}</div>
      </div>
    </a>`;
  }

  let recentHtml = '';
  if (recentArticles.length) {
    recentHtml = `<div class="section-head"><h2>最近文章</h2><a href="/archive.html">查看全部 →</a></div>
    <div class="article-grid">`;
    recentArticles.forEach(a => {
      const img = '';
      const excerpt = (a.article || '').replace(/[#*\[\]]/g, '').slice(0, 80);
      recentHtml += `<a href="/articles/article-${a.date}.html" class="article-card">
        ${img ? `<img class="article-card-img" src="${img}" alt="" loading="lazy">` : '<div class="article-card-img" style="background:#e8e6e1"></div>'}
        <div class="article-card-body">
          <div class="article-card-tag">评测</div>
          <div class="article-card-title">${escapeHtml(a.title || a.productName || '')}</div>
          <div class="article-card-excerpt">${escapeHtml(excerpt)}</div>
          <div class="article-card-date">${a.date}</div>
        </div>
      </a>`;
    });
    recentHtml += `</div>`;
  }

  // 商品推荐条
  let prodHtml = '';
  if (recProducts.length) {
    prodHtml = `<div class="product-section">
      <div class="section-head"><h2>今日推荐套餐</h2><a href="/products.html">查看全部 →</a></div>
      <div class="product-strip">`;
    recProducts.forEach(p => {
      prodHtml += `<div class="product-strip-card" onclick="openModal(${attrJson(p)})">
        <img src="${p.mainPic || ''}" alt="${escapeHtml(p.productName)}" loading="lazy" onerror="this.style.display='none'">
        <div class="pbody">
          <div class="pname">${escapeHtml(p.productName)}</div>
          <div class="pmeta">${p.operator} · ${p.area || '全国'}</div>
        </div>
      </div>`;
    });
    prodHtml += `</div></div>`;
  }

  const body = `<main class="container">
    ${heroHtml}
    ${recentHtml}
    ${prodHtml}
  </main>
  <div class="modal-overlay" id="productModal">
    <div class="modal-content">
      <div class="modal-header"><h3 id="modalTitle"></h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="modal-body" id="modalBody"></div>
      <div class="modal-footer"><a class="btn" id="modalOrderBtn" target="_blank" rel="noopener">进店购买</a></div>
    </div>
  </div>`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "海洋号卡",
    "url": SITE_URL,
    "description": "正规运营商流量卡、电话卡、宽带免费办理"
  };
  const schemaHtml = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;

  const indexBody = body + schemaHtml;
  return wrapPage(indexBody, '海洋号卡 - 正规流量卡·电话卡·宽带', '海洋号卡提供正规运营商流量卡、电话卡、宽带服务，低月租大流量，全国包邮。', '流量卡推荐,正规流量卡,大流量套餐,宽带办理,电话卡套餐', 'index', '/');
}

// ===== 生成文章页 =====
function generateArticlePage(a) {
  const title = a.title || a.productName || '文章';
  const content = mdToHtml(a.article || '');
  const date = a.date || '';
  const cleanDesc = (a.article || '').replace(/[#*\[\]]/g, '').slice(0, 150).replace(/\n/g, ' ');
  const canonicalPath = `/articles/article-${date}.html`;
  const keywords = '流量卡评测,' + (a.operator || '') + '流量卡,' + (a.productName || '');

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "datePublished": date,
    "author": { "@type": "Organization", "name": "海洋号卡" },
    "description": cleanDesc
  };
  const schemaHtml = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;

  const body = `<article class="article-page">
    <a href="/archive.html" class="back-link">← 返回归档</a>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${date}</div>
    <div class="content">${content}</div>
    <div class="store-cta">
      <p>感兴趣的话，可以到店里看看有没有适合你的套餐</p>
      <a href="${STORE_URL}" target="_blank" class="btn">进店选购 →</a>
    </div>
  </article>${schemaHtml}`;

  return wrapPage(body, title + ' - 海洋号卡', cleanDesc, keywords, 'archive', canonicalPath);
}

// ===== 生成商品页 =====
function generateProductsPage(products) {
  const cardProducts = products.filter(p => p.flag && !p.productName.includes('宽带') && !p.productName.includes('单宽'));
  const bbProducts = products.filter(p => p.flag && (p.productName.includes('宽带') || p.productName.includes('单宽')));

  const ops = {};
  products.forEach(p => { if (p.flag) ops[p.operator] = (ops[p.operator] || 0) + 1; });

  const opBtns = Object.keys(ops).map(o =>
    `<button class="filter-btn" data-op="${o}">${o}(${ops[o]})</button>`
  ).join('');

  function prodListHtml(list) {
    return list.map(p => {
      const taocan = (p.taocan || '').replace(/佣金[^。]*。?/g, '').slice(0, 60);
      return `<div class="prod-card fade-in" onclick='openModal(${attrJson(p)})'>
        <img src="${p.mainPic || ''}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div class="info">
          <div class="name">${escapeHtml(p.productName)}</div>
          <div class="tags"><span class="tag">${p.operator}</span></div>
          ${taocan ? `<div style="font-size:.8rem;color:#71717a;margin-top:4px;">${escapeHtml(taocan)}</div>` : ''}
          <div class="area">${p.area || '全国'}</div>
        </div>
      </div>`;
    }).join('');
  }

  const body = `<main class="prod-page">
    <h1>号卡专区</h1>
    <p class="subtitle">${cardProducts.length} 款流量卡 · ${bbProducts.length} 款宽带</p>
    <div class="search-box">
      <input type="text" id="prodSearch" placeholder="搜索名称或地区...">
      <button onclick="filterProds()">搜索</button>
    </div>
    <div class="filter-bar" id="prodFilterBar">
      <button class="filter-btn active" data-op="all">全部(${products.filter(p=>p.flag).length})</button>
      ${opBtns}
      <button class="filter-btn" data-op="__broadband__">宽带(${bbProducts.length})</button>
    </div>
    <div class="prod-list" id="prodList">${prodListHtml([...cardProducts, ...bbProducts])}</div>
  </main>
  <div class="modal-overlay" id="productModal">
    <div class="modal-content">
      <div class="modal-header"><h3 id="modalTitle"></h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="modal-body" id="modalBody"></div>
      <div class="modal-footer"><a class="btn" id="modalOrderBtn" target="_blank" rel="noopener">进店购买</a></div>
    </div>
  </div>`;

  return wrapPage(body, '号卡专区 - 海洋号卡', '正规运营商流量卡、电话卡、宽带套餐列表', '流量卡,号卡,手机卡套餐,宽带套餐', 'products', '/products.html');
}

// ===== 生成归档页 =====
function generateArchivePage(articles) {
  let listHtml = '';
  articles.forEach(a => {
    listHtml += `<li><a href="/articles/article-${a.date}.html">${escapeHtml(a.title || a.productName || '')}</a> <span class="date">${a.date}</span></li>`;
  });

  const body = `<main class="archive-page">
    <h1>文章归档</h1>
    <p style="font-size:.85rem;color:#71717a;margin-bottom:20px;">共 ${articles.length} 篇评测文章</p>
    <ul class="archive-list">${listHtml}</ul>
  </main>`;

  return wrapPage(body, '文章归档 - 海洋号卡', '所有历史评测文章汇总', '流量卡评测汇总,号卡文章', 'archive', '/archive.html');
}

// ===== 生成 sitemap.xml =====
function generateSitemap(articles) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/products.html</loc><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/archive.html</loc><priority>0.7</priority></url>`;

  articles.forEach(a => {
    xml += `\n  <url><loc>${SITE_URL}/articles/article-${a.date}.html</loc><priority>0.9</priority><lastmod>${a.date}</lastmod></url>`;
  });
  xml += `\n</urlset>`;
  return xml;
}

// ===== 主构建 =====
async function build(forceRefresh = false) {
  console.log('='.repeat(50));
  console.log('  海洋号卡 - 站点生成');
  console.log('  ', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));

  try {
    const buildId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const products = await getProducts(forceRefresh);
    console.log(`\n📦 商品: ${products.length} 个`);

    // 读取历史
    const outputPath = path.join(DIST_DIR, 'data.json');
    let archiveArticles = [];
    let seenBuildIds = new Set();
    if (fs.existsSync(outputPath)) {
      try {
        const old = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        archiveArticles = old.articles || [];
        archiveArticles.forEach(a => { if (a.buildId) seenBuildIds.add(a.buildId); });
      } catch (e) { /* ignore */ }
    }

    // 生成当日内容（传入 buildId 确保每次选不同商品）
    console.log('✍️ 生成内容...');
    const content = await generateAll(products, ai, buildId);

    // 归档：同一构建不重复添加
    if (content.dailyArticle && !seenBuildIds.has(buildId)) {
      archiveArticles.unshift({ ...content.dailyArticle, date: content.date, buildId });
    }

    // 合并商品数据到 output
    const stats = analyzeProducts(products);
    const output = {
      buildTime: content.generatedAt, date: content.date,
      storeUrl: STORE_URL, stats,
      products: products.map(p => ({
        productID: p.productID, productName: p.productName, mainPic: p.mainPic,
        area: p.area, disableArea: p.disableArea, operator: p.operator,
        price: p.price, backMoneyType: p.backMoneyType, flag: p.flag,
        age1: p.age1, age2: p.age2, taocan: p.taocan || p.productName, netAddr: p.netAddr,
      })),
      dailyArticle: content.dailyArticle ? { ...content.dailyArticle, date: content.date } : null,
      recommendations: content.recommendations, hotRanking: content.hotRanking,
      byOperator: content.byOperator, broadband: content.broadband, seoKeywords: content.seoKeywords,
      articles: archiveArticles,
    };

    ensureDir(DIST_DIR);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    // 生成静态页面
    console.log('📄 生成页面...');

    // 首页
    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.writeFileSync(indexPath, generateIndex(products, content, archiveArticles), 'utf8');
    console.log(`   ✓ 首页 (${(fs.statSync(indexPath).size / 1024).toFixed(1)} KB)`);

    // 文章页
    ensureDir(ARTICLES_DIR);
    let articleCount = 0;
    for (const a of archiveArticles) {
      if (!a.date) continue;
      const articlePath = path.join(ARTICLES_DIR, `article-${a.date}.html`);
      fs.writeFileSync(articlePath, generateArticlePage(a), 'utf8');
      articleCount++;
    }
    console.log(`   ✓ ${articleCount} 篇文章页`);

    // 商品页
    const prodPath = path.join(DIST_DIR, 'products.html');
    fs.writeFileSync(prodPath, generateProductsPage(output.products), 'utf8');
    console.log(`   ✓ 商品页`);

    // 归档页
    const archPath = path.join(DIST_DIR, 'archive.html');
    fs.writeFileSync(archPath, generateArchivePage(archiveArticles), 'utf8');
    console.log(`   ✓ 归档页`);

    // sitemap
    const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, generateSitemap(archiveArticles), 'utf8');
    console.log(`   ✓ sitemap.xml`);

    // robots.txt
    const robotsPath = path.join(DIST_DIR, 'robots.txt');
    fs.writeFileSync(robotsPath, `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`, 'utf8');
    console.log(`   ✓ robots.txt`);

    console.log(`\n✅ 站点生成完成`);
    return true;
  } catch (err) {
    console.error('\n❌ 构建失败:', err.message);
    return false;
  }
}

if (require.main === module) {
  build(process.argv.includes('--force') || process.argv.includes('-f'))
    .then(s => process.exit(s ? 0 : 1));
}

module.exports = { build };
