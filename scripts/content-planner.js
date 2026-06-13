/**
 * 内容策略规划器
 * 每个主题包含详细背景，AI 据此写出更优质的文章
 * 每天选一个不同主题，搭配 1-2 件商品推荐
 */

const TOPICS = [
  // ===== 科普类 =====
  {
    category: '科普',
    keyword: '流量卡和物联卡的区别',
    title: '流量卡、物联卡、电话卡到底有什么区别？一篇文章讲清楚',
    desc: '很多人分不清流量卡和物联卡，被坑了才知道。本文用大白话讲清楚三者的区别。',
    angle: '我有一个朋友在拼多多9.9买了张100G的卡，用了两个月就废了——因为他买到的是物联卡。从这件事切入，讲清楚三者的本质区别。',
    keyPoints: ['物联卡不能打电话发短信','物联卡随时可能被停用','正规流量卡是运营商官方套餐','如何通过号段/客服分辨'],
    searchTerms: ['流量卡和物联卡的区别','物联卡骗局','正规流量卡怎么辨别'],
    imgPrompt: '一张表格对比图，左边流量卡右边物联卡，清晰展示区别，简约蓝色商务风格',
  },
  {
    category: '科普',
    keyword: '5G和4G的区别',
    title: '2026年还要不要换5G？5G和4G的区别一次说清',
    desc: '5G跑了几年了，到底值不值得换？和4G比有什么实际区别？',
    angle: '从日常使用场景出发：刷视频、打游戏、看直播，5G和4G体感差距到底多大？用实测数据说话。',
    keyPoints: ['5G下载速度实测比4G快3-5倍','延迟更低但日常使用感知不强','5G套餐比4G贵多少','什么情况值得换5G'],
    searchTerms: ['5G和4G区别','2026年5G值得办吗','5G套餐哪个划算'],
    imgPrompt: '5G和4G网速对比示意图，左边4G右边5G，数据可视化风格，蓝白色调',
  },
  {
    category: '科普',
    keyword: '携号转网怎么办理',
    title: '携号转网全攻略：不换号也能换运营商，手把手教你操作',
    desc: '想换运营商又舍不得用了十年的号码？携号转网一文看懂。',
    angle: '以第一人称经历讲述：从想转→查条件→办理→成功，全程记录，附带踩坑提醒。',
    keyPoints: ['携号转网的条件','办理流程三步走','转网后的注意事项','哪些情况不能转'],
    searchTerms: ['携号转网怎么办理','携号转网条件','携号转网攻略2026'],
    imgPrompt: '手机屏幕上显示携号转网办理流程，三步图示，简洁清爽风格',
  },
  {
    category: '科普',
    keyword: '什么是eSIM',
    title: 'eSIM是什么？国内能用吗？和传统SIM卡比哪个好？',
    desc: 'eSIM在国内逐步开放了，它和传统SIM卡有什么区别？一文搞懂。',
    angle: '从苹果取消实体SIM卡槽的新闻切入，介绍eSIM的现状和未来。',
    keyPoints: ['eSIM是什么','国内哪些手机和运营商支持','eSIM的优缺点','国外eSIM已经很普及'],
    searchTerms: ['eSIM是什么','eSIM国内能用吗','eSIM和实体SIM卡区别'],
    imgPrompt: '手机里嵌入电子SIM卡的示意图，科技感蓝色风格',
  },

  // ===== 避坑类 =====
  {
    category: '避坑',
    keyword: '19元300G流量卡是真的吗',
    title: '19元300G流量卡是真的还是套路？揭秘流量卡行业的5大坑',
    desc: '网上到处都是19元300G的广告，到底能不能办？本文揭露行业真相。',
    angle: '以"我也差点办了"的亲身经历开场，然后一条条拆解这些广告背后的猫腻。',
    keyPoints: ['19元300G的真相：限时优惠+定向流量','物联卡冒充正规卡','优惠期到了就恢复原价','虚标流量','禁发区域的限制'],
    searchTerms: ['19元300G流量卡','流量卡套路','流量卡广告是真的吗'],
    imgPrompt: '放大镜下的手机流量卡套餐广告，揭露套路的感觉，深色背景红色警示',
  },
  {
    category: '避坑',
    keyword: '物联卡骗局',
    title: '物联卡骗局：为什么你的流量卡突然用不了了？',
    desc: '买了一张很便宜的流量卡，用了两个月突然废了？你可能买到了物联卡。',
    angle: '以朋友做外卖骑手买卡被坑的故事开头，讲物联卡的前世今生。',
    keyPoints: ['物联卡本质是企业用的','个人使用物联卡的风险','怎么一眼认出物联卡','被坑了怎么办'],
    searchTerms: ['物联卡骗局','流量卡突然不能用','物联卡和正规卡区别'],
    imgPrompt: '一张SIM卡被红色禁止标志覆盖，警示风格',
  },
  {
    category: '避坑',
    keyword: '永久套餐真假',
    title: '那些永久9元永久19元的流量卡是真的吗？行业内幕大揭秘',
    desc: '市面上所谓的永久套餐，到底哪些是真的哪些是假的？',
    angle: '以"我在淘宝看到9元永久套餐"的截图开场，分析为什么"永久"不永久。',
    keyPoints: ['永久套餐的三种套路','运营商没有永久套餐','限时优惠=长期优惠','真正划算的方案'],
    searchTerms: ['永久流量卡是真的吗','9元永久流量卡','19元永久套餐'],
    imgPrompt: '价格标签上写着9元但有一个隐藏的小字说明，揭露感',
  },
  {
    category: '避坑',
    keyword: '流量卡优惠期到期',
    title: '流量卡的优惠期到了怎么办？三步教你正确处理',
    desc: '很多流量卡第一年19元，第二年恢复原价。到期了怎么办？注销还是续费？',
    angle: '以"去年办的卡今天收到涨价通知"开场，给出具体处理方案。',
    keyPoints: ['优惠期到了恢复多少原价','注销重办还是续费','怎么找下一张优惠卡','注意事项'],
    searchTerms: ['流量卡优惠到期','流量卡第二年涨价','优惠流量卡续费'],
    imgPrompt: '日历上圈出一个到期日，旁边放着一张SIM卡，提醒风格',
  },

  // ===== 技巧类 =====
  {
    category: '技巧',
    keyword: '学生党流量卡推荐',
    title: '学生党怎么选流量卡？月租50元以内，这些套餐最划算',
    desc: '学生预算有限，但流量需求大。教你怎么用最少的钱办最合适的卡。',
    angle: '以大学生活场景切入：宿舍没WiFi、校园网限速、月底流量告急。',
    keyPoints: ['学生选卡三要素：月租低、流量多、无合约','推荐适合学生的套餐类型','双卡搭配方案','校园套餐对比'],
    searchTerms: ['学生党流量卡','学生流量卡推荐','校园流量卡'],
    imgPrompt: '大学生在宿舍里刷手机，旁边放着流量卡，青春校园风格',
  },
  {
    category: '技巧',
    keyword: '租房宽带怎么选',
    title: '租房宽带怎么选？比营业厅便宜一半的4种方案实测对比',
    desc: '租房不想拉一年的宽带？试试这几种方案，省钱又灵活。',
    angle: '以"刚毕业租房被宽带套餐坑了"的真实经历开场。',
    keyPoints: ['租房宽带的痛点：合约长、移机难','方案一：流量卡+热点','方案二：CPE路由器','方案三：短期宽带','方案四：跟邻居合办'],
    searchTerms: ['租房宽带怎么办','租房网络方案','短期宽带套餐'],
    imgPrompt: '一个租来的小房间里，手机开热点连接电脑的画面，温馨简约',
  },
  {
    category: '技巧',
    keyword: '双卡手机搭配',
    title: '双卡手机怎么搭配最省钱？一张主卡+一张流量卡是绝配',
    desc: '现在大部分手机都支持双卡，怎么搭配能每个月省下一半话费？',
    angle: '以"我自己用了3年的双卡方案"的真实分享切入。',
    keyPoints: ['双卡搭配的核心逻辑','主卡选8元保号套餐','副卡选大流量套餐','具体套餐推荐'],
    searchTerms: ['双卡手机怎么搭配','8元保号套餐','主卡+流量卡'],
    imgPrompt: '双卡手机示意图，一张主卡一张副卡，分工明确的信息图',
  },
  {
    category: '技巧',
    keyword: '出差流量卡',
    title: '经常出差用什么流量卡？全国通用大流量套餐推荐指南',
    desc: '每个月都在全国各地跑，办什么套餐最划算？经验分享。',
    angle: '以销售/出差人士的视角，讲全国通用套餐的重要性。',
    keyPoints: ['出差选卡要点：全国通用、大流量、信号好','三大运营商覆盖对比','推荐适合出差的套餐'],
    searchTerms: ['出差流量卡','全国通用流量卡','经常出差怎么办流量卡'],
    imgPrompt: '拉着行李箱在机场，手机显示大流量套餐，商务旅行风格',
  },

  // ===== 内幕类 =====
  {
    category: '内幕',
    keyword: '流量卡为什么便宜',
    title: '运营商内部人告诉你：流量卡为什么能这么便宜？',
    desc: '营业厅99元的套餐，网上只要29元。差价到底差在哪里？',
    angle: '以一个"在运营商干过"的人的口吻，揭秘套餐定价的逻辑。',
    keyPoints: ['营业厅套餐和流量卡是两套体系','流量卡是运营商拉新手段','价格差的真正原因','到底划不划算'],
    searchTerms: ['流量卡为什么这么便宜','营业厅和网上套餐差价','运营商定价策略'],
    imgPrompt: '营业厅柜台和手机上的便宜套餐对比，左右分屏，对比感',
  },
  {
    category: '内幕',
    keyword: '流量卡推广怎么赚钱',
    title: '流量卡推广是怎么赚钱的？一单能赚多少？揭秘推广模式',
    desc: '到处都有人在推流量卡，他们是怎么赚钱的？这篇文章说清楚。',
    angle: '以"我一个朋友在做流量卡推广"的角度，客观介绍这个行业。',
    keyPoints: ['推广佣金一单几十到几百','层级代理模式','为什么有人免费送卡','这个行业能做吗'],
    searchTerms: ['流量卡推广赚钱','流量卡代理','流量卡佣金'],
    imgPrompt: '手机屏幕上显示推广后台数据，简约商务风格',
  },
  {
    category: '内幕',
    keyword: '运营商考核期',
    title: '运营商考核期是什么？为什么你的卡会被销户？',
    desc: '办了卡用了两个月突然被停机？可能是触发了运营商的考核机制。',
    angle: '以"用户投诉卡被停机"的真实案例开场，解释考核期的存在。',
    keyPoints: ['考核期是什么','考核期内不能做什么','哪些行为会触发考核','怎么安全度过考核期'],
    searchTerms: ['运营商考核期','流量卡被销户','流量卡停机'],
    imgPrompt: '手机显示SIM卡已停用，旁边有个日历倒计时，解释感',
  },

  // ===== 生活类 =====
  {
    category: '生活',
    keyword: '租房网络解决方案',
    title: '租房族网络怎么解决？宽带/流量卡/CPE哪个最适合你？',
    desc: '租房不想拉宽带？临时住几个月怎么办？三种方案优缺点对比。',
    angle: '从合租、单间、短租三种场景出发，分别给出网络方案。',
    keyPoints: ['合租：大家平摊办宽带','单间：流量卡+热点','短租：CPE路由器','成本对比表格'],
    searchTerms: ['租房网络解决方案','租房怎么办网络','CPE路由器'],
    imgPrompt: '三种网络方案并列对比：宽带、流量卡、CPE，信息图风格',
  },
  {
    category: '生活',
    keyword: '过年回家网络',
    title: '过年回老家网络怎么解决？不想拉宽带可以试试这个',
    desc: '每年就回去几天，不想办一年宽带。流量卡+热点是最佳方案。',
    angle: '以"每年过年回老家都没网"的场景切入，给出临时的网络方案。',
    keyPoints: ['流量卡+手机热点是最方便的','CPE路由器更适合全家用','提前买好卡避免过年涨价'],
    searchTerms: ['过年回家网络','临时网络方案','短期流量卡'],
    imgPrompt: '过年回家的场景，手机开着热点一家人围着看，温馨风格',
  },
  {
    category: '生活',
    keyword: '手机信号不好怎么办',
    title: '手机信号不好怎么办？不一定是手机的问题',
    desc: '在家里信号总是只有一格？教你几招改善信号的方法。',
    angle: '以"在家一打电话就断"的烦恼开场，从易到难给出解决方案。',
    keyPoints: ['先判断是手机问题还是运营商问题','换运营商比换手机便宜','信号放大器和WiFi通话','巧用双卡互补'],
    searchTerms: ['手机信号不好','家里信号差怎么办','信号增强方法'],
    imgPrompt: '手机信号格从一格到满格的变化图，向上提升的感觉',
  },
  {
    category: '生活',
    keyword: '流量不够用怎么办',
    title: '流量不够用怎么办？这5种方法比买流量包划算多了',
    desc: '月底流量告急，买加油包还是办副卡？一算账你就明白了。',
    angle: '以"每个月20号就开始省着用流量"的日常场景开场。',
    keyPoints: ['买加油包最不划算','办一张副卡/流量卡','蹭WiFi','换大流量套餐','调整使用习惯'],
    searchTerms: ['流量不够用','月底流量告急','流量加油包划算吗'],
    imgPrompt: '手机流量告急的界面，旁边列出5种解决方案，实用信息图',
  },
];

