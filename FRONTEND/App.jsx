/**
 * =============================================================================
 * MORPHEUS ECHO - REACT APPLICATION (DEMO MODE)
 * =============================================================================
 * Complete React SPA with mock data for demo preview
 * Works without backend connection
 * =============================================================================
 */

import React, { useState, useEffect, useRef, useCallback, useContext, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';

// =============================================================================
// MOCK DATA FOR DEMO
// =============================================================================
const MOCK_USER = {
  id: 'demo123',
  anonymousName: 'Crimson Phoenix of Avalon 7',
  rarity: 'LEGENDARY',
  gender: 'male',
  xp: 1250,
  level: 13,
  title: 'Whisperer',
  streak: 5,
  badges: ['mythical'],
  totalConfessions: 12,
  totalReactions: 89,
  followers: 45,
  following: 23
};

const MOCK_CONFESSIONS = [
  {
    _id: '1',
    authorName: 'Azure Dragon of Shambhala 3',
    author: { _id: 'user1', anonymousName: 'Azure Dragon of Shambhala 3', rarity: 'LEGENDARY', level: 45, title: 'Shadow Voice' },
    type: 'text',
    content: "I've been in love with my best friend for 5 years but never had the courage to tell them. Every time they talk about their crushes, my heart breaks a little more. I know I'll never say anything because I'd rather have them in my life as a friend than risk losing them completely.",
    categories: ['romantic', 'mental'],
    mood: '💔',
    reactions: { meToo: ['u1', 'u2', 'u3'], sendingLove: ['u4', 'u5'], wow: [], sameLol: [], stayStrong: ['u6'], respect: ['u7', 'u8'] },
    commentCount: 12,
    views: 234,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: '2',
    authorName: 'Void Walker of Eternity 1',
    author: { _id: 'user2', anonymousName: 'Void Walker of Eternity 1', rarity: 'MYTHIC', level: 89, title: 'Confessor' },
    type: 'voice',
    audioDuration: 45,
    categories: ['sorrow'],
    mood: '😢',
    reactions: { meToo: ['u1'], sendingLove: ['u2', 'u3', 'u4', 'u5'], wow: ['u6'], sameLol: [], stayStrong: ['u7', 'u8', 'u9'], respect: ['u10'] },
    commentCount: 28,
    views: 567,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: '3',
    authorName: 'Golden Unicorn of Kyoto 9',
    author: { _id: 'user3', anonymousName: 'Golden Unicorn of Kyoto 9', rarity: 'RARE', level: 23, title: 'Whisperer' },
    type: 'text',
    content: "I cheated on my final exam and got the highest score in class. Everyone thinks I'm smart but I just had the answers on my phone. The guilt is eating me alive.",
    categories: ['crime', 'mental'],
    mood: '😰',
    reactions: { meToo: ['u1', 'u2'], sendingLove: ['u3'], wow: ['u4', 'u5', 'u6'], sameLol: [], stayStrong: [], respect: [] },
    commentCount: 45,
    views: 892,
    createdAt: new Date(Date.now() - 10800000).toISOString()
  },
  {
    _id: '4',
    authorName: 'Silver Wolf of Delphi 2',
    author: { _id: 'user4', anonymousName: 'Silver Wolf of Delphi 2', rarity: 'UNCOMMON', level: 34, title: 'Whisperer' },
    type: 'text',
    content: "My parents think I'm at university studying medicine. I've been failing for two years and haven't told them. I work at a coffee shop and pretend everything is fine when they call.",
    categories: ['family', 'work'],
    mood: '😔',
    reactions: { meToo: ['u1', 'u2', 'u3', 'u4'], sendingLove: ['u5', 'u6'], wow: [], sameLol: ['u7'], stayStrong: ['u8', 'u9'], respect: ['u10'] },
    commentCount: 67,
    views: 1234,
    createdAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    _id: '5',
    authorName: 'Obsidian Raven of Asgard 5',
    author: { _id: 'user5', anonymousName: 'Obsidian Raven of Asgard 5', rarity: 'EXCLUSIVE', level: 67, title: 'Shadow Voice' },
    type: 'voice',
    audioDuration: 78,
    categories: ['adult', 'romantic'],
    mood: '🔥',
    reactions: { meToo: ['u1'], sendingLove: ['u2'], wow: ['u3', 'u4', 'u5', 'u6'], sameLol: ['u7'], stayStrong: [], respect: ['u8'] },
    commentCount: 34,
    views: 1567,
    createdAt: new Date(Date.now() - 18000000).toISOString()
  }
];

const MOCK_NOTIFICATIONS = [
  { _id: '1', type: 'reaction', message: 'Crimson Phoenix of Avalon 7 sent you Sending Love', read: false, createdAt: new Date(Date.now() - 300000).toISOString() },
  { _id: '2', type: 'comment', message: 'Azure Dragon of Shambhala 3 commented on your whisper', read: false, createdAt: new Date(Date.now() - 900000).toISOString() },
  { _id: '3', type: 'follow', message: 'Void Walker of Eternity 1 is now following you', read: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: '4', type: 'message', message: 'New whisper from Golden Unicorn of Kyoto 9', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() }
];

const MOCK_CONVERSATIONS = [
  {
    partner: { _id: 'user1', anonymousName: 'Azure Dragon of Shambhala 3', rarity: 'LEGENDARY' },
    lastMessage: { content: 'Thank you for sharing that. I feel the same way...', createdAt: new Date(Date.now() - 300000).toISOString() },
    unread: 2
  },
  {
    partner: { _id: 'user2', anonymousName: 'Void Walker of Eternity 1', rarity: 'MYTHIC' },
    lastMessage: { content: 'Your voice confession really touched me', createdAt: new Date(Date.now() - 3600000).toISOString() },
    unread: 0
  }
];

const MOCK_MESSAGES = [
  { _id: '1', sender: { _id: 'user1' }, content: 'Hey, I read your confession about your best friend...', createdAt: new Date(Date.now() - 3600000).toISOString(), read: true },
  { _id: '2', sender: { _id: 'demo123' }, content: 'Yeah, it\'s been really hard keeping it in', createdAt: new Date(Date.now() - 3500000).toISOString(), read: true },
  { _id: '3', sender: { _id: 'user1' }, content: 'Thank you for sharing that. I feel the same way...', createdAt: new Date(Date.now() - 300000).toISOString(), read: false }
];

// =============================================================================
// CONSTANTS
// =============================================================================
const CATEGORIES = [
  { id: 'adult', name: 'Adult', color: '#8B0000' },
  { id: 'crime', name: 'Crime', color: '#4A4A4A' },
  { id: 'funny', name: 'Funny', color: '#FFD700' },
  { id: 'romantic', name: 'Romantic Crush', color: '#FF69B4' },
  { id: 'insult', name: 'Insult', color: '#FF8C00' },
  { id: 'sorrow', name: 'Sorrow & Grief', color: '#191970' },
  { id: 'pain', name: 'Pain', color: '#800000' },
  { id: 'god', name: 'To The God', color: '#FFD700' },
  { id: 'family', name: 'Dear Family', color: '#8B4513' },
  { id: 'opinion', name: 'Unpopular Opinions', color: '#800080' },
  { id: 'work', name: 'Work & Career', color: '#008080' },
  { id: 'mental', name: 'Mental Health', color: '#90EE90' }
];

const REACTIONS = {
  meToo: { emoji: '🙋', label: 'Me Too' },
  sendingLove: { emoji: '💝', label: 'Sending Love' },
  wow: { emoji: '😮', label: 'Wow' },
  sameLol: { emoji: '😂', label: 'Same Lol' },
  stayStrong: { emoji: '💪', label: 'Stay Strong' },
  respect: { emoji: '🙏', label: 'Respect' }
};

const VOICE_EFFECTS = [
  { id: 'normal', name: 'Normal' },
  { id: 'whisper', name: 'Whisper' },
  { id: 'deep', name: 'Deep' },
  { id: 'echo', name: 'Echo' },
  { id: 'robotic', name: 'Robotic' }
];

const AMBIENT_SOUNDS = [
  { id: 'silence', name: 'Silence' },
  { id: 'rain', name: 'Rain' },
  { id: 'night', name: 'Night Crickets' },
  { id: 'cafe', name: 'Cafe' },
  { id: 'ocean', name: 'Ocean Waves' },
  { id: 'thunder', name: 'Thunder' },
  { id: 'fire', name: 'Fireplace' }
];

const MOOD_EMOJIS = ['😊', '😢', '😡', '❤️', '😂', '😰', '🙏', '🤔', '😴', '🤗', '😎', '🥺', '😤', '🤯', '✨', '💔', '🌟', '🔥', '💫', '🌙'];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
};

