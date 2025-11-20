import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

const MyOrders = () => {
    const [myOrders, setMyOrders] = useState([]);
    const { profile } = useAuth();

    const fetchMyOrders = async () => {
        try {
            const response = await api.getOrders();
            console.log('Orders response:', response);
            if (response.success) {
                setMyOrders(response.orders);
            } else {
                toast.error(response.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.log('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        }
    };

    useEffect(() => {
        if (profile) {
            fetchMyOrders();
        }
    }, [profile]);

    return (
        <div className='mt-16 pb-16'>
            <div className='flex flex-col items-center w-full mb-8'>
                <p className='text-3xl font-bold text-gray-800 uppercase'>My Orders</p>
                <div className='w-24 h-1 bg-amber-500 rounded-full mt-2'></div>
            </div>

            <div className='max-w-6xl mx-auto px-4'>
                {myOrders.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">No orders found.</p>
                        <p className="text-gray-400 text-sm mt-2">Your placed orders will appear here.</p>
                    </div>
                ) : (
                    <div className='space-y-6'>
                        {myOrders.map((order, index) => (
                            <div key={index} className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
                                <div className='bg-gray-50 px-6 py-4 border-b border-gray-200'>
                                    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                                        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6'>
                                            <span className='text-sm text-gray-600'>Order ID: <span className='font-medium text-gray-800'>{order._id}</span></span>
                                            <span className='text-sm text-gray-600'>Payment: <span className='font-medium text-gray-800'>{order.paymentType || 'COD'}</span></span>
                                        </div>
                                        <span className='text-lg font-bold text-amber-600'>Total: ₹{order.amount}</span>
                                    </div>
                                </div>

                                <div className='divide-y divide-gray-100'>
                                    {order.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className='p-6 flex flex-col md:flex-row md:items-center gap-6'>
                                            <div className='flex items-center gap-4 flex-shrink-0'>
                                                <div className='bg-gray-100 p-3 rounded-lg'>
                                                    <img
                                                        src={item.product.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
                                                        alt={item.product.title}
                                                        className='w-16 h-16 object-cover rounded'
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className='text-lg font-semibold text-gray-800'>{item.product.title}</h3>
                                                    <p className='text-sm text-gray-600'>Category: {item.product.category}</p>
                                                    <p className='text-sm text-gray-600'>Medium: {item.product.medium || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:ml-auto'>
                                                <div className='flex flex-col gap-1'>
                                                    <span className='text-sm text-gray-600'>Quantity: <span className='font-medium'>{item.quantity}</span></span>
                                                    <span className='text-sm text-gray-600'>Status: <span className={`font-medium ${order.status === 'completed' ? 'text-green-600' : order.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{order.status}</span></span>
                                                    <span className='text-sm text-gray-600'>Date: <span className='font-medium'>{new Date(order.order_date).toLocaleDateString()}</span></span>
                                                </div>
                                                <div className='text-right'>
                                                    <p className='text-lg font-bold text-amber-600'>₹{item.product.price * item.quantity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
