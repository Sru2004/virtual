import React, { useState, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Search, Star, ShoppingCart } from 'lucide-react';
import { toastSuccess, toastError } from '../lib/toast';

export default function SearchPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const artworksRes = await api.getArtworks({ status: 'published' });
        setArtworks(artworksRes || []);
        setFilteredArtworks(artworksRes || []);
      } catch (error) {
        console.error('Error fetching artworks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredArtworks(artworks);
    } else {
      const filtered = artworks.filter(art =>
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.artist_id && art.artist_id.artist_name && art.artist_id.artist_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredArtworks(filtered);
    }
  }, [searchQuery, artworks]);

  const handleAddToCart = async (artwork) => {
    try {
      const currentCart = JSON.parse(localStorage.getItem('cartItems') || '{}');
      const newQuantity = (currentCart[artwork._id] || 0) + 1;
      currentCart[artwork._id] = newQuantity;
      localStorage.setItem('cartItems', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('storage'));
      toastSuccess(`Added "${artwork.title}" to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toastError('Failed to add item to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading search...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Artworks</h1>

          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by title, artist, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Search Results Count */}
          <div className="mt-4 text-gray-600">
            {searchQuery.trim() === "" ? (
              <p>Showing all artworks ({artworks.length})</p>
            ) : (
              <p>Found {filteredArtworks.length} result{filteredArtworks.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
            )}
          </div>
        </div>

        {/* Search Results */}
        {filteredArtworks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No artworks found</h3>
            <p className="text-gray-600">Try adjusting your search terms or browse all artworks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtworks.map((art) => (
              <div key={art._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-200">
                  <img
                    src={art.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
                    alt={art.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                    }}
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate', {
                      detail: `artwork-details-${art._id}`
                    }))}
                  />
                </div>

                <div className="p-4">
                  <p className="text-sm text-purple-600 font-semibold capitalize mb-1">
                    {art.category || 'General'}
                  </p>
                  <h3 className="font-bold text-lg text-gray-900 mb-1 cursor-pointer hover:text-purple-600"
                      onClick={() => window.dispatchEvent(new CustomEvent('navigate', {
                        detail: `artwork-details-${art._id}`
                      }))}>
                    {art.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{art.description || 'No description'}</p>

                  {/* Artist Name */}
                  {art.artist_id && (
                    <p className="text-sm text-gray-500 mb-2">
                      by {art.artist_id.artist_name || 'Unknown Artist'}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (art.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">({art.rating || 4})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      ₹{Number(art.price).toLocaleString("en-IN")}
                    </p>

                    {profile?.user_type === 'user' && (
                      <button
                        onClick={() => handleAddToCart(art)}
                        disabled={art.status === 'sold'}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          art.status === 'sold'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {art.status === 'sold' ? 'Sold' : 'Add'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
