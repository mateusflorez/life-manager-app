export type Account = {
  id: string;
  name: string;
  createdAt: string;
  avatar?: string;
  xp: number;
  completedTasks: number;
  salary?: number; // Monthly salary for auto-income in finance
  birthDate?: string; // ISO date string for calculating age
  bio?: string; // Flavored markdown bio (Anilist-style)
};
