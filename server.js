require('newrelic');
const express = require('express');
const app = express();
const port = 4000;
const { Pool, Client } = require('pg');
const querystring = require('querystring');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'kornelija123',
  port: 5432,
})


let cache = {};


// gets a list of products with page and count query params
app.get('/products', async (req, res) => {

  let page = req.query.page || 1;
  let count = req.query.count || 5;

  let beginingItemInThePage = (page - 1) * count;


  const productsQuery = `SELECT p.id,
                          p.name,
                          slogan,
                          description,
                          c.name as category,
                          default_price
                        FROM sdc.products p
                        JOIN sdc.categories c on c.id = p.category_id
                        WHERE p.id > ` + beginingItemInThePage + `
                        ORDER BY p.id asc
                        LIMIT ` + count;

  const result = await pool.query(productsQuery);
  res.send(result.rows);

})

// gets single product by id
app.get('/products/:product_id', async (req, res) => {

  let productId = req.params.product_id;

  let productByIDQuery = `SELECT p.id,
                            p.name,
                            slogan,
                            description,
                            c.name as category,
                            default_price
                          FROM sdc.products p
                          JOIN sdc.categories c on c.id = p.category_id
                          WHERE p.id = ` + productId;

   let productFeaturesByIdQuery = `SELECT feature,
                                    value
                                  FROM sdc.features f
                                  JOIN sdc.product_feature_map pf on f.id = pf.feature_id
                                  WHERE pf.product_id = ` + productId;

  const productsResult = await pool.query(productByIDQuery);
  const featureResult = await pool.query(productFeaturesByIdQuery);

  let productWithFeatures = {
    id: productsResult.rows[0].id,
    name: productsResult.rows[0].name,
    slogan: productsResult.rows[0].slogan,
    description: productsResult.rows[0].description,
    category: productsResult.rows[0].category,
    default_price: productsResult.rows[0].default_price,
    features: featureResult.rows
  }

  res.send(productWithFeatures);

})

// gets product styles by product id
app.get('/products/:product_id/styles', async (req, res) => {

  let productId = req.params.product_id;

  let productStylesByIdQuery = `SELECT id as style_id,
                                name,
                                original_price,
                                sale_price,
                                default_style as "default?"
                              FROM sdc.styles s
                              JOIN sdc.product_style_map ps on ps.style_id = s.id
                              WHERE ps.product_id = ` + productId;

  let productStylePhotosQuery = `SELECT sp.style_id,
                                  thumbnail_url,
                                  url
                                FROM sdc.style_photos sp
                                JOIN sdc.product_style_map ps on ps.style_id = sp.style_id
                                WHERE ps.product_id = ` + productId;

  let productStyleSkusQuery = `SELECT ps.style_id,
                                sku_id,
                                quantity,
                                size
                              FROM sdc.skus s
                              JOIN sdc.styles_skus_map ss on ss.sku_id = s.id
                              JOIN sdc.product_style_map ps on ss.style_id = ps.style_id
                              WHERE ps.product_id = ` + productId;

  let productStylesById;
  let productStylePhotos;
  let productStyleSkus;


  if (true || cache[productId] === undefined) {
    /// run queries
    productStylesById = await pool.query(productStylesByIdQuery);
    productStylePhotos = await pool.query(productStylePhotosQuery);
    productStyleSkus = await pool.query(productStyleSkusQuery);

    cache[productId] = {
      productStylesById: productStylesById,
      productStylePhotos: productStylePhotos,
      productStyleSkus: productStyleSkus
    }

  } else {
    productStylesById = cache[productId].productStylesById;
    productStylePhotos = cache[productId].productStylePhotos;
    productStyleSkus = cache[productId].productStyleSkus;
  }


  // then format data
    let productWithPhotosAndSkus = {
      product_id: productId,
      results : productStylesById.rows,
    };

  //filtering amd formating data according to style id
  productWithPhotosAndSkus.results.forEach((style) => {
    // adding photos property to productWithPhotosAndSkus and grouping photos to each style by style id
    style.photos = productStylePhotos.rows.filter((photo) => {
      return photo.style_id === style.style_id;
    });


    // initializing skus object to store each sku_id as object key that holds size and quantity properties
    let skus = {};
    // adding size and quantity properties to skus property which key name matches each sku_id
    productStyleSkus.rows.forEach((sku) => {
      if (sku.style_id === style.style_id) {
        skus[sku.sku_id] = {
          quantity: sku.quantity,
          size: sku.size
        };
      }
    });

    style['skus'] = skus;
  });

  res.send(productWithPhotosAndSkus);
})

// gets related products by product id
app.get('/products/:product_id/related', async (req, res) => {

  let productId = req.params.product_id;

  let relatedProductsByIdQuery = `SELECT current_product_id,
                                  related_product_id
                                FROM sdc.related_products
                                WHERE current_product_id = ` + productId;

  const relatedProducts = await pool.query(relatedProductsByIdQuery);

  let relatedProductIds = [];

  relatedProducts.rows.forEach((product) =>{
    relatedProductIds.push(product.related_product_id);
  });

  res.send(relatedProductIds);
})

app.listen(port, () => {
  console.log(`Product-API app listening at http://localhost:${port}`)
})


