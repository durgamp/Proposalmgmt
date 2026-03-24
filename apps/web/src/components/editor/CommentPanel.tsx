import { useState } from 'react';
import { MessageSquare, Trash2, Send } from 'lucide-react';
import { useComments, useCreateComment, useDeleteComment } from '../../hooks/useSections';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';

interface Props {
  proposalId: string;
  sectionKey: string;
}

export default function CommentPanel({ proposalId, sectionKey }: Props) {
  const user = useAuthStore((s) => s.user);
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading } = useComments(proposalId, sectionKey);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    await createComment.mutateAsync({
      proposalId,
      sectionKey,
      dto: {
        content: newComment.trim(),
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
      },
    });
    setNewComment('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <MessageSquare size={16} className="text-blue-600" />
        <span className="font-semibold text-sm text-gray-800">
          Comments ({comments?.length ?? 0})
        </span>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && <p className="text-xs text-gray-400 text-center">Loading...</p>}
        {!isLoading && !comments?.length && (
          <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first!</p>
        )}
        {comments?.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-gray-700">{comment.userName}</span>
                <span className="text-xs text-gray-400 ml-1.5">{comment.userRole}</span>
              </div>
              {comment.userEmail === user?.email && (
                <button
                  onClick={() => deleteComment.mutate({ proposalId, sectionKey, commentId: comment.id, userEmail: user!.email })}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{comment.content}</p>
            <p className="text-xs text-gray-400">
              {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
        ))}
      </div>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            className="input text-xs resize-none flex-1"
            rows={2}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
          />
          <button type="submit" className="btn-primary py-2 self-end" disabled={!newComment.trim()}>
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
