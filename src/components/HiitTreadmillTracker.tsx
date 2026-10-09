import React, { useState, useEffect, useRef } from 'react';
import { Zap, Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, CheckCircle, Flame, Clock, Activity, Check, Calendar, ThumbsUp, Frown, AlertTriangle, Trash2, LineChart } from 'lucide-react';
import { WorkoutLog, HiitCompliance, HiitFeeling } from '../types';
import { getLocalDateTimeString } from '../utils/dateUtils';
import HiitProgressChart from './HiitProgressChart';

export interface HiitTreadmillTrackerProps {
  workouts?: WorkoutLog[];
  onSaveWorkout: (workout: Partial<WorkoutLog>) => Promise<WorkoutLog>;
  onDeleteWorkout?: (id: string) => Promise<void>;
  onClose?: () => void;
}

type IntensityPreset = 'light' | 'moderate' | 'high' | 'custom';
type PhaseType = 'warmup' | 'work' | 'rest' | 'cooldown' | 'finished';
type ViewSubTab = 'tracker' | 'chart' | 'history';

interface HiitConfig {
  preset: IntensityPreset;
  workSeconds: number;
  restSeconds: number;
  totalTimeMinutes: number;
  includeWarmup: boolean;
  warmupSeconds: number;
  walkSpeed: string;
  runSpeed: string;
}

