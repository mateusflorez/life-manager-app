import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Exercise, TrainingSession, ExerciseWithStats, SessionWithExercise, TrainingSet } from '@/types/training';
import { generateId, calculateVolume, calculateSessionVolume, getTodayKey, getWeekStart } from '@/types/training';
import {
  loadExercises,
  saveExercises,
  loadSessions,
  saveSessions,
} from '@/services/training-storage';

type TrainingContextType = {
  exercises: Exercise[];
  sessions: TrainingSession[];
  exercisesWithStats: ExerciseWithStats[];
  recentSessions: SessionWithExercise[];
  todaySessions: number;
  weekSessions: number;
  weekVolume: number;
  totalSessions: number;
  totalVolume: number;
  isLoading: boolean;
  createExercise: (name: string) => Promise<Exercise>;
  updateExercise: (exerciseId: string, name: string) => Promise<void>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  logSession: (exerciseId: string, load: number, reps: number, date: string, notes?: string, sets?: TrainingSet[]) => Promise<TrainingSession>;
  updateSession: (sessionId: string, load: number, reps: number, date: string, notes?: string, sets?: TrainingSet[]) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  getExerciseById: (exerciseId: string) => ExerciseWithStats | undefined;
  getSessionsByDate: () => Record<string, number>;
  refresh: () => Promise<void>;
};

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedExercises, loadedSessions] = await Promise.all([
        loadExercises(),
        loadSessions(),
      ]);
      setExercises(loadedExercises);
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Failed to load training data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exercisesWithStats: ExerciseWithStats[] = exercises.map((exercise) => {
    const exerciseSessions = sessions
      .filter((s) => s.exerciseId === exercise.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalVolume = exerciseSessions.reduce(
      (sum, s) => sum + calculateSessionVolume(s),
      0
    );
    return {
      ...exercise,
      totalSessions: exerciseSessions.length,
      totalVolume,
      sessions: exerciseSessions,
    };
  });

  const recentSessions: SessionWithExercise[] = sessions
    .map((session) => {
      const exercise = exercises.find((e) => e.id === session.exerciseId);
      return {
        ...session,
        exerciseName: exercise?.name ?? 'Unknown',
        volume: calculateSessionVolume(session),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const todayKey = getTodayKey();
  const weekStart = getWeekStart();

  const todaySessions = sessions.filter((s) => s.date === todayKey).length;

  const weekSessions = sessions.filter((s) => s.date >= weekStart).length;

  const weekVolume = sessions
    .filter((s) => s.date >= weekStart)
    .reduce((sum, s) => sum + calculateSessionVolume(s), 0);

  const totalSessions = sessions.length;

  const totalVolume = sessions.reduce(
    (sum, s) => sum + calculateSessionVolume(s),
    0
  );

  const createExercise = async (name: string): Promise<Exercise> => {
    const trimmedName = name.trim();
    const exists = exercises.some(
      (e) => e.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      throw new Error('Exercise already exists');
    }

    const newExercise: Exercise = {
      id: generateId(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    const updatedExercises = [...exercises, newExercise];
    await saveExercises(updatedExercises);
    setExercises(updatedExercises);
    return newExercise;
  };

  const updateExercise = async (exerciseId: string, name: string): Promise<void> => {
    const trimmedName = name.trim();
    const exists = exercises.some(
      (e) => e.id !== exerciseId && e.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      throw new Error('Exercise already exists');
    }

    const updatedExercises = exercises.map((e) =>
      e.id === exerciseId ? { ...e, name: trimmedName } : e
    );
    await saveExercises(updatedExercises);
    setExercises(updatedExercises);
  };

  const deleteExerciseHandler = async (exerciseId: string): Promise<void> => {
    const updatedExercises = exercises.filter((e) => e.id !== exerciseId);
    const updatedSessions = sessions.filter((s) => s.exerciseId !== exerciseId);

    await Promise.all([
      saveExercises(updatedExercises),
      saveSessions(updatedSessions),
    ]);

    setExercises(updatedExercises);
    setSessions(updatedSessions);
  };

  const logSession = async (
    exerciseId: string,
    load: number,
    reps: number,
    date: string,
    notes?: string,
    sets?: TrainingSet[]
  ): Promise<TrainingSession> => {
    const newSession: TrainingSession = {
      id: generateId(),
      exerciseId,
      date,
      load,
      reps,
      sets: sets && sets.length > 0 ? sets : undefined,
      notes: notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedSessions = [...sessions, newSession];
    await saveSessions(updatedSessions);
    setSessions(updatedSessions);
    return newSession;
  };

  const updateSession = async (
    sessionId: string,
    load: number,
    reps: number,
    date: string,
    notes?: string,
    sets?: TrainingSet[]
  ): Promise<void> => {
    const updatedSessions = sessions.map((s) =>
      s.id === sessionId
        ? { ...s, load, reps, date, notes: notes?.trim() || undefined, sets: sets && sets.length > 0 ? sets : undefined }
        : s
    );
    await saveSessions(updatedSessions);
    setSessions(updatedSessions);
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    await saveSessions(updatedSessions);
    setSessions(updatedSessions);
  };

  const getExerciseById = (exerciseId: string): ExerciseWithStats | undefined => {
    return exercisesWithStats.find((e) => e.id === exerciseId);
  };

  const getSessionsByDate = (): Record<string, number> => {
    return sessions.reduce(
      (acc, session) => {
        acc[session.date] = (acc[session.date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  };

  const refresh = async (): Promise<void> => {
    await loadData();
  };

  return (
    <TrainingContext.Provider
      value={{
        exercises,
        sessions,
        exercisesWithStats,
        recentSessions,
        todaySessions,
        weekSessions,
        weekVolume,
        totalSessions,
        totalVolume,
        isLoading,
        createExercise,
        updateExercise,
        deleteExercise: deleteExerciseHandler,
        logSession,
        updateSession,
        deleteSession,
        getExerciseById,
        getSessionsByDate,
        refresh,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}
