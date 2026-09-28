/**
 * بيانات لعبة الساحر: أسئلة وصفات الفواكه والشخصيات المشهورة.
 * كل صفة قيمتها من 0 إلى 1 (0 = لأ، 1 = أيوة، 0.5 = ممكن/أحياناً).
 */

const FRUIT_QUESTIONS = [
  { key: "red", text: "هل لونها أحمر؟" },
  { key: "yellow", text: "هل لونها أصفر؟" },
  { key: "green", text: "هل لونها أخضر؟" },
  { key: "small", text: "هل هي صغيرة الحجم، ممكن تاكلها بلقمة أو اثنين؟" },
  { key: "round", text: "هل شكلها دائري (مدوّر)؟" },
  { key: "peel", text: "هل لازم تقشّرها قبل ما تاكلها؟" },
  { key: "manySeeds", text: "هل فيها بذور كتير لمن تفتحها؟" },
  { key: "tropical", text: "هل تنمو في البلاد الحارة؟" },
  { key: "sour", text: "هل ممكن يكون طعمها حامض؟" },
  { key: "juicy", text: "هل هي عصيرية وفيها مويه كتير؟" },
];

const FRUITS = [
  { name: "تفاحة", emoji: "🍎", attrs: { red: 1, yellow: 0, green: 0.4, small: 1, round: 1, peel: 0, manySeeds: 0, tropical: 0, sour: 0.3, juicy: 0.6 } },
  { name: "موزة", emoji: "🍌", attrs: { red: 0, yellow: 1, green: 0, small: 0, round: 0, peel: 1, manySeeds: 0, tropical: 1, sour: 0, juicy: 0.3 } },
  { name: "برتقالة", emoji: "🍊", attrs: { red: 0, yellow: 0.2, green: 0, small: 1, round: 1, peel: 1, manySeeds: 0.5, tropical: 1, sour: 0.4, juicy: 1 } },
  { name: "عنب", emoji: "🍇", attrs: { red: 0.5, yellow: 0, green: 0.5, small: 1, round: 1, peel: 0, manySeeds: 0, tropical: 0, sour: 0.3, juicy: 1 } },
  { name: "فراولة", emoji: "🍓", attrs: { red: 1, yellow: 0, green: 0, small: 1, round: 0, peel: 0, manySeeds: 1, tropical: 0, sour: 0.3, juicy: 0.7 } },
  { name: "بطيخة", emoji: "🍉", attrs: { red: 0.7, yellow: 0, green: 1, small: 0, round: 0.5, peel: 1, manySeeds: 1, tropical: 1, sour: 0, juicy: 1 } },
  { name: "أناناس", emoji: "🍍", attrs: { red: 0, yellow: 1, green: 0.3, small: 0, round: 0, peel: 1, manySeeds: 0, tropical: 1, sour: 0.3, juicy: 0.6 } },
  { name: "مانجو", emoji: "🥭", attrs: { red: 0.3, yellow: 1, green: 0.2, small: 0, round: 0, peel: 1, manySeeds: 0, tropical: 1, sour: 0, juicy: 1 } },
  { name: "كيوي", emoji: "🥝", attrs: { red: 0, yellow: 0, green: 1, small: 1, round: 0, peel: 1, manySeeds: 1, tropical: 0.5, sour: 0.4, juicy: 0.7 } },
  { name: "ليمون", emoji: "🍋", attrs: { red: 0, yellow: 1, green: 0, small: 1, round: 0.5, peel: 1, manySeeds: 0.3, tropical: 0.5, sour: 1, juicy: 0.7 } },
  { name: "كرز", emoji: "🍒", attrs: { red: 1, yellow: 0, green: 0, small: 1, round: 1, peel: 0, manySeeds: 0, tropical: 0, sour: 0.2, juicy: 0.6 } },
  { name: "رمّان", emoji: "🔴", attrs: { red: 1, yellow: 0, green: 0, small: 0.5, round: 1, peel: 1, manySeeds: 1, tropical: 0.3, sour: 0.3, juicy: 0.5 } },
  { name: "جوافة", emoji: "🍈", attrs: { red: 0, yellow: 0.5, green: 0.7, small: 1, round: 0.7, peel: 0.3, manySeeds: 1, tropical: 1, sour: 0.2, juicy: 0.5 } },
  { name: "خوخ", emoji: "🍑", attrs: { red: 0.4, yellow: 0.6, green: 0, small: 1, round: 1, peel: 0.3, manySeeds: 0, tropical: 0, sour: 0.1, juicy: 0.8 } },
];

