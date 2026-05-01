import { useState, useEffect } from 'react';
import { listingAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

const CommentSection = ({ listingId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [listingId]);

  const fetchComments = async () => {
    try {
      const response = await listingAPI.getById(listingId);
      setComments(response.data.comments || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await listingAPI.postComment(listingId, {
        content: newComment,
      });
      setNewComment('');
      setShowConfirmation(true);
      fetchComments();
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await listingAPI.deleteComment(listingId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <>
      <div className="flex flex-col h-full p-4">
        {/* Comments List - Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#9CA3AF #F3F4F6'
        }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-center text-gray-400 text-xs">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
              </svg>
              <p className="text-center text-gray-400 text-lg font-medium mb-1">No comments yet</p>
              <p className="text-center text-gray-400 text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <span className="text-[10px] font-bold">{comment.fromEmail?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-black">{comment.fromEmail}</p>
                    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {comment.isVerified ? (
                    <>
                      <p className="text-xs text-gray-700 font-medium">{comment.content}</p>
                      {comment.fromEmail === user?.email && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="mt-1.5 text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  ) : comment.fromEmail === user?.email ? (
                    <>
                      <p className="text-xs text-gray-700 font-medium">{comment.content}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-[9px] font-bold">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Pending Verification
                      </div>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="mt-1.5 ml-2 text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-md text-[9px] font-bold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      This comment is under verification
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input at Bottom - Fixed */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-3 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} className="w-full h-full object-cover" alt="You" />
              ) : (
                <span className="text-white text-[10px] font-black">{(user?.name || 'U').charAt(0)}</span>
              )}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-50 border-none rounded-full py-2 px-4 text-xs font-medium focus:ring-2 focus:ring-black/5 outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className={`w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all ${
                submitting || !newComment.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Comment posted and sent for verification!"
        message="Your comment will be visible to others once an admin verifies it."
      />
    </>
  );
};

export default CommentSection;
