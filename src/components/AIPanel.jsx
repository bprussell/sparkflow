import { useState } from 'react';
import { Sparkles, Zap, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

const SECTION_LABELS = {
  spec_problem_statement: 'Problem Statement',
  spec_goals: 'Goals',
  spec_target_users: 'Target Users',
  spec_key_features: 'Key Features',
  spec_tech_stack: 'Tech Stack',
  spec_effort_estimate: 'Effort Estimate',
  spec_potential_risks: 'Potential Risks',
  critique_blind_spots: 'Blind Spots',
  critique_similar_solutions: 'Similar Solutions',
  critique_questions: "Devil's Advocate Questions",
};

function SpecSection({ label, value, fieldKey, onEdit, onSave, editingKey }) {
  const isEditing = editingKey === fieldKey;
  const [draft, setDraft] = useState(value || '');

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a78bfa' }}>{label}</span>
        {!isEditing ? (
          <button onClick={() => onEdit(fieldKey, value)} className="text-white/30 hover:text-white/60 text-xs transition-colors">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => onEdit(null)} className="text-white/30 hover:text-white/60 text-xs transition-colors">Cancel</button>
            <button onClick={() => onSave(fieldKey, draft)} className="text-xs font-semibold transition-colors" style={{ color: '#a78bfa' }}>Save</button>
          </div>
        )}
      </div>
      {isEditing ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none resize-none leading-relaxed"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(124,58,237,0.4)' }}
          autoFocus
        />
      ) : (
        <div className="text-white/70 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{value || '*Not yet generated*'}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default function AIPanel({ idea, onIdeaUpdate }) {
  const [generatingSpec, setGeneratingSpec] = useState(false);
  const [generatingCritique, setGeneratingCritique] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [specExpanded, setSpecExpanded] = useState(true);
  const [critiqueExpanded, setCritiqueExpanded] = useState(true);

  const handleEdit = (key, value) => {
    setEditingKey(key);
  };

  const handleSave = async (fieldKey, value) => {
    const updated = await base44.entities.Idea.update(idea.id, { [fieldKey]: value });
    onIdeaUpdate(updated);
    setEditingKey(null);
  };

  const generateSpec = async () => {
    setGeneratingSpec(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior software architect and product manager. Given this raw idea, generate a detailed project specification.

Idea Title: ${idea.title}
Raw Description: ${idea.raw_description || '(no description provided)'}

Generate each section with concrete, actionable content. Format lists with bullet points using markdown.

Respond ONLY with a valid JSON object with these exact keys:
- problem_statement: A clear 2-3 sentence problem statement
- goals: 3-5 specific measurable goals (markdown list)
- target_users: Who will use this and why (2-3 sentences)
- key_features: 5-8 core features (markdown list)
- tech_stack: Recommended tech stack with brief reasoning (markdown list)
- effort_estimate: One of exactly: S, M, L, or XL
- potential_risks: 3-5 key risks (markdown list)`,
      response_json_schema: {
        type: 'object',
        properties: {
          problem_statement: { type: 'string' },
          goals: { type: 'string' },
          target_users: { type: 'string' },
          key_features: { type: 'string' },
          tech_stack: { type: 'string' },
          effort_estimate: { type: 'string' },
          potential_risks: { type: 'string' },
        },
      },
    });

    const updated = await base44.entities.Idea.update(idea.id, {
      spec_problem_statement: result.problem_statement,
      spec_goals: result.goals,
      spec_target_users: result.target_users,
      spec_key_features: result.key_features,
      spec_tech_stack: result.tech_stack,
      spec_effort_estimate: ['S', 'M', 'L', 'XL'].includes(result.effort_estimate) ? result.effort_estimate : 'M',
      spec_potential_risks: result.potential_risks,
      spec_generated_at: new Date().toISOString(),
      ai_interactions_count: (idea.ai_interactions_count || 0) + 1,
      stage: idea.stage === 'Spark' ? 'Refining' : idea.stage,
    });
    onIdeaUpdate(updated);
    setGeneratingSpec(false);
  };

  const generateCritique = async () => {
    setGeneratingCritique(true);
    const specContext = idea.spec_problem_statement
      ? `Problem: ${idea.spec_problem_statement}\nGoals: ${idea.spec_goals}\nFeatures: ${idea.spec_key_features}`
      : `Title: ${idea.title}\nDescription: ${idea.raw_description}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sharp, experienced venture capitalist and product critic. Stress-test this idea ruthlessly but constructively.

${specContext}

Respond with a JSON object with these exact keys:
- blind_spots: 3-5 overlooked challenges, hidden complexities, or faulty assumptions (markdown list with brief explanation for each)
- similar_solutions: 2-3 existing products/companies that already do something similar, with a one-line note on what makes each different or threatening (markdown list)
- questions: 3 hard devil's advocate questions the founder must answer before moving forward. Make them pointed and specific (markdown numbered list)`,
      response_json_schema: {
        type: 'object',
        properties: {
          blind_spots: { type: 'string' },
          similar_solutions: { type: 'string' },
          questions: { type: 'string' },
        },
      },
    });

    const updated = await base44.entities.Idea.update(idea.id, {
      critique_blind_spots: result.blind_spots,
      critique_similar_solutions: result.similar_solutions,
      critique_questions: result.questions,
      critique_generated_at: new Date().toISOString(),
      ai_interactions_count: (idea.ai_interactions_count || 0) + 1,
    });
    onIdeaUpdate(updated);
    setGeneratingCritique(false);
  };

  const hasSpec = !!idea.spec_problem_statement;
  const hasCritique = !!idea.critique_blind_spots;

  return (
    <div className="space-y-4">
      {/* Generate Spec */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: generatingSpec ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(124,58,237,0.25)',
          background: 'rgba(124,58,237,0.08)',
        }}
      >
        {generatingSpec && (
          <div className="h-1 ai-shimmer" />
        )}
        <div className="p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
              <h3 className="font-heading font-700 text-white text-sm">Project Spec</h3>
              {hasSpec && <span className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }} />}
            </div>
            <div className="flex items-center gap-2">
              {hasSpec && (
                <button onClick={() => setSpecExpanded(!specExpanded)} className="text-white/30 hover:text-white/60 transition-colors">
                  {specExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={generateSpec}
                disabled={generatingSpec}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
              >
                {generatingSpec ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generatingSpec ? 'Generating...' : hasSpec ? 'Regenerate' : 'Generate Spec'}
              </button>
            </div>
          </div>
          <p className="text-white/40 text-xs mb-4">AI expands your idea into a full project brief</p>

          {hasSpec && specExpanded && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                ['spec_problem_statement', 'Problem Statement'],
                ['spec_goals', 'Goals'],
                ['spec_target_users', 'Target Users'],
                ['spec_key_features', 'Key Features'],
                ['spec_tech_stack', 'Tech Stack'],
                ['spec_potential_risks', 'Potential Risks'],
              ].map(([key, label]) => (
                <SpecSection key={key} label={label} value={idea[key]} fieldKey={key} onEdit={handleEdit} onSave={handleSave} editingKey={editingKey} />
              ))}
              {idea.spec_effort_estimate && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#a78bfa' }}>Effort Estimate</span>
                  <span className="px-3 py-1 rounded-full text-white text-xs font-black" style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                    {idea.spec_effort_estimate}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Critique */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: generatingCritique ? '1px solid rgba(245,158,11,0.6)' : '1px solid rgba(245,158,11,0.2)',
          background: 'rgba(245,158,11,0.06)',
        }}
      >
        {generatingCritique && (
          <div className="h-1" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.1), rgba(245,158,11,0.4), rgba(245,158,11,0.1))', animation: 'shimmer 2s infinite', backgroundSize: '200% 100%' }} />
        )}
        <div className="p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <h3 className="font-heading font-700 text-white text-sm">Critical Analysis</h3>
              {hasCritique && <span className="w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }} />}
            </div>
            <div className="flex items-center gap-2">
              {hasCritique && (
                <button onClick={() => setCritiqueExpanded(!critiqueExpanded)} className="text-white/30 hover:text-white/60 transition-colors">
                  {critiqueExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={generateCritique}
                disabled={generatingCritique}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
              >
                {generatingCritique ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {generatingCritique ? 'Analyzing...' : hasCritique ? 'Re-critique' : 'Critique This'}
              </button>
            </div>
          </div>
          <p className="text-white/40 text-xs mb-4">AI stress-tests your idea with hard questions</p>

          {hasCritique && critiqueExpanded && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                ['critique_blind_spots', 'Blind Spots'],
                ['critique_similar_solutions', 'Similar Solutions'],
                ['critique_questions', "Devil's Advocate Questions"],
              ].map(([key, label]) => (
                <SpecSection key={key} label={label} value={idea[key]} fieldKey={key} onEdit={handleEdit} onSave={handleSave} editingKey={editingKey} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}