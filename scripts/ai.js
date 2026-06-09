/**
 * AI 集成模块
 * - DeepSeek API：生成评测文章、推广文案
 * - gpt-image-2 API：生成推广配图
 * 所有函数都有容错，失败了返回 null，由调用方回退到模板
 */
const fs = require('fs');
const path = require('path');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

const IMAGE_KEY = process.env.IMAGE_API_KEY || '';
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-2';

const IMG_DIR = path.join(__dirname, '..', 'dist', 'assets', 'img');

const fetch_ = globalThis.fetch;

/** 调用 DeepSeek Chat API */
async function callDeepSeek(systemPrompt, userPrompt, opts = {}) {
  if (!DEEPSEEK_KEY) return null;
  try {
    const res = await fetch_('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: opts.temperature ?? 0.8,
        max_tokens: opts.maxTokens ?? 2048,
      }),
    });
    if (!res.ok) { console.warn(`[AI] DeepSeek HTTP ${res.status}`); return null; }
    const data = await res.json();
    const c = data?.choices?.[0]?.message?.content;
    if (!c) return null;
    console.log(`[AI] DeepSeek OK (${c.slice(0, 50).replace(/\n/g, '')}…)`);
    return c;
  } catch (e) {
    console.warn(`[AI] DeepSeek error: ${e.message}`);
    return null;
  }
}

/** 用 DeepSeek 写每日评测文章（SEO 关键词优化） */
async function generateDailyArticle(product, dateStr, keyword) {
  const kw = keyword || `${product.area || ''}${product.operator || ''}流量卡`;
  const sys = `你是一个通信产品评测博主，擅长写搜索引擎友好的真实体验文章。`;
  const usr = `写一篇评测文章，500-800字。目标是让搜索"${kw}"的用户能看到这篇文章。

商品：${product.productName}
运营商：${product.operator}
归属地：${product.area || '随机'}
套餐：${product.taocan || product.productName}
年龄：${product.age1 || 18}-${product.age2 || 60}岁

要求：
1. 标题必须包含搜索词"${kw}"，带emoji，自然不刻意
2. 文章开头60字内自然出现一次搜索词
3. 口吻像真实用户评测，不要像广告
4. 包含：收到卡→激活→测速→算账→推荐
5. 结尾引导去店铺下单
6. 不要提及佣金或价格数字`;

  const raw = await callDeepSeek(sys, usr);
  if (!raw) return null;

  const lines = raw.trim().split('\n');
  let title = lines[0].replace(/^#+\s*/, '').trim();
  if (title.length < 4 || title.length > 80) title = `${kw} 真实评测`;

  return {
    title,
    productID: product.productID,
    productName: product.productName,
    article: raw,
    price: product.price,
    operator: product.operator,
    netAddr: product.netAddr,
    mainPic: product.mainPic,
    area: product.area,
  };
}

/** 用 DeepSeek 生成热销榜推荐语 */
async function generateHotDescs(products, dateStr) {
  const list = products.slice(0, 10).map((p, i) =>
    `${i + 1}. ${p.productName}（${p.operator}）`
  ).join('\n');
  const sys = `你是一个电商文案，为每个商品写一句推荐语（10-25字），突出卖点，带适量emoji。输出格式：序号. 推荐语`;
  const usr = `以下为今日热销商品TOP10：\n${list}`;
  const raw = await callDeepSeek(sys, usr, { maxTokens: 1024 });
  if (!raw) return null;

  const result = {};
  raw.trim().split('\n').forEach(line => {
    const m = line.match(/^(\d+)\.\s*(.+)/);
    if (m) result[parseInt(m[1]) - 1] = m[2].trim();
  });
  return Object.keys(result).length > 0 ? result : null;
}

/** 生成推广图片（gpt-image-2），返回相对路径 */
async function generateImage(prompt, filename) {
  if (!IMAGE_KEY) return null;
  try {
    const res = await fetch_(`https://ai.t8star.org/v1/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${IMAGE_KEY}` },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        size: '1024x1024',
        n: 1,
        response_format: 'url',
      }),
    });
    if (!res.ok) { console.warn(`[AI] Image API HTTP ${res.status}`); return null; }
    const data = await res.json();
    const url = data?.data?.[0]?.url;
    if (!url) return null;

    // 下载并保存
    if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
    const filePath = path.join(IMG_DIR, filename + '.png');
    const imgRes = await fetch_(url);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(filePath, buf);
    console.log(`[AI] 图片已保存: ${filePath} (${(buf.length / 1024).toFixed(1)}KB)`);
    return `./assets/img/${filename}.png`;
  } catch (e) {
    console.warn(`[AI] Image error: ${e.message}`);
    return null;
  }
}

module.exports = { callDeepSeek, generateDailyArticle, generateHotDescs, generateImage };
