
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
            const buyer = order.user_id;
            const address = order.address;
            return (
              <div key={order._id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
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
                    <p className="font-semibold">₹{order.total_amount || order.amount}</p>
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
                
                {/* Buyer Personal Details */}
                {buyer && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Buyer Details:</p>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {buyer.full_name || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {buyer.email || 'N/A'}</p>
                      {address && (
                        <>
                          <p><span className="font-medium">Phone:</span> {address.phone || 'N/A'}</p>
                          <p><span className="font-medium">Address:</span> {address.firstName} {address.lastName}, {address.street}, {address.city}, {address.state}, {address.country}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArtistOrdersTab;
