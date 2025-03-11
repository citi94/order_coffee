import axios from 'axios';

const api = axios.create({
  baseURL: '/.netlify/functions',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getMenuItems = async () => {
  try {
    const response = await api.get('/get-menu');
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/create-order', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const initiatePayment = async (paymentData) => {
  try {
    const response = await api.post('/initiate-payment', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error initiating payment:', error);
    throw error;
  }
};

export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await api.get(`/check-payment-status?paymentId=${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
};

export default api;