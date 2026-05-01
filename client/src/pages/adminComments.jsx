import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar/AdminNavbar';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

function AdminCommentsPage() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('UNVERIFIED'); // Default to unverified

  // Check admin session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
      toast.error('Please login as admin');
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllComments();
  }, []);

  const fetchAllComments = async () => {
    try {
      setLoading(true);
      // Use admin API to get ALL listings including unverified posts and comments
      const response = await adminAPI.getAllListings();
      const allComments = [];
      
      for (const listing of response.data) {
        if (listing.comments && listing.comments.length > 0) {
          for (const comment of listing.comments) {
            allComments.push({
              id: comment.id,
              content: comment.content,
              email: comment.fromEmail,
              userName: listing.userProfile?.name || comment.fromEmail.split('@')[0],
              createdAt: comment.createdAt,
              listingId: listing.id,
              listingTitle: listing.title,
              isVerified: comment.isVerified || false
            });
          }
        }
      }
      
      setComments(allComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (listingId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await adminAPI.deleteComment(listingId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleVerifyComment = async (commentId) => {
    try {
      await adminAPI.verifyComment(commentId);
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, isVerified: true } : c
      ));
      toast.success('Comment verified successfully');
    } catch (error) {
      console.error('Error verifying comment:', error);
      toast.error('Failed to verify comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredComments = comments.filter(comment => {
    // Filter by verification status
    if (filterVerified === 'VERIFIED' && !comment.isVerified) return false;
    if (filterVerified === 'UNVERIFIED' && comment.isVerified) return false;
    
    // Filter by search term
    if (searchTerm && !(
      comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    )) return false;
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <AdminNavbar />

      <main className="px-8 lg:px-20 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Comment Management</h1>
          <p className="text-gray-400 font-medium">Verify and moderate user comments</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search comments, users, or listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg font-bold">
                {comments.filter(c => c.isVerified).length} Verified
              </span>
              <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg font-bold">
                {comments.filter(c => !c.isVerified).length} Pending
              </span>
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
            <div className="flex gap-2">
              {['ALL', 'VERIFIED', 'UNVERIFIED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterVerified(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    filterVerified === status
                      ? 'bg-black text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-black tracking-tight mb-6">
              All Comments ({filteredComments.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">Loading...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No comments found</p>
                ) : (
                  filteredComments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-300 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Comment Header */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white font-black shadow-md">
                              {comment.userName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-gray-900">{comment.userName}</p>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-500 font-medium">{comment.email}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <button
                                  onClick={() => navigate(`/listing/${comment.listingId}`)}
                                  className="text-xs font-bold text-black hover:underline"
                                >
                                  {comment.listingTitle}
                                </button>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-400 font-medium">{formatDate(comment.createdAt)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Comment Content */}
                          <div className="ml-13 bg-white p-3 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                            {comment.isVerified && (
                              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verified
                              </div>
                            )}
                            {!comment.isVerified && (
                              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Pending Verification
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {!comment.isVerified && (
                            <button
                              onClick={() => handleVerifyComment(comment.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all whitespace-nowrap"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment.listingId, comment.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminCommentsPage;
