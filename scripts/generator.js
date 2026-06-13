/**
 * 推广内容自动生成器
 * 每次构建生成不同商品的内容（基于构建时间戳种子）
 * AI 增强：DeepSeek 写文章，gpt-image-2 配图
 */
const crypto = require('crypto');
const path = require('path');
const { pickTopic, pickRelatedProducts } = require('./content-planner');

let ai = null;

function seededRandom(seed) {
  const hash = crypto.createHash('md5').update(String(seed)).digest('hex');
  let n = parseInt(hash.substring(0, 8), 16);
  return () => {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    return n / 0x7fffffff;
  };
}

function pickFrom(arr, randomFn) {
  return arr[Math.floor(randomFn() * arr.length)];
}

function shuffle(arr, randomFn) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== SEO 关键词池（按搜索热度排序） =====
const SEO_KEYWORDS = [
  // 省份+流量卡 核心搜索词
  { kw: '广东流量卡推荐', area: '广东' },
  { kw: '浙江流量卡哪个划算', area: '浙江' },
  { kw: '山东流量卡套餐', area: '山东' },
  { kw: '四川流量卡', area: '四川' },
  { kw: '湖南流量卡推荐', area: '湖南' },
  { kw: '湖北流量卡', area: '湖北' },
  { kw: '广西流量卡', area: '广西' },
  { kw: '上海流量卡', area: '上海' },
  { kw: '重庆流量卡', area: '重庆' },
  { kw: '江苏流量卡', area: '江苏' },
  { kw: '北京流量卡', area: '北京' },
  { kw: '河南流量卡', area: '河南' },
  { kw: '河北流量卡', area: '河北' },
  { kw: '安徽流量卡', area: '安徽' },
  { kw: '福建流量卡', area: '福建' },
  { kw: '江西流量卡', area: '江西' },
  { kw: '陕西流量卡', area: '陕西' },
  { kw: '云南流量卡', area: '云南' },
  { kw: '贵州流量卡', area: '贵州' },
  { kw: '吉林流量卡', area: '吉林' },
  { kw: '海南流量卡', area: '海南' },
  { kw: '天津流量卡', area: '天津' },
  // 通用搜索词（高流量）
  { kw: '学生党流量卡推荐', op: null },
  { kw: '29元大流量卡', op: null },
  { kw: '19元流量卡', op: null },
  { kw: '流量卡免费办理', op: null },
  { kw: '宽带套餐哪个划算', area: null, isBB: true },
  { kw: '联通流量卡推荐', op: '联通' },
  { kw: '移动流量卡套餐', op: '移动' },
  { kw: '电信流量卡哪个好', op: '电信' },
  { kw: '广电流量卡', op: '广电' },
  { kw: '大流量卡不限速', op: null },
  { kw: '正规流量卡', op: null },
  { kw: '流量卡月租低', op: null },
  { kw: '宽带办理多少钱一年', isBB: true },
  { kw: '联通宽带套餐', op: '联通', isBB: true },
  { kw: '电信宽带包年', op: '电信', isBB: true },
];

/**
 * 根据 SEO 关键词选商品
 */
function pickProductByKeyword(products, seed) {
  const rand = seededRandom('seo-pick-' + seed);
  // 按日期轮换关键词
  const kwIndex = parseInt(seededRandom('kw-index-' + seed)().toString().slice(2, 5)) % SEO_KEYWORDS.length;
  const target = SEO_KEYWORDS[kwIndex];

  let candidates = products.filter(p => p.flag);

  // 按关键词筛选
  if (target.isBB) {
    candidates = candidates.filter(p => p.productName.includes('宽带') || p.productName.includes('单宽'));
  } else {
    candidates = candidates.filter(p => !p.productName.includes('宽带') && !p.productName.includes('单宽'));
  }
  if (target.area && target.area !== '随机') {
    // 先精确匹配
    let matched = candidates.filter(p => p.area === target.area);
    if (matched.length === 0) {
      // 模糊匹配
      matched = candidates.filter(p => p.area && p.area.includes(target.area));
    }
    if (matched.length > 0) candidates = matched;
  }
  if (target.op) {
    let matched = candidates.filter(p => p.operator === target.op);
    if (matched.length > 0) candidates = matched;
  }

  // 从候选中随机选一个
  const shuffled = shuffle(candidates, rand);
  const product = shuffled[0] || products.filter(p => p.flag)[0];

  return { product, keyword: target.kw };
}

