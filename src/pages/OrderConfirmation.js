import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { checkPaymentStatus } from '../utils/api';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [orderDetails, setOrderDetails] = useState(null);
  
  useEffect(() => {
    // If we have order details from navigation state, use those
    if (location.state?.orderId) {
      setOrderDetails({
        orderId: location.state.orderId,
        orderNumber: location.state.orderNumber,
        pickupTime: location.state.pickupTime,
        customerName: location.state.customerName
      });
      setStatus('success'); // Assume success if we have order details
    } else {
      // Otherwise check for payment ID in localStorage
      const paymentId = localStorage.getItem('currentPaymentId');
      
      if (!paymentId) {
        // No payment in progress, redirect to home
        navigate('/');
        return;
      }
      
      // Check payment status
      const checkStatus = async () => {
        try {
          const response = await checkPaymentStatus(paymentId);
          
          if (response.status === 'COMPLETED') {
            setStatus('success');
            setOrderDetails({
              orderId: response.orderId,
              orderNumber: response.orderNumber,
              pickupTime: 'As soon as possible',
              customerName: 'Customer'
            });
            // Clear the payment ID
            localStorage.removeItem('currentPaymentId');
          } else if (response.status === 'FAILED') {
            setStatus('failed');
            // Clear the payment ID
            localStorage.removeItem('currentPaymentId');
          } else {
            // Still processing, check again in a few seconds
            setTimeout(checkStatus, 3000);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          setStatus('error');
        }
      };
      
      checkStatus();
    }
  }, [location.state, navigate]);

  // Get the current date
  const getCurrentDate = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-GB', options);
  };

  if (status === 'processing') {
    return (
      <div className="py-10 text-center px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Processing Your Order</h1>
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
          <p>Please wait while we process your payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="py-10 text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 inline-block">
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p>There was an issue processing your payment.</p>
          </div>
          <div>
            <Link 
              to="/checkout" 
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-10 text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6 inline-block">
            <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
            <p>We couldn't determine the status of your order.</p>
          </div>
          <div>
            <Link 
              to="/" 
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
            >
              Return to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 text-center px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-black text-white p-4">
          <h1 className="text-xl font-bold">Order Confirmed!</h1>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-bold mb-1">
              Thanks, {orderDetails?.customerName || 'Customer'}!
            </p>
            <p className="text-gray-600">Your order has been placed</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <h2 className="font-bold text-gray-800 mb-2">Order #{orderDetails?.orderNumber}</h2>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Date:</span>
              <span>{getCurrentDate()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Pickup Time:</span>
              <span>{orderDetails?.pickupTime}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            Your drinks will be ready for collection at the time above.
            Please show this confirmation to the barista.
          </p>
          
          <Link 
            to="/" 
            className="block w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition"
          >
            Order More
          </Link>
          
          <div className="mt-4 text-xs text-gray-500">
            Order ID: {orderDetails?.orderId}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;