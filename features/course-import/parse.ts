/**
 * Pure parser: mammoth-produced HTML (from a course .docx) → a structured
 * CourseDraft. No framework/server imports, so it's unit-testable in isolation.
 *
 * The template is regular: a course preamble, then repeating modules. Each
 * module is `<p>MODULE NN</p>`, an `<h1>` title, an `<em>` overview paragraph,
 * then `<h2>` sections — Learning Objectives (a `<ul>`), Core Topics and
 * Hands-On Activities (`<h3>` heading + `<p>` body pairs), and a Knowledge Check
 * (numbered `<p>` question, lettered `<p>` options with a ✓ on the correct one,
 * and an `Explanation:` `<p>`).
 */

export interface ChoiceDraft {
  text: string;
  isCorrect: boolean;
}
export interface QuestionDraft {
  prompt: string;
  explanation: string | null;
  choices: ChoiceDraft[];
}
export interface HeadedBlock {
  heading: string;
  body: string;
}
export interface ModuleDraft {
  title: string;
  overview: string;
  objectives: string[];
  topics: HeadedBlock[];
  activities: HeadedBlock[];
  questions: QuestionDraft[];
}
export interface CourseDraft {
  title: string;
  description: string;
  modules: ModuleDraft[];
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'p'; text: string }
  | { kind: 'ul'; items: string[] };

const MODULE_MARKER = /^MODULE\s+\d+$/;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Strip inline tags, decode entities, collapse whitespace. */
function clean(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/** Flatten mammoth's (flat) HTML into an ordered list of blocks. */
export function tokenize(html: string): Block[] {
  const blocks: Block[] = [];
  const re = /<(h1|h2|h3|p|ul)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    if (tag === 'ul') {
      const items = [...m[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((x) => clean(x[1]))
        .filter(Boolean);
      blocks.push({ kind: 'ul', items });
    } else {
      const text = clean(m[2]);
      if (text) blocks.push({ kind: tag as 'h1' | 'h2' | 'h3' | 'p', text });
    }
  }
  return blocks;
}

/** Fold one Knowledge Check paragraph into the running question list. */
function consumeQuizLine(questions: QuestionDraft[], text: string): void {
  const q = /^(\d+)[.)]\s*(.+)$/.exec(text);
  if (q) {
    questions.push({ prompt: q[2].trim(), explanation: null, choices: [] });
    return;
  }
  const current = questions[questions.length - 1];
  const opt = /^([A-Z])[.)]\s*(.+)$/.exec(text);
  if (opt && current) {
    const isCorrect = /✓/.test(opt[2]);
    const body = opt[2].replace(/\s*✓\s*correct\s*$/i, '').replace(/\s*✓\s*$/, '').trim();
    current.choices.push({ text: body, isCorrect });
    return;
  }
  const exp = /^explanation[:\-]\s*(.+)$/i.exec(text);
  if (exp && current) {
    current.explanation = exp[1].trim();
  }
}

function parseModule(mb: Block[]): ModuleDraft {
  const mod: ModuleDraft = {
    title: '',
    overview: '',
    objectives: [],
    topics: [],
    activities: [],
    questions: [],
  };

  let i = 1; // mb[0] is the MODULE marker
  if (mb[i]?.kind === 'h1') {
    mod.title = (mb[i] as { text: string }).text;
    i++;
  } else if (mb[i]?.kind === 'p') {
    mod.title = (mb[i] as { text: string }).text;
    i++;
  }
  if (mb[i]?.kind === 'p') {
    mod.overview = (mb[i] as { text: string }).text;
    i++;
  }

  let section: 'none' | 'obj' | 'topics' | 'activities' | 'quiz' = 'none';
  for (; i < mb.length; i++) {
    const b = mb[i];
    if (b.kind === 'h2') {
      const t = b.text.toLowerCase();
      section = t.includes('objective')
        ? 'obj'
        : t.includes('topic')
          ? 'topics'
          : t.includes('hands-on') || t.includes('activit')
            ? 'activities'
            : t.includes('knowledge') || t.includes('quiz') || t.includes('assessment')
              ? 'quiz'
              : 'none';
      continue;
    }

    if (section === 'obj') {
      if (b.kind === 'ul') mod.objectives.push(...b.items);
      else if (b.kind === 'p') mod.objectives.push(b.text);
    } else if (section === 'topics' || section === 'activities') {
      const target = section === 'topics' ? mod.topics : mod.activities;
      if (b.kind === 'h3') {
        target.push({ heading: b.text, body: '' });
      } else if (b.kind === 'p') {
        if (target.length) {
          const last = target[target.length - 1];
          last.body += (last.body ? '\n\n' : '') + b.text;
        } else {
          target.push({ heading: '', body: b.text });
        }
      } else if (b.kind === 'ul' && target.length) {
        const last = target[target.length - 1];
        last.body += (last.body ? '\n\n' : '') + b.items.map((it) => `- ${it}`).join('\n');
      }
    } else if (section === 'quiz') {
      if (b.kind === 'p') consumeQuizLine(mod.questions, b.text);
    }
  }

  return mod;
}

