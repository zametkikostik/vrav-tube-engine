export const mockChannels = [
  { id: 1, name: "Tech Insights RU", handle: "@techinsights", score: 78, avatar: "TI", risk: "low" as const },
  { id: 2, name: "Crypto Daily", handle: "@cryptodaily", score: 65, avatar: "CD", risk: "medium" as const },
  { id: 3, name: "Gaming Hub", handle: "@gaminghub", score: 91, avatar: "GH", risk: "low" as const },
];

export const mockTitles = [
  { title: "Как YouTube убивает монетизацию в 2026 (и что делать)", score: 92 },
  { title: "Жёлтый значок навсегда? Реальная защита RPM", score: 88 },
  { title: "Я потерял 70% дохода из-за одного слова в видео", score: 85 },
  { title: "Алгоритм YouTube 2026: полный разбор + хаки", score: 81 },
  { title: "Скрытые правила AdSense, о которых молчат все", score: 79 },
  { title: "Почему твоё видео не растёт (даже с хорошим CTR)", score: 76 },
  { title: "10 запрещённых слов, которые сжигают монетизацию", score: 74 },
  { title: "Как я поднял RPM в 2.4 раза за 30 дней", score: 72 },
];

export const dangerousWords = [
  { word: "убить", reason: "Насилие / угроза" },
  { word: "смерть", reason: "Шок-контент" },
  { word: "наркотики", reason: "Запрещённые вещества" },
  { word: "суицид", reason: "Самоповреждение" },
  { word: "блять", reason: "Мат (сильный)" },
  { word: "пиздец", reason: "Мат" },
  { word: "хуй", reason: "Мат" },
  { word: "ебать", reason: "Мат" },
  { word: "терроризм", reason: "Экстремизм" },
  { word: "взрыв", reason: "Опасный контент" },
  { word: "кровь", reason: "Графика" },
  { word: "порно", reason: "Взрослый контент" },
];
