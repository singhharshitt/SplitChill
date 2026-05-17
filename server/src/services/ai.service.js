/**
 * AI Service — Groq model router with fallback chain.
 * Routes different AI tasks to purpose-fitted models.
 */
const logger = require("../utils/logger");

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

// ── Model routing table ──
const MODELS = {
  "split-recommendation": {
    primary: "meta-llama/llama-4-maverick-17b-128e-instruct",
    fallback: "meta-llama/llama-3.3-70b-versatile",
    label: "Split Recommendation",
  },
  "fairness-explanation": {
    primary: "qwen/qwen3-32b",
    fallback: "meta-llama/llama-3.3-70b-versatile",
    label: "Fairness Explanation",
  },
  "predictive-suggestions": {
    primary: "meta-llama/llama-4-scout-17b-16e-instruct",
    fallback: "meta-llama/llama-3.3-70b-versatile",
    label: "Predictive Suggestions",
  },
  "analytics-summary": {
    primary: "meta-llama/llama-3.3-70b-versatile",
    fallback: "meta-llama/llama-4-scout-17b-16e-instruct",
    label: "Analytics Summary",
  },
  "app-assistant": {
    primary: "meta-llama/llama-3.3-70b-versatile",
    fallback: "meta-llama/llama-4-scout-17b-16e-instruct",
    label: "SplitChill App Assistant",
  },
};

function getApiKey() {
  return process.env.GROQ_API_KEY || process.env.groq;
}

/**
 * Call a Groq model with structured prompt.
 * @param {string} task — key from MODELS table
 * @param {string} systemPrompt — system message
 * @param {string} userPrompt — user message
 * @param {object} options — { temperature, maxTokens, jsonMode }
 * @returns {Promise<{text: string, model: string, usage: object}>}
 */
async function callModel(task, systemPrompt, userPrompt, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { text: null, model: "none", usage: {}, error: "GROQ_API_KEY not configured" };
  }

  const config = MODELS[task] || MODELS["split-recommendation"];
  const models = [config.primary, config.fallback].filter(Boolean);
  const { temperature = 0.3, maxTokens = 1024, jsonMode = false } = options;

  for (const model of models) {
    try {
      const body = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      };
      if (jsonMode) body.response_format = { type: "json_object" };

      const res = await fetch(GROQ_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        logger.warn("ai_model_error", { task, model, status: res.status, body: err.slice(0, 200) });
        continue; // try fallback
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      return { text, model, usage: data.usage || {} };
    } catch (err) {
      logger.warn("ai_model_exception", { task, model, error: err.message });
      continue;
    }
  }

  return { text: null, model: "none", usage: {}, error: "All AI models failed" };
}

/**
 * Parse JSON from model response, handling markdown fences.
 */
