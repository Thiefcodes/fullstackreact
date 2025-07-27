import React from 'react';
import ProductCard from './ProductCard';

const ProductList = ({ title, products, onAddToCart }) => {
  return (
    <section className="product-list-section">
      <h2>{title}</h2>
      <div className="product-grid">
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={onAddToCart} 
          />
        ))}
      </div>
    </section>
  );
};

export default ProductList;