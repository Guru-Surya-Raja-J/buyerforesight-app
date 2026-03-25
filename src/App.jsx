import { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';

// Smart API Routing: Hits localhost:3001 during Dev, and hits relative /users during Production
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/users' : '/users';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('asc');
  const [theme, setTheme] = useState('dark');
  const [currentView, setCurrentView] = useState('dashboard');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef(null);
  
  const [toast, setToast] = useState(null); // { message, type }
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // Handle click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [adminMenuRef]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let queryParams = `?sort=${sort}&order=${order}`;
      if (search) queryParams += `&search=${encodeURIComponent(search)}`;
      
      const response = await fetch(`${API_URL}${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, sort, order]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email')
    };

    const isEdit = !!editingUser;
    const url = isEdit ? `${API_URL}/${editingUser.id}` : API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save user');
      
      showToast(`User successfully ${isEdit ? 'updated' : 'created'}.`, 'success');
      setModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Triggers the custom confirmation modal instead of a browser alert
  const triggerDelete = (user) => {
    setConfirmModal({ isOpen: true, user });
  };

  // Executes the actual API deletion once confirmed
  const confirmDelete = async () => {
    const user = confirmModal.user;
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/${user.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      showToast(`${user.name} removed successfully`, 'success');
      setConfirmModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (error) {
      showToast(error.message, 'error');
      setConfirmModal({ isOpen: false, user: null });
    }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const renderDashboard = () => (
    <>
      <div className="top-bar glass-panel">
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search BuyerForeSight directory..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Enroll New Prospect
        </button>
      </div>

      <div className="content-header">
        <h1>BuyerForeSight User Management</h1>
        <div className="sort-controls">
          <span className="label">Sort by:</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="id">Record ID</option>
            <option value="name">Full Name</option>
            <option value="email">Email Address</option>
            <option value="created_at">Date Enrolled</option>
          </select>
          <button 
            className="btn btn-icon" 
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            title={`Sorting in ${order === 'asc' ? 'Ascending' : 'Descending'} Order`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {order === 'asc' 
                ? <><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></> 
                : <><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></>}
            </svg>
          </button>
        </div>
      </div>

      <div className="table-container glass-panel">
        {loading ? (
          <div className="state-container">
            <div className="spinner"></div>
            <p>Syncing global directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="state-container" style={{ padding: '8rem 2rem' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" style={{ marginBottom: '1.5rem' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h2>No Records Found</h2>
            <p style={{ marginTop: '0.5rem' }}>Your search didn't match any BuyerForeSight prospects. Try adjusting your query.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Prospect Details</th>
                <th>Corporate Email</th>
                <th>Date Enrolled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #0969da, #8b5cf6)', color: 'white' }}>
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-id">BF-Record ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{new Date(user.created_at + 'Z').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-icon" onClick={() => openModal(user)} title="Update record">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button className="btn btn-icon btn-danger" onClick={() => triggerDelete(user)} title="Remove prospect">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="content-header" style={{ marginBottom: '2rem' }}>
        <h1>Global Configurations</h1>
      </div>
      <div className="settings-panel">
        <div className="settings-card">
          <h3>Preferences</h3>
          
          <div className="setting-row">
            <div className="setting-info">
              <h4>Organization Name</h4>
              <p>The label used across all automated communications.</p>
            </div>
            <div className="input-wrapper" style={{ width: '250px' }}>
              <input type="text" defaultValue="BuyerForeSight Inc." disabled />
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <h4>Dark Mode UI</h4>
              <p>Toggle system theme appearance globally.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <h4>Webhooks Endpoint</h4>
              <p>REST API bridge endpoint for external integrations.</p>
            </div>
            <div className="input-wrapper" style={{ width: '250px' }}>
              <input type="text" value={API_URL} disabled style={{ opacity: 0.7 }} />
            </div>
          </div>
        </div>
        
        <div className="settings-card">
          <h3 style={{ color: 'var(--danger-color)' }}>Danger Zone</h3>
          <div className="setting-row">
            <div className="setting-info">
              <h4>Purge Database</h4>
              <p>Permanently remove all user records and restart sequence IDs from 1.</p>
            </div>
            <button className="btn btn-danger" onClick={() => showToast('Action restricted in demo mode', 'error')}>
              Erase All Data
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-container">
      <header className="sidebar glass-panel">
        <div className="logo" style={{ color: 'var(--primary-accent)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.2rem' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            <path d="M2 12h20"></path>
          </svg>
          <span style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>BuyerForeSight</span>
        </div>
        
        <nav className="nav-links">
          <button 
            className={currentView === 'dashboard' ? 'active' : ''} 
            onClick={() => setCurrentView('dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Dashboard
          </button>
          <button 
            className={currentView === 'settings' ? 'active' : ''} 
            onClick={() => setCurrentView('settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            System Settings
          </button>
        </nav>

        <div className="theme-toggle-container">
          <button className="btn btn-secondary" onClick={toggleTheme} style={{ width: '100%', gap: '0.75rem' }}>
            {theme === 'dark' ? (
              <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Switch to Light Theme</>
            ) : (
              <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Switch to Dark Theme</>
            )}
          </button>
        </div>

        <div style={{ position: 'relative' }} ref={adminMenuRef}>
          <div className="profile-preview" onClick={() => setAdminMenuOpen(!adminMenuOpen)}>
            <div className="avatar">AD</div>
            <div className="info" style={{ flexGrow: 1 }}>
              <strong>System Admin</strong>
              <span>Superuser <svg width="12" height="12" style={{ marginLeft: '4px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </div>
          </div>
          
          {adminMenuOpen && (
            <div className="admin-dropdown">
              <button onClick={() => { setCurrentView('settings'); setAdminMenuOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                My Profile
              </button>
              <button style={{ color: 'var(--danger-color)' }} onClick={() => { showToast('Signed out successfully (Demo)', 'success'); setAdminMenuOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {currentView === 'dashboard' ? renderDashboard() : renderSettings()}
      </main>

      {/* Editor Modal Overlay */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal glass-panel">
            <div className="modal-header">
              <h2>{editingUser ? 'Update Prospect Details' : 'Enroll New Prospect'}</h2>
              <button className="btn btn-icon" onClick={() => setModalOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="form-group">
                <label>Prospect Full Name</label>
                <div className="input-wrapper">
                  <input type="text" name="name" required defaultValue={editingUser?.name || ''} placeholder="e.g. John Executive" />
                </div>
              </div>
              <div className="form-group">
                <label>Corporate Email</label>
                <div className="input-wrapper">
                  <input type="email" name="email" required defaultValue={editingUser?.email || ''} placeholder="john.executive@company.com" />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Save Updates' : 'Enroll Prospect'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion instead of native alert */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal glass-panel" style={{ maxWidth: '420px', textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ color: 'var(--danger-color)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 700 }}>Confirm Deletion</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: '1.5' }}>
              Are you sure you want to permanently remove <strong>{confirmModal.user?.name}</strong> from the database? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmModal({ isOpen: false, user: null })} style={{ flex: 1, padding: '0.8rem' }}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete} style={{ flex: 1, padding: '0.8rem', background: 'var(--danger-color)', color: 'white', border: 'none' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Application Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' 
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            }
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
