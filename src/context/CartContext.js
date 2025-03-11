import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0
};

// Create context
const CartContext = createContext(initialState);

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id && 
               JSON.stringify(item.options) === JSON.stringify(action.payload.options)
      );

      let updatedItems;

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity
        };
      } else {
        // Add new item
        updatedItems = [...state.items, action.payload];
      }

      // Calculate totals
      const totalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = updatedItems.reduce(
        (total, item) => total + (item.price * item.quantity), 0
      );

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalAmount
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(
        (item, index) => index !== action.payload.index
      );
      
      // Calculate totals
      const totalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = updatedItems.reduce(
        (total, item) => total + (item.price * item.quantity), 0
      );

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalAmount
      };
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = [...state.items];
      updatedItems[action.payload.index] = {
        ...updatedItems[action.payload.index],
        quantity: action.payload.quantity
      };

      // Calculate totals
      const totalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      const totalAmount = updatedItems.reduce(
        (total, item) => total + (item.price * item.quantity), 0
      );

      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalAmount
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
};

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, () => {
    // Load cart from localStorage if available
    const localData = localStorage.getItem('cart');
    return localData ? JSON.parse(localData) : initialState;
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  // Add item to cart
  const addToCart = (item) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: item
    });
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { index }
    });
  };

  // Update item quantity
  const updateQuantity = (index, quantity) => {
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { index, quantity }
    });
  };

  // Clear cart
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for using the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};