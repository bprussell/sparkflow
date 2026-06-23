import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Sparkles, MessageCircle, Tag, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STAGE_COLORS = {
  Spark: '#f59e0b',
  Refining: '#7c3aed',
  Proposed: '#06b6d4',
  'In Progress': '#10b981',
  Shipped: '#ec4899',
};

const PRIORITY_COLORS = {
  Low: '#34d399',
  Medium: '#fbbf24',
  High: '#fb923c',
  Critical: '#f87171',
};

function StatCard({ label, value, sub, gradient }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">{label}</div>
      <div className="font-heading font-800 text-3xl mb-1" style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {value}
      </div>
      {sub && <div className="text-white/30 text-xs">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(15,5,32,0.95)', border: '1px solid rgba(124,58,237,0.3)' }}>
        <p className="text-white/60 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-white text-sm font-bold">{p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Insights() {
  const [ideas, setIdeas] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Idea.list('-created_date', 200),
      base44.entities.Comment.list('-created_date', 500),
    ]).then(([fetchedIdeas, fetchedComments]) => {
      setIdeas(fetchedIdeas);
      setComments(fetchedComments);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-white/10 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Stage distribution
  const stageData = Object.entries(
    ideas.reduce((acc, i) => { acc[i.stage] = (acc[i.stage] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, color: STAGE_COLORS[name] }));

  // Priority distribution
  const priorityData = Object.entries(
    ideas.reduce((acc, i) => { acc[i.priority || 'Medium'] = (acc[i.priority || 'Medium'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Top tags
  const tagCounts = {};
  ideas.forEach(i => (i.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  // Ideas over time (by created month)
  const timeData = {};
  ideas.forEach(i => {
    const month = new Date(i.created_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    timeData[month] = (timeData[month] || 0) + 1;
  });
  const timeSeriesData = Object.entries(timeData).slice(-8).map(([name, value]) => ({ name, value }));

  // Stats
  const totalAIInteractions = ideas.reduce((sum, i) => sum + (i.ai_interactions_count || 0), 0);
  const shippedCount = ideas.filter(i => i.stage === 'Shipped').length;
  const withSpec = ideas.filter(i => i.spec_problem_statement).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-900 text-white text-3xl sm:text-4xl mb-1">
          Idea <span className="gradient-text">Insights</span>
        </h1>
        <p className="text-white/40 text-sm">Your pipeline at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Ideas" value={ideas.length} sub="in your pipeline" gradient="linear-gradient(135deg, #7c3aed, #a78bfa)" />
        <StatCard label="Shipped" value={shippedCount} sub={`${ideas.length ? Math.round(shippedCount / ideas.length * 100) : 0}% completion rate`} gradient="linear-gradient(135deg, #ec4899, #f472b6)" />
        <StatCard label="AI Interactions" value={totalAIInteractions} sub="specs + critiques generated" gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" />
        <StatCard label="Comments" value={comments.length} sub={`across ${ideas.length} ideas`} gradient="linear-gradient(135deg, #06b6d4, #22d3ee)" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Stage distribution */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-heading font-700 text-white text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#7c3aed' }} />
            Ideas by Stage
          </h3>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">No data yet</div>
          )}
        </div>

        {/* Ideas over time */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-heading font-700 text-white text-sm mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: '#f59e0b' }} />
            Ideas Over Time
          </h3>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeSeriesData}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="url(#lineGradient)" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }} />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">No data yet</div>
          )}
        </div>

        {/* Priority breakdown */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-heading font-700 text-white text-sm mb-4">Priority Distribution</h3>
          {priorityData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={PRIORITY_COLORS[entry.name] || '#7c3aed'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {priorityData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[entry.name] || '#7c3aed' }} />
                    <span className="text-white/60 text-xs">{entry.name}</span>
                    <span className="text-white font-bold text-xs ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm">No data yet</div>
          )}
        </div>

        {/* Top tags */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-heading font-700 text-white text-sm mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4" style={{ color: '#06b6d4' }} />
            Top Tags
          </h3>
          {topTags.length > 0 ? (
            <div className="space-y-2">
              {topTags.map((tag, i) => (
                <div key={tag.name} className="flex items-center gap-3">
                  <span className="text-white/30 text-xs w-4">{i + 1}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-1" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                    {tag.name}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(tag.value / topTags[0].value) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
                      />
                    </div>
                    <span className="text-white/40 text-xs w-4 text-right">{tag.value}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-white/20 text-sm">Add tags to ideas to see them here</div>
          )}
        </div>
      </div>

      {/* AI usage breakdown */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <h3 className="font-heading font-700 text-white text-sm mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
          AI Usage Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Specs Generated', value: withSpec, color: '#7c3aed' },
            { label: 'Critiques Done', value: ideas.filter(i => i.critique_blind_spots).length, color: '#f59e0b' },
            { label: 'Total AI Calls', value: totalAIInteractions, color: '#a78bfa' },
            { label: 'Shipped Ideas', value: shippedCount, color: '#ec4899' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="font-heading font-800 text-2xl mb-1" style={{ color: item.color }}>{item.value}</div>
              <div className="text-white/40 text-xs">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}