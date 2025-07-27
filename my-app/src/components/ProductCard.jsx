import React from 'react';
import { FiHeart } from 'react-icons/fi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'; // Using a different star for filled/empty

const ProductCard = ({ product, onAddToCart }) => {
  const { product_name, price, image_urls, category } = product;
  const rating = 5; // Placeholder rating

  return (
    // This div handles the click event for adding to cart
    <div className="product-card" onClick={() => onAddToCart(product)}>
      <div className="product-image-container">
        <img src={image_urls} alt={product_name} />
        <button className="wishlist-button" onClick={(e) => {
          e.stopPropagation(); // Prevents card's onClick from firing
          console.log(`Added ${product_name} to wishlist!`);
        }}>
          <FiHeart />
        </button>
      </div>
      <div className="product-info-static">
         <h3>{product_name}</h3>
      </div>
      
      {/* This div contains the details that appear on hover */}
      <div className="product-hover-details">
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            i < rating ? <AiFillStar key={i} /> : <AiOutlineStar key={i} />
          ))}
        </div>
        <p className="product-category">{category}</p>
        <p className="product-price">${price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ProductCard;