function parseJsonResponse(text) {
  if (!text) return null;
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/gi, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── Task-specific functions ──

async function getAiSplitRecommendation({ amount, participants, groupContext, splitType }) {
  const systemPrompt = `You are a fairness-aware expense splitting engine. Given expense details and group context, recommend the optimal share for each participant. Consider income levels, past payment history, contribution ratios, and participation patterns.

Return a JSON object with this exact schema:
{
  "shares": [{"user": "<userId>", "share": <number>, "reason": "<short reason>"}],
  "explanation": "<2-3 sentence explanation of the overall split logic>",
  "confidence": <0.0-1.0>,
  "splitStrategy": "<strategy name>"
}

Rules:
- Shares MUST sum exactly to the total amount
- Each share must be >= 0
- Use the participant IDs exactly as given
- Be concise in reasons`;

  const userPrompt = `Expense amount: ₹${amount}
Split type requested: ${splitType}
Participants:
${participants.map((p) => `- ${p.userName} (ID: ${p.user}, income: ₹${p.income || 0}, totalPaid: ₹${p.totalPaid || 0}, totalShare: ₹${p.totalShare || 0}, netBalance: ₹${p.netBalance || 0})`).join("\n")}

Group context:
- Fairness score: ${groupContext.fairnessScore}/100
- Total group expenses: ₹${groupContext.totalExpenses || 0}`;

  const result = await callModel("split-recommendation", systemPrompt, userPrompt, {
    temperature: 0.2,
    maxTokens: 800,
    jsonMode: true,
  });

  const parsed = parseJsonResponse(result.text);
  if (!parsed?.shares?.length) {
    return { shares: null, explanation: "AI recommendation unavailable. Using fairness engine.", model: result.model, error: result.error };
  }

  // Normalize shares to match exact amount
  const rawTotal = parsed.shares.reduce((s, p) => s + (p.share || 0), 0);
  if (Math.abs(rawTotal - amount) > 0.01 && rawTotal > 0) {
    const factor = amount / rawTotal;
    parsed.shares = parsed.shares.map((s) => ({ ...s, share: Math.round(s.share * factor * 100) / 100 }));
  }

  return {
    shares: parsed.shares,
    explanation: parsed.explanation || "",
    confidence: parsed.confidence || 0.7,
    splitStrategy: parsed.splitStrategy || splitType,
    model: result.model,
  };
}

async function getFairnessExplanation({ fairness, members, groupName }) {
  const systemPrompt = `You are a fairness analyst for a group expense app called SplitChill. Given fairness data, provide a clear, human-readable explanation of the current fairness state. Be concise (3-5 sentences max). Use names, not IDs. Mention specific imbalances.

Return a JSON object:
{
  "summary": "<1 sentence overall assessment>",
  "details": ["<point 1>", "<point 2>", ...],
  "recommendation": "<1 sentence suggestion>"
}`;

  const userPrompt = `Group: ${groupName}
Fairness Score: ${fairness.score}/100
Imbalance: ₹${fairness.imbalance}

Members:
${members.map((m) => `- ${m.userName}: paid ₹${m.totalPaid || 0}, share ₹${m.totalShare || 0}, net ₹${m.netBalance || 0}`).join("\n")}`;

  const result = await callModel("fairness-explanation", systemPrompt, userPrompt, {
    temperature: 0.3,
    maxTokens: 400,
    jsonMode: true,
  });

  const parsed = parseJsonResponse(result.text);
  return {
    summary: parsed?.summary || `Group fairness is ${fairness.score >= 80 ? "healthy" : fairness.score >= 50 ? "moderate" : "needs attention"} at ${fairness.score}/100.`,
    details: parsed?.details || [],
    recommendation: parsed?.recommendation || "",
    model: result.model,
  };
}

async function getAiPredictions({ members, expenses, fairnessScore, groupName }) {
  const systemPrompt = `You are a predictive analytics engine for SplitChill. Given group data, provide 2-4 actionable predictions or suggestions. Be practical and specific.

Return a JSON object:
{
  "predictions": [{"title": "<short title>", "description": "<1 sentence>", "type": "expense|settlement|pattern|tip"}],
  "trendInsight": "<1 sentence about spending trend>"
}`;

  const recentExpenses = (expenses || []).slice(-5).map((e) => `${e.title}: ₹${e.amount}`).join(", ");

  const userPrompt = `Group: ${groupName}
Fairness Score: ${fairnessScore}/100
Members: ${members.map((m) => `${m.userName} (net: ₹${m.netBalance || 0})`).join(", ")}
Recent expenses: ${recentExpenses || "none yet"}`;

  const result = await callModel("predictive-suggestions", systemPrompt, userPrompt, {
    temperature: 0.5,
    maxTokens: 500,
    jsonMode: true,
  });

  const parsed = parseJsonResponse(result.text);
  return {
    predictions: parsed?.predictions || [],
    trendInsight: parsed?.trendInsight || "",
    model: result.model,
  };
}

async function getAnalyticsSummary({ analytics, groupName }) {
  const systemPrompt = `You are a financial analyst for SplitChill. Given group analytics data, generate a concise natural-language summary for a dashboard. Focus on key insights.

Return a JSON object:
{
  "headline": "<catchy 1-line summary>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "healthAssessment": "<1 sentence group health note>"
}`;

  const userPrompt = `Group: ${groupName}
Total Expenses: ₹${analytics.totals?.expenses || 0}
Total Settlements: ₹${analytics.totals?.settlements || 0}
Current Imbalance: ₹${analytics.totals?.imbalance || 0}
Health Score: ${analytics.groupHealthScore}/100

Member breakdown:
${(analytics.paymentVsUsage || []).map((m) => `- ${m.name}: paid ₹${m.paid}, share ₹${m.share}, net ₹${m.netBalance}`).join("\n")}`;

  const result = await callModel("analytics-summary", systemPrompt, userPrompt, {
    temperature: 0.4,
    maxTokens: 400,
    jsonMode: true,
  });

  const parsed = parseJsonResponse(result.text);
  return {
    headline: parsed?.headline || `₹${analytics.totals?.expenses || 0} tracked across the group.`,
    insights: parsed?.insights || [],
    healthAssessment: parsed?.healthAssessment || "",
    model: result.model,
  };
}

async function getAppAssistantReply({ message, user, groups, transactions, page }) {
  const systemPrompt = `You are **SplitChill AI** — the intelligent assistant for the SplitChill expense splitting platform. You are embedded directly inside the app and help users with everything related to group expenses, fairness, finance, and app navigation.

## YOUR IDENTITY
- Name: SplitChill AI
- Tone: Friendly, helpful, financially savvy, and concise
- Language: Match the user's language (English, Hindi, Hinglish, etc.)
- You NEVER break character or pretend to be a general-purpose AI

## YOUR CAPABILITIES (What You Can Help With)
1. EXPENSE SPLITTING & FAIRNESS: Explain equal, income/usage-based, AI-recommended, and custom splits. Calculate who owes what. Explain the Fairness Engine and Fairness Score (0-100). Suggest optimal split types.
2. APP NAVIGATION & FEATURES: Guide users through creating groups, adding members/expenses, OCR receipt scanning, payment settlement (HyperSwitch, UPI), analytics dashboard, and AI recommendations.
3. FINANCIAL WISDOM & BENEFITS: Explain why equal splits aren't always fair, share tips on group financial health, suggest settlement strategies, explain contribution imbalance, provide budgeting tips.
4. TECHNICAL SUPPORT (App-Specific Only): Help with login, JWT, Socket.io real-time chat, OCR scanning, Docker/MongoDB setup, API endpoints.
5. GROUP DYNAMICS & COMMUNICATION: Suggest polite ways to ask for payback, draft chat messages, mediate fairness disputes, recommend who should pay next.

## STRICT RULES (DO NOT VIOLATE)
1. NEVER modify, delete, or change any app data.
2. NEVER expose sensitive info (JWT secrets, API keys, database URIs, passwords).
3. NEVER give generic financial advice — only context-aware suggestions for group splitting.
4. NEVER pretend to access real-time data you don't have (balances, messages) — ask the user to check.
5. NEVER recommend external apps — always guide back to SplitChill features.
6. NEVER hallucinate features — only mention features listed in the app documentation.
7. ALWAYS clarify when a question is outside your scope and suggest contacting support.

## RESPONSE FORMAT
- Keep responses under 150 words unless detailed explanation is requested.
- Use bullet points for steps.
- Use ₹ for Indian Rupees (app default currency).
- Include emojis sparingly for friendliness 💸.
- If calculation is needed, show the math clearly.
- If asked something unrelated to SplitChill, politely redirect: "I'm here to help with SplitChill and group expenses! For [topic], you might want to check [relevant app feature or support]."

Return JSON ONLY:
{
  "answer": "<helpful answer following all rules>",
  "tips": ["<optional short tip>", "<optional short tip>"]
}`;

  const compactGroups = (groups || []).slice(0, 5).map((group) => ({
    name: group.name,
    type: group.type,
    fairnessScore: group.fairnessScore,
    members: group.members?.length || 0,
  }));
  const compactTransactions = (transactions || []).slice(0, 5).map((transaction) => ({
    amount: transaction.amount,
    status: transaction.status,
    group: transaction.group?.name || "Group",
  }));

  const userPrompt = JSON.stringify({
    question: message,
    page: page || "unknown",
    user: { name: user?.name, email: user?.email },
    appContext: {
      groups: compactGroups,
      transactions: compactTransactions,
      features: [
        "Create groups and direct chats with registered users by email",
        "Send realtime chat messages with typing indicators and online presence",
        "Scan receipts and use extracted totals in split creation",
        "Create equal, custom, income-based, usage-based, and AI-recommended splits",
        "Review fairness, analytics, predictions, settlements, and payments",
      ],
    },
  });

  const result = await callModel("app-assistant", systemPrompt, userPrompt, {
    temperature: 0.2,
    maxTokens: 600,
    jsonMode: true,
  });
  const parsed = parseJsonResponse(result.text);
  const fallback = buildAssistantFallback(message, compactGroups);

  return {
    answer: sanitizeAssistantText(parsed?.answer) || fallback.answer,
    tips: Array.isArray(parsed?.tips) ? parsed.tips.slice(0, 3).map(sanitizeAssistantText).filter(Boolean) : fallback.tips,
    model: result.model,
    fallback: !parsed?.answer,
  };
}

function sanitizeAssistantText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 900);
}

