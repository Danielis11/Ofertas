const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/dealhunter?schema=public' });
  await client.connect();

  console.log('--- RECENT MERCADO LIBRE OFFERS ---');
  const mlRes = await client.query(`
    SELECT o.id, o.url, o.price, o.availability, o."updatedAt", p.name as product_name, s.name as store_name
    FROM offers o
    JOIN products p ON o."productId" = p.id
    JOIN stores s ON o."storeId" = s.id
    WHERE s.slug = 'mercado-libre-mx'
    ORDER BY o."updatedAt" DESC
    LIMIT 10
  `);
  mlRes.rows.forEach(r => console.log(`[${r.price} MXN] ${r.product_name} -> ${r.url}`));

  console.log('\n--- HOW MANY TOTAL OFFERS AND FAKE/SEED OFFERS? ---');
  const countRes = await client.query(`
    SELECT s.slug, s.name, COUNT(o.id) as count
    FROM stores s
    LEFT JOIN offers o ON o."storeId" = s.id
    GROUP BY s.id, s.slug, s.name
    ORDER BY count DESC
    LIMIT 15
  `);
  console.table(countRes.rows);

  await client.end();
}

main().catch(console.error);
