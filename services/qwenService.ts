
import { DrugInfo, DiagnosisInfo, Language } from "../types";

const API_KEY = process.env.API_KEY;

// Proxies defined in vite.config.ts / vercel.json
const TEXT_API_URL = "/api/qwen/text"; 
const VL_API_URL = "/api/qwen/multimodal";

// --- Helper Functions ---

const extractJSON = (text: string) => {
    try {
        // 1. Try to find JSON block wrapped in markdown
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) return JSON.parse(jsonMatch[1]);
        
        // 2. Try to find the first '{' and last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
             return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
        
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error", e, text);
        throw new Error("Failed to parse AI response.");
    }
};

const callQwenText = async (messages: any[], model: string = 'qwen-plus') => {
    if (!API_KEY) throw new Error("API Key is missing");
  
    try {
      const response = await fetch(TEXT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          input: { messages: messages },
          parameters: { result_format: 'message' } 
        })
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Qwen API Error");
      }
  
      const data = await response.json();
      return data.output.choices[0].message.content;
    } catch (error) {
      console.error("Qwen Service Error:", error);
      throw error;
    }
};

const callQwenVL = async (messages: any[]) => {
    if (!API_KEY) throw new Error("API Key is missing");
  
    try {
      const response = await fetch(VL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-WorkSpace': 'modal'
        },
        body: JSON.stringify({
          model: 'qwen-vl-max', // Using VL-Max for better recognition
          input: { messages: messages },
          parameters: {}
        })
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Qwen VL API Error");
      }
  
      const data = await response.json();
      // Qwen VL structure is slightly different
      return data.output.choices[0].message.content[0].text; 
    } catch (error) {
      console.error("Qwen VL Service Error:", error);
      throw error;
    }
};

// --- System Prompts ---

const getSystemPrompt = (lang: Language, type: 'DRUG' | 'DIAGNOSIS') => {
    const langInstruction = lang === 'zh' ? 'Output strictly in SIMPLIFIED CHINESE.' : 'Output strictly in ENGLISH.';

    if (type === 'DRUG') {
      return `You are a senior clinical pharmacist and medical expert. 
      Analyze the input (which can be a drug name, a medical treatment, or a therapy) and generate a detailed structured JSON object.
      
      CRITICAL SAFETY CHECK:
      Analyze if this item is considered "High Risk" or "High Alert" (e.g., Antibiotics, Opioids, Anticoagulants, Insulin, or invasive procedures).
      If yes, set "isHighRisk" to true and explain why in "riskReason".

      JSON Schema:
      {
        "name": "Official Name of Drug/Treatment",
        "indications": "Detailed Indications (What is it used for?)",
        "dosage": "Detailed Dosage or Usage Instructions (How to use/perform it?)",
        "contraindications": "Contraindications & Warnings (When NOT to use it?)",
        "storage": "Storage Instructions or Duration of Therapy",
        "sideEffects": "Potential Side Effects or Risks",
        "usage_tips": "3-5 professional tips for best results",
        "summary": "A comprehensive 150-word summary explaining what this is and how it works.",
        "isHighRisk": boolean,
        "riskReason": "Short warning string if applicable",
        "insurance_type": "医保甲类/乙类/自费 (or equivalent)",
        "prescription_type": "OTC/Rx (or equivalent)",
        "common_interactions": ["List of 3-5 common drug/food interactions"]
      }
      
      ${langInstruction} Return ONLY valid JSON. Do not include markdown formatting if possible.`;
    } else {
      return `You are an expert General Practitioner with 20 years of experience. 
      Perform a COMPREHENSIVE differential diagnosis based on the user's symptoms.
      
      IMPORTANT: 
      1. The "summary" should be detailed (around 200 words), explaining the potential pathology and logic behind the diagnosis. 
      2. The "explanation" for each condition should be deep and educational.
      3. For "medications" and "treatments", provide specific, standard OTC names or standard physical therapies.
      
      JSON Schema:
      {
        "urgency": "Low/Medium/High",
        "urgency_reason": "Detailed medical reason for this urgency level",
        "summary": "Detailed medical summary (200 words) of the analysis",
        "potential_conditions": [
          { 
            "name": "Condition Name", 
            "probability": "High/Med/Low", 
            "explanation": "Detailed reasoning why this condition is suspected", 
            "medications": ["Specific Med 1", "Specific Med 2"], 
            "treatments": ["Specific Therapy 1", "Specific Action 2"] 
          }
        ],
        "lifestyle_advice": "Comprehensive lifestyle and dietary advice"
      }
      
      ${langInstruction} Return ONLY valid JSON.`;
    }
};

// --- Exported Methods ---

export const getDrugInfoFromText = async (query: string, lang: Language): Promise<DrugInfo> => {
    const prompt = getSystemPrompt(lang, 'DRUG');
    const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: query }
    ];
    const text = await callQwenText(messages);
    return extractJSON(text) as DrugInfo;
};

export const getDrugInfoFromImage = async (base64Image: string, lang: Language): Promise<DrugInfo> => {
    // Qwen VL Max handles base64 data URIs
    const prompt = getSystemPrompt(lang, 'DRUG');
    const messages = [
        {
            role: 'user',
            content: [
                { image: base64Image },
                { text: prompt + (lang === 'zh' ? "\n请识别图片中的药品并输出JSON。" : "\nIdentify drug and output JSON.") }
            ]
        }
    ];
    const text = await callQwenVL(messages);
    return extractJSON(text) as DrugInfo;
};

export const analyzeSymptoms = async (symptoms: string, base64Image: string | undefined, lang: Language): Promise<DiagnosisInfo> => {
    const prompt = getSystemPrompt(lang, 'DIAGNOSIS');
    const symptomText = symptoms.trim() || (lang === 'zh' ? "无文字描述" : "No text provided");

    if (base64Image) {
        const messages = [
            {
                role: 'user',
                content: [
                    { image: base64Image },
                    { text: prompt + `\nUser Symptoms: ${symptomText}` }
                ]
            }
        ];
        const text = await callQwenVL(messages);
        return extractJSON(text) as DiagnosisInfo;
    } else {
        const messages = [
            { role: 'system', content: prompt },
            { role: 'user', content: symptomText }
        ];
        const text = await callQwenText(messages);
        return extractJSON(text) as DiagnosisInfo;
    }
};

export const askFollowUpQuestion = async (context: string, question: string, lang: Language): Promise<string> => {
    const systemPrompt = lang === 'zh' 
      ? "你是一位友善、专业的医疗助手。请根据提供的JSON上下文回答追问。回答要简洁（100字以内），安抚用户情绪。"
      : "You are a friendly, professional medical assistant. Answer based on context. Keep it concise (under 100 words) and reassuring.";
  
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context JSON:\n${context}\n\nUser Question: ${question}` }
    ];
  
    return await callQwenText(messages, 'qwen-plus');
};