export default function HiitTreadmillTracker({ workouts = [], onSaveWorkout, onDeleteWorkout, onClose }: HiitTreadmillTrackerProps) {
  // Sub tab: 'tracker' | 'chart' | 'history'
  const [subTab, setSubTab] = useState<ViewSubTab>('tracker');

  // Config state
  const [config, setConfig] = useState<HiitConfig>({
    preset: 'moderate',
    workSeconds: 45,
    restSeconds: 45,
    totalTimeMinutes: 15,
    includeWarmup: true,
    warmupSeconds: 60,
    walkSpeed: '5.5',
    runSpeed: '11.0'
  });

  // Date and Time (timestamp for retroactive logging without timezone offset)
  const [timestamp, setTimestamp] = useState<string>(() => getLocalDateTimeString());

  // Mode: 'setup' | 'active' | 'summary'
  const [mode, setMode] = useState<'setup' | 'active' | 'summary'>('setup');

  // Execution timer state
  const [phase, setPhase] = useState<PhaseType>('warmup');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(60);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);
  const [totalTargetSeconds, setTotalTargetSeconds] = useState<number>(900);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Post-workout Feedback State
  const [overallRpe, setOverallRpe] = useState<number>(8);
  const [feeling, setFeeling] = useState<HiitFeeling>('good');
  const [compliance, setCompliance] = useState<HiitCompliance>('full');
  const [actualRunSpeed, setActualRunSpeed] = useState<string>('11.0');
  const [actualWalkSpeed, setActualWalkSpeed] = useState<string>('5.5');
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync actual speeds with config speeds initially
  useEffect(() => {
    setActualRunSpeed(config.runSpeed);
    setActualWalkSpeed(config.walkSpeed);
  }, [config.runSpeed, config.walkSpeed]);

  // Play Audio Beeps
  const playSound = (freq: number, duration: number = 0.15, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  // Preset Handler
  const handleSelectPreset = (p: IntensityPreset) => {
    if (p === 'light') {
      setConfig((prev) => ({ ...prev, preset: p, workSeconds: 30, restSeconds: 60 }));
    } else if (p === 'moderate') {
      setConfig((prev) => ({ ...prev, preset: p, workSeconds: 45, restSeconds: 45 }));
    } else if (p === 'high') {
      setConfig((prev) => ({ ...prev, preset: p, workSeconds: 60, restSeconds: 30 }));
    } else {
      setConfig((prev) => ({ ...prev, preset: p }));
    }
  };

  // Calculate workout schedule summary
  const roundCycleSeconds = config.workSeconds + config.restSeconds;
  const netTimeSeconds = config.totalTimeMinutes * 60 - (config.includeWarmup ? config.warmupSeconds : 0);
  const calculatedRounds = Math.max(1, Math.floor(netTimeSeconds / roundCycleSeconds));
  const totalWorkSeconds = calculatedRounds * config.workSeconds;
  const totalRestSeconds = calculatedRounds * config.restSeconds;

  // Start HIIT session
  const handleStartWorkout = () => {
    const totalSecs = config.totalTimeMinutes * 60;
    setTotalTargetSeconds(totalSecs);
    setCurrentRound(1);
    setTotalSecondsElapsed(0);
    setIsSaved(false);

    if (config.includeWarmup) {
      setPhase('warmup');
      setPhaseSecondsLeft(config.warmupSeconds);
    } else {
      setPhase('work');
      setPhaseSecondsLeft(config.workSeconds);
    }

    setMode('active');
    setIsRunning(true);
  };

  // Main Timer Effect
  useEffect(() => {
    if (!isRunning || mode !== 'active') return;

    const interval = setInterval(() => {
      setTotalSecondsElapsed((prev) => prev + 1);

      setPhaseSecondsLeft((prev) => {
        // Warning sound at 3s, 2s, 1s
        if (prev === 4 || prev === 3 || prev === 2) {
          playSound(520, 0.1, 'sine');
        }

        if (prev <= 1) {
          // PHASE TRANSITION LOGIC
          if (phase === 'warmup') {
            playSound(880, 0.35, 'triangle');
            setPhase('work');
            setCurrentRound(1);
            return config.workSeconds;
          } else if (phase === 'work') {
            playSound(440, 0.3, 'sine');
            setPhase('rest');
            return config.restSeconds;
          } else if (phase === 'rest') {
            if (currentRound >= calculatedRounds) {
              playSound(987, 0.5, 'triangle');
              setPhase('finished');
              setIsRunning(false);
              setMode('summary');
              return 0;
            } else {
              playSound(880, 0.35, 'triangle');
              setCurrentRound((r) => r + 1);
              setPhase('work');
              return config.workSeconds;
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, phase, currentRound, calculatedRounds, config]);

  // Skip Phase
  const handleSkipPhase = () => {
    if (phase === 'warmup') {
      playSound(880, 0.3, 'triangle');
      setPhase('work');
      setPhaseSecondsLeft(config.workSeconds);
    } else if (phase === 'work') {
      playSound(440, 0.3, 'sine');
      setPhase('rest');
      setPhaseSecondsLeft(config.restSeconds);
    } else if (phase === 'rest') {
      if (currentRound >= calculatedRounds) {
        setPhase('finished');
        setIsRunning(false);
        setMode('summary');
      } else {
        playSound(880, 0.3, 'triangle');
        setCurrentRound((r) => r + 1);
        setPhase('work');
        setPhaseSecondsLeft(config.workSeconds);
      }
    }
  };

  // Finish Early & Go to Summary
  const handleFinishEarly = () => {
    setIsRunning(false);
    setMode('summary');
  };

  // Save Workout to DB
  const handleSaveToHistory = async () => {
    const workoutDate = timestamp.split('T')[0];
    const startTimeIso = new Date(timestamp).toISOString();

    const numericRunSpeed = parseFloat(actualRunSpeed) || 10.0;
    const numericWalkSpeed = parseFloat(actualWalkSpeed) || 5.5;

    await onSaveWorkout({
      date: workoutDate,
      startTime: startTimeIso,
      endTime: new Date().toISOString(),
      type: 'Esteira (HIIT)',
      totalDurationSeconds: totalSecondsElapsed || config.totalTimeMinutes * 60,
      overallRpe,
      feeling,
      compliance,
      runSpeed: numericRunSpeed,
      walkSpeed: numericWalkSpeed,
      exercises: [
        {
          name: `Esteira HIIT (${config.totalTimeMinutes} min)`,
          category: 'cardio',
          sets: [
            {
              set: 1,
              workSeconds: totalWorkSeconds,
              restSeconds: totalRestSeconds,
              intensity: config.preset
            }
          ]
        }
      ],
      notes: workoutNotes || `HIIT Esteira: ${currentRound}/${calculatedRounds} rounds (${config.workSeconds}s Tiro / ${config.restSeconds}s Cam.) - Tiro: ${numericRunSpeed} km/h`
    });
    setIsSaved(true);
  };

  // Format Helper MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Current Phase Duration for percentage bar
  const currentPhaseMax =
    phase === 'warmup'
      ? config.warmupSeconds
      : phase === 'work'
      ? config.workSeconds
      : config.restSeconds;

  const phaseProgress = Math.min(100, Math.max(0, ((currentPhaseMax - phaseSecondsLeft) / currentPhaseMax) * 100));

  // Filter HIIT workouts for history view
  const hiitWorkoutList = workouts.filter(
    (w) =>
      w.type?.toLowerCase().includes('esteira') ||
      w.type?.toLowerCase().includes('hiit') ||
      (w.exercises && w.exercises.some((e) => e.name.toLowerCase().includes('esteira')))
  );

  return (
    <div className="space-y-4">
      {/* Sub Tab Navigation Bar */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-soft-xs space-x-1">
        <button
          onClick={() => setSubTab('tracker')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'tracker'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Cronômetro & Treino</span>
        </button>

        <button
          onClick={() => setSubTab('chart')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'chart'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Gráfico & Evolução</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'history'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico ({hiitWorkoutList.length})</span>
        </button>
      </div>

      {/* SUB TAB 2: CHART VIEW */}
      {subTab === 'chart' && (
        <HiitProgressChart workouts={workouts} />
      )}

      {/* SUB TAB 3: HISTORY LIST VIEW */}
      {subTab === 'history' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Histórico de Treinos de Esteira ({hiitWorkoutList.length})
            </h3>
          </div>

          {hiitWorkoutList.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Nenhum treino de esteira gravado ainda.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {hiitWorkoutList.map((wk) => {
                const dateParts = wk.date ? wk.date.split('-') : [];
                const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : wk.date;
                const durationMin = Math.round((wk.totalDurationSeconds || 900) / 60);

                return (
                  <div
                    key={wk.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-extrabold text-slate-900">{wk.type || 'Esteira (HIIT)'}</span>
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                            {durationMin} min
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Data: <strong className="text-slate-700">{dateFormatted}</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {wk.compliance && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            wk.compliance === 'full'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : wk.compliance === 'partial'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {wk.compliance === 'full' ? '100% Seguido' : wk.compliance === 'partial' ? 'Parcial' : 'Dificuldade'}
                          </span>
                        )}

                        {onDeleteWorkout && (
                          <button
                            onClick={() => onDeleteWorkout(wk.id)}
                            title="Excluir treino"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
                      {wk.runSpeed && <span>⚡ Tiro: <strong>{wk.runSpeed} km/h</strong></span>}
                      {wk.overallRpe && <span>🔥 RPE: <strong>{wk.overallRpe}/10</strong></span>}
                    </div>

                    {wk.notes && (
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{wk.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 1: TRACKER EXECUTION / CONFIG VIEW */}
      {subTab === 'tracker' && (
        <>
          {/* ================= MODE 1: SETUP CONFIGURATION ================= */}
          {mode === 'setup' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-soft-md space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Treino HIIT na Esteira
                    </h2>
                    <p className="text-xs text-slate-600">
                      Configure a intensidade e o tempo para gerar o cronômetro guiado.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    soundEnabled ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                  title="Sinais sonoros de transição"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span className="hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
                </button>
              </div>

              {/* Data e Hora do Treino (retroativo) */}
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <Calendar className="w-4 h-4 text-teal-600" /> Data e Hora do Treino:
                </label>
                <input
                  type="datetime-local"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* 1. Intensity Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" /> 1. Escolha a Intensidade:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'light', title: 'Iniciante / Suave', work: '30s Tiro', rest: '60s Caminhada', desc: 'Proporção 1:2' },
                    { id: 'moderate', title: 'Moderado', work: '45s Tiro', rest: '45s Caminhada', desc: 'Proporção 1:1' },
                    { id: 'high', title: 'Intenso / HIIT', work: '60s Tiro', rest: '30s Caminhada', desc: 'Proporção 2:1' },
                    { id: 'custom', title: 'Personalizado', work: `${config.workSeconds}s Tiro`, rest: `${config.restSeconds}s Cam.`, desc: 'Troca Livre' }
                  ].map((item) => {
                    const isSelected = config.preset === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPreset(item.id as IntensityPreset)}
                        className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-extrabold block">{item.title}</span>
                          <span className={`text-[11px] font-semibold mt-1 block ${isSelected ? 'text-orange-100' : 'text-slate-600'}`}>
                            {item.work} × {item.rest}
                          </span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold mt-2 tracking-wider ${isSelected ? 'text-orange-200' : 'text-slate-600'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom interval controls if custom is selected */}
              {config.preset === 'custom' && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 animate-fade-in">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Segundos de Tiro (Corrida):</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="5"
                      value={config.workSeconds}
                      onChange={(e) => setConfig((prev) => ({ ...prev, workSeconds: Math.max(5, parseInt(e.target.value, 10) || 30) }))}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Segundos de Caminhada:</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="5"
                      value={config.restSeconds}
                      onChange={(e) => setConfig((prev) => ({ ...prev, restSeconds: Math.max(5, parseInt(e.target.value, 10) || 30) }))}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* 2. Total Treadmill Time */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" /> 2. Tempo Total de Esteira:
                </label>

                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, totalTimeMinutes: mins }))}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                        config.totalTimeMinutes === mins
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Speed Suggestions & Warmup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Velocidades Alvo (km/h):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-600 font-semibold block mb-0.5">Caminhada:</span>
                      <input
                        type="text"
                        value={config.walkSpeed}
                        onChange={(e) => setConfig((prev) => ({ ...prev, walkSpeed: e.target.value }))}
                        className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2 text-slate-900"
                        placeholder="Ex: 5.5"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 font-semibold block mb-0.5">Corrida / Tiro:</span>
                      <input
                        type="text"
                        value={config.runSpeed}
                        onChange={(e) => setConfig((prev) => ({ ...prev, runSpeed: e.target.value }))}
                        className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2 text-slate-900"
                        placeholder="Ex: 11.0"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-800 block mb-1">Opções Adicionais:</span>
                  <label className="flex items-center space-x-2.5 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={config.includeWarmup}
                      onChange={(e) => setConfig((prev) => ({ ...prev, includeWarmup: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 accent-teal-600"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Aquecimento Inicial de 60s (Caminhada leve)
                    </span>
                  </label>
                </div>
              </div>

              {/* Dynamic Schedule Summary Box */}
              <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-teal-900 block">
                    Resumo do Treino Gerado:
                  </span>
                  <p className="text-xs text-teal-800 font-medium mt-0.5">
                    <strong>{calculatedRounds} Rounds</strong> de {config.workSeconds}s Tiro / {config.restSeconds}s Caminhada ({config.totalTimeMinutes} min total).
                  </p>
                </div>

                <div className="text-right text-[11px] font-bold text-teal-700 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-xs">
                  {formatTime(totalWorkSeconds)} Corrida / {formatTime(totalRestSeconds)} Caminhada
                </div>
              </div>

              {/* Start CTA */}
              <button
                onClick={handleStartWorkout}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>INICIAR CRONÔMETRO DE ESTEIRA</span>
              </button>
            </div>
          )}

          {/* ================= MODE 2: ACTIVE LIVE HIIT TIMER ================= */}
          {mode === 'active' && (
            <div className="space-y-4">
              {/* Main Banner Card */}
              <div
                className={`p-6 sm:p-8 rounded-3xl text-center border shadow-soft-xl transition-all ${
                  phase === 'work'
                    ? 'bg-gradient-to-br from-orange-500 to-rose-600 text-white border-orange-600 animate-pulse'
                    : phase === 'rest'
                    ? 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white border-teal-600'
                    : 'bg-slate-900 text-white border-slate-800'
                }`}
              >
                {/* Top Status Bar */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 fill-current" />
                    {phase === 'warmup' ? 'AQUECIMENTO' : phase === 'work' ? 'TIRO / CORRIDA INTENSA' : 'CAMINHADA / RECUPERAÇÃO'}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                    ROUND {currentRound} DE {calculatedRounds}
                  </span>
                </div>

                {/* Large Dynamic Action Instruction */}
                <div className="my-4">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    {phase === 'warmup' && 'CAMINHADA LEVE — PREPARE-SE'}
                    {phase === 'work' && `CORRA A ${config.runSpeed} KM/H!`}
                    {phase === 'rest' && `CAMINHE A ${config.walkSpeed} KM/H!`}
                  </h1>
                  <p className="text-xs sm:text-sm font-medium opacity-90 mt-1">
                    {phase === 'work' && 'Aumente a velocidade da esteira e acelere o ritmo!'}
                    {phase === 'rest' && 'Reduza a velocidade, respire fundo e recupere o fôlego.'}
                    {phase === 'warmup' && 'Ajuste a esteira para caminhada leve e prepare seu corpo.'}
                  </p>
                </div>

                {/* Huge Countdown Display (2 meters readable) */}
                <div className="text-7xl sm:text-8xl font-extrabold font-mono tracking-tighter my-3 drop-shadow-sm">
                  {formatTime(phaseSecondsLeft)}
                </div>

                {/* Phase Progress Bar */}
                <div className="w-full bg-black/20 rounded-full h-3 mb-4 overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-300"
                    style={{ width: `${phaseProgress}%` }}
                  ></div>
                </div>

                {/* Next Phase Indicator */}
                <div className="text-xs font-bold opacity-80 uppercase tracking-wide">
                  {phase === 'warmup' && `Próximo: 1º Tiro (${config.workSeconds}s)`}
                  {phase === 'work' && `Próximo: Caminhada (${config.restSeconds}s)`}
                  {phase === 'rest' && currentRound < calculatedRounds && `Próximo: Tiro Round ${currentRound + 1} (${config.workSeconds}s)`}
                  {phase === 'rest' && currentRound >= calculatedRounds && 'Próximo: Finalização!'}
                </div>
              </div>

              {/* Overall Progress & Live Controls */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft-sm space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Progresso Total da Esteira:</span>
                  <span>{formatTime(totalSecondsElapsed)} / {formatTime(totalTargetSeconds)}</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalSecondsElapsed / totalTargetSeconds) * 100)}%` }}
                  ></div>
                </div>

                {/* Interactive Control Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  {isRunning ? (
                    <button
                      onClick={() => setIsRunning(false)}
                      className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md"
                    >
                      <Pause className="w-4 h-4" /> Pausar
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsRunning(true)}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current" /> Continuar
                    </button>
                  )}

                  <button
                    onClick={handleSkipPhase}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200"
                    title="Pular para a próxima fase"
                  >
                    <SkipForward className="w-4 h-4" /> Pular Fase
                  </button>

                  <button
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className={`p-3 rounded-xl border text-xs font-bold ${
                      soundEnabled ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleFinishEarly}
                    className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 ml-auto"
                  >
                    Encerrar & Salvar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 3: DETAILED FEEDBACK & SAVE TO DB ================= */}
          {mode === 'summary' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft-lg space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Treino de Esteira Concluído!
                </h2>
                <p className="text-xs text-slate-600">
                  Responda ao feedback rápido para sincronizar seu histórico e gráfico.
                </p>
              </div>

              {/* Date & Time Confirmation/Adjustment */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
                  <Calendar className="w-4 h-4 text-teal-600" /> Data e Hora da Conclusão:
                </label>
                <input
                  type="datetime-local"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block">Tempo Executado:</span>
                  <strong className="text-base font-extrabold text-slate-900">{formatTime(totalSecondsElapsed)}</strong>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block">Rounds:</span>
                  <strong className="text-base font-extrabold text-teal-600">{currentRound} / {calculatedRounds}</strong>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 block">Intensidade:</span>
                  <strong className="text-base font-extrabold text-orange-600 uppercase">{config.preset}</strong>
                </div>
              </div>

              {/* Structured Feedback Questions */}
              <div className="space-y-4 pt-1">
                {/* 1. Quality / Feeling */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    1. Como foi a sensação geral do treino? (Feedback)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'excellent', label: '🔥 Excelente', desc: 'Dever cumprido!' },
                      { id: 'good', label: '👍 Bom', desc: 'Ritmo forte' },
                      { id: 'regular', label: '😐 Regular', desc: 'Cansaço pesado' },
                      { id: 'hard', label: '👎 Ruim/Exaustivo', desc: 'Dificuldade' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFeeling(item.id as HiitFeeling)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          feeling === item.id
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                        }`}
                      >
                        <span className="text-xs block">{item.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${feeling === item.id ? 'text-teal-100' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Compliance / Fidelidade */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    2. Conseguiu seguir o ritmo dos tiros corretamente?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'full', label: '✅ 100% Seguido', desc: 'Cumpri todas as velocidades' },
                      { id: 'partial', label: '⚠️ Parcialmente', desc: 'Reduzi velocidade em alguns' },
                      { id: 'difficult', label: '❌ Com Dificuldade', desc: 'Parei antes do fim' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCompliance(item.id as HiitCompliance)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          compliance === item.id
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                        }`}
                      >
                        <span className="text-xs block">{item.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${compliance === item.id ? 'text-orange-100' : 'text-slate-500'}`}>
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Real Speed Re-confirmation */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Velocidade Real de Tiro (km/h):</label>
                    <input
                      type="text"
                      value={actualRunSpeed}
                      onChange={(e) => setActualRunSpeed(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Velocidade Real Caminhada (km/h):</label>
                    <input
                      type="text"
                      value={actualWalkSpeed}
                      onChange={(e) => setActualWalkSpeed(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl p-2 text-slate-900"
                    />
                  </div>
                </div>

                {/* 4. RPE Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Percepção Subjetiva de Esforço (RPE 1-10):</span>
                    <span className="text-orange-600 font-extrabold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      {overallRpe} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={overallRpe}
                    onChange={(e) => setOverallRpe(parseInt(e.target.value, 10))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* 5. Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Observações Pessoais (opcional):</label>
                  <input
                    type="text"
                    placeholder="Ex: Mantive 11 km/h até o round 8, depois diminui para 10 km/h..."
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  />
                </div>

                {isSaved ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center space-x-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Treino Sincronizado e Salvo no IndexedDB!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToHistory}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 active:scale-[0.99] transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>SALVAR E SINCRONIZAR TREINO</span>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMode('setup');
                      setSubTab('chart');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Ver Gráfico de Evolução
                  </button>
                  <button
                    onClick={() => setMode('setup')}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Novo Treino na Esteira
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
