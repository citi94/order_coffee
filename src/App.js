// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import DirectCheckout from './pages/DirectCheckout'; // Use DirectCheckout instead
import OrderConfirmation from './pages/OrderConfirmation';
import { CartProvider } from './context/CartContext';
import './App.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="container mx-auto px-4 pb-20">
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/DirectCheckout" element={<DirectCheckout />} /> {/* Changed from Checkout */}
              <Route path="/confirmation" element={<OrderConfirmation />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;