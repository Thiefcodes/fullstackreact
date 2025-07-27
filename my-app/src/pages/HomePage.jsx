import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import HeroSection from '../components/HeroSection';
import ProductList from '../components/ProductList';
import '../index.css';

// Dummy data that matches your product table structure
const dummyProducts = [
  { id: 1, product_name: 'Recycled Blouse', price: 45.00, image_urls: 'https://i.imgur.com/Jz8qL6E.png', category: "Women's Shirts" },
  { id: 2, product_name: 'SS Black Tee', price: 25.00, image_urls: 'https://i.imgur.com/Sdn7e1T.png', category: "Men's T-Shirts" },
  { id: 3, product_name: 'Sustainability Tee', price: 25.00, image_urls: 'https://i.imgur.com/L534wM7.png', category: "Men's T-Shirts" },
  { id: 4, product_name: 'Green Leaf Tee', price: 25.00, image_urls: 'https://i.imgur.com/zSOcT1C.png', category: "Men's T-Shirts" },
];

const HomePage = () => {
  const [products, setProducts] = useState(dummyProducts);

  // This is the function your teammate needs.
  // It takes the entire product object as an argument.
  const addToCart = (product) => {
    console.log('Adding to cart:', product.product_name, 'ID:', product.id);
    // Here, your teammate will add the logic to update the cart state/context.
    // For example:
    // setCartItems(prevItems => [...prevItems, product]);
    alert(`${product.product_name} added to cart!`);
  };

  // LATER: You can uncomment this to fetch from your actual backend
  /*
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchProducts();
  }, []);
  */

  return (
    <div className="homepage">
      <Header />
      <div className="main-content">
        <Sidebar />
        <main>
          <HeroSection />
          <ProductList 
            title="Best Sellers" 
            products={products} 
            onAddToCart={addToCart} // Pass the function down
          />
        </main>
      </div>
    </div>
  );
};

export default HomePage;