// ===== 写作素材（只做兜底） =====
const REVIEW_OPENINGS = [
  `最近好多朋友问我用什么流量卡划算，今天我特意实测了一款，给大家分享一下真实体验。`,
  `作为一个流量大户，每个月话费都要上百，终于被我找到了一张宝藏神卡！`,
  `用了几天来交作业了，这张卡的网速和稳定性都超乎我的预期，一起来看看吧。`,
  `之前一直在用某宝的流量包，贵得要死，换了这张卡之后每个月省了大几十。`,
];
const FEELINGS = [
  `激活流程非常简单，按照说明书一步步操作，5分钟就搞定了，不用去营业厅排队。`,
  `收到卡后第一时间激活，插上就能用，信号满格，刷视频完全不卡。`,
  `网速我专门测了几次，下载能跑到300Mbps+，打王者荣耀延迟稳定在30ms左右。`,
  `最惊喜的是没有隐形消费，月租就是标注的价格，不会乱扣费，这点很良心。`,
];
const DETAILS = [
  `套餐内容清晰透明，没有那些乱七八糟的绑定和合约。`,
  `归属地随机发货，但是号码可以自己选。`,
  `快递是顺丰包邮的，下单后第二天就到了。`,
];
const RECOMMEND_TITLES = [
  `🔥 %s 真实评测：月省XX元，信号居然这么稳？`,
  `实测报告 | %s 到底值不值得办？看完你就懂了`,
  `用了7天%s，说说我的真实感受（无广）`,
  `租房党必看！%s 帮你每个月省下一杯奶茶钱`,
  `亲测有效！%s 网速快到飞起，后悔没早点办`,
];
const HOT_PRODUCT_DESCS = [
  `综合用户反馈来看，这款产品是目前最值得推广的爆款之一。`,
  `不仅套餐给力，性价比也是诚意满满。`,
];

// ===== 所有函数都使用 seedBase 而非 dateStr，确保每次构建内容不同 =====

function generateDailyRecommendations(products, seed) {
  const rand = seededRandom('daily-recs-' + seed);
  const onSale = products.filter(p => p.flag);
  const shuffled = shuffle(onSale, rand);
  const picks = [];
  const seenOps = new Set();
  for (const p of shuffled) { if (picks.length >= 8) break; if (!seenOps.has(p.operator)) { picks.push(p); seenOps.add(p.operator); } }
  for (const p of shuffled) { if (picks.length >= 8) break; if (!picks.find(x => x.productID === p.productID)) picks.push(p); }
  return picks.map((p, i) => {
    const template = RECOMMEND_TITLES[i % RECOMMEND_TITLES.length];
    const title = template.replace('%s', p.productName);
    return { productID: p.productID, productName: p.productName, title, price: p.price, operator: p.operator, area: p.area, mainPic: p.mainPic, netAddr: p.netAddr, storeUrl: p.netAddr, taocan: p.taocan || p.productName, backMoneyType: p.backMoneyType, age1: p.age1, age2: p.age2, content: `${pickFrom(REVIEW_OPENINGS, rand)}\n\n${pickFrom(FEELINGS, rand)}\n\n${pickFrom(DETAILS, rand)}` };
  });
}

function generateHotRanking(products, seed) {
  const rand = seededRandom('hot-ranking-' + seed);
  const onSale = products.filter(p => p.flag);
  const shuffled = shuffle(onSale, rand);
  return shuffled.slice(0, 10).map((p, i) => ({
    rank: i + 1, productID: p.productID, productName: p.productName, operator: p.operator, price: p.price, area: p.area, backMoneyType: p.backMoneyType,
    desc: pickFrom(HOT_PRODUCT_DESCS, seededRandom('hot-desc-' + seed + '-' + i)),
  }));
}

function generateOperatorRecommendations(products, seed) {
  const operators = ['移动', '联通', '电信', '广电'];
  const result = {};
  for (const op of operators) {
    const opProducts = products.filter(p => p.operator === op && p.flag);
    if (opProducts.length === 0) continue;
    const shuffled = shuffle(opProducts, seededRandom('op-' + op + '-' + seed));
    result[op] = shuffled.slice(0, 4).map(p => ({ productID: p.productID, productName: p.productName, price: p.price, area: p.area, mainPic: p.mainPic, netAddr: p.netAddr, backMoneyType: p.backMoneyType, taocan: p.taocan || p.productName }));
  }
  return result;
}

function generateBroadbandRecommendations(products, seed) {
  const broadband = products.filter(p => p.flag && (p.productName.includes('宽带') || p.productName.includes('单宽')));
  const shuffled = shuffle(broadband, seededRandom('broadband-' + seed));
  return shuffled.slice(0, 8).map(p => ({ productID: p.productID, productName: p.productName, price: p.price, area: p.area, operator: p.operator, mainPic: p.mainPic, netAddr: p.netAddr, backMoneyType: p.backMoneyType }));
}

