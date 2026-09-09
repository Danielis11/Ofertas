async function main() {
  // Let's check offers across different stores and test their URLs
  const stores = ['mercado-libre-mx', 'amazon-mx', 'elektra-mx', 'doto-mx', 'liverpool-mx', 'walmart-mx', 'costco-mx'];

  for (const storeSlug of stores) {
    const res = await fetch(`http://localhost:3000/api/v1/search?storeSlug=${storeSlug}&limit=5`);
    const d = await res.json();
    console.log(`\n=== STORE: ${storeSlug} (Total: ${d.pagination?.total}) ===`);
    for (const item of d.data) {
      const url = item.offer.url;
      const name = item.offer.product?.name;
      const price = item.offer.price;
      const score = item.score;
      console.log(`[Score ${score}] $${price} | ${name}`);
      console.log(`   URL: ${url}`);
    }
  }
}

main().catch(console.error);
