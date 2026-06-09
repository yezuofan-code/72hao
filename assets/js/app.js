/**
 * 海洋号卡 - 前端脚本
 * 弹窗、商品筛选、归档筛选、多平台分享
 */
const STORE_URL = 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';
const BRAND_NAME = '海洋号卡';

// ===== 各平台违规词替换表 =====
const PLATFORM_FILTERS = {
  zhihu: {
    // 知乎：不要直接导流、夸大词
    replace: [
      [/\b微信\b/g, '私信'],
      [/\bQQ\b/g, '私信'],
      [/最赚钱/g, '很划算'],
      [/绝对有效/g, '实测不错'],
      [/免费领取/g, '可以了解'],
      [/免费/g, '实惠'],
      [/\b链接\b/g, '地址'],
      [/加我/g, '私信我'],
    ],
    footer: `\n\n---\n我是在 ${BRAND_NAME} 看到的，有兴趣可以去了解。`,
  },
  xiaohongshu: {
    // 小红书：避免销售导向，用分享口吻
    replace: [
      [/\b微信\b/g, '私信'],
      [/\bQQ\b/g, '私信'],
      [/最便宜/g, '性价比高'],
      [/最划算/g, '很划算'],
      [/免费领/g, '可以了解'],
      [/免费/g, '实惠'],
      [/赚钱/g, '省钱'],
      [/\b链接\b/g, '查看'],
      [/包邮/g, '包送到家'],
      [/广告/g, '分享'],
      [/推广/g, '安利'],
      [/代理/g, '推荐'],
    ],
    footer: `\n\n📌 我是在 ${BRAND_NAME} 看到的，有兴趣可以去了解~`,
  },
  tieba: {
    // 贴吧：最严格，主楼不能放引流信息
    replace: [
      [/\b微信\b/g, '私信'],
      [/\bQQ\b/g, '私信'],
      [/免费/g, '特惠'],
      [/赚钱/g, '划算'],
      [/广告/g, '分享'],
      [/推广/g, '推荐'],
      [/代理/g, '卡员'],
      [/加盟/g, '合作'],
      [/包邮/g, '包送到'],
      [/返利/g, '优惠'],
      [/\b链接\b/g, '地址'],
      [/购买/g, '了解'],
      [/下单/g, '看看'],
    ],
    footer: `\n\n想了解的话可以私信我，或者搜 ${BRAND_NAME} 看看。`,
  },
  copy: {
    replace: [],
    footer: `\n\n——来自 ${BRAND_NAME}`,
  },
};

/**
 * 按平台过滤文本
 */
function filterText(text, platform) {
  const rules = PLATFORM_FILTERS[platform];
  if (!rules) return text;
  let result = text;
  for (const [pattern, replacement] of rules.replace) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * 提取纯文本（去掉 markdown/html 符号）
 */
function cleanText(text) {
  return (text || '')
    .replace(/[#*\[\]>\|]/g, '')
    .replace(/---+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 复制到剪贴板
 */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制，去粘贴发布吧 📋');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('已复制，去粘贴发布吧 📋');
}

/**
 * 简易 Toast 提示
 */
function showToast(msg) {
  const existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
    background: '#1a365d', color: '#fff', padding: '12px 24px', borderRadius: '6px',
    fontSize: '.85rem', zIndex: '9999', maxWidth: '80%', textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,.2)',
  });
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2000);
}

// ===== 多平台分享入口 =====
function copyForPlatform(platform, titleEncoded, bodyEncoded, operator) {
  const title = decodeURIComponent(titleEncoded);
  const body = decodeURIComponent(bodyEncoded);

  const cleanBody = cleanText(body);
  const desc = cleanBody.slice(0, 200) + (cleanBody.length > 200 ? '...' : '');
  const filteredTitle = filterText(title, platform);
  const filteredBody = filterText(cleanBody, platform);
  const footer = PLATFORM_FILTERS[platform]?.footer || '';

  let finalText = '';

  switch (platform) {
    case 'zhihu':
      finalText = `${filteredTitle}\n\n${filteredBody}\n\n${footer}`;
      break;
    case 'xiaohongshu':
      finalText = `${filteredTitle}\n\n${filteredBody.slice(0, 500)}${filteredBody.length > 500 ? '...' : ''}\n\n${footer}`;
      break;
    case 'tieba':
      finalText = `${filteredTitle}\n\n${filteredBody.slice(0, 300)}...\n${footer}`;
      break;
    case 'copy':
    default:
      finalText = `${filteredTitle}\n\n${filteredBody}\n${footer}`;
      break;
  }

  copyToClipboard(finalText);
}

// ===== 原有功能 =====
function openModal(product) {
  const modal = document.getElementById('productModal');
  if (!modal || !product) return;
  document.getElementById('modalTitle').textContent = product.productName || '商品详情';
  document.getElementById('modalOrderBtn').href = STORE_URL;
  const body = document.getElementById('modalBody');
  const age1 = product.age1 || 18;
  const age2 = product.age2 || 60;
  const taocan = (product.taocan || '').replace(/佣金[^。]*。?/g, '');
  body.innerHTML = `
    ${product.mainPic ? `<img src="${product.mainPic}" alt="${product.productName}" onerror="this.style.display='none'">` : ''}
    <div class="row"><span class="label">运营商</span><span class="value">${product.operator || '-'}</span></div>
    <div class="row"><span class="label">归属地</span><span class="value">${product.area || '随机'}</span></div>
    <div class="row"><span class="label">年龄</span><span class="value">${age1}-${age2}岁</span></div>
    ${taocan ? `<div class="row"><span class="label">套餐</span><span class="value" style="text-align:right;max-width:60%;font-size:.78rem;">${taocan}</span></div>` : ''}
    ${product.disableArea ? `<div class="row"><span class="label">禁发</span><span class="value" style="text-align:right;max-width:60%;font-size:.75rem;color:#71717a;">${product.disableArea.slice(0,60)}</span></div>` : ''}
  `;
  modal.classList.add('show');
}

function closeModal() { document.getElementById('productModal')?.classList.remove('show'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeModal(); });

function filterProds() {
  const search = (document.getElementById('prodSearch')?.value || '').toLowerCase();
  const active = document.querySelector('#prodFilterBar .active')?.dataset?.op || 'all';
  document.querySelectorAll('.prod-card').forEach(card => {
    const name = (card.querySelector('.name')?.textContent || '').toLowerCase();
    const tags = (card.querySelector('.tags')?.textContent || '');
    const area = (card.querySelector('.area')?.textContent || '');
    const matchOp = active === 'all' || (active === '__broadband__' ? (name.includes('宽带') || name.includes('单宽')) : tags.includes(active));
    const matchSearch = !search || name.includes(search) || area.includes(search);
    card.style.display = matchOp && matchSearch ? 'flex' : 'none';
  });
}

function filterArchive() {
  const active = document.querySelector('#archiveFilter .active')?.dataset?.op || 'all';
  document.querySelectorAll('.archive-item').forEach(item => {
    const tags = item.querySelector('.archive-tags')?.textContent || '';
    item.style.display = active === 'all' || tags.includes(active) ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#prodFilterBar .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#prodFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProds();
    });
  });
  document.querySelectorAll('#archiveFilter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#archiveFilter .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterArchive();
    });
  });
});
