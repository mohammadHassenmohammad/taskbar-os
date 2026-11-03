import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Plus, Search, Pin, Trash2, Tag, ExternalLink, 
  Lightbulb, BookOpen, Bookmark, FileText, Bot, Shield, Check
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function SecondBrain() {
  const { 
    secondBrain = [], addBrainItem, updateBrainItem, deleteBrainItem, togglePinBrainItem,
    jarvisLongTermMemory = [], addJarvisMemory, deleteJarvisMemory
  } = useStore();

  const [activeTab, setActiveTab] = useState('knowledge'); // 'knowledge' | 'memory'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'note' | 'idea' | 'resource' | 'bookmark'
  const [selectedTag, setSelectedTag] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('note');
  const [tagsInput, setTagsInput] = useState('');
  const [url, setUrl] = useState('');

  // New memory form
  const [memKey, setMemKey] = useState('');
  const [memVal, setMemVal] = useState('');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    secondBrain.forEach(item => {
      (item.tags || []).forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [secondBrain]);

  // Filtered knowledge items
  const filteredItems = useMemo(() => {
    return secondBrain.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        (item.tags || []).some(t => t.toLowerCase().includes(q));
      
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesTag = selectedTag === 'all' || (item.tags || []).includes(selectedTag);

      return matchesSearch && matchesType && matchesTag;
    }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [secondBrain, searchQuery, selectedType, selectedTag]);

  const handleCreateItem = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    addBrainItem({
      title: title.trim(),
      content: content.trim(),
      type,
      tags,
      url: url.trim(),
      pinned: false
    });

    setTitle('');
    setContent('');
    setUrl('');
    setTagsInput('');
    setShowAddModal(false);
  };

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (!memKey.trim() || !memVal.trim()) {
      toast.error('Both key and value are required');
      return;
    }
    addJarvisMemory(memKey, memVal);
    setMemKey('');
    setMemVal('');
  };

  const getTypeIcon = (itemType) => {
    switch (itemType) {
      case 'idea': return <Lightbulb size={16} color="#f59e0b" />;
      case 'bookmark': return <Bookmark size={16} color="#ec4899" />;
      case 'resource': return <BookOpen size={16} color="#06b6d4" />;
      default: return <FileText size={16} color="var(--accent-primary)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 16px rgba(139,92,246,0.3)'
          }}>
            🧠
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Second Brain & Neural Knowledge
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Personal knowledge graph, full-text semantic retrieval & JARVIS memory
            </div>
          </div>
        </div>

        {activeTab === 'knowledge' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Store Knowledge</span>
          </button>
        )}
      </div>

      {/* Main Switcher */}
      <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)', gap: 4, width: 'fit-content' }}>
        <button
          className={`btn btn-sm ${activeTab === 'knowledge' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('knowledge')}
          style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700 }}
        >
          <BookOpen size={14} style={{ marginRight: 6 }} />
          Knowledge Nodes ({secondBrain.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'memory' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('memory')}
          style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700 }}
        >
          <Bot size={14} style={{ marginRight: 6 }} />
          JARVIS Long-Term Memory ({jarvisLongTermMemory.length})
        </button>
      </div>

      {/* ── TAB 1: KNOWLEDGE BASE ── */}
      {activeTab === 'knowledge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input"
                placeholder="Full-text search knowledge, notes, tags…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>

            <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle)', gap: 2 }}>
              {['all', 'note', 'idea', 'resource', 'bookmark'].map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${selectedType === t ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => setSelectedType(t)}
                  style={{ textTransform: 'capitalize', fontSize: 11, padding: '4px 10px' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tags cloud */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Tags:</span>
              <button
                className={`btn btn-sm ${selectedTag === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setSelectedTag('all')}
                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999 }}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`btn btn-sm ${selectedTag === tag ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => setSelectedTag(tag)}
                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999 }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Nodes Grid */}
          {filteredItems.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)' }}>
              <Brain size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>No Knowledge Nodes Found</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
                Store research, insights, snippets or links to build your second brain.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredItems.map(item => (
                <motion.div
                  key={item.id}
                  className="card"
                  style={{
                    padding: 18,
                    background: 'var(--bg-card)',
                    border: item.pinned ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: item.pinned ? '0 0 16px rgba(139,92,246,0.1)' : 'none'
                  }}
                  layout
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getTypeIcon(item.type)}
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>
                        {item.type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => togglePinBrainItem(item.id)}
                        style={{ color: item.pinned ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                        title={item.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin size={13} fill={item.pinned ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => {
                          if (confirm(`Remove "${item.title}" from Second Brain?`)) {
                            deleteBrainItem(item.id);
                          }
                        }}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                      {item.title}
                    </h3>
                    {item.content && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {item.content}
                      </p>
                    )}
                  </div>

                  {/* URL if available */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
                        color: 'var(--accent-primary)', textDecoration: 'none', wordBreak: 'break-all'
                      }}
                    >
                      <ExternalLink size={12} />
                      <span>{item.url}</span>
                    </a>
                  )}

                  {/* Tags */}
                  {(item.tags || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                      {item.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: JARVIS LONG-TERM MEMORY ── */}
      {activeTab === 'memory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Shield size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Autonomous Long-Term Memory Registry
              </h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              JARVIS consults these verified facts and preferences across all conversation turns to tailor its reasoning, schedules, and proactive proposals.
            </p>

            {/* Quick Add Memory */}
            <form onSubmit={handleAddMemory} style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input input-sm"
                placeholder="Fact Key (e.g. preferred_focus_time)"
                value={memKey}
                onChange={(e) => setMemKey(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <input
                type="text"
                className="input input-sm"
                placeholder="Value (e.g. Mornings before 11 AM)"
                value={memVal}
                onChange={(e) => setMemVal(e.target.value)}
                style={{ flex: 2, minWidth: 260 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                Commit Memory
              </button>
            </form>
          </div>

          {/* Memories List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jarvisLongTermMemory.map(mem => (
              <div
                key={mem.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px', background: 'var(--bg-card)', borderRadius: 12,
                  border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 12
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-primary)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>
                      {mem.key}
                    </code>
                    <span style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Check size={12} /> Approved
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>
                    {mem.value}
                  </div>
                </div>

                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => {
                    if (confirm(`Forget memory "${mem.key}"?`)) {
                      deleteJarvisMemory(mem.id);
                    }
                  }}
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Store Knowledge Node */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Store Knowledge Node
            </h2>

            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Node Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Distributed Consensus Patterns"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</label>
                  <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="note">Note</option>
                    <option value="idea">Idea</option>
                    <option value="resource">Resource</option>
                    <option value="bookmark">Bookmark</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="architecture, ai, systems"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Content / Notes</label>
                <textarea
                  className="input"
                  placeholder="Key concepts, takeaways, or implementation details…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>URL (optional)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
