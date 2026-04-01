const Anthropic = require('@anthropic-ai/sdk/index.mjs');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * AI language tutor chat — responds in target language with corrections
 */
const tutorChat = async ({ messages, targetLanguage, nativeLanguage, level, topic }) => {
  const system = `You are an expert, encouraging language tutor for ${targetLanguage}.
The student's native language is ${nativeLanguage} and their level is ${level}.
${topic ? `Focus the conversation on the topic: "${topic}".` : ''}

Rules:
1. Respond primarily in ${targetLanguage} with translations in parentheses for new words.
2. Gently correct grammar mistakes inline, e.g. "[Correction: ...]".
3. Ask follow-up questions to keep conversation flowing.
4. Keep responses concise (2-4 sentences).
5. Adjust complexity to the student's level.
6. Be warm, patient, and encouraging — celebrate progress!`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system,
    messages,
  });

  return response.content[0].text;
};

/**
 * Generate a set of flashcards for a given topic/language
 */
const generateFlashcards = async ({ language, topic, level, count = 10 }) => {
  const prompt = `Generate ${count} flashcards for learning ${language} at ${level} level on the topic: "${topic}".

Respond ONLY with a JSON array, no markdown, no preamble:
[
  {
    "front": "word or phrase in ${language}",
    "back": "English translation",
    "phonetic": "pronunciation guide",
    "example": "example sentence in ${language}",
    "difficulty": "Easy|Medium|Hard"
  }
]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
};

/**
 * Generate a lesson with exercises
 */
const generateLesson = async ({ language, level, topic }) => {
  return {
    title: `${topic} in ${language}`,
    description: `Learn ${topic} in ${language} at ${level} level.`,

    content: `
Lesson Topic: ${topic}

1. Introduction:
This lesson introduces ${topic} in ${language}.

2. Key Concepts:
- Basic understanding of ${topic}
- Common phrases and usage

3. Examples:
- Example 1 related to ${topic}
- Example 2 in ${language}

4. Practice:
- Try forming sentences using ${topic}
- Translate simple phrases

5. Summary:
You have learned the basics of ${topic} in ${language}.
    `,

    exercises: [
      `Write 3 sentences using ${topic}`,
      `Translate basic phrases into ${language}`,
      `Practice conversation using ${topic}`
    ]
  };
};

/**
 * Evaluate a free-text translation answer
 */
const evaluateAnswer = async ({ question, userAnswer, correctAnswer, language }) => {
  const prompt = `A student learning ${language} answered a translation question.
Question: "${question}"
Correct answer: "${correctAnswer}"
Student's answer: "${userAnswer}"

Is the student's answer correct or acceptable (allow minor variations)?
Respond ONLY with JSON: { "correct": true/false, "feedback": "short encouraging feedback", "correction": "corrected version if wrong" }`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
};

module.exports = { tutorChat, generateFlashcards, generateLesson, evaluateAnswer };
