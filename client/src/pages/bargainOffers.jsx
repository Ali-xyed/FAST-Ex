import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import { listingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function BargainOffersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const bargainId = searchParams.get('bargainId');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBargainOffers();
  }, [bargainId]);

  const fetchBargainOffers = async () => {
    try {
      if (bargainId) {
        const response = await listingAPI.getBargainById(bargainId);
        setOffers([response.data]);
      } else {
        const response = await listingAPI.getAllBargains();
        setOffers(response.data);
      }
    } catch (error) {
      toast.error('Failed to load bargain offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bargainId) => {
    try {
      await listingAPI.respondBargain(bargainId, { status: 'ACCEPTED' });
      toast.success('Offer accepted! You can now message the buyer.');
      fetchBargainOffers(); // Refresh list
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error(error.response?.data?.message || 'Failed to accept offer');
    }
  };

  const handleReject = async (bargainId) => {
    try {
      await listingAPI.respondBargain(bargainId, { status: 'DECLINED' });
      toast.success('Offer declined');
      fetchBargainOffers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline offer');
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

      <main className="px-8 lg:px-20 py-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight mb-8">Bargain Offers</h1>

        {offers.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-12 text-center">
            <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 font-medium">No bargain offers yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                <div className="flex items-start gap-6">
                  {/* Buyer Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {offer.requesterImageUrl ? (
                        <img src={offer.requesterImageUrl} alt={offer.requesterName || offer.fromEmail} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold">{(offer.requesterName || offer.fromEmail)?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-black text-blue-600">{offer.requesterName || offer.fromEmail}</p>
                      {offer.requesterName && (
                        <p className="text-xs text-gray-400 font-medium mb-1">{offer.fromEmail}</p>
                      )}
                      <p className="text-sm text-gray-600 font-medium">
                        offered a bargain on your listing
                      </p>
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Listing</p>
                    <p className="text-lg font-black mb-2">{offer.listing?.title}</p>
                    <div className="flex items-center gap-3 justify-end mb-3">
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Original</p>
                        <p className="text-sm font-bold text-gray-500 line-through">
                          Rs {offer.listing?.sellListing?.price || offer.listing?.rentListing?.pricePerHour}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">Offered</p>
                        <p className="text-2xl font-black text-green-600">Rs {offer.price}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {offer.status === 'PENDING' && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleAccept(offer.id)}
                      className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-green-600 transition-all"
                    >
                      Accept & Contact
                    </button>
                    <button
                      onClick={() => handleReject(offer.id)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {offer.status === 'ACCEPTED' && (
                  <div className="mt-6 p-3 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                    <p className="text-sm font-black text-green-600 uppercase tracking-wider">Accepted</p>
                  </div>
                )}
                {offer.status === 'DECLINED' && (
                  <div className="mt-6 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-center">
                    <p className="text-sm font-black text-red-600 uppercase tracking-wider">Declined</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default BargainOffersPage;
