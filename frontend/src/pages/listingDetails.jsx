import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import CommentSection from '../components/CommentSection/CommentSection';
import { listingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await listingAPI.getById(id);
      setListing(response.data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await listingAPI.delete(id);
      toast.success('Listing deleted!');
      navigate('/home');
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  const handleContactSeller = () => {
    navigate(`/messages?user=${listing.email}`);
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

  if (!listing) return null;

  const isOwner = user?.email === listing.email;
  const image = listing.imageUrl;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-8 lg:px-20 py-8 max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {image ? (
                <img
                  src={image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="inline-block bg-gray-100 text-black text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-3">
                    {listing.type}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mb-2">{listing.title}</h1>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Price</p>
                <p className="text-4xl font-black">
                  {listing.sellListing?.price ? `Rs ${listing.sellListing.price}` : 
                   listing.rentListing?.pricePerHour ? `Rs ${listing.rentListing.pricePerHour}/hr` : 
                   'Negotiable'}
                </p>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{listing.description}</p>
              </div>

              {isOwner ? (
                <div className="space-y-3">
                  <button
                    onClick={handleDelete}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                  >
                    Delete Listing
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleContactSeller}
                  className="w-full bg-black text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                  Contact Seller
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <CommentSection listingId={id} />
        </div>
      </main>
    </div>
  );
}

export default ListingDetailsPage;
