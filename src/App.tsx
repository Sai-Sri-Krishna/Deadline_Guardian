import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  CheckSquare, 
  ChevronRight, 
  ChevronLeft,
  Mic,
  TrendingUp, 
  Compass, 
  LifeBuoy, 
  RefreshCw, 
  ChevronDown, 
  Award,
  Sparkles,
  Zap,
  Check,
  Flame,
  UserCheck,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import Sidebar from './components/Sidebar';
import { Task, AnalyticsSummary } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'planner' | 'rescue' | 'analytics'>('dashboard');
  const theme = 'cyber';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  
  // App UI States
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState<Task | null>(null);
  
  // Task detail toggle states (which task's detailed analysis is expanded)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [selectedPlannerTaskId, setSelectedPlannerTaskId] = useState<string>('');

  // Custom interactive layout states (Calendar Scheduler)
  const [plannerSubTab, setPlannerSubTab] = useState<'roadmap' | 'calendar'>('calendar');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 5, 22)); // Initialize to Monday, June 22, 2026

  // Form states for creating/updating task
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskEstimatedEffort, setTaskEstimatedEffort] = useState(3);
  const [taskSpentEffort, setTaskSpentEffort] = useState(0);
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  // Interactive Checklist states for Rescue Mode critical lists & general actions
  const [completedRescueItems, setCompletedRescueItems] = useState<Record<string, Record<number, boolean>>>({});

  // Fetch initial tasks and analytics summary
  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
  }, []);

  // Set default planner task when tasks change
  useEffect(() => {
    if (tasks.length > 0 && !selectedPlannerTaskId) {
      const activeAnalyses = tasks.filter(t => t.aiAnalysis && t.status !== 'completed');
      if (activeAnalyses.length > 0) {
        setSelectedPlannerTaskId(activeAnalyses[0].id);
      } else {
        setSelectedPlannerTaskId(tasks[0].id);
      }
    }
  }, [tasks, selectedPlannerTaskId]);

  async function fetchTasks() {
    try {
      setLoadingTasks(true);
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function fetchAnalytics() {
    try {
      setLoadingAnalytics(true);
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  // Auto trigger analytics refresh when tasks list changes
  const refreshAll = () => {
    fetchTasks();
    fetchAnalytics();
  };

  // Create Task Submission
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      setActionError("Task Name is required.");
      return;
    }
    if (!taskDeadline) {
      setActionError("Please select a target deadline date and time.");
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const payload = {
        name: taskName,
        description: taskDescription,
        deadline: new Date(taskDeadline).toISOString(),
        estimatedEffort: Number(taskEstimatedEffort),
        clientNow: new Date().toISOString()
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Clear Form and Close Modal
        setTaskName('');
        setTaskDescription('');
        setTaskDeadline('');
        setTaskEstimatedEffort(3);
        setIsNewTaskOpen(false);
        refreshAll();
      } else {
        const errData = await res.json();
        setActionError(errData.error || "Failed to create task.");
      }
    } catch (err) {
      console.error(err);
      setActionError("Error saving task. Please double check back-end API server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Task Progress inline or change Status
  const handleUpdateTaskStatus = async (task: Task, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          clientNow: new Date().toISOString()
        })
      });

      if (res.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Spent hours progress
  const handleUpdateHours = async (task: Task, hours: number) => {
    const safeHours = Math.max(0, hours);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spentEffort: safeHours,
          clientNow: new Date().toISOString()
        })
      });

      if (res.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Re-run AI analysis
  const handleForceAnalyze = async (taskId: string) => {
    try {
      // Show instant indicator in State variables
      setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        aiAnalysis: t.aiAnalysis ? { ...t.aiAnalysis, summary: "Analyzing latest constraints via Gemini..." } : undefined 
      } : t));

      const res = await fetch(`/api/tasks/${taskId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientNow: new Date().toISOString() })
      });

      if (res.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        refreshAll();
        if (selectedPlannerTaskId === taskId) {
          setSelectedPlannerTaskId('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save changes from Edit Task Form
  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingTask) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/tasks/${isEditingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: taskName,
          description: taskDescription,
          deadline: new Date(taskDeadline).toISOString(),
          estimatedEffort: Number(taskEstimatedEffort),
          spentEffort: Number(taskSpentEffort),
          status: taskStatus,
          clientNow: new Date().toISOString()
        })
      });

      if (res.ok) {
        setIsEditingTask(null);
        setTaskName('');
        setTaskDescription('');
        setTaskDeadline('');
        setTaskEstimatedEffort(3);
        setTaskSpentEffort(0);
        refreshAll();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (task: Task) => {
    setIsEditingTask(task);
    setTaskName(task.name);
    setTaskDescription(task.description);
    // Convert store time format back to local datetime picker standard
    const dStr = task.deadline ? new Date(task.deadline).toISOString().substring(0, 16) : '';
    setTaskDeadline(dStr);
    setTaskEstimatedEffort(task.estimatedEffort);
    setTaskSpentEffort(task.spentEffort);
    setTaskStatus(task.status);
  };

  // Calculate high risk active tasks & rescue active tasks (probability < 50%)
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const rescuedTasks = activeTasks.filter(t => {
    if (t.rescuePlan) return true;
    if (t.aiAnalysis && t.aiAnalysis.completionProbability < 50) return true;
    return false;
  });

  // Calculate unique categories for filters
  const categoriesPool = Array.from(new Set(tasks.map(t => t.aiAnalysis?.category).filter(Boolean))) as string[];

  // Filter tasks based on terms & options
  const filteredTasksList = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.aiAnalysis?.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || t.aiAnalysis?.category === filterCategory;
    const matchesRisk = filterRisk === 'All' || t.aiAnalysis?.riskLevel === filterRisk;

    return matchesSearch && matchesCategory && matchesRisk;
  });

  // Format Helper for Hours Countdown
  const getHoursRemainingStr = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diff <= 0) return "Overdue";
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) {
      return `${hours.toFixed(1)} hrs left`;
    }
    const days = Math.floor(hours / 24);
    const rem = Math.round(hours % 24);
    return `${days}d ${rem}h left`;
  };

  const getUrgencyBadge = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diff <= 0) return "bg-rose-100 text-rose-800 border border-rose-200 font-bold";
    const hours = diff / (1000 * 60 * 60);
    if (hours < 12) return "bg-red-100 text-red-800 border border-red-200 font-black animate-pulse";
    if (hours < 36) return "bg-amber-100 text-amber-800 border border-amber-200 font-bold";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  // Toggle Rescue Mode custom action checkpoints local state helper
  const handleToggleRescueCheck = (taskId: string, index: number) => {
    setCompletedRescueItems(prev => {
      const taskChecks = prev[taskId] || {};
      return {
        ...prev,
        [taskId]: {
          ...taskChecks,
          [index]: !taskChecks[index]
        }
      };
    });
  };

  // Selected Task for detailed AI Planner views
  const selectedPlannerTask = tasks.find(t => t.id === selectedPlannerTaskId);

  // Stats calculation for the Professional Polish Overview
  const activeTasksCountStr = activeTasks.length.toString().padStart(2, '0');
  const metDeadlinesRateStr = analytics ? `${analytics.deadlinesMet > 0 ? Math.round((analytics.deadlinesMet / (analytics.deadlinesMet + analytics.deadlinesMissed || 1)) * 100) : 100}%` : '92%';
  const rescueEventsCountStr = rescuedTasks.length.toString().padStart(2, '0');
  
  // Calculate saved hours - estimate that each task rescued saves about 4 hours, plus 10 baseload savings
  const savedTimeEst = activeTasks.reduce((sum, t) => {
    if (t.aiAnalysis && t.aiAnalysis.completionProbability < 50) {
      return sum + (t.estimatedEffort * 0.4);
    }
    return sum + (t.spentEffort * 0.2);
  }, 10).toFixed(1);

  return (
    <div className={`theme-${theme} theme-app-bg flex font-sans min-h-screen overflow-x-hidden pb-16 md:pb-0`}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        taskCount={activeTasks.length} 
        rescueCount={rescuedTasks.length} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-20 theme-header border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs sticky top-0 z-10 shrink-0 select-none">
          <div className="min-w-0 pr-2">
            <h1 className="text-sm sm:text-lg md:text-xl font-black theme-text-title flex items-center gap-1.5 font-display uppercase tracking-tight truncate">
              {activeTab === 'dashboard' && 'Operational Dashboard'}
              {activeTab === 'tasks' && 'Task Vault & Controls'}
              {activeTab === 'planner' && 'AI Planner'}
              {activeTab === 'rescue' && 'Rescue Control Center'}
              {activeTab === 'analytics' && 'Operational Metrics'}
            </h1>
            <p className="text-[10px] sm:text-xs text-[var(--text-sub)] font-semibold truncate max-w-[280px] sm:max-w-md">
              {activeTab === 'dashboard' && 'Real-time countdown timelines and predictions.'}
              {activeTab === 'tasks' && 'Configure and audit deadlines and actions.'}
              {activeTab === 'planner' && 'Step-by-step action sequences curated dynamically.'}
              {activeTab === 'rescue' && 'Emergency recovery schedules triggered live.'}
              {activeTab === 'analytics' && 'A comprehensive view of velocity benchmarks.'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button 
              onClick={refreshAll}
              title="Sync backend metrics"
              className="p-1.5 sm:p-2.5 text-[var(--text-sub)] hover:text-slate-605 border border-[var(--border-main)] theme-card rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin-hover" />
            </button>

            <div className="text-right hidden lg:block">
              <p className="text-[9px] font-black text-[var(--text-sub)] uppercase tracking-wider leading-none">Productivity</p>
              <p className="text-xs font-black text-[var(--primary-color)]">
                {analytics?.averageProductivityScore || 84}%
              </p>
            </div>

            <button 
              onClick={() => {
                setIsEditingTask(null);
                setIsNewTaskOpen(true);
              }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 theme-primary-btn text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1 sm:gap-2"
              id="new-task-trigger"
            >
              <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </header>

        {/* Global Banner for Urgent Rescue cases if on Dashboard */}
        {rescuedTasks.length > 0 && (
          <div className="bg-rose-50/90 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-950/45 px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-[10px] sm:text-xs font-semibold text-center sm:text-left">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce flex-shrink-0" />
              <span>
                CRITICAL THREAT: You have <strong>{rescuedTasks.length}</strong> task(s) whose completion probability falls below 50%! Rescue blueprints generated.
              </span>
            </div>
            <button 
              onClick={() => setActiveTab('rescue')} 
              className="px-2.5 py-1 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-md hover:bg-rose-700 shadow-sm transition self-stretch sm:self-auto text-center"
            >
              Rescue Desk
            </button>
          </div>
        )}

        {/* Main Fluid Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto block" id="main-scrollable-content">

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6" id="dashboard-tab-content">
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                
                {/* Stat 1 */}
                <div onClick={() => setActiveTab('tasks')} className="theme-card border p-4 sm:p-5 rounded-xl shadow-xs hover:border-[var(--primary-color)] transition-all cursor-pointer">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-sub)] block">Active Tasks</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-2xl sm:text-3xl font-black text-[var(--text-title)] tracking-tight font-display">{activeTasksCountStr}</p>
                    <span className="text-2xs bg-[var(--badge-bg)] text-[var(--badge-text)] font-bold px-2 py-0.5 rounded-full border border-[var(--border-sub)]">Task Vault</span>
                  </div>
                </div>

                {/* Stat 2 */}
                <div onClick={() => setActiveTab('analytics')} className="theme-card border p-4 sm:p-5 rounded-xl shadow-xs hover:border-[var(--primary-color)] transition-all cursor-pointer">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-sub)] block">Met Deadlines</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-2xl sm:text-3xl font-black text-emerald-500 tracking-tight font-display">{metDeadlinesRateStr}</p>
                    <span className="text-2xs bg-emerald-500/10 text-emerald-550 dark:text-emerald-450 font-bold px-2 py-0.5 rounded-full border border-emerald-550/20">Live Metric</span>
                  </div>
                </div>

                {/* Stat 3 */}
                <div onClick={() => setActiveTab('rescue')} className="theme-card border p-4 sm:p-5 rounded-xl shadow-xs hover:border-rose-400 transition-all cursor-pointer">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-sub)] block">Rescue Events</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tight font-display">{rescueEventsCountStr}</p>
                    <span className="text-2xs bg-rose-500/10 text-rose-600 dark:text-rose-450 font-bold px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">Critical</span>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-[var(--primary-color)] p-4 sm:p-5 rounded-xl shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-2 translate-x-2">
                    <Clock className="w-20 h-20 text-white" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/80 block">Est. Saved Time</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">{savedTimeEst}h</p>
                    <span className="text-2xs bg-white/10 text-white font-bold px-2 py-0.5 rounded-full">Heuristics</span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Timeline and AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Execution Roadmap (8-cols) */}
                <div className="lg:col-span-8 theme-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  
                  <div className="p-4 sm:p-5 border-b border-[var(--border-sub)] flex justify-between items-center bg-[var(--bg-alt)]/50">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-1.5 rounded bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--border-sub)] text-xs font-bold leading-none">
                        Agent 4 & 5
                      </div>
                      <h2 className="font-extrabold text-[var(--text-title)] tracking-tight text-sm uppercase font-display">Active Deadlines & Action Roadmaps</h2>
                    </div>
                    <span className="text-xs text-[var(--primary-color)] font-extrabold uppercase tracking-wider bg-[var(--primary-glow)] px-2.5 py-1 rounded-md border border-[var(--primary-color)]/20">
                      Live sequence
                    </span>
                  </div>

                  <div className="flex-1 p-4 sm:p-6 space-y-6">
                    {activeTasks.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 bg-[var(--bg-alt)] rounded-full flex items-center justify-center text-[var(--text-sub)] mb-4 border border-[var(--border-sub)]">
                          <CheckCircle className="w-6 h-6 text-[var(--primary-color)]" />
                        </div>
                        <h3 className="font-bold text-[var(--text-title)]">All task vaults are resting peacefully</h3>
                        <p className="text-xs text-[var(--text-sub)] max-w-xs mt-1 leading-relaxed">
                          You have zero outstanding active tasks. Create a new task to engage the Gemini analysis framework.
                        </p>
                      </div>
                    ) : (
                      <div className="relative pl-5 sm:pl-6 border-l-2 border-[var(--primary-color)]/20 space-y-8">
                        {activeTasks.slice(0, 3).map((task, idx) => {
                          const hoursLeft = getHoursRemainingStr(task.deadline);
                          const isRescueUrgent = task.aiAnalysis && task.aiAnalysis.completionProbability < 50;
                          
                          return (
                            <div key={task.id} className="relative">
                              {/* Custom status node marker */}
                              <div className={`absolute -left-[30px] sm:-left-[33px] top-1 w-4 h-4 rounded-full ring-4 ring-[var(--bg-card)] ${
                                isRescueUrgent ? 'bg-rose-500 animate-ping-slow' : 'bg-[var(--primary-color)]'
                              }`} />
                              
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-alt)]/30 hover:bg-[var(--bg-alt)]/60 p-4 rounded-xl border border-[var(--border-sub)] transition">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xs font-mono font-bold text-[var(--text-sub)] uppercase">
                                      DEADLINE: {hoursLeft}
                                    </span>
                                    {task.aiAnalysis?.category && (
                                      <span className="px-1.5 py-0.5 bg-[var(--badge-bg)] text-[var(--badge-text)] text-[9px] font-bold rounded border border-[var(--border-sub)]">
                                        {task.aiAnalysis.category}
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-sm font-extrabold text-[var(--text-title)] leading-snug">{task.name}</h3>
                                  
                                  {task.aiAnalysis ? (
                                    <p className="text-xs text-[var(--text-main)] leading-normal italic">
                                      &ldquo;{task.aiAnalysis.nextRecommendedAction}&rdquo;
                                    </p>
                                  ) : (
                                    <p className="text-xs text-[var(--text-sub)] italic">
                                      Waiting for server-side Gemini threat analysis...
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                  {task.aiAnalysis && (
                                    <div className="text-right mr-2 select-none">
                                      <div className="text-[10px] font-bold text-[var(--text-sub)]">COMPLETION</div>
                                      <div className={`text-sm font-black font-mono ${isRescueUrgent ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {task.aiAnalysis.completionProbability}%
                                      </div>
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => {
                                      setExpandedTaskId(task.id);
                                      setActiveTab('tasks');
                                    }}
                                    className="p-1 px-2.5 theme-card border border-[var(--border-main)] rounded text-xs text-[var(--text-main)] hover:bg-[var(--bg-alt)] font-bold transition flex items-center gap-1 shadow-2xs"
                                  >
                                    View Logic
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {activeTasks.length > 3 && (
                          <div className="text-center pt-2">
                            <button 
                              onClick={() => setActiveTab('tasks')}
                              className="text-xs font-bold text-[var(--primary-color)] hover:underline flex items-center gap-1 mx-auto"
                            >
                              See all {activeTasks.length} active tasks in Task Vault
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Risk Prediction & AI Insights (4-cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Risk Prediction Dashboard Card */}
                  <div className="theme-card border rounded-2xl shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-[var(--primary-glow)] to-[var(--primary-color)]/5 rounded-bl-full -z-0 pointer-events-none" />
                    <h2 className="font-extrabold text-[var(--text-title)] tracking-tight text-sm uppercase mb-4 flex items-center gap-2 font-display">
                      <BrainCircuit className="w-5 h-5 text-[var(--primary-color)]" />
                      Gemini Threat Level
                    </h2>

                    {activeTasks.length === 0 ? (
                      <div className="py-8 text-center text-[var(--text-sub)]">
                        <Sparkles className="w-10 h-10 mx-auto text-[var(--primary-color)]/30 mb-2" />
                        <span className="text-xs font-medium">No tasks are threatening your timeline right now. All clear!</span>
                      </div>
                    ) : (
                      (() => {
                        // Find the task with the highest urgency (or lowest Completion Probability)
                        const primaryAtRisk = [...activeTasks].sort((a,b) => {
                          const probA = a.aiAnalysis?.completionProbability ?? 100;
                          const probB = b.aiAnalysis?.completionProbability ?? 100;
                          return probA - probB;
                        })[0];

                        const isDanger = primaryAtRisk.aiAnalysis && primaryAtRisk.aiAnalysis.completionProbability < 50;
                        const probability = primaryAtRisk.aiAnalysis?.completionProbability ?? 80;
                        const reasoning = primaryAtRisk.aiAnalysis?.riskReasoning || "Calculated safe margin. No major delays detected.";
                        const riskLvl = primaryAtRisk.aiAnalysis?.riskLevel || "Low";

                        return (
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-[var(--text-sub)] block uppercase leading-none mb-1 font-display tracking-wider">
                                CRITICAL SPOTLIGHT: &ldquo;{primaryAtRisk.name}&rdquo;
                              </span>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className={`text-4xl sm:text-5xl font-black tracking-tight font-display ${isDanger ? 'text-rose-500' : 'text-[var(--primary-color)]'}`}>
                                  {probability}%
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold text-[var(--text-sub)] uppercase leading-none">Completion Prob.</p>
                                  <span className={`inline-block px-2 py-0.5 text-[9px] font-extrabold rounded mt-1.5 border uppercase ${
                                    isDanger 
                                      ? 'bg-rose-500/15 text-rose-500 border-rose-500/20 animate-pulse' 
                                      : 'bg-emerald-500/15 text-emerald-550 dark:text-emerald-400 border-emerald-500/20'
                                  }`}>
                                    {riskLvl} Risk
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-3.5 sm:p-4 bg-[var(--bg-alt)] rounded-xl border border-[var(--border-sub)]">
                              <p className="text-xs text-[var(--text-main)] italic leading-relaxed">
                                &ldquo;{reasoning}&rdquo;
                              </p>
                            </div>

                            <button 
                              onClick={() => {
                                  if (isDanger) {
                                    setActiveTab('rescue');
                                  } else {
                                    handleForceAnalyze(primaryAtRisk.id);
                                  }
                              }}
                              className={`w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all shadow-xs ${
                                isDanger 
                                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-950/20' 
                                  : 'theme-primary-btn text-white'
                              }`}
                            >
                              {isDanger ? 'Trigger Emergency Rescue' : 'Force Gemini Recalculate'}
                            </button>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* AI Insight Feed */}
                  <div className="theme-card border rounded-2xl shadow-sm p-6 flex-1">
                    <h2 className="font-extrabold text-[var(--text-title)] tracking-tight text-sm uppercase mb-3 flex items-center gap-2 font-display">
                      <Zap className="w-5 h-5 text-amber-500" />
                      AI Dynamic Insight Feed
                    </h2>
                    
                    <div className="space-y-4">
                      {activeTasks.length === 0 ? (
                        <div className="space-y-3 py-4">
                          <div className="flex gap-3">
                            <div className="w-1 h-10 bg-[var(--primary-color)] rounded-full"></div>
                            <div>
                              <p className="text-xs font-bold text-[var(--text-title)]">Calm Operations Detected</p>
                              <p className="text-[11px] text-[var(--text-sub)]">Peak mental recovery period. Set up a fresh objective now!</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const withAnalysis = activeTasks.filter(t => t.aiAnalysis);
                          if (withAnalysis.length === 0) {
                            return (
                              <p className="text-xs text-[var(--text-sub)]">Waiting for task scheduling data to generate dynamic workspace insights.</p>
                            );
                          }
                          
                          // Gather standard recommendations
                          const firstAnalysis = withAnalysis[0].aiAnalysis!;
                          return (
                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <div className="w-1 bg-[var(--primary-color)] rounded-full"></div>
                                <div>
                                  <p className="text-xs font-bold text-[var(--text-title)]">Recommended micro-action</p>
                                  <p className="text-[11px] text-[var(--text-main)] leading-snug">
                                    {firstAnalysis.nextRecommendedAction}
                                  </p>
                                </div>
                              </div>

                              {firstAnalysis.productivitySuggestions.map((sug, i) => {
                                const colors = ["bg-amber-400", "bg-purple-400", "bg-emerald-400"];
                                return (
                                  <div key={i} className="flex gap-3">
                                    <div className={`w-1 ${colors[i % colors.length]} rounded-full`}></div>
                                    <div>
                                      <p className="text-xs font-bold text-[var(--text-title)]">
                                        {i === 0 && "Focus Sprint Recommendation"}
                                        {i === 1 && "Workroom Distraction Blocker"}
                                        {i === 2 && "Cognitive Load Optimization"}
                                      </p>
                                      <p className="text-[11px] text-[var(--text-main)] leading-normal">{sug}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: TASK VAULT */}
          {activeTab === 'tasks' && (
            <div className="space-y-6" id="tasks-tab-content">
              
              {/* Search & Filtering Bar */}
              <div className="theme-card border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                
                {/* Search Input */}
                <div className="relative w-full md:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--text-sub)]">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks, categories..."
                    className="w-full pl-9 pr-4 py-2 border border-[var(--border-main)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--primary-color)] bg-[var(--bg-alt)]/40 p-2 text-[var(--text-title)]"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-sub)] font-semibold">
                    <Filter className="w-3.5 h-3.5" />
                    Filters:
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="p-1.5 px-2.5 border border-[var(--border-main)] bg-[var(--bg-card)] rounded-lg text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {categoriesPool.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Risk Filter */}
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="p-1.5 px-2.5 border border-[var(--border-main)] bg-[var(--bg-card)] rounded-lg text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer"
                  >
                    <option value="All">All Risks</option>
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>

              {/* Tasks List */}
              {loadingTasks ? (
                <div className="py-24 text-center">
                  <RefreshCw className="w-8 h-8 text-[var(--primary-color)] animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[var(--text-main)]">Syncing with task matrix...</p>
                </div>
              ) : filteredTasksList.length === 0 ? (
                <div className="theme-card border rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm">
                  <Compass className="w-10 h-10 text-[var(--primary-color)]/60 mx-auto mb-4" />
                  <h3 className="text-base font-extrabold text-[var(--text-title)]">No matching tasks discovered</h3>
                  <p className="text-xs text-[var(--text-sub)] mt-2 max-w-sm mx-auto">
                    Adjust your quick filter pills or click the &ldquo;+ New Task&rdquo; button above to prompt Gemini into action.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredTasksList.map((task) => {
                    const isExpanded = expandedTaskId === task.id;
                    const hoursLeft = getHoursRemainingStr(task.deadline);
                    const isOverdue = hoursLeft === "Overdue";
                    
                    // Risk level attributes
                    const riskLevel = task.aiAnalysis?.riskLevel || "Low";
                    const riskBadgeStyle = 
                      riskLevel === 'High' ? 'bg-rose-500/10 text-rose-550 dark:text-rose-400 border-rose-500/20 font-bold' :
                      riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-550 dark:text-amber-400 border-amber-500/20 font-bold' :
                      'bg-emerald-500/10 text-emerald-555 dark:text-emerald-450 border-emerald-500/20';

                    const isRescueActive = task.aiAnalysis && task.aiAnalysis.completionProbability < 50;

                    return (
                      <div 
                        key={task.id} 
                        id={`task-card-${task.id}`}
                        className={`theme-card border rounded-xl overflow-hidden shadow-xs transition-all duration-150 ${
                          isExpanded ? 'border-[var(--primary-color)] ring-2 ring-[var(--primary-glow)]' : 'border-[var(--border-main)] hover:border-[var(--text-sub)]/35'
                        }`}
                      >
                        {/* Task Card Header Area */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          
                          {/* Title & Info */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status Checkbox */}
                              <button 
                                onClick={() => handleUpdateTaskStatus(task, task.status === 'completed' ? 'pending' : 'completed')}
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border shrink-0 ${
                                  task.status === 'completed' 
                                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                                    : 'border-[var(--border-main)] hover:border-[var(--primary-color)] bg-[var(--bg-alt)]/30'
                                }`}
                              >
                                {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                              </button>

                              <h3 className={`text-base font-extrabold leading-tight truncate ${
                                task.status === 'completed' ? 'line-through text-[var(--text-sub)] font-medium' : 'text-[var(--text-title)]'
                              }`}>
                                {task.name}
                              </h3>

                              {/* Category badge */}
                              {task.aiAnalysis?.category && (
                                <span className="bg-[var(--badge-bg)] border border-[var(--border-sub)] px-2.5 py-0.5 rounded-full text-[10px] text-[var(--badge-text)] font-bold">
                                  {task.aiAnalysis.category}
                                </span>
                              )}

                              {/* Rescue mode flashing identifier */}
                              {task.status !== 'completed' && isRescueActive && (
                                <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 font-black uppercase rounded animate-pulse shadow-sm flex items-center gap-1">
                                  <Flame className="w-3 h-3" />
                                  Rescue Active
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[var(--text-main)] line-clamp-2 leading-relaxed">
                              {task.description || "No custom description supplied."}
                            </p>

                            {/* Effort & Deadline Metadata Row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-2xs font-bold text-[var(--text-sub)] uppercase tracking-widest font-mono">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[var(--text-sub)]" />
                                due date: {new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[var(--text-sub)]" />
                                effort values: {task.spentEffort} h done / {task.estimatedEffort} h total
                              </span>
                            </div>
                          </div>

                          {/* Controls Panel */}
                          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                            
                            {/* Urgent Indicators */}
                            {task.status !== 'completed' && (
                              <div className="flex items-center gap-2 mr-1">
                                <span className={`px-2 py-1 text-[10px] uppercase font-black tracking-wider rounded border ${getUrgencyBadge(task.deadline)}`}>
                                  {hoursLeft}
                                </span>

                                {task.aiAnalysis && (
                                  <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded border ${riskBadgeStyle}`}>
                                    Risk: {riskLevel}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Dropdowns / Speed updates */}
                            {task.status !== 'completed' && (
                              <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 gap-1 text-xs">
                                <span className="px-1.5 text-slate-400 font-bold font-mono">Add Hrs:</span>
                                <button 
                                  onClick={() => handleUpdateHours(task, task.spentEffort + 1)}
                                  className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold"
                                >
                                  +1
                                </button>
                                <button 
                                  onClick={() => handleUpdateHours(task, task.spentEffort - 1)}
                                  className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold"
                                >
                                  -1
                                </button>
                              </div>
                            )}

                            {/* Toggle expanded details */}
                            <button 
                              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                              className="p-2 text-[var(--text-sub)] hover:text-[var(--text-title)] hover:bg-[var(--bg-alt)] rounded-lg border border-[var(--border-main)]"
                              title="Toggle Gemini analysis reasoning"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isExpanded ? 'rotate-180 text-[var(--primary-color)]' : ''}`} />
                            </button>

                            {/* Edit Action */}
                            <button 
                              onClick={() => startEdit(task)}
                              className="p-2 text-[var(--primary-color)] hover:bg-[var(--primary-glow)] rounded-lg border border-[var(--border-main)]"
                              title="Edit parameters"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>

                            {/* Delete Action */}
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg border border-[var(--border-main)]"
                              title="Delete task permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Gemini Intelligence panel */}
                        {isExpanded && (
                          <div className="bg-[var(--bg-alt)]/30 border-t border-[var(--border-main)] p-4 sm:p-6 space-y-6">
                            
                            {/* Heuristic or real explanation banner */}
                            <div className="flex items-center gap-2 mb-4 bg-[var(--primary-glow)] px-4 py-2 rounded-lg border border-[var(--primary-color)]/25">
                              <BrainCircuit className="w-5 h-5 text-[var(--primary-color)] shrink-0" />
                              <div className="text-xs text-[var(--text-title)]">
                                <strong>Agent reasoning:</strong> Coordinates metrics across four custom-built Gemini agents (Task Analysis, Priority level, Threat model, and Execution planning).
                              </div>
                            </div>

                            {task.aiAnalysis ? (
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                
                                {/* Analysis results */}
                                <div className="md:col-span-4 space-y-4">
                                  <div>
                                    <h4 className="text-2xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-1">Estimated Hours Detail</h4>
                                    <div className="text-2xl font-black text-[var(--text-title)]">
                                      {task.aiAnalysis.estimatedHours} hrs requirement
                                    </div>
                                    <p className="text-[11px] text-slate-400">Recommended by Task Analyst</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-2xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-1 font-display">Complexity Class</h4>
                                      <div className="text-lg font-bold text-[var(--text-title)] flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-purple-500 font-display" />
                                        {task.aiAnalysis.complexityScore} / 10
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-2xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-1 font-display">Priority Rank Score</h4>
                                      <div className="text-lg font-bold text-[var(--primary-color)]">
                                        {task.aiAnalysis.priorityScore} / 100
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-2xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-1 font-display">Next Immediate Step</h4>
                                    <p className="text-xs text-[var(--text-main)] bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border-main)] font-medium leading-relaxed shadow-3xs">
                                      &ldquo;{task.aiAnalysis.nextRecommendedAction}&rdquo;
                                    </p>
                                  </div>
                                </div>

                                {/* Threat modeling reasoning */}
                                <div className="md:col-span-5 space-y-4">
                                  <div>
                                    <h4 className="text-2xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-1.5 font-display">Mathematical Risk assessment</h4>
                                    <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-main)] space-y-3 shadow-3xs">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-[var(--text-main)]">Completion Likelihood:</span>
                                        <span className={`font-black ${isRescueActive ? 'text-rose-500' : 'text-emerald-500'}`}>
                                          {task.aiAnalysis.completionProbability}%
                                        </span>
                                      </div>
                                      
                                      {/* Custom progress bar */}
                                      <div className="w-full bg-[var(--bg-alt)] rounded-full h-2 overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${isRescueActive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                          style={{ width: `${task.aiAnalysis.completionProbability}%` }}
                                        />
                                      </div>

                                      <p className="text-[11px] text-[var(--text-sub)] leading-normal italic">
                                        &ldquo;{task.aiAnalysis.riskReasoning}&rdquo;
                                      </p>
                                    </div>
                                  </div>

                                  {/* Suggestions list */}
                                  <div>
                                    <h4 className="text-2xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-1.5 font-display">Action optimizations</h4>
                                    <ul className="space-y-1.5">
                                      {task.aiAnalysis.productivitySuggestions.map((sug, isg) => (
                                        <li key={isg} className="text-2xs text-[var(--text-main)] flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] mt-1.5 shrink-0"></div>
                                          <span>{sug}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Custom quick actions & planning shortcuts */}
                                <div className="md:col-span-3 space-y-2 flex flex-col justify-between">
                                  <div className="space-y-2">
                                    <button 
                                      onClick={() => {
                                        setSelectedPlannerTaskId(task.id);
                                        setActiveTab('planner');
                                      }}
                                      className="w-full py-2 bg-[var(--primary-glow)] hover:opacity-90 text-[var(--primary-color)] font-bold rounded-lg border border-[var(--primary-color)]/25 text-xs transition flex items-center justify-center gap-1.5"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      View Day Roadmap
                                    </button>

                                    {isRescueActive && (
                                      <button 
                                        onClick={() => {
                                          setActiveTab('rescue');
                                        }}
                                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 text-xs transition flex items-center justify-center gap-1.5"
                                      >
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Launch Rescue Plan
                                      </button>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleForceAnalyze(task.id)}
                                    className="w-full py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-alt)] text-[var(--text-main)] hover:text-[var(--text-title)] font-medium rounded-lg border border-[var(--border-main)] text-[11px] transition flex items-center justify-center gap-1.5"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Recalibrate Analysis
                                  </button>
                                </div>

                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Sparkles className="w-8 h-8 text-[var(--primary-color)]/60 animate-pulse mx-auto mb-2" />
                                <p className="text-xs text-[var(--text-sub)]">Gemini model analyzing coordinates. Click &ldquo;Recalibrate Analysis&rdquo; to manually synchronize.</p>
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: AI PLANNER */}
          {activeTab === 'planner' && (
            <div className="space-y-6" id="planner-tab-content">
              
              {/* Sub-tab Navigation Swapper */}
              <div className="flex border-b border-[var(--border-main)] gap-4 select-none">
                <button
                  onClick={() => setPlannerSubTab('calendar')}
                  className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                    plannerSubTab === 'calendar'
                      ? 'border-[var(--primary-color)] theme-primary-text'
                      : 'border-transparent text-[var(--text-sub)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Interactive Calendar Grid
                </button>
                <button
                  onClick={() => setPlannerSubTab('roadmap')}
                  className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                    plannerSubTab === 'roadmap'
                      ? 'border-[var(--primary-color)] theme-primary-text'
                      : 'border-transparent text-[var(--text-sub)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Day-Wise AI Roadmap
                </button>
              </div>

              {plannerSubTab === 'calendar' ? (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Calendar controls card */}
                  <div className="theme-card border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h2 className="font-black text-slate-800 dark:text-white tracking-tight text-sm uppercase flex items-center gap-2">
                        <Calendar className="w-4.5 h-4.5 text-[var(--primary-color)]" />
                        Deadline Calendar Agenda
                      </h2>
                      <p className="text-xs text-[var(--text-sub)] mt-0.5">Click any calendar cell to insert a triage task directly on that target deadline.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      {/* Month Switchers */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/55 dark:border-slate-700/60 shadow-inner">
                        <button 
                          onClick={() => {
                            setCalendarDate(prev => {
                              const d = new Date(prev);
                              d.setMonth(d.getMonth() - 1);
                              return d;
                            });
                          }}
                          className="p-1 px-2.5 text-slate-650 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-2xs font-extrabold text-slate-750 dark:text-slate-250 uppercase px-3 tracking-widest font-mono min-w-[120px] text-center">
                          {calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button 
                          onClick={() => {
                            setCalendarDate(prev => {
                              const d = new Date(prev);
                              d.setMonth(d.getMonth() + 1);
                              return d;
                            });
                          }}
                          className="p-1 px-2.5 text-slate-650 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
                          title="Next Month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Export ICS button */}
                      <button
                        onClick={() => {
                          const generateICSString = () => {
                            let ics = [
                              'BEGIN:VCALENDAR',
                              'VERSION:2.0',
                              'PRODID:-//Last Minute Life Saver//EN',
                              'CALSCALE:GREGORIAN',
                              'METHOD:PUBLISH'
                            ];
                            tasks.forEach(t => {
                              const dueDate = new Date(t.deadline);
                              const pad = (n: number) => n.toString().padStart(2, '0');
                              const formattedDate = dueDate.getUTCFullYear() +
                                pad(dueDate.getUTCMonth() + 1) +
                                pad(dueDate.getUTCDate()) + 'T' +
                                pad(dueDate.getUTCHours()) +
                                pad(dueDate.getUTCMinutes()) +
                                pad(dueDate.getUTCSeconds()) + 'Z';
                              
                              const createdDate = new Date(t.createdAt || Date.now());
                              const formattedCreated = createdDate.getUTCFullYear() +
                                pad(createdDate.getUTCMonth() + 1) +
                                pad(createdDate.getUTCDate()) + 'T' +
                                pad(createdDate.getUTCHours()) +
                                pad(createdDate.getUTCMinutes()) +
                                pad(createdDate.getUTCSeconds()) + 'Z';

                              ics.push('BEGIN:VEVENT');
                              ics.push(`UID:task_${t.id}@lastminutelifesaver.app`);
                              ics.push(`DTSTAMP:${formattedCreated}`);
                              ics.push(`DTSTART:${formattedDate}`);
                              ics.push(`DTEND:${formattedDate}`);
                              ics.push(`SUMMARY:${t.name.replace(/[,;]/g, '\\$&')}`);
                              ics.push(`DESCRIPTION:${(t.description || '').replace(/[\r\n]/g, '\\n').replace(/[,;]/g, '\\$&')}`);
                              ics.push('STATUS:' + (t.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'));
                              ics.push(`PRIORITY:${t.aiAnalysis?.priorityLevel === 'Critical' ? '1' : t.aiAnalysis?.priorityLevel === 'High' ? '3' : '5'}`);
                              ics.push('END:VEVENT');
                            });
                            ics.push('END:VCALENDAR');
                            return ics.join('\r\n');
                          };

                          const icsStr = generateICSString();
                          const blob = new Blob([icsStr], { type: 'text/calendar;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'last_minute_life_saver_agenda.ics');
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-4 py-2 theme-primary-btn text-white font-bold rounded-xl text-xs uppercase tracking-wide transition shadow-xs flex items-center gap-1.5"
                        title="Export deadline schedule to Google / Apple / Outlook Calendar"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                        Export (.ics Calendar)
                      </button>
                    </div>
                  </div>

                  {/* Calendar Month Grid */}
                  <div className="theme-card border rounded-2xl p-4 sm:p-6 shadow-sm">
                    {/* Day of Week Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--text-sub)] font-bold mb-3 border-b pb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-1">{d}</div>
                      ))}
                    </div>

                    {/* Math & Grid Generation */}
                    {(() => {
                      const year = calendarDate.getFullYear();
                      const month = calendarDate.getMonth();
                      const firstDayDate = new Date(year, month, 1);
                      const firstDayOfWeek = firstDayDate.getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const daysInPrevMonth = new Date(year, month, 0).getDate();

                      const gridSlots: Array<{ dayNum: number; isCurrentMonth: boolean; date: Date }> = [];

                      // Previous month slots
                      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                        const day = daysInPrevMonth - i;
                        gridSlots.push({ dayNum: day, isCurrentMonth: false, date: new Date(year, month - 1, day) });
                      }

                      // Current month days
                      for (let i = 1; i <= daysInMonth; i++) {
                        gridSlots.push({ dayNum: i, isCurrentMonth: true, date: new Date(year, month, i) });
                      }

                      // Remaining slots
                      const remainingSlots = 42 - gridSlots.length;
                      for (let i = 1; i <= remainingSlots; i++) {
                        gridSlots.push({ dayNum: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
                      }

                      const today = new Date();

                      return (
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                          {gridSlots.map((slot, idx) => {
                            const isToday = today.getDate() === slot.dayNum && 
                                            today.getMonth() === slot.date.getMonth() && 
                                            today.getFullYear() === slot.date.getFullYear();
                                            
                            // Filter tasks falling on this exact day
                            const dailyTasks = tasks.filter(t => {
                              const tDate = new Date(t.deadline);
                              return tDate.getDate() === slot.dayNum &&
                                     tDate.getMonth() === slot.date.getMonth() &&
                                     tDate.getFullYear() === slot.date.getFullYear();
                            });

                            return (
                              <div
                                key={idx}
                                onClick={(e) => {
                                  // Avoid hijacking when child task cards clicked
                                  if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'DIV') {
                                    const tzoffset = slot.date.getTimezoneOffset() * 60000;
                                    const localTime = (new Date(slot.date.getTime() - tzoffset)).toISOString().substring(0, 16);
                                    setTaskDeadline(localTime);
                                    setIsNewTaskOpen(true);
                                  }
                                }}
                                className={`min-h-[85px] sm:min-h-[110px] p-2 rounded-xl border transition-all duration-150 cursor-pointer relative group flex flex-col justify-between ${
                                  slot.isCurrentMonth 
                                    ? 'theme-alt-bg hover:brightness-95 dark:hover:brightness-110' 
                                    : 'opacity-35 hover:opacity-50'
                                } ${
                                  isToday 
                                    ? 'ring-2 ring-[var(--primary-color)] border-[var(--primary-color)] shadow-md bg-[var(--primary-glow)]/40' 
                                    : 'border-[var(--border-sub)]'
                                }`}
                              >
                                <div className="flex justify-between items-center select-none mb-1">
                                  <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${
                                    isToday 
                                      ? 'bg-[var(--primary-color)] text-white' 
                                      : 'text-[var(--text-title)]'
                                  }`}>
                                    {slot.dayNum}
                                  </span>

                                  {/* Fast Add icon helper hint */}
                                  <span className="text-[10px] text-[var(--primary-color)] opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest font-mono">
                                    + ADD
                                  </span>
                                </div>

                                {/* List mini task badges limit to 3 items */}
                                <div className="space-y-1 overflow-y-auto max-h-[50px] sm:max-h-[70px] pr-1 scrollbar-thin">
                                  {dailyTasks.slice(0, 3).map(task => {
                                    const isCritical = task.aiAnalysis?.priorityLevel === 'Critical';
                                    const isComp = task.status === 'completed';
                                    return (
                                      <div
                                        key={task.id}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Avoid triggering cell click
                                          setSelectedPlannerTaskId(task.id);
                                          setPlannerSubTab('roadmap');
                                        }}
                                        className={`p-1 px-1.5 rounded text-[8px] sm:text-[9px] font-bold truncate transition-all shadow-sm ${
                                          isComp
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700/80 border border-emerald-250 cursor-pointer line-through'
                                            : isCritical
                                              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 border border-rose-200 animate-pulse'
                                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750'
                                        }`}
                                        title={`${task.name} (${task.status})`}
                                      >
                                        {task.name}
                                      </div>
                                    );
                                  })}
                                  {dailyTasks.length > 3 && (
                                    <div className="text-[7px] text-center text-[var(--text-sub)] font-extrabold pb-0.5">
                                      + {dailyTasks.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Legend description */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-[var(--border-sub)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-sub)] font-mono">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-rose-50 border border-rose-200" />
                          Critical Risk
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200" />
                          Done / Cleared
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded bg-[var(--primary-glow)] border border-[var(--primary-color)]/30" />
                          Standard / Active
                        </span>
                      </div>
                      <div>
                        Total deadlines logged: {tasks.length}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Task Selector Dropdown Header */}
                  <div className="theme-card border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h2 className="font-extrabold text-slate-700 dark:text-slate-300 tracking-tight text-sm uppercase">Planning Agent Day-wise Schemas</h2>
                      <p className="text-xs text-[var(--text-sub)] mt-0.5">Select a task configuration to explore day-by-day actions generated by Agent 4.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-sub)] font-bold uppercase font-mono">Selector:</span>
                      <select
                        value={selectedPlannerTaskId}
                        onChange={(e) => setSelectedPlannerTaskId(e.target.value)}
                        className="p-2 border border-[var(--border-main)] theme-card rounded-lg text-sm font-semibold text-[var(--text-main)] w-56 max-w-full"
                      >
                        <option value="">-- Choose Active Task --</option>
                        {activeTasks.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedPlannerTask ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left Column: Parsed Day Roadmap Timeline (8-cols) */}
                      <div className="lg:col-span-8 theme-card border rounded-xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[var(--primary-color)]" />
                            <h3 className="font-extrabold text-[var(--text-title)] text-sm uppercase tracking-tight">Day-Wise Execution roadmap</h3>
                          </div>
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold border border-emerald-100">
                            {selectedPlannerTask.aiAnalysis?.category || "Standard Plan"}
                          </span>
                        </div>

                        {selectedPlannerTask.aiAnalysis?.dayWisePlan ? (
                          <div className="relative pl-6 border-l border-[var(--border-main)] space-y-8">
                            {selectedPlannerTask.aiAnalysis.dayWisePlan.map((phase, idx) => (
                              <div key={idx} className="relative">
                                
                                {/* Day Circle node */}
                                <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-[var(--primary-color)] flex items-center justify-center font-bold text-[var(--primary-color)]" />

                                <div className="theme-alt-bg p-4 rounded-xl border border-[var(--border-sub)] hover:brightness-95 dark:hover:brightness-110 transition">
                                  <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                                    <h4 className="text-xs font-black text-[var(--primary-color)] uppercase tracking-wider">
                                      {phase.day}
                                    </h4>
                                    <span className="text-2xs text-[var(--text-sub)] font-mono font-bold theme-card px-2 py-0.5 rounded border">
                                      Est: {phase.estimatedDuration}
                                    </span>
                                  </div>

                                  {/* Day tasks micro schedule */}
                                  <ul className="space-y-2 mb-3">
                                    {phase.tasks.map((ptask, pidx) => (
                                      <li key={pidx} className="text-xs text-[var(--text-main)] flex items-start gap-2.5">
                                        <div className="w-4 h-4 rounded border border-[var(--border-main)] mt-0.5 flex items-center justify-center cursor-pointer hover:border-[var(--primary-color)] bg-[var(--bg-card)]">
                                          {/* Mini persistent simulated status checks */}
                                          <div className="w-2 h-2 rounded-sm bg-[var(--primary-color)] opacity-0 hover:opacity-25 transition" />
                                        </div>
                                        <span className="leading-relaxed">{ptask}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  {/* Milestone bar */}
                                  <div className="border-t border-dashed border-[var(--border-sub)] pt-2 flex items-center gap-2 text-[11px] text-[var(--text-sub)]">
                                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>
                                      <strong>Milestone check:</strong> {phase.milestone}
                                    </span>
                                  </div>

                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-[var(--text-sub)] text-xs">
                            No day-wise blueprint parsed. Recalibrate the task's analysis on the task cards list.
                          </div>
                        )}
                      </div>

                      {/* Right Column: Key Milestones Summary & Quick Stats (4-cols) */}
                      <div className="lg:col-span-4 space-y-6">
                        
                        {/* Milestones Panel */}
                        <div className="theme-card border rounded-xl p-6 shadow-sm">
                          <h3 className="font-extrabold text-[var(--text-title)] text-sm uppercase tracking-tight border-b border-[var(--border-sub)] pb-3 mb-4">
                            Major Gates & Milestones
                          </h3>

                          {selectedPlannerTask.aiAnalysis?.milestones ? (
                            <div className="space-y-3">
                              {selectedPlannerTask.aiAnalysis.milestones.map((m, im) => (
                                <div key={im} className="flex items-center gap-3 p-3 theme-alt-bg rounded-lg border border-[var(--border-sub)]">
                                  <div className="w-6 h-6 rounded-full bg-[var(--badge-bg)] text-[var(--badge-text)] flex items-center justify-center font-black text-2xs border border-[var(--border-sub)]">
                                    {im + 1}
                                  </div>
                                  <span className="text-xs text-[var(--text-main)] font-semibold leading-tight">
                                    {m}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--text-sub)]">No core milestones generated yet.</p>
                          )}
                        </div>

                        {/* Operational calibration helper */}
                        <div className="p-5 rounded-xl border border-[var(--border-sub)] theme-alt-bg text-[var(--text-main)] shadow-xs space-y-3">
                          <h4 className="text-xs font-black text-[var(--primary-color)] uppercase tracking-wider">Calibration Parameters</h4>
                          <p className="text-2xs text-[var(--text-sub)] leading-relaxed">
                            The timeline is generated dynamically using mathematical buffers. If you start falling behind, or work hours increase, Gemini recalculates priority weights.
                          </p>

                          <div className="pt-2">
                            <button 
                              onClick={() => handleForceAnalyze(selectedPlannerTask.id)}
                              className="w-full py-2 theme-primary-btn text-white font-bold rounded text-xs transition flex items-center justify-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
                              Force Schedule Reparse
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="theme-card border rounded-xl p-12 text-center max-w-md mx-auto shadow-sm">
                      <Sparkles className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-4" />
                      <h3 className="font-extrabold text-[var(--text-title)] text-sm uppercase tracking-tight">AI Planner Unoccupied</h3>
                      <p className="text-xs text-[var(--text-sub)] mt-2">
                        Create or select an active task with Gemini parsed analytics to see day schedules and critical milestones.
                      </p>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 4: RESCUE CENTER */}
          {activeTab === 'rescue' && (
            <div className="space-y-6" id="rescue-tab-content">
              
              {/* Emergency Hazard Warning Header */}
              <div className="danger-gradient-bg text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3">
                  <AlertTriangle className="w-40 h-40" />
                </div>
                
                <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <Flame className="w-6 h-6 animate-pulse" />
                  Rescue Control Desk Active
                </h2>
                <p className="text-xs text-rose-100 max-w-2xl mt-1 leading-relaxed">
                  When a task's mathematically predicted on-time potential falls below 50%, our system immediately initiates <strong>Rescue Agent 5</strong> protocol. It creates a stripped-down, high-energy, hour-by-hour emergency recovery strategy (MVP delivery) to avoid failing.
                </p>
              </div>

              {rescuedTasks.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm">
                  <CheckSquare className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="font-extrabold text-slate-800">Excellent Work. Zero Tasks are in Threat Condition!</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    The completion likelihood for your remaining workload balances safely above 50%. No emergency recovery roadmaps are calculated currently.
                  </p>
                  
                  {activeTasks.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase mb-2">Simulate Rescue Mode on current tasks:</span>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {activeTasks.map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              // Force lower probability on task to trigger Rescue mode simulation
                              setTasks(prev => prev.map(item => item.id === t.id ? {
                                ...item,
                                aiAnalysis: item.aiAnalysis ? {
                                  ...item.aiAnalysis,
                                  completionProbability: 35, // force low probability
                                  riskLevel: 'High',
                                  riskReasoning: "EMERGENCY SIMULATOR ENGAGED: Workload contains large manual assets with limited standard working hours remaining before submission portal closes."
                                } : undefined,
                                rescuePlan: {
                                  generatedAt: new Date().toISOString(),
                                  hourByHourRecovery: [
                                    { hour: "Hour 0-1", action: "Emergency triage. Define minimum viable quality criteria.", priority: "Critical" as const },
                                    { hour: "Hour 1-3", action: "Uninterrupted focus sprint window.", priority: "Critical" as const },
                                    { hour: "Hour 3-4", action: "Streamline remaining subtasks and draft basic sections.", priority: "High" as const },
                                    { hour: "Hour 4+", action: "Verification and proofread review.", priority: "Medium" as const }
                                  ],
                                  criticalActionList: [
                                    "Draft minimum viable product (MVP)",
                                    "Isolate distraction-free room",
                                    "Block social notices"
                                  ],
                                  rescueReasoning: "SIMULATION IN PROGRESS: Focus on immediate core outputs."
                                }
                              } : item));
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-extrabold p-2 rounded border border-slate-300"
                          >
                            Simulate &ldquo;{t.name}&rdquo; Crisis
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {rescuedTasks.map((task) => {
                    // Extract emergency rescue details
                    const prob = task.aiAnalysis?.completionProbability || 35;
                    const rPlan = task.rescuePlan;

                    return (
                      <div key={task.id} className="bg-white border border-rose-200 rounded-2xl shadow-md overflow-hidden">
                        
                        {/* Crisis Header tag */}
                        <div className="bg-rose-50 border-b border-rose-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-rose-600 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                Crisis spotlight
                              </span>
                              <span className="text-xs font-mono font-bold text-rose-700">
                                {task.aiAnalysis?.category || "Triage Level"}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800 tracking-tight block">
                              {task.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <div className="text-[10px] font-bold text-rose-500 uppercase leading-none">Completion Probability</div>
                              <div className="text-3xl font-black text-rose-600 tracking-tight mt-1">
                                {prob}%
                              </div>
                            </div>

                            <button 
                              onClick={() => handleUpdateTaskStatus(task, 'completed')}
                              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 shadow"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Completed
                            </button>
                          </div>
                        </div>

                        {/* Critical analysis blocks */}
                        <div className="p-6 space-y-6">
                          
                          {/* Pep-talk message / Strategy warning */}
                          {rPlan?.rescueReasoning && (
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                <Sparkles className="w-4 h-4 animate-bounce" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-amber-700 uppercase tracking-wide">Emergency Pep Talk & Pivot Strategic Direction</h4>
                                <p className="text-xs text-amber-900 leading-relaxed italic mt-0.5">
                                  &ldquo;{rPlan.rescueReasoning}&rdquo;
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Hour-By-Hour Recovery Matrix (7-cols) */}
                            <div className="lg:col-span-7 space-y-4">
                              <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-rose-500" />
                                Hour-By-Hour Emergency Blitz Action Plan (Agent 5 Blueprint)
                              </h4>

                              {rPlan?.hourByHourRecovery ? (
                                <div className="space-y-3">
                                  {rPlan.hourByHourRecovery.map((hStep, hsIdx) => (
                                    <div 
                                      key={hsIdx} 
                                      onClick={() => handleToggleRescueCheck(task.id, hsIdx)}
                                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-3 ${
                                        completedRescueItems[task.id]?.[hsIdx]
                                          ? 'border-[var(--border-main)] bg-[var(--bg-alt)]/40 opacity-60'
                                          : 'border-[var(--border-main)] bg-[var(--bg-card)] hover:border-[var(--primary-color)]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                          completedRescueItems[task.id]?.[hsIdx]
                                            ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white'
                                            : 'border-[var(--border-sub)] bg-[var(--bg-alt)]/30'
                                        }`}>
                                          {completedRescueItems[task.id]?.[hsIdx] && <Check className="w-3.5 h-3.5" />}
                                        </div>

                                        <div>
                                          <span className="text-[10px] font-mono font-black text-[var(--primary-color)] uppercase tracking-wider block">
                                            {hStep.hour}
                                          </span>
                                          <p className={`text-xs ${completedRescueItems[task.id]?.[hsIdx] ? 'line-through text-[var(--text-sub)] font-medium' : 'text-[var(--text-main)] font-semibold'}`}>
                                            {hStep.action}
                                          </p>
                                        </div>
                                      </div>

                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border shrink-0 ${
                                        hStep.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500 dark:text-rose-450 border-rose-500/20' :
                                        hStep.priority === 'High' ? 'bg-amber-500/10 text-amber-500 dark:text-amber-450 border-amber-500/20' :
                                        'bg-[var(--bg-alt)] text-[var(--text-sub)] border-[var(--border-main)]'
                                      }`}>
                                        {hStep.priority}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-2xs text-slate-400">Recovery times aren't indexed properly.</p>
                              )}
                            </div>

                            {/* MVP Action Checklist / Stripped-down targets (5-cols) */}
                            <div className="lg:col-span-5 space-y-4">
                              <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                <CheckSquare className="w-4 h-4 text-slate-400" />
                                Triage Rules & Minimum Deliverable List (MVP CUTS)
                              </h4>

                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <p className="text-2xs text-slate-500 uppercase font-black tracking-wider leading-none">
                                  STRICT INSTRUCTIONS: Strip the fluff.
                                </p>

                                {rPlan?.criticalActionList ? (
                                  <ul className="space-y-2.5">
                                    {rPlan.criticalActionList.map((crit, crIdx) => (
                                      <li key={crIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                                        <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                          ✔
                                        </div>
                                        <span>{crit}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-2xs text-slate-400">Empty action triage recommendations.</p>
                                )}
                              </div>

                              {/* Calibration panel */}
                              <div className="p-4 bg-slate-900 rounded-xl text-slate-300 space-y-2.5 text-2xs">
                                <h5 className="font-bold text-amber-400">💡 Dynamic Triage Protocol</h5>
                                <p className="leading-relaxed text-slate-400">
                                  If your spent effort grows, Gemini expects progression. Make sure to frequently log hours (+1 Add Hours button) on task cards so the probability calculates accurately.
                                </p>
                              </div>
                            </div>

                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6" id="analytics-tab-content">
              
              {/* Overall Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-2xs uppercase tracking-wider font-extrabold text-slate-400">Total Operational Workload</span>
                  <p className="text-3xl font-black text-slate-800 mt-1">{tasks.length}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Sum of completed & pending tasks</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-2xs uppercase tracking-wider font-extrabold text-slate-400">Deadlines Preserved On-Time</span>
                  <p className="text-3xl font-black text-emerald-600 mt-1">{analytics?.deadlinesMet || 0}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Submitted prior to official target ISO</p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-2xs uppercase tracking-wider font-extrabold text-slate-400">Missed / Overdue counts</span>
                  <p className="text-3xl font-black text-rose-500 mt-1">{analytics?.deadlinesMissed || 0}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Submitted overdue or outstanding past dates</p>
                </div>

                <div className="bg-[var(--primary-color)] p-5 rounded-xl shadow-xs">
                  <span className="text-2xs uppercase tracking-wider font-extrabold text-white/80">System Priority Efficiency</span>
                  <p className="text-3xl font-black text-white mt-1">
                    {analytics?.averageProductivityScore || 84}%
                  </p>
                  <p className="text-[10px] text-white/70 font-bold mt-1">Aggregated target met vs delays</p>
                </div>
              </div>

              {/* Graphical Analysis with Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Bar Chart: Weekly completion metrics (8-cols) */}
                <div className="lg:col-span-8 theme-card border rounded-xl p-6 shadow-xs">
                  <h3 className="font-display font-extrabold text-[var(--text-title)] text-sm uppercase tracking-tight mb-4">
                    Daily Velocity Log (Created vs Completed)
                  </h3>

                  <div className="h-72 text-xs">
                    {analytics?.weeklyCompletionTrend ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.weeklyCompletionTrend}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-sub)" />
                          <XAxis 
                            dataKey="name" 
                            stroke="var(--text-sub)" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="var(--text-sub)" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false} 
                            allowDecimals={false}
                          />
                          <Tooltip 
                            contentStyle={{ background: '#1c1c24', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                            labelClassName="font-bold text-[var(--primary-color)]"
                          />
                          <Bar dataKey="total" name="Created Tasks" fill="var(--border-main)" radius={[4, 4, 0, 0]} barSize={18} />
                          <Bar dataKey="completed" name="Completed Deadlines" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-sub)]">
                        Insufficient log trend detected.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Task Category Distributions (4-cols) */}
                <div className="lg:col-span-4 theme-card border rounded-xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-extrabold text-[var(--text-title)] text-sm uppercase tracking-tight mb-3">
                      Category Density
                    </h3>
                    <p className="text-2xs text-[var(--text-sub)] leading-normal mb-4">
                      Proportional distribution of active tasks classified by the Task Analysis Agent.
                    </p>

                    {/* Proportional category lines */}
                    <div className="space-y-3">
                      {(() => {
                        // Count frequencies
                        const counts: Record<string, number> = {};
                        tasks.forEach(t => {
                          const cat = t.aiAnalysis?.category || "General";
                          counts[cat] = (counts[cat] || 0) + 1;
                        });

                        const entries = Object.entries(counts).sort((a,b) => b[1] - a[1]);
                        const totalCount = tasks.length || 1;

                        if (entries.length === 0) {
                          return <p className="text-xs text-[var(--text-sub)] py-6 text-center">No datasets categorized yet.</p>;
                        }

                        const barColors = ["bg-[var(--primary-color)]", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

                        return entries.map(([category, count], idx) => {
                          const perc = Math.round((count / totalCount) * 100);
                          return (
                            <div key={category} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-[var(--text-main)]">
                                <span>{category}</span>
                                <span className="font-black text-[var(--text-sub)]">{perc}% ({count})</span>
                              </div>
                              <div className="w-full bg-[var(--bg-alt)]/50 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${barColors[idx % barColors.length]}`} 
                                  style={{ width: `${perc}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-alt)]/40 p-3.5 rounded-xl border border-[var(--border-sub)] mt-6 text-2xs text-[var(--text-sub)] leading-normal flex items-start gap-2">
                    <Award className="w-4 h-4 text-[var(--primary-color)] shrink-0 mt-0.5" />
                    <span>
                      <strong>Calibrated targets:</strong> Met rates under 90% automatically prioritize standard effort parameters across newly parsed schedules.
                    </span>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* Slide-Over Modal for New Task / Edit Task */}
      {(isNewTaskOpen || isEditingTask) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 font-sans p-2 sm:p-0">
          <div className="theme-card border-l border-[var(--border-main)] w-full max-w-lg h-full flex flex-col justify-between overflow-y-auto shadow-2xl relative animate-slide-in p-6 sm:p-8">
            
            <div>
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-sub)] pb-4 mb-6">
                <div>
                  <h3 className="text-base font-black text-[var(--text-title)] uppercase tracking-tight flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-[var(--primary-color)]" />
                    {isEditingTask ? "Edit Deadline Parameters" : "Trigger New Triage Task"}
                  </h3>
                  <p className="text-xs text-[var(--text-sub)] mt-0.5">
                    {isEditingTask ? "Update effort benchmarks or submit results." : "Prompt Gemini Core to analyze risks, priorities and rescue schedules."}
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setIsNewTaskOpen(false);
                    setIsEditingTask(null);
                    setTaskName('');
                    setTaskDescription('');
                    setTaskDeadline('');
                    setTaskEstimatedEffort(3);
                    setTaskSpentEffort(0);
                  }}
                  className="p-1 px-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md border border-slate-150 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Error Alerts */}
              {actionError && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-lg border border-rose-100 mb-4">
                  {actionError}
                </div>
              )}

              {/* Main Dialog Form */}
              <form onSubmit={isEditingTask ? handleSaveEditTask : handleCreateTask} className="space-y-4">
                
                {/* Task Title */}
                <div className="space-y-1">
                  <label className="text-2xs font-extrabold text-[var(--text-sub)] uppercase tracking-wider block">
                    Task/Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="e.g. Prep Q4 Pitch Deck, Submit Finance Report"
                    className="w-full p-2.5 border border-[var(--border-main)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--primary-color)] bg-[var(--bg-alt)]/30 text-[var(--text-title)]"
                  />
                </div>

                {/* Task Description */}
                <div className="space-y-1">
                  <label className="text-2xs font-extrabold text-[var(--text-sub)] uppercase tracking-wider block">
                    Description & Context
                  </label>
                  <textarea
                    rows={3}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Provide standard content, portals instructions or submission details for Gemini to categorize complexity."
                    className="w-full p-2.5 border border-[var(--border-main)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--primary-color)] bg-[var(--bg-alt)]/30 text-[var(--text-title)] text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Deadline date-time */}
                  <div className="space-y-1">
                    <label className="text-2xs font-extrabold text-[var(--text-sub)] uppercase tracking-wider block">
                      Deadline Target *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full p-2.5 border border-[var(--border-main)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--primary-color)] bg-[var(--bg-alt)]/30 text-[var(--text-title)]"
                    />
                  </div>

                  {/* Estimated Effort Hours */}
                  <div className="space-y-1">
                    <label className="text-2xs font-extrabold text-[var(--text-sub)] uppercase tracking-wider block">
                      Estimated Work (hours)
                    </label>
                    <input
                      type="number"
                      required
                      min={0.5}
                      step={0.5}
                      max={120}
                      value={taskEstimatedEffort}
                      onChange={(e) => setTaskEstimatedEffort(Number(e.target.value))}
                      className="w-full p-2.5 border border-[var(--border-main)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--primary-color)] bg-[var(--bg-alt)]/30 text-[var(--text-title)]"
                    />
                  </div>
                </div>

                {/* Additional fields only active in EDIT mode */}
                {isEditingTask && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-sub)]">
                    
                    {/* Spent Hours */}
                    <div className="space-y-1">
                      <label className="text-2xs font-extrabold text-[var(--text-sub)] uppercase tracking-wider block">
                        Hours Spent Progress
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={taskSpentEffort}
                        onChange={(e) => setTaskSpentEffort(Number(e.target.value))}
                        className="w-full p-2.5 border border-[var(--border-main)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--primary-color)] bg-[var(--bg-alt)]/30 text-[var(--text-title)]"
                      />
                    </div>

                    {/* Status selection */}
                    <div className="space-y-1">
                      <label className="text-2xs font-extrabold text-[var(--text-sub)] uppercase tracking-wider block">
                        Operational Status
                      </label>
                      <select
                        value={taskStatus}
                        onChange={(e) => setTaskStatus(e.target.value as any)}
                        className="w-full p-2.5 border border-[var(--border-main)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--primary-color)] bg-[var(--bg-alt)]/30 text-[var(--text-title)]"
                      >
                        <option value="pending" className="bg-[var(--bg-card)]">Pending</option>
                        <option value="in_progress" className="bg-[var(--bg-card)]">In Progress</option>
                        <option value="completed" className="bg-[var(--bg-card)]">Completed</option>
                      </select>
                    </div>

                  </div>
                )}

                {/* Modal actions */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsNewTaskOpen(false);
                      setIsEditingTask(null);
                    }}
                    className="px-4 py-2.5 rounded-lg text-xs text-slate-500 font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg text-xs text-white font-bold uppercase tracking-wider theme-primary-btn hover:opacity-90 transition shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        AI Analysis Proceeding...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        {isEditingTask ? "Commit Parameters" : "Trigger Triage Matrix"}
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Simulated educational prompt */}
            <div className="p-4 bg-[var(--primary-glow)]/40 rounded-xl border border-[var(--primary-color)]/20 mt-8">
              <span className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-wider block mb-1">
                🤖 AI Integration specifications
              </span>
              <p className="text-[11px] text-[var(--text-main)] leading-normal">
                Submitting this task triggers Agent 1, 2, 3 and 4 simultaneously on our Node server proxy. It parses priority, complexity metrics and predicts deadline failures using live Gemini models.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl h-16 flex items-center justify-around px-2 z-40 select-none border border-[var(--border-main)]" style={{ backgroundColor: 'var(--bg-header)' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'tasks', label: 'Vault', icon: CheckSquare, badge: activeTasks.length },
          { id: 'planner', label: 'Planner', icon: Sparkles },
          { id: 'rescue', label: 'Rescue', icon: ShieldAlert, badge: rescuedTasks.length, badgeStyle: 'bg-rose-500 animate-pulse text-white' },
          { id: 'analytics', label: 'Metrics', icon: TrendingUp },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-[var(--primary-color)] font-extrabold scale-105' 
                  : 'text-[var(--text-sub)] opacity-70 hover:opacity-100'
              }`}
            >
              <div className="relative p-0.5">
                <Icon className="w-4.5 h-4.5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2 text-[8px] font-black text-white px-1 rounded-full leading-none flex items-center justify-center ${item.badgeStyle || 'theme-primary-btn bg-[var(--primary-color)]'}`} style={{ minWidth: '14px', height: '14px' }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-tight mt-0.5 leading-none">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="mobileTabIndicator" 
                  className="absolute -bottom-1.5 w-6 h-1 bg-[var(--primary-color)] rounded-full" 
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
