import React from 'react';
import { Upload, DollarSign, Heart, Star, Clock } from 'lucide-react';

const ArtistStatsCards = ({ stats }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              <p className="text-sm text-gray-600">Sales</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-200 p-4 rounded-lg shadow-2xl border border-amber-600">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-rose-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
              <p className="text-sm text-gray-600">Likes</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-200 p-4 rounded-lg shadow-2xl border border-amber-600">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistStatsCards;
