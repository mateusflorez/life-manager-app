export type Language = 'en' | 'pt';
export type Currency = 'BRL' | 'USD';

export type ModulesConfig = {
  finance: boolean;
};

export type Settings = {
  language: Language;
  currency: Currency;
  modules: ModulesConfig;
};

export const DEFAULT_MODULES: ModulesConfig = {
  finance: true,
};

export const DEFAULT_SETTINGS: Settings = {
  language: 'pt',
  currency: 'BRL',
  modules: DEFAULT_MODULES,
};
