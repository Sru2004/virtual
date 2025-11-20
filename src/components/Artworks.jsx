import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Trash2, Filter, Search, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const Artworks = () => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const response = await api.getAllArtworks();
      setArtworks(response);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast.error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveArtwork = async (artworkId) => {
    try {
      await api.updateArtwork(artworkId, { status: 'published' });
      toast.success('Artwork approved successfully');
      fetchArtworks();
    } catch (error) {
      console.error('Error approving artwork:', error);
      toast.error('Failed to approve artwork');
    }
  };

  const handleRejectArtwork = async (artworkId) => {
    try {
      await api.updateArtwork(artworkId, { status: 'rejected' });
      toast.success('Artwork rejected');
      fetchArtworks();
    } catch (error) {
      console.error('Error rejecting artwork:', error);
      toast.error('Failed to reject artwork');
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      try {
        await api.deleteArtwork(artworkId);
        toast.success('Artwork deleted successfully');
        fetchArtworks();
      } catch (error) {
        console.error('Error deleting artwork:', error);
        toast.error('Failed to delete artwork');
      }
    }
  };

  const filteredArtworks = artworks.filter(artwork => {
    const matchesFilter = filter === 'all' || artwork.status === filter;
    const matchesSearch = artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artwork.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openArtworkModal = (artwork) => {
    setSelectedArtwork(artwork);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedArtwork(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading artworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Artwork Management</h1>
        <div className="text-sm text-gray-600">
          Total: {artworks.length} |
          Pending: {artworks.filter(a => a.status === 'pending').length} |
          Published: {artworks.filter(a => a.status === 'published').length} |
          Rejected: {artworks.filter(a => a.status === 'rejected').length}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search artworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'published', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Artworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredArtworks.map((artwork) => (
          <div key={artwork.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 relative">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                }}
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  artwork.status === 'published' ? 'bg-green-100 text-green-800' :
                  artwork.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  artwork.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {artwork.status}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-800 mb-1 truncate">{artwork.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{artwork.category}</p>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-blue-600">₹{artwork.price?.toFixed(2)}</span>
                <div className="flex items-center gap-1">
                  {artwork.ar_enabled && <ImageIcon className="h-4 w-4 text-purple-600" title="AR Enabled" />}
                  {artwork.ar_file_url && <FileText className="h-4 w-4 text-blue-600" title="AR File Available" />}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openArtworkModal(artwork)}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center justify-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
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
                <button
                  onClick={() => handleDeleteArtwork(artwork.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Artwork Details Modal */}
      {showModal && selectedArtwork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Artwork Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedArtwork.image_url}
                    alt={selectedArtwork.title}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedArtwork.title}</h3>
                    <p className="text-gray-600">{selectedArtwork.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Price</p>
                      <p className="text-lg font-bold text-blue-600">₹{selectedArtwork.price?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedArtwork.status === 'published' ? 'bg-green-100 text-green-800' :
                        selectedArtwork.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedArtwork.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedArtwork.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-gray-600">{selectedArtwork.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">AR Enabled</p>
                      <p className="text-gray-600">{selectedArtwork.ar_enabled ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">AR File</p>
                      <p className="text-gray-600">{selectedArtwork.ar_file_url ? 'Available' : 'Not Available'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Artist</p>
                    <p className="text-gray-600">Artist ID: {selectedArtwork.artist_id}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-gray-600">{new Date(selectedArtwork.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t mt-6">
                {selectedArtwork.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveArtwork(selectedArtwork.id);
                        closeModal();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Artwork
                    </button>
                    <button
                      onClick={() => {
                        handleRejectArtwork(selectedArtwork.id);
                        closeModal();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Artwork
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    handleDeleteArtwork(selectedArtwork.id);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Artwork
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Artworks;
