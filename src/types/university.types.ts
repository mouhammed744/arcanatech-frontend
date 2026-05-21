export interface UniversityConfig {
  id: number;
  name: string;
  code: string;
  city: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentPreset: string;
  studentIdDigits: number;
  studentIdPrefix: string | null;
  logoUrl: string | null;
}
