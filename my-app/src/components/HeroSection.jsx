import React from 'react';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-main">
        <h2>NEW ARRIVALS</h2>
        <button>View Products</button>
      </div>
      <div className="hero-side">
        <div className="hero-side-top">
          <h3>Shop Men's Tees</h3>
          <button>View Products</button>
        </div>
        <div className="hero-side-bottom">
          <h3>On Sale</h3>
          <button>View Products</button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;