const CHARACTER_QUESTIONS = [
  { key: "human", text: "هل هي شخصية إنسان؟" },
  { key: "animal", text: "هل هي حيوان أو كائن مش إنسان؟" },
  { key: "male", text: "هل هي شخصية ولد أو راجل؟" },
  { key: "female", text: "هل هي شخصية بنت أو ست؟" },
  { key: "superpowers", text: "هل عنده قوى خارقة؟" },
  { key: "cape", text: "هل يلبس عباءة أو رداء؟" },
  { key: "royal", text: "هل هي أميرة أو من عائلة ملكية؟" },
  { key: "cartoon", text: "هل هي من مسلسل كرتون؟" },
  { key: "mask", text: "هل تغطي وشها بقناع؟" },
  { key: "colorSkin", text: "هل لون بشرتها أو جسمها غريب، زي أخضر أو أصفر؟" },
];

const CHARACTERS = [
  { name: "سبايدرمان", emoji: "🕷️", attrs: { human: 1, animal: 0, male: 1, female: 0, superpowers: 1, cape: 0, royal: 0, cartoon: 0.3, mask: 1, colorSkin: 0 } },
  { name: "سوبرمان", emoji: "🦸‍♂️", attrs: { human: 1, animal: 0, male: 1, female: 0, superpowers: 1, cape: 1, royal: 0, cartoon: 0.3, mask: 0, colorSkin: 0 } },
  { name: "باتمان", emoji: "🦇", attrs: { human: 1, animal: 0, male: 1, female: 0, superpowers: 0, cape: 1, royal: 0, cartoon: 0.3, mask: 1, colorSkin: 0 } },
  { name: "هالك", emoji: "💪", attrs: { human: 0.5, animal: 0, male: 1, female: 0, superpowers: 1, cape: 0, royal: 0, cartoon: 0.3, mask: 0, colorSkin: 1 } },
  { name: "ميكي ماوس", emoji: "🐭", attrs: { human: 0, animal: 1, male: 1, female: 0, superpowers: 0, cape: 0, royal: 0, cartoon: 1, mask: 0, colorSkin: 0.5 } },
  { name: "سبونج بوب", emoji: "🧽", attrs: { human: 0, animal: 1, male: 1, female: 0, superpowers: 0, cape: 0, royal: 0, cartoon: 1, mask: 0, colorSkin: 1 } },
  { name: "إلسا", emoji: "❄️", attrs: { human: 1, animal: 0, male: 0, female: 1, superpowers: 1, cape: 1, royal: 1, cartoon: 1, mask: 0, colorSkin: 0 } },
  { name: "سندريلا", emoji: "👠", attrs: { human: 1, animal: 0, male: 0, female: 1, superpowers: 0, cape: 0, royal: 1, cartoon: 1, mask: 0, colorSkin: 0 } },
  { name: "دورا", emoji: "🎒", attrs: { human: 1, animal: 0, male: 0, female: 1, superpowers: 0, cape: 0, royal: 0, cartoon: 1, mask: 0, colorSkin: 0 } },
  { name: "توم", emoji: "🐱", attrs: { human: 0, animal: 1, male: 1, female: 0, superpowers: 0, cape: 0, royal: 0, cartoon: 1, mask: 0, colorSkin: 0 } },
  { name: "جيري", emoji: "🐁", attrs: { human: 0, animal: 1, male: 1, female: 0, superpowers: 0, cape: 0, royal: 0, cartoon: 1, mask: 0, colorSkin: 0 } },
  { name: "بيكاتشو", emoji: "⚡", attrs: { human: 0, animal: 1, male: 0.5, female: 0.5, superpowers: 1, cape: 0, royal: 0, cartoon: 1, mask: 0, colorSkin: 1 } },
  { name: "شريك", emoji: "🟢", attrs: { human: 0.5, animal: 0, male: 1, female: 0, superpowers: 0, cape: 0, royal: 0.5, cartoon: 1, mask: 0, colorSkin: 1 } },
  { name: "علاء الدين", emoji: "🧞", attrs: { human: 1, animal: 0, male: 1, female: 0, superpowers: 0, cape: 0, royal: 1, cartoon: 1, mask: 0, colorSkin: 0 } },
];

const GAME_DATA = {
  fruit: { questions: FRUIT_QUESTIONS, entities: FRUITS, noun: "فاكهة" },
  character: { questions: CHARACTER_QUESTIONS, entities: CHARACTERS, noun: "شخصية مشهورة" },
};
