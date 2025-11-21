import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Exercise, TrainingSession } from '@/types/training';

const EXERCISES_KEY = '@life_manager_exercises';
const SESSIONS_KEY = '@life_manager_training_sessions';

// Exercise operations
export async function loadExercises(): Promise<Exercise[]> {
  try {
    const data = await AsyncStorage.getItem(EXERCISES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load exercises:', error);
    return [];
  }
}

export async function saveExercises(exercises: Exercise[]): Promise<void> {
  try {
    await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  } catch (error) {
    console.error('Failed to save exercises:', error);
    throw error;
  }
}

export async function addExercise(exercise: Exercise): Promise<void> {
  const exercises = await loadExercises();
  exercises.push(exercise);
  await saveExercises(exercises);
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  const exercises = await loadExercises();
  const filtered = exercises.filter((e) => e.id !== exerciseId);
  await saveExercises(filtered);

  // Also delete all sessions for this exercise
  const sessions = await loadSessions();
  const filteredSessions = sessions.filter((s) => s.exerciseId !== exerciseId);
  await saveSessions(filteredSessions);
}

// Session operations
export async function loadSessions(): Promise<TrainingSession[]> {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
}

export async function saveSessions(sessions: TrainingSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
    throw error;
  }
}

export async function addSession(session: TrainingSession): Promise<void> {
  const sessions = await loadSessions();
  sessions.push(session);
  await saveSessions(sessions);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await loadSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  await saveSessions(filtered);
}

export async function getSessionsByExercise(exerciseId: string): Promise<TrainingSession[]> {
  const sessions = await loadSessions();
  return sessions
    .filter((s) => s.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
