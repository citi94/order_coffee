import React from 'react';

const CoffeeCard = ({ coffee, onSelect }) => {
  // Get the base price - use the first variant or default price
  const basePrice = coffee.variants && coffee.variants.length > 0 && coffee.variants[0].price
    ? coffee.variants[0].price.amount
    : (coffee.price || 300); // Default to £3.00 if no price found
  
  // Get display name - clean up eat-in/takeaway prefixes
  const getDisplayName = () => {
    if (!coffee || !coffee.name) return 'Coffee';
    
    let name = coffee.displayName || coffee.name || '';
    name = name.replace(/^(takeaway|eat-in)\s+/i, '');
    return name || 'Coffee';
  };
  
  // Coffee icons mapping
  const getCoffeeIcon = (coffeeName) => {
    // Make sure we have a string and convert to lowercase safely
    const name = (coffeeName || '').toLowerCase();
    
    if (name.includes('latte')) {
      return '☕️';
    } else if (name.includes('cappuccino')) {
      return '☕️';
    } else if (name.includes('espresso')) {
      return '☕';
    } else if (name.includes('americano')) {
      return '☕️';
    } else if (name.includes('mocha')) {
      return '☕️';
    } else if (name.includes('flat white') || name.includes('flatwhite')) {
      return '☕️';
    } else if (name.includes('macchiato')) {
      return '☕';
    } else if (name.includes('cortado')) {
      return '☕';
    } else {
      return '☕️';
    }
  };

  const displayName = getDisplayName();

  return (
    <button 
      onClick={() => onSelect(coffee)}
      className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-all flex flex-col items-center justify-between h-full"
    >
      <div className="text-4xl mb-2">{getCoffeeIcon(displayName)}</div>
      <h3 className="font-bold text-lg mb-1">{displayName}</h3>
      <p className="text-gray-700">£{(basePrice / 100).toFixed(2)}</p>
    </button>
  );
};

export default CoffeeCard;