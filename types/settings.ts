export type Language = 'en' | 'pt';
export type Currency = 'BRL' | 'USD';

export type Settings = {
  language: Language;
  currency: Currency;
};

export const DEFAULT_SETTINGS: Settings = {
  language: 'pt',
  currency: 'BRL',
};