const getRarityColor = (rarity) => {
  const colors = {
    MYTHIC: '#FF00FF',
    LEGENDARY: '#FFD700',
    EXCLUSIVE: '#00FFFF',
    RARE: '#C9A84C',
    UNCOMMON: '#C0C0C0',
    COMMON: '#9CA3AF'
  };
  return colors[rarity] || colors.COMMON;
};

const getRarityFrameClass = (rarity) => {
  const classes = {
    MYTHIC: 'frame-mythic',
    LEGENDARY: 'frame-legendary',
    EXCLUSIVE: 'frame-exclusive',
    RARE: 'frame-rare',
    UNCOMMON: 'frame-uncommon',
    COMMON: 'frame-common'
  };
  return classes[rarity] || classes.COMMON;
};

const getRarityTextClass = (rarity) => {
  const classes = {
    MYTHIC: 'text-mythic',
    LEGENDARY: 'text-legendary',
    EXCLUSIVE: 'text-exclusive',
    RARE: 'text-rare',
    UNCOMMON: 'text-uncommon',
    COMMON: 'text-common'
  };
  return classes[rarity] || classes.COMMON;
};

const getRarityOrbClass = (rarity) => {
  const classes = {
    MYTHIC: 'orb-mythic',
    LEGENDARY: 'orb-legendary',
    EXCLUSIVE: 'orb-exclusive',
    RARE: 'orb-rare',
    UNCOMMON: 'orb-uncommon',
    COMMON: 'orb-common'
  };
  return classes[rarity] || classes.COMMON;
};

