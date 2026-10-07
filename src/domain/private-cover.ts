export interface CoverAuthorship {
  institution: string;
  semester: string;
  authors: readonly string[];
}
export interface PrivateCoverConfig {
  salt: string;
  hash: string;
  authorship: CoverAuthorship;
}
