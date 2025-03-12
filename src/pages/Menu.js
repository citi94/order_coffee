import React, { useState, useEffect } from 'react';
import CoffeeProductCard from '../components/CoffeeProductCard';
import { getMenuItems } from '../utils/api';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
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

        // First, identify coffee products with their variants
        const processedItems = data.products
          // Sort by name
          .sort((a, b) => a.name.localeCompare(b.name))
          // Filter only keep variants in the data structure
          .map(item => {
            // If the item doesn't have any variants, but it's a coffee, include it
            if (!item.variants || item.variants.length === 0) {
              if (item.category && item.category.name === 'Coffee') {
                return item;
              }
              return null;
            }
            
            // Keep if it's coffee
            if (item.category && item.category.name === 'Coffee') {
              return item;
            }
            
            return null;
          })
          .filter(item => item !== null);
        
        setMenuItems(processedItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu items. Please try again later.');
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <CoffeeProductCard key={item.uuid} product={item} />
        ))}
      </div>
      
      {/* If no items are displayed */}
      {menuItems.length === 0 && (
        <div className="text-center py-10">
          <p>No coffee products available.</p>
        </div>
      )}
    </div>
  );
};

export default Menu;