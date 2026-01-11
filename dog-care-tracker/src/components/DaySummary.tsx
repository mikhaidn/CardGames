import { useState } from 'react';
import { DayLog } from '../types';

interface DaySummaryProps {
  dayLog: DayLog;
  onChange: (updates: Partial<Pick<DayLog, 'summary' | 'photoUrl'>>) => void;
}

export function DaySummary({ dayLog, onChange }: DaySummaryProps) {
  const [showPhotoInput, setShowPhotoInput] = useState(!dayLog.photoUrl);
  const [imageError, setImageError] = useState(false);

  const handleChangePhoto = () => {
    setShowPhotoInput(true);
    setImageError(false);
  };

  const handleRemovePhoto = () => {
    onChange({ photoUrl: '' });
    setShowPhotoInput(true);
    setImageError(false);
  };

  const handlePhotoUrlChange = (url: string) => {
    onChange({ photoUrl: url });
    if (url) {
      setImageError(false);
    }
  };

  return (
    <div className="day-summary-card">
      <div className="day-summary-header">
        <span className="day-summary-icon">📝</span>
        <h3 className="day-summary-title">Day Summary</h3>
      </div>

      <div className="day-summary-content">
        <div className="summary-field">
          <label htmlFor="summary" className="field-label">
            Notes
          </label>
          <textarea
            id="summary"
            className="summary-textarea"
            placeholder="Overall notes for the day..."
            value={dayLog.summary || ''}
            onChange={(e) => onChange({ summary: e.target.value })}
            rows={3}
          />
        </div>

        <div className="summary-field">
          <label className="field-label">
            Photo <span className="field-hint">(optional)</span>
          </label>

          {!dayLog.photoUrl || showPhotoInput ? (
            <>
              <input
                type="url"
                id="photoUrl"
                className="photo-input"
                placeholder="Paste direct image URL (e.g., from iCloud)"
                value={dayLog.photoUrl || ''}
                onChange={(e) => handlePhotoUrlChange(e.target.value)}
              />
              <p className="photo-help-text">
                💡 <strong>Tip:</strong> Google Photos links won't work. Use iCloud, Imgur, or
                direct image URLs ending in .jpg/.png
              </p>
            </>
          ) : (
            <div className="photo-display">
              {!imageError ? (
                <div className="photo-preview">
                  <img
                    src={dayLog.photoUrl}
                    alt="Day photo"
                    className="photo-preview-img"
                    onError={() => {
                      setImageError(true);
                    }}
                  />
                </div>
              ) : (
                <div className="photo-error">
                  <p>❌ Image failed to load</p>
                  <p className="photo-error-hint">
                    This URL might not be a direct image link. Try a different URL or remove it.
                  </p>
                </div>
              )}
              <div className="photo-actions">
                <button type="button" className="btn-link" onClick={handleChangePhoto}>
                  Change Photo
                </button>
                <button type="button" className="btn-link btn-danger-link" onClick={handleRemovePhoto}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
