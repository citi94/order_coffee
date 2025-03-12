import React, { useState, useEffect } from 'react';
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
  const popularCoffees = [
    'Latte', 'Cappuccino', 'Flat White', 'Americano', 
    'Espresso', 'Mocha', 'Cortado', 'Macchiato', 'Iced Latte'
  ];

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        console.log('Fetching menu data...');
        const data = await getMenuItems();
        
        if (!data || !data.products) {
          throw new Error('Invalid data received from API');
        }

        console.log(`Received ${data.products.length} products from API`);
       
        
        // Filter coffee products
        const coffeeProducts = data.products.filter(item => {
          return item && item.category && item.category.name === 'Coffee';
        });
        
        console.log(`Found ${coffeeProducts.length} coffee products`);
        setCoffeeItems(coffeeProducts);
        
        // Get food items (non-coffee)
        const foods = data.products.filter(item => {
          return item && item.category && 
                 item.category.name !== 'Coffee' && 
                 !item.name.toLowerCase().includes('eat-in');
        });
        
        console.log(`Found ${foods.length} food products`);
        setFoodItems(foods);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu items. Please try again later.');
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

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
          <p className="mt-2">Please try again later or contact the café directly.</p>
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
      
      {coffeeItems.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-8">
          <p className="font-medium">Currently unable to display coffee menu</p>
          <p className="text-sm mt-1">Please check back soon or visit us in store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {coffeeItems
            // Sort by popularity
            .sort((a, b) => {
              const aName = a.name || '';
              const bName = b.name || '';
              
              const aIsPopular = popularCoffees.some(coffee => 
                aName.toLowerCase().includes(coffee.toLowerCase()));
              const bIsPopular = popularCoffees.some(coffee => 
                bName.toLowerCase().includes(coffee.toLowerCase()));
              
              if (aIsPopular && !bIsPopular) return -1;
              if (!aIsPopular && bIsPopular) return 1;
              
              return aName.localeCompare(bName);
            })
            .map(coffee => (
              <CoffeeCard 
                key={coffee.uuid || coffee.id} 
                coffee={coffee} 
                onSelect={() => handleCoffeeSelect(coffee)}
              />
            ))
          }
        </div>
      )}
      
      {/* Food Add-ons section */}
      {foodItems.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Add Something Tasty</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {foodItems.map(food => (
              <AddOnCard 
                key={food.uuid || food.id} 
                item={food}
              />
            ))}
          </div>
        </>
      )}
      
      {foodItems.length === 0 && coffeeItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg mb-2">No products are currently available</p>
          <p>Please try again later or visit us in store.</p>
        </div>
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