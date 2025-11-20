import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Edit,
  Upload,
  DollarSign,
  Heart,
  Star,
  Clock,
  Trash2,
  LogOut,
  Camera,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, Artwork, Order, Review } from '../lib/api';

const ArtistProfile = () => {
  const { profile, artistProfile, refreshProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('portfolio');
  const [artworks, setArtworks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalSales: 0,
    totalLikes: 0,
    avgRating: 0,
    pendingApprovals: 0,
  });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    medium: '',
    price: '',
    image_file: null,
    image_url: '',
    tags: '',
    size: 'medium',
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  useEffect(() => {
    if (profile?.id) {
      fetchArtworks();
      fetchOrders();
      fetchReviews();
      calculateStats();
    }
  }, [profile, artistProfile]);

  const fetchArtworks = async () => {
    try {
      const params = artistProfile ? { artist_id: artistProfile.id } : {};
      const data = await api.getArtworks(params);
      setArtworks(data || []);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      setArtworks([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      const artistId = artistProfile ? artistProfile.id : profile?.id;
      const filteredOrders = data.filter(order => order.artist_id === artistId);
      setOrders(filteredOrders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await api.getAllReviews();
      const artistId = artistProfile ? artistProfile.id : profile?.id;
      const filteredReviews = data.filter(review => review.artist_id === artistId);
      setReviews(filteredReviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const calculateStats = async () => {
    try {
      // Fetch artwork data first to get accurate counts
      const params = artistProfile ? { artist_id: artistProfile.id } : {};
      const artworkData = await api.getArtworks(params);
      const totalUploads = artworkData?.length || 0;
      const totalLikes = artworkData?.reduce((sum, art) => sum + art.likes_count, 0) || 0;
      const pendingApprovals = artworkData?.filter((art) => art.status === 'pending').length || 0;

      // Use the dynamic stats from artistProfile if available
      if (artistProfile) {
        const totalSales = artistProfile.total_sales || 0;
        const avgRating = artistProfile.avg_rating || 0;

        setStats({ totalUploads, totalSales, totalLikes, avgRating, pendingApprovals });
      } else {
        // Fallback to manual calculation if artistProfile is not available
        const orderData = await api.getOrders();
        const completedOrders = orderData.filter(order => order.artist_id === profile?.id && order.status === 'completed');
        const totalSales = completedOrders?.length || 0;

        const reviewData = await api.getAllReviews();
        const artistReviews = reviewData.filter(review => review.artist_id === profile?.id);
        const avgRating =
          artistReviews && artistReviews.length > 0
            ? artistReviews.reduce((sum, r) => sum + r.rating, 0) / artistReviews.length
            : 0;

        setStats({ totalUploads, totalSales, totalLikes, avgRating, pendingApprovals });
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
      setStats({ totalUploads: 0, totalSales: 0, totalLikes: 0, avgRating: 0, pendingApprovals: 0 });
    }
  };

  const handleUploadArtwork = async (e) => {
    e.preventDefault();
    console.log('Upload button clicked, starting upload process');
    console.log('Current artistProfile:', artistProfile);
    console.log('Current profile:', profile);
    console.log('Profile user_type:', profile?.user_type);

    // Check if user is logged in as artist
    if (!profile || profile.user_type !== 'artist') {
      console.error('User is not logged in as artist');
      alert('Please log in as an artist to upload artworks.');
      return;
    }

    // For new artists, allow upload without artist profile - backend will handle it
    // The artist profile might not exist yet for newly registered artists
    console.log('Proceeding with upload for artist user');

    // Validate required fields
    if (!uploadForm.title || !uploadForm.category || !uploadForm.price) {
      alert('Please fill in all required fields (Title, Category, Price)');
      return;
    }

    if (!uploadForm.image_file && !uploadForm.image_url) {
      alert('Please provide either an image file or image URL');
      return;
    }

    setUploading(true);

    try {
      if (uploadForm.image_file) {
        // File upload
        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('description', uploadForm.description || '');
        formData.append('category', uploadForm.category);
        formData.append('price', uploadForm.price);
        formData.append('image', uploadForm.image_file);

        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
          console.log(key, value);
        }

        const response = await api.uploadArtwork(formData);
        console.log('Upload response:', response);

        // Show success popup message
        alert('Artwork uploaded successfully! 🎨');

        if (response && response.message) {
          alert(response.message);
        } else if (response && response.artwork) {
          alert('Artwork uploaded successfully! 🎨');
        } else {
          alert('Artwork uploaded successfully! 🎨');
        }
      } else {
        // URL upload
        const artistId = artistProfile ? artistProfile.id : profile?.id;
        await api.createArtwork({
          artist_id: artistId,
          title: uploadForm.title,
          description: uploadForm.description || '',
          category: uploadForm.category,
          price: parseFloat(uploadForm.price),
          image_url: uploadForm.image_url,
          status: 'published',
        });
        alert('Artwork uploaded successfully!');
      }

      setShowUploadForm(false);
      setUploadForm({
        title: '',
        description: '',
        category: '',
        medium: '',
        price: '',
        image_file: null,
        image_url: '',
        tags: '',
        size: 'medium',
      });
      fetchArtworks();
      calculateStats();
      refreshProfile(); // Refresh to get updated stats from backend
      window.dispatchEvent(new CustomEvent('artworkUploaded'));
    } catch (error) {
      console.error('Error uploading artwork:', error);
      alert('Failed to upload artwork. Please try again.');
    } finally {
      setUploading(false);
      // Refresh artworks list after upload attempt
      fetchArtworks();
      calculateStats();
    }
  };

  const handleDeleteArtwork = async (id) => {
    if (confirm('Are you sure you want to delete this artwork?')) {
      try {
        await api.deleteArtwork(id);
        fetchArtworks();
        calculateStats();
        refreshProfile(); // Refresh to get updated stats from backend
      } catch (error) {
        console.error('Error deleting artwork:', error);
      }
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl shadow-xl p-8 mb-8" style={{ backgroundImage: 'url(/src/assets/img5.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="flex items-start gap-6">
            <div className="relative w-20 h-20 flex-shrink-0">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.fallback-avatar');
                      if (fallback) fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-20 h-20 bg-gradient-to-br from-amber-400 to-rose-500 rounded-full flex items-center justify-center text-white text-2xl font-bold fallback-avatar ${
                  profile?.profile_picture ? 'hidden' : ''
                }`}
              >
                {profile?.full_name?.[0] || 'A'}
              </div>
              <label
                htmlFor="profile-picture-upload"
                className="absolute bottom-0 right-0 bg-amber-500 hover:bg-amber-600 text-white rounded-full p-1 cursor-pointer transition-colors"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProfilePictureFile(file);
                    // Create a preview URL
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      const dataURL = e.target?.result;
                      try {
                        await api.updateProfile(profile?.id || '', {
                          profile_picture: dataURL,
                        });
                        refreshProfile();
                        setProfilePictureFile(null);
                      } catch (error) {
                        console.error('Error updating profile picture:', error);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="profile-picture-upload"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {artistProfile?.artist_name || profile?.full_name}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {artistProfile?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{artistProfile.location}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Navigate to edit artist profile page
                    const event = new CustomEvent('navigate', { detail: 'edit-artist-profile' });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </button>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Upload className="h-8 w-8 text-amber-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.totalUploads}</span>
            </div>
            <p className="text-gray-600 font-semibold">Total Uploads</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.totalSales}</span>
            </div>
            <p className="text-gray-600 font-semibold">Sales</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Heart className="h-8 w-8 text-rose-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.totalLikes}</span>
            </div>
            <p className="text-gray-600 font-semibold">Likes</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-800">
                {stats.avgRating.toFixed(1)}
              </span>
            </div>
            <p className="text-gray-600 font-semibold">Avg Rating</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-800">{stats.pendingApprovals}</span>
            </div>
            <p className="text-gray-600 font-semibold">Pending</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex gap-4 border-b mb-6">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'portfolio'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'orders'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'reviews'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-600'
              }`}
            >
              Reviews
            </button>
          </div>

          {activeTab === 'portfolio' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Artworks</h2>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Artwork
                </button>
              </div>

              {showUploadForm && (
                <form onSubmit={handleUploadArtwork} className="bg-gray-50 p-6 rounded-lg mb-6">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Artwork Title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                      required
                    />
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="abstract">Abstract</option>
                      <option value="landscapes">Landscapes</option>
                      <option value="portraits">Portraits</option>
                      <option value="mixed media">Mixed Media</option>
                      <option value="digital">Digital</option>
                      <option value="sculpture">Sculpture</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Price"
                      value={uploadForm.price}
                      onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <textarea
                    placeholder="Description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg mb-4"
                    rows={3}
                  />

                  <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg mb-4"
                  />

                  <div className="space-y-4 mb-4">
                    <input
                      type="url"
                      placeholder="Image URL (optional if file is provided)"
                      value={uploadForm.image_url}
                      onChange={(e) => setUploadForm({ ...uploadForm, image_url: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadForm({ ...uploadForm, image_file: e.target.files[0] })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required={!uploadForm.image_url}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadForm({
                          title: '',
                          description: '',
                          category: '',
                          price: '',
                          image_url: '',
                          image_file: null,
                          tags: ''
                        });
                      }}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {artworks.map((artwork) => (
                  <div key={artwork.id} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="h-48 bg-gray-200">
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-1">{artwork.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{artwork.category}</p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-amber-600">
                          ₹{artwork.price.toFixed(2)}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            artwork.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : artwork.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {artwork.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-1 bg-amber-100 text-amber-700 rounded text-sm hover:bg-amber-200">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteArtwork(artwork.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Order History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                          ₹{order.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-600">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && <p className="text-gray-700">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
