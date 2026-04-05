import React, { useState, useEffect, useRef, useContext, createContext, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import transparentLogo from '../../MEDIA/transparent-logo.png';

// =============================================================================
// MOCK DATA FOR DEMO
// =============================================================================
const MOCK_USER = {
  _id: 'demo123',
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
  following: 23,
  isFollowing: false
};

const MOCK_CONFESSIONS = [
  {
    _id: '1',
    authorName: 'Azure Dragon of Shambhala 3',
    author: { _id: 'user1', anonymousName: 'Azure Dragon of Shambhala 3', rarity: 'LEGENDARY', level: 45, title: 'Shadow Voice' },
    type: 'text',
    content: "I've been in love with my best friend for 5 years but never had the courage to tell them. Every time they talk about their crushes, my heart breaks a little more.",
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
    content: "I cheated on my final exam and got the highest score in class. The guilt is eating me alive.",
    categories: ['crime', 'mental'],
    mood: '😰',
    reactions: { meToo: ['u1', 'u2'], sendingLove: ['u3'], wow: ['u4', 'u5', 'u6'], sameLol: [], stayStrong: [], respect: [] },
    commentCount: 45,
    views: 892,
    createdAt: new Date(Date.now() - 10800000).toISOString()
  }
];

const MOCK_NOTIFICATIONS = [
  { _id: '1', type: 'reaction', message: 'Crimson Phoenix of Avalon 7 sent you Sending Love', read: false, createdAt: new Date(Date.now() - 300000).toISOString() },
  { _id: '2', type: 'comment', message: 'Azure Dragon of Shambhala 3 commented on your whisper', read: false, createdAt: new Date(Date.now() - 900000).toISOString() },
  { _id: '3', type: 'follow', message: 'Void Walker of Eternity 1 is now following you', read: true, createdAt: new Date(Date.now() - 3600000).toISOString() }
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
  { _id: '1', sender: { _id: 'user1' }, content: 'Hey, I read your confession...', createdAt: new Date(Date.now() - 3600000).toISOString(), read: true },
  { _id: '2', sender: { _id: 'demo123' }, content: 'Yeah, it\'s been really hard', createdAt: new Date(Date.now() - 3500000).toISOString(), read: true },
  { _id: '3', sender: { _id: 'user1' }, content: 'I feel the same way...', createdAt: new Date(Date.now() - 300000).toISOString(), read: false }
];

// =============================================================================
// CONSTANTS
// =============================================================================
const CATEGORIES = [
  { id: 'adult', name: 'Adult', color: '#8B0000' },
  { id: 'crime', name: 'Crime', color: '#4A4A4A' },
  { id: 'funny', name: 'Funny', color: '#D97706' },
  { id: 'romantic', name: 'Romantic Crush', color: '#FF69B4' },
  { id: 'insult', name: 'Insult', color: '#FF8C00' },
  { id: 'sorrow', name: 'Sorrow & Grief', color: '#191970' },
  { id: 'pain', name: 'Pain', color: '#800000' },
  { id: 'god', name: 'To The God', color: '#D97706' },
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
    LEGENDARY: '#D97706',
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
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('morpheus_user');
    const token = localStorage.getItem('morpheus_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      localStorage.removeItem('morpheus_user');
      localStorage.removeItem('morpheus_token');
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('morpheus_token', data.token);
        localStorage.setItem('morpheus_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error connecting to server' };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('morpheus_token', data.token);
        localStorage.setItem('morpheus_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Signup failed' };
    } catch (error) {
      return { success: false, error: 'Network error connecting to server' };
    }
  };

  const logout = () => {
    localStorage.removeItem('morpheus_token');
    localStorage.removeItem('morpheus_user');
    setUser(null);
    navigate('/login');
  };

  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const newUser = { ...prev, ...updates };
      localStorage.setItem('morpheus_user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// =============================================================================
// PEACEFUL ANIMATED BACKGROUND
// =============================================================================
const PeacefulBackground = () => {
  const particles = useMemo(() => {
    const colors = ['#fecdd3', '#bfdbfe', '#bbf7d0', '#fef08a', '#ffedd5']; // Pink, Blue, Green, Yellow, Peach
    // Reduced particle count from 18 to 6 and simplified movement to drastically improve UI performance
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      size: Math.random() * 250 + 150,
      left: Math.random() * 100,
      top: Math.random() * 100,
      xMove: Math.random() * 40 - 20,
      yMove: Math.random() * 40 - 20,
      duration: Math.random() * 10 + 10
    }));
  }, []);

  return (
    <div className="peaceful-bg fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full opacity-40 blur-[40px]"
          style={{ backgroundColor: p.color, width: `${p.size}px`, height: `${p.size}px`, left: `${p.left}vw`, top: `${p.top}vh` }}
          animate={{ x: [0, p.xMove, 0], y: [0, p.yMove, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0 bg-white/40 z-0"></div>
    </div>
  );
};

const useAuth = () => useContext(AuthContext);

// =============================================================================
// SOCKET CONTEXT
// =============================================================================
const SocketContext = createContext(null);

const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    if (user && currentUserId) {
      // Fetch initial unread count on load
      const token = localStorage.getItem('morpheus_token');
      fetch(`${SOCKET_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUnreadCount(data.unreadCount || 0))
        .catch(err => console.error('Failed to fetch unread count:', err));

      // Fetch initial unread messages count
      fetch(`${SOCKET_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUnreadMessageCount(data.reduce((acc, conv) => acc + (conv.unread || 0), 0));
          }
        })
        .catch(err => console.error('Failed to fetch messages count:', err));

      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to real-time Echo server');
        newSocket.emit('authenticate', { userId: currentUserId });
      });
      
      // Global listeners to increment the badge in real-time
      const incUnread = () => setUnreadCount(prev => prev + 1);
      const incUnreadMsg = () => setUnreadMessageCount(prev => prev + 1);
      newSocket.on('notification', incUnread);
      newSocket.on('reaction_notification', incUnread);
      newSocket.on('comment_notification', incUnread);
      newSocket.on('follow_notification', incUnread);
      newSocket.on('level_up', incUnread);
      newSocket.on('new_message', incUnreadMsg);

      return () => newSocket.disconnect();
    }
  }, [currentUserId]);

  return <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, unreadMessageCount, setUnreadMessageCount }}>{children}</SocketContext.Provider>;
};

const useSocket = () => useContext(SocketContext);

// =============================================================================
// PROTECTED ROUTE
// =============================================================================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-transparent"><div className="text-[var(--accent-primary)]">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// =============================================================================
// FOLLOW BUTTON COMPONENT
// =============================================================================
const FollowButton = ({ userId, initialFollowing, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      setIsFollowing(prev => {
        const nextState = !prev;
        if (onFollowChange) onFollowChange(nextState);
        return nextState;
      });
      setLoading(false);
    }, 10);
  };

  return (
    <button 
      className={`follow-btn ${isFollowing ? 'following' : ''}`}
      onClick={handleFollow}
      disabled={loading}
    >
      {loading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
    </button>
  );
};

