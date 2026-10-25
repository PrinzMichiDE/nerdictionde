/**
 * Client Hooks for Hardware Profile Management
 * Uses TanStack Query for server state management
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HardwareProfileInput } from '@/types/hardware';
import { HardwareProfileUpdate, HardwareProfileResponse } from '@/lib/hardware-compatibility-schema';
import { toast } from 'sonner';

const API_BASE = '/api/user/hardware-profile';

// ============================================================================
// Query Keys
// ============================================================================

export const hardwareProfileKeys = {
  all: ['hardwareProfile'] as const,
  current: () => [...hardwareProfileKeys.all, 'current'] as const,
};

// ============================================================================
// Fetch Hardware Profile
// ============================================================================

export function useHardwareProfile() {
  return useQuery({
    queryKey: hardwareProfileKeys.current(),
    queryFn: async (): Promise<HardwareProfileResponse> => {
      const res = await fetch(API_BASE, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Nicht authentifiziert');
        throw new Error('Fehler beim Laden des Hardware-Profils');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// ============================================================================
// Update Hardware Profile (Create/Update)
// ============================================================================

export function useUpdateHardwareProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HardwareProfileInput | HardwareProfileUpdate): Promise<HardwareProfileResponse> => {
      const res = await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Fehler beim Speichern');
      }
      return result;
    },
    onMutate: async (newData: HardwareProfileInput | HardwareProfileUpdate) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: hardwareProfileKeys.current() });
      const previous = queryClient.getQueryData<HardwareProfileResponse>(hardwareProfileKeys.current());
      
      queryClient.setQueryData<HardwareProfileResponse>(hardwareProfileKeys.current(), (old: HardwareProfileResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          profile: { ...old.profile, ...newData } as HardwareProfileResponse['profile'],
          enabled: (newData.enabled ?? old.enabled) as boolean,
          version: old.version + 1,
        };
      });
      
      return { previous };
    },
    onError: (err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(hardwareProfileKeys.current(), context.previous);
      }
      toast.error('Fehler beim Speichern', { description: err.message });
    },
    onSuccess: () => {
      toast.success('Hardware-Profil gespeichert');
      // Invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: hardwareProfileKeys.current() });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: hardwareProfileKeys.current() });
    },
  });
}

// ============================================================================
// Delete Hardware Profile
// ============================================================================

export function useDeleteHardwareProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string }> => {
      const res = await fetch(API_BASE, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Fehler beim Löschen');
      return result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: hardwareProfileKeys.current() });
      const previous = queryClient.getQueryData<HardwareProfileResponse>(hardwareProfileKeys.current());
      queryClient.setQueryData<HardwareProfileResponse>(hardwareProfileKeys.current(), (old: HardwareProfileResponse | undefined) => ({
        ...old!,
        profile: null,
        enabled: false,
        version: (old?.version ?? 0) + 1,
      }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(hardwareProfileKeys.current(), context.previous);
      }
      toast.error('Fehler beim Löschen', { description: err.message });
    },
    onSuccess: () => {
      toast.success('Hardware-Profil gelöscht');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: hardwareProfileKeys.current() });
    },
  });
}

// ============================================================================
// Compatibility Check Hook (for use on review pages if needed client-side)
// ============================================================================

import { CompatibilityResult } from '@/types/hardware';

interface UseCompatibilityOptions {
  slug: string;
  enabled?: boolean;
}

export function useHardwareCompatibility({ slug, enabled = true }: UseCompatibilityOptions) {
  return useQuery({
    queryKey: ['compatibility', slug],
    queryFn: async (): Promise<CompatibilityResult> => {
      const res = await fetch(`/api/reviews/${slug}/compatibility`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Kompatibilitäts-Check');
      if (!data.success || !data.data) throw new Error('Ungültige Antwort');
      return data.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}