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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


