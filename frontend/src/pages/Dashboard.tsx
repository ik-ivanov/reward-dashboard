/**
 * Main dashboard page showing stats and colleagues.
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Colleague, DashboardStats } from '../api/client';
import ColleagueCard from '../components/ColleagueCard';
import CreateColleagueModal from '../components/CreateColleagueModal';
import CreateBadgeModal from '../components/CreateBadgeModal';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateColleague, setShowCreateColleague] = useState(false);
  const [showCreateBadge, setShowCreateBadge] = useState(false);
  const [selectedColleagueId, setSelectedColleagueId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [colleaguesData, statsData] = await Promise.all([
        apiClient.getColleagues(),
        apiClient.getDashboardStats(),
      ]);
      setColleagues(colleaguesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleColleagueCreated = () => {
    setShowCreateColleague(false);
    loadData();
  };

  const handleBadgeCreated = () => {
    setShowCreateBadge(false);
    setSelectedColleagueId(null);
    loadData();
  };

  const handleAwardBadge = (colleagueId: number) => {
    setSelectedColleagueId(colleagueId);
    setShowCreateBadge(true);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '20px'
      }}>
        <h1>🏆 Reward Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Welcome, <strong>{user?.username}</strong></span>
          {user?.is_admin && <span style={{ 
            background: '#4CAF50', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>ADMIN</span>}
          <button onClick={logout} style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ 
            padding: '20px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Colleagues</h3>
            <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.total_colleagues}</p>
          </div>
          <div style={{ 
            padding: '20px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Badges</h3>
            <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.total_badges}</p>
          </div>
          <div style={{ 
            padding: '20px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Badges This Month</h3>
            <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.badges_this_month}</p>
          </div>
          <div style={{ 
            padding: '20px', 
            background: stats.remaining_quota > 0 ? '#e8f5e9' : '#ffebee', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Remaining Quota</h3>
            <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold', color: stats.remaining_quota > 0 ? '#4CAF50' : '#f44336' }}>
              {stats.remaining_quota}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        {user?.is_admin && (
          <button
            onClick={() => setShowCreateColleague(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ➕ Add Colleague
          </button>
        )}
      </div>

      {/* Colleagues Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {colleagues.map((colleague) => (
          <ColleagueCard
            key={colleague.id}
            colleague={colleague}
            onAwardBadge={handleAwardBadge}
            canAwardBadge={stats ? stats.remaining_quota > 0 : false}
          />
        ))}
      </div>

      {colleagues.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666' 
        }}>
          <p>No colleagues yet. {user?.is_admin && 'Click "Add Colleague" to get started!'}</p>
        </div>
      )}

      {/* Modals */}
      {showCreateColleague && (
        <CreateColleagueModal
          onClose={() => setShowCreateColleague(false)}
          onSuccess={handleColleagueCreated}
        />
      )}

      {showCreateBadge && selectedColleagueId && (
        <CreateBadgeModal
          colleagueId={selectedColleagueId}
          onClose={() => {
            setShowCreateBadge(false);
            setSelectedColleagueId(null);
          }}
          onSuccess={handleBadgeCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;
