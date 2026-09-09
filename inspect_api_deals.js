async function main() {
  console.log('--- ELEKTRA SCRAPED OFFERS ---');
  let res = await fetch('http://localhost:3000/api/v1/search?storeSlug=elektra-mx&limit=5');
  let d = await res.json();
  d.data.forEach(x => console.log(`[Elektra] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));

  console.log('\n--- DOTO SCRAPED OFFERS ---');
  res = await fetch('http://localhost:3000/api/v1/search?storeSlug=doto-mx&limit=5');
  d = await res.json();
  d.data.forEach(x => console.log(`[Doto] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));

  console.log('\n--- LIVERPOOL SCRAPED OFFERS ---');
  res = await fetch('http://localhost:3000/api/v1/search?storeSlug=liverpool-mx&limit=5');
  d = await res.json();
  d.data.forEach(x => console.log(`[Liverpool] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));

  console.log('\n--- PALACIO DE HIERRO SCRAPED OFFERS ---');
  res = await fetch('http://localhost:3000/api/v1/search?storeSlug=palacio-mx&limit=5');
  d = await res.json();
  d.data.forEach(x => console.log(`[Palacio] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));

  console.log('\n--- WALMART SCRAPED OFFERS ---');
  res = await fetch('http://localhost:3000/api/v1/search?storeSlug=walmart-mx&limit=5');
  d = await res.json();
  d.data.forEach(x => console.log(`[Walmart] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));

  console.log('\n--- COSTCO SCRAPED OFFERS ---');
  res = await fetch('http://localhost:3000/api/v1/search?storeSlug=costco-mx&limit=5');
  d = await res.json();
  d.data.forEach(x => console.log(`[Costco] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));

  console.log('\n--- AMAZON SCRAPED OFFERS ---');
  res = await fetch('http://localhost:3000/api/v1/search?storeSlug=amazon-mx&limit=5');
  d = await res.json();
  d.data.forEach(x => console.log(`[Amazon] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));

  console.log('\n--- MERCADO LIBRE REAL OFFERS ---');
  // Check ML offers that were recently inserted
  res = await fetch('http://localhost:3000/api/v1/search?storeSlug=mercado-libre-mx&sortBy=newest&limit=10');
  d = await res.json();
  d.data.forEach(x => console.log(`[ML Newest] ${x.offer.product?.name} -> $${x.offer.price}\n  URL: ${x.offer.url}`));
}

main().catch(console.error);
