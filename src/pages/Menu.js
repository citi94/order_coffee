import React, { useState, useEffect } from 'react';
import CoffeeProductCard from '../components/CoffeeProductCard';
import ProductCard from '../components/ProductCard';
import { getMenuItems } from '../utils/api';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const data = await getMenuItems();
        
        if (!data || !data.products) {
          throw new Error('Invalid data received from API');
        }

        // Process menu items and extract categories
        const processedItems = data.products
          .sort((a, b) => a.name.localeCompare(b.name));
        
        const uniqueCategories = [...new Set(processedItems
          .filter(item => item.category)
          .map(item => item.category.name || 'Other'))
        ];
        
        setMenuItems(processedItems);
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu items. Please try again later.');
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Filter items by selected category
  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category && item.category.name === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Middle Street Coffee</h1>
      <p className="text-center mb-6">Order for takeaway</p>
      
      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex overflow-x-auto pb-4 mb-6">
          <button
            className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 ${
              selectedCategory === 'all' ? 'bg-black text-white' : 'bg-gray-200'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            All Items
          </button>
          
          {categories.map(category => (
            <button
              key={category}
              className={`whitespace-nowrap px-4 py-2 rounded-full mr-2 ${
                selectedCategory === category ? 'bg-black text-white' : 'bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          // Use CoffeeProductCard for coffee items, ProductCard for others
          if (item.category && item.category.name === 'Coffee') {
            return <CoffeeProductCard key={item.id || item.uuid} product={item} />;
          } else {
            return <ProductCard key={item.id || item.uuid} product={item} />;
          }
        })}
      </div>
      
      {/* If no items are displayed */}
      {filteredItems.length === 0 && (
        <div className="text-center py-10">
          <p>No products available in this category.</p>
        </div>
      )}
    </div>
  );
};

export default Menu;