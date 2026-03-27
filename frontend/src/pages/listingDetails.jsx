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
  const { profile } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchListing();
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

  const handleMarkAsSold = async () => {
    try {
      await listingAPI.markAsSold(id);
      toast.success('Listing marked as sold!');
      fetchListing();
    } catch (error) {
      toast.error('Failed to mark as sold');
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
    navigate(`/messages?user=${listing.seller.email}`);
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

  const isOwner = profile?.email === listing.seller?.email;
  const images = listing.images || [];

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
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 ${currentImageIndex === index ? 'border-black' : 'border-gray-200'}`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{listing.category}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Price</p>
                <p className="text-4xl font-black">
                  {listing.price ? `Rs ${listing.price}` : 'Negotiable'}
                </p>
                {listing.bargaining && (
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-2">
                    ✓ Bargaining allowed
                  </p>
                )}
              </div>

              <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{listing.description}</p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {listing.seller?.imageUrl ? (
                    <img src={listing.seller.imageUrl} alt={listing.seller.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{listing.seller?.name?.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-black">{listing.seller?.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{listing.seller?.rollNo}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-black font-black text-[11px]">★</span>
                    <span className="text-[10px] font-bold">{listing.seller?.reputationScore || 0}</span>
                  </div>
                </div>
              </div>

              {isOwner ? (
                <div className="space-y-3">
                  {listing.status !== 'SOLD' && (
                    <button
                      onClick={handleMarkAsSold}
                      className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                    >
                      Mark as Sold
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/edit-listing/${id}`)}
                    className="w-full bg-gray-100 text-black py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Edit Listing
                  </button>
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
