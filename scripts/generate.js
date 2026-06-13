/**
 * 静态站点生成器
 * - 杂志风布局（文章为主角）
 * - 文章标签（运营商+地区）
 * - 社交分享按钮
 * - 品牌色 + logo
 */
const fs = require('fs');
const path = require('path');
const { getProducts, analyzeProducts } = require('./api');
const { generateAll } = require('./generator');
const ai = require('./ai');

const STORE_URL = 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';
const SITE_URL = process.env.SITE_URL || 'https://72hao.huanghaiwan.com';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ARTICLES_DIR = path.join(DIST_DIR, 'articles');

const AREA_GROUP = {
  '广东':'华南','广西':'华南','海南':'华南','福建':'华南',
  '湖南':'华中','湖北':'华中','河南':'华中','江西':'华中',
  '上海':'华东','浙江':'华东','江苏':'华东','安徽':'华东','山东':'华东',
  '北京':'华北','天津':'华北','河北':'华北','山西':'华北','内蒙古':'华北',
  '四川':'西南','重庆':'西南','云南':'西南','贵州':'西南','西藏':'西南',
  '陕西':'西北','甘肃':'西北','青海':'西北','宁夏':'西北','新疆':'西北',
  '辽宁':'东北','吉林':'东北','黑龙江':'东北',
};

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function attrJson(obj) { return escapeHtml(JSON.stringify(obj)); }

