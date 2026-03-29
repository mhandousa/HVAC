import { useMemo, useCallback } from 'react';
import { DuctSegmentResult } from './useDuctSizingMethods';

export interface PressurePath {
  pathId: string;
  segments: DuctSegmentResult[];
  totalPressurePa: number;
  totalPressureInWg: number;
  isCritical: boolean;
}

export interface BranchBalance {
  segmentId: string;
  segmentName: string;
  pathPressurePa: number;
  requiredDamperDropPa: number;
  damperSetting: string; // 'none' | '25%' | '50%' | '75%'
}

export interface PressureAnalysis {
  criticalPath: PressurePath;
  allPaths: PressurePath[];
  branchBalancing: BranchBalance[];
  fanRequirements: {
    totalAirflowCfm: number;
    totalAirflowM3s: number;
    staticPressurePa: number;
    staticPressureInWg: number;
    recommendedFanPressurePa: number; // With safety factor
    recommendedFanPressureInWg: number;
  };
  systemEfficiency: number; // 0-100%
}

export function usePressureAnalysis() {
  /**
   * Build tree structure from segments
   */
  const buildSegmentTree = useCallback((segments: DuctSegmentResult[]): Map<string | null, DuctSegmentResult[]> => {
    const tree = new Map<string | null, DuctSegmentResult[]>();
    
    for (const segment of segments) {
      const parentId = segment.parentSegmentId || null;
      if (!tree.has(parentId)) {
        tree.set(parentId, []);
      }
      tree.get(parentId)!.push(segment);
    }
    
    return tree;
  }, []);

  /**
   * Find all paths from root to terminal segments
   */
  const findAllPaths = useCallback((segments: DuctSegmentResult[]): PressurePath[] => {
    const tree = buildSegmentTree(segments);
    const paths: PressurePath[] = [];
    
    function traverse(
      currentPath: DuctSegmentResult[],
      currentPressure: number,
      segmentId: string | null
    ) {
      const children = tree.get(segmentId) || [];
      
      if (children.length === 0 && currentPath.length > 0) {
        // Terminal node - complete path
        paths.push({
          pathId: `path-${paths.length + 1}`,
          segments: [...currentPath],
          totalPressurePa: currentPressure,
          totalPressureInWg: Math.round(currentPressure / 249.089 * 1000) / 1000,
          isCritical: false,
        });
        return;
      }
      
      for (const child of children) {
        traverse(
          [...currentPath, child],
          currentPressure + child.totalPressureLossPa,
          child.id
        );
      }
    }
    
    // Start traversal from root segments (no parent)
    const rootSegments = tree.get(null) || [];
    for (const root of rootSegments) {
      traverse([root], root.totalPressureLossPa, root.id);
    }
    
    // If no tree structure, treat all segments as one path
    if (paths.length === 0 && segments.length > 0) {
      const totalPressure = segments.reduce((sum, s) => sum + s.totalPressureLossPa, 0);
      paths.push({
        pathId: 'path-1',
        segments: [...segments],
        totalPressurePa: totalPressure,
        totalPressureInWg: Math.round(totalPressure / 249.089 * 1000) / 1000,
        isCritical: true,
      });
    }
    
    return paths;
  }, [buildSegmentTree]);

  /**
   * Analyze pressure losses and find critical path
   */
  const analyzeSystem = useCallback((segments: DuctSegmentResult[]): PressureAnalysis => {
    const paths = findAllPaths(segments);
    
    // Find critical path (highest pressure)
    let criticalPath = paths[0];
    for (const path of paths) {
      if (path.totalPressurePa > criticalPath.totalPressurePa) {
        criticalPath = path;
      }
    }
    
    if (criticalPath) {
      criticalPath.isCritical = true;
    }
    
    // Calculate branch balancing
    const branchBalancing: BranchBalance[] = paths
      .filter(path => !path.isCritical)
      .map(path => {
        const lastSegment = path.segments[path.segments.length - 1];
        const requiredDrop = criticalPath.totalPressurePa - path.totalPressurePa;
        
        let damperSetting = 'none';
        if (requiredDrop > 100) damperSetting = '75%';
        else if (requiredDrop > 50) damperSetting = '50%';
        else if (requiredDrop > 20) damperSetting = '25%';
        
        return {
          segmentId: lastSegment.id,
          segmentName: lastSegment.segmentName,
          pathPressurePa: path.totalPressurePa,
          requiredDamperDropPa: Math.round(requiredDrop * 100) / 100,
          damperSetting,
        };
      });
    
    // Calculate fan requirements
    const totalAirflow = Math.max(...segments.map(s => s.airflowCfm));
    const safetyFactor = 1.15; // 15% safety margin
    
    const fanRequirements = {
      totalAirflowCfm: totalAirflow,
      totalAirflowM3s: totalAirflow * 0.000471947,
      staticPressurePa: criticalPath?.totalPressurePa || 0,
      staticPressureInWg: criticalPath?.totalPressureInWg || 0,
      recommendedFanPressurePa: Math.round((criticalPath?.totalPressurePa || 0) * safetyFactor),
      recommendedFanPressureInWg: Math.round((criticalPath?.totalPressureInWg || 0) * safetyFactor * 1000) / 1000,
    };
    
    // Calculate system efficiency (ratio of critical path to sum of all paths)
    const avgPathPressure = paths.reduce((sum, p) => sum + p.totalPressurePa, 0) / paths.length;
    const efficiency = criticalPath 
      ? Math.round((avgPathPressure / criticalPath.totalPressurePa) * 100) 
      : 100;
    
    return {
      criticalPath: criticalPath || {
        pathId: 'none',
        segments: [],
        totalPressurePa: 0,
        totalPressureInWg: 0,
        isCritical: false,
      },
      allPaths: paths,
      branchBalancing,
      fanRequirements,
      systemEfficiency: efficiency,
    };
  }, [findAllPaths]);

  /**
   * Mark critical path segments
   */
  const markCriticalPath = useCallback((
    segments: DuctSegmentResult[],
    analysis: PressureAnalysis
  ): DuctSegmentResult[] => {
    const criticalIds = new Set(analysis.criticalPath.segments.map(s => s.id));
    
    return segments.map(segment => ({
      ...segment,
      // We could add an isCriticalPath flag here if needed
    }));
  }, []);

  return {
    analyzeSystem,
    findAllPaths,
    markCriticalPath,
  };
}
