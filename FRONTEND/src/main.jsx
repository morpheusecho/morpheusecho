/**
 * =============================================================================
 * MORPHEUS ECHO - CLIENT-SIDE LOGIC
 * =============================================================================
 * Contains:
 * - API client functions
 * - Socket.IO client
 * - Audio recording and effects
 * - Utility functions
 * - Local storage management
 * =============================================================================
 */

// =============================================================================
// CONFIGURATION
// =============================================================================
const CONFIG = {
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://morpheus-echo-backend.onrender.com/api',
  SOCKET_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://morpheus-echo-backend.onrender.com',
  APP_NAME: 'Morpheus Echo',
  VERSION: '1.0.0'
};

// =============================================================================
// LOCAL STORAGE MANAGEMENT
// =============================================================================
const Storage = {
  getToken() {
    return localStorage.getItem('morpheus_token');
  },
  
  setToken(token) {
    localStorage.setItem('morpheus_token', token);
  },
  
  removeToken() {
    localStorage.removeItem('morpheus_token');
  },
  
  getUser() {
    const user = localStorage.getItem('morpheus_user');
    return user ? JSON.parse(user) : null;
  },
  
  setUser(user) {
    localStorage.setItem('morpheus_user', JSON.stringify(user));
  },
  
  removeUser() {
    localStorage.removeItem('morpheus_user');
  },
  
  clear() {
    localStorage.removeItem('morpheus_token');
    localStorage.removeItem('morpheus_user');
  }
};

// =============================================================================
// API CLIENT
// =============================================================================
const API = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const token = Storage.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          Storage.clear();
          window.location.href = '/login';
        }
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  // Auth
  signup: (data) => API.request('/auth/signup', { method: 'POST', body: data }),
  login: (data) => API.request('/auth/login', { method: 'POST', body: data }),
  
  // Feed
  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.request(`/feed?${query}`);
  },
  
  // Confessions
  createConfession: (data) => API.request('/confessions', { method: 'POST', body: data }),
  getConfession: (id) => API.request(`/confessions/${id}`),
  reactToConfession: (id, reactionType) => API.request(`/confessions/${id}/react`, { 
    method: 'POST', 
    body: { reactionType } 
  }),
  getComments: (id) => API.request(`/confessions/${id}/comments`),
  addComment: (id, content, parentComment = null) => API.request(`/confessions/${id}/comments`, {
    method: 'POST',
    body: { content, parentComment }
  }),
  
  // Users
  getUser: (id) => API.request(`/users/${id}`),
  getUserConfessions: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return API.request(`/users/${id}/confessions?${query}`);
  },
  followUser: (id) => API.request(`/users/${id}/follow`, { method: 'POST' }),
  
  // Messages
  getConversations: () => API.request('/messages'),
  getMessages: (userId) => API.request(`/messages/${userId}`),
  sendMessage: (to, content) => API.request('/messages', { method: 'POST', body: { to, content } }),
  
  // Notifications
  getNotifications: () => API.request('/notifications'),
  markAllRead: () => API.request('/notifications/read-all', { method: 'PATCH' }),
  
  // Radio
  getRadioQueue: (category) => API.request(`/radio${category ? `?category=${category}` : ''}`),
  getRandomConfession: (category) => API.request(`/confessions/random${category ? `?category=${category}` : ''}`),
  
  // Categories
  getCategories: () => API.request('/categories'),
  
  // Stats
  getStats: () => API.request('/stats'),
  
  // Upload
  uploadAudio: (audioData) => API.request('/upload/audio', { method: 'POST', body: { audioData } })
};

// =============================================================================
// SOCKET.IO CLIENT
// =============================================================================
class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  connect(userId) {
    if (this.socket) return;
    
    this.socket = io(CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (userId) {
        this.socket.emit('authenticate', { userId });
      }
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
    });
    
    // Event listeners
    this.socket.on('new_message', (data) => {
      this.handleNewMessage(data);
    });
    
    this.socket.on('reaction_notification', (data) => {
      this.handleReactionNotification(data);
    });
    
    this.socket.on('comment_notification', (data) => {
      this.handleCommentNotification(data);
    });
    
    this.socket.on('follow_notification', (data) => {
      this.handleFollowNotification(data);
    });
    
    this.socket.on('level_up', (data) => {
      this.handleLevelUp(data);
    });
    
    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  sendMessage(to, content, from) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', { to, content, from });
    }
  }
  
  sendReaction(confessionId, authorId, reactionType, from) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new_reaction', { confessionId, authorId, reactionType, from });
    }
  }
  
  // Event handlers (to be overridden by React components)
  handleNewMessage(data) {
    window.dispatchEvent(new CustomEvent('socket:new_message', { detail: data }));
  }
  
  handleReactionNotification(data) {
    window.dispatchEvent(new CustomEvent('socket:reaction', { detail: data }));
  }
  
  handleCommentNotification(data) {
    window.dispatchEvent(new CustomEvent('socket:comment', { detail: data }));
  }
  
  handleFollowNotification(data) {
    window.dispatchEvent(new CustomEvent('socket:follow', { detail: data }));
  }
  
  handleLevelUp(data) {
    window.dispatchEvent(new CustomEvent('socket:level_up', { detail: data }));
  }
  
  handleNotification(data) {
    window.dispatchEvent(new CustomEvent('socket:notification', { detail: data }));
  }
}

