// ============================================
// UI Component — Personalized Recommendations Toggle
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getServerSession } from '@/lib/session';
import { featureFlags } from '@/lib/feature-flags';

export function PersonalizedRecommendationsToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreference();
  }, []);

  async function loadPreference() {
    try {
      const response = await window.fetch('/api/user/recommendations-preference');
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Failed to load recommendations preference:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (!featureFlags.recommendations) return;
    
    const newValue = !enabled;
    setSaving(true);
    
    try {
      const response = await window.fetch('/api/user/recommendations-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue }),
      });
      
      if (response.ok) {
        setEnabled(newValue);
      } else {
        throw new Error('Failed to save preference');
      }
    } catch (error) {
      console.error('Failed to save recommendations preference:', error);
      // Revert on error
      setEnabled(enabled);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !featureFlags.recommendations) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor="recommendations-toggle" className="font-medium text-foreground">
          Personalisierte Empfehlungen aktivieren
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Basierend auf deinen Bewertungen, Lesezeichen, Follows und Leseverlauf.
        </p>
      </div>
      <Switch
        id="recommendations-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={saving}
        aria-label="Personalisierte Empfehlungen aktivieren"
      />
    </div>
  );
}