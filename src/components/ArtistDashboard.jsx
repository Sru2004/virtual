import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { MapPin, Award, Calendar, TrendingUp, Palette, DollarSign, Star, ChevronDown, Edit, Trash2, Save, X } from 'lucide-react';
import img5 from '../assets/img5.png';
import Navbar from './Navbar';

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { profile, artistProfile, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [artworks, setArtworks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
  });

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      if (profile?.id) {
        fetchDashboardData();
      }
    }, 30000);

    // Listen for artwork upload events
    const handleArtworkUploaded = () => {
      fetchDashboardData();
    };

    window.addEventListener('artworkUploaded', handleArtworkUploaded);

    return () => {
      clearInterval(interval);
      window.removeEventListener('artworkUploaded', handleArtworkUploaded);
    };
  }, [profile, artistProfile]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching artworks for artist');
      console.log('Profile ID:', profile?.id);
      console.log('Artist Profile ID:', artistProfile?.id);

      // Get all artworks and filter by artist on frontend
      const [artworksRes, ordersRes, reviewsRes] = await Promise.all([
        api.getAllArtworks(),
        api.getOrders(),
        api.getAllReviews(),
      ]);

      console.log('All artworks response:', artworksRes);
      console.log('Number of all artworks received:', artworksRes?.length || 0);

      // Filter artworks by artist ID
      const artistArtworks = artworksRes.filter(artwork =>
        artwork.artist_id === profile?.id || artwork.artist_id === artistProfile?.id
      );
      console.log('Filtered artist artworks:', artistArtworks.length);

      // Filter orders for this artist - orders contain items with products (artworks)
      // We need to check if any item in the order belongs to this artist
      const artistIds = [profile?.id];
      if (artistProfile?.id) artistIds.push(artistProfile.id);
      console.log('Filtering orders with artist IDs:', artistIds);

      const artistOrders = ordersRes.filter(order =>
        order.items && order.items.some(item =>
          item.product && artistIds.includes(item.product.artist_id)
        )
      );
      const artistReviews = reviewsRes.filter(review => artistIds.includes(review.artist_id));

      console.log('Filtered orders:', artistOrders.length);
      console.log('Filtered reviews:', artistReviews.length);

      setArtworks(artistArtworks || []);
      setOrders(artistOrders || []);
      setReviews(artistReviews || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleEditArtwork = (artwork) => {
    setEditingArtwork(artwork.id);
    setEditForm({
      title: artwork.title || '',
      description: artwork.description || '',
      category: artwork.category || '',
      price: artwork.price || '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      await api.updateArtwork(editingArtwork, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        price: parseFloat(editForm.price),
      });
      setEditingArtwork(null);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating artwork:', error);
      alert('Failed to update artwork. Please try again.');
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      await api.deleteArtwork(artworkId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Failed to delete artwork. Please try again.');
    }
  };

  const stats = {
    yearsExperience: artistProfile?.years_experience || 5,
    exhibitions: artistProfile?.exhibitions || 12,
    awards: artistProfile?.awards_won || 8,
    artworksSold: orders.filter(order => order.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Header/Profile Section */}
      <div className="shadow-sm border-b w-full h-64 sm:h-80 lg:h-96" style={{ backgroundImage: `url(${img5})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden">
                {profile?.profile_picture ? (
                  <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.full_name?.[0] || 'A'}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile?.full_name || 'Artist Name'}</h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{artistProfile?.location || 'Location'}</span>
                </div>
              </div>
            </div>
            {/* User Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                  {profile?.profile_picture ? (
                    <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {profile?.full_name?.[0] || 'A'}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/artist/profile/edit');
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        navigate('/');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.yearsExperience}</p>
                  <p className="text-sm text-gray-600">AR Experience</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Award className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.exhibitions}</p>
                  <p className="text-sm text-gray-600">Exhibitions</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.awards}</p>
                  <p className="text-sm text-gray-600">Awards Won</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Palette className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.artworksSold}</p>
                  <p className="text-sm text-gray-600">Artworks Sold</p>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Tabs */}
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {['overview', 'artworks', 'sales', 'analytics'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 3).map((order) => {
                      const artwork = artworks.find(a => a.id === order.artwork_id);
                      return (
                        <div key={order.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <img
                            src={artwork?.image_url || ''}
                            alt=""
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{artwork?.title || 'Artwork'}</p>
                            <p className="text-sm text-gray-600">Sold for ₹{order.amount}</p>
                          </div>
                          <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'artworks' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">My Artworks</h3>
                  {artworks.length === 0 ? (
                    <p className="text-gray-500">No artworks uploaded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {artworks.map((art) => (
                        <div key={art.id} className="bg-white rounded-lg overflow-hidden shadow-sm border relative group">
                          <img
                            src={art.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
                            alt={art.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                            }}
                          />

                          {/* Hover overlay with edit/delete buttons */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditArtwork(art)}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
                                title="Edit artwork"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteArtwork(art.id)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                                title="Delete artwork"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="p-4">
                            {editingArtwork === art.id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Title"
                                />
                                <textarea
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  placeholder="Description"
                                  rows="2"
                                />
                                <input
                                  type="text"
                                  value={editForm.category}
                                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Category"
                                />
                                <input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Price"
                                  step="0.01"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md transition-colors flex items-center justify-center"
                                  >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingArtwork(null)}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md transition-colors flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-semibold text-lg">{art.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{art.description || 'No description'}</p>
                                <p className="text-sm text-purple-600 capitalize">{art.category || 'General'}</p>
                                <p className="text-lg font-bold text-gray-900 mt-2">₹{Number(art.price).toLocaleString("en-IN")}</p>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'sales' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sales History</h3>
                  <div className="space-y-4">
                    {orders.map((order) => {
                      // For orders with multiple items, show the first artwork
                      const firstItem = order.items?.[0];
                      const artwork = firstItem?.product;
                      return (
                        <div key={order._id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <img
                              src={artwork?.image_url || ''}
                              alt=""
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                              }}
                            />
                            <div>
                              <p className="font-medium">{artwork?.title || 'Artwork'}</p>
                              <p className="text-sm text-gray-600">{new Date(order.order_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="font-semibold">₹{order.amount}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'analytics' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
                      <p className="text-2xl font-bold">{artworks.length}</p>
                      <p className="text-sm text-gray-600">Total Artworks</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <DollarSign className="w-8 h-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold">₹{orders.reduce((sum, o) => sum + o.amount, 0)}</p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>
      </div>



    </div>
  );
};

export default ArtistDashboard;
