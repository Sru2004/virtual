import React from 'react';

const ArtistOverviewTab = ({ orders, artworks }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {orders.slice(0, 5).map((order) => {
          const artwork = order.items?.[0]?.product;
          return (
            <div key={order._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={artwork?.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
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
              <span className="text-sm text-gray-500">
                {new Date(order.order_date || order.created_at).toLocaleDateString()}
              </span>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="text-gray-500 text-center py-8">No recent orders yet</p>
        )}
      </div>
    </div>
  );
};

export default ArtistOverviewTab;
