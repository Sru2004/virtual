import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Users,
  Image,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  Bell,
  MessageSquare,
  Shield,
  LogOut,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, User, Artwork, Order, Review } from '../lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdminDashboard = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const path = location.pathname;
    const section = path.split('/admin/')[1] || 'overview';
    // If no section specified, default to overview
    if (!section || section === '') {
      setActiveSection('overview');
    } else {
      setActiveSection(section);
    }
  }, [location.pathname]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalArtworks: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      fetchDashboardData();

      // Set up real-time updates every 5 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 5000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats - for admin, we need to get all data
      const [usersRes, artworksRes, ordersRes, reviewsRes] = await Promise.all([
        api.getAllUsersAdmin(),
        api.getAllArtworksAdmin(),
        api.getAllOrdersAdmin(),
        api.getAllReviewsAdmin(),
      ]);

      console.log('API Responses:', { usersRes, artworksRes, ordersRes, reviewsRes });

      const totalRevenue = ordersRes.reduce((sum, order) => sum + (order.total_amount || order.amount || 0), 0);
      const totalArtists = usersRes.filter(user => user.user_type === 'artist').length;

      console.log('Calculated Stats:', {
        totalUsers: usersRes.length,
        totalArtists,
        totalArtworks: artworksRes.length,
        totalOrders: ordersRes.length,
        totalRevenue,
      });

      setStats({
        totalUsers: usersRes.length,
        totalArtists,
        totalArtworks: artworksRes.length,
        totalOrders: ordersRes.length,
        totalRevenue,
      });

      // Fetch detailed data for management
      setUsers(usersRes);
      setArtworks(artworksRes);
      setOrders(ordersRes);
      setReviews(reviewsRes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Optionally set error state here if needed
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'artworks', label: 'Artwork Management', icon: Image },
    { id: 'exhibitions', label: 'Exhibitions', icon: Image },
    { id: 'transactions', label: 'Transactions', icon: ShoppingCart },
    { id: 'reviews', label: 'Review Moderation', icon: MessageSquare },
    { id: 'certificates', label: 'Certificates', icon: Shield },
    { id: 'arvr', label: 'AR/VR Wall', icon: Eye },
    { id: 'ai-insights', label: 'AI Insights', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'maintenance', label: 'Maintenance', icon: Settings },
  ];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    </div>
  );

  const renderOverview = () => {
    // Calculate real user growth data by month
    const userGrowthData = users.reduce((acc, user) => {
      const date = new Date(user.created_at);
      const month = date.toLocaleString('default', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.users += 1;
      } else {
        acc.push({ month, users: 1 });
      }
      return acc;
    }, []).sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

    // Calculate real sales data by month
    const salesData = orders.reduce((acc, order) => {
      const date = new Date(order.order_date || order.created_at);
      const month = date.toLocaleString('default', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.sales += order.total_amount;
      } else {
        acc.push({ month, sales: order.total_amount });
      }
      return acc;
    }, []).sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

    const artworkStatusData = [
      { name: 'Published', value: artworks.filter(a => a.status === 'published').length, color: '#10B981' },
      { name: 'Pending', value: artworks.filter(a => a.status === 'pending').length, color: '#F59E0B' },
      { name: 'Sold', value: artworks.filter(a => a.status === 'sold').length, color: '#EF4444' },
      { name: 'Rejected', value: artworks.filter(a => a.status === 'rejected').length, color: '#EF4444' },
    ].filter(item => item.value > 0); // Only show statuses with data

    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-50" />
          <StatCard title="Total Artists" value={stats.totalArtists} icon={Users} color="bg-purple-50" />
          <StatCard title="Total Artworks" value={stats.totalArtworks} icon={Image} color="bg-green-50" />
          <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} color="bg-orange-50" />
          <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-yellow-50" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Artwork Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Artwork Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={artworkStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {artworkStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.user_type === 'admin' ? 'bg-red-100 text-red-800' :
                      user.user_type === 'artist' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleApproveArtwork = async (artworkId) => {
    try {
      await api.updateArtwork(artworkId, { status: 'published' });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error approving artwork:', error);
    }
  };

  const handleRejectArtwork = async (artworkId) => {
    try {
      await api.updateArtwork(artworkId, { status: 'rejected' });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting artwork:', error);
    }
  };

  const renderArtworks = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Artwork Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.map((artwork) => (
          <div key={artwork.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-800 mb-1">{artwork.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{artwork.category}</p>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-blue-600">₹{artwork.price.toFixed(2)}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  artwork.status === 'published' ? 'bg-green-100 text-green-700' :
                  artwork.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {artwork.status}
                </span>
              </div>
              <div className="flex gap-2">
                {artwork.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApproveArtwork(artwork.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectArtwork(artwork.id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}
                <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction Management</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    User {order.user_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₹{order.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.order_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">View</button>
                    <button className="text-yellow-600 hover:text-yellow-900">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Review Moderation</h1>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-800">User {review.user_id.slice(0, 8)}...</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                  Approve
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                  Reject
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Artwork: {review.artwork_id.slice(0, 8)}... • {new Date(review.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Analytics</h3>
          <p className="text-gray-600">Detailed revenue charts and metrics will be displayed here.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Engagement</h3>
          <p className="text-gray-600">User engagement metrics and trends will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderExhibitions = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Exhibition Management</h1>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Create and manage art exhibitions</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Exhibition
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600">Exhibition list and management tools will be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Certificate Management</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Certificates</h3>
            <p className="text-gray-600 mb-4">Create digital certificates for approved artworks</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Generate Certificate
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Watermark Management</h3>
            <p className="text-gray-600 mb-4">Add or remove watermarks for image protection</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Manage Watermarks
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Certificate Verification</h3>
            <p className="text-gray-600 mb-4">Verify certificate authenticity via QR codes</p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Verify Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderARVR = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">AR/VR Wall Management</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Artwork Selection</h3>
            <p className="text-gray-600 mb-4">Control which artworks appear in AR wall preview</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Select Artworks
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scene Configuration</h3>
            <p className="text-gray-600 mb-4">Adjust scaling, lighting, and positioning</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Configure Scene
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">3D Sculpture Views</h3>
          <p className="text-gray-600">Enable 360° sculpture views and AR scene configurations</p>
        </div>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">AI Insights & Recommendations</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Trending Artworks</h3>
            <p className="text-gray-600 mb-4">View AI-generated insights on popular artworks</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              View Trends
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Collections</h3>
            <p className="text-gray-600 mb-4">Manage AI-suggested art collections</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Manage Collections
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Engagement Analytics</h3>
          <p className="text-gray-600">Analyze viewing patterns and user engagement</p>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Notifications & Announcements</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Notifications</h3>
            <p className="text-gray-600 mb-4">Send notifications to users or artists</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Send Notification
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Announcements</h3>
            <p className="text-gray-600 mb-4">Publish system-wide announcements</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Create Announcement
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Scheduled Alerts</h3>
          <p className="text-gray-600">Schedule exhibition or sale alerts and manage notification history</p>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Settings & Permissions</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sub-Admin Management</h3>
            <p className="text-gray-600 mb-4">Create or remove sub-admin accounts</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Manage Sub-Admins
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Role-Based Access</h3>
            <p className="text-gray-600 mb-4">Set role-based access control (RBAC)</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Configure Roles
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Configuration</h3>
          <p className="text-gray-600">Change admin credentials, update themes, limits, and API keys</p>
        </div>
      </div>
    </div>
  );

  const renderMaintenance = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">System Maintenance</h1>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup & Security</h3>
            <p className="text-gray-600 mb-4">Generate backups and enable 2FA</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Manage Backups
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Cleanup</h3>
            <p className="text-gray-600 mb-4">Clear old or unused data and cache</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Clean Data
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Diagnostics</h3>
            <p className="text-gray-600 mb-4">Run diagnostic checks and update versions</p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Run Diagnostics
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Monitoring</h3>
          <p className="text-gray-600">Monitor suspicious activity and admin login logs</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg">Access denied. Admin privileges required.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Admin Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  <Shield className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
                <p className="text-sm text-gray-600">Welcome, {profile?.full_name?.split(' ')[0]}</p>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2 mb-6">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === `/admin/${item.id}`;
                  return (
                    <Link
                      key={item.id}
                      to={`/admin/${item.id}`}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              {activeSection === 'overview' && renderOverview()}
              {activeSection === 'users' && renderUsers()}
              {activeSection === 'artworks' && renderArtworks()}
              {activeSection === 'exhibitions' && renderExhibitions()}
              {activeSection === 'transactions' && renderTransactions()}
              {activeSection === 'reviews' && renderReviews()}
              {activeSection === 'certificates' && renderCertificates()}
              {activeSection === 'arvr' && renderARVR()}
              {activeSection === 'ai-insights' && renderAIInsights()}
              {activeSection === 'analytics' && renderAnalytics()}
              {activeSection === 'notifications' && renderNotifications()}
              {activeSection === 'settings' && renderSettings()}
              {activeSection === 'maintenance' && renderMaintenance()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
