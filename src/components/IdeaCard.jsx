import { Link } from 'react-router-dom';
import { Sparkles, MessageCircle, Tag, Zap, Clock, AlertTriangle, Star } from 'lucide-react';

const STAGE_STYLES = {
  Spark: { gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', text: '#78350f', bg: 'rgba(245,158,11,0.15)' },
  Refining: { gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', text: '#1e3a8a', bg: 'rgba(99,102,241,0.15)' },
  Proposed: { gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', text: '#164e63', bg: 'rgba(6,182,212,0.15)' },
  'In Progress': { gradient: 'linear-gradient(135deg, #10b981, #34d399)', text: '#064e3b', bg: 'rgba(16,185,129,0.15)' },
  Shipped: { gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', text: '#831843', bg: 'rgba(236,72,153,0.15)' },
};

const PRIORITY_COLORS = {
  Low: 'text-emerald-400',
  Medium: 'text-amber-400',
  High: 'text-orange-400',
  Critical: 'text-red-400',
};

const PRIORITY_ICONS = {
  Low: Clock,
  Medium: Star,
  High: Zap,
  Critical: AlertTriangle,
};

export default function IdeaCard({ idea, commentCount = 0, provided, snapshot }) {
  const stage = STAGE_STYLES[idea.stage] || STAGE_STYLES.Spark;
  const PriorityIcon = PRIORITY_ICONS[idea.priority] || Star;
  const hasSpec = !!idea.spec_problem_statement;
  const hasCritique = !!idea.critique_blind_spots;

  return (
    <div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      className="rounded-xl p-4 cursor-grab active:cursor-grabbing"
      style={{
        ...(provided?.draggableProps?.style || {}),
        background: snapshot?.isDragging ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        border: snapshot?.isDragging ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: snapshot?.isDragging ? '0 16px 40px rgba(0,0,0,0.5)' : undefined,
      }}
    >
      <Link to={`/idea/${idea.id}`} className="block select-none">
        {/* Stage badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: stage.gradient }}
          >
            {idea.stage}
          </span>
          <div className={`flex items-center gap-1 text-xs font-semibold ${PRIORITY_COLORS[idea.priority]}`}>
            <PriorityIcon className="w-3 h-3" />
            <span>{idea.priority}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-heading font-700 text-white text-sm leading-snug mb-2 line-clamp-2">
          {idea.title}
        </h3>

        {/* Description */}
        {idea.raw_description && (
          <p className="text-white/50 text-xs line-clamp-2 mb-3 leading-relaxed">
            {idea.raw_description}
          </p>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {idea.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                {tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="text-xs text-white/30">+{idea.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-white/30 text-xs">
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {commentCount}
              </span>
            )}
            {idea.tags?.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {idea.tags.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {hasSpec && (
              <span className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }} title="Spec generated" />
            )}
            {hasCritique && (
              <span className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }} title="Critique done" />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}