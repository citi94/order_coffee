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
        orderNumber: location.state.orderNumber
      });
      setStatus('success'); // For simplicity, we'll assume success if we have order details
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
              orderNumber: response.orderNumber
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

  if (status === 'processing') {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold mb-6">Processing Your Order</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
        <p>Please wait while we process your payment...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="py-10 text-center">
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
    );
  }

  if (status === 'error') {
    return (
      <div className="py-10 text-center">
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
    );
  }

  return (
    <div className="py-10 text-center">
      <div className="bg-green-100 border border-green-400 text-green-700 px-8 py-6 rounded mb-6 inline-block">
        <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-lg mb-2">
          Your order #{orderDetails?.orderNumber} has been received.
        </p>
        <p>The barista will prepare your coffee shortly.</p>
      </div>
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        <p className="mb-2"><strong>Order Number:</strong> {orderDetails?.orderNumber}</p>
        <p><strong>Order ID:</strong> {orderDetails?.orderId}</p>
      </div>
      
      <Link 
        to="/" 
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
      >
        Order Another Coffee
      </Link>
    </div>
  );
};

export default OrderConfirmation;