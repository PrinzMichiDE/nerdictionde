/**
 * Hardware Profile Form Component
 * Used in /einstellungen/hardware for managing user hardware profile
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useUpdateHardwareProfile, useDeleteHardwareProfile, useHardwareProfile } from '@/hooks/useHardwareProfile';
import { getAllCpuNames, getAllGpuNames } from '@/lib/hardware-db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AutocompleteProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
}

function Autocomplete({ label, name, value, onChange, options, placeholder, required, disabled }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);

  useEffect(() => {
    const filtered = options
      .filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 10);
    setFilteredOptions(filtered);
    setHighlightedIndex(-1);
  }, [value, options]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          onChange(filteredOptions[highlightedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <Label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={name}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={isOpen ? `${name}-listbox` : undefined}
          aria-expanded={isOpen}
          aria-activedescendant={highlightedIndex >= 0 ? `${name}-option-${highlightedIndex}` : undefined}
        />
        {isOpen && filteredOptions.length > 0 && (
          <ul
            ref={listRef}
            id={`${name}-listbox`}
            role="listbox"
            className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
          >
            {filteredOptions.map((opt, idx) => (
              <li
                key={opt}
                id={`${name}-option-${idx}`}
                role="option"
                aria-selected={idx === highlightedIndex}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3 py-2 cursor-pointer rounded text-sm ${idx === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
              >
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function HardwareProfileForm() {
  const { data: profileData, isLoading } = useHardwareProfile();
  const updateProfile = useUpdateHardwareProfile();
  const deleteProfile = useDeleteHardwareProfile();

  interface FormData {
    cpu: string;
    gpu: string;
    ram: string;
    monitor: string;
    psu: string;
    resolution: string;
    refreshRate: string;
    enabled: boolean;
  }

  const [formData, setFormData] = useState<FormData>({
    cpu: '',
    gpu: '',
    ram: '',
    monitor: '',
    psu: '',
    resolution: '',
    refreshRate: '',
    enabled: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profileData?.profile) {
      setFormData(prev => ({
        ...prev,
        cpu: profileData.profile?.cpu || '',
        gpu: profileData.profile?.gpu || '',
        ram: profileData.profile?.ram || '',
        monitor: profileData.profile?.monitor || '',
        psu: profileData.profile?.psu || '',
        resolution: profileData.profile?.resolution || '',
        refreshRate: profileData.profile?.refreshRate?.toString() || '',
        enabled: profileData.enabled,
      }));
    }
  }, [profileData]);

  const cpuOptions = getAllCpuNames();
  const gpuOptions = getAllGpuNames();

  const handleChange = useCallback((field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateProfile.mutateAsync({
        cpu: formData.cpu,
        gpu: formData.gpu,
        ram: formData.ram,
        monitor: formData.monitor || undefined,
        psu: formData.psu || undefined,
        resolution: formData.resolution || undefined,
        refreshRate: formData.refreshRate ? parseInt(formData.refreshRate, 10) : undefined,
        enabled: formData.enabled,
      });
    } catch {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProfile.mutateAsync();
      setShowDeleteConfirm(false);
      setFormData({
        cpu: '', gpu: '', ram: '', monitor: '', psu: '', resolution: '', refreshRate: '', enabled: false,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const requiredFieldsFilled = formData.cpu.trim() && formData.gpu.trim() && formData.ram.trim();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20">
        <CardContent className="flex gap-3 p-4">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            Hinterlege deine PC-Specs, um auf Hardware-Reviews automatisch Kompatibilitäts-Checks und FPS-Schätzungen zu sehen.
            Deine Daten werden nur lokal für den Abgleich verwendet und nicht an Dritte weitergegeben.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pflichtangaben</CardTitle>
          <CardDescription>Diese Felder sind f\u00fcr den Kompatibilit\u00e4ts-Check erforderlich.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Autocomplete
            label="Prozessor (CPU)"
            name="cpu"
            value={formData.cpu}
            onChange={(v) => handleChange('cpu', v)}
            options={cpuOptions}
            placeholder="z. B. Intel Core i5-12400"
            required
            disabled={updateProfile.isPending}
          />
          <Autocomplete
            label="Grafikkarte (GPU)"
            name="gpu"
            value={formData.gpu}
            onChange={(v) => handleChange('gpu', v)}
            options={gpuOptions}
            placeholder="z. B. NVIDIA GeForce RTX 3070"
            required
            disabled={updateProfile.isPending}
          />
          <div className="md:col-span-2">
            <Label htmlFor="ram" className="mb-1.5 block text-sm font-medium">
              Arbeitsspeicher (RAM) <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="ram"
              name="ram"
              value={formData.ram}
              onChange={(e) => handleChange('ram', e.target.value)}
              placeholder="z. B. 32GB DDR5-6000"
              required
              disabled={updateProfile.isPending}
              aria-describedby="ram-help"
            />
            <p id="ram-help" className="mt-1 text-xs text-muted-foreground">
              Format: \u201e32GB DDR4-3200\u201c oder \u201e16GB DDR5-5600\u201c
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zusatzinformationen (optional)</CardTitle>
          <CardDescription>Helfen bei pr\u00e4ziseren FPS-Sch\u00e4tzungen und Netzteil-Pr\u00fcfung.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input
            id="monitor"
            name="monitor"
            value={formData.monitor}
            onChange={(e) => handleChange('monitor', e.target.value)}
            placeholder='z. B. 27" 1440p 144Hz'
            disabled={updateProfile.isPending}
          />
          <Input
            id="psu"
            name="psu"
            value={formData.psu}
            onChange={(e) => handleChange('psu', e.target.value)}
            placeholder="z. B. 750W 80+ Gold"
            disabled={updateProfile.isPending}
          />
          <Input
            id="resolution"
            name="resolution"
            value={formData.resolution}
            onChange={(e) => handleChange('resolution', e.target.value)}
            placeholder="z. B. 1440p"
            list="resolutions"
            disabled={updateProfile.isPending}
          />
          <datalist id="resolutions">
            <option value="1080p" />
            <option value="1440p" />
            <option value="4K" />
            <option value="2160p" />
          </datalist>
          <Input
            id="refreshRate"
            name="refreshRate"
            type="number"
            value={formData.refreshRate}
            onChange={(e) => handleChange('refreshRate', e.target.value)}
            placeholder="z. B. 144"
            min="60"
            max="500"
            disabled={updateProfile.isPending}
          />
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled" className="font-medium text-base">
                Hardware-Kompatibilit\u00e4ts-Checks aktivieren
              </Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Zeigt Badges und FPS-Sch\u00e4tzungen auf Hardware-Reviews basierend auf deinem Profil.
              </p>
            </div>
            <Switch
              id="enabled"
              checked={!!(formData.enabled && requiredFieldsFilled)}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
              disabled={!requiredFieldsFilled || updateProfile.isPending}
              aria-describedby="enabled-help"
            />
          </div>
          <p id="enabled-help" className="mt-2 text-xs text-muted-foreground">
            {requiredFieldsFilled
              ? 'Toggle aktiviert die Anzeige auf Hardware-Reviews.'
              : 'F\u00fclle zuerst CPU, GPU und RAM aus, um die Checks zu aktivieren.'}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={updateProfile.isPending || !requiredFieldsFilled}
          className="gap-2"
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Profil speichern
            </>
          )}
        </Button>

        {profileData?.profile && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteProfile.isPending}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Profil l\u00f6schen
            </Button>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <Card className="border-destructive bg-destructive/10 dark:border-destructive/30 dark:bg-destructive/10" role="alertdialog">
          <CardContent className="flex gap-3 p-4">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <p className="font-medium">Hardware-Profil wirklich löschen?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Alle gespeicherten Specs werden entfernt und Kompatibilitäts-Checks deaktiviert.
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteProfile.isPending}>
                  {deleteProfile.isPending ? 'Lösche...' : 'Ja, löschen'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profileData?.profile && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Aktuelles Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 md:grid-cols-2 text-sm">
              <div><dt className="font-medium text-muted-foreground">CPU</dt><dd>{formData.cpu}</dd></div>
              <div><dt className="font-medium text-muted-foreground">GPU</dt><dd>{formData.gpu}</dd></div>
              <div><dt className="font-medium text-muted-foreground">RAM</dt><dd>{formData.ram}</dd></div>
              {formData.monitor && <div><dt className="font-medium text-muted-foreground">Monitor</dt><dd>{formData.monitor}</dd></div>}
              {formData.psu && <div><dt className="font-medium text-muted-foreground">Netzteil</dt><dd>{formData.psu}</dd></div>}
              {formData.resolution && <div><dt className="font-medium text-muted-foreground">Ziel-Aufl\u00f6sung</dt><dd>{formData.resolution}</dd></div>}
              {formData.refreshRate && <div><dt className="font-medium text-muted-foreground">Refresh Rate</dt><dd>{formData.refreshRate} Hz</dd></div>}
              <div><dt className="font-medium text-muted-foreground">Checks aktiv</dt><dd>{formData.enabled ? 'Ja' : 'Nein'}</dd></div>
              <div><dt className="font-medium text-muted-foreground">Version</dt><dd>{profileData.version}</dd></div>
            </dl>
          </CardContent>
        </Card>
      )}
    </form>
  );
}