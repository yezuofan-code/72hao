/**
 * 172号卡 API 客户端
 * - 获取商品列表 (GetProductsV2)
 * - 下单 (ApiToOrder)
 * - 订单查询 (GetOrderInfo)
 * - 选号 (PickNumber)
 * - 自动签名
 * - 数据缓存
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.SECRET || 'caacc5845927d017911998b499c0ba57';
const USER_ID = process.env.USER_ID || 'zuophp';

const API_BASE = 'https://haokaopenapi.lot-ml.com/api';

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/** 安全的 fetch（兼容 node-fetch） */
async function safeFetch(url, options) {
  const fetchFn = typeof globalThis.fetch === 'function'
    ? globalThis.fetch
    : require('node-fetch');
  return fetchFn(url, options);
}

/**
 * MD5 签名 - 自然排序（字母顺序），secret 追加最后
 * @param {Object} params - 参数键值对
 * @param {string} secret - 密钥
 * @param {string[]} exclude - 不参与签名的字段
 */
function signMD5(params, secret, exclude = []) {
  const keys = Object.keys(params).filter(k => !exclude.includes(k)).sort();
  const str = keys.map(k => `${k}=${params[k]}`).join('&') + secret;
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

// ============================================================
//  1. 获取商品列表 GetProductsV2
// ============================================================

async function fetchProducts(productID = '') {
  const timestamp = getTimestamp();
  const params = {
    ProductID: productID,
    Timestamp: timestamp,
    user_id: USER_ID,
  };
  const sign = signMD5(params, SECRET);
  params.user_sign = sign;

  const body = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => body.append(k, String(v)));

  const res = await safeFetch(`${API_BASE}/order/GetProductsV2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`商品查询失败: ${data.message || '未知错误'} (code: ${data.code})`);
  }
  return data.data || [];
}

async function getProducts(forceRefresh = false) {
  ensureDir(DATA_DIR);
  const cacheFile = path.join(DATA_DIR, 'products.json');

  if (!forceRefresh && fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    const age = Date.now() - stat.mtimeMs;
    if (age < 60 * 60 * 1000) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      console.log(`[API] 使用缓存数据: ${cached.length} 个商品`);
      return cached;
    }
  }

  console.log('[API] 正在从API获取商品数据...');
  const products = await fetchProducts();
  fs.writeFileSync(cacheFile, JSON.stringify(products, null, 2), 'utf8');
  console.log(`[API] 获取成功: ${products.length} 个商品`);
  return products;
}

// ============================================================
//  2. 下单 ApiToOrder
// ============================================================

/**
 * 下单
 * @param {Object} opts
 * @param {string} opts.Name - 姓名
 * @param {string} opts.Phone - 手机号
 * @param {string} opts.IDCard - 身份证号
 * @param {string} opts.Province - 省份
 * @param {string} opts.City - 城市
 * @param {string} opts.Area - 县区
 * @param {string} opts.Address - 详细地址
 * @param {number} opts.ProductID - 商品ID
 * @param {string} opts.DownOrderID - 下游订单ID（唯一）
 * @param {string} [opts.ThirdPhone=''] - 选号号码，空传空字符串
 * @param {string} [opts.NumberId=''] - 号码ID（选号接口返回）
 * @param {string} [opts.NumberPoolId=''] - 号池ID（选号接口返回）
 * @param {number} [opts.SkuID] - 套餐办理区域ID
 * @returns {Promise<{code: number, message: string}>}
 */
async function placeOrder(opts) {
  const timestamp = getTimestamp();
  const ThirdPhone = opts.ThirdPhone || '';

  // 构建签名参数（自然排序）
  const signParams = {
    Address: opts.Address,
    Area: opts.Area,
    City: opts.City,
    DownOrderID: opts.DownOrderID,
    IDCard: opts.IDCard,
    Name: opts.Name,
    Phone: opts.Phone,
    ProductID: opts.ProductID,
    Province: opts.Province,
    ThirdPhone: ThirdPhone,
    Timestamp: timestamp,
    user_id: USER_ID,
  };

  // NumberId, NumberPoolId, SkuID 不参与签名
  const excludeFields = [];
  const sign = signMD5(signParams, SECRET, excludeFields);

  const body = new URLSearchParams();
  body.append('user_id', USER_ID);
  body.append('Timestamp', String(timestamp));
  body.append('Name', opts.Name);
  body.append('Phone', opts.Phone);
  body.append('IDCard', opts.IDCard);
  body.append('Province', opts.Province);
  body.append('City', opts.City);
  body.append('Area', opts.Area);
  body.append('Address', opts.Address);
  body.append('ProductID', String(opts.ProductID));
  body.append('DownOrderID', opts.DownOrderID);
  body.append('ThirdPhone', ThirdPhone);
  body.append('user_sign', sign);

  // 选号相关字段（不参与签名）
  if (opts.NumberId) body.append('NumberId', opts.NumberId);
  if (opts.NumberPoolId) body.append('NumberPoolId', opts.NumberPoolId);
  if (opts.SkuID) body.append('SkuID', String(opts.SkuID));

  const res = await safeFetch(`${API_BASE}/order/ApiToOrder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  return data; // { code, message, errs }
}

// ============================================================
//  3. 订单查询 GetOrderInfo
// ============================================================

/**
 * 查询订单状态
 * @param {string} downOrderID - 下游订单ID
 * @returns {Promise<Object>}
 */
async function queryOrder(downOrderID) {
  const timestamp = getTimestamp();
  const params = {
    DownOrderID: downOrderID,
    Timestamp: timestamp,
    user_id: USER_ID,
  };
  const sign = signMD5(params, SECRET);
  params.user_sign = sign;

  const body = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => body.append(k, String(v)));

  const res = await safeFetch(`${API_BASE}/order/GetOrderInfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  return data; // { code, data, message, errs }
}

// ============================================================
//  4. 选号 PickNumber
// ============================================================

/**
 * 获取可选号码
 * @param {Object} opts
 * @param {number} opts.prodID - 商品ID
 * @param {string} [opts.province=''] - 省（numberSel=2时必填）
 * @param {string} [opts.city=''] - 市（numberSel=2时必填）
 * @param {string} [opts.searchValue=''] - 查询关键字2-4位数字
 * @returns {Promise<Array>}
 */
async function pickNumber(opts) {
  const timestamp = getTimestamp();
  const province = opts.province || '';
  const city = opts.city || '';
  const searchValue = opts.searchValue || '';

  const signParams = {
    city: city,
    prodID: opts.prodID,
    province: province,
    searchCategory: '3',
    searchValue: searchValue,
    Timestamp: timestamp,
    user_id: USER_ID,
  };
  const sign = signMD5(signParams, SECRET);

  const body = new URLSearchParams();
  body.append('user_id', USER_ID);
  body.append('Timestamp', String(timestamp));
  body.append('prodID', String(opts.prodID));
  body.append('province', province);
  body.append('city', city);
  body.append('searchValue', searchValue);
  body.append('user_sign', sign);

  const res = await safeFetch(`${API_BASE}/order/PickNumber`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`选号失败: ${data.message || '未知错误'} (code: ${data.code})`);
  }
  return data.data || [];
}

// ============================================================
//  工具函数
// ============================================================

function analyzeProducts(products) {
  const stats = {
    total: products.length,
    byOperator: {},
    byArea: {},
    byBackMoneyType: {},
    onSale: 0,
    offSale: 0
  };
  products.forEach(p => {
    stats.byOperator[p.operator] = (stats.byOperator[p.operator] || 0) + 1;
    stats.byBackMoneyType[p.backMoneyType] = (stats.byBackMoneyType[p.backMoneyType] || 0) + 1;
    if (p.flag) stats.onSale++; else stats.offSale++;
    if (p.area) stats.byArea[p.area] = (stats.byArea[p.area] || 0) + 1;
  });
  return stats;
}

module.exports = {
  getProducts, fetchProducts, analyzeProducts,
  placeOrder, queryOrder, pickNumber,
  signMD5, getTimestamp, USER_ID, SECRET,
};
