/**
 * 推广内容自动生成器
 * 基于商品数据，生成真实评测风格的推广文章
 * 每天内容不同（基于日期种子随机）
 * 支持 AI 增强：DeepSeek 写文章，gpt-image-2 配图
 * API 不可用时自动回退到模板
 */
const crypto = require('crypto');
const path = require('path');

let ai = null;

/**
 * 基于日期的确定性随机（确保同一天生成相同内容）
 */
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

// ===== 写作素材 =====

const REVIEW_OPENINGS = [
  `最近好多朋友问我用什么流量卡划算，今天我特意实测了一款，给大家分享一下真实体验。`,
  `作为一个流量大户，每个月话费都要上百，终于被我找到了一张宝藏神卡！`,
  `用了几天来交作业了，这张卡的网速和稳定性都超乎我的预期，一起来看看吧。`,
  `之前一直在用某宝的流量包，贵得要死，换了这张卡之后每个月省了大几十。`,
  `宿舍的WiFi一到晚上就卡，没办法只能入手一张流量卡，结果真香了！`,
  `被坑过太多次了，这次拿到卡先测了一周，确定没问题才来给大家推荐的。`,
];

const FEELINGS = [
  `激活流程非常简单，按照说明书一步步操作，5分钟就搞定了，不用去营业厅排队。`,
  `收到卡后第一时间激活，插上就能用，信号满格，刷视频完全不卡。`,
  `用了几天测试了一下，在电梯里、地下车库这些信号死角，居然也能正常刷网页。`,
  `网速我专门测了几次，下载能跑到300Mbps+，打王者荣耀延迟稳定在30ms左右。`,
  `最惊喜的是没有隐形消费，月租就是标注的价格，不会乱扣费，这点很良心。`,
  `之前担心流量虚标，实测下来流量是实打实的，用多少扣多少，没有水分。`,
];

const DETAILS = [
  `套餐内容清晰透明，没有那些乱七八糟的绑定和合约，想用就用，不想用随时可以注销。`,
  `归属地随机发货，但是号码可以自己选，还是比较人性化的。`,
  `快递是顺丰包邮的，下单后第二天就到了，速度很快。`,
  `禁发区域需要注意一下，下单前可以先咨询客服确认收货地址能不能发。`,
];

const RECOMMEND_TITLES = [
  `🔥 %s 真实评测：月省XX元，信号居然这么稳？`,
  `实测报告 | %s 到底值不值得办？看完你就懂了`,
  `用了7天%s，说说我的真实感受（无广）`,
  `别再交智商税了！%s 才是真正的性价比之王`,
  `租房党必看！%s 帮你每个月省下一杯奶茶钱`,
  `亲测有效！%s 网速快到飞起，后悔没早点办`,
];

const HOT_PRODUCT_DESCS = [
  `这款卡在当月销量中表现非常抢眼，凭借超高的性价比收获了一致好评。`,
  `从数据上看，这款产品的用户留存率很高，说明套餐确实符合大家的需求。`,
  `综合佣金和用户反馈来看，这款产品是目前最值得推广的爆款之一。`,
  `不仅套餐给力，佣金也是诚意满满，推广转化率一直位居前列。`,
];

// ===== 生成器函数 =====

/**
 * 生成每日推荐商品列表
 */
function generateDailyRecommendations(products, dateStr) {
  const rand = seededRandom('daily-recs-' + dateStr);
  const onSale = products.filter(p => p.flag);
  const shuffled = shuffle(onSale, rand);

  // 精选推荐：取前6个不同运营商的
  const picks = [];
  const seenOps = new Set();
  for (const p of shuffled) {
    if (picks.length >= 6) break;
    if (!seenOps.has(p.operator)) {
      picks.push(p);
      seenOps.add(p.operator);
    }
  }
  // 如果不够，再补
  for (const p of shuffled) {
    if (picks.length >= 6) break;
    if (!picks.find(x => x.productID === p.productID)) {
      picks.push(p);
    }
  }

  return picks.map((p, i) => {
    const template = RECOMMEND_TITLES[i % RECOMMEND_TITLES.length];
    const title = template.replace('%s', p.productName);
    const opening = pickFrom(REVIEW_OPENINGS, rand);
    const feeling = pickFrom(FEELINGS, rand);
    const detail = pickFrom(DETAILS, rand);

    return {
      productID: p.productID,
      productName: p.productName,
      title,
      price: p.price,
      operator: p.operator,
      area: p.area,
      mainPic: p.mainPic,
      netAddr: p.netAddr,
      storeUrl: p.netAddr,
      taocan: p.taocan || p.productName,
      backMoneyType: p.backMoneyType,
      age1: p.age1,
      age2: p.age2,
      content: `${opening}\n\n${feeling}\n\n${detail}`,
    };
  });
}

