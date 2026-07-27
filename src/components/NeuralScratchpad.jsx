import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, Sparkles, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function NeuralScratchpad() {
  const { quickNotes, addQuickNote, deleteQuickNote, updateQuickNote } = useStore();
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAdd = () => {
    if (!input.trim()) return;
    addQuickNote(today, input.trim());
    setInput('');
  };

  const notes = quickNotes[today] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card-glass" style={{ padding: 24, borderRadius: 'var(--radius-xl)', border: '1px solid rgba(var(--accent-primary-rgb), 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
           <div style={{ padding: 10, borderRadius: 12, background: 'rgba(var(--accent-primary-rgb), 0.1)', color: 'var(--accent-primary)' }}>
              <Sparkles size={20} />
           </div>
           <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Neural Scratchpad</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rapid tactical capture for today</div>
           </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            type="text" 
            placeholder="CAPTURE THOUGHT..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            style={{ 
              flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', 
              borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          <button className="btn btn-primary btn-icon" onClick={handleAdd}>
            <Plus size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 20 }}>
          <AnimatePresence>
            {notes.map((note) => {
              const isEditing = editingId === note.id;
              return (
                <motion.div 
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="card"
                  style={{ 
                    padding: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: 16, position: 'relative', minHeight: 100, display: 'flex', flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      {format(new Date(note.timestamp), 'HH:mm')}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                       <button className="btn btn-ghost btn-icon btn-sm" onClick={() => {
                         if (isEditing) {
                           updateQuickNote(today, note.id, editValue);
                           setEditingId(null);
                         } else {
                           setEditingId(note.id);
                           setEditValue(note.text);
                         }
                       }}>
                         {isEditing ? <Check size={12} /> : <Edit2 size={12} />}
                       </button>
                       <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => deleteQuickNote(today, note.id)}>
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea 
                      autoFocus
                      className="form-input"
                      style={{ width: '100%', flex: 1, fontSize: 13, background: 'transparent', border: 'none', padding: 0, resize: 'none' }}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => {
                        updateQuickNote(today, note.id, editValue);
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
                      {note.text}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {notes.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
              <MessageSquare size={32} style={{ marginBottom: 12, color: 'var(--accent-primary)' }} />
              <div style={{ fontSize: 13, fontWeight: 700 }}>Scratchpad empty. Log a thought.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
