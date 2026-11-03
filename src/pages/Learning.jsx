import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Plus, BookOpen, Clock, CheckCircle2, Circle, 
  Trash2, Calendar, Award, Sparkles, Timer, Flame 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Learning() {
  const { 
    courses = [], addCourse, updateCourse, deleteCourse, 
    toggleCourseTopic, studySessions = [], logStudySession, today: todayDate 
  } = useStore();

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showLogSession, setShowLogSession] = useState(false);

  // New course form
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [instructor, setInstructor] = useState('');
  const [totalHours, setTotalHours] = useState(20);
  const [topicsInput, setTopicsInput] = useState(['', '']);

  // Log session form
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sessionSubject, setSessionSubject] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [topicsCovered, setTopicsCovered] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  const totalStudyMinutes = studySessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Course title is required');
      return;
    }

    const topics = topicsInput
      .filter(t => t.trim().length > 0)
      .map(t => ({ id: `top_${Date.now()}_${Math.random()}`, title: t.trim(), completed: false }));

    addCourse({
      title: title.trim(),
      subject: subject.trim() || 'General',
      instructor: instructor.trim(),
      totalHours: Number(totalHours) || 20,
      completedHours: 0,
      topics,
      nextRevisionDate: new Date().toISOString().split('T')[0]
    });

    setTitle('');
    setSubject('');
    setInstructor('');
    setTopicsInput(['', '']);
    setShowAddCourse(false);
  };

  const handleLogSession = (e) => {
    e.preventDefault();
    const course = courses.find(c => c.id === selectedCourseId);
    logStudySession({
      courseId: selectedCourseId || '',
      subject: sessionSubject || course?.subject || 'General',
      durationMinutes: Number(durationMinutes) || 30,
      topicsCovered: topicsCovered.trim(),
      notes: sessionNotes.trim(),
      date: new Date().toISOString().split('T')[0]
    });

    setTopicsCovered('');
    setSessionNotes('');
    setShowLogSession(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 4px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 16px rgba(59,130,246,0.3)'
          }}>
            🎓
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Learning and Study Centre
            </h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Curriculum progression, topic mastery & retention logging
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowLogSession(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
          >
            <Timer size={16} />
            <span>Log Study Session</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddCourse(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Courses</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>{courses.length}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Deep Study</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#3b82f6', marginTop: 4 }}>{totalStudyHours} hrs</div>
        </div>
        <div className="card" style={{ padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sessions Logged</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', marginTop: 4 }}>{studySessions.length}</div>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)' }}>
          <GraduationCap size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>No Courses Registered</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
            Catalog a course, subject, or learning topic to track study hours and mastery.
          </p>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddCourse(true)}
            style={{ marginTop: 16 }}
          >
            Add First Course
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {courses.map(course => {
            const topics = course.topics || [];
            const doneTopics = topics.filter(t => t.completed).length;
            const topicProgress = topics.length > 0 ? Math.round((doneTopics / topics.length) * 100) : 0;
            const hourProgress = course.totalHours > 0 ? Math.min(100, Math.round(((course.completedHours || 0) / course.totalHours) * 100)) : 0;

            return (
              <motion.div
                key={course.id}
                className="card"
                style={{
                  padding: 20,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}
                layout
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: 6,
                    background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    {course.subject}
                  </span>

                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => {
                      if (confirm(`Remove course "${course.title}"?`)) {
                        deleteCourse(course.id);
                      }
                    }}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    {course.title}
                  </h3>
                  {course.instructor && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Instructor: {course.instructor}
                    </div>
                  )}
                </div>

                {/* Progress bars */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Hours: {course.completedHours || 0} / {course.totalHours} hrs</span>
                    <span style={{ color: '#3b82f6' }}>{hourProgress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${hourProgress}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                      borderRadius: 4
                    }} />
                  </div>
                </div>

                {/* Topics list */}
                {topics.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Topic Curriculum ({doneTopics}/{topics.length})
                    </div>
                    {topics.map(t => (
                      <div
                        key={t.id}
                        onClick={() => toggleCourseTopic(course.id, t.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', borderRadius: 8, background: 'var(--bg-elevated)',
                          cursor: 'pointer', fontSize: 12
                        }}
                      >
                        {t.completed ? (
                          <CheckCircle2 size={14} color="var(--color-success)" />
                        ) : (
                          <Circle size={14} color="var(--text-muted)" />
                        )}
                        <span style={{
                          color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: t.completed ? 'line-through' : 'none'
                        }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent Study Sessions Table */}
      {studySessions.length > 0 && (
        <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--accent-primary)" />
            <span>Verified Study Log History</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {studySessions.slice(0, 10).map(s => (
              <div
                key={s.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10,
                  fontSize: 12, flexWrap: 'wrap', gap: 8
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {s.subject} {s.topicsCovered && `• ${s.topicsCovered}`}
                  </div>
                  {s.notes && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {s.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, color: '#3b82f6' }}>{s.durationMinutes} mins</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Course */}
      {showAddCourse && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Register Course Curriculum
            </h2>

            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Course Title *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Distributed Systems & Consensus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Computer Science"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Hours</label>
                  <input
                    type="number"
                    className="input"
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                    min={1}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Instructor / Resource</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. MIT OpenCourseWare / Martin Kleppmann"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Curriculum Topics</label>
                {topicsInput.map((top, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className="input input-sm"
                    placeholder={`Topic ${idx + 1}`}
                    value={top}
                    onChange={(e) => {
                      const updated = [...topicsInput];
                      updated[idx] = e.target.value;
                      setTopicsInput(updated);
                    }}
                    style={{ marginBottom: 6 }}
                  />
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTopicsInput([...topicsInput, ''])}
                  style={{ fontSize: 11, color: '#3b82f6' }}
                >
                  + Add topic
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddCourse(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Study Session */}
      {showLogSession && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Log Study Session
            </h2>

            <form onSubmit={handleLogSession} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Associated Course</label>
                <select 
                  className="input"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">General (No course)</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.subject})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration (Minutes) *</label>
                  <input
                    type="number"
                    className="input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    min={5}
                    step={5}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Algorithms"
                    value={sessionSubject}
                    onChange={(e) => setSessionSubject(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Topic Covered</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Raft election timeouts"
                  value={topicsCovered}
                  onChange={(e) => setTopicsCovered(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retention Notes</label>
                <textarea
                  className="input"
                  placeholder="Key insights retained during this session…"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowLogSession(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Record Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

