/**
 * 海洋号卡 - 杂志博客风格站点生成器
 */
const fs = require('fs');
const path = require('path');
const { getProducts, analyzeProducts } = require('./api');
const { generateAll } = require('./generator');
const ai = require('./ai');

const STORE = 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';
const SITE = process.env.SITE_URL || 'https://72hao.huanghaiwan.com';
const DIST = path.join(__dirname, '..', 'dist');
const ADIR = path.join(DIST, 'articles');

const ed = d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); };
const es = s => { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
const aj = o => es(JSON.stringify(o));
const md = s => {
  s = s.replace(/^# .*\n?/,'');
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>\n').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\[(.*?)\]\((.*?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^## (.*$)/gm,'<h2>$1</h2>').replace(/> (.*$)/gm,'<blockquote>$1</blockquote>')
    .replace(/^- (.*$)/gm,'<li>$1</li>');
};

function head(t,d,k,c) {
  const u = c ? SITE + c : SITE;
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${es(t)}</title>
<meta name="description" content="${es(d||'海洋号卡 - 流量卡·宽带干货')}">
${k?`<meta name="keywords" content="${es(k)}">`:''}
<link rel="canonical" href="${u}"><meta property="og:title" content="${es(t)}">
<meta property="og:description" content="${es((d||'').slice(0,200))}">
<meta property="og:url" content="${u}">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌊</text></svg>">
<script>var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?15a9d88ef86a915b1135dde9fe372769";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s)})();</script>
</head><body>`;
}

function nav(p) {
  return `<nav class="nav"><div class="nav-inner">
    <a href="/" class="nav-logo">🌊 海洋号卡</a>
    <div class="nav-links">
      <a href="/?cat=科普">科普</a>
      <a href="/?cat=避坑">避坑</a>
      <a href="/?cat=技巧">技巧</a>
      <a href="/?cat=内幕">内幕</a>
      <a href="/?cat=生活">生活</a>
      <a href="/products.html">套餐</a>
    </div>
    <div class="nav-right">
      <a href="/archive.html">归档</a>
      <a href="${STORE}" target="_blank" class="store-btn">店铺 →</a>
    </div>
  </div></nav>`;
}

function footer() {
  return `<div class="footer">
    <p>🌊 海洋号卡 · 正规运营商授权推广平台</p>
    <p style="margin-top:4px;font-size:12px;"><a href="/archive.html">文章</a> · <a href="/products.html">套餐</a> · <a href="/sitemap.xml">站点地图</a></p>
  </div>`;
}
const fj = () => `<script src="/assets/js/app.js"></script></body></html>`;
const wrap = (b,t,d,k,cp,c) => head(t,d,k,c)+nav(cp)+b+footer()+fj();

const CATS = [{k:'',l:'全部'},{k:'科普',l:'科普'},{k:'避坑',l:'避坑'},{k:'技巧',l:'技巧'},{k:'内幕',l:'内幕'},{k:'生活',l:'生活'}];

function genIndex(prods,content,arts) {
  const ds=content.date,blog=content.blogArticle,recents=arts.slice(0,9),recs=content.recommendations||[];
  let hero='';
  if(blog) {
    const ex=(blog.article||'').replace(/[#*\[\]]/g,'').slice(0,200);
    hero=`<section class="section"><h2 class="section-title"><span>今日精选</span></h2>
    <a href="/articles/article-${blog.slug||ds}.html" class="featured" style="text-decoration:none;color:inherit;">
      <div class="featured-img"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;color:#8a857f;">📰</div></div>
      <div class="featured-body"><span class="featured-cat">${blog.category||'文章'}</span>
      <h2>${es(blog.title||'')}</h2>
      <p>${es(ex)}</p>
      <span class="meta">${ds}</span></div>
    </a></section>`;
  }
  let list=`<section class="section"><h2 class="section-title" style="margin-top:0;"><span>最新文章</span></h2><div class="article-grid">`;
  recents.forEach(a=>{
    const sl=a.slug||a.date,cl=a.category||'文章',ex=(a.article||'').replace(/[#*\[\]]/g,'').slice(0,100);
    list+=`<a href="/articles/article-${sl}.html" class="article-card" style="text-decoration:none;color:inherit;" data-c="${a.category||'其他'}">
      <div class="article-card-img"><div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;">📄</div></div>
      <div class="article-card-body"><span class="article-card-cat">${cl}</span>
      <h3>${es(a.title||'')}</h3>
      <p>${es(ex)}</p><div class="date">${a.date}</div></div>
    </a>`;
  });
  list+=`</div></section>`;
  let prodHtml='';
  if(recs.length){
    prodHtml=`<section class="section"><h2 class="section-title"><span>推荐套餐</span></h2><p class="section-sub">精选正规运营商套餐</p><div class="product-grid">`;
    recs.forEach(p=>{
      prodHtml+=`<div class="product-card" onclick="om(${aj(p)})">
        <div class="product-card-img"><img src="${p.mainPic||''}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;>📱</div>'"></div>
        <div class="product-card-body"><div class="product-card-name">${es(p.productName)}</div><div class="product-card-meta">${es(p.operator)} · ${es(p.area||'全国')}</div></div>
      </div>`;
    });
    prodHtml+=`</div></section>`;
  }
  const body=`<section class="hero"><div class="hero-content"><h1>流量卡 · 宽带的干货指南</h1><p>不忽悠、不套路。运营商内部逻辑、避坑技巧、省钱方案，带你少花冤枉钱。</p></div></section>
  <main class="container">${hero}${list}${prodHtml}</main>
  <div class="modal-bg" id="pm"><div class="modal-box">
    <div class="modal-top"><h3 id="mt"></h3><button class="modal-close" onclick="cm()">✕</button></div>
    <div class="modal-info" id="mb"></div>
    <div class="modal-btns"><a class="embed-btn" id="mbtn" target="_blank" rel="noopener" style="display:inline-block;">查看套餐</a></div>
  </div></div>`;
  return wrap(body,'海洋号卡 - 流量卡·宽带干货','流量卡干货、避坑指南、宽带省钱技巧','流量卡推荐,正规流量卡,宽带办理,电话卡套餐','','/');
}

function genArticle(a) {
  const t=a.title||a.productName||'文章',b=md(a.article||''),d=a.date||'',s=a.slug||d;
  const cd=(a.article||'').replace(/[#*\[\]]/g,'').slice(0,150).replace(/\n/g,' ');
  const cp=`/articles/article-${s}.html`,url=SITE+cp;
  const isB=a.type==='blog'||a.category,cl=a.category||'文章';
  const kw=isB?(a.seoKeyword||'')+',流量卡,宽带':'流量卡评测';

  let recHtml='';
  if(isB&&a.relatedProducts&&a.relatedProducts.length){
    recHtml=`<div class="section-title" style="margin-top:36px;"><span>推荐套餐</span></div><div class="product-grid" style="margin-bottom:24px;">`;
    a.relatedProducts.forEach(p=>{
      recHtml+=`<div class="product-card" onclick="om(${aj(p)})">
        <div class="product-card-img"><img src="${p.mainPic||''}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;>📱</div>'"></div>
        <div class="product-card-body"><div class="product-card-name">${es(p.productName)}</div><div class="product-card-meta">${es(p.operator)} · ${es(p.area||'全国')}</div></div>
      </div>`;
    });
    recHtml+=`</div>`;
  }
  const oldCta=!isB?`<div class="embed" style="margin-top:28px;"><div class="embed-body"><div class="embed-name">${es(a.productName||'套餐')}</div><div class="embed-meta">查看详情</div></div><a href="${a.netAddr||STORE}" target="_blank" class="embed-btn">查看套餐</a></div>`:'';

  const html=`<main class="article-detail">
    <a href="/archive.html" class="back">← 返回文章</a>
    <h1>${es(t)}</h1>
    <div class="meta">${d}<span class="tag">${cl}</span></div>
    <div class="body">${b}</div>
    ${recHtml}
    ${oldCta}
  </main>
  <div class="modal-bg" id="pm"><div class="modal-box">
    <div class="modal-top"><h3 id="mt"></h3><button class="modal-close" onclick="cm()">✕</button></div>
    <div class="modal-info" id="mb"></div>
    <div class="modal-btns"><a class="embed-btn" id="mbtn" target="_blank" rel="noopener" style="display:inline-block;">查看套餐</a></div>
  </div></div>`;
  return wrap(html,t+' - 海洋号卡',cd,kw,'',cp);
}

function genArchive(arts) {
  const cats={};arts.forEach(a=>{const c=a.category||'其他';cats[c]=(cats[c]||0)+1;});
  const cbs=Object.keys(cats).map(c=>`<button class="filter-btn" data-c="${c}">${c}</button>`).join('');
  let list='';
  arts.forEach(a=>{
    list+=`<li class="archive-item"><a href="/articles/article-${a.slug||a.date}.html"><span class="archive-date">${a.date}</span>${es(a.title||'')}</a><span class="archive-cat">${a.category||'其他'}</span></li>`;
  });
  const body=`<main class="archive-wrap"><h1>文章归档</h1><p class="sub">共 ${arts.length} 篇 · 每日更新</p>
    <div class="filter-bar" id="af"><button class="filter-btn active" data-c="all">全部</button>${cbs}</div>
    <ul class="archive-list" id="al">${list}</ul></main>`;
  return wrap(body,'文章归档 - 海洋号卡','所有文章汇总','流量卡评测汇总,号卡文章','','/archive.html');
}

function genProducts(prods) {
  const cards=prods.filter(p=>p.flag&&!p.productName.includes('宽带')&&!p.productName.includes('单宽'));
  const bbs=prods.filter(p=>p.flag&&(p.productName.includes('宽带')||p.productName.includes('单宽')));
  const ops={};prods.forEach(p=>{if(p.flag)ops[p.operator]=(ops[p.operator]||0)+1;});
  const pl=(list)=>list.map(p=>`<div class="product-card" onclick="om(${aj(p)})">
    <div class="product-card-img"><img src="${p.mainPic||''}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;>📱</div>'"></div>
    <div class="product-card-body"><div class="product-card-name">${es(p.productName)}</div><div class="product-card-meta">${es(p.operator)} · ${es(p.area||'全国')}</div></div>
  </div>`).join('');
  const body=`<main class="shop-wrap"><h1>套餐一览</h1><p class="sub">${cards.length} 款流量卡 · ${bbs.length} 款宽带</p>
    <div style="display:flex;gap:6px;margin-bottom:16px;"><input type="text" id="ps" placeholder="搜索名称或地区" style="flex:1;padding:8px 12px;border:1px solid var(--border);font-size:14px;outline:none;"><button onclick="fp()" style="padding:8px 16px;background:var(--red);color:#fff;border:none;font-size:13px;cursor:pointer;">搜索</button></div>
    <div class="shop-filter"><button class="filter-btn active" data-o="all">全部</button>${Object.keys(ops).map(o=>`<button class="filter-btn" data-o="${o}">${o}</button>`).join('')}<button class="filter-btn" data-o="__bb__">宽带</button></div>
    <div class="shop-grid" id="pgl">${pl([...cards,...bbs.map(p=>({...p,productName:'🌐 '+p.productName}))])}</div></main>
  <div class="modal-bg" id="pm"><div class="modal-box">
    <div class="modal-top"><h3 id="mt"></h3><button class="modal-close" onclick="cm()">✕</button></div>
    <div class="modal-info" id="mb"></div>
    <div class="modal-btns"><a class="embed-btn" id="mbtn" target="_blank" rel="noopener" style="display:inline-block;">查看套餐</a></div>
  </div></div>`;
  return wrap(body,'套餐一览 - 海洋号卡','正规运营商流量卡、电话卡、宽带套餐列表','流量卡,号卡,手机卡套餐','','/products.html');
}

function genSitemap(arts) {
  let x=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><priority>1.0</priority></url><url><loc>${SITE}/products.html</loc><priority>0.8</priority></url><url><loc>${SITE}/archive.html</loc><priority>0.7</priority></url>`;
  arts.forEach(a=>{x+=`\n  <url><loc>${SITE}/articles/article-${a.slug||a.date}.html</loc><priority>0.9</priority><lastmod>${a.date}</lastmod></url>`;});
  return x+'\n</urlset>';
}

async function build(forceRefresh=false) {
  console.log('='.repeat(50));
  console.log('  海洋号卡 - 杂志风站点生成');
  console.log('  ',new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));
  try {
    const bid=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const prods=await getProducts(forceRefresh);
    console.log(`📦 商品: ${prods.length} 个`);
    const op=path.join(DIST,'data.json');
    let arts=[],sids=new Set();
    if(fs.existsSync(op)){try{
      const old=JSON.parse(fs.readFileSync(op,'utf8'));arts=old.articles||[];
      const sc={};arts.forEach(a=>{if(a.buildId)sids.add(a.buildId);if(!a.slug){const b=a.date||'u';sc[b]=(sc[b]||0)+1;a.slug=sc[b]>1?b+'-'+sc[b]:b;}});
    }catch(e){}}
    console.log('✍️ 生成内容...');
    const content=await generateAll(prods,ai,bid);
    if(content.blogArticle&&!sids.has(bid)){
      const base=content.date,cnt=arts.filter(a=>a.date===content.date).length;
      const slug=cnt>0?base+'-'+(cnt+1):base;
      arts.unshift({...content.blogArticle,date:content.date,buildId:bid,slug,type:'blog'});
    }
    const stats=analyzeProducts(prods);
    const output={buildTime:content.generatedAt,date:content.date,storeUrl:STORE,stats,
      products:prods.map(p=>({productID:p.productID,productName:p.productName,mainPic:p.mainPic,area:p.area,disableArea:p.disableArea,operator:p.operator,price:p.price,backMoneyType:p.backMoneyType,flag:p.flag,age1:p.age1,age2:p.age2,taocan:p.taocan||p.productName,netAddr:p.netAddr})),
      blogArticle:content.blogArticle?{...content.blogArticle,date:content.date}:null,recommendations:content.recommendations,hotRanking:content.hotRanking,
      byOperator:content.byOperator,broadband:content.broadband,seoKeywords:content.seoKeywords,articles:arts};
    ed(DIST);fs.writeFileSync(op,JSON.stringify(output,null,2),'utf8');
    console.log('📄 生成页面...');
    fs.writeFileSync(path.join(DIST,'index.html'),genIndex(prods,content,arts),'utf8');
    ed(ADIR);let ac=0;
    for(const a of arts){if(!a.date)continue;fs.writeFileSync(path.join(ADIR,`article-${a.slug||a.date}.html`),genArticle(a),'utf8');ac++;}
    fs.writeFileSync(path.join(DIST,'products.html'),genProducts(output.products),'utf8');
    fs.writeFileSync(path.join(DIST,'archive.html'),genArchive(arts),'utf8');
    fs.writeFileSync(path.join(DIST,'sitemap.xml'),genSitemap(arts),'utf8');
    fs.writeFileSync(path.join(DIST,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`,'utf8');
    const bd=path.join(__dirname,'..','baidu_verify_codeva-oGFISGSCpA.html');
    if(fs.existsSync(bd))fs.copyFileSync(bd,path.join(DIST,'baidu_verify_codeva-oGFISGSCpA.html'));
    console.log(`✅ 完成: ${ac} 篇文章`);
    return true;
  }catch(e){console.error('❌ 失败:',e.message);return false;}
}
if(require.main===module)build(process.argv.includes('-f')).then(s=>process.exit(s?0:1));
module.exports={build};
