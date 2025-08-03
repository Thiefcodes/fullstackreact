import React, { useEffect, useState } from 'react';

export default function AdminScan() {
  const [products, setProducts] = useState([]);
  const [scanningId, setScanningId] = useState(null);
  const [scanAll, setScanAll] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5000/api/marketplaceproducts/untagged')

      .then(r => r.json())
      .then(setProducts);
  }, []);

  // Helper to scan a single product
  const scanProduct = async (product) => {
    setScanningId(product.id);
    const res = await fetch('http://localhost:5000/api/ai-scan', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ image_url: product.image_url[0] })
    });
    const aiData = await res.json();

    // Optionally, show prompts for manual editing if not using scan all
    let category = aiData.category;
    let tags = aiData.tags?.join(', ') || "";
    let color = aiData.color;
 
    await fetch('http://localhost:5000/api/clothestag', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        product_id: product.id,
        category,
        tags: tags.split(',').map(t => t.trim()),
        color,
        image_url: product.image_url[0],
        ai_analysis_json: aiData
      })
    });
    setScanningId(null);
    setProducts(products => products.filter(p => p.id !== product.id));
  };

  // Scan all function
  const handleScanAll = async () => {
    setScanAll(true);
    setScanProgress(0);
    for (let i = 0; i < products.length; i++) {
      await scanProduct(products[i]);
      setScanProgress(i + 1);
    }
    setScanAll(false);
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>Admin Clothing Scanner</h2>
      <button
        onClick={handleScanAll}
        disabled={scanAll || products.length === 0 || scanningId}
        style={{ marginBottom: 18, fontWeight: 600, padding: "10px 22px", borderRadius: 8 }}
      >
        {scanAll
          ? `Scanning All... (${scanProgress}/${products.length})`
          : "Scan All Untagged"
        }
      </button>
      <ul>
        {products.length === 0 && <li>All products are tagged!</li>}
        {products.map(product =>
          <li key={product.id} style={{ margin: 24, border: '1px solid #eee', padding: 18, borderRadius: 8 }}>
            <img src={product.image_url[0]} alt={product.title} style={{ height: 120 }} />
            <div><b>{product.title}</b></div>
            <div>Seller: {product.seller_id}</div>
            <button
              onClick={() => scanProduct(product)}
              disabled={scanningId === product.id || scanAll}
            >
              {scanningId === product.id ? "Scanning..." : "Scan & Tag"}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
