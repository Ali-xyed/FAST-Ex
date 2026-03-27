import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, listingAPI, reviewAPI } from '../utils/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar/Navbar';
import ListingCard from '../components/ListingCard/ListingCard';

function OtherProfilePage() {
  const { email } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [email]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userRes, listingsRes, reviewsRes] = await Promise.all([
        userAPI.getUserByEmail(email),
        listingAPI.getUserListings(email),
        reviewAPI.getUserReviews(email),
      ]);
      
      setUser(userRes.data);
      setListings(listingsRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);

    try {
      await reviewAPI.createReview({
        revieweeEmail: email,
        rating,
        comment,
      });
      
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setRating(5);
      setComment('');
      fetchUserData(); // Refresh to show new review
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-400">User not found</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 px-6 py-2 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="px-8 lg:px-20 py-12 max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
              {user.imageUrl ? (
                <img src={user.imageUrl} className="w-full h-full object-cover" alt={user.name} />
              ) : (
                <span className="text-white text-4xl font-black">{user.name.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-black tracking-tight mb-2">{user.name}</h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{user.rollNo}</p>
              
              <div className="flex items-center gap-6 mb-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reputation</p>
                  <p className="text-2xl font-black">{user.reputationScore || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Member Since</p>
                  <p className="text-sm font-bold">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reviews</p>
                  <p className="text-sm font-bold">{reviews.length}</p>
                </div>
              </div>

              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-2.5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
              >
                Write Review
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <h2 className="text-xl font-black tracking-tight mb-4">Reviews</h2>
          {reviews.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0">
                      {review.reviewer.imageUrl ? (
                        <img src={review.reviewer.imageUrl} className="w-full h-full object-cover" alt={review.reviewer.name} />
                      ) : (
                        <span className="text-white text-sm font-black">{review.reviewer.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-black">{review.reviewer.name}</p>
                          <p className="text-xs font-bold text-gray-400">{review.reviewer.rollNo}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-black' : 'text-gray-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      <p className="text-xs font-bold text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listings Section */}
        <div>
          <h2 className="text-xl font-black tracking-tight mb-4">Listings</h2>
          {listings.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">No listings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black tracking-tight mb-6">Write a Review</h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= rating ? 'text-black' : 'text-gray-200'} hover:text-black transition-colors`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-sm resize-none"
                  rows="4"
                  placeholder="Share your experience..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-6 py-2.5 bg-gray-100 text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 px-6 py-2.5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OtherProfilePage;
