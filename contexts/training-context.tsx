import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Exercise, TrainingSession, ExerciseWithStats, SessionWithExercise, TrainingSet, WorkoutRoutine, WorkoutRoutineWithExercises } from '@/types/training';
import { generateId, calculateSessionVolume, getTodayKey, getWeekStart } from '@/types/training';
import {
  loadExercises,
  saveExercises,
  loadSessions,
  saveSessions,
  loadRoutines,
  saveRoutines,
} from '@/services/training-storage';

type TrainingContextType = {
  exercises: Exercise[];
  sessions: TrainingSession[];
  routines: WorkoutRoutine[];
  exercisesWithStats: ExerciseWithStats[];
  routinesWithExercises: WorkoutRoutineWithExercises[];
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
  // Routine methods
  createRoutine: (name: string, exerciseIds: string[]) => Promise<WorkoutRoutine>;
  updateRoutine: (routineId: string, name: string, exerciseIds: string[]) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
  getRoutineById: (routineId: string) => WorkoutRoutineWithExercises | undefined;
  logRoutine: (routineId: string, exerciseSets: Record<string, TrainingSet[]>, date: string, notes?: string) => Promise<TrainingSession[]>;
  refresh: () => Promise<void>;
};

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedExercises, loadedSessions, loadedRoutines] = await Promise.all([
        loadExercises(),
        loadSessions(),
        loadRoutines(),
      ]);
      setExercises(loadedExercises);
      setSessions(loadedSessions);
      setRoutines(loadedRoutines);
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

  const routinesWithExercises: WorkoutRoutineWithExercises[] = routines.map((routine) => {
    const routineExercises = routine.exerciseIds
      .map((id) => exercises.find((e) => e.id === id))
      .filter((e): e is Exercise => e !== undefined);

    // Count how many times this routine was used (sessions logged on same day for all exercises)
    const sessionDates = sessions
      .filter((s) => routine.exerciseIds.includes(s.exerciseId))
      .map((s) => s.date);
    const dateCounts = sessionDates.reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const timesUsed = Object.values(dateCounts).filter(
      (count) => count >= routine.exerciseIds.length
    ).length;

    return {
      ...routine,
      exercises: routineExercises,
      timesUsed,
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

  // Routine methods
  const createRoutine = async (name: string, exerciseIds: string[]): Promise<WorkoutRoutine> => {
    const trimmedName = name.trim();
    const exists = routines.some(
      (r) => r.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      throw new Error('Routine already exists');
    }

    const newRoutine: WorkoutRoutine = {
      id: generateId(),
      name: trimmedName,
      exerciseIds,
      createdAt: new Date().toISOString(),
    };

    const updatedRoutines = [...routines, newRoutine];
    await saveRoutines(updatedRoutines);
    setRoutines(updatedRoutines);
    return newRoutine;
  };

  const updateRoutineHandler = async (routineId: string, name: string, exerciseIds: string[]): Promise<void> => {
    const trimmedName = name.trim();
    const exists = routines.some(
      (r) => r.id !== routineId && r.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      throw new Error('Routine already exists');
    }

    const updatedRoutines = routines.map((r) =>
      r.id === routineId ? { ...r, name: trimmedName, exerciseIds } : r
    );
    await saveRoutines(updatedRoutines);
    setRoutines(updatedRoutines);
  };

  const deleteRoutineHandler = async (routineId: string): Promise<void> => {
    const updatedRoutines = routines.filter((r) => r.id !== routineId);
    await saveRoutines(updatedRoutines);
    setRoutines(updatedRoutines);
  };

  const getRoutineById = (routineId: string): WorkoutRoutineWithExercises | undefined => {
    return routinesWithExercises.find((r) => r.id === routineId);
  };

  const logRoutine = async (
    routineId: string,
    exerciseSets: Record<string, TrainingSet[]>,
    date: string,
    notes?: string
  ): Promise<TrainingSession[]> => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    const newSessions: TrainingSession[] = [];
    const exerciseIds = Object.keys(exerciseSets);

    for (const exerciseId of exerciseIds) {
      const sets = exerciseSets[exerciseId];
      if (sets && sets.length > 0) {
        const newSession: TrainingSession = {
          id: generateId(),
          exerciseId,
          date,
          load: sets[0].load,
          reps: sets[0].reps,
          sets,
          notes: notes?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        newSessions.push(newSession);
      }
    }

    const updatedSessions = [...sessions, ...newSessions];
    await saveSessions(updatedSessions);
    setSessions(updatedSessions);
    return newSessions;
  };

  const refresh = async (): Promise<void> => {
    await loadData();
  };

  return (
    <TrainingContext.Provider
      value={{
        exercises,
        sessions,
        routines,
        exercisesWithStats,
        routinesWithExercises,
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
        createRoutine,
        updateRoutine: updateRoutineHandler,
        deleteRoutine: deleteRoutineHandler,
        getRoutineById,
        logRoutine,
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
