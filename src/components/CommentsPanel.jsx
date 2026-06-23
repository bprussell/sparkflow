import { useState, useEffect } from 'react';
import { MessageCircle, Send, Smile } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const REACTIONS = ['👍', '🔥', '💡', '❤️', '😮'];

function Comment({ comment, currentUser, onReact, onReply, depth = 0, allComments }) {
  const [showReactions, setShowReactions] = useState(false);
  const replies = allComments.filter(c => c.parent_comment_id === comment.id);

  return (
    <div className={`${depth > 0 ? 'ml-6 mt-2' : 'mt-4'}`}>
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"               style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
              {(comment.author_name || comment.author_email || '?')[0].toUpperCase()}
            </div>
            <span className="text-white/60 text-xs font-medium">{comment.author_name || comment.author_email || 'Anonymous'}</span>
          </div>
          <span className="text-white/20 text-xs">{new Date(comment.created_date).toLocaleDateString()}</span>
        </div>
        <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {showReactions && (
              <div className="absolute bottom-6 left-0 flex gap-1 p-2 rounded-xl z-10"               style={{ background: 'rgba(10,22,40,0.97)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {REACTIONS.map(emoji => (
                  <button key={emoji} onClick={() => { onReact(comment.id, emoji); setShowReactions(false); }} className="hover:scale-125 transition-transform text-base">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="flex gap-1">
              {Object.entries(comment.reactions.reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {})).map(([emoji, count]) => (
                <span key={emoji} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}
          <button onClick={() => onReply(comment.id)} className="text-white/30 hover:text-white/60 text-xs transition-colors ml-auto">
            Reply
          </button>
        </div>
      </div>
      {replies.map(reply => (
        <Comment key={reply.id} comment={reply} currentUser={currentUser} onReact={onReact} onReply={onReply} depth={depth + 1} allComments={allComments} />
      ))}
    </div>
  );
}

export default function CommentsPanel({ ideaId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.entities.Comment.filter({ idea_id: ideaId }, '-created_date', 100).then(setComments);
  }, [ideaId]);

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    const comment = await base44.entities.Comment.create({
      idea_id: ideaId,
      content: newComment.trim(),
      author_name: currentUser?.full_name,
      author_email: currentUser?.email,
      parent_comment_id: replyTo || undefined,
    });
    setComments(prev => [comment, ...prev]);
    setNewComment('');
    setReplyTo(null);
    setLoading(false);
  };

  const handleReact = async (commentId, emoji) => {
    const comment = comments.find(c => c.id === commentId);
    const reactions = [...(comment.reactions || []), emoji];
    const updated = await base44.entities.Comment.update(commentId, { reactions });
    setComments(prev => prev.map(c => c.id === commentId ? updated : c));
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)' }}>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4" style={{ color: '#06b6d4' }} />
        <h3 className="font-heading font-700 text-white text-sm">Comments</h3>
        <span className="text-white/40 text-xs">({comments.length})</span>
      </div>

      {replyTo && (
        <div className="mb-2 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
          <span>Replying to a comment</span>
          <button onClick={() => setReplyTo(null)} className="hover:text-white transition-colors">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 rounded-xl text-white placeholder-white/20 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || loading}
          className="px-3 py-2 rounded-xl text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #22d3ee)' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div>
        {topLevelComments.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No comments yet — start the conversation</p>
        ) : (
          topLevelComments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReact={handleReact}
              onReply={setReplyTo}
              depth={0}
              allComments={comments}
            />
          ))
        )}
      </div>
    </div>
  );
}