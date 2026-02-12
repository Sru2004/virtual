import React from 'react';

const ArtistOrdersTab = ({ orders }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Order History</h3>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No orders yet</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const firstItem = order.items?.[0];
            const artwork = firstItem?.product;
            return (
              <div key={order._id} className="flex justify-between items-center p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <img
                    src={artwork?.image_url || 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg'}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/1266808/pexels-photo-1266808.jpeg';
                    }}
                  />
                  <div>
                    <p className="font-medium">{artwork?.title || 'Artwork'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{order.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      order.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArtistOrdersTab;
