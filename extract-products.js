/**
 * Complete Product Inventory Extraction Script
 * Extracts all product data from hattemanden.dk WooCommerce store
 *
 * Usage: node extract-products.js
 * Output:
 *   - product-inventory.json (complete structured data)
 *   - product-inventory.md (markdown summary table)
 */

require('dotenv').config();
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const fs = require('fs');
const path = require('path');

// WooCommerce API client
const wooCommerce = new WooCommerceRestApi({
  url: process.env.WC_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET,
  version: 'wc/v3'
});

// Output directory
const OUTPUT_DIR = path.join(__dirname, 'exports');

// Progress logging
function log(msg) {
  console.log(`[${new Date().toISOString().substr(11, 8)}] ${msg}`);
}

// Fetch all pages of a resource
async function fetchAllPages(endpoint, params = {}) {
  const allItems = [];
  let page = 1;
  let totalPages = 1;

  params.per_page = 100; // Max allowed

  while (page <= totalPages) {
    params.page = page;
    log(`  Fetching ${endpoint} page ${page}/${totalPages}...`);

    try {
      const response = await wooCommerce.get(endpoint, params);
      allItems.push(...response.data);

      totalPages = parseInt(response.headers['x-wp-totalpages']) || 1;
      page++;

      // Small delay to avoid rate limiting
      if (page <= totalPages) {
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint} page ${page}:`, error.message);
      break;
    }
  }

  return allItems;
}

// Build category tree with full paths
function buildCategoryTree(categories) {
  const catMap = {};
  categories.forEach(cat => {
    catMap[cat.id] = cat;
  });

  // Build full path for each category
  function getFullPath(catId) {
    const cat = catMap[catId];
    if (!cat) return 'Uncategorized';

    if (cat.parent === 0) {
      return cat.name;
    }

    return getFullPath(cat.parent) + ' > ' + cat.name;
  }

  categories.forEach(cat => {
    cat.fullPath = getFullPath(cat.id);
  });

  return { categories, catMap };
}

// Main extraction function
async function extractProductInventory() {
  log('Starting product inventory extraction...');
  log(`Store: ${process.env.WC_URL}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Test connection
  log('Testing API connection...');
  try {
    await wooCommerce.get('');
    log('API connection successful!');
  } catch (error) {
    console.error('Failed to connect to WooCommerce API:', error.message);
    process.exit(1);
  }

  // 2. Fetch all categories
  log('Fetching product categories...');
  const rawCategories = await fetchAllPages('products/categories');
  const { categories, catMap } = buildCategoryTree(rawCategories);
  log(`  Found ${categories.length} categories`);

  // 3. Fetch all tags
  log('Fetching product tags...');
  const tags = await fetchAllPages('products/tags');
  const tagMap = {};
  tags.forEach(tag => { tagMap[tag.id] = tag; });
  log(`  Found ${tags.length} tags`);

  // 4. Fetch all products
  log('Fetching all products...');
  const products = await fetchAllPages('products', { status: 'any' });
  log(`  Found ${products.length} products`);

  // 5. Fetch variations for variable products
  log('Fetching product variations...');
  const variableProducts = products.filter(p => p.type === 'variable');
  for (let i = 0; i < variableProducts.length; i++) {
    const product = variableProducts[i];
    log(`  Fetching variations for "${product.name}" (${i + 1}/${variableProducts.length})...`);

    try {
      const variations = await fetchAllPages(`products/${product.id}/variations`);
      product.variationDetails = variations;
      product.variationCount = variations.length;
    } catch (error) {
      console.error(`  Error fetching variations for product ${product.id}:`, error.message);
      product.variationDetails = [];
      product.variationCount = 0;
    }

    // Small delay
    await new Promise(r => setTimeout(r, 100));
  }

  // 6. Fetch all orders for sales data
  log('Fetching all orders...');
  const orders = await fetchAllPages('orders', { status: 'any' });
  log(`  Found ${orders.length} orders`);

  // 7. Calculate per-product sales data
  log('Calculating per-product sales data...');
  const productSalesData = {};

  orders.forEach(order => {
    // Only count completed/processing orders for revenue
    const countForRevenue = ['completed', 'processing'].includes(order.status);

    order.line_items.forEach(item => {
      const productId = item.product_id;

      if (!productSalesData[productId]) {
        productSalesData[productId] = {
          unitsSold: 0,
          totalRevenue: 0,
          orderCount: 0,
          lastOrderDate: null,
          orderIds: []
        };
      }

      const data = productSalesData[productId];

      if (countForRevenue) {
        data.unitsSold += item.quantity;
        data.totalRevenue += parseFloat(item.total);
        data.orderCount++;
        data.orderIds.push(order.id);
      }

      // Track last order date regardless of status
      const orderDate = new Date(order.date_created);
      if (!data.lastOrderDate || orderDate > new Date(data.lastOrderDate)) {
        data.lastOrderDate = order.date_created;
      }
    });
  });

  // 8. Build comprehensive product data
  log('Building comprehensive product data...');

  // Identify "Hatte" categories
  const hatteCategories = new Set();
  categories.forEach(cat => {
    if (cat.fullPath.toLowerCase().includes('hat') ||
        cat.fullPath.toLowerCase().includes('kasketter') ||
        cat.fullPath.toLowerCase().includes('hatte')) {
      hatteCategories.add(cat.id);
    }
  });

  const productData = products.map(product => {
    // Get category info
    const productCategories = product.categories || [];
    const categoryPaths = productCategories.map(c => {
      const cat = catMap[c.id];
      return cat ? cat.fullPath : c.name;
    });

    // Check if product is in Hatte category
    const isHatteProduct = productCategories.some(c =>
      hatteCategories.has(c.id) ||
      (catMap[c.id] && catMap[c.id].fullPath.toLowerCase().includes('hat'))
    );

    // Get tag names
    const productTags = (product.tags || []).map(t => {
      const tag = tagMap[t.id];
      return tag ? tag.name : t.name;
    });

    // Get sales data
    const sales = productSalesData[product.id] || {
      unitsSold: 0,
      totalRevenue: 0,
      orderCount: 0,
      lastOrderDate: null,
      orderIds: []
    };

    // Get variation details
    let variationInfo = null;
    if (product.type === 'variable' && product.variationDetails) {
      const sizeOptions = new Set();
      const colorOptions = new Set();

      product.variationDetails.forEach(v => {
        v.attributes.forEach(attr => {
          const name = attr.name.toLowerCase();
          if (name.includes('size') || name.includes('størrelse') || name.includes('str')) {
            sizeOptions.add(attr.option);
          } else if (name.includes('color') || name.includes('farve')) {
            colorOptions.add(attr.option);
          }
        });
      });

      variationInfo = {
        count: product.variationDetails.length,
        sizes: Array.from(sizeOptions),
        colors: Array.from(colorOptions),
        variations: product.variationDetails.map(v => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          salePrice: v.sale_price,
          stockStatus: v.stock_status,
          stockQuantity: v.stock_quantity,
          attributes: v.attributes
        }))
      };
    }

    // Get all images
    const images = (product.images || []).map(img => ({
      id: img.id,
      src: img.src,
      name: img.name,
      alt: img.alt
    }));

    return {
      // Basic info
      id: product.id,
      name: product.name,
      sku: product.sku || '',
      permalink: product.permalink,

      // Category info
      categories: categoryPaths,
      categoryIds: productCategories.map(c => c.id),
      isHatteProduct,
      flaggedForRemoval: !isHatteProduct && categoryPaths.length > 0,

      // Pricing
      price: parseFloat(product.price) || 0,
      regularPrice: parseFloat(product.regular_price) || 0,
      salePrice: product.sale_price ? parseFloat(product.sale_price) : null,
      onSale: product.on_sale,

      // Stock
      stockStatus: product.stock_status,
      stockQuantity: product.stock_quantity,
      manageStock: product.manage_stock,

      // Product type
      type: product.type,
      variationCount: variationInfo ? variationInfo.count : 0,
      variations: variationInfo,

      // Tags
      tags: productTags,

      // Content
      shortDescription: product.short_description,
      description: product.description,

      // Images
      featuredImage: images.length > 0 ? images[0].src : null,
      images: images,

      // Sales data
      unitsSold: sales.unitsSold,
      totalRevenue: Math.round(sales.totalRevenue * 100) / 100,
      orderCount: sales.orderCount,
      lastOrderDate: sales.lastOrderDate,

      // Dates
      dateCreated: product.date_created,
      dateModified: product.date_modified,

      // Status
      status: product.status
    };
  });

  // Sort by revenue (highest first)
  productData.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // 9. Build category summary
  log('Building category summary...');
  const categorySummary = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    parent: cat.parent,
    fullPath: cat.fullPath,
    productCount: cat.count,
    isHatteCategory: hatteCategories.has(cat.id)
  }));

  // 10. Build tag summary
  log('Building tag summary...');
  const tagSummary = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    productCount: tag.count
  }));

  // 11. Calculate order summary
  log('Calculating order summary...');
  const completedOrders = orders.filter(o => ['completed', 'processing'].includes(o.status));
  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  // Orders by year
  const ordersByYear = {};
  completedOrders.forEach(order => {
    const year = new Date(order.date_created).getFullYear();
    if (!ordersByYear[year]) {
      ordersByYear[year] = { count: 0, revenue: 0 };
    }
    ordersByYear[year].count++;
    ordersByYear[year].revenue += parseFloat(order.total);
  });

  const orderSummary = {
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageOrderValue: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length * 100) / 100 : 0,
    ordersByYear: Object.entries(ordersByYear)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, data]) => ({
        year: parseInt(year),
        orders: data.count,
        revenue: Math.round(data.revenue * 100) / 100
      }))
  };

  // 12. Identify products with zero sales
  const zeroSalesProducts = productData.filter(p => p.unitsSold === 0 && p.status === 'publish');

  // 13. Top 20 products by revenue
  const top20ByRevenue = productData.slice(0, 20);

  // 14. Products flagged for removal (not in Hatte category)
  const flaggedProducts = productData.filter(p => p.flaggedForRemoval);

  // 15. Compile final export
  const exportData = {
    extractionDate: new Date().toISOString(),
    storeUrl: process.env.WC_URL,

    summary: {
      totalProducts: productData.length,
      publishedProducts: productData.filter(p => p.status === 'publish').length,
      simpleProducts: productData.filter(p => p.type === 'simple').length,
      variableProducts: productData.filter(p => p.type === 'variable').length,
      totalVariations: productData.reduce((sum, p) => sum + (p.variationCount || 0), 0),
      productsWithSales: productData.filter(p => p.unitsSold > 0).length,
      productsWithZeroSales: zeroSalesProducts.length,
      productsInHatteCategory: productData.filter(p => p.isHatteProduct).length,
      productsFlaggedForRemoval: flaggedProducts.length,
      totalCategories: categories.length,
      totalTags: tags.length
    },

    orderSummary,

    categoryTree: categorySummary,
    tagList: tagSummary,

    products: productData,

    top20ByRevenue: top20ByRevenue.map(p => ({
      id: p.id,
      name: p.name,
      category: p.categories[0] || 'Uncategorized',
      price: p.price,
      unitsSold: p.unitsSold,
      totalRevenue: p.totalRevenue,
      lastOrderDate: p.lastOrderDate,
      status: p.status
    })),

    zeroSalesProducts: zeroSalesProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.categories[0] || 'Uncategorized',
      price: p.price,
      dateCreated: p.dateCreated,
      status: p.status
    })),

    flaggedForRemoval: flaggedProducts.map(p => ({
      id: p.id,
      name: p.name,
      categories: p.categories,
      reason: 'Not in Hatte category tree'
    })),

    allImageUrls: productData.flatMap(p => p.images.map(img => ({
      productId: p.id,
      productName: p.name,
      imageUrl: img.src
    })))
  };

  // 16. Write JSON output
  const jsonPath = path.join(OUTPUT_DIR, 'product-inventory.json');
  log(`Writing JSON to ${jsonPath}...`);
  fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2));

  // 17. Generate Markdown report
  log('Generating Markdown report...');

  let markdown = `# hattemanden.dk Product Inventory Report

**Extracted:** ${new Date().toLocaleString('da-DK')}
**Store:** ${process.env.WC_URL}

---

## Summary

| Metric | Value |
|--------|-------|
| Total Products | ${exportData.summary.totalProducts} |
| Published Products | ${exportData.summary.publishedProducts} |
| Simple Products | ${exportData.summary.simpleProducts} |
| Variable Products | ${exportData.summary.variableProducts} |
| Total Variations | ${exportData.summary.totalVariations} |
| Products with Sales | ${exportData.summary.productsWithSales} |
| Products with Zero Sales | ${exportData.summary.productsWithZeroSales} |
| Products in "Hatte" Category | ${exportData.summary.productsInHatteCategory} |
| **Flagged for Removal** | **${exportData.summary.productsFlaggedForRemoval}** |

---

## Order Summary

| Metric | Value |
|--------|-------|
| Total Orders (all time) | ${orderSummary.totalOrders} |
| Completed Orders | ${orderSummary.completedOrders} |
| **Total Revenue** | **${orderSummary.totalRevenue.toLocaleString('da-DK')} DKK** |
| Average Order Value | ${orderSummary.averageOrderValue.toLocaleString('da-DK')} DKK |

### Revenue by Year

| Year | Orders | Revenue (DKK) |
|------|--------|---------------|
${orderSummary.ordersByYear.map(y => `| ${y.year} | ${y.orders} | ${y.revenue.toLocaleString('da-DK')} |`).join('\n')}

---

## Category Tree

| Category | Product Count | In Hatte Tree |
|----------|---------------|---------------|
${categorySummary.map(c => `| ${c.fullPath} | ${c.productCount} | ${c.isHatteCategory ? 'Yes' : '**NO**'} |`).join('\n')}

---

## Product Tags

| Tag | Product Count |
|-----|---------------|
${tagSummary.map(t => `| ${t.name} | ${t.productCount} |`).join('\n')}

---

## Top 20 Products by Revenue

| Rank | Name | Category | Price (DKK) | Units Sold | Revenue (DKK) | Last Sold | Status |
|------|------|----------|-------------|------------|---------------|-----------|--------|
${top20ByRevenue.map((p, i) => `| ${i + 1} | ${p.name} | ${p.categories[0] || 'N/A'} | ${p.price.toLocaleString('da-DK')} | ${p.unitsSold} | ${p.totalRevenue.toLocaleString('da-DK')} | ${p.lastOrderDate ? new Date(p.lastOrderDate).toLocaleDateString('da-DK') : 'Never'} | ${p.status} |`).join('\n')}

---

## Products with ZERO Sales (Published)

Total: ${zeroSalesProducts.length} products

| Name | Category | Price (DKK) | Created | Status |
|------|----------|-------------|---------|--------|
${zeroSalesProducts.map(p => `| ${p.name} | ${p.categories[0] || 'N/A'} | ${p.price.toLocaleString('da-DK')} | ${new Date(p.dateCreated).toLocaleDateString('da-DK')} | ${p.status} |`).join('\n')}

---

## Flagged for Removal (NOT in "Hatte" Category)

**Total: ${flaggedProducts.length} products**

These products are NOT in the Hatte category tree and may need to be removed or recategorized:

| Name | Categories | Price (DKK) | Units Sold | Revenue (DKK) |
|------|------------|-------------|------------|---------------|
${flaggedProducts.map(p => `| ${p.name} | ${p.categories.join(', ') || 'Uncategorized'} | ${p.price.toLocaleString('da-DK')} | ${p.unitsSold} | ${p.totalRevenue.toLocaleString('da-DK')} |`).join('\n')}

---

## Complete Product List (Sorted by Revenue)

| Name | Category | Price (DKK) | Units Sold | Revenue (DKK) | Last Sold | Status |
|------|----------|-------------|------------|---------------|-----------|--------|
${productData.map(p => `| ${p.name} | ${p.categories[0] || 'N/A'} | ${p.price.toLocaleString('da-DK')} | ${p.unitsSold} | ${p.totalRevenue.toLocaleString('da-DK')} | ${p.lastOrderDate ? new Date(p.lastOrderDate).toLocaleDateString('da-DK') : 'Never'} | ${p.status} |`).join('\n')}

---

## All Product Images

Total unique images: ${exportData.allImageUrls.length}

*Full image list available in JSON export.*

---

*Report generated by extract-products.js*
`;

  const mdPath = path.join(OUTPUT_DIR, 'product-inventory.md');
  log(`Writing Markdown to ${mdPath}...`);
  fs.writeFileSync(mdPath, markdown);

  // 18. Summary
  log('');
  log('='.repeat(60));
  log('EXTRACTION COMPLETE');
  log('='.repeat(60));
  log(`Products extracted: ${productData.length}`);
  log(`Variations extracted: ${exportData.summary.totalVariations}`);
  log(`Orders processed: ${orders.length}`);
  log(`Categories: ${categories.length}`);
  log(`Tags: ${tags.length}`);
  log('');
  log(`Total Revenue: ${orderSummary.totalRevenue.toLocaleString('da-DK')} DKK`);
  log(`Products flagged for removal: ${flaggedProducts.length}`);
  log(`Products with zero sales: ${zeroSalesProducts.length}`);
  log('');
  log('Output files:');
  log(`  JSON: ${jsonPath}`);
  log(`  Markdown: ${mdPath}`);
  log('='.repeat(60));
}

// Run extraction
extractProductInventory().catch(error => {
  console.error('Extraction failed:', error);
  process.exit(1);
});
