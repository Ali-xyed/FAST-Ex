import { useState, useEffect } from 'react';
import { listingAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CommentSection = ({ listingId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const fetchComments = async () => {
    try {
      const response = await listingAPI.getById(listingId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
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
      toast.success('Comment posted!');
      fetchComments(); // Refresh comments
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
    <div className="bg-white border border-gray-100 rounded-2xl p-8">
      <h3 className="text-lg font-black uppercase tracking-wider mb-6">
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} className="w-full h-full object-cover" alt="You" />
            ) : (
              <span className="text-white text-xs font-black">{(user?.name || 'U').charAt(0)}</span>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows="3"
              className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className={`mt-3 bg-black text-white px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all ${submitting || !newComment.trim() ? 'opacity-50' : ''}`}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                <span className="text-xs font-bold">{comment.fromEmail?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-black">{comment.fromEmail}</p>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-gray-700 font-medium">{comment.content}</p>
                {comment.fromEmail === user?.email && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