function pickTopic(seed) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update('blog-topic-' + seed).digest('hex');
  const index = parseInt(hash.slice(0, 8), 16) % TOPICS.length;
  const topic = { ...TOPICS[index] };
  // 选1-2个相关商品
  return topic;
}

function pickRelatedProducts(topic, products, seed) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update('match-' + topic.keyword + seed).digest('hex');
  let n = parseInt(hash.slice(0, 8), 16);
  const r = () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
  const onSale = products.filter(p => p.flag);
  const arr = [...onSale].sort(() => r() - 0.5);
  // 根据类别选相关产品
  let filtered = arr;
  if (topic.keyword.includes('宽带') || topic.category === '生活' && topic.keyword.includes('网络')) {
    filtered = arr.filter(p => p.productName.includes('宽带') || p.productName.includes('单宽'));
    if (filtered.length < 2) filtered = arr;
  }
  if (topic.keyword.includes('学生')) {
    filtered = arr.filter(p => (p.price || 0) < 50);
    if (filtered.length < 2) filtered = arr;
  }
  return filtered.slice(0, 2).map(p => ({
    productID: p.productID, productName: p.productName, operator: p.operator,
    area: p.area, price: p.price, mainPic: p.mainPic, netAddr: p.netAddr,
    taocan: (p.taocan || '').replace(/佣金[^。]*。?/g, '').slice(0, 80),
  }));
}

module.exports = { TOPICS, pickTopic, pickRelatedProducts };
