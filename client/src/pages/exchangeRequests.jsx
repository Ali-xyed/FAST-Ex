import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { listingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function ExchangeRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const exchangeId = searchParams.get('exchangeId');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExchangeRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeId]);

  const fetchExchangeRequests = async () => {
    try {
      if (exchangeId) {
        // Fetch single exchange request
        const response = await listingAPI.getExchangeById(exchangeId);
        setRequests([response.data]);
      } else {
        // Fetch all exchange requests
        const response = await listingAPI.getAllExchanges();
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Error fetching exchange requests:', error);
      toast.error('Failed to load exchange requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (exchangeId) => {
    try {
      await listingAPI.respondExchange(exchangeId, { status: 'ACCEPTED' });
      toast.success('Exchange request accepted! You can now message the user.');
      fetchExchangeRequests(); // Refresh list
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (exchangeId) => {
    try {
      await listingAPI.respondExchange(exchangeId, { status: 'REJECTED' });
      toast.success('Exchange request rejected');
      fetchExchangeRequests(); // Refresh list
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-8 lg:px-20 py-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight mb-8">Exchange Requests</h1>

        {requests.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center">
            <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-gray-400 font-medium">No exchange requests yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b-2 border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {request.requesterImageUrl ? (
                        <img src={request.requesterImageUrl} alt={request.requesterName || request.fromEmail} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold">{(request.requesterName || request.fromEmail)?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-black text-blue-600">{request.requesterName || request.fromEmail}</p>
                      {request.requesterName && (
                        <p className="text-xs text-gray-400 font-medium">{request.fromEmail}</p>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mt-3">
                    wants to exchange <span className="font-black">"{request.offerTitle}"</span> with your listing <span className="font-black">"{request.listing?.title}"</span>
                  </p>
                </div>

                {/* Exchange Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Your Item */}
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Item</p>
                      <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {request.listing?.imageUrl ? (
                          <img src={request.listing.imageUrl} alt={request.listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-black mb-2">{request.listing?.title}</p>
                      <p className="text-xs text-gray-600 font-medium line-clamp-2">{request.listing?.description}</p>
                    </div>

                    {/* Exchange Icon */}
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>

                    {/* Offered Item */}
                    <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Offered Item</p>
                      <div className="aspect-square bg-white rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {request.offerImageUrl ? (
                          <img src={request.offerImageUrl} alt={request.offerTitle || 'Offered item'} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-black mb-2 text-gray-900">{request.offerTitle}</p>
                      <p className="text-xs text-gray-600 font-medium line-clamp-3">{request.offerDescription}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'PENDING' && (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-green-600 transition-all"
                      >
                        Accept & Contact
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {request.status === 'ACCEPTED' && (
                    <div className="mt-6 p-3 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                      <p className="text-sm font-black text-green-600 uppercase tracking-wider">Accepted</p>
                    </div>
                  )}
                  {request.status === 'REJECTED' && (
                    <div className="mt-6 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-center">
                      <p className="text-sm font-black text-red-600 uppercase tracking-wider">Rejected</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ExchangeRequestsPage;