/**
 * 生成今日热销榜单
 */
function generateHotRanking(products, dateStr) {
  const rand = seededRandom('hot-ranking-' + dateStr);
  const onSale = products.filter(p => p.flag);
  const shuffled = shuffle(onSale, rand);

  return shuffled.slice(0, 10).map((p, i) => ({
    rank: i + 1,
    productID: p.productID,
    productName: p.productName,
    operator: p.operator,
    price: p.price,
    area: p.area,
    backMoneyType: p.backMoneyType,
    desc: pickFrom(HOT_PRODUCT_DESCS, seededRandom('hot-desc-' + dateStr + '-' + i)),
  }));
}

/**
 * 生成按运营商分类的推荐
 */
function generateOperatorRecommendations(products, dateStr) {
  const rand = seededRandom('op-recs-' + dateStr);
  const operators = ['移动', '联通', '电信', '广电'];
  const result = {};

  for (const op of operators) {
    const opProducts = products.filter(p => p.operator === op && p.flag);
    if (opProducts.length === 0) continue;

    const shuffled = shuffle(opProducts, seededRandom('op-' + op + '-' + dateStr));
    const picks = shuffled.slice(0, 4);

    result[op] = picks.map(p => ({
      productID: p.productID,
      productName: p.productName,
      price: p.price,
      area: p.area,
      mainPic: p.mainPic,
      netAddr: p.netAddr,
      backMoneyType: p.backMoneyType,
      taocan: p.taocan || p.productName,
    }));
  }

  return result;
}

/**
 * 生成宽带推荐（单独分类）
 */
function generateBroadbandRecommendations(products, dateStr) {
  const broadband = products.filter(p =>
    p.flag && (p.productName.includes('宽带') || p.productName.includes('单宽'))
  );
  const rand = seededRandom('broadband-' + dateStr);
  const shuffled = shuffle(broadband, rand);

  return shuffled.slice(0, 8).map(p => ({
    productID: p.productID,
    productName: p.productName,
    price: p.price,
    area: p.area,
    operator: p.operator,
    mainPic: p.mainPic,
    netAddr: p.netAddr,
    backMoneyType: p.backMoneyType,
  }));
}

/**
 * 生成每日推广文章（完整评测文章）
 * 基于当天日期 + 产品ID确定主题
 */
function generateDailyArticle(products, dateStr) {
  const onSale = products.filter(p => p.flag);
  const rand = seededRandom('article-' + dateStr);

  // 每天选一个不同的商品作为主角
  const index = parseInt(seededRandom('article-index-' + dateStr)().toString().slice(2, 5)) % onSale.length;
  const product = onSale[index];

  if (!product) return null;

  const templateIdx = parseInt(dateStr.replace(/-/g, '')) % RECOMMEND_TITLES.length;
  const titleTemplate = RECOMMEND_TITLES[templateIdx];

  const title = titleTemplate.replace('%s', product.productName);

  const article = [
    `## 📱 前言`,
    ``,
    `今天要给大家评测的是 **${product.productName}**，运营商为${product.operator}，归属地${product.area}。`,
    ``,
    pickFrom(REVIEW_OPENINGS, seededRandom('art-o1-' + dateStr)),
    ``,
    `## 📋 套餐详情`,
    ``,
    `这款套餐的资费非常透明：${product.taocan || product.productName}`,
    ``,
    `${pickFrom(FEELINGS, seededRandom('art-f1-' + dateStr))}`,
    ``,
    `适用年龄范围：${product.age1 || 18}岁 - ${product.age2 || 60}岁`,
    ``,
    `## 📶 网速实测`,
    ``,
    `我分别在不同场景下进行了测速：`,
    ``,
    `- **室内**：下载速度 ${(200 + Math.floor(seededRandom('speed1-' + dateStr)() * 200))}Mbps，上传 ${(30 + Math.floor(seededRandom('speed2-' + dateStr)() * 40))}Mbps`,
    `- **室外**：下载速度 ${(250 + Math.floor(seededRandom('speed3-' + dateStr)() * 200))}Mbps，上传 ${(40 + Math.floor(seededRandom('speed4-' + dateStr)() * 50))}Mbps`,
    `- **地铁/电梯**：信号表现良好，刷短视频无压力`,
    ``,
    `## ✅ 总结`,
    ``,
    `${product.productName} 整体表现优秀，适合${product.area === '随机' ? '全国大部分地区' : product.area + '地区'}的用户。如果你正在找${product.operator}的高性价比套餐，这款值得考虑。`,
    ``,
    `> 👉 [点击前往下单](${product.netAddr})`,
  ].join('\n');

  return {
    title,
    productID: product.productID,
    productName: product.productName,
    article,
    price: product.price,
    operator: product.operator,
  };
}

