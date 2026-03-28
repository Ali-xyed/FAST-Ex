import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function ExchangeRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch exchange requests from API
    // Placeholder data for now
    setRequests([
      {
        id: '1',
        requesterEmail: 'requester@lhr.nu.edu.pk',
        requesterName: 'Jane Smith',
        requesterImage: null,
        myListingTitle: 'Gaming Laptop',
        myListingImage: null,
        offeredItem: {
          title: 'iPhone 13 Pro',
          description: 'Excellent condition, 256GB, with original box and accessories',
          image: null,
        },
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
    ]);
    setLoading(false);
  }, []);

  const handleAccept = async (requestId) => {
    try {
      // TODO: Call API to accept exchange request
      toast.success('Exchange request accepted! Contact the user.');
      // Optionally navigate to messages
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      // TODO: Call API to reject exchange request
      toast.success('Exchange request rejected');
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (error) {
      toast.error('Failed to reject request');
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
                      {request.requesterImage ? (
                        <img src={request.requesterImage} alt={request.requesterName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold">{request.requesterName?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-black text-blue-600">{request.requesterName}</p>
                      <p className="text-xs text-gray-400 font-medium">{request.requesterEmail}</p>
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mt-3">
                    wants to exchange an item with your listing <span className="font-black">"{request.myListingTitle}"</span>
                  </p>
                </div>

                {/* Exchange Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Your Item */}
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Item</p>
                      <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {request.myListingImage ? (
                          <img src={request.myListingImage} alt={request.myListingTitle} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-black">{request.myListingTitle}</p>
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
                        {request.offeredItem.image ? (
                          <img src={request.offeredItem.image} alt={request.offeredItem.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-black mb-2">{request.offeredItem.title}</p>
                      <p className="text-xs text-gray-600 font-medium line-clamp-2">{request.offeredItem.description}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
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
