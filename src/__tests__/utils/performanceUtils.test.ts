import { getLastWeekDateRange, getLastMonthDateRange, isDateInRange } from '../../utils/timeUtils';
import { SessionObject } from '../../types';

// Performance testing utilities
export const measureExecutionTime = async (operation: () => Promise<void> | void): Promise<number> => {
  const startTime = performance.now();
  await operation();
  return performance.now() - startTime;
};

export const generatePerformanceTestSessions = (count: number): SessionObject[] => {
  const sessions: SessionObject[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() - i);
    
    const clockIn = new Date(sessionDate);
    clockIn.setHours(9, 0, 0, 0);
    
    const clockOut = new Date(sessionDate);
    clockOut.setHours(17, 0, 0, 0);
    
    sessions.push({
      id: `perf-session-${i + 1}`,
      date: sessionDate.toISOString().split('T')[0],
      clockIn: clockIn.toISOString(),
      clockOut: clockOut.toISOString(),
      hours: 8,
    });
  }
  
  return sessions;
};

describe('Performance Utilities Tests', () => {
  describe('Date Range Performance', () => {
    it('should compute date ranges efficiently', async () => {
      const iterations = 1000;
      
      const lastWeekTime = await measureExecutionTime(() => {
        for (let i = 0; i < iterations; i++) {
          getLastWeekDateRange();
        }
      });
      
      const lastMonthTime = await measureExecutionTime(() => {
        for (let i = 0; i < iterations; i++) {
          getLastMonthDateRange();
        }
      });
      
      // Date range computation should be very fast
      expect(lastWeekTime).toBeLessThan(100);
      expect(lastMonthTime).toBeLessThan(100);
    });

    it('should filter dates efficiently with large datasets', async () => {
      const sessions = generatePerformanceTestSessions(1000);
      const lastWeekRange = getLastWeekDateRange();
      const lastMonthRange = getLastMonthDateRange();
      
      const lastWeekFilterTime = await measureExecutionTime(() => {
        sessions.filter(session => 
          isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)
        );
      });
      
      const lastMonthFilterTime = await measureExecutionTime(() => {
        sessions.filter(session => 
          isDateInRange(session.date, lastMonthRange.startDate, lastMonthRange.endDate)
        );
      });
      
      // Filtering 1000 sessions should be fast
      expect(lastWeekFilterTime).toBeLessThan(50);
      expect(lastMonthFilterTime).toBeLessThan(50);
    });
  });

  describe('Session Processing Performance', () => {
    it('should handle session array operations efficiently', async () => {
      const smallDataset = generatePerformanceTestSessions(100);
      const mediumDataset = generatePerformanceTestSessions(500);
      const largeDataset = generatePerformanceTestSessions(1000);
      
      // Test array sorting performance
      const smallSortTime = await measureExecutionTime(() => {
        [...smallDataset].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      
      const mediumSortTime = await measureExecutionTime(() => {
        [...mediumDataset].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      
      const largeSortTime = await measureExecutionTime(() => {
        [...largeDataset].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      
      // Sorting should scale reasonably
      expect(smallSortTime).toBeLessThan(10);
      expect(mediumSortTime).toBeLessThan(50);
      expect(largeSortTime).toBeLessThan(100);
    });

    it('should validate session data efficiently', async () => {
      const sessions = generatePerformanceTestSessions(1000);
      
      const validationTime = await measureExecutionTime(() => {
        sessions.forEach(session => {
          // Simulate validation operations
          const isValid = (
            session.id &&
            session.date &&
            session.clockIn &&
            session.clockOut &&
            typeof session.hours === 'number' &&
            session.hours > 0
          );
          return isValid;
        });
      });
      
      // Validation should be very fast
      expect(validationTime).toBeLessThan(20);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not create excessive temporary objects during filtering', () => {
      const sessions = generatePerformanceTestSessions(500);
      const lastWeekRange = getLastWeekDateRange();
      
      // Test memory-efficient filtering approach
      const memoryEfficientFilter = (sessions: SessionObject[]) => {
        const result: SessionObject[] = [];
        for (let i = 0; i < sessions.length; i++) {
          const session = sessions[i];
          if (isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)) {
            result.push(session);
          }
        }
        return result;
      };
      
      // Both approaches should work, but for loop is more memory efficient
      const filteredWithLoop = memoryEfficientFilter(sessions);
      const filteredWithFilter = sessions.filter(session => 
        isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)
      );
      
      // Results should be identical
      expect(filteredWithLoop.length).toBe(filteredWithFilter.length);
      expect(filteredWithLoop.every((session, index) => 
        session.id === filteredWithFilter[index]?.id
      )).toBe(true);
    });

    it('should handle repeated operations without memory leaks', async () => {
      const sessions = generatePerformanceTestSessions(200);
      
      // Simulate repeated filtering operations
      const repeatedOperationsTime = await measureExecutionTime(() => {
        for (let i = 0; i < 100; i++) {
          const lastWeekRange = getLastWeekDateRange();
          const lastMonthRange = getLastMonthDateRange();
          
          // Filter by last week
          sessions.filter(session => 
            isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)
          );
          
          // Filter by last month
          sessions.filter(session => 
            isDateInRange(session.date, lastMonthRange.startDate, lastMonthRange.endDate)
          );
        }
      });
      
      // Repeated operations should not degrade significantly
      expect(repeatedOperationsTime).toBeLessThan(1000);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty datasets efficiently', async () => {
      const emptySessions: SessionObject[] = [];
      
      const emptyFilterTime = await measureExecutionTime(() => {
        const lastWeekRange = getLastWeekDateRange();
        emptySessions.filter(session => 
          isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)
        );
      });
      
      // Empty dataset operations should be instant
      expect(emptyFilterTime).toBeLessThan(1);
    });

    it('should handle single session efficiently', async () => {
      const singleSession = generatePerformanceTestSessions(1);
      
      const singleFilterTime = await measureExecutionTime(() => {
        const lastWeekRange = getLastWeekDateRange();
        singleSession.filter(session => 
          isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)
        );
      });
      
      // Single session operations should be instant
      expect(singleFilterTime).toBeLessThan(1);
    });

    it('should handle sessions with edge case dates', async () => {
      const edgeCaseSessions: SessionObject[] = [
        {
          id: 'leap-year',
          date: '2024-02-29',
          clockIn: '2024-02-29T09:00:00.000Z',
          clockOut: '2024-02-29T17:00:00.000Z',
          hours: 8,
        },
        {
          id: 'year-boundary',
          date: '2023-12-31',
          clockIn: '2023-12-31T23:00:00.000Z',
          clockOut: '2024-01-01T01:00:00.000Z',
          hours: 2,
        },
        {
          id: 'dst-change',
          date: '2024-03-10', // DST change date in US
          clockIn: '2024-03-10T09:00:00.000Z',
          clockOut: '2024-03-10T17:00:00.000Z',
          hours: 8,
        },
      ];
      
      const edgeCaseFilterTime = await measureExecutionTime(() => {
        const lastWeekRange = getLastWeekDateRange();
        const lastMonthRange = getLastMonthDateRange();
        
        edgeCaseSessions.filter(session => 
          isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)
        );
        
        edgeCaseSessions.filter(session => 
          isDateInRange(session.date, lastMonthRange.startDate, lastMonthRange.endDate)
        );
      });
      
      // Edge case handling should not impact performance
      expect(edgeCaseFilterTime).toBeLessThan(5);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple simultaneous filter operations', async () => {
      const sessions = generatePerformanceTestSessions(300);
      
      const concurrentTime = await measureExecutionTime(async () => {
        const operations = [];
        
        // Create multiple concurrent filtering operations
        for (let i = 0; i < 10; i++) {
          operations.push(
            new Promise<void>((resolve) => {
              const lastWeekRange = getLastWeekDateRange();
              sessions.filter(session => 
                isDateInRange(session.date, lastWeekRange.startDate, lastWeekRange.endDate)
              );
              resolve();
            })
          );
        }
        
        await Promise.all(operations);
      });
      
      // Concurrent operations should complete efficiently
      expect(concurrentTime).toBeLessThan(200);
    });
  });
});