const express = require('express');
const app = express();
const port = 3000;
const { Pool, Client } = require('pg');
const querystring = require('querystring');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'kornelija123',
  port: 5432,
})




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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


