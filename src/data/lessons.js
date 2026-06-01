// "Learn & Earn" content: short, kid-friendly lessons. Each has a few explanation
// cards and a quiz. Passing the quiz earns a badge + bonus cash (once per lesson).

export const LESSONS = [
  {
    id: 'what-is-stock',
    icon: '📈',
    badge: '📈',
    title: 'What is a stock?',
    summary: 'Own a tiny piece of a real company.',
    reward: 25,
    cards: [
      'A stock is a tiny piece of a company. If you own a share of Apple, you own a teeny-tiny slice of Apple! 🍎',
      'Companies sell shares to raise money. When you buy one, you become a part-owner.',
      'If the company does well and grows, your share can become worth more. That\'s how you grow your money! 🌱',
    ],
    quiz: [
      {
        q: 'What do you get when you buy a share of a company?',
        options: ['A tiny piece of the company', 'A free toy', 'The whole company', 'Nothing at all'],
        answer: 0,
        explain: 'Right! One share = one tiny piece of the company.',
      },
    ],
  },
  {
    id: 'why-prices-move',
    icon: '💰',
    badge: '💰',
    title: 'Why do prices move?',
    summary: 'What makes a stock go up or down.',
    reward: 25,
    cards: [
      'Prices change because of supply and demand — how many people want to BUY vs SELL a stock.',
      'Good news (like a popular new product) makes more people want to buy, so the price goes UP. ⬆️',
      'Bad news makes people want to sell, so the price goes DOWN. ⬇️',
    ],
    quiz: [
      {
        q: 'What can make a stock price go UP?',
        options: ['Lots of people want to buy it', 'Nobody likes the company', 'The company closes down', 'It starts raining'],
        answer: 0,
        explain: 'Exactly! More buyers than sellers pushes the price up.',
      },
    ],
  },
  {
    id: 'diversify',
    icon: '🧺',
    badge: '🧺',
    title: 'Don\'t use one basket',
    summary: 'Spreading out keeps your money safer.',
    reward: 25,
    cards: [
      'Imagine carrying all your eggs in ONE basket. If you drop it… you lose every egg! 🥚',
      'It\'s the same with money. If you put it all in one stock and it drops, you lose a lot.',
      'Spreading money across many different stocks is called diversifying. It makes your money safer.',
    ],
    quiz: [
      {
        q: 'Why shouldn\'t you put all your money in one stock?',
        options: ['If it drops, you could lose a lot', 'It\'s against the rules', 'Stocks are boring', 'You\'re not allowed'],
        answer: 0,
        explain: 'Yes! Spreading out protects you if one stock drops.',
      },
    ],
  },
  {
    id: 'patience',
    icon: '⏳',
    badge: '⏳',
    title: 'Patience pays',
    summary: 'Why smart investors wait.',
    reward: 25,
    cards: [
      'The stock market goes up and down every single day. That\'s totally normal! 🎢',
      'Trying to guess the perfect day to buy or sell is really hard — even for grown-ups.',
      'Over many years, the market has usually grown. Patient investors who wait often do best. ⏳',
    ],
    quiz: [
      {
        q: 'What do smart investors usually do when prices drop a little?',
        options: ['Stay calm and wait', 'Panic and sell everything', 'Give up forever', 'Get scared and cry'],
        answer: 0,
        explain: 'That\'s it — staying calm and patient usually wins.',
      },
    ],
  },
  {
    id: 'buy-low-sell-high',
    icon: '🎯',
    badge: '🎯',
    title: 'Buy low, sell high',
    summary: 'The simple goal of investing.',
    reward: 25,
    cards: [
      'The goal is to buy a stock when it\'s cheaper, then sell it later when it\'s worth more.',
      'The difference between what you paid and what you sell for is your profit! 🤑',
      'Nobody can guess the perfect moment, so patience and spreading out help a lot.',
    ],
    quiz: [
      {
        q: 'How do you make a profit on a stock?',
        options: ['Buy it low, sell it high', 'Buy it high, sell it low', 'Never sell it', 'Spend all your cash'],
        answer: 0,
        explain: 'Perfect! Buy low and sell high = profit.',
      },
    ],
  },
  {
    id: 'what-is-etf',
    icon: '🏦',
    badge: '🏦',
    title: 'What is an ETF?',
    summary: 'A basket of many stocks in one.',
    reward: 25,
    cards: [
      'An ETF is like a basket that holds many stocks at once. 🧺',
      'Buying ONE share of an ETF gives you a tiny bit of ALL the companies inside it.',
      'That makes ETFs an easy way to diversify. QQQ and SPY are two famous ETFs.',
    ],
    quiz: [
      {
        q: 'What is an ETF?',
        options: ['A basket of many stocks in one', 'A single company', 'A kind of candy', 'A video game'],
        answer: 0,
        explain: 'Yes! One ETF holds lots of stocks together.',
      },
    ],
  },
]

const BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]))
export const getLesson = (id) => BY_ID[id]