function mdToHtml(md) {
  md = md.replace(/^# .*\n?/, '');
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>\n')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.*$)/gm, '<li>$1</li>');
}

function getAreaGroup(area) {
  if (!area || area === '随机' || area === '收货地为归属地' || area === '收货地') return '全国';
  for (const [key] of Object.entries(AREA_GROUP)) { if (area.includes(key)) return AREA_GROUP[key]; }
  return '全国';
}

// 品牌色: 深蓝 #1a365d + 蓝色 #2563eb + 红色 #b91c1c
// Logo 用文字版

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
  <meta property="og:site_name" content="海洋号卡">
  <meta name="theme-color" content="#1a365d">
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌊</text></svg>">
  <script>var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?15a9d88ef86a915b1135dde9fe372769";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s)})();</script>
</head>
<body>`;
}

function header(currentPage) {
  return `<header class="header">
  <div class="header-inner">
    <a href="/" class="logo">
      <span class="logo-icon">🌊</span>
      <span class="logo-text">海洋号卡</span>
      <span class="logo-tag">流量卡·宽带</span>
    </a>
    <nav class="header-nav">
      <a href="/"${currentPage === 'index' ? ' class="active"' : ''}>首页</a>
      <a href="/products.html"${currentPage === 'products' ? ' class="active"' : ''}>号卡</a>
      <a href="/archive.html"${currentPage === 'archive' ? ' class="active"' : ''}>归档</a>
      <a href="${STORE_URL}" target="_blank" class="store-nav">店铺</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">🌊 海洋号卡</div>
    <p>正规运营商授权推广平台 · <a href="/sitemap.xml">站点地图</a></p>
  </div>
</footer>`;
}

function footJs() { return `<script src="/assets/js/app.js"></script></body></html>`; }
function wrapPage(body, title, desc, keywords, currentPage, canonical) {
  return head(title, desc, keywords, canonical) + header(currentPage) + body + footer() + footJs();
}

// ===== 社交分享（各平台生成合规文案） =====
function shareHtml(url, title, articleText, operator) {
  const encodedUrl = encodeURIComponent(url);
  const cleanBody = (articleText || '').replace(/[#*\[\]>]/g, '').replace(/\n+/g, '\n').slice(0, 600);
  // 用 encodeURIComponent 处理中文（浏览器端用 decodeURIComponent 解）
  const bodyEncoded = encodeURIComponent(cleanBody);
  const titleEncoded = encodeURIComponent(title);
  return `<div class="share-bar">
    <span class="share-label">📤 分享到</span>
    <button class="share-btn" onclick="copyForPlatform('zhihu','${titleEncoded}','${bodyEncoded}','${operator || ''}')">知乎</button>
    <button class="share-btn" onclick="copyForPlatform('xiaohongshu','${titleEncoded}','${bodyEncoded}','${operator || ''}')">小红书</button>
    <button class="share-btn" onclick="copyForPlatform('tieba','${titleEncoded}','${bodyEncoded}','${operator || ''}')">贴吧</button>
    <button class="share-btn" onclick="copyForPlatform('copy','${titleEncoded}','${bodyEncoded}','${operator || ''}')">📋 复制</button>
  </div>`;
}

// ===== 文章标签 =====
function articleTags(operator, area) {
  const areaGroup = getAreaGroup(area);
  return `<div class="article-tags">
    <span class="tag tag-op tag-${operator}">${operator}</span>
    <span class="tag tag-area">${areaGroup}</span>
    ${area !== '随机' ? `<span class="tag tag-loc">${escapeHtml(area)}</span>` : ''}
  </div>`;
}

// ===== 首页（博客为主） =====
function generateIndex(products, content, archiveArticles) {
  const dateStr = content.date;
  const blog = content.blogArticle;
  const recentArticles = archiveArticles.slice(0, 8);
  const recProducts = content.recommendations || [];

  // Hero: 今日博客文章
  let heroHtml = '';
  if (blog) {
    const excerpt = (blog.article || '').replace(/[#*\[\]]/g, '').slice(0, 150);
    const catLabel = blog.category || '干货';
    heroHtml = `<a href="/articles/article-${blog.slug || dateStr}.html" class="hero-article">
      <div class="hero-article-body">
        <div class="hero-label">${catLabel}</div>
        <h2 class="hero-title">${escapeHtml(blog.title || '')}</h2>
        <div class="hero-meta">${dateStr} · ${escapeHtml(blog.seoKeyword || '')}</div>
        <p class="hero-excerpt">${escapeHtml(excerpt)}</p>
        <span class="hero-read">阅读全文 →</span>
      </div>
    </a>`;
  }

  // 文章列表（博客卡片形式）
  let recentHtml = '';
  if (recentArticles.length) {
    recentHtml = `<section class="section-head"><h2>最新文章</h2><a href="/archive.html" class="more-link">查看全部 →</a></section>
    <div class="article-grid">`;
    recentArticles.forEach(a => {
      const slug = a.slug || a.date;
      const catLabel = a.category || (a.type === 'blog' ? '干货' : '评测');
      const excerpt = (a.article || '').replace(/[#*\[\]]/g, '').slice(0, 100);
      recentHtml += `<a href="/articles/article-${slug}.html" class="article-card">
        <div class="article-card-body">
          <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#a1a1aa;margin-bottom:6px;">
            <span>${a.date}</span>
            <span>${catLabel}</span>
          </div>
          <h3 class="article-card-title">${escapeHtml(a.title || '')}</h3>
          <p class="article-card-excerpt">${escapeHtml(excerpt)}</p>
        </div>
      </a>`;
    });
    recentHtml += `</div>`;
  }

  // 今日推荐套餐（放在下面，次要位置）
  let prodHtml = '';
  if (recProducts.length) {
    prodHtml = `<section class="section-head" style="margin-top:32px;"><h2>今日推荐套餐</h2><a href="/products.html" class="more-link">全部套餐 →</a></section>
    <div class="prod-strip-wrap">`;
    recProducts.forEach(p => {
      prodHtml += `<div class="rec-card" onclick="openModal(${attrJson(p)})">
        <img src="${p.mainPic || ''}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div class="rec-card-body">
          <div class="rec-card-name">${escapeHtml(p.productName)}</div>
          <div class="rec-card-meta">${escapeHtml(p.operator)} · ${escapeHtml(p.area || '全国')}</div>
        </div>
      </div>`;
    });
    prodHtml += `</div>`;
  }

  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "WebSite",
    "name": "海洋号卡", "url": SITE_URL,
    "description": "正规运营商流量卡、电话卡、宽带免费办理"
  });

  const body = `<main class="container">
    ${heroHtml}
    ${recentHtml}
    ${prodHtml}
  </main>
  <div class="modal-overlay" id="productModal"><div class="modal-content">
    <div class="modal-header"><h3 id="modalTitle"></h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body" id="modalBody"></div>
    <div class="modal-footer"><a class="btn" id="modalOrderBtn" target="_blank" rel="noopener">进店购买</a></div>
  </div></div>
  <script type="application/ld+json">${schema}</script>`;

  return wrapPage(body, '海洋号卡 - 流量卡·宽带·正规运营商', '海洋号卡提供正规运营商流量卡、电话卡、宽带服务，低月租大流量，全国包邮。', '流量卡推荐,正规流量卡,大流量套餐,宽带办理,电话卡套餐', 'index', '/');
}

// ===== 文章页（支持博客格式+旧评测格式） =====
function generateArticlePage(a) {
  const title = a.title || a.productName || '文章';
  const content = mdToHtml(a.article || '');
  const date = a.date || '';
  const slug = a.slug || date;
  const cleanDesc = (a.article || '').replace(/[#*\[\]]/g, '').slice(0, 150).replace(/\n/g, ' ');
  const canonicalPath = `/articles/article-${slug}.html`;
  const articleUrl = `${SITE_URL}${canonicalPath}`;

  // 判断是博客文章还是旧评测文章
  const isBlog = a.type === 'blog' || a.category;
  const catLabel = a.category || '评测';
  const keywords = isBlog
    ? (a.seoKeyword || '') + ',流量卡,宽带'
    : '流量卡评测,' + (a.operator || '') + '流量卡,' + (a.productName || '');

  // 博文底部推荐商品
  let recHtml = '';
  if (isBlog && a.relatedProducts && a.relatedProducts.length > 0) {
    recHtml = `<div class="blog-rec">
      <div class="blog-rec-title">📌 相关推荐</div>
      <div class="blog-rec-grid">`;
    a.relatedProducts.forEach(p => {
      const taocan = (p.taocan || '').replace(/佣金[^。]*。?/g, '').slice(0, 60);
      recHtml += `<div class="blog-rec-card" onclick="openModal(${attrJson(p)})">
        <img src="${p.mainPic || ''}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div class="blog-rec-body">
          <div class="blog-rec-name">${escapeHtml(p.productName)}</div>
          <div class="blog-rec-meta">${escapeHtml(p.operator)} · ${escapeHtml(p.area || '全国')}</div>
          ${taocan ? `<div class="blog-rec-taocan">${escapeHtml(taocan)}</div>` : ''}
        </div>
      </div>`;
    });
    recHtml += `</div></div>`;
  }

  // 旧评测文章的单商品引导（兼容）
  const oldCta = !isBlog ? `<div class="store-cta">
    <p>感兴趣的话，可以看看这个套餐的详情</p>
    <a href="${a.netAddr || STORE_URL}" target="_blank" class="btn">查看套餐详情 →</a>
  </div>` : '';

  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "Article",
    "headline": title, "datePublished": date,
    "author": { "@type": "Organization", "name": "海洋号卡" },
    "description": cleanDesc
  });

  const body = `<article class="article-page">
    <a href="/archive.html" class="back-link">← 返回归档</a>
    <h1>${escapeHtml(title)}</h1>
    <div class="article-meta-line">
      <span class="meta-date">${date} · ${catLabel}</span>
      ${isBlog ? `<span style="font-size:.72rem;color:#b91c1c;">#${escapeHtml(a.seoKeyword || catLabel)}</span>` : ''}
    </div>
    <div class="content">${content}</div>
    ${recHtml}
    ${shareHtml(articleUrl, title, a.article, a.operator)}
    ${oldCta}
  </article>
  <script type="application/ld+json">${schema}</script>`;

  return wrapPage(body, title + ' - 海洋号卡', cleanDesc, keywords, 'archive', canonicalPath);
}

// ===== 归档页（带筛选） =====
function generateArchivePage(articles) {
  // 收集所有标签
  const operators = [...new Set(articles.map(a => a.operator).filter(Boolean))];

  let listHtml = '';
  articles.forEach(a => {
    const tags = articleTags(a.operator, a.area);
    listHtml += `<li class="archive-item">
      <a href="/articles/article-${a.slug || a.date}.html">
        <span class="archive-date">${a.date}</span>
        ${escapeHtml(a.title || a.productName || '')}
      </a>
      <div class="archive-tags">${tags}</div>
    </li>`;
  });

  const opBtns = operators.map(o => `<button class="filter-btn" data-op="${o}">${o}</button>`).join('');

  const body = `<main class="archive-page">
    <h1>文章归档</h1>
    <p class="archive-subtitle">共 ${articles.length} 篇评测 · 每日更新</p>
    <div class="filter-bar" id="archiveFilter">
      <button class="filter-btn active" data-op="all">全部</button>
      ${opBtns}
    </div>
    <ul class="archive-list" id="archiveList">${listHtml}</ul>
  </main>`;

  return wrapPage(body, '文章归档 - 海洋号卡', '所有历史评测文章汇总', '流量卡评测汇总,号卡文章,流量卡推荐', 'archive', '/archive.html');
}

// ===== 商品页 =====
function generateProductsPage(products) {
  const cardProducts = products.filter(p => p.flag && !p.productName.includes('宽带') && !p.productName.includes('单宽'));
  const bbProducts = products.filter(p => p.flag && (p.productName.includes('宽带') || p.productName.includes('单宽')));
  const ops = {};
  products.forEach(p => { if (p.flag) ops[p.operator] = (ops[p.operator] || 0) + 1; });
  const opBtns = Object.keys(ops).map(o => `<button class="filter-btn" data-op="${o}">${o}(${ops[o]})</button>`).join('');

  function prodListHtml(list) {
    return list.map(p => {
      const taocan = (p.taocan || '').replace(/佣金[^。]*。?/g, '').slice(0, 60);
      return `<div class="prod-card" onclick='openModal(${attrJson(p)})'>
        <img src="${p.mainPic || ''}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div class="info">
          <div class="name">${escapeHtml(p.productName)}</div>
          <div class="tags"><span class="tag">${p.operator}</span></div>
          ${taocan ? `<div class="prod-taocan">${escapeHtml(taocan)}</div>` : ''}
          <div class="area">${p.area || '全国'}</div>
        </div>
      </div>`;
    }).join('');
  }

  const body = `<main class="prod-page">
    <h1>套餐一览</h1>
    <p class="subtitle">${cardProducts.length} 款流量卡 · ${bbProducts.length} 款宽带</p>
    <div class="search-box"><input type="text" id="prodSearch" placeholder="搜索名称或地区"><button onclick="filterProds()">搜索</button></div>
    <div class="filter-bar" id="prodFilterBar">
      <button class="filter-btn active" data-op="all">全部(${products.filter(p=>p.flag).length})</button>
      ${opBtns}
      <button class="filter-btn" data-op="__broadband__">宽带(${bbProducts.length})</button>
    </div>
    <div class="prod-list" id="prodList">${prodListHtml([...cardProducts, ...bbProducts])}</div>
  </main>
  <div class="modal-overlay" id="productModal"><div class="modal-content">
    <div class="modal-header"><h3 id="modalTitle"></h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body" id="modalBody"></div>
    <div class="modal-footer"><a class="btn" id="modalOrderBtn" target="_blank" rel="noopener">进店购买</a></div>
  </div></div>`;

  return wrapPage(body, '套餐一览 - 海洋号卡', '正规运营商流量卡、电话卡、宽带套餐列表', '流量卡,号卡,手机卡套餐,宽带套餐', 'products', '/products.html');
}

// ===== sitemap =====
function generateSitemap(articles) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/products.html</loc><priority>0.8</priority></url>
  <url><loc>${SITE_URL}/archive.html</loc><priority>0.7</priority></url>`;
  articles.forEach(a => {
    xml += `\n  <url><loc>${SITE_URL}/articles/article-${a.slug || a.date}.html</loc><priority>0.9</priority><lastmod>${a.date}</lastmod></url>`;
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

    const outputPath = path.join(DIST_DIR, 'data.json');
    let archiveArticles = [];
    let seenBuildIds = new Set();
    if (fs.existsSync(outputPath)) {
      try {
        const old = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        archiveArticles = old.articles || [];
        // 为旧文章分配 slug
        const slugCounts = {};
        archiveArticles.forEach(a => {
          if (a.buildId) seenBuildIds.add(a.buildId);
          if (!a.slug) {
            const base = a.date || 'unknown';
            slugCounts[base] = (slugCounts[base] || 0) + 1;
            a.slug = slugCounts[base] > 1 ? `${base}-${slugCounts[base]}` : base;
          }
          // 旧文章补 netAddr 和 mainPic
          if ((!a.netAddr || !a.mainPic) && a.productID) {
            const prod = products.find(p => p.productID === a.productID);
            if (prod) {
              if (!a.netAddr) a.netAddr = prod.netAddr;
              if (!a.mainPic) a.mainPic = prod.mainPic;
            }
          }
        });
      } catch (e) { /* ignore */ }
    }

    console.log('✍️ 生成内容...');
    const content = await generateAll(products, ai, buildId);

    // 博客文章归档
    if (content.blogArticle && !seenBuildIds.has(buildId)) {
      const slugBase = content.date;
      const sameDayCount = archiveArticles.filter(a => a.date === content.date).length;
      const slug = sameDayCount > 0 ? `${slugBase}-${sameDayCount + 1}` : slugBase;
      archiveArticles.unshift({
        ...content.blogArticle,
        date: content.date,
        buildId,
        slug,
        type: 'blog',
      });
    }

    const stats = analyzeProducts(products);
    const output = {
      buildTime: content.generatedAt, date: content.date, storeUrl: STORE_URL, stats,
      products: products.map(p => ({
        productID: p.productID, productName: p.productName, mainPic: p.mainPic,
        area: p.area, disableArea: p.disableArea, operator: p.operator,
        price: p.price, backMoneyType: p.backMoneyType, flag: p.flag,
        age1: p.age1, age2: p.age2, taocan: p.taocan || p.productName, netAddr: p.netAddr,
      })),
      blogArticle: content.blogArticle ? { ...content.blogArticle, date: content.date } : null,
      recommendations: content.recommendations, hotRanking: content.hotRanking,
      byOperator: content.byOperator, broadband: content.broadband, seoKeywords: content.seoKeywords,
      articles: archiveArticles,
    };

    ensureDir(DIST_DIR);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

    console.log('📄 生成页面...');
    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.writeFileSync(indexPath, generateIndex(products, content, archiveArticles), 'utf8');
    console.log(`   ✓ 首页 (${(fs.statSync(indexPath).size / 1024).toFixed(1)} KB)`);

    ensureDir(ARTICLES_DIR);
    let articleCount = 0;
    for (const a of archiveArticles) {
      if (!a.date) continue;
      const articleSlug = a.slug || a.date;
      fs.writeFileSync(path.join(ARTICLES_DIR, `article-${articleSlug}.html`), generateArticlePage(a), 'utf8');
      articleCount++;
    }
    console.log(`   ✓ ${articleCount} 篇文章页`);

    fs.writeFileSync(path.join(DIST_DIR, 'products.html'), generateProductsPage(output.products), 'utf8');
    fs.writeFileSync(path.join(DIST_DIR, 'archive.html'), generateArchivePage(archiveArticles), 'utf8');
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), generateSitemap(archiveArticles), 'utf8');

    const robotsPath = path.join(DIST_DIR, 'robots.txt');
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`, 'utf8');

    console.log(`   ✓ sitemap.xml`);
    console.log(`   ✓ robots.txt`);

    // _redirects (Cloudflare pages.dev -> 自定义域名)
    const redirectsPath = path.join(DIST_DIR, '_redirects');
    fs.writeFileSync(redirectsPath, `/*  https://72hao.huanghaiwan.com/:splat  301\n`, 'utf8');
    console.log(`   ✓ _redirects`);

    // 百度站长验证文件
    const bdSrc = path.join(__dirname, '..', 'baidu_verify_codeva-oGFISGSCpA.html');
    const bdDst = path.join(DIST_DIR, 'baidu_verify_codeva-oGFISGSCpA.html');
    if (fs.existsSync(bdSrc)) {
      fs.copyFileSync(bdSrc, bdDst);
      console.log(`   ✓ 百度验证文件`);
    }

    console.log(`\n✅ 站点生成完成`);
    return true;
  } catch (err) {
    console.error('\n❌ 构建失败:', err.message);
    return false;
  }
}

if (require.main === module) {
  build(process.argv.includes('--force') || process.argv.includes('-f')).then(s => process.exit(s ? 0 : 1));
}

module.exports = { build };
