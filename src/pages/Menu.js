import React, { useState, useEffect } from 'react';
import CoffeeProductCard from '../components/CoffeeProductCard';
import ProductCard from '../components/ProductCard';
import { getMenuItems } from '../utils/api';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Coffee');
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

        // Process menu items
        const allItems = data.products.sort((a, b) => a.name.localeCompare(b.name));
        
        // Extract categories
        const categorySet = new Set();
        allItems.forEach(item => {
          const categoryName = item.category?.name || 'Other';
          categorySet.add(categoryName);
        });
        
        // Make sure Coffee is first, followed by other categories
        const sortedCategories = ['Coffee', ...Array.from(categorySet)
          .filter(cat => cat !== 'Coffee')
          .sort()];
        
        setMenuItems(allItems);
        setCategories(sortedCategories);
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
  const filteredItems = menuItems.filter(item => {
    const itemCategory = item.category?.name || 'Other';
    return itemCategory === selectedCategory;
  });

  // Common coffee drink types to prioritize
  const popularCoffees = [
    'Latte', 'Cappuccino', 'Flat White', 'Americano', 
    'Espresso', 'Mocha', 'Cortado', 'Macchiato'
  ];
  
  // Sort coffee items to prioritize popular drinks
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (selectedCategory === 'Coffee') {
      const aIsPopular = popularCoffees.some(coffee => 
        a.name.toLowerCase().includes(coffee.toLowerCase()));
      const bIsPopular = popularCoffees.some(coffee => 
        b.name.toLowerCase().includes(coffee.toLowerCase()));
      
      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;
    }
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
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
      <h1 className="text-3xl font-bold mb-2 text-center">Middle Street Coffee</h1>
      <p className="text-center mb-6">Order for takeaway</p>
      
      {/* Category tabs */}
      <div className="flex overflow-x-auto pb-4 mb-6 justify-center">
        {categories.map(category => (
          <button
            key={category}
            className={`whitespace-nowrap px-6 py-2 mx-1 rounded-full 
              ${selectedCategory === category 
                ? 'bg-black text-white' 
                : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedItems.map(item => {
          if (selectedCategory === 'Coffee') {
            return <CoffeeProductCard key={item.id || item.uuid} product={item} />;
          } else {
            return <ProductCard key={item.id || item.uuid} product={item} />;
          }
        })}
      </div>
      
      {/* Empty state */}
      {sortedItems.length === 0 && (
        <div className="text-center py-10">
          <p>No products available in this category.</p>
        </div>
      )}
    </div>
  );
};

export default Menu;