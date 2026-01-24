import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TRAVEL: 'last_visit_travel',
  SCHEDULE: 'last_visit_schedule',
};

export function useBadgeTracker() {
  const [lastVisitTravel, setLastVisitTravel] = useState<Date | null>(null);
  const [lastVisitSchedule, setLastVisitSchedule] = useState<Date | null>(null);

  // Load initial state
  useEffect(() => {
    loadTimestamps();
  }, []);

  const loadTimestamps = async () => {
    try {
      const travel = await AsyncStorage.getItem(KEYS.TRAVEL);
      const schedule = await AsyncStorage.getItem(KEYS.SCHEDULE);
      
      if (travel) setLastVisitTravel(new Date(travel));
      else {
          // If never visited, set to now to avoid showing ALL past items as new
          const now = new Date();
          await AsyncStorage.setItem(KEYS.TRAVEL, now.toISOString());
          setLastVisitTravel(now);
      }

      if (schedule) setLastVisitSchedule(new Date(schedule));
      else {
          const now = new Date();
          await AsyncStorage.setItem(KEYS.SCHEDULE, now.toISOString());
          setLastVisitSchedule(now);
      }
    } catch (e) {
      console.error("Error loading badge timestamps", e);
    }
  };

  const markTravelVisited = async () => {
    const now = new Date();
    setLastVisitTravel(now);
    await AsyncStorage.setItem(KEYS.TRAVEL, now.toISOString());
  };

  const markScheduleVisited = async () => {
    const now = new Date();
    setLastVisitSchedule(now);
    await AsyncStorage.setItem(KEYS.SCHEDULE, now.toISOString());
  };

  const hasNewTravel = useCallback((tickets: any[]) => {
    if (!lastVisitTravel || !tickets) return false;
    return tickets.some(t => new Date(t.created_at) > lastVisitTravel);
  }, [lastVisitTravel]);

  const hasNewSchedule = useCallback((items: any[]) => {
    if (!lastVisitSchedule || !items) return false;
    return items.some(i => new Date(i.created_at) > lastVisitSchedule);
  }, [lastVisitSchedule]);

  return {
    hasNewTravel,
    hasNewSchedule,
    markTravelVisited,
    markScheduleVisited
  };
}