/**
 * 生成SEO关键词
 */
function generateSEOKeywords(products, dateStr) {
  const rand = seededRandom('seo-' + dateStr);
  const onSale = products.filter(p => p.flag);
  const shuffled = shuffle(onSale, rand);

  const names = shuffled.slice(0, 5).map(p => p.productName);
  const operators = [...new Set(shuffled.slice(0, 3).map(p => p.operator))];

  return [
    '流量卡推荐',
    '正规流量卡免费办理',
    `2025流量卡`,
    `性价比流量卡`,
    ...operators.map(o => `${o}流量卡`),
    ...names.slice(0, 3),
    '大流量卡套餐',
    '宽带办理',
    '手机卡套餐',
  ];
}

/**
 * 生成所有推广内容（支持 AI 增强）
 * @param {Array} products - 商品列表
 * @param {Object} [aiModule] - AI 模块（可选），需有 generateDailyArticle, generateHotDescs, generateImage
 * @returns {Promise<Object>}
 */
async function generateAll(products, aiModule) {
  const dateStr = new Date().toISOString().slice(0, 10);
  ai = aiModule || null;

  console.log(`\n[Generator] 开始生成推广内容...`);

  // 先跑确定性随机的内容（不依赖 AI）
  const recommendations = generateDailyRecommendations(products, dateStr);
  const operatorRecs = generateOperatorRecommendations(products, dateStr);
  const seoKeywords = generateSEOKeywords(products, dateStr);

  // 热销榜 - 尝试 AI 生成推荐语，失败回退模板
  let hotRanking = generateHotRanking(products, dateStr);
  if (ai && ai.generateHotDescs) {
    console.log('[Generator] AI 生成热销榜推荐语...');
    const aiDescs = await ai.generateHotDescs(hotRanking, dateStr);
    if (aiDescs) {
      hotRanking = hotRanking.map((item, i) => ({
        ...item,
        desc: aiDescs[i] || item.desc,
      }));
      console.log('[Generator] AI 热销榜推荐语 ✅');
    } else {
      console.log('[Generator] AI 热销榜不可用，使用模板');
    }
  }

  // 每日评测文章 - 尝试 AI，失败回退模板
  const baseProduct = (() => {
    const onSale = products.filter(p => p.flag);
    const rand = seededRandom('article-' + dateStr);
    const index = parseInt(seededRandom('article-index-' + dateStr)().toString().slice(2, 5)) % onSale.length;
    return onSale[index];
  })();

  let dailyArticle;
  if (ai && ai.generateDailyArticle) {
    console.log(`[Generator] AI 生成今日评测文章 ${baseProduct.productName}...`);
    dailyArticle = await ai.generateDailyArticle(baseProduct, dateStr);
    if (dailyArticle) {
      console.log('[Generator] AI 文章 ✅');
    } else {
      console.log('[Generator] AI 文章不可用，使用模板');
    }
  }
  if (!dailyArticle) {
    dailyArticle = generateDailyArticle(products, dateStr);
  }

  // 宽带推荐
  const broadband = generateBroadbandRecommendations(products, dateStr);

  // 尝试为每日推荐配图（第一张）
  if (ai && ai.generateImage && recommendations.length > 0) {
    const first = recommendations[0];
    console.log(`[Generator] AI 生成推广配图 ${first.productName}...`);
    const imgPath = await ai.generateImage(
      `中国${first.operator}流量卡产品展示图，${first.productName}，简约风格，商务蓝白配色，干净清爽，无文字`,
      `promo-${dateStr}`
    );
    if (imgPath) {
      recommendations[0].promoImage = imgPath;
      console.log('[Generator] 推广配图 ✅');
    }
  }

  const content = {
    generatedAt: new Date().toISOString(),
    date: dateStr,
    dailyArticle,
    recommendations,
    hotRanking,
    byOperator: operatorRecs,
    broadband,
    seoKeywords,
  };

  console.log('[Generator] 生成完成\n');
  return content;
}

module.exports = { generateAll };
