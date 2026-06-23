import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import IdeaCard from '@/components/IdeaCard';
import NewIdeaModal from '@/components/NewIdeaModal';

const STAGES = [
  { id: 'Spark', label: 'Spark', emoji: '✨', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', count_color: 'rgba(245,158,11,0.3)' },
  { id: 'Refining', label: 'Refining', emoji: '🔬', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)', count_color: 'rgba(99,102,241,0.3)' },
  { id: 'Proposed', label: 'Proposed', emoji: '📋', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)', count_color: 'rgba(6,182,212,0.3)' },
  { id: 'In Progress', label: 'In Progress', emoji: '⚡', gradient: 'linear-gradient(135deg, #10b981, #34d399)', count_color: 'rgba(16,185,129,0.3)' },
  { id: 'Shipped', label: 'Shipped', emoji: '🚀', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', count_color: 'rgba(236,72,153,0.3)' },
];

export default function Pipeline() {
  const [ideas, setIdeas] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedIdeas, allComments] = await Promise.all([
      base44.entities.Idea.list('-created_date', 100),
      base44.entities.Comment.list('-created_date', 500),
    ]);
    setIdeas(fetchedIdeas);
    const counts = {};
    allComments.forEach(c => {
      counts[c.idea_id] = (counts[c.idea_id] || 0) + 1;
    });
    setCommentCounts(counts);
    setLoading(false);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    const idea = ideas.find(i => i.id === draggableId);
    if (!idea || idea.stage === newStage) return;

    setIdeas(prev => prev.map(i => i.id === draggableId ? { ...i, stage: newStage } : i));
    await base44.entities.Idea.update(draggableId, {
      stage: newStage,
      stage_changed_at: new Date().toISOString(),
    });
  };

  const handleCreated = (newIdea) => {
    setIdeas(prev => [newIdea, ...prev]);
  };

  const ideasByStage = STAGES.reduce((acc, s) => {
    acc[s.id] = ideas.filter(i => i.stage === s.id);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/10 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading your pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-heading font-900 text-white text-3xl sm:text-4xl mb-1">
            Idea <span className="gradient-text">Pipeline</span>
          </h1>
          <p className="text-white/40 text-sm">
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''} in your pipeline
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-105 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
        >
          <Plus className="w-4 h-4" />
          New Idea
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-4">
          {STAGES.map(stage => (
            <div key={stage.id} className="min-w-0">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className="px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5"
                  style={{ background: stage.gradient }}
                >
                  <span>{stage.emoji}</span>
                  <span>{stage.label}</span>
                </span>
                <span
                  className="text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: stage.count_color }}
                >
                  {ideasByStage[stage.id].length}
                </span>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-40 rounded-2xl p-2 transition-all duration-200 space-y-2"
                    style={{
                      background: snapshot.isDraggingOver ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                      border: snapshot.isDraggingOver ? '1px dashed rgba(99,102,241,0.5)' : '1px dashed rgba(255,255,255,0.05)',
                    }}
                  >
                    {ideasByStage[stage.id].map((idea, index) => (
                      <Draggable key={idea.id} draggableId={idea.id} index={index}>
                        {(provided, snapshot) => (
                          <IdeaCard
                            idea={idea}
                            commentCount={commentCounts[idea.id] || 0}
                            provided={provided}
                            snapshot={snapshot}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {ideasByStage[stage.id].length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-8">
                        <p className="text-white/20 text-xs">Drop ideas here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showNewModal && (
        <NewIdeaModal onClose={() => setShowNewModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}