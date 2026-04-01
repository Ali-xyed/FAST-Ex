import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar/AdminNavbar';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Dummy data for comments
const DUMMY_COMMENTS = [
  { id: 1, listingId: 1, listingTitle: 'iPhone 13 Pro', email: 'jane.smith@university.edu', userName: 'Jane Smith', content: 'Is this still available?', createdAt: '2024-03-15T10:30:00Z' },
  { id: 2, listingId: 1, listingTitle: 'iPhone 13 Pro', email: 'mike.wilson@university.edu', userName: 'Mike Wilson', content: 'Can you do $700?', createdAt: '2024-03-15T11:00:00Z' },
  { id: 3, listingId: 2, listingTitle: 'MacBook Air M1', email: 'sarah.jones@university.edu', userName: 'Sarah Jones', content: 'Great deal!', createdAt: '2024-03-14T14:20:00Z' },
  { id: 4, listingId: 3, listingTitle: 'Gaming Chair', email: 'alex.brown@university.edu', userName: 'Alex Brown', content: 'What would you exchange for?', createdAt: '2024-03-14T09:15:00Z' },
  { id: 5, listingId: 4, listingTitle: 'Calculus Textbook', email: 'emily.davis@university.edu', userName: 'Emily Davis', content: 'Which edition is this?', createdAt: '2024-03-13T16:45:00Z' },
  { id: 6, listingId: 5, listingTitle: 'Bicycle', email: 'chris.taylor@university.edu', userName: 'Chris Taylor', content: 'Interested! Can we meet tomorrow?', createdAt: '2024-03-13T12:30:00Z' },
  { id: 7, listingId: 6, listingTitle: 'Desk Lamp', email: 'lisa.anderson@university.edu', userName: 'Lisa Anderson', content: 'Does it come with a bulb?', createdAt: '2024-03-12T18:00:00Z' },
  { id: 8, listingId: 2, listingTitle: 'MacBook Air M1', email: 'john.doe@university.edu', userName: 'John Doe', content: 'How many charge cycles?', createdAt: '2024-03-12T10:15:00Z' },
  { id: 9, listingId: 7, listingTitle: 'Wireless Headphones', email: 'jane.smith@university.edu', userName: 'Jane Smith', content: 'Do they have warranty?', createdAt: '2024-03-11T15:45:00Z' },
  { id: 10, listingId: 8, listingTitle: 'Study Desk', email: 'mike.wilson@university.edu', userName: 'Mike Wilson', content: 'What are the dimensions?', createdAt: '2024-03-11T09:20:00Z' },
];

function AdminCommentsPage() {
  const navigate = useNavigate();
  const [comments, setComments] = useState(DUMMY_COMMENTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteComment = async (listingId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      setComments(comments.filter(c => c.id !== commentId));
      // Uncomment when backend is ready
      // await adminAPI.deleteComment(listingId, commentId);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
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

  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.listingTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex items-center gap-4">
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
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold">
                {filteredComments.length} Comments
              </span>
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
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => navigate(`/listing/${comment.listingId}`)}
                            className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all whitespace-nowrap"
                          >
                            View Post
                          </button>
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
