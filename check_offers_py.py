import psycopg2

def main():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/dealhunter")
    cur = conn.cursor()
    
    cur.execute("""
        SELECT o.id, o.url, o.price, o."updatedAt", p.name as product_name, s.name as store_name
        FROM offers o
        JOIN products p ON o."productId" = p.id
        JOIN stores s ON o."storeId" = s.id
        WHERE s.slug = 'mercado-libre-mx'
        ORDER BY o."updatedAt" DESC
        LIMIT 10
    """)
    rows = cur.fetchall()
    print("--- RECENT MERCADO LIBRE OFFERS ---")
    for r in rows:
        print(f"[{r[2]} MXN] {r[4]} \n  URL: {r[1]}")
        
    print("\n--- SAMPLE OFFERS FROM OTHER STORES ---")
    cur.execute("""
        SELECT s.slug, s.name, p.name, o.price, o.url
        FROM offers o
        JOIN products p ON o."productId" = p.id
        JOIN stores s ON o."storeId" = s.id
        WHERE o.availability = true
        ORDER BY o."updatedAt" DESC
        LIMIT 15
    """)
    for r in cur.fetchall():
        print(f"[{r[0]}] {r[2]} -> {r[3]} MXN \n  URL: {r[4]}")
        
    conn.close()

if __name__ == '__main__':
    main()
