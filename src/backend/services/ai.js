const express = require('express');
/*const OpenAI = require('openai');
const router = express.Router();*/
const Groq = require('groq-sdk');
const router = express.Router();

/*const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    throw new Error('OPENAI_API_KEY is missing or invalid. Please set it in your environment.');
  }

  return new OpenAI({ apiKey });
};*/

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    throw new Error('GROQ_API_KEY is missing or invalid. Please set it in your environment.');
  }
  return new Groq({ apiKey });
};

// @desc    Generate interview questions
// @route   POST /api/ai/generate-questions
// @access  Private
router.post('/generate-questions', async (req, res) => {
  try {
    const { type, subType, difficulty, experience, jobTitle, skills } = req.body;

    const prompt = `Generate 5 interview questions for a ${experience} level ${jobTitle} position.
    
    Interview Type: ${type}
    Sub-Type: ${subType}
    Difficulty: ${difficulty}
    Candidate Skills: ${skills?.join(', ') || 'Not specified'}
    
    Requirements:
    1. Each question should be challenging but appropriate for the experience level
    2. Include a mix of theoretical and practical questions
    3. Questions should test both knowledge and problem-solving abilities
    4.Make sure questions are relevant only to the specified interview type and sub-type
    5. Return in JSON format with the following structure:
    {
      "questions": [
        {
          "id": "unique_id",
          "question": "question text",
          "type": "text/code/system-design",
          "difficulty": "easy/medium/hard",
          "category": "category",
          "timeLimit": 300,
          "keyPoints": ["point1", "point2"],
          "followUps": [
            {
              "question": "follow-up question",
              "trigger": "when to ask this"
            }
          ]
        }
      ]
    }`;

    //const openai = getOpenAIClient();
    const groq = getGroqClient();

    /*const completion = await openai.chat.completions.create({
      model: "gpt-4",*/
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer who creates challenging and relevant interview questions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    //const questions = JSON.parse(completion.choices[0].message.content);
    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(raw);
    
    res.status(200).json({
      success: true,
      questions: questions.questions
    });
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions'
    });
  }
});

// @desc    Evaluate answer
// @route   POST /api/ai/evaluate-answer
// @access  Private
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { question, answer, type, difficulty } = req.body;

    const prompt = `Evaluate the following interview answer:
    
    Question: ${question}
    Answer: ${answer}
    Type: ${type}
    Difficulty: ${difficulty}
    
    Provide a comprehensive evaluation in JSON format:
    {
      "score": 85,
      "correctness": 90,
      "clarity": 80,
      "depth": 85,
      "structure": 85,
      "feedback": "Overall feedback here",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "improvementTips": ["tip1", "tip2"]
    }
    
    Scoring criteria:
    - Score: 0-100 overall
    - Correctness: Technical accuracy
    - Clarity: How clear and understandable
    - Depth: Level of detail and insight
    - Structure: Organization and coherence`;

    //const openai = getOpenAIClient();
    const groq = getGroqClient();

    /*const completion = await openai.chat.completions.create({
      model: "gpt-4",*/
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer evaluating candidate responses. Be constructive and specific."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    //const evaluation = JSON.parse(completion.choices[0].message.content);
    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const evaluation = JSON.parse(raw);
    
    res.status(200).json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error('Answer evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate answer'
    });
  }
});

// @desc    Generate follow-up question
// @route   POST /api/ai/follow-up
// @access  Private
router.post('/follow-up', async (req, res) => {
  try {
    const { originalQuestion, answer, conversationHistory } = req.body;

    const prompt = `Based on the conversation below, generate a relevant follow-up question:
    
    Original Question: ${originalQuestion}
    Candidate's Answer: ${answer}
    Previous Conversation: ${conversationHistory?.slice(-2).map(c => `${c.role}: ${c.content}`).join('\n') || 'None'}
    
    Generate a follow-up question that:
    1. Tests deeper understanding
    2. Is relevant to the candidate's response
    3. Challenges the candidate appropriately
    4. Maintains the interview flow
    
    Return in JSON format:
    {
      "followUp": "question text",
      "reason": "why this follow-up is relevant"
    }`;

    //const openai = getOpenAIClient();
    const groq = getGroqClient();

    /*const completion = await openai.chat.completions.create({
      model: "gpt-4",*/
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert interviewer who asks thoughtful follow-up questions based on candidate responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    //const followUp = JSON.parse(completion.choices[0].message.content);
    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const followUp = JSON.parse(raw);
    
    res.status(200).json({
      success: true,
      followUp: followUp.followUp,
      reason: followUp.reason
    });
  } catch (error) {
    console.error('Follow-up generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate follow-up question'
    });
  }
});

