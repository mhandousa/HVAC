import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'design-workflow-zone-context';

interface ZoneContextStorage {
  projectId: string | null;
  buildingId: string | null;
  floorId: string | null;
  zoneId: string | null;
  updatedAt: number;
}

export interface ZoneContextOptions {
  buildingId?: string | null;
  floorId?: string | null;
  replace?: boolean;
}

/**
 * Hook to manage zone context across design tools.
 * Persists selected project/building/floor/zone via URL params (primary) and localStorage (fallback).
 * 
 * Usage:
 * const { projectId, buildingId, floorId, zoneId, setContext, clearContext, buildUrl } = useZoneContext();
 */
export function useZoneContext() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Read from URL params first, fallback to localStorage
  const urlProjectId = searchParams.get('project');
  const urlBuildingId = searchParams.get('building');
  const urlFloorId = searchParams.get('floor');
  const urlZoneId = searchParams.get('zone');
  
  // Get stored context from localStorage
  const storedContext = useMemo((): ZoneContextStorage | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ZoneContextStorage;
        // Only use if less than 24 hours old
        if (Date.now() - parsed.updatedAt < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);
  
  // Final values: URL params take precedence, then localStorage
  const projectId = urlProjectId || storedContext?.projectId || null;
  const buildingId = urlBuildingId || storedContext?.buildingId || null;
  const floorId = urlFloorId || storedContext?.floorId || null;
  const zoneId = urlZoneId || storedContext?.zoneId || null;
  
  // Persist to localStorage whenever context changes via URL
  useEffect(() => {
    if (urlProjectId || urlBuildingId || urlFloorId || urlZoneId) {
      const context: ZoneContextStorage = {
        projectId: urlProjectId,
        buildingId: urlBuildingId,
        floorId: urlFloorId,
        zoneId: urlZoneId,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    }
  }, [urlProjectId, urlBuildingId, urlFloorId, urlZoneId]);
  
  // Auto-populate URL from localStorage if missing
  useEffect(() => {
    if (!urlProjectId && !urlBuildingId && !urlFloorId && !urlZoneId && storedContext) {
      const newParams = new URLSearchParams(searchParams);
      let hasChanges = false;
      
      if (storedContext.projectId) {
        newParams.set('project', storedContext.projectId);
        hasChanges = true;
      }
      if (storedContext.buildingId) {
        newParams.set('building', storedContext.buildingId);
        hasChanges = true;
      }
      if (storedContext.floorId) {
        newParams.set('floor', storedContext.floorId);
        hasChanges = true;
      }
      if (storedContext.zoneId) {
        newParams.set('zone', storedContext.zoneId);
        hasChanges = true;
      }
      
      if (hasChanges) {
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [urlProjectId, urlBuildingId, urlFloorId, urlZoneId, storedContext, searchParams, setSearchParams]);
  
  // Set context and update URL
  const setContext = useCallback((
    newProjectId: string | null, 
    newZoneId: string | null,
    options?: ZoneContextOptions
  ) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (newProjectId) {
      newParams.set('project', newProjectId);
    } else {
      newParams.delete('project');
    }
    
    if (options?.buildingId) {
      newParams.set('building', options.buildingId);
    } else if (options?.buildingId === null) {
      newParams.delete('building');
    }
    
    if (options?.floorId) {
      newParams.set('floor', options.floorId);
    } else if (options?.floorId === null) {
      newParams.delete('floor');
    }
    
    if (newZoneId) {
      newParams.set('zone', newZoneId);
    } else {
      newParams.delete('zone');
    }
    
    // Update localStorage
    const context: ZoneContextStorage = {
      projectId: newProjectId,
      buildingId: options?.buildingId ?? storedContext?.buildingId ?? null,
      floorId: options?.floorId ?? storedContext?.floorId ?? null,
      zoneId: newZoneId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    
    // Update URL
    setSearchParams(newParams, { replace: options?.replace ?? true });
  }, [searchParams, setSearchParams, storedContext]);
  
  // Set full context with all hierarchy levels
  const setFullContext = useCallback((
    newProjectId: string | null,
    newBuildingId: string | null,
    newFloorId: string | null,
    newZoneId: string | null,
    options?: { replace?: boolean }
  ) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (newProjectId) {
      newParams.set('project', newProjectId);
    } else {
      newParams.delete('project');
    }
    
    if (newBuildingId) {
      newParams.set('building', newBuildingId);
    } else {
      newParams.delete('building');
    }
    
    if (newFloorId) {
      newParams.set('floor', newFloorId);
    } else {
      newParams.delete('floor');
    }
    
    if (newZoneId) {
      newParams.set('zone', newZoneId);
    } else {
      newParams.delete('zone');
    }
    
    // Update localStorage
    const context: ZoneContextStorage = {
      projectId: newProjectId,
      buildingId: newBuildingId,
      floorId: newFloorId,
      zoneId: newZoneId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    
    // Update URL
    setSearchParams(newParams, { replace: options?.replace ?? true });
  }, [searchParams, setSearchParams]);
  
  // Clear context entirely
  const clearContext = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('project');
    newParams.delete('building');
    newParams.delete('floor');
    newParams.delete('zone');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  // Build URL with context params
  const buildUrl = useCallback((
    path: string, 
    overrides?: { 
      projectId?: string | null; 
      buildingId?: string | null;
      floorId?: string | null;
      zoneId?: string | null;
    }
  ) => {
    const params = new URLSearchParams();
    
    const finalProjectId = overrides?.projectId !== undefined ? overrides.projectId : projectId;
    const finalBuildingId = overrides?.buildingId !== undefined ? overrides.buildingId : buildingId;
    const finalFloorId = overrides?.floorId !== undefined ? overrides.floorId : floorId;
    const finalZoneId = overrides?.zoneId !== undefined ? overrides.zoneId : zoneId;
    
    if (finalProjectId) params.set('project', finalProjectId);
    if (finalBuildingId) params.set('building', finalBuildingId);
    if (finalFloorId) params.set('floor', finalFloorId);
    if (finalZoneId) params.set('zone', finalZoneId);
    
    return params.toString() ? `${path}?${params.toString()}` : path;
  }, [projectId, buildingId, floorId, zoneId]);
  
  // Navigate with context
  const navigateWithContext = useCallback((
    path: string, 
    overrides?: { 
      projectId?: string | null; 
      buildingId?: string | null;
      floorId?: string | null;
      zoneId?: string | null;
    }
  ) => {
    navigate(buildUrl(path, overrides));
  }, [navigate, buildUrl]);
  
  return {
    projectId,
    buildingId,
    floorId,
    zoneId,
    setContext,
    setFullContext,
    clearContext,
    buildUrl,
    navigateWithContext,
    hasContext: !!(projectId || zoneId),
    hasFullContext: !!(projectId && buildingId && floorId && zoneId),
  };
}

/**
 * Simplified hook for reading zone context without modification
 */
export function useZoneContextReadOnly() {
  const [searchParams] = useSearchParams();
  
  const urlProjectId = searchParams.get('project');
  const urlBuildingId = searchParams.get('building');
  const urlFloorId = searchParams.get('floor');
  const urlZoneId = searchParams.get('zone');
  
  // Fallback to localStorage
  const stored = useMemo(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as ZoneContextStorage;
        if (Date.now() - parsed.updatedAt < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }, []);
  
  return {
    projectId: urlProjectId || stored?.projectId || null,
    buildingId: urlBuildingId || stored?.buildingId || null,
    floorId: urlFloorId || stored?.floorId || null,
    zoneId: urlZoneId || stored?.zoneId || null,
  };
}
