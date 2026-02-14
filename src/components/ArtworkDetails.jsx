import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Eye, ShoppingCart, Heart, MapPin, Calendar, Award } from "lucide-react";
import { api } from '../lib/api';
import { toastSuccess, toastError } from '../lib/toast';

const ArtworkDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const artworkId = id;
  const [artwork, setArtwork] = useState(null);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedArtworks, setRelatedArtworks] = useState([]);


  useEffect(() => {
    // Create AbortController for cleanup
    const controller = new AbortController();
    
    if (artworkId) {
      fetchArtworkDetails(controller.signal);
      checkWishlistStatus(controller.signal);
    }

    // Cleanup function to prevent memory leaks and state updates on unmount
    return () => {
      controller.abort();
    };
  }, [artworkId]);

  const checkWishlistStatus = async (signal) => {
    try {
      const isInWishlist = await api.checkWishlist(artworkId);
      // Check if component is still mounted before setting state
      if (!signal.aborted) {
        setIsWishlisted(isInWishlist);
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name !== 'AbortError' && !signal.aborted) {
        console.error('Error checking wishlist status:', error);
      }
    }
  };

  const fetchArtworkDetails = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      
      const artworkData = await api.getArtwork(artworkId);
      
      // Check if component is still mounted before setting state
      if (signal.aborted) return;
      
      setArtwork(artworkData);

      // Fetch artist profile if artwork has artist_id
      if (artworkData.artist_id) {
        try {
          const artistId = artworkData.artist_id._id || artworkData.artist_id;
          if (artistId) {
            const artistData = await api.getArtistProfile(artistId);
            if (!signal.aborted) {
              setArtist(artistData);
            }
          }
        } catch (error) {
          // Ignore abort errors
          if (error.name !== 'AbortError' && !signal.aborted) {
            console.error('Error fetching artist profile:', error);
          }
        }
      }

      // Fetch related artworks
      try {
        const allArtworks = await api.getArtworks({ status: 'published' });
        if (!signal.aborted) {
          const related = allArtworks
            .filter(art => art.category === artworkData.category && art._id !== artworkData._id)
            .slice(0, 4);
          setRelatedArtworks(related);
        }
      } catch (error) {
        // Ignore abort errors for related artworks
        if (error.name !== 'AbortError' && !signal.aborted) {
          console.error('Error fetching related artworks:', error);
        }
      }

    } catch (error) {
      // Check if error is due to abort (component unmounted)
      if (error.name === 'AbortError' || signal.aborted) {
        return;
      }
      
      console.error('Error fetching artwork details:', error);
      setError(error.message || 'Failed to load artwork details. Please try again.');
    } finally {
      // Only update loading state if not aborted
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleAddToCart = async () => {
    try {
      // Get current cart from localStorage
      const currentCart = JSON.parse(localStorage.getItem('cartItems') || '{}');

      // Add or update the artwork quantity
      const newQuantity = (currentCart[artwork._id] || 0) + 1;
      currentCart[artwork._id] = newQuantity;

      // Save back to localStorage
      localStorage.setItem('cartItems', JSON.stringify(currentCart));

      // Dispatch storage event to update navbar cart count
      window.dispatchEvent(new Event('storage'));

      // Show success message
      toastSuccess(`Added "${artwork.title}" to cart!`);
      // Navigate to cart page
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toastError('Failed to add item to cart. Please try again.');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(artwork._id);
        setIsWishlisted(false);
        toastSuccess(`Removed "${artwork.title}" from wishlist`);
      } else {
        await api.addToWishlist(artwork._id);
        setIsWishlisted(true);
        toastSuccess(`Added "${artwork.title}" to wishlist`);
      }
      // Dispatch custom event to refresh wishlist in other components
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toastError('Failed to update wishlist. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading artwork details...</p>
        </div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">
            {error || "Artwork not found or you don't have permission to view it"}
          </p>
          <button
            onClick={() => navigate('/user/dashboard')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Artworks
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <img
                src={artwork.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
                alt={artwork.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                }}
              />
            </div>

            {/* Thumbnail Gallery (if multiple images available) */}
            {artwork.image_url && (
              <div className="flex gap-2 overflow-x-auto">
                <div className="flex-shrink-0 w-20 h-20 bg-white rounded-lg overflow-hidden border-2 border-purple-500">
                  <img
                    src={artwork.image_url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                  {artwork.category || 'General'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  artwork.status === 'published' ? 'bg-green-100 text-green-700' :
                  artwork.status === 'sold' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {artwork.status ? artwork.status.charAt(0).toUpperCase() + artwork.status.slice(1) : 'Unknown'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{artwork.title}</h1>
              <p className="text-gray-600 text-lg">{artwork.description || 'No description available'}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= (artwork.rating || 4) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">({artwork.rating || 4} reviews)</span>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-3xl font-bold text-gray-900">₹{Number(artwork.price).toLocaleString("en-IN")}</p>
                </div>
                {artwork.medium && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Medium</p>
                    <p className="text-lg font-medium text-gray-900">{artwork.medium}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Artist Information */}
            {artist && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Artist</h3>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                    {artist.profile_picture ? (
                      <img src={artist.profile_picture} alt="Artist" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-purple-500 flex items-center justify-center text-white text-xl font-bold">
                        {artist.artist_name?.[0] || 'A'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{artist.artist_name || 'Artist Name'}</h4>
                    <p className="text-sm text-gray-600 mb-2">{artist.art_style || 'Artist'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {artist.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{artist.location}</span>
                        </div>
                      )}
                      {artist.years_experience && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{artist.years_experience} years experience</span>
                        </div>
                      )}
                      {artist.awards_won > 0 && (
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          <span>{artist.awards_won} awards</span>
                        </div>
                      )}
                    </div>
                    {artist.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{artist.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => navigate(`/ar-preview/${artwork._id}`)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Eye className="h-5 w-5" />
                AR Preview
              </button>
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={artwork.status === 'sold'}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    artwork.status === 'sold'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {artwork.status === 'sold' ? 'Sold Out' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleAddToWishlist}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    isWishlisted
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Artwork Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Size</p>
                  <p className="font-medium">{artwork.size || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">{new Date(artwork.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Views</p>
                  <p className="font-medium">{artwork.views_count || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Likes</p>
                  <p className="font-medium">{artwork.likes_count || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Artworks */}
        {relatedArtworks.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Artworks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedArtworks.map((relatedArt) => (
                <div
                  key={relatedArt._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/artwork-details/${relatedArt._id}`)}
                >
                  <div className="h-48 bg-gray-200">
                    <img
                      src={relatedArt.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
                      alt={relatedArt.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{relatedArt.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{relatedArt.category}</p>
                    <p className="text-lg font-bold text-gray-900">₹{Number(relatedArt.price).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ArtworkDetails;