const getCategoryClass = (categoryId) => `cat-${categoryId}`;

// =============================================================================
// AUTH CONTEXT
// =============================================================================
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('morpheus_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    if (username && password) {
      localStorage.setItem('morpheus_user', JSON.stringify(MOCK_USER));
      setUser(MOCK_USER);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const signup = async (userData) => {
    const newUser = { ...MOCK_USER, anonymousName: 'Emerald Griffin of Atlantis 4', rarity: 'LEGENDARY', gender: userData.gender };
    localStorage.setItem('morpheus_user', JSON.stringify(newUser));
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    localStorage.removeItem('morpheus_user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// =============================================================================
// PROTECTED ROUTE
// =============================================================================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#111111]"><div className="text-[#9D97FF]">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// =============================================================================
// RARITY BADGE
// =============================================================================
const RarityBadge = ({ rarity, size = 'md' }) => {
  if (rarity === 'COMMON') return null;
  const sizeClasses = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-3 py-1', lg: 'text-sm px-4 py-1.5' };
  const config = {
    MYTHIC: { color: '#FF00FF', icon: '∞' },
    LEGENDARY: { color: '#FFD700', icon: '⚡' },
    EXCLUSIVE: { color: '#00FFFF', icon: '💎' },
    RARE: { color: '#C9A84C', icon: '✨' },
    UNCOMMON: { color: '#C0C0C0', icon: '🌙' }
  }[rarity];
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{ background: `${config.color}20`, color: config.color, boxShadow: `0 0 10px ${config.color}40` }}>
      {config.icon} {rarity}
    </span>
  );
};

// =============================================================================
// AUTHOR ORB
// =============================================================================
const AuthorOrb = ({ rarity, size = 40 }) => (
  <div className={`${getRarityOrbClass(rarity)} rounded-full flex items-center justify-center`} style={{ width: size, height: size }}>
    <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  </div>
);

// =============================================================================
// CONFESSION CARD
// =============================================================================
const ConfessionCard = ({ confession }) => {
  const { user } = useAuth();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [localReactions, setLocalReactions] = useState(confession.reactions);
  const progressInterval = useRef(null);

  const handleHoldStart = () => {
    if (isRevealed) return;
    setIsHolding(true);
    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / 1500) * 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        setIsRevealed(true);
        clearInterval(progressInterval.current);
      }
    }, 16);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    clearInterval(progressInterval.current);
    if (!isRevealed) setHoldProgress(0);
  };

  const handleReaction = (reactionType) => {
    setLocalReactions(prev => {
      const hasReacted = prev[reactionType]?.includes(user?.id);
      return {
        ...prev,
        [reactionType]: hasReacted
          ? prev[reactionType].filter(id => id !== user?.id)
          : [...(prev[reactionType] || []), user?.id]
      };
    });
  };

  const hasReacted = (type) => localReactions[type]?.includes(user?.id);
  const reactionCount = (type) => localReactions[type]?.length || 0;

  return (
    <div className={`confession-card ${getRarityFrameClass(confession.author?.rarity)}`}>
      <div className="card-header">
        <AuthorOrb rarity={confession.author?.rarity} size={40} />
        <div className="author-info">
          <Link to={`/profile/${confession.author?._id}`} className={`author-name ${getRarityTextClass(confession.author?.rarity)}`}>
            {confession.authorName}
          </Link>
          <div className="author-meta">
            <span className="level-badge">Lvl {confession.author?.level}</span>
            <span>{confession.author?.title}</span>
            <span>•</span>
            <span>{formatRelativeTime(confession.createdAt)}</span>
          </div>
        </div>
        <RarityBadge rarity={confession.author?.rarity} size="sm" />
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {confession.categories?.map(cat => (
          <span key={cat} className={`category-pill ${getCategoryClass(cat)}`}
            style={{ background: `${CATEGORIES.find(c => c.id === cat)?.color}20`, color: CATEGORIES.find(c => c.id === cat)?.color, border: `1px solid ${CATEGORIES.find(c => c.id === cat)?.color}40` }}>
            {CATEGORIES.find(c => c.id === cat)?.name || cat}
          </span>
        ))}
        {confession.mood && <span className="text-lg">{confession.mood}</span>}
      </div>

      <div className="blur-reveal-container relative" onMouseDown={handleHoldStart} onMouseUp={handleHoldEnd} onMouseLeave={handleHoldEnd} onTouchStart={handleHoldStart} onTouchEnd={handleHoldEnd}>
        <div className={`blur-content ${isRevealed ? 'revealed' : ''}`}>
          {confession.type === 'text' ? (
            <p className="card-content">{confession.content}</p>
          ) : (
            <div className="audio-player">
              <button className="play-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
              <div className="waveform">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="waveform-bar" style={{ height: `${Math.random() * 30 + 10}px` }}></div>
                ))}
              </div>
              <span className="audio-duration">{Math.floor(confession.audioDuration / 60)}:{String(Math.floor(confession.audioDuration % 60)).padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {!isRevealed && (
          <div className="blur-overlay">
            <button className="hold-to-reveal-btn">
              <div className="progress-ring">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle className="progress-ring-bg" cx="24" cy="24" r="20"></circle>
                  <circle className="progress-ring-circle" cx="24" cy="24" r="20" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - holdProgress / 100)}`}></circle>
                </svg>
              </div>
              <span>Hold to reveal</span>
            </button>
          </div>
        )}
      </div>

      <div className="card-actions">
        <div className="reactions-row">
          {Object.entries(REACTIONS).map(([type, { emoji, label }]) => (
            <button key={type} onClick={() => handleReaction(type)} className={`reaction-btn ${hasReacted(type) ? 'active' : ''}`}>
              <span>{emoji}</span>
              <span>{reactionCount(type) > 0 ? reactionCount(type) : label}</span>
            </button>
          ))}
        </div>
        <div className="action-buttons">
          <button className="action-btn" title="Comments">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {confession.commentCount > 0 && <span>{confession.commentCount}</span>}
          </button>
          <button className="action-btn" title="Share">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BOTTOM NAVIGATION
// =============================================================================
const BottomNav = () => {
  const { user } = useAuth();
  const location = window.location.pathname;
  const unreadCount = 2;

  const navItems = [
    { path: '/', icon: 'home', label: 'Feed' },
    { path: '/create', icon: 'edit', label: 'Confess' },
    { path: '/radio', icon: 'radio', label: 'Radio' },
    { path: '/messages', icon: 'message-circle', label: 'Messages' },
    { path: '/notifications', icon: 'bell', label: 'Alerts', badge: unreadCount },
    { path: '/profile/me', icon: 'user', label: 'Profile' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path} className={`nav-item ${location === item.path ? 'active' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {item.icon === 'home' && <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
            {item.icon === 'edit' && <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
            {item.icon === 'radio' && <><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></>}
            {item.icon === 'message-circle' && <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>}
            {item.icon === 'bell' && <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}
            {item.icon === 'user' && <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
          </svg>
          <span>{item.label}</span>
          {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
        </Link>
      ))}
    </nav>
  );
};

// =============================================================================
// SIDEBAR NAVIGATION
// =============================================================================
const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = window.location.pathname;
  const unreadCount = 2;

  const navItems = [
    { path: '/', icon: 'home', label: 'Feed' },
    { path: '/create', icon: 'edit', label: 'Confess' },
    { path: '/radio', icon: 'radio', label: 'Radio' },
    { path: '/messages', icon: 'message-circle', label: 'Messages' },
    { path: '/notifications', icon: 'bell', label: 'Notifications', badge: unreadCount },
    { path: '/profile/me', icon: 'user', label: 'Profile' }
  ];

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-logo">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9D97FF] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-white">Morpheus</h1>
          <p className="text-xs text-gray-400">Echo</p>
        </div>
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={`sidebar-item ${location === item.path ? 'active' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.icon === 'home' && <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
              {item.icon === 'edit' && <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}
              {item.icon === 'radio' && <><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></>}
              {item.icon === 'message-circle' && <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>}
              {item.icon === 'bell' && <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}
              {item.icon === 'user' && <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
            </svg>
            <span>{item.label}</span>
            {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>}
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-[#6C63FF]/10">
        <button onClick={logout} className="sidebar-item w-full text-left text-red-400 hover:text-red-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

// =============================================================================
// LOGIN PAGE
// =============================================================================
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', gender: 'prefer_not_to_say', age: '', ageVerified: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const result = await login(formData.username, formData.password);
      if (result.success) navigate('/');
      else setError(result.error);
    } else {
      const result = await signup({ ...formData, age: parseInt(formData.age) });
      if (result.success) navigate('/reveal', { state: { user: result.user } });
      else setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Morpheus Echo</h1>
          <p className="text-gray-400 text-sm italic">"Whisper your truth. Echo your soul."</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Sign In</button>
          <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Join</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="input-field" placeholder="Choose a username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required minLength={3} />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="input-field" placeholder="Min 6 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <div className="radio-group">
                  <label className="radio-label"><input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} /> Male</label>
                  <label className="radio-label"><input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} /> Female</label>
                  <label className="radio-label"><input type="radio" name="gender" value="prefer_not_to_say" checked={formData.gender === 'prefer_not_to_say'} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} /> Prefer not to say</label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" className="input-field" placeholder="Must be 18+" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} required min={18} max={120} />
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.ageVerified} onChange={(e) => setFormData({ ...formData, ageVerified: e.target.checked })} required />
                  <span className="text-sm text-gray-400">I confirm I am 18 years or older</span>
                </label>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading || (!isLogin && !formData.ageVerified)}>
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Identity'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =============================================================================
// IDENTITY REVEAL PAGE
// =============================================================================
const IdentityRevealPage = () => {
  const location = window.location;
  const user = location.state?.user || MOCK_USER;
  const navigate = useNavigate();
  const [isRevealed, setIsRevealed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const progressInterval = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => { if (isRevealed) navigate('/'); }, 3000);
    return () => clearTimeout(timer);
  }, [isRevealed, navigate]);

  const handleHoldStart = () => {
    setIsHolding(true);
    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / 1500) * 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        setIsRevealed(true);
        clearInterval(progressInterval.current);
      }
    }, 16);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    clearInterval(progressInterval.current);
    if (!isRevealed) setHoldProgress(0);
  };

  return (
    <div className="identity-reveal-screen">
      <div className="text-center">
        {!isRevealed ? (
          <>
            <h2 className="reveal-title">🔮 GUESS WHO IS THIS? 🔮</h2>
            <div className="hold-reveal-container">
              <div className={`w-64 h-32 ${getRarityFrameClass(user.rarity)} rounded-xl flex items-center justify-center mb-8`} style={{ filter: `blur(${20 - (holdProgress / 100) * 20}px)` }}>
                <span className={`font-display text-xl ${getRarityTextClass(user.rarity)}`}>{user.anonymousName}</span>
              </div>
              <button className="hold-to-reveal-btn" onMouseDown={handleHoldStart} onMouseUp={handleHoldEnd} onMouseLeave={handleHoldEnd} onTouchStart={handleHoldStart} onTouchEnd={handleHoldEnd}>
                <div className="progress-ring">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle className="progress-ring-bg" cx="24" cy="24" r="20"></circle>
                    <circle className="progress-ring-circle" cx="24" cy="24" r="20" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - holdProgress / 100)}`}></circle>
                  </svg>
                </div>
                <span>HOLD TO REVEAL</span>
              </button>
            </div>
          </>
        ) : (
          <div>
            <h2 className="reveal-title mb-8">✨ YOUR IDENTITY IS ✨</h2>
            <div className={`identity-card ${getRarityFrameClass(user.rarity)}`}>
              <AuthorOrb rarity={user.rarity} size={80} />
              <h3 className={`identity-name ${getRarityTextClass(user.rarity)}`}>{user.anonymousName}</h3>
              <p className="identity-rarity" style={{ color: getRarityColor(user.rarity) }}>{user.rarity}</p>
              <p className="identity-quote">"Your secret name. Your truth.<br />Guard it well."</p>
            </div>
            <p className="mt-8 text-gray-400">Entering the Echo...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// HOME FEED PAGE
// =============================================================================
const HomePage = () => {
  const [confessions, setConfessions] = useState(MOCK_CONFESSIONS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');

  const filteredConfessions = selectedCategory === 'all' 
    ? confessions 
    : confessions.filter(c => c.categories.includes(selectedCategory));

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="sticky top-0 z-10 bg-[#111111]/95 backdrop-blur-lg border-b border-[#6C63FF]/10">
        <div className="p-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
            <button onClick={() => setSelectedCategory('all')} className={`category-pill whitespace-nowrap ${selectedCategory === 'all' ? 'bg-[#6C63FF] text-white' : 'bg-[#2D2D44] text-gray-400'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`category-pill whitespace-nowrap ${selectedCategory === cat.id ? 'ring-2 ring-white' : ''}`} style={{ background: `${cat.color}20`, color: cat.color, border: `1px solid ${cat.color}40` }}>{cat.name}</button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {['trending', 'new', 'following'].map(sort => (
              <button key={sort} onClick={() => setSortBy(sort)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${sortBy === sort ? 'bg-[#6C63FF] text-white' : 'bg-[#2D2D44] text-gray-400 hover:bg-[#3D3D54]'}`}>
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {filteredConfessions.map(confession => (
            <ConfessionCard key={confession._id} confession={confession} />
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// CREATE CONFESSION PAGE
// =============================================================================
const CreatePage = () => {
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [voiceEffect, setVoiceEffect] = useState('normal');
  const [ambientSound, setAmbientSound] = useState('silence');
  const [expiry, setExpiry] = useState('7d');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const startRecording = () => {
    setIsRecording(true);
    let time = 0;
    timerRef.current = setInterval(() => {
      time += 1;
      setRecordingTime(time);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    setAudioBlob(new Blob());
  };

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : prev.length < 3 ? [...prev, catId] : prev
    );
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) { alert('Select at least one category'); return; }
    setLoading(true);
    setTimeout(() => {
      alert('Your whisper has been shared! (Demo Mode)');
      navigate('/');
      setLoading(false);
    }, 1000);
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="p-4">
        <h1 className="font-display text-2xl mb-6 text-white">Share Your Whisper</h1>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setType('text')} className={`flex-1 py-4 rounded-xl border-2 transition-all ${type === 'text' ? 'border-[#6C63FF] bg-[#6C63FF]/10' : 'border-[#2D2D44] bg-[#2D2D44]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-300"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            <span className="text-sm text-gray-300">Text</span>
          </button>
          <button onClick={() => setType('voice')} className={`flex-1 py-4 rounded-xl border-2 transition-all ${type === 'voice' ? 'border-[#6C63FF] bg-[#6C63FF]/10' : 'border-[#2D2D44] bg-[#2D2D44]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-gray-300"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            <span className="text-sm text-gray-300">Voice</span>
          </button>
        </div>

        {type === 'text' ? (
          <div className="mb-6">
            <textarea className="input-field textarea-field" placeholder="Your secret is safe here..." value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} />
            <p className={`text-right text-sm mt-2 ${wordCount > 200 ? 'text-red-400' : 'text-gray-400'}`}>{wordCount} / 200 words</p>
          </div>
        ) : (
          <div className="mb-6">
            {!audioBlob ? (
              <div className="recorder-container bg-[#2D2D44] rounded-xl py-12">
                <button onClick={isRecording ? stopRecording : startRecording} className={`record-btn ${isRecording ? 'recording' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">{isRecording ? <rect x="6" y="6" width="12" height="12"/> : <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>}</svg>
                </button>
                {isRecording && <div className="recording-timer text-red-400 text-2xl font-display">{formatTime(recordingTime)}</div>}
                <p className="text-gray-400 text-sm">{isRecording ? 'Tap to stop' : 'Tap to record (max 100s)'}</p>
              </div>
            ) : (
              <div className="bg-[#2D2D44] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <button className="play-btn w-12 h-12"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
                  <div className="flex-1"><div className="waveform h-10">{Array.from({ length: 20 }).map((_, i) => <div key={i} className="waveform-bar" style={{ height: `${Math.random() * 30 + 10}px` }}></div>)}</div></div>
                  <span className="text-sm text-gray-400">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={() => { setAudioBlob(null); setRecordingTime(0); }} className="mt-4 text-sm text-red-400 hover:text-red-300">Re-record</button>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Voice Effect</p>
              <div className="flex gap-2 flex-wrap">
                {VOICE_EFFECTS.map(effect => (
                  <button key={effect.id} onClick={() => setVoiceEffect(effect.id)} className={`px-4 py-2 rounded-full text-sm transition-all ${voiceEffect === effect.id ? 'bg-[#6C63FF] text-white' : 'bg-[#2D2D44] text-gray-400'}`}>{effect.name}</button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Ambient Sound</p>
              <div className="flex gap-2 flex-wrap">
                {AMBIENT_SOUNDS.map(sound => (
                  <button key={sound.id} onClick={() => setAmbientSound(sound.id)} className={`px-4 py-2 rounded-full text-sm transition-all ${ambientSound === sound.id ? 'bg-[#6C63FF] text-white' : 'bg-[#2D2D44] text-gray-400'}`}>{sound.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Categories ({selectedCategories.length}/3)</p>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)} className={`category-pill transition-all ${selectedCategories.includes(cat.id) ? 'ring-2 ring-white' : ''}`} style={{ background: selectedCategories.includes(cat.id) ? cat.color : `${cat.color}30`, color: selectedCategories.includes(cat.id) ? '#000' : cat.color, border: `1px solid ${cat.color}60` }}>{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Mood (optional)</p>
          <div className="flex gap-2 flex-wrap">
            {MOOD_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => setSelectedMood(selectedMood === emoji ? '' : emoji)} className={`text-2xl p-2 rounded-lg transition-all ${selectedMood === emoji ? 'bg-[#6C63FF]/30 scale-110' : 'hover:bg-[#2D2D44]'}`}>{emoji}</button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Expires in</p>
          <div className="flex gap-2">
            {[{ id: '24h', label: '24 Hours' }, { id: '7d', label: '7 Days' }, { id: 'never', label: 'Never' }].map(opt => (
              <button key={opt.id} onClick={() => setExpiry(opt.id)} className={`flex-1 py-3 rounded-lg text-sm transition-all ${expiry === opt.id ? 'bg-[#6C63FF] text-white' : 'bg-[#2D2D44] text-gray-400'}`}>{opt.label}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || selectedCategories.length === 0 || (type === 'text' ? !content.trim() : !audioBlob)} className="btn-primary">
          {loading ? 'Sharing...' : 'Whisper It'}
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// RADIO MODE PAGE
// =============================================================================
const RadioPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentConfession, setCurrentConfession] = useState(MOCK_CONFESSIONS[1]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleNext = () => {
    const random = MOCK_CONFESSIONS[Math.floor(Math.random() * MOCK_CONFESSIONS.length)];
    setCurrentConfession(random);
    setIsPlaying(true);
  };

  return (
    <div className="radio-container">
      <div className="radio-visualizer">
        {[1, 2, 3, 4].map(i => <div key={i} className="visualizer-ring"></div>)}
      </div>

      <div className="w-full px-4 mb-8 z-10">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar justify-center">
          <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'all' ? 'bg-[#6C63FF] text-white' : 'bg-[#2D2D44] text-gray-400'}`}>All</button>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'ring-2 ring-white' : ''}`} style={{ background: selectedCategory === cat.id ? cat.color : `${cat.color}30`, color: selectedCategory === cat.id ? '#000' : cat.color }}>{cat.name}</button>
          ))}
        </div>
      </div>

      <div className="radio-player">
        <div className={`radio-orb ${getRarityOrbClass(currentConfession.author?.rarity)}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>

        <div className="radio-info">
          <h2 className={`radio-author ${getRarityTextClass(currentConfession.author?.rarity)}`}>{currentConfession.authorName}</h2>
          <span className="radio-category" style={{ background: `${CATEGORIES.find(c => c.id === currentConfession.categories?.[0])?.color || '#6C63FF'}30`, color: CATEGORIES.find(c => c.id === currentConfession.categories?.[0])?.color || '#6C63FF' }}>{CATEGORIES.find(c => c.id === currentConfession.categories?.[0])?.name || 'General'}</span>
        </div>

        <div className="radio-controls">
          <button onClick={handleNext} className="radio-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="radio-btn play"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">{isPlaying ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> : <polygon points="5 3 19 12 5 21 5 3"/>}</svg></button>
          <button onClick={handleNext} className="radio-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg></button>
        </div>

        <p className="mt-8 text-gray-400 text-sm">5 whispers in queue</p>
      </div>
    </div>
  );
};

// =============================================================================
// MESSAGES PAGE
// =============================================================================
const MessagesPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser]);

  return (
    <div className="messages-container">
      <div className="conversations-list">
        <div className="p-4 border-b border-[#6C63FF]/10"><h2 className="font-display text-xl text-white">Messages</h2></div>
        {MOCK_CONVERSATIONS.map((conv, idx) => (
          <div key={idx} onClick={() => setSelectedUser(conv.partner._id)} className={`conversation-item ${selectedUser === conv.partner._id ? 'active' : ''}`}>
            <AuthorOrb rarity={conv.partner.rarity} size={44} />
            <div className="conversation-preview">
              <p className="conversation-name text-white">{conv.partner.anonymousName}</p>
              <p className="conversation-text">{conv.lastMessage.content}</p>
            </div>
            <div className="conversation-meta">
              <p className="conversation-time">{formatRelativeTime(conv.lastMessage.createdAt)}</p>
              {conv.unread > 0 && <span className="bg-[#6C63FF] text-white text-xs px-2 py-0.5 rounded-full">{conv.unread}</span>}
            </div>
          </div>
        ))}
      </div>

      {selectedUser ? (
        <div className="chat-container">
          <div className="chat-header">
            <AuthorOrb rarity={MOCK_CONVERSATIONS.find(c => c.partner._id === selectedUser)?.partner.rarity} size={36} />
            <span className="font-semibold text-white">{MOCK_CONVERSATIONS.find(c => c.partner._id === selectedUser)?.partner.anonymousName}</span>
          </div>

          <div className="chat-messages">
            {MOCK_MESSAGES.map((msg, idx) => (
              <div key={idx} className={`message-bubble ${msg.sender._id === selectedUser ? 'received' : 'sent'}`}>
                <p>{msg.content}</p>
                <p className="message-time">{formatRelativeTime(msg.createdAt)}{msg.sender._id !== selectedUser && <span className="ml-2">{msg.read ? '✓✓' : '✓'}</span>}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input type="text" className="chat-input" placeholder="Type your whisper..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} maxLength={500} />
            <button onClick={() => { if (newMessage.trim()) { setNewMessage(''); alert('Message sent (Demo Mode)'); } }} className="chat-send-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
          </div>
        </div>
      ) : (
        <div className="chat-container flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <p>Select a conversation to start whispering</p>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// NOTIFICATIONS PAGE
// =============================================================================
const NotificationsPage = () => {
  const getNotificationIcon = (type) => ({ reaction: 'heart', comment: 'message-square', message: 'message-circle', follow: 'user-plus', chain: 'link', streak: 'flame', level: 'trending-up' }[type] || 'bell');

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="sticky top-0 z-10 bg-[#111111]/95 backdrop-blur-lg border-b border-[#6C63FF]/10">
        <div className="p-4 flex items-center justify-between">
          <h1 className="font-display text-xl text-white">Notifications</h1>
          {MOCK_NOTIFICATIONS.some(n => !n.read) && <button className="text-sm text-[#6C63FF] hover:text-[#9D97FF]">Mark all read</button>}
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {MOCK_NOTIFICATIONS.map((notification, idx) => (
            <div key={idx} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
              <div className="notification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6C63FF]">
                  {getNotificationIcon(notification.type) === 'heart' && <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>}
                  {getNotificationIcon(notification.type) === 'message-square' && <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}
                  {getNotificationIcon(notification.type) === 'message-circle' && <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>}
                  {getNotificationIcon(notification.type) === 'user-plus' && <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>}
                  {getNotificationIcon(notification.type) === 'bell' && <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}
                </svg>
              </div>
              <div className="notification-content">
                <p className="notification-text text-white">{notification.message}</p>
                <p className="notification-time">{formatRelativeTime(notification.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PROFILE PAGE
// =============================================================================
const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const profile = id === 'me' || id === currentUser?.id ? currentUser : MOCK_CONFESSIONS[0].author;
  const isOwnProfile = id === 'me' || id === currentUser?.id;
  const xpPercent = ((profile.xp % 100) / 100) * 100;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="profile-header">
        <div className={`profile-orb ${getRarityOrbClass(profile.rarity)}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h1 className={`profile-name ${getRarityTextClass(profile.rarity)}`}>{profile.anonymousName}</h1>
        <p className="profile-title">{profile.title}</p>
        <RarityBadge rarity={profile.rarity} />

        <div className="profile-stats">
          <div className="stat-item"><p className="stat-value">{profile.totalConfessions}</p><p className="stat-label">Whispers</p></div>
          <div className="stat-item"><p className="stat-value">{profile.totalReactions}</p><p className="stat-label">Echoes</p></div>
          <div className="stat-item"><p className="stat-value">{profile.followers}</p><p className="stat-label">Followers</p></div>
          <div className="stat-item"><p className="stat-value">{profile.following}</p><p className="stat-label">Following</p></div>
        </div>

        {!isOwnProfile && (
          <div className="profile-actions">
            <button className="profile-btn primary">Follow</button>
            <Link to={`/messages?to=${profile._id}`} className="profile-btn secondary">Message</Link>
          </div>
        )}

        <div className="xp-bar-container">
          <div className="xp-bar-label"><span>Level {profile.level}</span><span>{profile.xp} XP</span></div>
          <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${xpPercent}%` }}></div></div>
        </div>
      </div>

      {profile.badges?.length > 0 && (
        <div className="badges-section">
          <p className="badges-title">Badges</p>
          <div className="badges-list">
            {profile.badges.map((badge, idx) => <span key={idx} className="badge" style={{ background: 'rgba(108, 99, 255, 0.2)', color: '#9D97FF' }}>{badge}</span>)}
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-white">Whispers</h3>
        <div className="space-y-4">
          {MOCK_CONFESSIONS.slice(0, 2).map(confession => <ConfessionCard key={confession._id} confession={confession} />)}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN APP LAYOUT
// =============================================================================
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-[#111111]">
    <Sidebar />
    <main className="main-content md:ml-60">
      <div className="page-container">{children}</div>
    </main>
    <BottomNav />
  </div>
);

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reveal" element={<IdentityRevealPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout><HomePage /></AppLayout></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><AppLayout><CreatePage /></AppLayout></ProtectedRoute>} />
        <Route path="/radio" element={<ProtectedRoute><AppLayout><RadioPage /></AppLayout></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><AppLayout><MessagesPage /></AppLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);



export default App;
