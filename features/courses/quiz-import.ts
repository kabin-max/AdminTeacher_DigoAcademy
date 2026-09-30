/**
 * Pure quiz CSV import (no framework/server imports) — parse a spreadsheet the
 * instructor filled in Excel/Google Sheets into quiz questions, and provide the
 * downloadable template. One row per question; up to 10 choiceN/correctN pairs.
 *
 *   prompt,type,explanation,choice1,correct1,choice2,correct2,...
 *
 *   type      = SINGLE | MULTIPLE (default SINGLE)
 *   correctN  = TRUE/1/yes/x marks a correct choice
 */

export type ImportedQuestionKind = 'SINGLE' | 'MULTIPLE';

export interface ImportedChoice {
  text: string;
  isCorrect: boolean;
}
export interface ImportedQuestion {
  prompt: string;
  explanation: string;
  kind: ImportedQuestionKind;
  choices: ImportedChoice[];
}
export interface QuizCsvResult {
  questions: ImportedQuestion[];
  errors: string[];
}

const TRUTHY = /^(true|1|yes|y|x|correct|✓)$/i;

export const QUIZ_CSV_TEMPLATE = [
  'prompt,type,explanation,choice1,correct1,choice2,correct2,choice3,correct3,choice4,correct4',
  '"What is Amazon S3?",SINGLE,"S3 is object storage.","Object storage",TRUE,"A compute service",FALSE,"A relational database",FALSE,"A CDN",FALSE',
  '"Which of these are AWS compute services? (select all)",MULTIPLE,"EC2 and Lambda are compute services.","Amazon EC2",TRUE,"AWS Lambda",TRUE,"Amazon S3",FALSE,"Amazon RDS",FALSE',
].join('\r\n');

/** Minimal RFC-4180 CSV row parser (handles quoted fields, commas, newlines). */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function parseQuizCsv(text: string): QuizCsvResult {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return { questions: [], errors: ['No question rows found.'] };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const promptIdx = idx('prompt');
  const typeIdx = idx('type') !== -1 ? idx('type') : idx('kind');
  const explIdx = idx('explanation');

  const pairs: { choice: number; correct: number }[] = [];
  for (let n = 1; n <= 10; n++) {
    const choice = idx(`choice${n}`);
    if (choice !== -1) pairs.push({ choice, correct: idx(`correct${n}`) });
  }

  if (promptIdx === -1) return { questions: [], errors: ['Missing a "prompt" column.'] };
  if (pairs.length === 0) {
    return { questions: [], errors: ['No "choice1", "choice2", … columns found.'] };
  }

  const questions: ImportedQuestion[] = [];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const line = r + 1;
    const prompt = (row[promptIdx] ?? '').trim();
    if (!prompt) continue;

    const rawKind = (typeIdx !== -1 ? (row[typeIdx] ?? '') : '').trim().toUpperCase();
    const kind: ImportedQuestionKind = rawKind.startsWith('MULTI') ? 'MULTIPLE' : 'SINGLE';
    const explanation = (explIdx !== -1 ? (row[explIdx] ?? '') : '').trim();

    const choices: ImportedChoice[] = [];
    for (const pair of pairs) {
      const cText = (row[pair.choice] ?? '').trim();
      if (!cText) continue;
      const isCorrect = pair.correct !== -1 && TRUTHY.test((row[pair.correct] ?? '').trim());
      choices.push({ text: cText, isCorrect });
    }

    const correctCount = choices.filter((c) => c.isCorrect).length;
    if (choices.length < 2) {
      errors.push(`Row ${line}: needs at least 2 choices — skipped.`);
      continue;
    }
    if (choices.length > 10) {
      errors.push(`Row ${line}: more than 10 choices — skipped.`);
      continue;
    }
    if (correctCount === 0) {
      errors.push(`Row ${line}: no correct choice marked — skipped.`);
      continue;
    }
    if (kind === 'SINGLE' && correctCount > 1) {
      errors.push(`Row ${line}: single-answer but ${correctCount} marked correct — skipped.`);
      continue;
    }

    questions.push({ prompt, explanation, kind, choices });
  }

  return { questions, errors };
}