const socketClient = new SocketClient();

// =============================================================================
// AUDIO RECORDER
// =============================================================================
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.startTime = null;
    this.timerInterval = null;
  }
  
  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startTime = Date.now();
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Could not access microphone. Please check permissions.');
    }
  }
  
  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = (Date.now() - this.startTime) / 1000;
        
        this.cleanup();
        resolve({ blob: audioBlob, duration });
      };
      
      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }
  
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.startTime = null;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  getElapsedTime() {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }
  
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// =============================================================================
// AUDIO EFFECTS (Web Audio API)
// =============================================================================
class AudioEffects {
  constructor() {
    this.audioContext = null;
  }
  
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  
  async applyEffect(audioBlob, effectType) {
    this.init();
    
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    let outputNode = source;
    
    switch (effectType) {
      case 'whisper':
        outputNode = this.applyWhisperEffect(source);
        break;
      case 'deep':
        outputNode = this.applyDeepEffect(source);
        break;
      case 'echo':
        outputNode = this.applyEchoEffect(source);
        break;
      case 'robotic':
        outputNode = this.applyRoboticEffect(source);
        break;
      default:
        // Normal - no effect
        break;
    }
    
    // Create destination and render
    const destination = this.audioContext.createMediaStreamDestination();
    outputNode.connect(destination);
    
    // For simplicity, return original blob (full implementation would render offline)
    return audioBlob;
  }
  
  applyWhisperEffect(source) {
    // High-pass filter + gain reduction
    const highPass = this.audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 1000;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = 0.7;
    
    source.connect(highPass);
    highPass.connect(gain);
    
    return gain;
  }
  
  applyDeepEffect(source) {
    // Simple pitch shift simulation using playback rate
    source.playbackRate.value = 0.8;
    
    const bassBoost = this.audioContext.createBiquadFilter();
    bassBoost.type = 'lowshelf';
    bassBoost.frequency.value = 200;
    bassBoost.gain.value = 5;
    
    source.connect(bassBoost);
    return bassBoost;
  }
  
  applyEchoEffect(source) {
    // Delay node for echo
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.3;
    
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.4;
    
    const mix = this.audioContext.createGain();
    mix.gain.value = 0.5;
    
    source.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(mix);
    source.connect(mix);
    
    return mix;
  }
  
  applyRoboticEffect(source) {
    // Ring modulation for robotic sound
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 100;
    
    const ringMod = this.audioContext.createGain();
    
    oscillator.connect(ringMod.gain);
    source.connect(ringMod);
    
    oscillator.start();
    
    return ringMod;
  }
}

const audioEffects = new AudioEffects();

