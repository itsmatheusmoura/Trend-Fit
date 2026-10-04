import { useState, useEffect, useCallback } from 'react';
import { getAllFromStore, putInStore, deleteFromStore, clearStore } from '../services/db';
import { WeightLog, WorkoutLog, UserProfile, GitHubSettings, ExerciseTemplate, TrendFitSnapshot, WeightContextTag } from '../types';

const MOCK_PROFILE: UserProfile = { id: 'profile_default', targetWeightKg: 75.0, unit: 'kg' };

const DEFAULT_EXERCISES: ExerciseTemplate[] = [
  { id: 'ex_1', name: 'Agachamento Livre / Leg Press', category: 'strength', defaultRestSeconds: 60, notes: 'Foco na cadência e profundidade' },
  { id: 'ex_2', name: 'Esteira Sprints (HIIT)', category: 'cardio', defaultRestSeconds: 45, notes: 'Intervalos de 1 min tiro x 1 min descanso' },
  { id: 'ex_3', name: 'Supino Reto / Halteres', category: 'strength', defaultRestSeconds: 60, notes: 'Peitoral e tríceps' },
  { id: 'ex_4', name: 'Puxada Alta / Remada Curvada', category: 'strength', defaultRestSeconds: 60, notes: 'Dorsal e bíceps' },
  { id: 'ex_5', name: 'Prancha / Abdominal Infra', category: 'bodyweight', defaultRestSeconds: 30, notes: 'Fortalecimento de core' }
];

export interface AddWeightLogParams {
  weightKg: number | string;
  timestamp?: string;
  tag?: WeightContextTag;
  notes?: string;
}

