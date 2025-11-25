/**
 * Colleague card component displaying colleague info and badges.
 */
import React, { useState } from 'react';
import { Colleague, apiClient, ColleagueWithBadges } from '../api/client';

interface ColleagueCardProps {
  colleague: Colleague;
  onAwardBadge: (colleagueId: number) => void;
  canAwardBadge: boolean;
}

const ColleagueCard: React.FC<ColleagueCardProps> = ({ colleague, onAwardBadge, canAwardBadge }) => {
  const [expanded, setExpanded] = useState(false);
  const [fullColleague, setFullColleague] = useState<ColleagueWithBadges | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !fullColleague) {
      setLoading(true);
      try {
        const data = await apiClient.getColleague(colleague.id);
        setFullColleague(data);
      } catch (error) {
        console.error('Failed to load colleague details:', error);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  const handleVote = async (badgeId: number, voteType: 'up' | 'down') => {
    try {
      await apiClient.createVote({ badge_id: badgeId, vote_type: voteType });
      // Refresh colleague data
      const data = await apiClient.getColleague(colleague.id);
      setFullColleague(data);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div onClick={handleExpand}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#667eea',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            marginRight: '15px'
          }}>
            {colleague.avatar_url ? (
              <img src={colleague.avatar_url} alt={colleague.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              colleague.name.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 5px 0' }}>{colleague.name}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              {colleague.position || 'Team Member'}
              {colleague.department && ` • ${colleague.department}`}
            </p>
          </div>
        </div>

        {colleague.bio && (
          <p style={{ 
            margin: '10px 0', 
            color: '#666', 
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            "{colleague.bio}"
          </p>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading badges...</p>
          ) : fullColleague && fullColleague.badges.length > 0 ? (
            <div>
              <h4 style={{ marginTop: 0, marginBottom: '10px' }}>🏅 Badges</h4>
              {fullColleague.badges.map((badge) => (
                <div key={badge.id} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {badge.icon && <span style={{ fontSize: '20px' }}>{badge.icon}</span>}
                        <strong>{badge.title}</strong>
                      </div>
                      {badge.description && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                          {badge.description}
                        </p>
                      )}
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                        {new Date(badge.awarded_at).toLocaleDateString()} • {badge.badge_type}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(badge.id, 'up');
                        }}
                        style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: badge.user_vote === 'up' ? '#4CAF50' : '#e0e0e0',
                          color: badge.user_vote === 'up' ? 'white' : '#333'
                        }}
                      >
                        👍 {badge.upvotes || 0}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(badge.id, 'down');
                        }}
                        style={{
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: badge.user_vote === 'down' ? '#f44336' : '#e0e0e0',
                          color: badge.user_vote === 'down' ? 'white' : '#333'
                        }}
                      >
                        👎 {badge.downvotes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
              No badges yet
            </p>
          )}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAwardBadge(colleague.id);
        }}
        disabled={!canAwardBadge}
        style={{
          width: '100%',
          marginTop: '15px',
          padding: '10px',
          backgroundColor: canAwardBadge ? '#4CAF50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: canAwardBadge ? 'pointer' : 'not-allowed',
          fontWeight: 'bold'
        }}
      >
        {canAwardBadge ? '🏆 Award Badge' : 'Quota Exceeded'}
      </button>
    </div>
  );
};

export default ColleagueCard;
