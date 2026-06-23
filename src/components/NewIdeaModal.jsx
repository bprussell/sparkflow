import { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function NewIdeaModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const idea = await base44.entities.Idea.create({
      title: title.trim(),
      raw_description: description.trim(),
      stage: 'Spark',
      priority: 'Medium',
      stage_changed_at: new Date().toISOString(),
    });
    setLoading(false);
    onCreated(idea);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'rgba(26,5,51,0.95)', border: '1px solid rgba(124,58,237,0.3)', backdropFilter: 'blur(30px)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-800 text-white text-lg">Capture a Spark</h2>
              <p className="text-white/40 text-xs">Don't overthink it — just write it down</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Idea Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. AI-powered code review tool..."
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm font-medium outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              autoFocus
            />
          </div>

          <div>
            <label className="text-white/60 text-xs font-medium mb-1.5 block">Raw Description <span className="text-white/30">(1–3 sentences)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What's the core of this idea? Who does it help? What problem does it solve?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm outline-none transition-all resize-none leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-white/50 text-sm font-medium transition-all hover:text-white/80"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
            >
              {loading ? 'Saving...' : 'Capture Spark ✦'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}