export function useDatabase() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [exerciseList, setExerciseList] = useState<ExerciseTemplate[]>([]);
  const [profile, setProfile] = useState<UserProfile>(MOCK_PROFILE);
  const [githubSettings, setGithubSettings] = useState<GitHubSettings>({
    id: 'gh_config',
    owner: '',
    repo: '',
    path: 'data.json',
    token: ''
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial state from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [weights, wrkouts, prof, setts, exes] = await Promise.all([
        getAllFromStore<WeightLog>('weightLogs'),
        getAllFromStore<WorkoutLog>('workouts'),
        getAllFromStore<UserProfile>('profile'),
        getAllFromStore<GitHubSettings>('settings'),
        getAllFromStore<ExerciseTemplate>('exercises')
      ]);

      setWeightLogs(weights.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setWorkouts(wrkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      if (prof.length > 0) setProfile(prof[0]);
      if (setts.length > 0) setGithubSettings(setts[0]);

      if (exes.length === 0) {
        for (const item of DEFAULT_EXERCISES) {
          await putInStore('exercises', item);
        }
        setExerciseList(DEFAULT_EXERCISES);
      } else {
        setExerciseList(exes);
      }
    } catch (err) {
      console.error('Failed to load IndexedDB data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Weight Log CRUD
  const addWeightLog = async ({ weightKg, timestamp, tag = 'Normal', notes = '' }: AddWeightLogParams): Promise<WeightLog> => {
    const numericWeight = typeof weightKg === 'number' ? weightKg : parseFloat(weightKg);
    if (isNaN(numericWeight) || numericWeight <= 0 || numericWeight > 500) {
      throw new Error('Valor de peso inválido.');
    }

    const logDate = timestamp ? new Date(timestamp) : new Date();
    const newLog: WeightLog = {
      id: `w_${Date.now()}`,
      timestamp: logDate.toISOString(),
      weightKg: Math.round(numericWeight * 100) / 100,
      tag: tag || 'Normal',
      notes: notes.trim()
    };

    await putInStore('weightLogs', newLog);
    await refreshData();
    return newLog;
  };

  const removeWeightLog = async (id: string): Promise<void> => {
    await deleteFromStore('weightLogs', id);
    await refreshData();
  };

  // Workout Log CRUD
  const saveWorkout = async (workoutData: Partial<WorkoutLog>): Promise<WorkoutLog> => {
    const workout: WorkoutLog = {
      id: workoutData.id || `wk_${Date.now()}`,
      date: workoutData.date || new Date().toISOString().split('T')[0],
      startTime: workoutData.startTime || new Date().toISOString(),
      endTime: workoutData.endTime || new Date().toISOString(),
      type: workoutData.type || 'Conditioning & Strength',
      totalDurationSeconds: workoutData.totalDurationSeconds || 0,
      exercises: workoutData.exercises || [],
      overallRpe: workoutData.overallRpe || 7,
      notes: workoutData.notes || ''
    };

    await putInStore('workouts', workout);
    await refreshData();
    return workout;
  };

  const removeWorkout = async (id: string): Promise<void> => {
    await deleteFromStore('workouts', id);
    await refreshData();
  };

  // Exercise Templates CRUD
  const saveExercise = async (exData: Partial<ExerciseTemplate>): Promise<ExerciseTemplate> => {
    if (!exData.name || !exData.name.trim()) {
      throw new Error('O nome do exercício é obrigatório.');
    }
    const item: ExerciseTemplate = {
      id: exData.id || `ex_${Date.now()}`,
      name: exData.name.trim(),
      category: exData.category || 'strength',
      defaultRestSeconds: exData.defaultRestSeconds ? Number(exData.defaultRestSeconds) : 60,
      notes: (exData.notes || '').trim()
    };
    await putInStore('exercises', item);
    await refreshData();
    return item;
  };

  const removeExercise = async (id: string): Promise<void> => {
    await deleteFromStore('exercises', id);
    await refreshData();
  };

  // Profile update
  const updateProfile = async (newProfile: Partial<UserProfile>): Promise<void> => {
    const updated: UserProfile = { ...profile, ...newProfile, id: 'profile_default' };
    await putInStore('profile', updated);
    setProfile(updated);
  };

  // Settings update
  const updateGithubSettings = async (newSettings: Partial<GitHubSettings>): Promise<void> => {
    const updated: GitHubSettings = { ...githubSettings, ...newSettings, id: 'gh_config' };
    await putInStore('settings', updated);
    setGithubSettings(updated);
  };

  // Full Export/Import Snapshot JSON
  const getSnapshotJSON = useCallback((): TrendFitSnapshot => {
    return {
      $schema: "https://trendfit.app/schema/v1.json",
      version: 1,
      lastUpdated: new Date().toISOString(),
      profile: {
        targetWeightKg: profile.targetWeightKg,
        unit: profile.unit || 'kg'
      },
      weightLogs,
      workouts,
      exercises: exerciseList
    };
  }, [profile, weightLogs, workouts, exerciseList]);

  const importSnapshotJSON = async (jsonContent: string | TrendFitSnapshot, mode: 'merge' | 'replace' = 'merge'): Promise<void> => {
    let data: TrendFitSnapshot;
    try {
      data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch {
      throw new Error('Formato JSON inválido.');
    }

    if (mode === 'replace') {
      await clearStore('weightLogs');
      await clearStore('workouts');
      await clearStore('exercises');
    }

    if (data.profile) {
      await updateProfile(data.profile);
    }

    if (Array.isArray(data.weightLogs)) {
      for (const w of data.weightLogs) {
        if (w.weightKg && w.id) {
          await putInStore('weightLogs', w);
        }
      }
    }

    if (Array.isArray(data.workouts)) {
      for (const wk of data.workouts) {
        if (wk.id) {
          await putInStore('workouts', wk);
        }
      }
    }

    if (Array.isArray(data.exercises)) {
      for (const ex of data.exercises) {
        if (ex.id && ex.name) {
          await putInStore('exercises', ex);
        }
      }
    }

    await refreshData();
  };

  // Seed sample mock data for demonstration
  const seedMockData = async (): Promise<void> => {
    const today = new Date();
    const mockWeights: WeightLog[] = [];
    const mockWorkouts: WorkoutLog[] = [];

    let baseWeight = 84.5;
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const fluctuation = (Math.random() - 0.52) * 0.4;
      baseWeight = Math.max(78, Math.min(86, baseWeight + fluctuation));

      const tags: WeightContextTag[] = ['Jejum', 'Normal', 'Pós-treino'];
      const tag = tags[i % 3];

      mockWeights.push({
        id: `w_seed_${30 - i}`,
        timestamp: date.toISOString(),
        weightKg: Math.round(baseWeight * 10) / 10,
        tag,
        notes: i === 0 ? 'Pesagem matinal' : ''
      });

      if (i % 2 === 0) {
        const dateStr = date.toISOString().split('T')[0];
        mockWorkouts.push({
          id: `wk_seed_${30 - i}`,
          date: dateStr,
          startTime: `${dateStr}T08:00:00Z`,
          endTime: `${dateStr}T08:45:00Z`,
          type: i % 4 === 0 ? 'HIIT Cardio' : 'Circuito & Força',
          totalDurationSeconds: 2700,
          overallRpe: 7 + (i % 3),
          exercises: [
            {
              name: i % 4 === 0 ? 'Esteira Sprints' : 'Agachamento + Supino',
              category: i % 4 === 0 ? 'cardio' : 'strength',
              sets: [
                { set: 1, effort: 'optimal', restSeconds: 45 },
                { set: 2, effort: 'limit', restSeconds: 60 }
              ]
            }
          ],
          notes: 'Treino produtivo em ritmo bom.'
        });
      }
    }

    await clearStore('weightLogs');
    await clearStore('workouts');

    for (const w of mockWeights) await putInStore('weightLogs', w);
    for (const wk of mockWorkouts) await putInStore('workouts', wk);
    await updateProfile({ targetWeightKg: 76.0, unit: 'kg' });
    await refreshData();
  };

  return {
    weightLogs,
    workouts,
    exerciseList,
    profile,
    githubSettings,
    loading,
    addWeightLog,
    removeWeightLog,
    saveWorkout,
    removeWorkout,
    saveExercise,
    removeExercise,
    updateProfile,
    updateGithubSettings,
    getSnapshotJSON,
    importSnapshotJSON,
    seedMockData,
    refreshData
  };
}
