export type WeightContextTag = 'Jejum' | 'Pós-treino' | 'Normal';

export interface WeightLog {
  id: string;
  timestamp: string;
  weightKg: number;
  tag: WeightContextTag;
  notes?: string;
  ema7?: number;
  sma7?: number;
}

export type ExerciseCategory = 'strength' | 'cardio' | 'bodyweight';

export type SetEffort = 'light' | 'optimal' | 'limit';

export interface ExerciseSet {
  set: number;
  effort?: SetEffort;
  restSeconds?: number;
  timestamp?: string;
  workSeconds?: number;
  intensity?: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  category: ExerciseCategory;
  defaultRestSeconds?: number;
  notes?: string;
}

export interface WorkoutExercise {
  id?: string;
  name: string;
  category: ExerciseCategory;
  defaultRestSeconds?: number;
  sets?: ExerciseSet[];
  rounds?: ExerciseSet[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  totalDurationSeconds: number;
  exercises: WorkoutExercise[];
  overallRpe: number;
  notes?: string;
}

export interface UserProfile {
  id?: string;
  targetWeightKg: number;
  targetCalories?: number;
  unit: string;
}

export interface GitHubSettings {
  id?: string;
  owner: string;
  repo: string;
  path: string;
  token: string;
}

export type MealType = 'Café da Manhã' | 'Almoço' | 'Lanche' | 'Jantar' | 'Outros';

export interface FoodItem {
  id: string;
  name: string;
  category?: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  isCustom?: boolean;
}

export interface MealItem {
  id: string;
  foodName: string;
  grams: number;
  calories: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
}

export interface MealGroup {
  mealType: MealType;
  items: MealItem[];
}

export interface DailyNutritionLog {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  meals: MealGroup[];
  totalCalories: number;
  totalProteinGrams?: number;
}

export interface TrendFitSnapshot {
  $schema?: string;
  version?: number;
  lastUpdated?: string;
  profile?: UserProfile;
  weightLogs?: WeightLog[];
  workouts?: WorkoutLog[];
  exercises?: ExerciseTemplate[];
  nutritionLogs?: DailyNutritionLog[];
}
