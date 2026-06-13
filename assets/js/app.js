const STORE='https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';

// ===== IP 定位 + 按地区推荐 =====
let userProvince = '';

// 获取用户省份
async function detectProvince() {
  try {
    const res = await fetch('https://ip-api.com/json/?lang=zh-CN&fields=country,region,regionName,city', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.country === 'China' && data.regionName) {
      userProvince = data.regionName.replace('省', '').replace('市', '');
      console.log('📍 检测到地区:', userProvince);
    }
  } catch(e) {
    console.log('📍 IP定位失败，使用默认推荐');
  }
}

// 按地区匹配度排序
function sortByProvince(products) {
  if (!userProvince || !products || !products.length) return products;

  // 地区分组映射
  const regionMap = {
    '广东': ['广东','广州','深圳','佛山','东莞','珠海','中山','惠州','汕头','湛江','江门','茂名','肇庆','梅州','汕尾','河源','阳江','清远','潮州','揭阳','云浮'],
    '浙江': ['浙江','杭州','宁波','温州','嘉兴','湖州','绍兴','金华','衢州','舟山','台州','丽水'],
    '江苏': ['江苏','南京','无锡','徐州','常州','苏州','南通','连云港','淮安','盐城','扬州','镇江','泰州','宿迁'],
    '山东': ['山东','济南','青岛','淄博','枣庄','东营','烟台','潍坊','济宁','泰安','威海','日照','临沂','德州','聊城','滨州','菏泽'],
    '四川': ['四川','成都','绵阳','自贡','攀枝花','泸州','德阳','广元','遂宁','内江','乐山','南充','眉山','宜宾','广安','达州','雅安','巴中','资阳'],
    '湖南': ['湖南','长沙','株洲','湘潭','衡阳','邵阳','岳阳','常德','张家界','益阳','郴州','永州','怀化','娄底'],
    '湖北': ['湖北','武汉','黄石','十堰','宜昌','襄阳','鄂州','荆门','孝感','荆州','黄冈','咸宁','随州'],
    '福建': ['福建','福州','厦门','莆田','三明','泉州','漳州','南平','龙岩','宁德'],
    '河北': ['河北','石家庄','唐山','秦皇岛','邯郸','邢台','保定','张家口','承德','沧州','廊坊','衡水'],
    '河南': ['河南','郑州','开封','洛阳','平顶山','安阳','鹤壁','新乡','焦作','濮阳','许昌','漯河','三门峡','南阳','商丘','信阳','周口','驻马店'],
    '安徽': ['安徽','合肥','芜湖','蚌埠','淮南','马鞍山','淮北','铜陵','安庆','黄山','滁州','阜阳','宿州','六安','亳州','池州','宣城'],
    '广西': ['广西','南宁','柳州','桂林','梧州','北海','防城港','钦州','贵港','玉林','百色','贺州','河池','来宾','崇左'],
    '云南': ['云南','昆明','曲靖','玉溪','保山','昭通','丽江','普洱','临沧','楚雄','红河','文山','西双版纳','大理','德宏','怒江','迪庆'],
    '江西': ['江西','南昌','景德镇','萍乡','九江','新余','鹰潭','赣州','吉安','宜春','抚州','上饶'],
    '陕西': ['陕西','西安','铜川','宝鸡','咸阳','渭南','延安','汉中','榆林','安康','商洛'],
    '重庆': ['重庆'],
    '上海': ['上海'],
    '北京': ['北京'],
    '天津': ['天津'],
    '海南': ['海南','海口','三亚','三沙','儋州'],
    '贵州': ['贵州','贵阳','六盘水','遵义','安顺','毕节','铜仁','黔西南','黔东南','黔南'],
    '吉林': ['吉林','长春','吉林','四平','辽源','通化','白山','松原','白城','延边'],
    '辽宁': ['辽宁','沈阳','大连','鞍山','抚顺','本溪','丹东','锦州','营口','阜新','辽阳','盘锦','铁岭','朝阳','葫芦岛'],
    '黑龙江': ['黑龙江','哈尔滨','齐齐哈尔','鸡西','鹤岗','双鸭山','大庆','伊春','佳木斯','七台河','牡丹江','黑河','绥化','大兴安岭'],
    '山西': ['山西','太原','大同','阳泉','长治','晋城','朔州','忻州','吕梁','晋中','临汾','运城'],
    '甘肃': ['甘肃','兰州','嘉峪关','金昌','白银','天水','武威','张掖','平凉','酒泉','庆阳','定西','陇南','临夏','甘南'],
    '内蒙古': ['内蒙古','呼和浩特','包头','乌海','赤峰','通辽','鄂尔多斯','呼伦贝尔','巴彦淖尔','乌兰察布','兴安','锡林郭勒','阿拉善'],
    '新疆': ['新疆','乌鲁木齐','克拉玛依','吐鲁番','哈密','昌吉','博尔塔拉','巴音郭楞','阿克苏','克孜勒苏','喀什','和田','伊犁','塔城','阿勒泰'],
    '青海': ['青海','西宁','海东','海北','黄南','海南','果洛','玉树','海西'],
    '宁夏': ['宁夏','银川','石嘴山','吴忠','固原','中卫'],
    '西藏': ['西藏','拉萨','日喀则','昌都','林芝','山南','那曲','阿里'],
  };

  return [...products].sort((a, b) => {
    const aMatch = a.area && (a.area === userProvince || (regionMap[userProvince] && regionMap[userProvince].some(c => a.area.includes(c))));
    const bMatch = b.area && (b.area === userProvince || (regionMap[userProvince] && regionMap[userProvince].some(c => b.area.includes(c))));
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}

// 重排首页推荐套餐
async function reorderProducts() {
  await detectProvince();
  if (!userProvince) return;

  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  if (!cards.length) return;

  // 提取数据
  const products = cards.map(c => {
    const name = c.querySelector('.product-card-name')?.textContent || '';
    const meta = c.querySelector('.product-card-meta')?.textContent || '';
    const area = meta.split('·')[1]?.trim() || '';
    return { el: c, area, name };
  });

  // 按地区排序
  const sorted = sortByProvince(products.map(p => ({ ...p, area: p.area })));

  // 重排 DOM
  sorted.forEach((p, i) => {
    if (i === 0) grid.prepend(p.el);
    else grid.insertBefore(p.el, sorted[i - 1].el.nextSibling);
  });

  // 在第一个卡片上添加"推荐"标记
  const first = sorted[0]?.el;
  if (first && !first.querySelector('.local-badge')) {
    const badge = document.createElement('div');
    badge.className = 'local-badge';
    badge.textContent = '📍 本地推荐';
    Object.assign(badge.style, {
      position: 'absolute', top: '8px', left: '8px',
      background: 'var(--red)', color: '#fff', fontSize: '10px',
      padding: '2px 8px', borderRadius: '4px', fontWeight: '600',
      zIndex: '2',
    });
    const imgWrap = first.querySelector('.product-card-img');
    if (imgWrap) {
      imgWrap.style.position = 'relative';
      imgWrap.appendChild(badge);
    }
  }
}

// ===== 弹窗 =====
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

  // 按 IP 推荐
  reorderProducts();
});
