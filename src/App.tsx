import React, { useState } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { useMovingAverage } from './hooks/useMovingAverage';
import { useTimer } from './hooks/useTimer';
import { useGitHubSync } from './hooks/useGitHubSync';

import Header from './components/Header';
import Navigation, { NavigationTab } from './components/Navigation';
import WeightQuickEntry from './components/WeightQuickEntry';
import InteractiveChart from './components/InteractiveChart';
import WeightHistoryList from './components/WeightHistoryList';
import WorkoutExecution from './components/WorkoutExecution';
import WorkoutPlanner from './components/WorkoutPlanner';
import WorkoutHistoryList from './components/WorkoutHistoryList';
import DataSyncPanel from './components/DataSyncPanel';
import ExerciseManager from './components/ExerciseManager';
import { WorkoutExercise, WorkoutLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('today');
  const [isLiveWorkout, setIsLiveWorkout] = useState<boolean>(false);
  const [liveWorkoutExercises, setLiveWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [showExerciseManager, setShowExerciseManager] = useState<boolean>(false);

  // Custom Hooks & Services
  const db = useDatabase();
  const processedWeightLogs = useMovingAverage(db.weightLogs, 7);
  const timer = useTimer(60);
  const gitHubSync = useGitHubSync(db.githubSettings, db.getSnapshotJSON, db.importSnapshotJSON);

  const lastWeightVal = processedWeightLogs.length > 0
    ? processedWeightLogs[0].weightKg
    : 75.0;

  const handleStartLiveWorkout = (options?: { preset?: { id: string; title: string }; exercises?: WorkoutExercise[] }) => {
    if (options && options.exercises && options.exercises.length > 0) {
      setLiveWorkoutExercises(options.exercises);
    } else {
      setLiveWorkoutExercises([]);
    }
    setIsLiveWorkout(true);
  };

  const handleFinishLiveWorkout = async (workoutData: Partial<WorkoutLog>) => {
    await db.saveWorkout(workoutData);
    setIsLiveWorkout(false);
    timer.resetTimer();
    if (gitHubSync.isConfigured) {
      gitHubSync.syncPush();
    }
  };

  const handleWeightSave = async (weightData: { weightKg: number; timestamp: string; tag: 'Jejum' | 'Pós-treino' | 'Normal'; notes?: string }) => {
    const newLog = await db.addWeightLog(weightData);
    if (gitHubSync.isConfigured) {
      gitHubSync.syncPush();
    }
    return newLog;
  };

  if (db.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-bold text-slate-600">Carregando dados do TrendFit...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      <Header
        profile={db.profile}
        updateProfile={db.updateProfile}
        onQuickSync={gitHubSync.isConfigured ? gitHubSync.syncPush : null}
        syncing={gitHubSync.syncing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation tabs for Mobile & Desktop */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Exercise Manager Modal View */}
        {showExerciseManager && (
          <div className="mb-6">
            <ExerciseManager
              exercises={db.exerciseList}
              onSave={db.saveExercise}
              onDelete={db.removeExercise}
              onClose={() => setShowExerciseManager(false)}
            />
          </div>
        )}

        {/* 
          TABLET / LANDSCAPE DUAL COLUMN LAYOUT (lg:grid lg:grid-cols-12 lg:gap-6)
          Column Left: 5 cols (~40%) -> Quick Weight Entry, Active Workout Timer, Recent Logs
          Column Right: 7 cols (~60%) -> Expanded EMA-7 Chart, Stats, History
        */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start">
          {/* Left Column (40%) */}
          <div className="lg:col-span-5 space-y-6">
            <WeightQuickEntry
              lastWeight={lastWeightVal}
              onSave={handleWeightSave}
            />

            {isLiveWorkout ? (
              <WorkoutExecution
                timer={timer}
                initialExercises={liveWorkoutExercises}
                availableExercises={db.exerciseList}
                onFinishWorkout={handleFinishLiveWorkout}
                onCancel={() => setIsLiveWorkout(false)}
              />
            ) : (
              <WorkoutPlanner
                exerciseList={db.exerciseList}
                onStartLiveWorkout={handleStartLiveWorkout}
                onOpenExerciseManager={() => setShowExerciseManager((prev) => !prev)}
              />
            )}

            <WeightHistoryList
              logs={processedWeightLogs.slice(0, 5)}
              onDelete={db.removeWeightLog}
            />
          </div>

          {/* Right Column (60%) */}
          <div className="lg:col-span-7 space-y-6">
            <InteractiveChart
              processedLogs={processedWeightLogs}
              workouts={db.workouts}
              profile={db.profile}
            />

            <WorkoutHistoryList
              workouts={db.workouts}
              onDelete={db.removeWorkout}
            />

            <DataSyncPanel
              getSnapshotJSON={db.getSnapshotJSON}
              importSnapshotJSON={db.importSnapshotJSON}
              githubSettings={db.githubSettings}
              updateGithubSettings={db.updateGithubSettings}
              gitHubSync={gitHubSync}
              seedMockData={db.seedMockData}
              profile={db.profile}
              updateProfile={db.updateProfile}
            />
          </div>
        </div>

        {/* 
          MOBILE PORTRAIT TABBED LAYOUT (lg:hidden)
          Switches between 3 views: today, trend, data
        */}
        <div className="lg:hidden space-y-6">
          {activeTab === 'today' && (
            <>
              {isLiveWorkout ? (
                <WorkoutExecution
                  timer={timer}
                  initialExercises={liveWorkoutExercises}
                  availableExercises={db.exerciseList}
                  onFinishWorkout={handleFinishLiveWorkout}
                  onCancel={() => setIsLiveWorkout(false)}
                />
              ) : (
                <WorkoutPlanner
                  exerciseList={db.exerciseList}
                  onStartLiveWorkout={handleStartLiveWorkout}
                  onOpenExerciseManager={() => setShowExerciseManager((prev) => !prev)}
                />
              )}

              <WeightQuickEntry
                lastWeight={lastWeightVal}
                onSave={handleWeightSave}
              />

              <WorkoutHistoryList
                workouts={db.workouts}
                onDelete={db.removeWorkout}
              />
            </>
          )}

          {activeTab === 'trend' && (
            <>
              <InteractiveChart
                processedLogs={processedWeightLogs}
                workouts={db.workouts}
                profile={db.profile}
              />

              <WeightHistoryList
                logs={processedWeightLogs}
                onDelete={db.removeWeightLog}
              />
            </>
          )}

          {activeTab === 'data' && (
            <DataSyncPanel
              getSnapshotJSON={db.getSnapshotJSON}
              importSnapshotJSON={db.importSnapshotJSON}
              githubSettings={db.githubSettings}
              updateGithubSettings={db.updateGithubSettings}
              gitHubSync={gitHubSync}
              seedMockData={db.seedMockData}
              profile={db.profile}
              updateProfile={db.updateProfile}
            />
          )}
        </div>
      </main>
    </div>
  );
}
