import React, { useState, useEffect, useMemo } from 'react';
import { getMenuItems } from '../utils/api';
import CoffeeCard from '../components/CoffeeCard';
import CustomizationModal from '../components/CustomizationModal';
import AddOnCard from '../components/AddOnCard';

const Menu = () => {
  const [coffeeItems, setCoffeeItems] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCoffee, setSelectedCoffee] = useState(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Common coffee drinks to focus on
  const popularCoffees = useMemo(() => [
    'Latte', 'Cappuccino', 'Flat White', 'Americano', 
    'Espresso', 'Mocha', 'Cortado', 'Macchiato', 'Iced Latte'
  ], []);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const data = await getMenuItems();
        
        if (!data || !data.products) {
          throw new Error('Invalid data received from API');
        }

        // Process coffee items - focus on takeaway options
        const allCoffees = data.products.filter(item => {
          // Check if the item is in the Coffee category
          const isCoffee = item.category && item.category.name === 'Coffee';
          
          // Check if it's a takeaway variant or has takeaway options
          const hasTakeaway = item.name && (
            item.name.toLowerCase().includes('takeaway') ||
            (item.variants && item.variants.some(v => 
              v.options && v.options.some(o => 
                o.name === 'Finish' && o.value.includes('Takeaway')
              )
            ))
          );
          
          return isCoffee && (hasTakeaway || !item.name.toLowerCase().includes('eat-in'));
        });

        // Extract unique coffee types
        const coffeeTypeMap = new Map();
        
        allCoffees.forEach(item => {
          // Clean the name (remove Takeaway prefix)
          let cleanName = item.name.replace(/^(takeaway|eat-in)\s+/i, '');
          
          // Check if we already have this coffee type
          if (!coffeeTypeMap.has(cleanName.toLowerCase())) {
            coffeeTypeMap.set(cleanName.toLowerCase(), {
              ...item,
              displayName: cleanName,
              // Store the original product for reference
              originalProduct: item
            });
          }
        });
        
        // Convert map to array and sort by popularity
        let coffeeList = Array.from(coffeeTypeMap.values());
        coffeeList.sort((a, b) => {
          const aIsPopular = popularCoffees.some(coffee => 
            a.displayName.toLowerCase().includes(coffee.toLowerCase()));
          const bIsPopular = popularCoffees.some(coffee => 
            b.displayName.toLowerCase().includes(coffee.toLowerCase()));
          
          if (aIsPopular && !bIsPopular) return -1;
          if (!aIsPopular && bIsPopular) return 1;
          
          return a.displayName.localeCompare(b.displayName);
        });
        
        // Get food items (non-coffee)
        const foods = data.products.filter(item => {
          return item.category && item.category.name !== 'Coffee' && 
                 !item.name.toLowerCase().includes('eat-in');
        }).slice(0, 6); // Limit to 6 food items
        
        setCoffeeItems(coffeeList);
        setFoodItems(foods);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu items. Please try again later.');
        setLoading(false);
      }
    };

    fetchMenu();
  }, [popularCoffees]); // Add dependencies to fix exhaustive-deps warning

  const handleCoffeeSelect = (coffee) => {
    setSelectedCoffee(coffee);
    setIsCustomizing(true);
  };

  const handleCloseCustomization = () => {
    setIsCustomizing(false);
  };

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
    <div className="py-6 px-4">
      <h1 className="text-3xl font-bold mb-2 text-center">Middle Street Coffee</h1>
      <p className="text-center mb-6">Order for takeaway</p>
      
      {/* Coffee section */}
      <h2 className="text-xl font-semibold mb-4">Coffee</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {coffeeItems.map(coffee => (
          <CoffeeCard 
            key={coffee.uuid} 
            coffee={coffee} 
            onSelect={() => handleCoffeeSelect(coffee)}
          />
        ))}
      </div>
      
      {/* Food Add-ons section */}
      {foodItems.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Add Something Tasty</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {foodItems.map(food => (
              <AddOnCard 
                key={food.uuid} 
                item={food}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Customization Modal */}
      {isCustomizing && selectedCoffee && (
        <CustomizationModal 
          coffee={selectedCoffee}
          onClose={handleCloseCustomization}
        />
      )}
    </div>
  );
};

export default Menu;