// =============================================================================
// WAVEFORM VISUALIZER
// =============================================================================
class WaveformVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;
  }
  
  init(audioElement) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    const source = this.audioContext.createMediaElementSource(audioElement);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }
  
  start() {
    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      
      this.analyser.getByteFrequencyData(this.dataArray);
      
      this.ctx.fillStyle = '#111111';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < this.dataArray.length; i++) {
        barHeight = (this.dataArray[i] / 255) * this.canvas.height;
        
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, 0);
        gradient.addColorStop(0, '#6C63FF');
        gradient.addColorStop(1, '#9D97FF');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const Utils = {
  // Format relative time
  formatRelativeTime(date) {
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
  },
  
  // Format number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  
  // Truncate text
  truncate(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
  
  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Generate random ID
  generateId() {
    return Math.random().toString(36).substring(2, 15);
  },
  
  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  },
  
  // File to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  },
  
  // Blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  },
  
  // Get rarity color
  getRarityColor(rarity) {
    const colors = {
      MYTHIC: '#FF00FF',
      LEGENDARY: '#FFD700',
      EXCLUSIVE: '#00FFFF',
      RARE: '#C9A84C',
      UNCOMMON: '#C0C0C0',
      COMMON: '#9CA3AF'
    };
    return colors[rarity] || colors.COMMON;
  },
  
  // Get rarity frame class
  getRarityFrameClass(rarity) {
    const classes = {
      MYTHIC: 'frame-mythic',
      LEGENDARY: 'frame-legendary',
      EXCLUSIVE: 'frame-exclusive',
      RARE: 'frame-rare',
      UNCOMMON: 'frame-uncommon',
      COMMON: 'frame-common'
    };
    return classes[rarity] || classes.COMMON;
  },
  
  // Get rarity text class
  getRarityTextClass(rarity) {
    const classes = {
      MYTHIC: 'text-mythic',
      LEGENDARY: 'text-legendary',
      EXCLUSIVE: 'text-exclusive',
      RARE: 'text-rare',
      UNCOMMON: 'text-uncommon',
      COMMON: 'text-common'
    };
    return classes[rarity] || classes.COMMON;
  },
  
  // Get rarity orb class
  getRarityOrbClass(rarity) {
    const classes = {
      MYTHIC: 'orb-mythic',
      LEGENDARY: 'orb-legendary',
      EXCLUSIVE: 'orb-exclusive',
      RARE: 'orb-rare',
      UNCOMMON: 'orb-uncommon',
      COMMON: 'orb-common'
    };
    return classes[rarity] || classes.COMMON;
  },
  
  // Get category color
  getCategoryColor(categoryId) {
    const colors = {
      adult: '#8B0000',
      crime: '#4A4A4A',
      funny: '#FFD700',
      romantic: '#FF69B4',
      insult: '#FF8C00',
      sorrow: '#191970',
      pain: '#800000',
      god: '#FFD700',
      family: '#8B4513',
      opinion: '#800080',
      work: '#008080',
      mental: '#90EE90'
    };
    return colors[categoryId] || '#6C63FF';
  },
  
  // Get category class
  getCategoryClass(categoryId) {
    return `cat-${categoryId}`;
  }
};

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================
const Toast = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info', duration = 3000) {
    this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }[type] || 'ℹ';
    
    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastSlide 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  success(message, duration) {
    this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    this.show(message, 'info', duration);
  }
};

// =============================================================================
// LOADING SCREEN
// =============================================================================
const LoadingScreen = {
  element: null,
  
  init() {
    this.element = document.getElementById('loading-screen');
  },
  
  hide() {
    if (this.element) {
      this.element.classList.add('hidden');
      setTimeout(() => {
        this.element.style.display = 'none';
      }, 500);
    }
  },
  
  show() {
    if (this.element) {
      this.element.style.display = 'flex';
      this.element.classList.remove('hidden');
    }
  }
};

// =============================================================================
// INFINITE SCROLL
// =============================================================================
class InfiniteScroll {
  constructor(container, callback, options = {}) {
    this.container = container;
    this.callback = callback;
    this.threshold = options.threshold || 200;
    this.isLoading = false;
    this.hasMore = true;
    
    this.handleScroll = this.handleScroll.bind(this);
    this.container.addEventListener('scroll', this.handleScroll);
  }
  
  handleScroll() {
    if (this.isLoading || !this.hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = this.container;
    
    if (scrollHeight - scrollTop - clientHeight < this.threshold) {
      this.loadMore();
    }
  }
  
  async loadMore() {
    this.isLoading = true;
    try {
      const result = await this.callback();
      this.hasMore = result.hasMore;
    } catch (error) {
      console.error('Infinite scroll error:', error);
    } finally {
      this.isLoading = false;
    }
  }
  
  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
  }
  
  reset() {
    this.hasMore = true;
    this.isLoading = false;
  }
}

// =============================================================================
// PULL TO REFRESH
// =============================================================================
class PullToRefresh {
  constructor(element, callback) {
    this.element = element;
    this.callback = callback;
    this.startY = 0;
    this.isPulling = false;
    
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  handleTouchStart(e) {
    if (this.element.scrollTop === 0) {
      this.startY = e.touches[0].clientY;
      this.isPulling = true;
    }
  }
  
  handleTouchMove(e) {
    if (!this.isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - this.startY;
    
    if (diff > 0 && diff < 100) {
      this.element.style.transform = `translateY(${diff * 0.5}px)`;
    }
  }
  
  handleTouchEnd(e) {
    if (!this.isPulling) return;
    
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - this.startY;
    
    this.element.style.transform = '';
    this.isPulling = false;
    
    if (diff > 80) {
      this.callback();
    }
  }
}

// =============================================================================
// INITIALIZE
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  LoadingScreen.init();
  
  // Hide loading screen after React mounts
  setTimeout(() => {
    LoadingScreen.hide();
  }, 1500);
  
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
});

// =============================================================================
// EXPORT FOR REACT
// =============================================================================
window.MorpheusEcho = {
  CONFIG,
  Storage,
  API,
  socketClient,
  AudioRecorder,
  audioEffects,
  WaveformVisualizer,
  Utils,
  Toast,
  LoadingScreen,
  InfiniteScroll,
  PullToRefresh
};