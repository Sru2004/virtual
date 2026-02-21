import React from 'react';
import { Upload, Star, ShoppingBag } from 'lucide-react';

const ArtistStatsCards = ({ stats }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-200 p-4 rounded-lg shadow-2xl border border-amber-600">
          <div className="flex items-center">
            <Upload className="w-8 h-8 text-amber-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUploads}</p>
              <p className="text-sm text-gray-600">Total Uploads</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRating && stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '0.0'}
              </p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-200 p-4 rounded-lg shadow-2xl border border-amber-600">
          <div className="flex items-center">
            <ShoppingBag className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              <p className="text-sm text-gray-600">Orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistStatsCards;
