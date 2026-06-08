/**
 * 前端脚本 - 仅处理弹窗和商品筛选
 */
const STORE_URL = 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';

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

function closeModal() {
  document.getElementById('productModal')?.classList.remove('show');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal();
});

// 商品页筛选
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

document.addEventListener('DOMContentLoaded', () => {
  // 商品页筛选按钮
  document.querySelectorAll('#prodFilterBar .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#prodFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProds();
    });
  });
});
