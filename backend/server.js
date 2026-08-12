import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen3-8B";
const HF_PROVIDER = process.env.HF_PROVIDER || "nscale";
const hfClient = new InferenceClient(HF_TOKEN);

// Uses Hugging Face Inference Providers. The legacy
// api-inference.huggingface.co endpoint is no longer available.
async function callQwenAPI(prompt) {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured on the server.");
  }

  try {
    const completion = await hfClient.chatCompletion({
      provider: HF_PROVIDER,
      model: HF_MODEL,
      messages: [
        {
          role: "system",
          content:
            "/no_think\nFollow the user's requested output format exactly. Do not add markdown unless asked.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Hugging Face returned an empty response.");
    }
    return text;
  } catch (error) {
    const status = error?.httpResponse?.status;
    const details = error?.httpResponse?.body;
    console.error("Hugging Face API Error:", { message: error.message, status, details });
    throw new Error(
      status
        ? `Hugging Face request failed (${status}): ${typeof details === "string" ? details : JSON.stringify(details)}`
        : `Hugging Face request failed: ${error.message}`
    );
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : "Unknown server error";
}

app.post("/api/evaluate", async (req, res) => {
  try {
    const { question, answer, resume } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: "Question and answer are required.",
      });
    }

    const resumeContext = resume
      ? `The candidate's resume background:\n${resume}\n\n`
      : "";

    const prompt = `${resumeContext}Question: ${question}

Candidate Answer: ${answer}

Evaluate the candidate's answer based on:
- Technical accuracy
- Relevance to their background
- Quality of explanation
- Practical understanding

Give:
1. Score out of 10
2. Short constructive feedback
3. Technical score out of 100
4. Communication score out of 100
5. Problem-solving score out of 100
6. Recommendation line

Return ONLY valid JSON in this exact format:
{
  "score": 8,
  "feedback": "Good explanation. Add a real-world example.",
  "technical": 80,
  "communication": 78,
  "problemSolving": 75,
  "recommendation": "Proceed to the next round"
}`;

    const text = await callQwenAPI(prompt);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return res.json(evaluation);
  } catch (error) {
    console.error("Qwen Evaluation Error:", error);

    return res.status(500).json({
      score: 0,
      feedback: "Unable to evaluate the answer at the moment.",
      error: errorMessage(error),
    });
  }
});

app.post("/api/generate-questions", async (req, res) => {
  try {
    const { resume } = req.body;

    if (!resume) {
      return res.status(400).json({
        error: "Resume text is required.",
      });
    }

    const prompt = `Based on the following resume, generate EXACTLY 10 interview questions.

Resume:
${resume}

Rules:
- Start with an introduction question.
- Ask technical questions related to the candidate's skills.
- Gradually increase difficulty.
- Return ONLY a JSON array of questions.
- No markdown.
- No explanation.

Return ONLY this format:
["Question 1?", "Question 2?", "Question 3?", ...]`;

    const text = await callQwenAPI(prompt);
    
    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const questions = JSON.parse(jsonMatch[0]);

    return res.json({ questions });
  } catch (error) {
    console.error("Qwen Question Generation Error:", error);

    return res.status(500).json({
      error: errorMessage(error),
    });
  }
});

app.post("/api/parse-resume", async (req, res) => {
  try {
    const { resume } = req.body;

    if (!resume || resume.trim().length === 0) {
      return res.status(400).json({
        error: "Resume text is required.",
      });
    }

    const prompt = `Extract key information from this resume and return ONLY valid JSON.

Resume:
${resume}

Return ONLY this exact JSON structure (use "Not available" if information cannot be extracted):
{
  "candidateName": "extracted name or 'Not available'",
  "targetRole": "extracted target role or job title or 'Not available'",
  "skills": ["skill1", "skill2"],
  "experience": "Brief summary",
  "education": ["degree1"],
  "projects": ["project1"],
  "yearsOfExperience": 0
}

CRITICAL: Do not fabricate information. Only extract what is explicitly in the resume.`;

    const text = await callQwenAPI(prompt);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const candidateInfo = JSON.parse(jsonMatch[0]);

    return res.json(candidateInfo);
  } catch (error) {
    console.error("Resume Parsing Error:", error);

    return res.status(500).json({
      error: errorMessage(error),
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Qwen evaluation server running on http://localhost:${PORT}`);
});
