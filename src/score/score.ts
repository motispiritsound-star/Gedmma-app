import { CATEGORY_WEIGHTS, CATEGORY_LABELS, evaluate, type Category, type Issue } from './rules.ts';
import type { PageSignals } from '../scan/analyze.ts';

export type CategoryScore = {
  category: Category;
  label: string;
  score: number;
  max: number;
  lost: number;
};

export type Verdict = {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  categories: CategoryScore[];
  issues: Issue[];
  /** De zwaarste problemen, geschikt om direct in een voorstel te noemen. */
  topIssues: Issue[];
};

const SEVERITY_ORDER: Record<Issue['severity'], number> = { kritiek: 0, hoog: 1, middel: 2, laag: 3 };

export function gradeFor(score: number): Verdict['grade'] {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export const GRADE_LABELS: Record<Verdict['grade'], string> = {
  A: 'Uitstekend', B: 'Goed', C: 'Matig', D: 'Slecht', F: 'Zeer slecht',
};

/** Rekent de gevonden problemen om naar een score van 0-100 met deelscores per categorie. */
export function scoreSignals(signals: PageSignals): Verdict {
  const issues = evaluate(signals);

  const categories = (Object.keys(CATEGORY_WEIGHTS) as Category[]).map((category) => {
    const max = CATEGORY_WEIGHTS[category];
    const lost = Math.min(
      max,
      issues.filter((found) => found.category === category).reduce((sum, found) => sum + found.points, 0),
    );
    return { category, label: CATEGORY_LABELS[category], score: max - lost, max, lost };
  });

  const score = Math.max(0, Math.min(100, Math.round(categories.reduce((sum, c) => sum + c.score, 0))));
  const grade = gradeFor(score);

  const ranked = [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.points - a.points,
  );

  return { score, grade, label: GRADE_LABELS[grade], categories, issues: ranked, topIssues: ranked.slice(0, 5) };
}

/** Verdict voor een site die helemaal niet te bereiken was. */
export function offlineVerdict(reason: string): Verdict {
  const issue: Issue = {
    id: 'onbereikbaar',
    category: 'veiligheid',
    severity: 'kritiek',
    points: 100,
    title: `De website is niet bereikbaar (${reason})`,
    advies: 'Controleer hosting en domeinnaam; overweeg een nieuwe site met betrouwbare hosting.',
  };
  return {
    score: 0,
    grade: 'F',
    label: 'Onbereikbaar',
    categories: (Object.keys(CATEGORY_WEIGHTS) as Category[]).map((category) => ({
      category, label: CATEGORY_LABELS[category], score: 0, max: CATEGORY_WEIGHTS[category], lost: CATEGORY_WEIGHTS[category],
    })),
    issues: [issue],
    topIssues: [issue],
  };
}
