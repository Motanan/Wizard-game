/**
 * محرك التخمين: يختار أفضل سؤال في كل مرة بناءً على مدى تفريقه بين
 * المرشّحين المتصدّرين حالياً، ويحدّث درجة كل مرشّح بعد كل إجابة.
 */

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 9;
const CONFIDENCE_GAP = 1.6;

class GuessEngine {
  constructor(questions, entities) {
    this.questions = questions;
    this.entities = entities.map((e) => ({ ...e, score: 0 }));
    this.askedKeys = new Set();
    this.excluded = new Set();
    this.history = [];
  }

  activeEntities() {
    return this.entities.filter((e) => !this.excluded.has(e.name));
  }

  ranked() {
    return [...this.activeEntities()].sort((a, b) => b.score - a.score);
  }

  questionsAsked() {
    return this.history.length;
  }

  /** يختار السؤال التالي الأكثر تفريقاً بين المرشّحين المتصدّرين. */
  nextQuestion() {
    const remaining = this.questions.filter((q) => !this.askedKeys.has(q.key));
    if (remaining.length === 0) return null;

    const contenders = this.ranked().slice(0, 6);
    if (contenders.length === 0) return null;

    let best = remaining[0];
    let bestSpread = -1;
    for (const q of remaining) {
      const values = contenders.map((e) => e.attrs[q.key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const spread = values.reduce((a, v) => a + Math.abs(v - mean), 0);
      if (spread > bestSpread) {
        bestSpread = spread;
        best = q;
      }
    }
    return best;
  }

  /** answerValue: 1 = أيوة، 0 = لأ، 0.5 = مش متأكد */
  answer(questionKey, answerValue) {
    this.askedKeys.add(questionKey);
    this.history.push({ key: questionKey, value: answerValue });
    for (const e of this.activeEntities()) {
      const target = e.attrs[questionKey];
      const similarity = 1 - Math.abs(answerValue - target);
      e.score += similarity * 2 - 0.5;
    }
  }

  confidencePercent() {
    const ranked = this.ranked();
    if (ranked.length === 0 || this.history.length === 0) return 0;
    const top = ranked[0].score;
    const maxPossible = this.history.length * 1.5;
    return Math.max(4, Math.min(96, Math.round((top / maxPossible) * 100)));
  }

  /** هل حان وقت التخمين؟ */
  readyToGuess() {
    const asked = this.questionsAsked();
    if (asked < MIN_QUESTIONS) return false;
    if (asked >= MAX_QUESTIONS) return true;
    const ranked = this.ranked();
    if (ranked.length < 2) return true;
    return ranked[0].score - ranked[1].score >= CONFIDENCE_GAP;
  }

  currentGuess() {
    return this.ranked()[0] || null;
  }

  /** يستبعد التخمين الخاطئ ويعطي فرصة لمحاولة تانية لو فيه أسئلة متبقية. */
  rejectCurrentGuess() {
    const guess = this.currentGuess();
    if (guess) this.excluded.add(guess.name);
  }

  canTryAgain() {
    return this.activeEntities().length > 0 && this.nextQuestion() !== null;
  }
}

/** محرك تخمين الأرقام بالبحث الثنائي — يضمن الوصول للرقم دايماً. */
class NumberEngine {
  constructor(min = 1, max = 100) {
    this.low = min;
    this.high = max;
    this.rounds = 0;
  }

  currentGuess() {
    return Math.round((this.low + this.high) / 2);
  }

  totalRange() {
    return this.high - this.low + 1;
  }

  /** direction: 'higher' (الرقم أكبر), 'lower' (الرقم أصغر), 'exact' */
  answer(direction) {
    this.rounds += 1;
    const mid = this.currentGuess();
    if (direction === "higher") this.low = mid + 1;
    else if (direction === "lower") this.high = mid - 1;
    else if (direction === "exact") this.low = this.high = mid;
  }

  isSolved() {
    return this.low >= this.high;
  }

  finalAnswer() {
    return this.low;
  }
}
