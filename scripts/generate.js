/**
 * 主构建脚本
 * 1. 从 API 获取商品数据
 * 2. 生成推广内容
 * 3. 输出 data.json 供前端使用
 */
const fs = require('fs');
const path = require('path');
const { getProducts, analyzeProducts } = require('./api');
const { generateAll } = require('./generator');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const DATA_DIR = path.join(__dirname, '..', 'data');

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
    console.log(`   运营商: ${Object.entries(stats.byOperator).map(([k, v]) => `${k}${v}`).join(', ')}`);

    // 2. 生成推广内容
    console.log('\n✍️ 生成推广内容...');
    const content = generateAll(products);

    // 3. 组装前端所需数据
    const output = {
      buildTime: content.generatedAt,
      date: content.date,
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
      dailyArticle: content.dailyArticle ? {
        ...content.dailyArticle,
        article: content.dailyArticle.article,
      } : null,
      recommendations: content.recommendations,
      hotRanking: content.hotRanking,
      byOperator: content.byOperator,
      broadband: content.broadband,
      seoKeywords: content.seoKeywords,
    };

    // 4. 写入 dist/data.json
    ensureDir(DIST_DIR);
    const outputPath = path.join(DIST_DIR, 'data.json');
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

// 如果是直接运行
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