function generateDailyArticle(products, seed) {
  const onSale = products.filter(p => p.flag);
  const index = parseInt(seededRandom('article-index-' + seed)().toString().slice(2, 5)) % onSale.length;
  const product = onSale[index];
  if (!product) return null;

  const templateIdx = parseInt(seed.replace(/-/g, '').slice(0, 8), 36) % RECOMMEND_TITLES.length;
  const title = RECOMMEND_TITLES[templateIdx].replace('%s', product.productName);
  const article = [
    `## 前言`,
    ``,
    `今天要给大家评测的是 **${product.productName}**，运营商为${product.operator}，归属地${product.area}。`,
    ``,
    pickFrom(REVIEW_OPENINGS, seededRandom('art-o1-' + seed)),
    ``,
    `## 套餐详情`,
    ``,
    `这款套餐的资费非常透明：${product.taocan || product.productName}`,
    ``,
    `${pickFrom(FEELINGS, seededRandom('art-f1-' + seed))}`,
    ``,
    `适用年龄范围：${product.age1 || 18}岁 - ${product.age2 || 60}岁`,
    ``,
    `## 网速实测`,
    ``,
    `我分别在不同场景下进行了测速：`,
    `- **室内**：下载速度 ${(200 + Math.floor(seededRandom('speed1-' + seed)() * 200))}Mbps，上传 ${(30 + Math.floor(seededRandom('speed2-' + seed)() * 40))}Mbps`,
    `- **室外**：下载速度 ${(250 + Math.floor(seededRandom('speed3-' + seed)() * 200))}Mbps，上传 ${(40 + Math.floor(seededRandom('speed4-' + seed)() * 50))}Mbps`,
    `- **地铁/电梯**：信号表现良好，刷短视频无压力`,
    ``,
    `## 总结`,
    ``,
    `${product.productName} 整体表现优秀，适合${product.area === '随机' ? '全国大部分地区' : product.area + '地区'}的用户。如果你正在找${product.operator}的高性价比套餐，这款值得考虑。`,
    ``,
    `> 👉 [点击前往下单](${product.netAddr})`,
  ].join('\n');

  return { title, productID: product.productID, productName: product.productName, article, price: product.price, operator: product.operator, netAddr: product.netAddr, mainPic: product.mainPic, area: product.area };
}

function generateSEOKeywords(products, seed) {
  const rand = seededRandom('seo-' + seed);
  const onSale = products.filter(p => p.flag);
  const shuffled = shuffle(onSale, rand);
  const names = shuffled.slice(0, 5).map(p => p.productName);
  const operators = [...new Set(shuffled.slice(0, 3).map(p => p.operator))];
  return ['流量卡推荐', '正规流量卡免费办理', `性价比流量卡`, ...operators.map(o => `${o}流量卡`), ...names.slice(0, 3), '大流量卡套餐', '宽带办理', '手机卡套餐'];
}

/**
 * 生成博客文章（干货内容 + 自然植入推荐）
 */
async function generateBlog(products, seed) {
  const topic = pickTopic(seed);
  const relatedProducts = pickRelatedProducts(topic, products, seed);
  console.log(`[Generator] 博客选题: "${topic.keyword}" (${topic.category})`);

  let blogArticle = null;
  if (ai && ai.generateBlogArticle) {
    // 让 AI 模块能调用配图功能
    globalThis.generateImage = ai.generateImage;
    blogArticle = await ai.generateBlogArticle(topic, relatedProducts, seed);
  }

  // AI不可用时，生成简化版
  if (!blogArticle) {
    blogArticle = {
      title: topic.title,
      article: `${topic.desc}\n\n更多信息可以关注海洋号卡。`,
      category: topic.category,
      seoKeyword: topic.keyword,
      relatedProducts,
    };
  }

  return blogArticle;
}

/**
 * 生成所有内容（博客优先 + 商品数据补充）
 * @param {Array} products - 商品列表
 * @param {Object} [aiModule] - AI 模块
 * @param {string} [buildId] - 构建唯一标识
 */
async function generateAll(products, aiModule, buildId) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const seed = buildId || Date.now().toString();
  ai = aiModule || null;

  console.log(`\n[Generator] 开始生成 (seed: ${seed.slice(0, 12)}...)`);

  // 1. 博客文章（每天一篇干货，文中带商品推荐）
  const blogArticle = await generateBlog(products, seed);

  // 2. 商品推荐条（继续保留）
  const recommendations = generateDailyRecommendations(products, seed);
  const operatorRecs = generateOperatorRecommendations(products, seed);
  const seoKeywords = generateSEOKeywords(products, seed);

  // 3. 热销榜
  let hotRanking = generateHotRanking(products, seed);
  if (ai && ai.generateHotDescs) {
    const aiDescs = await ai.generateHotDescs(hotRanking, seed);
    if (aiDescs) hotRanking = hotRanking.map((item, i) => ({ ...item, desc: aiDescs[i] || item.desc }));
  }

  // 4. 宽带
  const broadband = generateBroadbandRecommendations(products, seed);

  return {
    generatedAt: new Date().toISOString(),
    date: dateStr,
    buildId: seed,
    blogArticle,          // 博客文章（主内容）
    recommendations,      // 推荐商品条
    hotRanking,           // 热销榜
    byOperator: operatorRecs,
    broadband,
    seoKeywords,
  };
}

module.exports = { generateAll };
