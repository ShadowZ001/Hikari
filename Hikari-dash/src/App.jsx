import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Music, 
  Shield, 
  Search, 
  ArrowRight, 
  Play, 
  Sparkles, 
  Volume2, 
  Disc,
  LogOut,
  Server,
  Heart,
  ListMusic,
  Activity,
  Cpu,
  Clock,
  Gauge,
  LayoutGrid,
  Users,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Home,
  Trash2
} from 'lucide-react';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(80);
  const [session, setSession] = useState({ loggedIn: false, user: null });
  const [loading, setLoading] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [currentTab, setCurrentTab] = useState('servers');
  const [serverSearchQuery, setServerSearchQuery] = useState('');
  const [stats, setStats] = useState({
    serversCount: 0,
    usersCount: 0,
    commandsCount: 67,
    uptime: 0,
    apiLatency: 0,
    activePlayersCount: 0
  });

  const [likedSongs, setLikedSongs] = useState([]);
  const [likedSearchQuery, setLikedSearchQuery] = useState('');
  
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState({ id: 'liked', name: 'Liked Music', tracks: [], isBuiltIn: true });
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedServerId, setSelectedServerId] = useState('');
  const [activityPlayers, setActivityPlayers] = useState([]);
  
  const user = session.user;

  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        closeToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ show: false, message: '', onConfirm: null });
  };

  const fetchPlaylists = () => {
    fetch('/api/auth/playlists')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlaylists(data);
          setSelectedPlaylist(current => {
            if (current && !current.isBuiltIn) {
              const updated = data.find(p => p._id === current._id);
              if (updated) return { ...updated, isBuiltIn: false };
            }
            return current;
          });
        }
      })
      .catch(err => console.error('Failed to fetch playlists:', err));
  };

  const handleCreatePlaylist = (e) => {
    if (e) e.preventDefault();
    if (!newPlaylistName || newPlaylistName.trim() === '') return;

    fetch('/api/auth/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPlaylistName.trim() })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to create playlist') });
        }
        return res.json();
      })
      .then(playlist => {
        setPlaylists(prev => [playlist, ...prev]);
        setNewPlaylistName('');
        setSelectedPlaylist({ ...playlist, isBuiltIn: false });
        showToast(`Playlist "${playlist.name}" created!`, 'success');
      })
      .catch(err => showToast(err.message, 'error'));
  };

  const handleDeletePlaylist = (id, name) => {
    showConfirm(`Are you sure you want to delete the playlist "${name}"?`, () => {
      fetch(`/api/auth/playlists/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPlaylists(prev => prev.filter(p => p._id !== id));
            setSelectedPlaylist({ id: 'liked', name: 'Liked Music', tracks: [], isBuiltIn: true });
            showToast(`Playlist "${name}" deleted successfully.`, 'success');
          } else {
            showToast(data.error || 'Failed to delete playlist', 'error');
          }
        })
        .catch(err => showToast(err.message, 'error'));
    });
  };

  useEffect(() => {
    if (selectedPlaylist && selectedPlaylist.isBuiltIn && selectedPlaylist.id === 'liked') {
      setSelectedPlaylist(current => {
        const mappedTracks = likedSongs.map(s => ({
          title: s.title,
          uri: s.uri,
          duration: s.duration,
          artist: s.artist,
          thumbnail: s.thumbnail,
          durationMs: s.durationMs
        }));
        // Only update state if tracks have actually changed to avoid infinite loop
        if (JSON.stringify(current.tracks) !== JSON.stringify(mappedTracks)) {
          return { ...current, tracks: mappedTracks };
        }
        return current;
      });
    }
  }, [likedSongs, selectedPlaylist]);

  const fetchLikedSongs = () => {
    fetch('/api/auth/liked')
      .then(res => res.json())
      .then(data => {
        if (data && data.songs) {
          setLikedSongs(data.songs);
        }
      })
      .catch(err => console.error('Failed to fetch liked songs:', err));
  };

  useEffect(() => {
    if (session.loggedIn && user && user.guilds) {
      const joined = user.guilds.filter(g => g.joined);
      if (joined.length > 0 && !selectedServerId) {
        setSelectedServerId(joined[0].id);
      }
    }
  }, [session.loggedIn, user, selectedServerId]);

  const handlePlayPlaylist = (playNow) => {
    if (!selectedServerId) {
      showToast('Please select a server first!', 'error');
      return;
    }
    const playlistId = selectedPlaylist.isBuiltIn ? 'liked' : selectedPlaylist._id;

    fetch('/api/auth/playlists/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guildId: selectedServerId,
        playlistId,
        playNow
      })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Failed to play playlist') });
        }
        return res.json();
      })
      .then(data => {
        showToast(data.message || 'Successfully triggered bot playback!', 'success');
      })
      .catch(err => showToast(err.message, 'error'));
  };

  useEffect(() => {
    if (session.loggedIn) {
      fetchLikedSongs();
      fetchPlaylists();
    }
  }, [session.loggedIn, currentTab]);

  const handleDeleteLikedSong = (index) => {
    fetch(`/api/auth/liked/${index}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data && data.songs) {
          setLikedSongs(data.songs);
        }
      })
      .catch(err => console.error('Failed to delete liked song:', err));
  };

  const handleClearAllLikedSongs = () => {
    showConfirm('Are you sure you want to clear all liked songs?', () => {
      fetch('/api/auth/liked-all', { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data && data.songs) {
            setLikedSongs([]);
            showToast('All liked songs cleared.', 'success');
          }
        })
        .catch(err => showToast(err.message, 'error'));
    });
  };
  
  const getTopArtistsCount = () => {
    const uniqueArtists = new Set(
      likedSongs
        .map(s => s.artist ? s.artist.trim().toLowerCase() : '')
        .filter(a => a !== '')
    );
    return uniqueArtists.size;
  };

  const getLastSaveTime = () => {
    if (likedSongs.length === 0) return 'Recently';
    const dates = likedSongs
      .map(s => s.addedAt ? new Date(s.addedAt).getTime() : 0)
      .filter(t => t > 0);
    if (dates.length === 0) return 'Recently';
    const latestMs = Math.max(...dates);
    const diffMs = Date.now() - latestMs;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Yesterday';
    return new Date(latestMs).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  const getLastPlaylistUpdated = () => {
    if (playlists.length === 0) return '7 Jun 2026';
    const dates = playlists
      .map(p => p.updatedAt ? new Date(p.updatedAt).getTime() : 0)
      .filter(t => t > 0);
    if (dates.length === 0) return '7 Jun 2026';
    const latestMs = Math.max(...dates);
    return new Date(latestMs).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredLikedSongs = likedSongs
    .map((song, originalIndex) => ({ ...song, originalIndex }))
    .filter(song => {
      const q = likedSearchQuery.toLowerCase();
      const titleMatch = song.title && song.title.toLowerCase().includes(q);
      const artistMatch = song.artist && song.artist.toLowerCase().includes(q);
      return titleMatch || artistMatch;
    });


  // Poll bot stats and activity every 3 seconds if logged in
  useEffect(() => {
    if (session.loggedIn) {
      const fetchData = () => {
        fetch('/api/auth/stats')
          .then(res => res.json())
          .then(data => setStats(data))
          .catch(err => console.error('Failed to fetch stats:', err));

        fetch('/api/auth/activity')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setActivityPlayers(data);
            }
          })
          .catch(err => console.error('Failed to fetch activity:', err));
      };
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [session.loggedIn]);

  const formatUptime = (ms) => {
    if (!ms || ms <= 0) return '--';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Fetch session on component mount
  useEffect(() => {
    fetch('/api/auth/user')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setLoading(false);
        // If logged in, trigger a brief premium sync animation
        if (data.loggedIn) {
          setLoadingDashboard(true);
          const timer = setTimeout(() => {
            setLoadingDashboard(false);
          }, 1600);
          return () => clearTimeout(timer);
        }
      })
      .catch(err => {
        console.error('Failed to fetch session:', err);
        setLoading(false);
      });
  }, []);

  const handleLogin = () => {
    // Trigger login animation first before redirecting to Discord OAuth2
    setLoadingDashboard(true);
    setTimeout(() => {
      window.location.href = '/api/auth/login';
    }, 800);
  };

  const handleLogout = () => {
    setLoadingDashboard(true);
    fetch('/api/auth/logout')
      .then(res => res.json())
      .then(() => {
        setTimeout(() => {
          setSession({ loggedIn: false, user: null });
          setLoadingDashboard(false);
        }, 1000);
      })
      .catch(err => {
        console.error('Failed to logout:', err);
        setLoadingDashboard(false);
      });
  };

  // Mock landing page songs
  const mockSongs = [
    { name: 'Night drive phonk', category: 'TOP RESULT', plays: 'Queue instantly' },
    { name: 'Overview updates live', category: 'SERVER SYNC', plays: 'No manual refresh' },
    { name: '24/7 and voice-role locks', category: 'OWNER-SAFE', plays: 'Protected settings' }
  ];

  const userAvatarUrl = user && user.avatar 
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  // Filter actual user guilds
  const filteredGuilds = user && user.guilds
    ? user.guilds.filter(guild => guild.name.toLowerCase().includes(serverSearchQuery.toLowerCase()))
    : [];

  const joinedCount = user && user.guilds
    ? user.guilds.filter(guild => guild.joined).length
    : 0;

  const inviteRequiredCount = user && user.guilds
    ? user.guilds.filter(guild => !guild.joined).length
    : 0;

  // 🔄 FULL SCREEN LOADING TRANSITION
  if (loadingDashboard) {
    return (
      <div className="full-screen-loader">
        <div className="loader-container">
          <div className="rotating-rings">
            <div className="ring ring-outer"></div>
            <div className="ring ring-inner"></div>
            <div className="logo-center">H</div>
          </div>
          <h2 className="loader-title">Syncing with Discord</h2>
          <p className="loader-text">Fetching your servers and permissions...</p>
          <div className="loading-bar-wrapper">
            <div className="loading-bar-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-wrapper">
      
      {/* 🚀 NAVBAR */}
      <header className="navbar">
        <div className="nav-container">
          {session.loggedIn && user ? (
            <div className="brand-capsule-profile">
              <div className="brand-logo-circle">
                <span>H</span>
              </div>
              <div className="brand-profile-info">
                <span className="brand-profile-title">Hikari Dashboard</span>
                <span className="brand-profile-user">{user.username}</span>
              </div>
            </div>
          ) : (
            <div className="brand-capsule">
              <div className="brand-logo">
                <span>H</span>
              </div>
              <div className="brand-text-group">
                <span className="brand-name">HIKARI</span>
                <span className="brand-desc">Music dashboard</span>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="session-loader"></div>
          ) : session.loggedIn && user ? (
            <div className="nav-actions-right">
              <button 
                className={`btn-nav-tab-servers ${currentTab === 'servers' ? 'active' : ''}`}
                onClick={() => setCurrentTab('servers')}
              >
                Servers
              </button>
              <button 
                className={`btn-nav-tab-servers ${currentTab === 'liked' ? 'active' : ''}`}
                onClick={() => setCurrentTab('liked')}
              >
                Liked Songs
              </button>
              <button 
                className={`btn-nav-tab-servers ${currentTab === 'playlists' ? 'active' : ''}`}
                onClick={() => setCurrentTab('playlists')}
              >
                Playlists
              </button>
              <button 
                className={`btn-nav-tab-servers ${currentTab === 'activity' ? 'active' : ''}`}
                onClick={() => setCurrentTab('activity')}
              >
                Joined Activity
              </button>
              <button className="btn-signout-nav" onClick={handleLogout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn-login" onClick={handleLogin}>
              Log in with Discord
            </button>
          )}
        </div>
      </header>

      {/* 🌌 MAIN CONTENT */}
      <main className="main-content">
        
        {session.loggedIn && user ? (
          /* =========================================================
             👑 AUTHENTICATED SERVERS PAGE (Replicating Screenshots)
             ========================================================= */
          <div className="dashboard-page-wrapper">
            
            {/* 🖥️ SERVERS TAB */}
            {currentTab === 'servers' && (
              <div className="tab-fade-in">
                {/* Header section with Choose Server */}
                <div className="choose-server-header">
                  <div className="choose-logo-wrapper">
                    <div className="circle-logo-purple">H</div>
                  </div>
                  <div className="choose-title-wrapper">
                    <span className="sub-tag-purple">HIKARI CONTROL</span>
                    <h1 className="choose-server-title">Choose a server</h1>
                  </div>
                </div>

                {/* Profile & Logout pill rows */}
                <div className="profile-actions-row">
                  <div className="profile-pill">
                    <img src={userAvatarUrl} alt={user.username} className="profile-pill-avatar" />
                    <span className="profile-pill-name">{user.username}</span>
                  </div>
                  <button className="signout-pill" onClick={handleLogout}>
                    <LogOut size={13} />
                    <span>Sign out</span>
                  </button>
                </div>

                {/* 🖥️ Main Info visual card (Switch between servers card) */}
                <section className="switch-servers-section">
                  <div className="switch-card borderless-panel">
                    <div className="switch-badge">
                      <Activity size={12} className="purple-icon" />
                      <span>Joined server dashboards for Hikari</span>
                    </div>
                    <h2 className="switch-title">
                      Switch between servers<br />
                      without losing the <span className="gradient-text">music flow.</span>
                    </h2>
                    <p className="switch-desc">
                      Any member can open dashboards where Hikari is already in the server. Manage permissions 
                      still control who can change settings and invite the bot elsewhere.
                    </p>

                    {/* Metrics capsules list */}
                    <div className="metrics-capsules-list">
                      <span className="metric-pill purple-pill">{filteredGuilds.length} Servers visible</span>
                      <span className="metric-pill dark-pill">{joinedCount} Hikari already joined</span>
                      <span className="metric-pill dark-pill">{inviteRequiredCount} Invite required</span>
                    </div>

                    {/* Main Anime Girl image card showcase */}
                    <div className="switch-image-showcase">
                      <img src="/Hikari-pfp.jpg" alt="Hikari Banner Visual" className="switch-showcase-img" />
                      <div className="glass-overlay-card">
                        <span className="overlay-category">DASHBOARD ACCESS</span>
                        <h2 className="overlay-title">Open a dashboard where Hikari is already present.</h2>
                        <p className="overlay-text">
                          Invite it into a server you manage and start playback there.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 📊 Statistics grid cards */}
                <section className="stats-grid-section">
                  <div className="stats-grid">
                    
                    {/* Stat 1: Servers */}
                    <div className="stat-card">
                      <div className="stat-left">
                        <span className="stat-category">SERVERS</span>
                        <h2 className="stat-value">{stats.serversCount || 0}</h2>
                        <span className="stat-desc">{filteredGuilds.length} visible to you</span>
                      </div>
                      <LayoutGrid className="stat-icon" size={18} />
                    </div>

                    {/* Stat 2: Users */}
                    <div className="stat-card">
                      <div className="stat-left">
                        <span className="stat-category">USERS</span>
                        <h2 className="stat-value">{stats.usersCount ? `${(stats.usersCount / 1000).toFixed(2)}K` : '--'}</h2>
                        <span className="stat-desc">Cached Discord reach</span>
                      </div>
                      <Users className="stat-icon" size={18} />
                    </div>

                    {/* Stat 3: Commands */}
                    <div className="stat-card">
                      <div className="stat-left">
                        <span className="stat-category">COMMANDS</span>
                        <h2 className="stat-value">{stats.commandsCount || 67}</h2>
                        <span className="stat-desc">Loaded command modules</span>
                      </div>
                      <Cpu className="stat-icon" size={18} />
                    </div>

                    {/* Stat 4: Uptime */}
                    <div className="stat-card">
                      <div className="stat-left">
                        <span className="stat-category">UPTIME</span>
                        <h2 className="stat-value" style={{ fontSize: '20px', margin: '14px 0 10px 0' }}>{formatUptime(stats.uptime)}</h2>
                        <span className="stat-desc">1 cluster online</span>
                      </div>
                      <Clock className="stat-icon" size={18} />
                    </div>

                    {/* Stat 5: Latency */}
                    <div className="stat-card">
                      <div className="stat-left">
                        <span className="stat-category">LATENCY</span>
                        <h2 className="stat-value">{stats.apiLatency > 0 ? `${stats.apiLatency}ms` : '--'}</h2>
                        <span className="stat-desc">{stats.activePlayersCount || 0} playing now</span>
                      </div>
                      <Gauge className="stat-icon" size={18} />
                    </div>

                  </div>
                </section>

                {/* 🧱 Lower Modules cards */}
                <section className="modules-list-section">
                  <div className="modules-stack">
                    
                    {/* Liked songs module card */}
                    <div className="module-item-card clickable-card" onClick={() => setCurrentTab('liked')}>
                      <span className="module-card-badge"><Heart size={10} /> LIKED SONGS</span>
                      <h3 className="module-card-title">Open your liked songs</h3>
                      <p className="module-card-desc">
                        Review every track you saved with Hikari's like commands, remove old favorites, and 
                        keep your personal collection clean before jumping into a server.
                      </p>
                    </div>

                    {/* Playlists module card */}
                    <div className="module-item-card clickable-card" onClick={() => setCurrentTab('playlists')}>
                      <span className="module-card-badge"><ListMusic size={10} /> PLAYLISTS</span>
                      <h3 className="module-card-title">Build personal playlists</h3>
                      <p className="module-card-desc">
                        Create your own playlist sets, drop songs into them from the dashboard, and queue the 
                        whole stack into any joined server you share with Hikari.
                      </p>
                    </div>

                    {/* Joined activity module card */}
                    <div className="module-item-card clickable-card" onClick={() => setCurrentTab('activity')}>
                      <span className="module-card-badge"><Activity size={10} /> JOINED ACTIVITY</span>
                      <h3 className="module-card-title">See every active server</h3>
                      <p className="module-card-desc">
                        Watch Hikari's activity across all playing servers with current tracks, queue counts, 
                        listeners, and instant jump-ins for servers you share.
                      </p>
                    </div>

                  </div>
                </section>

                {/* 🛡️ Your Servers List Grid Section */}
                <section className="servers-list-section">
                  <div className="servers-list-header-row">
                    <div className="servers-header-left">
                      <h2 className="servers-list-title">Your servers</h2>
                      <p className="servers-list-desc">
                        Search your list, jump into joined servers, or invite Hikari where you have access.
                      </p>
                    </div>
                    
                    {/* Server Search Input */}
                    <div className="server-search-wrapper">
                      <Search size={14} className="server-search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search servers..." 
                        value={serverSearchQuery}
                        onChange={(e) => setServerSearchQuery(e.target.value)}
                        className="server-search-input"
                      />
                    </div>
                  </div>

                  {/* Alert banner */}
                  {user && !user.guildsVerified && (
                    <div className="servers-alert-banner">
                      <AlertTriangle size={14} className="alert-icon" />
                      <span>Could not verify which servers Hikari has joined.</span>
                    </div>
                  )}

                  {/* Server Grid */}
                  <div className="guilds-card-grid">
                    {filteredGuilds.length > 0 ? (
                      filteredGuilds.map((guild, idx) => {
                        const guildIconUrl = guild.icon
                          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`
                          : null;
                        
                        const isJoined = guild.joined;
                        const showStatus = user.guildsVerified 
                          ? (isJoined ? 'Hikari is active' : 'Not in server')
                          : 'Join status unavailable';
                        
                        const showBadge = user.guildsVerified
                          ? (isJoined ? 'JOINED' : 'INVITE REQUIRED')
                          : 'UNKNOWN';

                        return (
                          <div key={idx} className="guild-card">
                            <div className="guild-card-top">
                              <div className="guild-card-left">
                                {guildIconUrl ? (
                                  <img src={guildIconUrl} alt={guild.name} className="guild-card-icon-img" />
                                ) : (
                                  <div className="guild-card-icon-fallback">
                                    {guild.name.charAt(0)}
                                  </div>
                                )}
                                <div className="guild-card-meta">
                                  <h4 className="guild-card-name">{guild.name}</h4>
                                  <span className="guild-card-status">{showStatus}</span>
                                </div>
                              </div>
                              <span className={`guild-card-badge-tag ${isJoined ? 'badge-joined' : ''}`}>
                                • {showBadge}
                              </span>
                            </div>
                            
                            {/* Manage access detected indicator */}
                            <div className="guild-card-access-indicator">
                              <Shield size={11} className="shield-icon" />
                              <span>Manage access detected</span>
                            </div>
                            
                            <div className="guild-card-bottom-actions">
                              {isJoined ? (
                                <button 
                                  className="btn-guild-open"
                                  onClick={() => showToast(`Opening dashboard for ${guild.name}...`, 'info')}
                                >
                                  Open dashboard <ArrowRight size={11} />
                                </button>
                              ) : (
                                <button 
                                  className="btn-guild-invite" 
                                  onClick={() => window.open(`https://discord.com/oauth2/authorize?client_id=1507772633708761148&permissions=8&scope=bot+applications.commands&guild_id=${guild.id}`, '_blank')}
                                >
                                  Invite Hikari <ExternalLink size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-guilds-found">
                        <span>No administrator servers found matching "{serverSearchQuery}".</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* 💖 LIKED SONGS TAB */}
            {currentTab === 'liked' && (
              <div className="tab-fade-in liked-tab-view">
                {/* Header Section */}
                <div className="liked-header-section">
                  <div className="liked-badge-capsule">
                    <Heart size={12} className="purple-heart-icon" />
                    <span>Your liked collection</span>
                  </div>
                  <h1 className="liked-page-title">Liked Songs</h1>
                  <p className="liked-page-desc">
                    Everything you saved with Hikari's like commands lives here. Keep favorites separate from playlists and trim the list whenever you want.
                  </p>
                </div>

                {/* Stats row pills */}
                <div className="liked-stats-row">
                  <div className="liked-stat-pill">
                    <span className="pill-label">Liked songs</span>
                    <span className="pill-value">{likedSongs.length}</span>
                  </div>
                  <div className="liked-stat-pill">
                    <span className="pill-label">Top artists</span>
                    <span className="pill-value">{getTopArtistsCount()}</span>
                  </div>
                  <div className="liked-stat-pill last-save-pill">
                    <span className="pill-label">Last save</span>
                    <span className="pill-value-muted">{getLastSaveTime()}</span>
                  </div>
                </div>

                {/* Most Loved Song Section */}
                <div className="most-loved-container">
                  <div className="most-loved-label">MOST LOVED</div>
                  {likedSongs.length > 0 ? (
                    <div className="most-loved-card borderless-panel">
                      <div className="most-loved-left">
                        {likedSongs[0].thumbnail ? (
                          <img src={likedSongs[0].thumbnail} alt={likedSongs[0].title} className="most-loved-thumb" />
                        ) : (
                          <div className="most-loved-thumb-fallback"><Music size={24} /></div>
                        )}
                        <div className="most-loved-info">
                          <span className="most-loved-badge-tag">FEATURED FAVORITE</span>
                          <h3 className="most-loved-title">{likedSongs[0].title}</h3>
                          <span className="most-loved-artist">{likedSongs[0].artist || 'Unknown Artist'}</span>
                        </div>
                      </div>
                      <div className="most-loved-right">
                        <span className="most-loved-duration">{likedSongs[0].duration || '--:--'}</span>
                        <a href={likedSongs[0].uri} target="_blank" rel="noopener noreferrer" className="btn-most-loved-play">
                          <Play size={12} fill="currentColor" style={{ marginRight: '6px' }} /> Play track
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="most-loved-empty-card borderless-panel">
                      <h4 className="most-loved-empty-title">No favorites yet</h4>
                      <p className="most-loved-empty-desc">Start using like to build it.</p>
                    </div>
                  )}
                </div>

                {/* Saved Songs library section */}
                <div className="saved-songs-library-section">
                  <h2 className="saved-songs-title">Saved songs</h2>
                  <p className="saved-songs-desc">
                    Manage your liked tracks here, then jump into playlists when you want reusable sets.
                  </p>

                  {/* Actions Toolbar */}
                  <div className="library-toolbar">
                    <button className="btn-toolbar-playlists" onClick={() => setCurrentTab('playlists')}>
                      <ListMusic size={13} style={{ marginRight: '6px' }} />
                      <span>View playlists</span>
                    </button>

                    <div className="library-search-wrapper">
                      <Search size={13} className="library-search-icon" />
                      <input 
                        type="text" 
                        placeholder="Search library..." 
                        value={likedSearchQuery}
                        onChange={(e) => setLikedSearchQuery(e.target.value)}
                        className="library-search-input"
                      />
                    </div>

                    <button className="btn-toolbar-clear" onClick={handleClearAllLikedSongs}>
                      <Trash2 size={13} style={{ marginRight: '6px' }} />
                      <span>Clear all</span>
                    </button>
                  </div>

                  {/* Main empty/list state card */}
                  {filteredLikedSongs.length > 0 ? (
                    <div className="songs-list-container borderless-panel">
                      <div className="songs-table-header">
                        <span className="col-track">TRACK</span>
                        <span className="col-added">ADDED AT</span>
                        <span className="col-duration">DURATION</span>
                        <span className="col-actions"></span>
                      </div>
                      
                      <div className="songs-table-rows">
                        {filteredLikedSongs.map((song, idx) => {
                          const formattedAddedAt = song.addedAt 
                            ? new Date(song.addedAt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Unknown';

                          return (
                            <div key={idx} className="song-table-row">
                              <div className="col-track song-track-cell">
                                {song.thumbnail ? (
                                  <img src={song.thumbnail} alt={song.title} className="song-row-thumb" />
                                ) : (
                                  <div className="song-row-thumb-fallback"><Music size={14} /></div>
                                )}
                                <div className="song-row-meta">
                                  <h4 className="song-row-title-text" title={song.title}>
                                    <a href={song.uri} target="_blank" rel="noopener noreferrer" className="song-link-anchor">
                                      {song.title}
                                    </a>
                                  </h4>
                                  <span className="song-row-artist-text">{song.artist || 'Unknown Artist'}</span>
                                </div>
                              </div>
                              <div className="col-added song-added-cell">
                                <span>{formattedAddedAt}</span>
                              </div>
                              <div className="col-duration song-duration-cell">
                                <span>{song.duration || '--:--'}</span>
                              </div>
                              <div className="col-actions song-actions-cell">
                                <button 
                                  className="btn-song-delete" 
                                  onClick={() => handleDeleteLikedSong(song.originalIndex)}
                                  title="Remove from Liked"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="liked-empty-state-panel borderless-panel">
                      <div className="empty-avatar-wrapper">
                        <img src="/Hikari-pfp.jpg" alt="Hikari Avatar" className="empty-avatar-img" />
                      </div>
                      <h3 className="empty-state-title">
                        {likedSearchQuery ? 'No matching songs found' : 'No liked songs yet'}
                      </h3>
                      <p className="empty-state-desc">
                        {likedSearchQuery 
                          ? 'Try adjusting your search terms to find what you saved.' 
                          : "Use Hikari's like command while music is playing and your personal library will show up here instantly."
                        }
                      </p>
                      {likedSearchQuery ? (
                        <button className="btn-empty-action" onClick={() => setLikedSearchQuery('')}>
                          Clear search query
                        </button>
                      ) : (
                        <button className="btn-empty-action" onClick={() => setCurrentTab('servers')}>
                          Open server list
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🎵 PLAYLISTS TAB */}
            {currentTab === 'playlists' && (
              <div className="tab-fade-in playlists-tab-view">
                {/* Header Section */}
                <div className="liked-header-section">
                  <div className="liked-badge-capsule">
                    <ListMusic size={12} className="purple-heart-icon" />
                    <span>Personal sets for every mood</span>
                  </div>
                  <h1 className="liked-page-title">Your Playlists</h1>
                  <p className="liked-page-desc">
                    Build reusable mixes, save deep-link tracks, and push a full playlist into any joined server without re-searching everything.
                  </p>
                </div>

                {/* Stats row pills */}
                <div className="liked-stats-row">
                  <div className="liked-stat-pill">
                    <span className="pill-label">Playlists</span>
                    <span className="pill-value">{playlists.length + 1}</span>
                  </div>
                  <div className="liked-stat-pill">
                    <span className="pill-label">Saved songs</span>
                    <span className="pill-value">
                      {likedSongs.length + playlists.reduce((acc, p) => acc + (p.tracks?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="liked-stat-pill last-save-pill">
                    <span className="pill-label">Updated</span>
                    <span className="pill-value-muted">{getLastPlaylistUpdated()}</span>
                  </div>
                </div>

                {/* Metrics Grid Section */}
                <div className="playlists-metrics-grid">
                  <div className="metric-card-box">
                    <span className="metric-card-label">JOINED SERVERS</span>
                    <h3 className="metric-card-value">{joinedCount}</h3>
                    <p className="metric-card-desc">Servers ready for one-tap playlist queueing.</p>
                  </div>
                  <div className="metric-card-box clickable-card" onClick={() => setSelectedPlaylist({ id: 'liked', name: 'Liked Music', tracks: likedSongs, isBuiltIn: true })}>
                    <span className="metric-card-label">QUICK ROUTE</span>
                    <h3 className="metric-card-value" style={{ color: 'var(--color-accent-light)' }}>Liked Music</h3>
                    <p className="metric-card-desc">Queue your Liked Songs like a playlist.</p>
                  </div>
                </div>

                {/* Create a Playlist Card */}
                <div className="create-playlist-panel borderless-panel">
                  <span className="create-playlist-label">
                    <span style={{ marginRight: '6px' }}>+</span> Create a playlist
                  </span>
                  <form onSubmit={handleCreatePlaylist} style={{ width: '100%' }}>
                    <input 
                      type="text" 
                      placeholder="Late night drive" 
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="create-playlist-input"
                    />
                    <button type="submit" className="btn-create-playlist-submit">
                      Create playlist
                    </button>
                  </form>
                </div>

                {/* Playlist Collection List */}
                <div className="saved-songs-library-section">
                  <h2 className="saved-songs-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ListMusic size={18} className="purple-heart-icon" />
                    <span>Playlist collection</span>
                  </h2>
                  
                  <div className="playlists-collection-list">
                    {/* Built-in Liked Music Card */}
                    <div 
                      className={`playlist-collection-card ${selectedPlaylist.isBuiltIn ? 'active' : ''}`}
                      onClick={() => setSelectedPlaylist({ id: 'liked', name: 'Liked Music', tracks: likedSongs, isBuiltIn: true })}
                    >
                      <div className="playlist-collection-left">
                        <div className="playlist-icon-badge">
                          <Heart size={14} fill={selectedPlaylist.isBuiltIn ? 'currentColor' : 'none'} />
                        </div>
                        <div className="playlist-collection-info">
                          <h4 className="playlist-title-text">Liked Music</h4>
                          <span className="playlist-desc-text">{likedSongs.length} songs - auto-updated</span>
                        </div>
                      </div>
                      <span className="playlist-live-badge">LIVE</span>
                    </div>

                    {/* Custom Playlists */}
                    {playlists.map((p, idx) => (
                      <div 
                        key={idx}
                        className={`playlist-collection-card ${!selectedPlaylist.isBuiltIn && selectedPlaylist._id === p._id ? 'active' : ''}`}
                        onClick={() => setSelectedPlaylist({ ...p, isBuiltIn: false })}
                      >
                        <div className="playlist-collection-left">
                          <div className="playlist-icon-badge">
                            <Music size={14} />
                          </div>
                          <div className="playlist-collection-info">
                            <h4 className="playlist-title-text">{p.name}</h4>
                            <span className="playlist-desc-text">
                              {p.tracks?.length || 0} songs - updated {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                            </span>
                          </div>
                        </div>
                        <button 
                          className="btn-song-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlaylist(p._id, p.name);
                          }}
                          style={{ margin: 0 }}
                          title="Delete Playlist"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Selected Playlist Detail Block */}
                <div className="selected-playlist-detail-card borderless-panel" style={{ marginTop: '32px' }}>
                  <div className="liked-badge-capsule" style={{ marginBottom: '12px' }}>
                    <Heart size={11} className="purple-heart-icon" />
                    <span>{selectedPlaylist.isBuiltIn ? 'BUILT-IN PLAYLIST' : 'CUSTOM PLAYLIST'}</span>
                  </div>
                  
                  <h2 className="liked-page-title" style={{ marginTop: 0, fontSize: '28px' }}>{selectedPlaylist.name}</h2>
                  <p className="liked-page-desc" style={{ marginTop: '4px', marginBottom: '20px' }}>
                    {selectedPlaylist.isBuiltIn 
                      ? `${likedSongs.length} songs saved - syncs with Liked Songs`
                      : `${selectedPlaylist.tracks?.length || 0} songs saved - updated ${selectedPlaylist.updatedAt ? new Date(selectedPlaylist.updatedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}`
                    }
                  </p>

                  <button className="signout-pill" style={{ width: '100%', justifyContent: 'center', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition-fast)', marginBottom: '24px' }} onClick={() => setCurrentTab('liked')}>
                    <Heart size={13} style={{ marginRight: '6px' }} />
                    <span>Manage liked</span>
                  </button>

                  {/* SOURCE Card (Only for Liked Music) */}
                  {selectedPlaylist.isBuiltIn && (
                    <div className="metric-card-box" style={{ background: '#090710', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
                      <span className="metric-card-label" style={{ fontSize: '8px' }}>SOURCE</span>
                      <p className="metric-card-desc" style={{ color: '#fff', fontSize: '12px', margin: '6px 0 14px 0', lineHeight: '1.5' }}>
                        This list mirrors your Liked Songs library and refreshes while the page is open.
                      </p>
                      <button className="btn-empty-action" style={{ padding: '8px 18px', fontSize: '11px', borderRadius: '8px' }} onClick={() => setCurrentTab('liked')}>
                        Open Liked Songs
                      </button>
                    </div>
                  )}

                  {/* QUEUE INTO SERVER Card */}
                  <div className="metric-card-box" style={{ background: '#090710', border: '1px solid var(--border-card)', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
                    <span className="metric-card-label" style={{ fontSize: '8px' }}>QUEUE INTO SERVER</span>
                    
                    <div style={{ position: 'relative', marginTop: '12px', width: '100%' }}>
                      <select 
                        className="queue-server-select" 
                        value={selectedServerId}
                        onChange={(e) => setSelectedServerId(e.target.value)}
                      >
                        {filteredGuilds.filter(g => g.joined).length === 0 ? (
                          <option value="" disabled>No joined servers / Invite Hikari to a server first</option>
                        ) : (
                          <>
                            <option value="" disabled>Select a server</option>
                            {filteredGuilds.filter(g => g.joined).map(guild => (
                              <option key={guild.id} value={guild.id}>{guild.name}</option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="play-buttons-row">
                      <button className="btn-queue-playlist" onClick={() => handlePlayPlaylist(false)}>
                        <ListMusic size={13} style={{ marginRight: '6px' }} />
                        <span>Queue playlist</span>
                      </button>
                      <button className="btn-play-now" onClick={() => handlePlayPlaylist(true)}>
                        <Play size={11} fill="currentColor" style={{ marginRight: '6px' }} />
                        <span>Play now</span>
                      </button>
                    </div>
                  </div>

                  {/* Playlist Tracks Listing */}
                  {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
                    <div className="songs-table-rows" style={{ padding: 0 }}>
                      {selectedPlaylist.tracks.map((track, idx) => (
                        <div key={idx} className="song-table-row" style={{ gridTemplateColumns: '1fr 100px 50px', background: 'rgba(255, 255, 255, 0.01)', padding: '10px 12px', borderRadius: '8px', marginBottom: '6px' }}>
                          <div className="song-track-cell">
                            {track.thumbnail ? (
                              <img src={track.thumbnail} alt={track.title} className="song-row-thumb" />
                            ) : (
                              <div className="song-row-thumb-fallback"><Music size={13} /></div>
                            )}
                            <div className="song-row-meta">
                              <h4 className="song-row-title-text" style={{ fontSize: '13px' }}>
                                <a href={track.uri} target="_blank" rel="noopener noreferrer" className="song-link-anchor">
                                  {track.title}
                                </a>
                              </h4>
                              <span className="song-row-artist-text" style={{ fontSize: '11px' }}>{track.artist || 'Unknown Artist'}</span>
                            </div>
                          </div>
                          <div className="song-duration-cell" style={{ textAlign: 'right' }}>
                            <span>{track.duration || '--:--'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="metric-card-desc" style={{ textAlign: 'center', padding: '24px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No liked songs yet. Save tracks from a player and they will appear here automatically.
                    </p>
                  )}
                </div>
              </div>
            )}
            {currentTab === 'activity' && (
              <div className="tab-fade-in activity-tab-view">
                {/* Header Section */}
                <div className="liked-header-section">
                  <div className="activity-badge-capsule">
                    <span className="activity-pulse-icon">((•))</span>
                    <span>Hikari activity across every joined server</span>
                  </div>
                  <h1 className="activity-page-title">Joined Activity</h1>
                  <p className="activity-page-desc">
                    See every shared server where Hikari is currently playing, with quick jump-ins and clean playback context.
                  </p>
                </div>

                {/* Stats row pills */}
                <div className="activity-stats-row">
                  <div className="activity-stat-pill">
                    <span>Active servers</span>
                    <span className="activity-stat-value purple-val">{activityPlayers.length}</span>
                  </div>
                  <div className="activity-stat-pill">
                    <span>Listeners joined</span>
                    <span className="activity-stat-value purple-val">
                      {activityPlayers.reduce((acc, p) => acc + (p.listenerCount || 0), 0)}
                    </span>
                  </div>
                  <div className="activity-stat-pill">
                    <span>Queued tracks</span>
                    <span className="activity-stat-value grey-val">
                      {activityPlayers.reduce((acc, p) => acc + (p.queueLength || 0), 0)}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid Section */}
                <div className="activity-metrics-grid">
                  <div className="activity-metric-card">
                    <div className="activity-metric-icon purple">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="12" x="3" y="4" rx="2" ry="2"/>
                        <line x1="6" x2="18" y1="20" y2="20"/>
                        <line x1="12" x2="12" y1="16" y2="20"/>
                      </svg>
                    </div>
                    <span className="activity-metric-label">AUDIENCE</span>
                    <h3 className="activity-metric-value">
                      {activityPlayers.reduce((acc, p) => acc + (p.listenerCount || 0), 0)}
                    </h3>
                  </div>
                  
                  <div className="activity-metric-card">
                    <div className="activity-metric-icon blue">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
                        <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
                        <circle cx="12" cy="12" r="2"/>
                        <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
                        <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
                      </svg>
                    </div>
                    <span className="activity-metric-label">SERVERS PLAYING</span>
                    <h3 className="activity-metric-value">
                      {activityPlayers.length}
                    </h3>
                  </div>
                </div>

                {/* Main Content Box (Conditional list or empty state) */}
                {activityPlayers.length > 0 ? (
                  <div className="activity-list">
                    {activityPlayers.map((player, idx) => {
                      const guildIconUrl = player.guildIcon
                        ? `https://cdn.discordapp.com/icons/${player.guildId}/${player.guildIcon}.png?size=64`
                        : null;

                      return (
                        <div key={idx} className="activity-player-card">
                          {player.currentTrack?.thumbnail && (
                            <div 
                              className="activity-player-bg-blur" 
                              style={{ backgroundImage: `url(${player.currentTrack.thumbnail})` }}
                            />
                          )}
                          
                          <div className="activity-player-header">
                            <div className="activity-server-info">
                              {guildIconUrl ? (
                                <img src={guildIconUrl} alt={player.guildName} className="activity-server-icon" />
                              ) : (
                                <div className="activity-server-icon-fallback">
                                  {player.guildName.charAt(0)}
                                </div>
                              )}
                              <span className="activity-server-name">{player.guildName}</span>
                            </div>
                            
                            <div className={`activity-status-pill ${player.isPaused ? 'paused' : 'playing'}`}>
                              <span className="activity-status-dot"></span>
                              <span>{player.isPaused ? 'PAUSED' : 'LIVE'}</span>
                            </div>
                          </div>
                          
                          <div className="activity-player-body">
                            <div className="activity-song-details">
                              {player.currentTrack?.thumbnail ? (
                                <div className="activity-art-wrapper">
                                  <img src={player.currentTrack.thumbnail} alt={player.currentTrack.title} className="activity-track-art" />
                                </div>
                              ) : (
                                <div className="activity-art-fallback">
                                  <Music size={20} />
                                </div>
                              )}
                              
                              <div className="activity-track-meta">
                                <h4 className="activity-track-title" title={player.currentTrack?.title || 'No track playing'}>
                                  {player.currentTrack ? (
                                    <a href={player.currentTrack.uri} target="_blank" rel="noopener noreferrer" className="song-link-anchor">
                                      {player.currentTrack.title}
                                    </a>
                                  ) : (
                                    'Idle'
                                  )}
                                </h4>
                                <span className="activity-track-artist">
                                  {player.currentTrack?.artist || 'Unknown Artist'}
                                </span>
                                {player.currentTrack?.duration && (
                                  <span className="activity-track-duration">
                                    <Clock size={10} style={{ marginRight: '4px' }} /> {player.currentTrack.duration}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="activity-player-right-stats">
                              <div className="activity-stat-box">
                                <Users size={12} className="stat-box-icon purple" />
                                <span className="stat-box-text"><b>{player.listenerCount}</b> listeners</span>
                              </div>
                              <div className="activity-stat-box">
                                <ListMusic size={12} className="stat-box-icon blue" />
                                <span className="stat-box-text"><b>{player.queueLength}</b> queued</span>
                              </div>
                            </div>
                          </div>

                          {!player.isPaused && player.currentTrack && (
                            <div className="activity-player-soundwave">
                              <span className="wave-bar bar-1"></span>
                              <span className="wave-bar bar-2"></span>
                              <span className="wave-bar bar-3"></span>
                              <span className="wave-bar bar-4"></span>
                              <span className="wave-bar bar-5"></span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="activity-empty-card">
                    <div className="activity-empty-disc-wrapper">
                      <div className="activity-empty-disc">
                        <div className="activity-disc-inner">
                          <span className="activity-disc-text">((o))</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="activity-empty-title">Nothing is playing in shared servers right now</h3>
                    <p className="activity-empty-desc">
                      As soon as Hikari starts music in any server, the board will light up here automatically.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================
             🌐 DEFAULT ANONYMOUS LANDING PAGE (V2 Layouts)
             ========================================================= */
          <>
            <div className="hero-container">
              {/* Real-time Badge */}
              <div className="hero-badge">
                <Sparkles className="icon-sparkle" size={12} />
                <span>Real-time Discord music control for your community.</span>
              </div>

              {/* Hero Heading */}
              <h1 className="hero-title">
                Your server music,<br />
                beautifully under <span className="gradient-text">control.</span>
              </h1>

              {/* Subtitle description */}
              <p className="hero-description">
                Hikari gives your server a live overview, fast queue controls, and a music search flow 
                that feels more like a player than an admin panel.
              </p>

              {/* Hero Action buttons */}
              <div className="hero-actions">
                <button className="btn-primary" onClick={handleLogin}>
                  Open dashboard <ArrowRight size={14} />
                </button>
                <button className="btn-secondary" onClick={() => window.open('https://discord.com/oauth2/authorize?client_id=1507772633708761148&permissions=8&scope=bot+applications.commands', '_blank')}>
                  <Play className="icon-play" size={12} />
                  Invite Hikari
                </button>
              </div>
            </div>

            {/* 🛠️ 3-Column Features Section */}
            <section className="features-section">
              <div className="features-grid">
                
                {/* Feature 1 */}
                <div className="feature-card">
                  <div className="feature-icon-circle">
                    <Radio className="feature-icon" size={18} />
                  </div>
                  <h3 className="feature-title">Real-time control</h3>
                  <p className="feature-desc">
                    Track changes, queue actions, and playback state stay in sync while your server listens.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="feature-card">
                  <div className="feature-icon-circle">
                    <Music className="feature-icon" size={18} />
                  </div>
                  <h3 className="feature-title">Made for music</h3>
                  <p className="feature-desc">
                    Search, queue, skip, and manage the player without bouncing between slash commands.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="feature-card">
                  <div className="feature-icon-circle">
                    <Shield className="feature-icon" size={18} />
                  </div>
                  <h3 className="feature-title">Permission-aware</h3>
                  <p className="feature-desc">
                    Members can control music, staff can manage settings, and risky options stay owner locked.
                  </p>
                </div>

              </div>
            </section>

            {/* 🎵 Mock Fast Queue Control Card */}
            <section className="demo-section">
              <div className="demo-card borderless-panel">
                <div className="demo-header">
                  <div className="demo-header-info">
                    <span className="demo-category">SEARCH AND PLAY</span>
                    <h2 className="demo-title">Fast queue controls.</h2>
                  </div>
                  <span className="live-badge">
                    <span className="pulse-dot"></span>
                    Live queue
                  </span>
                </div>

                {/* Search Input Bar Mockup */}
                <div className="search-bar-wrapper">
                  <Search className="search-bar-icon" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search songs, playlists, or paste a link..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                {/* Songs Grid Rows */}
                <div className="songs-list">
                  {mockSongs.map((song, idx) => (
                    <div key={idx} className="song-row-card">
                      <div className="song-row-left">
                        <span className="song-row-category">{song.category}</span>
                        <h4 className="song-row-title">{song.name}</h4>
                      </div>
                      <span className="song-row-action-text">{song.plays}</span>
                    </div>
                  ))}
                </div>

                {/* Volume controller slide */}
                <div className="interactive-volume-bar">
                  <div className="volume-info">
                    <div className="volume-label-group">
                      <Volume2 size={14} className="volume-icon" />
                      <span className="volume-text">Active Volume Control</span>
                    </div>
                    <span className="volume-percentage">{volume}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="volume-slider"
                  />
                </div>
              </div>
            </section>

            {/* 📸 PFP Display Card */}
            <section className="pfp-card-section">
              <div className="pfp-display-card">
                <img src="/Hikari-pfp.jpg" alt="Hikari Avatar" className="pfp-image" />
                
                {/* Glassmorphic banner overlay */}
                <div className="glass-overlay-card">
                  <span className="overlay-category">HIKARI DASHBOARD</span>
                  <h2 className="overlay-title">Music control for every server.</h2>
                  <p className="overlay-text">
                    Search, queue, playback, and permissions stay organized for every server.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* 📱 PERSISTENT MOBILE BOTTOM TAB NAVIGATION */}
      {session.loggedIn && user && (
        <nav className="mobile-bottom-tabs">
          <button 
            className={`tab-item ${currentTab === 'servers' ? 'active' : ''}`}
            onClick={() => setCurrentTab('servers')}
          >
            <Home size={18} />
            <span>Servers</span>
          </button>
          <button 
            className={`tab-item ${currentTab === 'liked' ? 'active' : ''}`}
            onClick={() => setCurrentTab('liked')}
          >
            <Heart size={18} />
            <span>Liked Songs</span>
          </button>
          <button 
            className={`tab-item ${currentTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setCurrentTab('playlists')}
          >
            <ListMusic size={18} />
            <span>Playlists</span>
          </button>
          <button 
            className={`tab-item ${currentTab === 'activity' ? 'active' : ''}`}
            onClick={() => setCurrentTab('activity')}
          >
            <LayoutGrid size={18} />
            <span>Joined Activity</span>
          </button>
        </nav>
      )}

      {/* 📝 FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <span className="footer-left">
            Hikari is a free Discord music bot and dashboard.
          </span>
          <div className="footer-links">
            <a href="https://discord.com/oauth2/authorize?client_id=1507772633708761148&permissions=8&scope=bot+applications.commands" target="_blank" rel="noopener noreferrer" className="footer-link">Invite Hikari</a>
            <a href="https://discord.gg/WSyEdJXFtY" target="_blank" rel="noopener noreferrer" className="footer-link">Support Server</a>
            <a href="#tos" className="footer-link">Terms of Service</a>
            <a href="#privacy" className="footer-link">Privacy Policy</a>
          </div>
        </div>
      </footer>
      {/* 🔔 CUSTOM NOTIFICATION TOAST */}
      {toast.show && (
        <div className={`custom-toast toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <Sparkles size={14} />}
            {toast.type === 'error' && <AlertTriangle size={14} />}
            {toast.type === 'info' && <Music size={14} />}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close-btn" onClick={closeToast}>×</button>
        </div>
      )}

      {/* 💬 CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <div className="confirm-modal-icon-circle">
              <AlertTriangle size={24} className="warning-icon" />
            </div>
            <h3 className="confirm-modal-title">Are you sure?</h3>
            <p className="confirm-modal-text">{confirmModal.message}</p>
            <div className="confirm-modal-actions">
              <button className="btn-confirm-cancel" onClick={closeConfirm}>
                Cancel
              </button>
              <button 
                className="btn-confirm-accept" 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  closeConfirm();
                }}
              >
                Yes, proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