// @desc    Behavioral analysis
// @route   POST /api/ai/behavioral-analysis
// @access  Private
router.post('/behavioral-analysis', async (req, res) => {
  try {
    const { answer, timeTaken, wordCount } = req.body;

    const prompt = `Analyze the behavioral aspects of this interview answer:
    
    Answer: ${answer}
    Time Taken: ${timeTaken} seconds
    Word Count: ${wordCount}
    
    Analyze and return in JSON format:
    {
      "confidence": 85,
      "organization": 90,
      "conciseness": 75,
      "communication": 85,
      "insights": {
        "confidence": "Shows good confidence in their response",
        "organization": "Well-structured and logical flow",
        "conciseness": "Could be more concise in some areas",
        "communication": "Clear and articulate"
      }
    }
    
    Scoring (0-100):
    - Confidence: How confident the response sounds
    - Organization: Structure and logical flow
    - Conciseness: Efficiency of communication
    - Communication: Clarity and articulation`;

    //const openai = getOpenAIClient();
    const groq = getGroqClient();

    /*const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",*/
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert behavioral analyst evaluating interview responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    //const analysis = JSON.parse(completion.choices[0].message.content);
    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(raw);
    
    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Behavioral analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message?.includes('OPENAI_API_KEY')
        ? error.message
        : 'Failed to analyze behavior'
    });
  }
});

// @desc    Generate interview report
// @route   POST /api/ai/generate-report
// @access  Private
router.post('/generate-report', async (req, res) => {
  try {
    const { interviewType, difficulty, overallScore, evaluations } = req.body;

    const prompt = `Generate a comprehensive interview report based on this data:
    Interview Type: ${interviewType}
    Difficulty: ${difficulty}
    Overall Score: ${overallScore}
    Evaluations: ${JSON.stringify(evaluations)}
    
    Return this exact JSON structure:
    {
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2"],
      "improvementTips": ["tip1", "tip2", "tip3"],
      "suggestedTopics": ["topic1", "topic2"]
    }`;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert technical interviewer generating performance reports. Respond with valid JSON only. No markdown, no extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const report = JSON.parse(raw);

    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

// @desc    Generate dynamic subtypes for a job title
// @route   POST /api/ai/generate-subtypes
// @access  Public
router.post('/generate-subtypes', async (req, res) => {
  try {
    const { jobTitle, interviewType } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ success: false, message: 'Job title is required' });
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert in job roles and interview preparation. Respond with valid JSON only. No markdown, no extra text."
        },
        {
          role: "user",
          
          /*content: `Generate exactly 3 relevant interview focus areas/subtypes for a "${jobTitle}" position in a "${interviewType}" interview.
          
          These should be specific topics or skills that would actually be tested in a real interview for this exact role.
          
          Return this exact JSON:*/
          content: `
            You generate interview focus areas based on interview type.

            Interview Type Definitions:
              - technical: technical concepts for the associated job title.
              - behavioral: soft skills and behavioral traits related to this job title.
              - hr: human resources and company culture aspects related to this job title.
            Task:
              Generate exactly 3 interview focus areas (subtypes) for:

                Job Title: "${jobTitle}"
                Interview Type: "${interviewType}"

            Rules:
              - The subtypes MUST match ONLY the given interview type
              - Do NOT mix categories from other interview types
              - Make them realistic for real interviews

          Return JSON:
          {
            "subtypes": ["subtype1", "subtype2", "subtype3"]
          }`
        }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    res.status(200).json({ success: true, subtypes: result.subtypes });
  } catch (error) {
    console.error('Subtype generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate subtypes' });
  }
});

module.exports = router;
