// src/components/ZettlePayment.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkPaymentStatus } from '../utils/api';

const ZettlePayment = ({ orderId, amount, customerName }) => {
  const paymentContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentInstance, setPaymentInstance] = useState(null);
  const [canUseApplePay, setCanUseApplePay] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Zettle PaymentJS is available
    if (!window.Zettle) {
      setError('Zettle Payment SDK not loaded. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    const initializePayment = async () => {
      try {
        setIsLoading(true);
        
        // Get API keys and config from your backend
        const response = await fetch('/.netlify/functions/get-payment-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, amount }),
        });
        
        const { publicKey, paymentConfig } = await response.json();
        
        if (!publicKey || !paymentConfig) {
          throw new Error('Invalid payment configuration received from server');
        }

        // Initialize Zettle Payment
        const payment = window.Zettle.Payment({
          publicKey,
          containerId: 'zettle-payment-container',
          ...paymentConfig
        });
        
        // Check Apple Pay availability
        const applePayAvailable = await payment.applepay.isAvailable();
        setCanUseApplePay(applePayAvailable);
        
        // Store payment instance
        setPaymentInstance(payment);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize payment:', err);
        setError(`Payment initialization failed: ${err.message}`);
        setIsLoading(false);
      }
    };

    initializePayment();
    
    // Cleanup function
    return () => {
      if (paymentInstance) {
        paymentInstance.destroy();
      }
    };
  }, [orderId, amount]);

  const handleApplePayPayment = async () => {
    if (!paymentInstance) return;
    
    try {
      setIsLoading(true);
      
      // Start Apple Pay payment flow
      const result = await paymentInstance.applepay.charge({
        amount: amount,
        currency: 'GBP',
        reference: `order-${orderId}`,
        paymentDescription: 'Middle Street Coffee Order',
        country: 'GB'
      });
      
      if (result.success) {
        // Handle successful payment
        handleSuccessfulPayment(result.paymentId);
      } else {
        setError('Payment was not completed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Apple Pay payment failed:', err);
      setError(`Payment failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!paymentInstance) return;
    
    try {
      setIsLoading(true);
      
      // Start card payment flow
      const result = await paymentInstance.card.charge({
        amount: amount,
        currency: 'GBP',
        reference: `order-${orderId}`,
        paymentDescription: 'Middle Street Coffee Order'
      });
      
      if (result.success) {
        // Handle successful payment
        handleSuccessfulPayment(result.paymentId);
      } else {
        setError('Payment was not completed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Card payment failed:', err);
      setError(`Payment failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleSuccessfulPayment = async (paymentId) => {
    try {
      // Call your backend to update the order status
      await fetch('/.netlify/functions/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId, 
          paymentId,
          status: 'PAID' 
        }),
      });
      
      // Navigate to confirmation page
      navigate('/confirmation', { 
        state: { 
          orderId,
          paymentId,
          customerName,
          orderStatus: 'PAID'
        }
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
      // Still navigate to confirmation, but will need to verify payment
      navigate('/confirmation', { 
        state: { 
          orderId,
          paymentId,
          customerName,
          orderStatus: 'PENDING_VERIFICATION'
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto"></div>
        <p className="mt-2">Preparing payment options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-bold">Payment Error</p>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
      
      {canUseApplePay && (
        <button
          onClick={handleApplePayPayment}
          className="w-full bg-black text-white py-3 rounded-lg font-medium mb-3 flex items-center justify-center"
        >
          <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5 13.5c0-3.08 2.5-4.5 2.5-4.5s-2.5-3.5-6-3.5c-3.5 0-5 2.5-5 2.5s-1.5-2.5-5-2.5c-3.5 0-6 3.5-6 3.5s2.5 1.42 2.5 4.5c0 3.08-2.5 4.5-2.5 4.5s2.5 3.5 6 3.5c3.5 0 5-2.5 5-2.5s1.5 2.5 5 2.5c3.5 0 6-3.5 6-3.5s-2.5-1.42-2.5-4.5z" />
          </svg>
          Pay with Apple Pay
        </button>
      )}
      
      <button
        onClick={handleCardPayment}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
      >
        Pay with Card
      </button>
      
      <div id="zettle-payment-container" ref={paymentContainerRef} className="mt-4"></div>
    </div>
  );
};

export default ZettlePayment;