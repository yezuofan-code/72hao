const STORE='https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';

function om(p){
  if(!p)return;
  document.getElementById('mt').textContent=p.productName||'套餐';
  document.getElementById('mbtn').href=STORE;
  const b=document.getElementById('mb');
  const tc=(p.taocan||'').replace(/佣金[^。]*。?/g,'');
  b.innerHTML=`
    ${p.mainPic?`<img src="${p.mainPic}" alt="" onerror="this.style.display='none'">`:''}
    <div class="row"><span class="label">运营商</span><span class="value">${p.operator||'-'}</span></div>
    <div class="row"><span class="label">归属地</span><span class="value">${p.area||'随机'}</span></div>
    <div class="row"><span class="label">年龄</span><span class="value">${p.age1||18}-${p.age2||60}岁</span></div>
    ${tc?`<div class="row"><span class="label">套餐</span><span class="value" style="text-align:right;max-width:60%;font-size:13px;">${tc}</span></div>`:''}`;
  document.getElementById('pm').classList.add('show');
}
function cm(){document.getElementById('pm')?.classList.remove('show');}
document.addEventListener('click',e=>{if(e.target.classList.contains('modal-bg'))cm();});

function fp(){
  const s=(document.getElementById('ps')?.value||'').toLowerCase();
  const a=document.querySelector('.shop-filter .active')?.dataset?.o||'all';
  document.querySelectorAll('.shop-grid .product-card').forEach(c=>{
    const n=(c.querySelector('.product-card-name')?.textContent||'').toLowerCase();
    const t=c.textContent||'';
    const mo=a==='all'||(a==='__bb__'?(n.includes('宽带')||n.includes('单宽')||n.includes('🌐')):t.includes(a));
    const ms=!s||n.includes(s);
    c.style.display=mo&&ms?'':'none';
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.shop-filter .filter-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      document.querySelectorAll('.shop-filter .filter-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');fp();
    });
  });
  const af=document.getElementById('af');
  if(af){
    af.querySelectorAll('.filter-btn').forEach(b=>{
      b.addEventListener('click',()=>{
        af.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        const a=b.dataset.c;
        document.querySelectorAll('.archive-item').forEach(i=>{i.style.display=a==='all'?'':'none';});
      });
    });
  }
});
