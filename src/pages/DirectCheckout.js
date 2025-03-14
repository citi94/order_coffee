import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const DirectCheckout = () => {
  console.log("DirectCheckout component mounting");
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();

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