export function parseCourseHtml(html: string): CourseDraft {
  const blocks = tokenize(html);

  // Preamble = everything before the first module marker.
  const firstModule = blocks.findIndex((b) => b.kind === 'p' && MODULE_MARKER.test(b.text));
  const preambleEnd = firstModule === -1 ? blocks.length : firstModule;
  const preamble = blocks
    .slice(0, preambleEnd)
    .filter((b): b is { kind: 'h1' | 'p'; text: string } => b.kind === 'p' || b.kind === 'h1')
    .map((b) => b.text)
    .filter((t) => !/^Module\s+\d+/i.test(t) && !/^table of contents$/i.test(t));

  const upper = preamble.filter((t) => t === t.toUpperCase() && /[A-Z]/.test(t));
  const title = (upper.length ? upper.join(' ') : preamble[0]) || 'Imported course';
  const description = preamble
    .filter((t) => !upper.includes(t))
    .slice(0, 3)
    .join(' — ');

  const moduleStarts = blocks
    .map((b, i) => (b.kind === 'p' && MODULE_MARKER.test(b.text) ? i : -1))
    .filter((i) => i !== -1);

  const modules = moduleStarts.map((start, idx) => {
    const end = idx + 1 < moduleStarts.length ? moduleStarts[idx + 1] : blocks.length;
    return parseModule(blocks.slice(start, end));
  });

  return { title, description, modules };
}

// ---------------------------------------------------------------------------
// Draft → lessons (Balanced mapping: 4 lessons per module).
// ---------------------------------------------------------------------------

export interface LessonDraft {
  title: string;
  type: 'NOTE' | 'QUIZ';
  noteContent?: string;
  quiz?: { title: string; questions: QuestionDraft[] };
}

function headedBlocksToMarkdown(blocks: HeadedBlock[]): string {
  return blocks
    .map((b) => (b.heading ? `## ${b.heading}\n\n${b.body}` : b.body))
    .join('\n\n')
    .trim();
}

/** A question is importable when it has 2+ choices and exactly one correct. */
export function isValidQuestion(q: QuestionDraft): boolean {
  return q.choices.length >= 2 && q.choices.filter((c) => c.isCorrect).length === 1;
}

/** Build the 4-lesson (Balanced) mapping for a module, skipping empty lessons. */
export function moduleLessons(mod: ModuleDraft): LessonDraft[] {
  const lessons: LessonDraft[] = [];

  const overviewParts: string[] = [];
  if (mod.overview) overviewParts.push(mod.overview);
  if (mod.objectives.length) {
    overviewParts.push(
      `## Learning Objectives\n\n${mod.objectives.map((o) => `- ${o}`).join('\n')}`
    );
  }
  if (overviewParts.length) {
    lessons.push({ title: 'Overview & Objectives', type: 'NOTE', noteContent: overviewParts.join('\n\n') });
  }

  if (mod.topics.length) {
    lessons.push({ title: 'Core Topics', type: 'NOTE', noteContent: headedBlocksToMarkdown(mod.topics) });
  }
  if (mod.activities.length) {
    lessons.push({
      title: 'Hands-On Activities',
      type: 'NOTE',
      noteContent: headedBlocksToMarkdown(mod.activities),
    });
  }

  const validQuestions = mod.questions.filter(isValidQuestion);
  if (validQuestions.length) {
    lessons.push({
      title: 'Knowledge Check',
      type: 'QUIZ',
      quiz: { title: 'Knowledge Check', questions: validQuestions },
    });
  }

  return lessons;
}
