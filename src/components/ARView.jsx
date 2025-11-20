import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const ARView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setIsLoading(true);
        const artworkData = await api.getArtwork(id);
        setArtwork(artworkData);
      } catch (error) {
        console.error('Error fetching artwork:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchArtwork();
    }
  }, [id]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleBack = () => {
    navigate(`/artwork-details/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-white text-black rounded-lg shadow-lg hover:bg-gray-200 transition-colors"
      >
        ← Back
      </button>

      {/* AR Preview Container - Full Width */}
      <div className="w-full px-4 py-8">
        <div className="bg-white shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold text-center">AR Preview</h1>
            <p className="text-center text-purple-100 mt-2 text-lg">
              Experience "{artwork?.title || 'Artwork'}" in Augmented Reality
            </p>
          </div>

          {/* Artwork Display */}
          <div className="p-8">
            <div className="flex flex-col items-center space-y-8">
              {/* Artwork Image - Larger Display */}
              <div className="relative bg-gray-50 rounded-lg p-6 shadow-inner w-full max-w-2xl">
                {isLoading && (
                  <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
                  </div>
                )}

                {!hasError && artwork ? (
                  <img
                    src={artwork.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
                    alt={artwork.title || "Artwork for AR placement"}
                    className={`w-full max-h-96 object-contain rounded-lg shadow-md transition-opacity duration-300 ${
                      isLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-xl">{hasError ? 'Failed to load artwork' : 'Artwork preview not available'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* AR Instructions */}
              <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">
                    Ready for AR Placement
                  </h3>
                  <p className="text-blue-700 text-lg">
                    This artwork is prepared and ready to be placed on your wall using augmented reality.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-green-900 mb-3">
                    How to Use in AR
                  </h3>
                  <ul className="text-green-700 text-lg space-y-2">
                    <li>• Open this page on your mobile device</li>
                    <li>• Point your camera at a wall or surface</li>
                    <li>• Tap to place the artwork</li>
                    <li>• Move and resize as needed</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-6">
                <button
                  onClick={handleBack}
                  className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-lg font-medium"
                >
                  Back to Artwork
                </button>
                <button
                  onClick={() => {
                    // For mobile AR, we could add WebXR support here
                    alert('For full AR experience, please use a mobile device with AR support and point your camera at a wall.');
                  }}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
                >
                  Start AR Experience
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARView;
