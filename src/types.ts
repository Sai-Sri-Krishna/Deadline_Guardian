/**
 * Last Minute Life Saver - Types
 */

export interface Task {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  deadline: string; // ISO date string
  estimatedEffort: number; // in hours
  spentEffort: number; // in hours
  status: 'pending' | 'in_progress' | 'completed';
  completedAt: string | null;

  // AI-Generated insights
  aiAnalysis?: AIAnalysis;
  rescuePlan?: RescuePlan | null; // active if risk is high / completion probability < 50%
}

export interface AIAnalysis {
  analyzedAt: string;
  
  // Agent 1: Task Analysis
  summary: string;
  estimatedHours: number;
  complexityScore: number; // 0 to 10
  category: string;

  // Agent 2: Priority
  priorityScore: number; // 0 to 100
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Critical';

  // Agent 3 & Innovation: Risk & Deadline Failure Prediction
  riskLevel: 'Low' | 'Medium' | 'High';
  riskReasoning: string;
  completionProbability: number; // 0 to 100 percentage

  // Agent 4: Planning
  dayWisePlan: Array<{
    day: string;
    tasks: string[];
    estimatedDuration: string;
    milestone: string;
  }>;
  milestones: string[];
  
  // Extra recommendations
  nextRecommendedAction: string;
  productivitySuggestions: string[];
}

export interface RescuePlan {
  generatedAt: string;
  
  // Agent 5: Rescue & Recovery
  hourByHourRecovery: Array<{
    hour: string;
    action: string;
    priority: 'Critical' | 'High' | 'Medium';
  }>;
  criticalActionList: string[];
  rescueReasoning: string;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  deadlinesMet: number;
  deadlinesMissed: number;
  averageProductivityScore: number; // 0 to 100 based on deadlines met and priority completion
  weeklyCompletionTrend: Array<{ name: string; completed: number; total: number }>;
}
