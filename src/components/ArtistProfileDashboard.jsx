import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import Navbar from './Navbar';
import ArtistHeader from './ArtistHeader';
import ArtistStatsCards from './ArtistStatsCards';
import ArtistOverviewTab from './ArtistOverviewTab';
import ArtistArtworksTab from './ArtistArtworksTab';
import ArtistOrdersTab from './ArtistOrdersTab';
import ArtistReviewsTab from './ArtistReviewsTab';

const ArtistProfileDashboard = () => {
  const { profile, artistProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [artworks, setArtworks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalSales: 0,
    totalLikes: 0,
    avgRating: 0,
    pendingApprovals: 0,
  });


  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
      refreshProfile(); // Refresh to get latest artist profile data
    }

    // Listen for artwork upload events
    const handleArtworkUploaded = () => {
      console.log('Artwork uploaded event received, refreshing data');
      fetchDashboardData();
      refreshProfile();
    };

    window.addEventListener('artworkUploaded', handleArtworkUploaded);

    return () => {
      window.removeEventListener('artworkUploaded', handleArtworkUploaded);
    };
  }, [profile?.id]); // Only depend on profile.id to avoid unnecessary re-renders

  const fetchDashboardData = async () => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    console.log('Fetching dashboard data for artist');
    console.log('Profile ID:', profile?.id);
    console.log('Artist Profile ID:', artistProfile?.id);

    setLoading(true);
    setError(null);

    const artistIds = [profile?.id];
    if (artistProfile?.id) artistIds.push(artistProfile.id);

    let artworks = [];
    let orders = [];
    let reviews = [];

    try {
      // Fetch artworks
      try {
        const artworksRes = await api.getMyArtworks();
        console.log('My artworks response:', artworksRes);
        
        // Normalize response - handle different response structures
        if (Array.isArray(artworksRes)) {
          artworks = artworksRes;
        } else if (artworksRes?.artworks && Array.isArray(artworksRes.artworks)) {
          artworks = artworksRes.artworks;
        } else if (artworksRes?.data && Array.isArray(artworksRes.data)) {
          artworks = artworksRes.data;
        } else {
          artworks = [];
        }
        
        console.log('My artworks count:', artworks.length);
        setArtworks(artworks);
      } catch (error) {
        console.error('Error fetching artworks:', error);
        setArtworks([]);
      }

      // Fetch orders with proper defensive coding
      try {
        const ordersRes = await api.getOrders();
        console.log('Orders response:', ordersRes);
        
        // Normalize response - handle different response structures
        let allOrders = [];
        if (Array.isArray(ordersRes)) {
          allOrders = ordersRes;
        } else if (ordersRes?.orders && Array.isArray(ordersRes.orders)) {
          allOrders = ordersRes.orders;
        } else if (ordersRes?.data && Array.isArray(ordersRes.data)) {
          allOrders = ordersRes.data;
        } else if (ordersRes?.success && ordersRes?.orders) {
          allOrders = Array.isArray(ordersRes.orders) ? ordersRes.orders : [];
        } else {
          allOrders = [];
        }

        // Safe filtering with defensive checks
        orders = allOrders.filter(order => {
          try {
            return order?.items && Array.isArray(order.items) && order.items.some(item => {
              try {
                return item?.product && artistIds.includes(item.product.artist_id);
              } catch (err) {
                console.error('Error processing order item:', err);
                return false;
              }
            });
          } catch (err) {
            console.error('Error processing order:', err);
            return false;
          }
        });

        console.log('Filtered artist orders count:', orders.length);
        setOrders(orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        console.error('Error details:', error.message, error.stack);
        setOrders([]);
      }

      // Fetch reviews with proper error handling
      try {
        const reviewsRes = await api.getAllReviews();
        console.log('Reviews response:', reviewsRes);
        
        // Normalize response - handle different response structures
        let allReviews = [];
        if (Array.isArray(reviewsRes)) {
          allReviews = reviewsRes;
        } else if (reviewsRes?.reviews && Array.isArray(reviewsRes.reviews)) {
          allReviews = reviewsRes.reviews;
        } else if (reviewsRes?.data && Array.isArray(reviewsRes.data)) {
          allReviews = reviewsRes.data;
        } else if (reviewsRes?.success && reviewsRes?.reviews) {
          allReviews = Array.isArray(reviewsRes.reviews) ? reviewsRes.reviews : [];
        } else {
          allReviews = [];
        }

        // Safe filtering
        reviews = allReviews.filter(review => {
          try {
            return review && artistIds.includes(review.artist_id);
          } catch (err) {
            console.error('Error processing review:', err);
            return false;
          }
        });

        console.log('Filtered artist reviews count:', reviews.length);
        setReviews(reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        console.error('Error details:', error.message, error.stack);
        setReviews([]);
      }

      // Calculate stats
      try {
        calculateStats(artworks, orders, reviews);
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const calculateStats = (artworkData, orderData, reviewData) => {
    try {
      const totalUploads = artworkData?.length || 0;
      const totalLikes = artworkData?.reduce((sum, art) => sum + (art.likes_count || 0), 0) || 0;
      const pendingApprovals = artworkData?.filter((art) => art.status === 'pending').length || 0;

      let totalSales = 0;
      let avgRating = 0;

      if (artistProfile) {
        totalSales = artistProfile.total_sales || orderData?.filter(o => o.status === 'completed').length || 0;
        avgRating = artistProfile.avg_rating || 0;
      } else {
        totalSales = orderData?.filter(o => o.status === 'completed').length || 0;
        if (reviewData && reviewData.length > 0) {
          avgRating = reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length;
        }
      }

      setStats({ totalUploads, totalSales, totalLikes, avgRating, pendingApprovals });
    } catch (error) {
      console.error('Error calculating stats:', error);
      setStats({ totalUploads: 0, totalSales: 0, totalLikes: 0, avgRating: 0, pendingApprovals: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Profile Header Section */}
      <ArtistHeader
        profile={profile}
        artistProfile={artistProfile}
        onProfilePictureUpdate={() => {
          refreshProfile();
          fetchDashboardData();
        }}
      />

      {/* Stats Cards */}
      <ArtistStatsCards stats={stats} />

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading dashboard data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation and Content */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
              {['overview', 'artworks', 'orders', 'reviews'].map((tab) => (
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
            {activeTab === 'overview' && <ArtistOverviewTab orders={orders} artworks={artworks} />}

            {activeTab === 'artworks' && (
              <ArtistArtworksTab
                artworks={artworks}
                profile={profile}
                artistProfile={artistProfile}
                onArtworkDeleted={(artworkId) => {
                  if (artworkId) {
                    setArtworks(prev => prev.filter(art => (art._id || art.id) !== artworkId));
                  }
                  fetchDashboardData();
                }}
                onArtworkUploaded={() => {
                  console.log('onArtworkUploaded called, dispatching artworkUploaded event');
                  window.dispatchEvent(new CustomEvent('artworkUploaded'));
                }}
              />
            )}

            {activeTab === 'orders' && <ArtistOrdersTab orders={orders} />}

            {activeTab === 'reviews' && <ArtistReviewsTab reviews={reviews} />}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default ArtistProfileDashboard;
