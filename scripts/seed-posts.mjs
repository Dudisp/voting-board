const URL = 'https://voting-board-psi.vercel.app/api/posts';

const posts = [
  "What's the best way to learn a new programming language in 2025?",
  "Hot take: remote work is better for productivity than the office",
  "What's your go-to productivity hack that actually works?",
  "The best coding advice I ever got: write code for the next person who reads it",
  "Anyone else feel like AI is changing their job faster than expected?",
  "What's a book that genuinely changed how you think?",
  "Coffee or tea while coding? This is important.",
  "Unpopular opinion: dark mode is overrated",
  "What's the one tool you couldn't live without?",
  "The hardest part of software engineering isn't the code",
  "What's a mistake you made that taught you the most?",
  "Is it worth learning TypeScript if you already know JavaScript?",
  "What's the best city you've ever visited?",
  "Why does everyone hate Mondays? Mondays are fine.",
  "What's something you wish you'd started earlier in life?",
  "The internet needs more small, personal websites",
  "What's a skill that's underrated and worth learning?",
  "Tabs vs spaces - let's settle this once and for all",
  "What's the most overused word in tech right now?",
  "Side projects: worth it or a distraction from the main thing?",
  "What's a piece of advice you'd give your 20-year-old self?",
  "The best UI is the one users don't notice",
  "What's your favorite keyboard shortcut that most people don't know?",
  "Is it possible to have too many browser tabs open? Asking for a friend.",
  "What programming language do you wish more people used?",
  "The documentation is always wrong the third time you read it",
  "What's a place in your city that deserves more attention?",
  "Morning person or night owl? Which makes you more productive?",
  "What's something that was hyped up but turned out to actually be great?",
  "AI won't replace developers, it'll replace developers who don't use AI",
  "What's the most important thing a manager can do for their team?",
  "Stop building features nobody asked for",
  "What's your honest take on NFTs in hindsight?",
  "The best debugging tool is still a well-placed console.log",
  "What's a technology you think will be obsolete in 5 years?",
  "Learning to say no is the most underrated career skill",
  "What's your favorite thing about where you live?",
  "Open source is the backbone of the modern internet and we take it for granted",
  "What's a product that solves a problem you didn't know you had?",
  "Why is good UX writing so rare?",
  "מה הדבר הכי חשוב שלמדתם השנה?",
  "הכי טוב לעבוד מהבית או מהמשרד?",
  "איזה סרט ראיתם לאחרונה שממליצים עליו?",
  "תל אביב או ירושלים - איפה עדיף לגור?",
  "מה הספר שהכי השפיע עליכם?",
  "האם בינה מלאכותית תשנה את השוק הישראלי בצורה משמעותית?",
  "מה הסטארטאפ הישראלי שאתם הכי מאמינים בו כרגע?",
  "הייטק ישראלי - פה להישאר או כדאי לעבור לחו\"ל?",
  "What's the most underrated city in the world?",
  "Does anyone actually enjoy networking events or is it always awkward?",
  "The best investment is investing in your own skills",
  "What's a habit you picked up that improved your life significantly?",
  "Why do we still use email in 2025?",
  "What's a commonly held belief in your industry that you think is wrong?",
  "Sleep is the most important productivity tool and nobody talks about it enough",
  "What's something small that makes your day noticeably better?",
  "The web was more interesting when it was weird",
  "What's the best free resource for learning something new?",
  "Is hustle culture finally dying? I hope so.",
  "What's a question you ask in every job interview?",
  "Why is it so hard to estimate how long software takes to build?",
  "The best products are built by people who use them every day",
  "What's one thing you do every morning that sets you up for the day?",
  "Is Figma still the best design tool or is something better coming?",
  "What's a project you abandoned that you wish you'd finished?",
  "Boring technology is underrated. Pick the boring option.",
  "What's the most important metric for a product at early stage?",
  "Hebrew + English mixed post: אני חושב that the future of tech is bright",
  "What's a startup idea you had that someone else built?",
  "The meeting could have been an email. Always.",
  "What's the best way to give feedback without demoralizing someone?",
  "Why does everyone want to build the next big thing instead of fixing existing problems?",
  "What's a small company doing something genuinely impressive right now?",
  "Code reviews are one of the most valuable things a team can do",
  "What's a feature you love in a product that most people ignore?",
  "Good naming is 50% of software design",
  "What would you work on if money wasn't a factor?",
];

async function postMessage(content) {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) {
      process.stdout.write('.');
    } else {
      process.stdout.write(`\nFailed: ${data.error}\n`);
    }
  } catch (e) {
    process.stdout.write(`\nError: ${e.message}\n`);
  }
}

async function main() {
  console.log(`Seeding ${posts.length} posts to ${URL}`);
  console.log('Progress: ');

  // Send in batches of 5 to avoid hammering the server
  const batchSize = 5;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    await Promise.all(batch.map(postMessage));
    await new Promise(r => setTimeout(r, 300)); // small pause between batches
  }

  console.log(`\nDone! ${posts.length} posts submitted.`);
}

main();
