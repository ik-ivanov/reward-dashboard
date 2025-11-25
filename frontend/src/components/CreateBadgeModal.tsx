/**
 * Modal for creating a new badge.
 */
import React, { useState } from 'react';
import { apiClient, BadgeCreate } from '../api/client';

interface CreateBadgeModalProps {
  colleagueId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const BADGE_TYPES = [
  { value: 'teamwork', label: 'Teamwork', icon: '🤝' },
  { value: 'innovation', label: 'Innovation', icon: '💡' },
  { value: 'leadership', label: 'Leadership', icon: '👑' },
  { value: 'excellence', label: 'Excellence', icon: '⭐' },
  { value: 'dedication', label: 'Dedication', icon: '🎯' },
  { value: 'creativity', label: 'Creativity', icon: '🎨' },
  { value: 'mentorship', label: 'Mentorship', icon: '🎓' },
  { value: 'problem-solving', label: 'Problem Solving', icon: '🔧' },
];

const CreateBadgeModal: React.FC<CreateBadgeModalProps> = ({ colleagueId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Omit<BadgeCreate, 'colleague_id'>>({
    badge_type: '',
    title: '',
    description: '',
    icon: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBadgeTypeChange = (badgeType: string) => {
    const selectedBadge = BADGE_TYPES.find(b => b.value === badgeType);
    setFormData({
      ...formData,
      badge_type: badgeType,
      title: selectedBadge?.label || badgeType,
      icon: selectedBadge?.icon || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.createBadge({
        ...formData,
        colleague_id: colleagueId,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create badge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>🏆 Award Badge</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Badge Type *
            </label>
            <select
              value={formData.badge_type}
              onChange={(e) => handleBadgeTypeChange(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select a badge type</option>
              {BADGE_TYPES.map((badge) => (
                <option key={badge.value} value={badge.value}>
                  {badge.icon} {badge.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Why is this colleague receiving this badge?"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Icon
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Emoji (e.g., 🏆)"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Awarding...' : 'Award Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBadgeModal;
