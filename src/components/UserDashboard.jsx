import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { ShoppingCart } from 'lucide-react';

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [artworks, setArtworks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // Fetch all artworks from API and cart count
  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const artworksRes = await api.getArtworks({ status: 'published' });
        setArtworks(artworksRes || []);
        setFiltered(artworksRes || []);
      } catch (error) {
        console.error('Error fetching artworks:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWishlist = async () => {
      try {
        const wishlistData = await api.getWishlist();
        console.log('UserDashboard wishlist data:', wishlistData);
        setWishlist(wishlistData || []);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlist([]);
      }
    };

    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        const count = Object.values(cartItems).reduce((total, qty) => total + qty, 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    };

    fetchArtworks();
    fetchWishlist();
    updateCartCount();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchArtworks, 30000);

    // Listen for artwork upload events
    const handleArtworkUploaded = () => {
      fetchArtworks();
    };

    // Listen for cart changes
    const handleStorageChange = () => {
      updateCartCount();
    };

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      fetchWishlist();
    };

    window.addEventListener('artworkUploaded', handleArtworkUploaded);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('artworkUploaded', handleArtworkUploaded);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  // Apply Filters
  useEffect(() => {
    let items = artworks;

    if (categoryFilter) {
      items = items.filter((a) => a.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (minPrice) {
      items = items.filter((a) => Number(a.price) >= Number(minPrice));
    }

    if (maxPrice) {
      items = items.filter((a) => Number(a.price) <= Number(maxPrice));
    }

    if (ratingFilter) {
      items = items.filter((a) => a.rating >= Number(ratingFilter));
    }

    setFiltered(items);
  }, [categoryFilter, minPrice, maxPrice, ratingFilter, artworks]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* User Name and Cart */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Welcome, {profile?.full_name || "User"}
            </h1>
            <p className="text-gray-600">Explore amazing artworks from talented artists.</p>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="relative flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-3">Filters</h3>

          <label className="text-sm block mb-2">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          >
            <option value="">All Categories</option>
            <option value="abstract">Abstract</option>
            <option value="landscapes">Landscapes</option>
            <option value="portraits">Portraits</option>
            <option value="mixed media">Mixed Media</option>
            <option value="digital">Digital</option>
            <option value="sculpture">Sculpture</option>
          </select>

          <label className="text-sm block mb-2">Price Range</label>
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full border p-2 rounded my-2"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          />

          <label className="text-sm block mb-2">Minimum Rating</label>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>
        </div>

        {/* Right Side Artworks Grid */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Artworks</h2>

          {filtered.length === 0 ? (
            <p className="text-gray-500 bg-white p-5 rounded-xl shadow-sm">
              No artworks match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((art) => (
                <div key={art._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <img
                    src={art.image_url || "https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg"}
                    className="w-full h-48 object-cover"
                    alt={art.title}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                    }}
                  />

                  <div className="p-4">
                    <p className="text-sm text-purple-600 font-semibold capitalize">
                      {art.category || "General"}
                    </p>
                    <h3 className="font-bold text-lg">{art.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{art.description || "No description"}</p>

                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < (art.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                      <span className="text-sm text-gray-600 ml-1">({art.rating || 0})</span>
                    </div>

                    <p className="text-gray-700 font-semibold mb-3">
                      ₹{Number(art.price).toLocaleString("en-IN")}
                    </p>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                        onClick={() => navigate(`/artwork-details/${art._id}`)}
                      >
                        View Details
                      </button>
                      <button
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          wishlist.some(item => item.artwork_id === art._id)
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={async () => {
                          try {
                            const isInWishlist = wishlist.some(item => item.artwork_id === art._id);
                            if (isInWishlist) {
                              await api.removeFromWishlist(art._id);
                            } else {
                              await api.addToWishlist(art._id);
                            }
                            // Refresh wishlist
                            const updatedWishlist = await api.getWishlist();
                            setWishlist(updatedWishlist || []);
                            window.dispatchEvent(new CustomEvent('wishlistUpdated'));
                          } catch (error) {
                            console.error('Error updating wishlist:', error);
                          }
                        }}
                      >
                        {wishlist.some(item => item.artwork_id === art._id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
