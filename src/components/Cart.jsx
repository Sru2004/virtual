import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

const Cart = () => {
    const { profile } = useAuth();
    const [cartItems, setCartItems] = useState({});
    const [artworks, setArtworks] = useState([]);
    const [cartArray, setCartArray] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [showAddress, setShowAddress] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentOption, setPaymentOption] = useState("COD");

    const getCart = () => {
        let tempArray = [];
        for (const key in cartItems) {
            const artwork = artworks.find((item) => item._id === key);
            if (artwork) {
                artwork.quantity = cartItems[key];
                tempArray.push(artwork);
            }
        }
        setCartArray(tempArray);
    };

    const getUserAddress = async () => {
        try {
            const data = await api.getAddresses();
            if (data.success) {
                setAddresses(data.addresses);
                if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0]);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const placeOrder = async () => {
        try {
            if (!selectedAddress) {
                return toast.error("Please select an address");
            }
            // Place Order with COD
            if (paymentOption === "COD") {
                const data = await api.createOrder({
                    userId: profile._id,
                    items: cartArray.map(item => ({ product: item._id, quantity: item.quantity })),
                    address: selectedAddress._id
                });

                if (data.success) {
                    toast.success(data.message);
                    setCartItems({});
                    localStorage.removeItem('cartItems');
                    // Dispatch custom event to update navbar cart count
                    window.dispatchEvent(new Event('storage'));
                    // Navigate to orders page
                    navigate('/my-orders');
                } else {
                    toast.error(data.message);
                }
            } else {
                // Place Order with Online Payment (Stripe)
                const data = await api.createOrder({
                    userId: profile._id,
                    items: cartArray.map(item => ({ product: item._id, quantity: item.quantity })),
                    address: selectedAddress._id,
                    paymentMethod: 'stripe'
                });

                if (data.success) {
                    window.location.replace(data.url);
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const removeFromCart = (artworkId) => {
        const newCartItems = { ...cartItems };
        delete newCartItems[artworkId];
        setCartItems(newCartItems);
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));
        // Dispatch custom event to update navbar cart count
        window.dispatchEvent(new Event('storage'));
    };

    const updateCartItem = (artworkId, quantity) => {
        const newCartItems = { ...cartItems, [artworkId]: quantity };
        setCartItems(newCartItems);
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));
        // Dispatch custom event to update navbar cart count
        window.dispatchEvent(new Event('storage'));
    };

    const getCartCount = () => {
        return Object.values(cartItems).reduce((total, qty) => total + qty, 0);
    };

    const getCartAmount = () => {
        return cartArray.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    useEffect(() => {
        const fetchArtworks = async () => {
            try {
                const allArtworks = await api.getArtworks();
                setArtworks(allArtworks);
            } catch (error) {
                console.error('Error fetching artworks:', error);
            }
        };
        fetchArtworks();

        // Load cart from localStorage
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    useEffect(() => {
        if (artworks.length > 0 && Object.keys(cartItems).length > 0) {
            getCart();
        }
    }, [artworks, cartItems]);

    useEffect(() => {
        if (profile) {
            getUserAddress();
        }
    }, [profile]);

    // Refresh addresses when navigating back from add-address page
    useEffect(() => {
        const handleAddressAdded = () => {
            if (profile) {
                getUserAddress();
            }
        };

        window.addEventListener('addressAdded', handleAddressAdded);

        return () => {
            window.removeEventListener('addressAdded', handleAddressAdded);
        };
    }, [profile]);

    return artworks.length > 0 && Object.keys(cartItems).length > 0 ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className='flex-1'>
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-purple-600">({getCartCount()})</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Artwork Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((artwork, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                        <div className="flex items-center md:gap-6 gap-3">
                            <div onClick={() => {
                                navigate(`/artwork-details/${artwork._id}`);
                                window.scrollTo(0, 0);
                            }} className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded overflow-hidden">
                                <img className="max-w-full h-full object-cover" src={artwork.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'} alt={artwork.title} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{artwork.title}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Category: <span>{artwork.category || "N/A"}</span></p>
                                    <div className='flex items-center'>
                                        <p>Qty:</p>
                                        <select onChange={e => updateCartItem(artwork._id, Number(e.target.value))}
                                            value={cartItems[artwork._id]} className='outline-none'>
                                            {Array((cartItems[artwork._id] > 10 ? cartItems[artwork._id] : 10)).fill('').map((_, index) => (
                                                <option key={index} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">₹{artwork.price * artwork.quantity}</p>
                        <button onClick={() => removeFromCart(artwork._id)} className="cursor-pointer mx-auto">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}

                <button onClick={() => {
                    navigate('/user/dashboard');
                    window.scrollTo(0, 0);
                }} className="group cursor-pointer flex items-center mt-8 gap-2 text-purple-600 font-medium">
                    <svg className="group-hover:-translate-x-1 transition w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Continue Shopping
                </button>
            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 border border-gray-300/70">
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">Delivery Address</p>
                    <div className="relative flex justify-between items-start mt-2">
                        <p className="text-gray-500">{selectedAddress ? `${selectedAddress.firstName} ${selectedAddress.lastName}, ${selectedAddress.phone}, ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}` : "No address found"}</p>
                        <button onClick={() => setShowAddress(!showAddress)} className="text-purple-600 hover:underline cursor-pointer">
                            Change
                        </button>
                        {showAddress && (
                            <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full">
                                {addresses.map((address, index) => (
                                    <p onClick={() => { setSelectedAddress(address); setShowAddress(false); }} className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer">
                                        {address.firstName} {address.lastName}, {address.phone}, {address.street}, {address.city}, {address.state}, {address.country}
                                    </p>
                                ))}
                                <p onClick={() => navigate('/add-address')} className="text-purple-600 text-center cursor-pointer p-2 hover:bg-purple-50">
                                    Add address
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>
                    <select onChange={e => setPaymentOption(e.target.value)} className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none">
                        <option value="COD">Cash On Delivery</option>
                        <option value="Online">Online Payment</option>
                    </select>
                </div>

                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Price</span><span>₹{getCartAmount()}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span><span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Tax (2%)</span><span>₹{Math.round(getCartAmount() * 2 / 100)}</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span><span>₹{getCartAmount() + Math.round(getCartAmount() * 2 / 100)}</span>
                    </p>
                </div>

                <button onClick={placeOrder} className="w-full py-3 mt-6 cursor-pointer bg-purple-600 text-white font-medium hover:bg-purple-700 transition">
                    {paymentOption === "COD" ? "Place Order" : "Proceed to Checkout"}
                </button>
            </div>
        </div>
    </div>
    ) : (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <p className="text-gray-600 text-lg">Your cart is empty</p>
                <button
                    onClick={() => navigate('/user/dashboard')}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    Browse Artworks
                </button>
            </div>
        </div>
    );
};

export default Cart;