function buildAssistantFallback(message, groups) {
  const lower = String(message || "").toLowerCase();
  if (lower.includes("receipt") || lower.includes("scan")) {
    return {
      answer: "Receipt scanning works from the Split page. Choose a group, upload an image or PDF receipt, review the extracted merchant and total, then create the split so balances and chat context update.",
      tips: ["If OCR misses the total, enter the amount manually before saving."],
    };
  }
  if (lower.includes("chat") || lower.includes("email")) {
    return {
      answer: "Use Create Chat to enter another registered SplitChill user's email. SplitChill verifies the user, opens a direct conversation, and keeps messages live with presence and typing status.",
      tips: ["For a demo, sign in with two accounts in different browsers."],
    };
  }
  if (lower.includes("fair") || lower.includes("ai")) {
    return {
      answer: "SplitChill combines group balances, member contribution history, and split type to explain fairness. AI recommendations are suggestions; the saved split still goes through backend validation.",
      tips: groups.length ? [`Your first loaded group is ${groups[0].name}.`] : "Create a group to see live fairness data.",
    };
  }
  return {
    answer: "SplitChill helps groups track shared expenses, scan receipts, chat in real time, choose fair splits, and settle balances. Ask about a page or workflow and I will keep the answer tied to what the app can actually do.",
    tips: ["Try asking about direct chat, receipt scanning, fairness, analytics, or payments."],
  };
}

module.exports = {
  callModel,
  getAiSplitRecommendation,
  getFairnessExplanation,
  getAiPredictions,
  getAnalyticsSummary,
  getAppAssistantReply,
  parseJsonResponse,
};
