import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, X, ChevronDown, Trash2, UserPlus, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AIPanel from '@/components/AIPanel';
import CommentsPanel from '@/components/CommentsPanel';
import confetti from 'canvas-confetti';

const STAGES = ['Spark', 'Refining', 'Proposed', 'In Progress', 'Shipped'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const PRIORITY_COLORS = {
  Low: { bg: 'rgba(16,185,129,0.2)', text: '#34d399' },
  Medium: { bg: 'rgba(245,158,11,0.2)', text: '#fbbf24' },
  High: { bg: 'rgba(249,115,22,0.2)', text: '#fb923c' },
  Critical: { bg: 'rgba(239,68,68,0.2)', text: '#f87171' },
};

const STAGE_GRADIENTS = {
  Spark: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  Refining: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  Proposed: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
  'In Progress': 'linear-gradient(135deg, #10b981, #34d399)',
  Shipped: 'linear-gradient(135deg, #ec4899, #f472b6)',
};

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [showRetro, setShowRetro] = useState(false);
  const [retroNote, setRetroNote] = useState('');
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Idea.get(id),
      base44.auth.me().catch(() => null),
    ]).then(([fetchedIdea, user]) => {
      setIdea(fetchedIdea);
      setCurrentUser(user);
      setLoading(false);
    });
  }, [id]);

  const updateIdea = async (data) => {
    const updated = await base44.entities.Idea.update(id, data);
    setIdea(updated);
    return updated;
  };

  const handleStageChange = async (newStage) => {
    setShowStageMenu(false);
    if (newStage === 'Shipped' && idea.stage !== 'Shipped') {
      setShowRetro(true);
    }
    await updateIdea({ stage: newStage, stage_changed_at: new Date().toISOString() });
  };

  const handleShipWithRetro = async () => {
    await updateIdea({ stage: 'Shipped', retrospective_note: retroNote, stage_changed_at: new Date().toISOString() });
    setShowRetro(false);
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366f1', '#f59e0b', '#06b6d4', '#ec4899', '#10b981'] });
  };

  const addTag = async (e) => {
    if (e.key !== 'Enter' || !tagInput.trim()) return;
    const newTags = [...(idea.tags || []), tagInput.trim()];
    setTagInput('');
    await updateIdea({ tags: newTags });
  };

  const removeTag = async (tag) => {
    await updateIdea({ tags: idea.tags.filter(t => t !== tag) });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), 'user');
      const emails = [...(idea.collaborator_emails || []), inviteEmail.trim()];
      await updateIdea({ collaborator_emails: emails });
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      // Collaborator may already exist
      const emails = [...(idea.collaborator_emails || []), inviteEmail.trim()];
      await updateIdea({ collaborator_emails: emails });
      setInviteEmail('');
      setShowInvite(false);
    }
    setInviting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!idea) return (
    <div className="text-center py-32 text-white/40">Idea not found. <Link to="/" className="underline">Go back</Link></div>
  );

  const priority = PRIORITY_COLORS[idea.priority] || PRIORITY_COLORS.Medium;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Pipeline
      </Link>

      {/* Header */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex flex-wrap items-start gap-4 mb-4">
          {/* Stage selector */}
          <div className="relative">
            <button
              onClick={() => setShowStageMenu(!showStageMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold"
              style={{ background: STAGE_GRADIENTS[idea.stage] }}
            >
              {idea.stage}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStageMenu && (
              <div className="absolute top-8 left-0 rounded-xl overflow-hidden z-20 min-w-36" style={{ background: 'rgba(10,22,40,0.98)', border: '1px solid rgba(99,102,241,0.3)' }}>
                {STAGES.map(s => (
                  <button key={s} onClick={() => handleStageChange(s)} className="w-full px-4 py-2 text-left text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: STAGE_GRADIENTS[s] }} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority selector */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: priority.bg, color: priority.text }}
            >
              {idea.priority}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showPriorityMenu && (
              <div className="absolute top-8 left-0 rounded-xl overflow-hidden z-20 min-w-32" style={{ background: 'rgba(10,22,40,0.98)', border: '1px solid rgba(99,102,241,0.3)' }}>
                {PRIORITIES.map(p => (
                  <button key={p} onClick={async () => { setShowPriorityMenu(false); await updateIdea({ priority: p }); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-white/80 hover:text-white hover:bg-white/5">
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 hover:text-white text-xs font-medium transition-all hover:bg-white/5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite
            </button>
            <button
              onClick={() => base44.entities.Idea.delete(id).then(() => navigate('/'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/30 hover:text-red-400 text-xs font-medium transition-all hover:bg-red-400/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Invite form */}
        {showInvite && (
          <form onSubmit={handleInvite} className="flex gap-2 mb-4 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="collaborator@email.com"
              className="flex-1 px-3 py-2 rounded-lg text-white placeholder-white/30 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.07)' }}
              autoFocus
            />
            <button type="submit" disabled={inviting} className="px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="text-white/30 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Title */}
        {editingTitle ? (
          <input
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={async () => { await updateIdea({ title: titleDraft }); setEditingTitle(false); }}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
            className="w-full bg-transparent text-white font-heading font-800 text-2xl sm:text-3xl outline-none border-b border-indigo-500/50 pb-1 mb-3"
            autoFocus
          />
        ) : (
          <h1
            onClick={() => { setTitleDraft(idea.title); setEditingTitle(true); }}
            className="font-heading font-800 text-white text-2xl sm:text-3xl mb-3 cursor-text hover:text-white/90 transition-colors"
          >
            {idea.title}
          </h1>
        )}

        {/* Description */}
        {editingDesc ? (
          <textarea
            value={descDraft}
            onChange={e => setDescDraft(e.target.value)}
            onBlur={async () => { await updateIdea({ raw_description: descDraft }); setEditingDesc(false); }}
            rows={3}
            className="w-full bg-transparent text-white/70 text-sm outline-none border border-indigo-500/30 rounded-lg p-2 resize-none leading-relaxed"
            autoFocus
          />
        ) : (
          <p
            onClick={() => { setDescDraft(idea.raw_description || ''); setEditingDesc(true); }}
            className="text-white/50 text-sm leading-relaxed cursor-text hover:text-white/60 transition-colors"
          >
            {idea.raw_description || <span className="italic text-white/25">Click to add a description...</span>}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <Tag className="w-3.5 h-3.5 text-white/30" />
          {(idea.tags || []).map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Add tag..."
            className="text-xs px-2 py-1 rounded-full outline-none text-white/60 placeholder-white/20 w-24"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)' }}
          />
        </div>

        {/* AI interactions count */}
        {idea.ai_interactions_count > 0 && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-white/30">
            <span>✦</span>
            <span>{idea.ai_interactions_count} AI interaction{idea.ai_interactions_count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* AI Panel — wider */}
        <div className="lg:col-span-3 space-y-4">
          <AIPanel idea={idea} onIdeaUpdate={setIdea} />
        </div>

        {/* Comments — narrower */}
        <div className="lg:col-span-2">
          <CommentsPanel ideaId={id} currentUser={currentUser} />
        </div>
      </div>

      {/* Retrospective modal */}
      {showRetro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(10,22,40,0.98)', border: '1px solid rgba(236,72,153,0.4)' }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="font-heading font-800 text-white text-xl mb-1">You're shipping this!</h2>
              <p className="text-white/50 text-sm">Drop a quick retrospective note before it goes live</p>
            </div>
            <textarea
              value={retroNote}
              onChange={e => setRetroNote(e.target.value)}
              placeholder="What worked well? What would you do differently? Any lessons learned?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm outline-none resize-none leading-relaxed mb-4"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRetro(false)} className="flex-1 py-3 rounded-xl text-white/50 text-sm font-medium" style={{ background: 'rgba(255,255,255,0.05)' }}>
                Cancel
              </button>
              <button
                onClick={handleShipWithRetro}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}
              >
                <CheckCircle className="w-4 h-4" />
                Ship It! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}