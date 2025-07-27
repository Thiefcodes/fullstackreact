import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState({
    men: true,
    women: true,
    accessories: true,
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><a href="#">Shop All</a></li>
          <li className="collapsible">
            <div onClick={() => toggleMenu('men')}>
              <span>Shop Men's</span>
              {openMenus.men ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {openMenus.men && (
              <ul className="submenu">
                <li><a href="#">T-Shirts</a></li>
                <li><a href="#">Shirts & Polo Shirts</a></li>
                <li><a href="#">Shorts</a></li>
                <li><a href="#">Pants & Jeans</a></li>
                <li><a href="#">Outerwear</a></li>
              </ul>
            )}
          </li>
          <li className="collapsible">
            <div onClick={() => toggleMenu('women')}>
              <span>Shop Women's</span>
              {openMenus.women ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {openMenus.women && (
              <ul className="submenu">
                <li><a href="#">Blouses</a></li>
                <li><a href="#">Dresses</a></li>
                <li><a href="#">Skirts</a></li>
              </ul>
            )}
          </li>
          <li className="collapsible">
             <div onClick={() => toggleMenu('accessories')}>
              <span>Accessories</span>
              {openMenus.accessories ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {openMenus.accessories && (
              <ul className="submenu">
                <li><a href="#">Hats</a></li>
                <li><a href="#">Bags</a></li>
                <li><a href="#">Belts</a></li>
              </ul>
            )}
          </li>
          <li><a href="#">New Arrivals</a></li>
          <li className="sale-link"><a href="#">SALE</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;