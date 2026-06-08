/**
 * 推广内容自动生成器
 * 每次构建生成不同商品的内容（基于构建时间戳种子）
 * AI 增强：DeepSeek 写文章，gpt-image-2 配图
 */
const crypto = require('crypto');
const path = require('path');

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
  for (const p of shuffled) { if (picks.length >= 6) break; if (!seenOps.has(p.operator)) { picks.push(p); seenOps.add(p.operator); } }
  for (const p of shuffled) { if (picks.length >= 6) break; if (!picks.find(x => x.productID === p.productID)) picks.push(p); }
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
 * 生成所有推广内容（每次构建选不同商品）
 * @param {Array} products - 商品列表
 * @param {Object} [aiModule] - AI 模块
 * @param {string} [buildId] - 构建唯一标识（用于种子），保证每次构建选不同商品
 */
async function generateAll(products, aiModule, buildId) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const seed = buildId || Date.now().toString();
  ai = aiModule || null;

  console.log(`\n[Generator] 开始生成 (seed: ${seed.slice(0, 12)}...)`);

  // 每次构建选不同的商品（seed 不同）
  const recommendations = generateDailyRecommendations(products, seed);
  const operatorRecs = generateOperatorRecommendations(products, seed);
  const seoKeywords = generateSEOKeywords(products, seed);

  // 热销榜 - AI 或模板
  let hotRanking = generateHotRanking(products, seed);
  if (ai && ai.generateHotDescs) {
    const aiDescs = await ai.generateHotDescs(hotRanking, seed);
    if (aiDescs) hotRanking = hotRanking.map((item, i) => ({ ...item, desc: aiDescs[i] || item.desc }));
  }

  // 评测文章 - AI 或模板
  const baseProduct = (() => {
    const onSale = products.filter(p => p.flag);
    return onSale[parseInt(seededRandom('article-index-' + seed)().toString().slice(2, 5)) % onSale.length];
  })();
  let dailyArticle;
  if (ai && ai.generateDailyArticle) {
    dailyArticle = await ai.generateDailyArticle(baseProduct, seed);
  }
  if (!dailyArticle) dailyArticle = generateDailyArticle(products, seed);

  // 宽带
  const broadband = generateBroadbandRecommendations(products, seed);

  // 配图（每日推荐第一张）
  if (ai && ai.generateImage && recommendations.length > 0) {
    const first = recommendations[0];
    const imgPath = await ai.generateImage(`中国${first.operator}流量卡产品展示图，${first.productName}，简约风格，蓝白配色，干净清爽，无文字`, `promo-${seed}`);
    if (imgPath) recommendations[0].promoImage = imgPath;
  }

  return {
    generatedAt: new Date().toISOString(),
    date: dateStr,
    buildId: seed,
    dailyArticle,
    recommendations,
    hotRanking,
    byOperator: operatorRecs,
    broadband,
    seoKeywords,
  };
}

module.exports = { generateAll };
