/**
 * 内容策略规划器
 * 定义所有可写的干货文章主题，每天选一个不同的
 * 每篇文章在合适位置插入1-2条商品推荐
 */

const TOPICS = [
  // ===== 科普类 =====
  {
    category: '科普',
    keyword: '流量卡和物联卡的区别',
    title: '流量卡、物联卡、电话卡到底有什么区别？一篇文章讲清楚',
    desc: '很多人分不清流量卡和物联卡，被坑了才知道。本文用大白话讲清楚三者的区别。',
    insertType: 'end_card',  // 文末推荐
  },
  {
    category: '科普',
    keyword: '5G和4G的区别',
    title: '2025年还要不要换5G？5G和4G的区别一次说清',
    desc: '5G跑了几年了，到底值不值得换？和4G比有什么实际区别？',
    insertType: 'end_card',
  },
  {
    category: '科普',
    keyword: '携号转网怎么办理',
    title: '携号转网全攻略：不换号也能换运营商，手把手教你操作',
    desc: '想换运营商又舍不得用了十年的号码？携号转网一文看懂。',
    insertType: 'end_card',
  },
  {
    category: '科普',
    keyword: '什么是eSIM',
    title: 'eSIM是什么？国内能用吗？和传统SIM卡比哪个好？',
    desc: 'eSIM在国内逐步开放了，它和传统SIM卡有什么区别？一文搞懂。',
    insertType: 'end_card',
  },

  // ===== 避坑类 =====
  {
    category: '避坑',
    keyword: '19元300G流量卡是真的吗',
    title: '19元300G流量卡是真的还是套路？揭秘流量卡行业的5大坑',
    desc: '网上到处都是19元300G的广告，到底能不能办？本文揭露行业真相。',
    insertType: 'mid_card',
  },
  {
    category: '避坑',
    keyword: '物联卡骗局',
    title: '物联卡骗局：为什么你的流量卡突然用不了了？',
    desc: '买了一张很便宜的流量卡，用了两个月突然废了？你可能买到了物联卡。',
    insertType: 'mid_card',
  },
  {
    category: '避坑',
    keyword: '流量卡优惠期到期',
    title: '流量卡的优惠期到了怎么办？三步教你正确处理',
    desc: '很多流量卡第一年19元，第二年恢复原价。到期了怎么办？注销还是续费？',
    insertType: 'end_card',
  },
  {
    category: '避坑',
    keyword: '办理流量卡注意事项',
    title: '办理流量卡前必看的7个注意事项，少一个都可能被坑',
    desc: '办了这么多年卡，总结出7条血泪经验，每一条都是真金白银换来的。',
    insertType: 'mid_card',
  },
  {
    category: '避坑',
    keyword: '流量卡禁发区域',
    title: '为什么有些流量卡你所在地区办不了？禁发区域是怎么回事',
    desc: '看中一张很划算的卡，提交订单却提示"不在发货范围"？告诉你原因。',
    insertType: 'end_card',
  },
  {
    category: '避坑',
    keyword: '永久套餐真假',
    title: '那些"永久9元"的流量卡是真的吗？行业内幕大揭秘',
    desc: '市面上所谓的永久套餐，到底哪些是真的哪些是假的？',
    insertType: 'mid_card',
  },

  // ===== 技巧类 =====
  {
    category: '技巧',
    keyword: '学生党流量卡推荐',
    title: '学生党怎么选流量卡？月租50元以内，这些套餐最划算',
    desc: '学生预算有限，但流量需求大。教你怎么用最少的钱办最合适的卡。',
    insertType: 'end_card',
  },
  {
    category: '技巧',
    keyword: '租房宽带怎么选',
    title: '租房宽带怎么选？比营业厅便宜一半的4种方案实测对比',
    desc: '租房不想拉一年的宽带？试试这几种方案，省钱又灵活。',
    insertType: 'mid_card',
  },
  {
    category: '技巧',
    keyword: '双卡手机搭配',
    title: '双卡手机怎么搭配最省钱？一张主卡+一张流量卡是绝配',
    desc: '现在大部分手机都支持双卡，怎么搭配能每个月省下一半话费？',
    insertType: 'end_card',
  },
  {
    category: '技巧',
    keyword: '出差流量卡',
    title: '经常出差用什么流量卡？全国通用大流量套餐推荐指南',
    desc: '每个月都在全国各地跑，办什么套餐最划算？经验分享。',
    insertType: 'mid_card',
  },
  {
    category: '技巧',
    keyword: '宽带办理技巧',
    title: '宽带怎么办最划算？三大运营商宽带套餐对比2025',
    desc: '电信、联通、移动宽带到底选哪个？价格、网速、服务全面对比。',
    insertType: 'mid_card',
  },

  // ===== 内幕类 =====
  {
    category: '内幕',
    keyword: '流量卡为什么便宜',
    title: '运营商内部人告诉你：流量卡为什么能这么便宜？',
    desc: '营业厅99元的套餐，网上只要29元。差价到底差在哪里？',
    insertType: 'mid_card',
  },
  {
    category: '内幕',
    keyword: '流量卡推广怎么赚钱',
    title: '流量卡代理是怎么赚钱的？一单能赚多少？揭秘推广模式',
    desc: '到处都有人在推流量卡，他们是怎么赚钱的？这篇文章说清楚。',
    insertType: 'end_card',
  },
  {
    category: '内幕',
    keyword: '运营商考核期',
    title: '运营商的"考核期"是什么？为什么你的卡会被销户？',
    desc: '办了卡用了两个月突然被停机？可能是触发了运营商的考核机制。',
    insertType: 'end_card',
  },

  // ===== 生活技巧 =====
  {
    category: '生活',
    keyword: '租房网络解决方案',
    title: '租房族网络怎么解决？宽带/流量卡/CPE哪個最适合你？',
    desc: '租房不想拉宽带？临时住几个月怎么办？三种方案优缺点对比。',
    insertType: 'mid_card',
  },
  {
    category: '生活',
    keyword: '过年回家网络',
    title: '过年回老家网络怎么解决？不想拉宽带可以试试这个',
    desc: '每年就回去几天，不想办一年宽带。流量卡+热点是最佳方案。',
    insertType: 'end_card',
  },
  {
    category: '生活',
    keyword: '手机信号不好怎么办',
    title: '手机信号不好怎么办？不一定是手机的问题',
    desc: '在家里信号总是只有一格？教你几招改善信号的方法。',
    insertType: 'end_card',
  },
  {
    category: '生活',
    keyword: '流量不够用怎么办',
    title: '流量不够用怎么办？这5种方法比买流量包划算多了',
    desc: '月底流量告急，买加油包还是办副卡？一算账你就明白了。',
    insertType: 'mid_card',
  },
];

/**
 * 获取每日选题
 */
function pickTopic(seed) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update('blog-topic-' + seed).digest('hex');
  const index = parseInt(hash.slice(0, 8), 16) % TOPICS.length;
  const topic = TOPICS[index];
  // 轮转已选过的
  const dateStr = new Date().toISOString().slice(0, 10);
  return { ...topic, seed: dateStr + '-' + index };
}

/**
 * 根据选题类型找到最相关的商品
 */
function pickRelatedProducts(topic, products, seed) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update('match-' + topic.keyword + seed).digest('hex');
  const rand = () => {
    let n = parseInt(hash.slice(0, 8), 16);
    return () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
  };
  const r = rand();
  const onSale = products.filter(p => p.flag);
  // 打乱
  const arr = [...onSale].sort(() => r() - 0.5);
  // 根据不同选题类型，推荐不同商品
  return arr.slice(0, 2).map(p => ({
    productID: p.productID,
    productName: p.productName,
    operator: p.operator,
    area: p.area,
    price: p.price,
    mainPic: p.mainPic,
    netAddr: p.netAddr,
    taocan: p.taocan || '',
  }));
}

module.exports = { TOPICS, pickTopic, pickRelatedProducts };
