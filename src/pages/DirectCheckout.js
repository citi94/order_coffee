import React from 'react';
import { useCart } from '../context/CartContext';

const DirectCheckout = () => {
  console.log("DirectCheckout component mounting");
  const { items, totalAmount } = useCart();

  // Very simple version to test
  return (
    <div className="py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <p>Checkout page is loading</p>
      <pre>{JSON.stringify({itemCount: items.length, totalAmount}, null, 2)}</pre>
    </div>
  );
};

export default DirectCheckout;