// =============================================================================
// RARITY BADGE
// =============================================================================
const RarityBadge = ({ rarity, size = 'md' }) => {
  if (rarity === 'COMMON') return null;
  const sizeClasses = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-3 py-1', lg: 'text-sm px-4 py-1.5' };
  const config = {
    MYTHIC: { color: '#FF00FF', icon: '∞' },
    LEGENDARY: { color: '#D97706', icon: '⚡' },
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
const AuthorOrb = ({ rarity, size = 40, avatarUrl }) => (
  <div className={`${getRarityOrbClass(rarity)} rounded-full flex items-center justify-center overflow-hidden`} style={{ width: size, height: size, flexShrink: 0 }}>
    {avatarUrl ? (
      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )}
  </div>
);

// =============================================================================
// CONFESSION CARD
// =============================================================================
const ConfessionCard = ({ confession, onDelete }) => {
  const { user } = useAuth();
  const [isRevealed, setIsRevealed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [localReactions, setLocalReactions] = useState(confession.reactions);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(confession.commentCount);
  const progressInterval = useRef(null);
  const holdTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const waveformHeights = useMemo(() => Array.from({ length: 30 }).map(() => Math.random() * 30 + 10), [confession._id]);

  useEffect(() => {
    const handleStopAudio = (e) => {
      if (e.detail?.id !== confession._id && audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('stop_all_audio', handleStopAudio);
    return () => window.removeEventListener('stop_all_audio', handleStopAudio);
  }, [confession._id, isPlaying]);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleHoldStart = () => {
    if (isRevealed) return;
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    holdTimeoutRef.current = setTimeout(() => {
      const interval = setInterval(() => {
        setHoldProgress(prev => {
          const newProgress = prev + 50;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsRevealed(true);
            setHoldProgress(0);
            return 0;
          }
          return newProgress;
        });
      }, 16);
      progressInterval.current = interval;
    }, 10);
  };

  const handleHoldEnd = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setHoldProgress(0);
  };

  const handleReaction = async (reactionType, e) => {
    e.stopPropagation();
    if (!user) return;
    const currentUserId = user?.id || user?._id;
    
    // Optimistic UI update for instant feedback
    setLocalReactions(prev => {
      const hasReacted = prev[reactionType]?.includes(currentUserId);
      return {
        ...prev,
        [reactionType]: hasReacted
          ? prev[reactionType].filter(id => id !== currentUserId)
          : [...(prev[reactionType] || []), currentUserId]
      };
    });

    try {
      const token = localStorage.getItem('morpheus_token');
      const response = await fetch(`${SOCKET_URL}/api/confessions/${confession._id}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reactionType })
      });
      
      if (!response.ok) throw new Error('Failed to record reaction');
    } catch (err) {
      console.error('Reaction API error:', err);
      // Revert the optimistic update if network fails
      setLocalReactions(prev => {
        const hasReacted = prev[reactionType]?.includes(currentUserId);
        return {
          ...prev,
          [reactionType]: hasReacted
            ? prev[reactionType].filter(id => id !== currentUserId)
            : [...(prev[reactionType] || []), currentUserId]
        };
      });
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this whisper?')) return;
    
    try {
      const token = localStorage.getItem('morpheus_token');
      const res = await fetch(`${SOCKET_URL}/api/confessions/${confession._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && onDelete) {
        onDelete(confession._id);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const hasReacted = (type) => localReactions[type]?.includes(user?.id || user?._id);
  const reactionCount = (type) => localReactions[type]?.length || 0;

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (!confession.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(confession.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      window.dispatchEvent(new CustomEvent('stop_all_audio', { detail: { id: confession._id } }));
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleComments = async (e) => {
    e.stopPropagation();
    if (!showComments) {
      setShowComments(true);
      setLoadingComments(true);
      try {
        const token = localStorage.getItem('morpheus_token');
        const res = await fetch(`${SOCKET_URL}/api/confessions/${confession._id}/comments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setComments(await res.json());
      } catch (err) {
        console.error('Comments error:', err);
      } finally {
        setLoadingComments(false);
      }
    } else {
      setShowComments(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const optimisticComment = {
      _id: Date.now().toString(),
      content: newComment,
      authorName: user?.anonymousName || 'You',
      author: { _id: user?.id || user?._id, rarity: user?.rarity, avatarUrl: user?.avatarUrl },
      createdAt: new Date().toISOString()
    };

    setComments([optimisticComment, ...comments]);
    setLocalCommentCount(prev => prev + 1);
    setNewComment('');

    try {
      const token = localStorage.getItem('morpheus_token');
      await fetch(`${SOCKET_URL}/api/confessions/${confession._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: optimisticComment.content })
      });
    } catch (err) {
      console.error('Submit comment error:', err);
    }
  };

  const safeDuration = confession.audioDuration || 0;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.01 }}
      className={`confession-card ${getRarityFrameClass(confession.author?.rarity)}`}
    >
      <div className="card-header">
        <AuthorOrb rarity={confession.author?.rarity} avatarUrl={confession.author?.avatarUrl} size={40} />
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

      <div 
        className="blur-reveal-container relative cursor-pointer"
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onTouchCancel={handleHoldEnd}
      >
        <div className={`blur-content ${isRevealed ? 'revealed' : ''}`}>
          {confession.type === 'text' ? (
            <p className="card-content whitespace-pre-wrap break-words">{confession.content}</p>
          ) : (
            <div className="audio-player">
              <button className="play-btn" onClick={toggleAudio}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{isPlaying ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> : <polygon points="5 3 19 12 5 21 5 3"/>}</svg>
              </button>
              <div className="waveform">
                {waveformHeights.map((height, i) => (
                  <div key={i} className="waveform-bar" style={{ height: `${height}px` }}></div>
                ))}
              </div>
              <span className="audio-duration">{Math.floor(safeDuration / 60)}:{String(Math.floor(safeDuration % 60)).padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {!isRevealed && holdProgress > 0 && (
          <div className="blur-overlay">
            <div className="hold-to-reveal-btn">
              <div className="progress-ring">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle className="progress-ring-bg" cx="24" cy="24" r="20"></circle>
                  <circle className="progress-ring-circle" cx="24" cy="24" r="20" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - holdProgress / 100)}`}></circle>
                </svg>
              </div>
              <span>Hold to reveal</span>
            </div>
          </div>
        )}
      </div>

      <div className="card-actions">
        <div className="reactions-row">
          {Object.entries(REACTIONS).map(([type, { emoji, label }]) => (
            <button 
              key={type} 
              onClick={(e) => handleReaction(type, e)} 
              className={`reaction-btn ${hasReacted(type) ? 'active' : ''}`}
            >
              <span>{emoji}</span>
              <span>{reactionCount(type) > 0 ? reactionCount(type) : label}</span>
            </button>
          ))}
        </div>
        <div className="action-buttons">
          <button className="action-btn" title="Comments" onClick={toggleComments}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {localCommentCount > 0 && <span>{localCommentCount}</span>}
          </button>
          {user && confession.author?._id === (user?.id || user?._id) && (
            <button className="action-btn text-red-400 hover:text-red-500" title="Delete" onClick={handleDelete}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          )}
          {user && confession.author?._id !== (user?.id || user?._id) && (
            <Link to={`/messages?to=${confession.author?._id}`} className="action-btn" title="Anonymous Message" onClick={(e) => e.stopPropagation()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </Link>
          )}
          <button className="action-btn" title="Share" onClick={(e) => e.stopPropagation()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.2)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a whisper..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-[var(--bg-hover)] border border-[rgba(255,255,255,0.4)] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <button type="submit" disabled={!newComment.trim()} className="bg-[var(--accent-primary)] text-white p-2 rounded-full disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
            <div className="space-y-3 max-h-60 overflow-y-auto hide-scrollbar">
              {loadingComments ? (
                <div className="text-center text-xs text-[var(--text-muted)] py-2">Loading whispers...</div>
              ) : comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment._id} className="flex gap-3">
                    <AuthorOrb rarity={comment.author?.rarity} avatarUrl={comment.author?.avatarUrl} size={28} />
                    <div className="flex-1 bg-[var(--bg-hover)] rounded-2xl rounded-tl-none p-3 text-sm">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`font-semibold text-xs ${getRarityTextClass(comment.author?.rarity)}`}>{comment.authorName}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-[var(--text-primary)]">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-[var(--text-muted)] py-2">No whispers yet. Be the first.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =============================================================================
// BOTTOM NAVIGATION
// =============================================================================
const BottomNav = () => {
  const location = useLocation();
  const { unreadCount, unreadMessageCount } = useSocket() || { unreadCount: 0, unreadMessageCount: 0 };
  const navItems = [
    { path: '/', icon: 'home', label: 'Feed' },
    { path: '/create', icon: 'edit', label: 'Confess' },
    { path: '/radio', icon: 'radio', label: 'Radio' },
    { path: '/messages', icon: 'message-circle', label: 'Messages', badge: unreadMessageCount },
    { path: '/notifications', icon: 'bell', label: 'Alerts', badge: unreadCount },
    { path: '/profile/me', icon: 'user', label: 'Profile' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path} className={`nav-item ${location.pathname === item.path || (item.path === '/profile/me' && location.pathname.startsWith('/profile')) ? 'active' : ''}`}>
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
  const location = useLocation();
  const { unreadCount, unreadMessageCount } = useSocket() || { unreadCount: 0, unreadMessageCount: 0 };

  const navItems = [
    { path: '/', icon: 'home', label: 'Feed' },
    { path: '/create', icon: 'edit', label: 'Confess' },
    { path: '/radio', icon: 'radio', label: 'Radio' },
    { path: '/messages', icon: 'message-circle', label: 'Messages', badge: unreadMessageCount },
    { path: '/notifications', icon: 'bell', label: 'Notifications', badge: unreadCount },
    { path: '/profile/me', icon: 'user', label: 'Profile' }
  ];

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-logo">
        <img src={transparentLogo} alt="Morpheus Echo Logo" className="w-10 h-10 object-contain drop-shadow-md" />
        <div>
          <h1 className="font-display text-lg font-bold text-[var(--text-primary)]">Morpheus</h1>
          <p className="text-xs text-[var(--text-muted)]">Echo</p>
        </div>
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={`sidebar-item ${location.pathname === item.path || (item.path === '/profile/me' && location.pathname.startsWith('/profile')) ? 'active' : ''}`}>
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

      <div className="pt-4 border-t border-gray-200">
        <button onClick={logout} className="sidebar-item w-full text-left text-red-500 hover:text-red-600">
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
      if (result.success) {
        navigate('/');
        return;
      }
      else setError(result.error);
    } else {
      if (!formData.ageVerified) {
        setError('You must verify you are 18+ to join');
        setLoading(false);
        return;
      }
      const result = await signup({ ...formData, age: parseInt(formData.age) });
      if (result.success) {
        navigate('/reveal', { state: { user: result.user } });
        return;
      }
      else setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.01 }}
        className="auth-card"
      >
        <div className="auth-logo">
          <img src={transparentLogo} alt="Morpheus Echo Logo" className="w-20 h-20 mx-auto object-contain drop-shadow-xl mb-2" />
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Morpheus Echo</h1>
        <p className="text-[var(--text-muted)] text-sm italic">"Whisper your truth. Echo your soul."</p>
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
                  <span className="text-sm text-[var(--text-secondary)]">I confirm I am 18 years or older</span>
                </label>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading || (!isLogin && !formData.ageVerified)}>
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Identity'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// =============================================================================
// IDENTITY REVEAL PAGE (FIXED - uses useLocation)
// =============================================================================
const IdentityRevealPage = () => {
  const location = useLocation();
  const user = location.state?.user || MOCK_USER;
  const navigate = useNavigate();
  const [isRevealed, setIsRevealed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const progressInterval = useRef(null);
  const holdTimeoutRef = useRef(null);

  useEffect(() => {
    if (isRevealed) {
      const timer = setTimeout(() => navigate('/'), 100);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, navigate]);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const handleHoldStart = () => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    holdTimeoutRef.current = setTimeout(() => {
      const interval = setInterval(() => {
        setHoldProgress(prev => {
          const newProgress = prev + 50;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsRevealed(true);
            return 0;
          }
          return newProgress;
        });
      }, 16);
      progressInterval.current = interval;
    }, 10);
  };

  const handleHoldEnd = () => {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    setHoldProgress(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="identity-reveal-screen"
    >
      <div className="text-center">
        {!isRevealed ? (
          <>
            <h2 className="reveal-title">🔮 GUESS WHO IS THIS? 🔮</h2>
            <div className="hold-reveal-container">
              <div className={`w-64 h-32 ${getRarityFrameClass(user.rarity)} rounded-xl flex items-center justify-center mb-8`} style={{ filter: `blur(${20 - (holdProgress / 100) * 20}px)` }}>
                <span className={`font-display text-xl ${getRarityTextClass(user.rarity)}`}>{user.anonymousName}</span>
              </div>
              <button 
                className="hold-to-reveal-btn" 
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                onTouchCancel={handleHoldEnd}
              >
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
              <AuthorOrb rarity={user.rarity} avatarUrl={user.avatarUrl} size={80} />
              <h3 className={`identity-name ${getRarityTextClass(user.rarity)}`}>{user.anonymousName}</h3>
              <p className="identity-rarity" style={{ color: getRarityColor(user.rarity) }}>{user.rarity}</p>
              <p className="identity-quote">"Your secret name. Your truth.<br />Guard it well."</p>
            </div>
            <p className="mt-8 text-[var(--text-muted)]">Entering the Echo...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// =============================================================================
// HOME FEED PAGE
// =============================================================================
const HomePage = () => {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setPage(1);
    setConfessions([]);
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    let isActive = true;
    const fetchFeed = async () => {
      if (page === 1) setLoading(true);
      else setIsLoadingMore(true);
      
      try {
        const token = localStorage.getItem('morpheus_token');
        const response = await fetch(`${SOCKET_URL}/api/feed?category=${selectedCategory}&sort=${sortBy}&page=${page}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch feed');
        const data = await response.json();
        
        if (!isActive) return;
        
        if (page === 1) {
          setConfessions(data.confessions);
        } else {
          setConfessions(prev => {
            const uniqueNew = data.confessions.filter(newConf => !prev.some(p => p._id === newConf._id));
            return [...prev, ...uniqueNew];
          });
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      } catch (err) {
        console.error('Feed error:', err);
        if (!isActive) return;
        
        if (page === 1) {
          setConfessions(MOCK_CONFESSIONS);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };
    fetchFeed();
    return () => { isActive = false; };
  }, [selectedCategory, sortBy, page]);

  const handleDeleteConfession = (id) => {
    setConfessions(prev => prev.filter(c => c._id !== id));
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="sticky top-0 z-10 bg-[var(--bg-secondary)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.6)]">
        <div className="p-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
            <button onClick={() => setSelectedCategory('all')} className={`category-pill whitespace-nowrap ${selectedCategory === 'all' ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'bg-[var(--bg-card)] border-[rgba(255,255,255,0.6)] text-[var(--text-secondary)] backdrop-blur-md'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`category-pill whitespace-nowrap ${selectedCategory === cat.id ? 'ring-2 ring-white shadow-sm' : 'backdrop-blur-md'}`} style={{ background: `${cat.color}20`, color: cat.color, border: `1px solid ${cat.color}40` }}>{cat.name}</button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {['trending', 'new', 'following'].map(sort => (
              <button key={sort} onClick={() => setSortBy(sort)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${sortBy === sort ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'bg-[var(--bg-card)] border-[rgba(255,255,255,0.6)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] backdrop-blur-md'}`}>
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-[var(--text-muted)] py-12 animate-pulse">Listening to the Echo...</div>
          ) : confessions.length > 0 ? (
            <>
              {confessions.map(confession => (
                <ConfessionCard key={confession._id} confession={confession} onDelete={handleDeleteConfession} />
              ))}
              {hasMore && (
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoadingMore}
                  className="w-full py-3 mt-4 mb-8 bg-[var(--bg-card)] border border-[rgba(255,255,255,0.6)] text-[var(--accent-primary)] font-semibold rounded-xl hover:bg-[var(--accent-light)] transition-all backdrop-blur-md"
                >
                  {isLoadingMore ? 'Listening deeper...' : 'Load More Whispers'}
                </button>
              )}
            </>
          ) : (
            <div className="text-center text-[var(--text-muted)] py-12">No whispers found here.</div>
          )}
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
  const submitTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isMounted = useRef(true);
  const waveformHeights = useMemo(() => Array.from({ length: 20 }).map(() => Math.random() * 30 + 10), [audioBlob]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    // Prevent background app audio from bleeding into the new recording
    window.dispatchEvent(new CustomEvent('stop_all_audio'));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Security guard: If user navigated away during the permission prompt, kill the mic instantly
      if (!isMounted.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      if (timerRef.current) clearInterval(timerRef.current);
      let time = 0;
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        time += 1;
        setRecordingTime(time);
        if (time >= 100) stopRecording(); // Max 100 seconds
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Microphone access is required to record a whisper.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : prev.length < 3 ? [...prev, catId] : prev
    );
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) { alert('Select at least one category'); return; }
    setLoading(true);
    
    try {
      const token = localStorage.getItem('morpheus_token');
      let finalAudioUrl = null;
      let finalAudioDuration = null;

      // If it's a voice confession, upload it to Cloudinary through the backend first
      if (type === 'voice' && audioBlob) {
        const base64Audio = await blobToBase64(audioBlob);
        const uploadRes = await fetch(`${SOCKET_URL}/api/upload/audio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ audioData: base64Audio })
        });
        
        if (!uploadRes.ok) throw new Error('Audio upload failed');
        const uploadData = await uploadRes.json();
        finalAudioUrl = uploadData.url;
        finalAudioDuration = uploadData.duration;
      }

      const confessionData = {
        type,
        content: type === 'text' ? content : null,
        audioUrl: finalAudioUrl,
        audioDuration: type === 'voice' ? (finalAudioDuration || recordingTime) : null,
        voiceEffect,
        ambientSound,
        categories: selectedCategories,
        mood: selectedMood,
        expiry
      };

      // Save the confession in the database
      const res = await fetch(`${SOCKET_URL}/api/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(confessionData)
      });

      if (!res.ok) throw new Error('Failed to post confession');
      
      navigate('/');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to share whisper. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w).length;
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="p-4">
        <h1 className="font-display text-2xl mb-6 text-[var(--text-primary)]">Share Your Whisper</h1>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setType('text')} className={`flex-1 py-4 rounded-xl border transition-all backdrop-blur-md ${type === 'text' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm' : 'border-[rgba(255,255,255,0.8)] bg-[var(--bg-card)]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-[var(--text-muted)]"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            <span className="text-sm text-[var(--text-secondary)]">Text</span>
          </button>
          <button onClick={() => setType('voice')} className={`flex-1 py-4 rounded-xl border transition-all backdrop-blur-md ${type === 'voice' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-sm' : 'border-[rgba(255,255,255,0.8)] bg-[var(--bg-card)]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-[var(--text-muted)]"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            <span className="text-sm text-[var(--text-secondary)]">Voice</span>
          </button>
        </div>

        {type === 'text' ? (
          <div className="mb-6">
            <textarea className="input-field textarea-field" placeholder="Your secret is safe here..." value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} rows={6} />
          <p className={`text-right text-sm mt-2 ${wordCount > 200 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{wordCount} / 200 words</p>
          </div>
        ) : (
          <div className="mb-6">
            {!audioBlob ? (
            <div className="recorder-container bg-[var(--bg-hover)] border border-[rgba(255,255,255,0.6)] backdrop-blur-md rounded-xl py-12 shadow-sm">
              <button onClick={isRecording ? stopRecording : startRecording} className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:scale-105 shadow-md'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">{isRecording ? <rect x="6" y="6" width="12" height="12"/> : <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>}</svg>
                </button>
                {isRecording && <div className="recording-timer text-red-400 text-2xl font-display">{formatTime(recordingTime)}</div>}
              <p className="text-[var(--text-muted)] text-sm">{isRecording ? 'Tap to stop' : 'Tap to record (max 100s)'}</p>
              </div>
            ) : (
            <div className="bg-[var(--bg-hover)] border border-[rgba(255,255,255,0.6)] backdrop-blur-md rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <button className="play-btn w-12 h-12" onClick={(e) => e.stopPropagation()}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
                  <div className="flex-1"><div className="waveform h-10">{waveformHeights.map((height, i) => <div key={i} className="waveform-bar" style={{ height: `${height}px` }}></div>)}</div></div>
                <span className="text-sm text-[var(--text-muted)]">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={() => { setAudioBlob(null); setRecordingTime(0); }} className="mt-4 text-sm text-red-500 hover:text-red-600">Re-record</button>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm text-[var(--text-muted)] mb-2">Voice Effect</p>
              <div className="flex gap-2 flex-wrap">
                {VOICE_EFFECTS.map(effect => (
                  <button key={effect.id} onClick={() => setVoiceEffect(effect.id)} className={`px-4 py-2 rounded-full text-sm transition-all ${voiceEffect === effect.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'bg-[var(--bg-card)] border border-[rgba(255,255,255,0.6)] text-[var(--text-secondary)] backdrop-blur-md'}`}>{effect.name}</button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-[var(--text-muted)] mb-2">Ambient Sound</p>
              <div className="flex gap-2 flex-wrap">
                {AMBIENT_SOUNDS.map(sound => (
                  <button key={sound.id} onClick={() => setAmbientSound(sound.id)} className={`px-4 py-2 rounded-full text-sm transition-all ${ambientSound === sound.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'bg-[var(--bg-card)] border border-[rgba(255,255,255,0.6)] text-[var(--text-secondary)] backdrop-blur-md'}`}>{sound.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm text-[var(--text-muted)] mb-2">Categories ({selectedCategories.length}/3)</p>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)} className={`category-pill transition-all ${selectedCategories.includes(cat.id) ? 'ring-2 ring-white shadow-sm' : 'backdrop-blur-md'}`} style={{ background: selectedCategories.includes(cat.id) ? cat.color : `${cat.color}30`, color: selectedCategories.includes(cat.id) ? '#fff' : cat.color, border: `1px solid ${cat.color}40` }}>{cat.name}</button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-[var(--text-muted)] mb-2">Mood (optional)</p>
          <div className="flex gap-2 flex-wrap">
            {MOOD_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => setSelectedMood(selectedMood === emoji ? '' : emoji)} className={`text-2xl p-2 rounded-lg transition-all ${selectedMood === emoji ? 'bg-[var(--accent-primary)]/30 scale-110' : 'hover:bg-[var(--bg-hover)]'}`}>{emoji}</button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-[var(--text-muted)] mb-2">Expires in</p>
          <div className="flex gap-2">
            {[{ id: '24h', label: '24 Hours' }, { id: '7d', label: '7 Days' }, { id: 'never', label: 'Never' }].map(opt => (
              <button key={opt.id} onClick={() => setExpiry(opt.id)} className={`flex-1 py-3 rounded-lg text-sm transition-all ${expiry === opt.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'bg-[var(--bg-card)] border border-[rgba(255,255,255,0.6)] text-[var(--text-secondary)] backdrop-blur-md'}`}>{opt.label}</button>
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
  const [currentConfession, setCurrentConfession] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [queue, setQueue] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const audioRef = useRef(null);

  const fetchRadioQueue = useCallback(async () => {
    try {
      const token = localStorage.getItem('morpheus_token');
      const res = await fetch(`${SOCKET_URL}/api/radio?category=${selectedCategory}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch radio queue');
      const data = await res.json();
      
      if (data.queue && data.queue.length > 0) {
        setQueue(data.queue);
        setCurrentConfession(data.queue[0]);
        setQueueCount(data.queueLength);
      } else {
        // Fallback to mock data if the database is empty so the UI doesn't break
        let mockQueue = MOCK_CONFESSIONS.filter(c => selectedCategory === 'all' || c.categories.includes(selectedCategory));
        if (mockQueue.length === 0) mockQueue = MOCK_CONFESSIONS; // Prevent infinite crash loop on empty categories
        setQueue(mockQueue);
        setCurrentConfession(mockQueue[0] || MOCK_CONFESSIONS[1]);
        setQueueCount(mockQueue.length);
      }
    } catch (err) {
      console.error('Radio fetch error:', err);
      let mockQueue = MOCK_CONFESSIONS.filter(c => selectedCategory === 'all' || c.categories.includes(selectedCategory));
      if (mockQueue.length === 0) mockQueue = MOCK_CONFESSIONS;
      setQueue(mockQueue);
      setCurrentConfession(mockQueue[0] || MOCK_CONFESSIONS[1]);
      setQueueCount(mockQueue.length);
    }
  }, [selectedCategory]);

  const handleNext = useCallback(() => {
    if (queue.length > 1) {
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      setCurrentConfession(newQueue[0]);
      setQueueCount(prev => prev - 1);
      setIsPlaying(true);
    } else {
      fetchRadioQueue();
    }
  }, [queue, fetchRadioQueue]);

  useEffect(() => {
    fetchRadioQueue();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [fetchRadioQueue]);

  useEffect(() => {
    const handleStopAudio = (e) => {
      if (e.detail?.id !== 'radio' && audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('stop_all_audio', handleStopAudio);
    return () => window.removeEventListener('stop_all_audio', handleStopAudio);
  }, [isPlaying]);

  useEffect(() => {
    if (!currentConfession?.audioUrl) return;

    if (!audioRef.current || audioRef.current.src !== currentConfession.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(currentConfession.audioUrl);
    }

        // Always update to the freshest callback to prevent stale array closures
        if (audioRef.current) {
          audioRef.current.onended = handleNext;
        }

    if (isPlaying) {
      window.dispatchEvent(new CustomEvent('stop_all_audio', { detail: { id: 'radio' } }));
      audioRef.current.play().catch(e => {
        console.error("Auto-play blocked:", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [currentConfession, isPlaying, handleNext]);

  return (
    <div className="radio-container">
      <div className="radio-visualizer">
        {[1, 2, 3, 4].map(i => <div key={i} className="visualizer-ring"></div>)}
      </div>

      <div className="w-full px-4 mb-8 z-10">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar justify-center">
          <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${selectedCategory === 'all' ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'bg-[var(--bg-card)] border border-[rgba(255,255,255,0.6)] text-[var(--text-secondary)] backdrop-blur-md'}`}>All</button>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'ring-2 ring-white shadow-sm' : 'backdrop-blur-md'}`} style={{ background: selectedCategory === cat.id ? cat.color : `${cat.color}30`, color: selectedCategory === cat.id ? '#fff' : cat.color }}>{cat.name}</button>
          ))}
        </div>
      </div>

      <div className="radio-player">
        <div className={`radio-orb ${getRarityOrbClass(currentConfession?.author?.rarity)} overflow-hidden`}>
          {currentConfession?.author?.avatarUrl ? (
            <img src={currentConfession.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          )}
        </div>

        <div className="radio-info">
          <h2 className={`radio-author ${getRarityTextClass(currentConfession?.author?.rarity)}`}>{currentConfession?.authorName || 'Listening to the Echo...'}</h2>
          <span className="radio-category" style={{ background: `${CATEGORIES.find(c => c.id === currentConfession?.categories?.[0])?.color || 'var(--accent-primary)'}30`, color: CATEGORIES.find(c => c.id === currentConfession?.categories?.[0])?.color || 'var(--accent-primary)' }}>{CATEGORIES.find(c => c.id === currentConfession?.categories?.[0])?.name || 'General'}</span>
        </div>

        <div className="radio-controls">
          <button onClick={handleNext} className="radio-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="radio-btn play"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">{isPlaying ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> : <polygon points="5 3 19 12 5 21 5 3"/>}</svg></button>
          <button onClick={handleNext} className="radio-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg></button>
        </div>

        <p className="mt-8 text-[var(--text-muted)] text-sm">{queueCount} whispers in queue</p>
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
  const [localMessages, setLocalMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUserProfile, setActiveUserProfile] = useState(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();
  const { socket, setUnreadCount, setUnreadMessageCount } = useSocket() || {};
  const location = useLocation();
  const navigate = useNavigate();

  // Handle deep link to specific user
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const toUser = searchParams.get('to');
    if (toUser) {
      setSelectedUser(toUser);
    } else {
      setSelectedUser(null);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('morpheus_token');
        const res = await fetch(`${SOCKET_URL}/api/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setConversations(await res.json());
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };
    fetchConversations();
  }, []);

  // Fetch historical messages when a user is selected
  useEffect(() => {
    if (!selectedUser) return;
    
    let isActive = true;
    setActiveUserProfile(null);
    
    // Set active user profile for header
    const existingConv = conversations.find(c => c.partner._id === selectedUser);
    if (existingConv) {
      setActiveUserProfile(existingConv.partner);
    } else {
      const token = localStorage.getItem('morpheus_token');
      fetch(`${SOCKET_URL}/api/users/${selectedUser}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data && data.user) {
            setActiveUserProfile({ ...data.user, _id: data.user.id || data.user._id });
          }
        })
        .catch(err => console.error(err));
    }

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('morpheus_token');
        const res = await fetch(`${SOCKET_URL}/api/messages/${selectedUser}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          
          if (!isActive) return;
          
          if (Array.isArray(data)) setLocalMessages(data);
          
          // Clear the unread indicator for this conversation
          setConversations(prev => {
            let clearedCount = 0;
            const next = prev.map(conv => {
              if (conv.partner._id === selectedUser && conv.unread > 0) {
                clearedCount = conv.unread;
                return { ...conv, unread: 0 };
              }
              return conv;
            });
            
            if (clearedCount > 0 && setUnreadCount) {
              setUnreadCount(curr => Math.max(0, curr - clearedCount));
            }
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    fetchMessages();
    return () => { isActive = false; };
  }, [selectedUser]);

  useEffect(() => {
    setIsPartnerTyping(false);
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser, localMessages]);

  // Listen for incoming real-time messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (data) => {
      // Only append to the active chat window if we are currently talking to the sender
      if (data.fromId === selectedUser) {
        setLocalMessages(prev => {
          if (prev.some(m => m._id === data.messageId)) return prev; // Prevent duplicate Socket.IO appends
          return [...prev, {
            _id: data.messageId,
            sender: { _id: data.fromId, anonymousName: data.from, rarity: data.rarity, avatarUrl: data.avatarUrl },
            content: data.content,
            createdAt: data.timestamp,
            read: false
          }];
        });

        // Prevent global badge from permanently staying up since we are actively reading this
        if (setUnreadMessageCount) setUnreadMessageCount(prev => Math.max(0, prev - 1));

        // Instantly mark as read on the backend
        const token = localStorage.getItem('morpheus_token');
        fetch(`${SOCKET_URL}/api/messages/${data.fromId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error(err));
      }
      
      // Real-time sync for the sidebar conversation list
      setConversations(prev => {
        const exists = prev.find(c => c.partner._id === data.fromId);
        let updatedList;
        if (!exists) {
          updatedList = [{
            partner: { _id: data.fromId, anonymousName: data.from, rarity: data.rarity || 'COMMON', avatarUrl: data.avatarUrl },
            lastMessage: { content: data.content, createdAt: data.timestamp },
            unread: data.fromId === selectedUser ? 0 : 1
          }, ...prev];
        } else {
          updatedList = prev.map(c => c.partner._id === data.fromId ? {
            ...c,
            lastMessage: { content: data.content, createdAt: data.timestamp },
            unread: c.partner._id === selectedUser ? 0 : (c.unread || 0) + 1
          } : c);
        }
        return [...updatedList].sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
      });
    };
    
    const handleTypingStart = (data) => {
      if (data.fromId === selectedUser) setIsPartnerTyping(true);
    };
    
    const handleTypingEnd = (data) => {
      if (data.fromId === selectedUser) setIsPartnerTyping(false);
    };
    
    const handleMessagesRead = (data) => {
      if (data.readBy === selectedUser) {
        setLocalMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }
    };
    
    socket.on('new_message', handleNewMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_end', handleTypingEnd);
    socket.on('messages_read', handleMessagesRead);
    
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_end', handleTypingEnd);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, selectedUser, setUnreadCount]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedUser) return;
    
    const currentUserId = user?.id || user?._id;
    socket.emit('typing_start', { to: selectedUser, from: currentUserId });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_end', { to: selectedUser, from: currentUserId });
    }, 2000);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    const currentUserId = user?.id || user?._id || 'demo123';
    const msgContent = newMessage.trim();
    const timestamp = new Date().toISOString();
    
    // Optimistic UI update
    setLocalMessages(prev => [...prev, {
      _id: Date.now().toString(),
      sender: { _id: currentUserId, anonymousName: user?.anonymousName, rarity: user?.rarity, avatarUrl: user?.avatarUrl },
      content: msgContent,
      createdAt: timestamp,
      read: false
    }]);
    
    if (socket) {
      socket.emit('typing_end', { to: selectedUser, from: currentUserId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setConversations(prev => {
      let updatedList;
      const exists = prev.find(c => c.partner._id === selectedUser);
      if (exists) {
        updatedList = prev.map(c => c.partner._id === selectedUser ? { ...c, lastMessage: { content: msgContent, createdAt: timestamp } } : c);
      } else if (activeUserProfile) {
        updatedList = [{ partner: activeUserProfile, lastMessage: { content: msgContent, createdAt: timestamp }, unread: 0 }, ...prev];
      } else {
        updatedList = prev;
      }
      return [...updatedList].sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
    });
    
    setNewMessage('');

    try {
      const token = localStorage.getItem('morpheus_token');
      await fetch(`${SOCKET_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ to: selectedUser, content: msgContent })
      });
    } catch (err) {
      console.error('Failed to send message via API:', err);
    }
  };

  return (
    <div className="messages-container">
      <div className={`conversations-list ${selectedUser ? 'hide-on-mobile' : ''}`}>
        <div className="p-4 border-b border-[rgba(255,255,255,0.6)]"><h2 className="font-display text-xl text-[var(--text-primary)]">Messages</h2></div>
        {conversations.length > 0 ? conversations.map((conv) => (
          <div key={conv.partner._id} onClick={() => setSelectedUser(conv.partner._id)} className={`conversation-item ${selectedUser === conv.partner._id ? 'active' : ''}`}>
            <AuthorOrb rarity={conv.partner.rarity} avatarUrl={conv.partner.avatarUrl} size={44} />
            <div className="conversation-preview">
              <p className="conversation-name text-[var(--text-primary)]">{conv.partner.anonymousName}</p>
              <p className="conversation-text">{conv.lastMessage.content}</p>
            </div>
            <div className="conversation-meta">
              <p className="conversation-time">{formatRelativeTime(conv.lastMessage.createdAt)}</p>
              {conv.unread > 0 && <span className="bg-[var(--accent-primary)] text-white text-xs px-2 py-0.5 rounded-full">{conv.unread}</span>}
            </div>
          </div>
        )) : (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No conversations yet</div>
        )}
      </div>

      {selectedUser ? (
        <div className={`chat-container ${!selectedUser ? 'hide-on-mobile' : ''}`}>
          <div className="chat-header">
            <button className="back-btn mobile-only" onClick={() => { setSelectedUser(null); navigate('/messages'); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <AuthorOrb rarity={activeUserProfile?.rarity} avatarUrl={activeUserProfile?.avatarUrl} size={36} />
          <span className="font-semibold text-[var(--text-primary)]">{activeUserProfile?.anonymousName || 'User'}</span>
          </div>

          <div className="chat-messages">
            {localMessages.filter(msg => msg.sender?._id === selectedUser || msg.sender?._id === (user?.id || user?._id || 'demo123')).map((msg, idx) => (
              <div key={msg._id || idx} className={`message-bubble break-words ${msg.sender?._id === selectedUser ? 'received' : 'sent'}`}>
                <p>{msg.content}</p>
                <p className="message-time">
                  {formatRelativeTime(msg.createdAt)}
                  {msg.sender?._id !== selectedUser && (
                    <span className={`ml-2 font-bold ${msg.read ? 'text-red-500' : 'text-inherit'}`}>{msg.read ? '✓✓' : '✓'}</span>
                  )}
                </p>
              </div>
            ))}
            {isPartnerTyping && (
              <div className="flex gap-1 items-center p-3 max-w-max rounded-2xl bg-[var(--bg-hover)] text-[var(--text-muted)] text-xs mb-4">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input type="text" className="chat-input" placeholder="Type your whisper..." value={newMessage} onChange={handleTyping} maxLength={500} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
            <button onClick={handleSend} className="chat-send-btn"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
          </div>
        </div>
      ) : (
        <div className="chat-container hide-on-mobile flex items-center justify-center">
          <div className="text-center text-[var(--text-muted)]">
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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useSocket() || {};
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('morpheus_token');
        const res = await fetch(`${SOCKET_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          if (data.unreadCount !== undefined && setUnreadCount) {
            setUnreadCount(data.unreadCount);
          }
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('morpheus_token');
      await fetch(`${SOCKET_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if (setUnreadCount) {
        setUnreadCount(0); // Instantly wipe the global red badge
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        const token = localStorage.getItem('morpheus_token');
        const res = await fetch(`${SOCKET_URL}/api/notifications/${notification._id}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
          if (setUnreadCount) setUnreadCount(curr => Math.max(0, curr - 1));
        }
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }

    if (notification.type === 'message' && notification.data?.from) {
      navigate(`/messages?to=${notification.data.from}`);
    } else if (notification.type === 'follow' && notification.data?.followerId) {
      navigate(`/profile/${notification.data.followerId}`);
    } else if (['reaction', 'comment'].includes(notification.type)) {
      navigate(`/profile/me`);
    }
  };

  const getNotificationIcon = (type) => ({ reaction: 'heart', comment: 'message-square', message: 'message-circle', follow: 'user-plus', chain: 'link', streak: 'flame', level: 'trending-up' }[type] || 'bell');

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="sticky top-0 z-10 bg-[var(--bg-secondary)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.6)]">
        <div className="p-4 flex items-center justify-between">
          <h1 className="font-display text-xl text-[var(--text-primary)]">Notifications</h1>
          {notifications.some(n => !n.read) && <button onClick={markAllRead} className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">Mark all read</button>}
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-[var(--text-muted)] py-12 animate-pulse">Loading alerts...</div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
            <motion.div 
              key={notification._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => handleNotificationClick(notification)}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-primary)]">
                  {getNotificationIcon(notification.type) === 'heart' && <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>}
                  {getNotificationIcon(notification.type) === 'message-square' && <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}
                  {getNotificationIcon(notification.type) === 'message-circle' && <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>}
                  {getNotificationIcon(notification.type) === 'user-plus' && <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>}
                  {getNotificationIcon(notification.type) === 'bell' && <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}
                </svg>
              </div>
              <div className="notification-content">
              <p className="notification-text text-[var(--text-primary)]">{notification.message}</p>
                <p className="notification-time">{formatRelativeTime(notification.createdAt)}</p>
              </div>
            </motion.div>
            ))
          ) : (
            <div className="text-center text-[var(--text-muted)] py-12">No notifications yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PROFILE PAGE (WITH FOLLOW BUTTON)
// =============================================================================
const DATA_CACHE = { profile: null, profileConfessions: [] };
const updateCache = (key, data) => { DATA_CACHE[key] = data; };

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?._id;
  const targetId = id === 'me' ? currentUserId : id;
  const isOwnProfile = targetId === currentUserId;
  
  const [profile, setProfile] = useState(() => isOwnProfile ? DATA_CACHE.profile : null);
  const [userConfessions, setUserConfessions] = useState(() => isOwnProfile ? (DATA_CACHE.profileConfessions || []) : []);
  const [loading, setLoading] = useState(() => isOwnProfile ? !DATA_CACHE.profile : true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { updateUser, logout } = useAuth();

  useEffect(() => {
    setPage(1);
  }, [targetId]);

  useEffect(() => {
    if (!targetId) return;
    
    let isActive = true;
    if (page === 1) {
      if (!isOwnProfile || !DATA_CACHE.profile) {
        setProfile(null);
        setUserConfessions([]);
      }
    }
    
    const fetchProfileData = async () => {
      if (page === 1 && (!isOwnProfile || !DATA_CACHE.profile)) setLoading(true);
      else if (page > 1) setIsLoadingMore(true);
      
      try {
        const token = localStorage.getItem('morpheus_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        if (page === 1) {
          const [profileRes, confessionsRes] = await Promise.all([
            fetch(`${SOCKET_URL}/api/users/${targetId}`, { headers }),
            fetch(`${SOCKET_URL}/api/users/${targetId}/confessions?page=1&limit=10`, { headers })
          ]);
          
          if (!isActive) return;
          
          if (profileRes.ok) {
            const data = await profileRes.json();
            setProfile(data.user);
            if (isOwnProfile) updateCache('profile', data.user);
          }
          if (confessionsRes.ok) {
            const data = await confessionsRes.json();
            setUserConfessions(data.confessions);
            if (isOwnProfile) updateCache('profileConfessions', data.confessions);
            setHasMore(data.pagination?.page < data.pagination?.pages);
          }
        } else {
          const confessionsRes = await fetch(`${SOCKET_URL}/api/users/${targetId}/confessions?page=${page}&limit=10`, { headers });
          if (!isActive) return;
          if (confessionsRes.ok) {
            const data = await confessionsRes.json();
            setUserConfessions(prev => {
              const uniqueNew = data.confessions.filter(newConf => !prev.some(p => p._id === newConf._id));
              const combined = [...prev, ...uniqueNew];
              if (isOwnProfile) updateCache('profileConfessions', combined);
              return combined;
            });
            setHasMore(data.pagination?.page < data.pagination?.pages);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        if (isActive) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    };
    
    fetchProfileData();
    return () => { isActive = false; };
  }, [targetId, page, isOwnProfile]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
          try {
            const token = localStorage.getItem('morpheus_token');
            const res = await fetch(`${SOCKET_URL}/api/users/avatar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ imageData: reader.result })
            });
            if (res.ok) {
              const data = await res.json();
              setProfile(prev => {
                const newProfile = { ...prev, avatarUrl: data.avatarUrl };
                if (isOwnProfile) updateCache('profile', newProfile);
                return newProfile;
              });
              updateUser({ avatarUrl: data.avatarUrl });
              setUserConfessions(prev => {
                const newConfessions = prev.map(conf => ({
                  ...conf,
                  author: { ...conf.author, avatarUrl: data.avatarUrl }
                }));
                if (isOwnProfile) updateCache('profileConfessions', newConfessions);
                return newConfessions;
              });
            }
          } catch (err) {
            console.error('Upload request failed:', err);
          } finally {
            setUploadingAvatar(false);
        }
      };
        reader.onerror = () => {
          console.error('File reading failed');
          setUploadingAvatar(false);
        };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setUploadingAvatar(false);
    }
  };

  const handleDeleteConfession = (id) => {
    setUserConfessions(prev => {
      const newArr = prev.filter(c => c._id !== id);
      if (isOwnProfile) updateCache('profileConfessions', newArr);
      return newArr;
    });
    setProfile(prev => {
      const newProfile = { ...prev, totalConfessions: Math.max(0, (prev.totalConfessions || 0) - 1) };
      if (isOwnProfile) updateCache('profile', newProfile);
      return newProfile;
    });
  };

  const xpPercent = profile ? ((profile.xp % 100) / 100) * 100 : 0;

  const handleFollowChange = async (newStatus) => {
    setProfile(prev => ({
      ...prev,
      followers: newStatus ? prev.followers + 1 : Math.max(0, prev.followers - 1),
      isFollowing: newStatus
    }));
    try {
      const token = localStorage.getItem('morpheus_token');
      await fetch(`${SOCKET_URL}/api/users/${targetId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-[var(--text-muted)] animate-pulse">Loading Profile...</div></div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-[var(--text-muted)]">User not found</div></div>;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="profile-header">
        <div className="relative mx-auto mb-4" style={{ width: '100px', height: '100px' }}>
          <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${getRarityOrbClass(profile.rarity)}`}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            )}
          </div>
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 bg-[var(--accent-primary)] text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-105 transition-all z-10" title="Upload Custom Photo">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              {uploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              )}
            </label>
          )}
        </div>
        <h1 className={`profile-name ${getRarityTextClass(profile.rarity)}`}>{profile.anonymousName}</h1>
        <p className="profile-title">{profile.title}</p>
        <RarityBadge rarity={profile.rarity} />

        <div className="profile-stats">
          <div className="stat-item"><p className="stat-value">{profile.totalConfessions || 0}</p><p className="stat-label">Whispers</p></div>
          <div className="stat-item"><p className="stat-value">{profile.totalReactions || 0}</p><p className="stat-label">Echoes</p></div>
          <div className="stat-item"><p className="stat-value">{profile.followers || 0}</p><p className="stat-label">Followers</p></div>
          <div className="stat-item"><p className="stat-value">{profile.following || 0}</p><p className="stat-label">Following</p></div>
        </div>

        {!isOwnProfile ? (
          <div className="profile-actions">
            <FollowButton 
              userId={profile.id || profile._id}
              initialFollowing={profile.isFollowing || false}
              onFollowChange={handleFollowChange}
            />
            <Link to={`/messages?to=${profile.id || profile._id}`} className="profile-btn secondary">
              Message 💬
            </Link>
          </div>
        ) : (
          <div className="profile-actions mobile-only">
            <button onClick={logout} className="profile-btn secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Logout
            </button>
          </div>
        )}

        <div className="xp-bar-container">
          <div className="xp-bar-label"><span>Level {profile.level || 1}</span><span>{profile.xp || 0} XP</span></div>
          <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${xpPercent}%` }}></div></div>
        </div>
      </div>

      {profile.badges?.length > 0 && (
        <div className="badges-section">
          <p className="badges-title">Badges</p>
          <div className="badges-list">
            {profile.badges.map((badge, idx) => <span key={idx} className="badge" style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#a855f7' }}>{badge}</span>)}
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Whispers</h3>
        <div className="space-y-4">
          {userConfessions.length > 0 ? (
            <>
              {userConfessions.map(confession => <ConfessionCard key={confession._id} confession={confession} onDelete={handleDeleteConfession} />)}
              {hasMore && (
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoadingMore}
                  className="w-full py-3 mt-4 mb-8 bg-[var(--bg-card)] border border-[rgba(255,255,255,0.6)] text-[var(--accent-primary)] font-semibold rounded-xl hover:bg-[var(--accent-light)] transition-all backdrop-blur-md"
                >
                  {isLoadingMore ? 'Listening deeper...' : 'Load More Whispers'}
                </button>
              )}
            </>
          ) : (
            <div className="text-center text-[var(--text-muted)] py-8">No whispers shared yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN APP LAYOUT
// =============================================================================
const AppLayout = ({ children }) => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.01, ease: "easeInOut" }}
            className="page-container"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================
const App = () => (
  <AuthProvider>
    <SocketProvider>
      <PeacefulBackground />
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
    </SocketProvider>
  </AuthProvider>
);

export default App;