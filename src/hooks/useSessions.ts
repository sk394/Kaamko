import { useState, useEffect, useCallback } from 'react';
import { loadStoredSessions } from '../utils/storage';
import { SessionObject } from '../types';

interface UseSessionsReturn {
    sessions: SessionObject[];
    loading: boolean;
    error: string | null;
    refreshSessions: () => Promise<void>;
    totalHours: number;
    sessionCount: number;
}

/**
 * Custom hook for managing stored sessions
 * Provides sessions data with loading states and utility functions
 * 
 * @param autoLoad - Whether to automatically load sessions on mount (default: true)
 * @returns Object containing sessions data and utility functions
 */
export const useSessions = (autoLoad: boolean = true): UseSessionsReturn => {
    const [sessions, setSessions] = useState<SessionObject[]>([]);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load sessions from storage
     */
    const loadSessions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const storedSessions = await loadStoredSessions();
            setSessions(storedSessions);
        } catch (err) {
            console.error('Failed to load sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Refresh sessions (useful when you know sessions have been updated)
     */
    const refreshSessions = useCallback(async () => {
        await loadSessions();
    }, [loadSessions]);

    // Auto-load sessions on mount if enabled
    useEffect(() => {
        if (autoLoad) {
            loadSessions();
        }
    }, [autoLoad, loadSessions]);

    // Calculate total hours worked
    const totalHours = sessions.reduce((total, session) => total + session.hours, 0);

    // Get session count
    const sessionCount = sessions.length;

    return {
        sessions,
        loading,
        error,
        refreshSessions,
        totalHours,
        sessionCount,
    };
};

/**
 * Hook for getting sessions with filtering capabilities
 * 
 * @param filterFn - Optional filter function to apply to sessions
 * @param autoLoad - Whether to automatically load sessions on mount
 * @returns Filtered sessions data
 */
export const useFilteredSessions = (
    filterFn?: (session: SessionObject) => boolean,
    autoLoad: boolean = true
): UseSessionsReturn => {
    const { sessions: allSessions, loading, error, refreshSessions } = useSessions(autoLoad);

    const filteredSessions = filterFn ? allSessions.filter(filterFn) : allSessions;
    const totalHours = filteredSessions.reduce((total, session) => total + session.hours, 0);

    return {
        sessions: filteredSessions,
        loading,
        error,
        refreshSessions,
        totalHours,
        sessionCount: filteredSessions.length,
    };
};

/**
 * Hook for getting recent sessions (last N sessions)
 * 
 * @param count - Number of recent sessions to return
 * @param autoLoad - Whether to automatically load sessions on mount
 * @returns Recent sessions data
 */
export const useRecentSessions = (
    count: number = 10,
    autoLoad: boolean = true
): UseSessionsReturn => {
    const { sessions: allSessions, loading, error, refreshSessions } = useSessions(autoLoad);

    const recentSessions = allSessions.slice(0, count);
    const totalHours = recentSessions.reduce((total, session) => total + session.hours, 0);

    return {
        sessions: recentSessions,
        loading,
        error,
        refreshSessions,
        totalHours,
        sessionCount: recentSessions.length,
    };
};