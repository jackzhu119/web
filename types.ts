
export type Language = 'zh' | 'en';

export interface DrugInfo {
  name: string;
  indications: string;
  dosage: string;
  contraindications: string;
  storage: string;
  sideEffects: string;
  usage_tips: string;
  summary: string;
  isHighRisk: boolean;      // New field: Is this a high-alert medication?
  riskReason: string;       // New field: Why is it high risk?
  // New fields for optimization
  insurance_type?: string;  // e.g., "医保甲类", "医保乙类"
  prescription_type?: string; // e.g., "OTC", "Rx"
  common_interactions?: string[]; // List of common interactions for warning system
}

export interface ConditionDetail {
  name: string;             // 疾病名称 / Condition Name
  probability: string;      // 可能性 / Probability
  explanation: string;      // 解释 / Explanation
  medications: string[];    // 药物 / Medications
  treatments: string[];     // 治疗 / Treatments
}

export interface DiagnosisInfo {
  urgency: 'Low' | 'Medium' | 'High'; 
  urgency_reason: string;    
  summary: string;           
  potential_conditions: ConditionDetail[]; 
  lifestyle_advice: string;  
}

export interface Article {
  id: string;
  title: string;
  snippet: string;
  category: string;
  readTime: string;
}

export interface Reminder {
  id: string;
  medication: string;
  time: string; // Format "HH:mm"
  days: string[]; // e.g., ["Mon", "Tue"]
  enabled: boolean;
}

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  allergies: string;
  conditions: string;
}

export enum AppMode {
  HOME = 'HOME',
  RESULT = 'RESULT',
  DIAGNOSIS_RESULT = 'DIAGNOSIS_RESULT'
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

// Web Speech API Types
export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}
