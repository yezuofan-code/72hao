/**
 * 主构建脚本
 * 1. 从 API 获取商品数据
 * 2. 生成推广内容（增量积累，保留历史）
 * 3. 输出 data.json 供前端使用
 */
const fs = require('fs');
const path = require('path');
const { getProducts, analyzeProducts } = require('./api');
const { generateAll } = require('./generator');
const ai = require('./ai');

const STORE_URL = 'https://haokawx.lot-ml.com/ProductEn/Index/530789e16bb06db6';
const DIST_DIR = path.join(__dirname, '..', 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function build(forceRefresh = false) {
  console.log('='.repeat(50));
  console.log('  172号卡推广站 - 自动构建');
  console.log('  ', new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(50));

  try {
    // 1. 获取商品数据
    console.log('\n📦 获取商品数据...');
    const products = await getProducts(forceRefresh);
    const stats = analyzeProducts(products);
    console.log(`   共 ${stats.total} 个商品`);

    // 2. 读取历史数据
    const outputPath = path.join(DIST_DIR, 'data.json');
    let archive = {
      articles: [],      // 历史文章列表
      rankings: [],      // 历史榜单
      recommendations: [], // 历史推荐
    };
    if (fs.existsSync(outputPath)) {
      try {
        const old = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        archive.articles = old.articles || (old.dailyArticle ? [old.dailyArticle] : []);
        archive.rankings = old.rankings || (old.hotRanking ? [{ date: old.date, items: old.hotRanking }] : []);
        archive.recommendations = old.recommendations || [];
        console.log(`   历史内容: ${archive.articles.length} 篇文章, ${archive.rankings.length} 天榜单`);
      } catch (e) {
        console.log('   历史数据读取失败，重新开始积累');
      }
    }

    // 3. 生成当日推广内容
    console.log('\n✍️ 生成推广内容...');
    const content = await generateAll(products, ai);

    // 4. 合并历史 + 当日新内容
    if (content.dailyArticle) {
      // 避免同一天重复添加
      const exists = archive.articles.find(a => a.date === content.date);
      if (!exists) {
        archive.articles.unshift({ ...content.dailyArticle, date: content.date });
      }
    }
    // 保留最近 30 篇文章
    archive.articles = archive.articles.slice(0, 30);

    if (content.hotRanking) {
      const exists = archive.rankings.find(r => r.date === content.date);
      if (!exists) {
        archive.rankings.unshift({ date: content.date, items: content.hotRanking });
      }
    }
    archive.rankings = archive.rankings.slice(0, 30);

    console.log(`   当前: ${archive.articles.length} 篇文章积累`);

    // 5. 组装输出
    const output = {
      buildTime: content.generatedAt,
      date: content.date,
      storeUrl: STORE_URL,
      stats: {
        totalProducts: stats.total,
        byOperator: stats.byOperator,
      },
      products: products.map(p => ({
        productID: p.productID,
        productName: p.productName,
        mainPic: p.mainPic,
        area: p.area,
        disableArea: p.disableArea,
        operator: p.operator,
        price: p.price,
        backMoneyType: p.backMoneyType,
        flag: p.flag,
        age1: p.age1,
        age2: p.age2,
        taocan: p.taocan || p.productName,
        netAddr: p.netAddr,
      })),
      // 今日内容
      dailyArticle: content.dailyArticle ? { ...content.dailyArticle, date: content.date } : null,
      recommendations: content.recommendations,
      hotRanking: content.hotRanking,
      byOperator: content.byOperator,
      broadband: content.broadband,
      seoKeywords: content.seoKeywords,
      // 历史积累
      articles: archive.articles,
      rankings: archive.rankings,
    };

    // 6. 写入 dist/data.json
    ensureDir(DIST_DIR);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`\n✅ 构建完成！`);
    console.log(`   输出: ${outputPath}`);
    console.log(`   大小: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

    return true;
  } catch (err) {
    console.error('\n❌ 构建失败:', err.message);
    console.error(err.stack);
    return false;
  }
}

if (require.main === module) {
  const forceRefresh = process.argv.includes('--force') || process.argv.includes('-f');
  build(forceRefresh).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}

module.exports = { build };
