import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Grid3X3, Camera, Trophy, Star, Coins, 
  ArrowLeft, CheckCircle, Clock, AlertTriangle,
  Loader2, Play, Navigation, HelpCircle, Home, PartyPopper, Heart, MapPin,
  ShoppingCart, Info, X, List
} from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import NavigationBar from '@/components/NavigationBar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/utils/sessionManager';
import { StorageSetup, OfflineManager } from '@/utils/storageSetup';
import { PointsManager } from '@/utils/pointsManager';

import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

type GamePhase = 'welcome' | 'treasure_hunt' | 'bingo' | 'challenges';

interface Challenge {
  id: number;
  title: string;
  description: string;
  type: string;
  time_limit?: number;
  completed: boolean;
  photo_url?: string;
}

interface TreasureLocation {
  id: number;
  location_name: string;
  found: boolean;
}

interface BingoTask {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  photo_url?: string;
}



// Progress Dashboard interfaces removed



const PlayerApp = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('bingo');
  

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<number>(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [treasureIndex, setTreasureIndex] = useState(0);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhoto, setCelebrationPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // Add offline status state
  const [offlineStatus, setOfflineStatus] = useState({
    isOnline: true,
    pendingActions: 0,
    lastSync: null as string | null
  });

  // Removed progress dashboard functionality
  
  // Add confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  // Quick Peek (bottom sheet) & highlight state
  const [showQuickPeek, setShowQuickPeek] = useState(false);
  const [showQuickGrid, setShowQuickGrid] = useState(false);
  const [quickPeekQuery, setQuickPeekQuery] = useState('');
  const [highlightedTaskIndex, setHighlightedTaskIndex] = useState<number | null>(null);

  // Long-press peek state
  const longPressTimerRef = useRef<number | null>(null);
  const [longPressTaskIndex, setLongPressTaskIndex] = useState<number | null>(null);

  const handleTilePressStart = (taskIndex: number) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressTaskIndex(taskIndex);
    }, 450);
  };

  const handleTilePressEnd = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setLongPressTaskIndex(null);
  };

  // ... existing code ...
  
  const [bingoTasks, setBingoTasks] = useState<BingoTask[]>([]);

  const [treasureLocations, setTreasureLocations] = useState<TreasureLocation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  
  // Store the hardcoded game layout  
  const [gameLayout, setGameLayout] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [pendingTask, setPendingTask] = useState<any>(null);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showGameInfoDialog, setShowGameInfoDialog] = useState(false);
  const [hasSeenGameInfo, setHasSeenGameInfo] = useState(false);
  const [isQuickViewMode, setIsQuickViewMode] = useState(false);
  const [points, setPoints] = useState(0);
  const [hasSkipAbility, setHasSkipAbility] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const filteredTasks = bingoTasks
    .map((task, index) => ({ ...task, index }))
    .filter(({ title }) => (title || '').toLowerCase().includes(quickPeekQuery.toLowerCase()));

  // Auto-close celebration dialog after 1.5 seconds
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => {
        setShowCelebration(false);
        setCelebrationPhoto(null);
        setSelectedTaskId(null);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);
  
  

  // Load current budget (points_balance) from database
  const loadPointsFromDatabase = async () => {
    try {
      const currentPoints = await PointsManager.getCurrentPoints();
      setPoints(currentPoints);
      console.log('✅ Points loaded automatically (balance):', currentPoints);
    } catch (error) {
      console.error('Error loading points:', error);
      setPoints(0);
    }
  };

  // Get detailed points breakdown for UI display
  const getPointsBreakdown = async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      // Get ALL tasks for this session (not just completed ones) to get correct positions
      const { data: allTasks, error: tasksError } = await supabase
        .from('bingo_tasks')
        .select('*')
        .eq('session_id', sessionId)
        .order('id');

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        return { basePoints: 0, bonusPoints: 0, totalEarned: 0 };
      }

      // Filter to only completed tasks but keep their original positions
      const completedTasks = (allTasks || []).filter(task => task.completed);
      const basePoints = completedTasks.length * 20;
      
      // Calculate bonus points using the same logic as PointsManager
      let bonusPoints = 0;
      const colorPositions = [
        'Roze', 'Blauw', 'Geel', 'Oranje', 'Groen',
        'Blauw', 'Groen', 'Roze', 'Geel', 'Oranje',
        'Geel', 'Roze', 'Oranje', 'Blauw', 'Groen',
        'Oranje', 'Geel', 'Groen', 'Roze', 'Blauw',
        'Groen', 'Oranje', 'Blauw', 'Geel', 'Roze'
      ];

      // Map completed tasks to their correct positions in the grid (0-24)
      const tasksWithPositions = completedTasks.map(task => {
        const position = (allTasks || []).findIndex(t => t.id === task.id);
        return { ...task, position };
      }).filter(task => task.position !== -1); // Filter out any tasks not found

      // Count colors using correct positions
      const colorCounts: Record<string, number> = {};
      tasksWithPositions.forEach((task) => {
        const color = colorPositions[task.position];
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      });
      
      // Calculate bonus points
      Object.values(colorCounts).forEach((count: number) => {
        if (count >= 4) bonusPoints += 30; // 4x same color = 30 bonus
        if (count >= 5) bonusPoints += 25; // 5x same color = 25 bonus
      });
      
      // Removed: "alle 5 kleuren een keer" bonus no longer applies

      // Check for star bonus (5 completed stars)
      const starPositions = [2, 6, 12, 19, 24];
      const completedStars = tasksWithPositions.filter(task => starPositions.includes(task.position)).length;
      if (completedStars >= 5) bonusPoints += 50; // 5 stars = 50 bonus

      // Check for row/column bonuses (only first completed row/column gets the bonus)
      let rowColumnBonus = 0;
      
      // Check for completed rows (5 tasks in a row)
      for (let row = 0; row < 5; row++) {
        const rowStart = row * 5;
        const rowTasks = tasksWithPositions.filter(task => 
          task.position >= rowStart && task.position < rowStart + 5
        );
        if (rowTasks.length === 5) {
          rowColumnBonus += 35; // First completed row = 35 bonus
          break; // Only award first completed row
        }
      }
      
      // Check for completed columns (5 tasks in a column)
      for (let col = 0; col < 5; col++) {
        const colTasks = tasksWithPositions.filter(task => 
          task.position % 5 === col
        );
        if (colTasks.length === 5) {
          rowColumnBonus += 35; // First completed column = 35 bonus
          break; // Only award first completed column
        }
      }

      const totalEarned = basePoints + bonusPoints + rowColumnBonus;
      
      console.log(`🔍 Points Breakdown Debug:`);
      console.log(`  - Completed tasks: ${completedTasks.length}`);
      console.log(`  - All tasks count: ${(allTasks || []).length}`);
      console.log(`  - Base points: ${basePoints}`);
      console.log(`  - Color bonus: ${bonusPoints}`);
      console.log(`  - Row/Column bonus: ${rowColumnBonus}`);
      console.log(`  - Total earned: ${totalEarned}`);
      console.log(`  - Color counts:`, colorCounts);
      console.log(`  - Tasks with positions:`, tasksWithPositions.map(t => ({ id: t.id, position: t.position, title: t.title })));
      console.log(`  - All tasks:`, (allTasks || []).map(t => ({ id: t.id, title: t.title, completed: t.completed })));
      
      // Check for completed rows and columns
      for (let row = 0; row < 5; row++) {
        const rowStart = row * 5;
        const rowTasks = tasksWithPositions.filter(task => 
          task.position >= rowStart && task.position < rowStart + 5
        );
        if (rowTasks.length === 5) {
          console.log(`  - Row ${row} is complete!`);
        }
      }
      
      for (let col = 0; col < 5; col++) {
        const colTasks = tasksWithPositions.filter(task => 
          task.position % 5 === col
        );
        if (colTasks.length === 5) {
          console.log(`  - Column ${col} is complete!`);
        }
      }
      
      return { 
        basePoints, 
        bonusPoints: bonusPoints + rowColumnBonus, 
        totalEarned
      };
    } catch (error) {
      console.error('Error calculating points breakdown:', error);
      return { basePoints: 0, bonusPoints: 0, totalEarned: 0 };
    }
  };

  const [pointsBreakdown, setPointsBreakdown] = useState({ basePoints: 0, bonusPoints: 0, totalEarned: 0 });
  const [actualExpenses, setActualExpenses] = useState(0);

  // Load both points (current balance) and breakdown automatically
  const loadPointsAndBreakdown = async () => {
    try {
      setIsLoadingPoints(true);
      
      // Debug session context
      const sessionId = SessionManager.getSessionId();
      
      // Ensure session context is set before any DB operations
      await SessionManager.setSessionContext(sessionId);
      
      // Get current balance for budget display
      const currentBalance = await PointsManager.getCurrentPoints();
      setPoints(currentBalance);
      
      const breakdown = await getPointsBreakdown();
      setPointsBreakdown(breakdown);
      
      // Reload row/column status after loading points
      setTimeout(() => reloadRowColumnStatus(), 100);
      
      // Calculate actual expenses (shop purchases + Simply Wild losses)
      const { data: shopPurchases } = await supabase
        .from('shop_purchases')
        .select('price')
        .eq('session_id', sessionId);
      
      const shopExpenses = (shopPurchases || []).reduce((sum, p) => sum + p.price, 0);
      
      // For Simply Wild losses, we need to calculate the difference
      // between what was spent and what was won
      // This is more complex and would need to be tracked separately
      // For now, we'll use a simplified approach
      
      // Compute Simply Wild net (wins - losses) using identity:
      // currentBalance = tasksEarned + simplyNet - shopExpenses
      // => simplyNet = currentBalance - tasksEarned + shopExpenses
      const tasksEarned = breakdown.totalEarned;
      const simplyNet = currentBalance - tasksEarned + shopExpenses;
      const simplyLoss = Math.min(0, simplyNet); // negative if loss
      setActualExpenses(simplyLoss - shopExpenses);
      

      

    } catch (error) {
      console.error('Error loading points:', error);
      // Don't show toast for missing session, this is expected initially
      if (!error.message?.includes('0 rows')) {
      toast({
        title: "Fout bij laden punten",
        description: "Kon je punten niet laden.",
        variant: "destructive",
      });
      }
    } finally {
      setIsLoadingPoints(false);
    }
  };

// Load whether 'Skip Opdracht' is purchased for this session
const loadSkipAbility = async () => {
  try {
    const sessionId = SessionManager.getSessionId();
    const { data, error } = await (supabase as any)
      .from('shop_purchases')
      .select('item_id')
      .eq('session_id', sessionId);
    if (error) {
      console.error('Error loading skip ability:', error);
      setHasSkipAbility(false);
      return;
    }
    const purchased = (data || []).some((row: any) => row.item_id === 'skip-opdracht-straf');
    const usedFlag = localStorage.getItem(`skipUsed:${sessionId}`) === 'true';
    setHasSkipAbility(purchased && !usedFlag);
  } catch (e) {
    console.error('Error loading skip ability:', e);
    setHasSkipAbility(false);
    }
  };

  // Color position mapping
  const colorPositions = {
    0: 'Roze', 1: 'Blauw', 2: 'Geel', 3: 'Oranje', 4: 'Groen',
    5: 'Blauw', 6: 'Groen', 7: 'Roze', 8: 'Geel', 9: 'Oranje',
    10: 'Geel', 11: 'Roze', 12: 'Oranje', 13: 'Blauw', 14: 'Groen',
    15: 'Oranje', 16: 'Geel', 17: 'Groen', 18: 'Roze', 19: 'Blauw',
    20: 'Groen', 21: 'Oranje', 22: 'Blauw', 23: 'Geel', 24: 'Roze'
  };

  // Track completed rows and columns to prevent duplicate bonuses
  const [completedRows, setCompletedRows] = useState<Set<number>>(new Set());
  const [completedColumns, setCompletedColumns] = useState<Set<number>>(new Set());
  // Track which specific row/column earned the bonus to highlight J/E/L/L/E
  const [awardedRowIndex, setAwardedRowIndex] = useState<number | null>(null);
  const [awardedColumnIndex, setAwardedColumnIndex] = useState<number | null>(null);



  // Reload row/column bonus status when tasks are loaded (without awarding points)
  const reloadRowColumnStatus = () => {
    if (!gameLayout || bingoTasks.length === 0) return;
    
    // Use the same logic as getPointsBreakdown - map tasks to correct positions
    const tasksWithPositions = bingoTasks.map(task => {
      const position = bingoTasks.findIndex(t => t.id === task.id);
      return { ...task, position };
    }).filter(task => task.completed && task.position !== -1);
    
    // Reset awards first
    setAwardedRowIndex(null);
    setAwardedColumnIndex(null);
    
    // Check for completed rows (5 tasks in a row)
    for (let row = 0; row < 5; row++) {
      const rowStart = row * 5;
      const rowTasks = tasksWithPositions.filter(task => 
        task.position >= rowStart && task.position < rowStart + 5
      );
      if (rowTasks.length === 5) {
        setAwardedRowIndex(row);
        setCompletedRows(prev => new Set([...prev, row]));
        break; // Only award first completed row
      }
    }
    
    // Check for completed columns (5 tasks in a column)
    for (let col = 0; col < 5; col++) {
      const colTasks = tasksWithPositions.filter(task => 
        task.position % 5 === col
      );
      if (colTasks.length === 5) {
        setAwardedColumnIndex(col);
        setCompletedColumns(prev => new Set([...prev, col]));
        break; // Only award first completed column
      }
    }
    
    console.log(`🔍 Row/Column Status Debug:`);
    console.log(`  - Tasks with positions:`, tasksWithPositions.map(t => ({ id: t.id, position: t.position, title: t.title })));
    console.log(`  - Awarded row:`, awardedRowIndex);
    console.log(`  - Awarded column:`, awardedColumnIndex);
  };

  // Derive current bonus status (for striking through rules and listing achievements)
  const getBonusStatus = () => {
    if (!gameLayout || bingoTasks.length === 0) {
      return {
        has4SameColor: false,
        has5SameColor: false,
        // hasAllColorsOnce: removed
        has5Stars: false,
        hasRowBonus: false,
        hasColumnBonus: false,
        completedStars: 0,
        totalStars: 5,
      };
    }
    
    // Use the same logic as getPointsBreakdown - map tasks to correct positions
    const tasksWithPositions = bingoTasks.map(task => {
      const position = bingoTasks.findIndex(t => t.id === task.id);
      return { ...task, position };
    }).filter(task => task.completed && task.position !== -1);
    
    const colorCounts: Record<string, number> = {};
    tasksWithPositions.forEach(task => {
      const color = colorPositions[task.position];
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    const has4SameColor = Object.values(colorCounts).some((count: number) => count >= 4);
    const has5SameColor = Object.values(colorCounts).some((count: number) => count >= 5);
    // Removed: hasAllColorsOnce bonus no longer applies
    const starPositions = [2, 6, 12, 19, 24];
    const completedStars = tasksWithPositions.filter(task => starPositions.includes(task.position)).length;
    const has5Stars = completedStars >= 5;

    // Dynamisch herberekenen van rij/kolom bonussen (niet afhankelijk van state)
    let hasRowBonus = false;
    for (let row = 0; row < 5; row++) {
      const rowStart = row * 5;
      const rowTasks = tasksWithPositions.filter(task => 
        task.position >= rowStart && task.position < rowStart + 5
      );
      if (rowTasks.length === 5) { hasRowBonus = true; break; }
    }

    let hasColumnBonus = false;
    for (let col = 0; col < 5; col++) {
      const colTasks = tasksWithPositions.filter(task => task.position % 5 === col);
      if (colTasks.length === 5) { hasColumnBonus = true; break; }
    }
    return {
      has4SameColor,
      has5SameColor,
      // hasAllColorsOnce: removed
      has5Stars,
      hasRowBonus,
      hasColumnBonus,
      completedStars,
      totalStars: 5,
    };
  };

  // Build achieved rewards list for UI
  const calculateRewards = () => {
    const status = getBonusStatus();
    const rewards: string[] = [];
    if (status.has4SameColor) rewards.push('4x dezelfde kleur = 30 punten');
    if (status.has5SameColor) rewards.push('5x dezelfde kleur = 25 punten');
    // Removed: "alle 5 kleuren een keer" bonus
    if (status.has5Stars) rewards.push('5 sterren = 50 punten');
    if (status.hasRowBonus) rewards.push('Eerste volledige rij = 35 punten');
    if (status.hasColumnBonus) rewards.push('Eerste volledige kolom = 35 punten');
    return rewards;
  };

  // Initialize session and load data
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        
        // Initialize session silently in background
        await SessionManager.createSession(name);
        
        // Load all data in parallel
        await Promise.all([
          loadBingoTasks(),
          loadTreasureLocations(),
          loadChallenges(),
          loadPointsAndBreakdown(),
          loadSkipAbility()
        ]);
        

        

        
        // Set up real-time subscriptions
        const bingoSubscription = supabase
          .channel('bingo-updates')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'bingo_tasks' },
            () => {
              loadBingoTasks();
            }
          )
          .subscribe();

        const challengesSubscription = supabase
          .channel('challenges-updates')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'challenges' },
            () => {
              loadChallenges();
            }
          )
          .subscribe();

        // Live messages from admin → toast for this session
        const sessionIdForLive = SessionManager.getSessionId();
        const liveMessagesSubscription = supabase
          .channel('live-messages')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'live_messages', filter: `session_id=eq.${sessionIdForLive}` },
            (payload: any) => {
              try {
                const message = payload?.new?.message || 'Nieuw bericht';
                // Command protocol: CMD:APP_RESET | CMD:RELOAD | CMD:NAV:/path
                if (typeof message === 'string' && message.startsWith('CMD:')) {
                  const cmd = message.substring(4);
                  if (cmd === 'APP_RESET') {
                    try {
                      // Preserve session id, clear other local flags
                      const sessionIdKeep = localStorage.getItem('gameSessionId');
                      localStorage.clear();
                      if (sessionIdKeep) localStorage.setItem('gameSessionId', sessionIdKeep);
                    } catch {}
                    toast({ title: '🔄 App reset vanuit admin', description: 'App wordt opnieuw gestart' });
                    navigate('/info');
                    return;
                  }
                  if (cmd === 'RELOAD') {
                    toast({ title: '🔄 Herladen', description: 'Pagina wordt herladen' });
                    setTimeout(() => window.location.reload(), 300);
                    return;
                  }
                  if (cmd.startsWith('NAV:')) {
                    const path = cmd.substring(4) || '/';
                    navigate(path);
                    return;
                  }
                }
                // Default: show as message
                toast({ title: '📨 Bericht van de organisator', description: message });
                if (navigator.vibrate) navigator.vibrate(15);
              } catch (e) {
                console.warn('Live message handler error', e);
              }
            }
          )
          .subscribe();

        // Live challenges from admin → switch to challenges view
        const liveChallengesSubscription = supabase
          .channel('live-challenges')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'live_challenges', filter: `session_id=eq.${sessionIdForLive}` },
            (payload: any) => {
              try {
                const lc = payload?.new || {};
                setCurrentChallenge({
                  id: lc.id,
                  title: lc.title || 'Nieuwe uitdaging',
                  description: lc.description || '',
                  type: lc.type || 'instant',
                  time_limit: lc.time_limit || undefined,
                  completed: false,
                });
                setGamePhase('challenges');
                setIsWaiting(false);
                toast({ title: '⚡ Nieuwe uitdaging!', description: lc.title || 'Check je opdracht' });
                if (navigator.vibrate) navigator.vibrate(30);
              } catch (e) {
                console.warn('Live challenge handler error', e);
              }
            }
          )
          .subscribe();

        return () => {
          bingoSubscription.unsubscribe();
          challengesSubscription.unsubscribe();
          liveMessagesSubscription.unsubscribe();
          liveChallengesSubscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing game:', error);
        toast({
          title: "Fout bij laden",
          description: "Er ging iets mis bij het laden van de app. Probeer het opnieuw.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeGame();
  }, [name, navigate]);

  // Add offline manager initialization
  useEffect(() => {
    const initializeOfflineManager = async () => {
      await OfflineManager.initialize();
      
      // Update offline status
      const status = OfflineManager.getOfflineStatus();
      setOfflineStatus(status);
    };

    initializeOfflineManager();
  }, []);

  // Generate hardcoded game layout - ALWAYS create layout for grid display
  useEffect(() => {
    if (!gameLayout) {

      
      // Hardcoded color array according to specification
      const colorArray = [
        'pink', 'blue', 'yellow', 'orange', 'green',
        'blue', 'green', 'pink', 'yellow', 'orange', 
        'yellow', 'pink', 'orange', 'blue', 'green',
        'orange', 'yellow', 'green', 'pink', 'blue',
        'green', 'orange', 'blue', 'yellow', 'pink'
      ];

      // All tasks are now worth 20 points each
      const taskTypeArray = Array(25).fill('20');

      // Star positions as requested by user:
      // Positions: 2, 6, 12, 19, 24
      const starPositions = [2, 6, 12, 19, 24];

      setGameLayout({
        colorArray,
        taskTypeArray,
        starPositions
      });
      
      // Reload row/column status after layout is set
      setTimeout(() => reloadRowColumnStatus(), 100);
    }
  }, [bingoTasks, gameLayout]);

  // Refresh points when returning to the app (from shop/simply wild)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again, refresh points and bonus status
        loadPointsAndBreakdown();
      }
    };

    const handleFocus = () => {
      // Window got focus, refresh points and bonus status
      loadPointsAndBreakdown();
    };

    const handlePointsUpdated = () => {
      // Points were updated by another component, refresh display
      loadPointsAndBreakdown();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pointsUpdated', handlePointsUpdated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pointsUpdated', handlePointsUpdated);
    };
  }, []);

  const loadBingoTasks = async () => {
    try {
      const sessionId = SessionManager.getSessionId();

      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      const { data, error } = await supabase
        .from('bingo_tasks')
        .select('*')
        .eq('session_id', sessionId)
        .order('id');

      if (error) {
        console.error('Error loading bingo tasks:', error);
        // If no rows found, this might be a new session that needs initialization
        if (error.code === 'PGRST116') {
  
          setBingoTasks([]);
          return [];
        }
        toast({
          title: "Fout bij laden opdrachten",
          description: "Kon je bingo opdrachten niet laden. Probeer de app opnieuw te openen.",
          variant: "destructive",
        });
        return [];
      }


      setBingoTasks(data || []);
      
      // Reload row/column bonus status after loading tasks
      setTimeout(() => reloadRowColumnStatus(), 100);
      
      return data || [];
    } catch (error) {
      console.error('Error loading bingo tasks:', error);
      toast({
        title: "Netwerk fout",
        description: "Kon geen verbinding maken met de server. Controleer je internetverbinding.",
        variant: "destructive",
      });
      return [];
    }
  };

  const loadTreasureLocations = async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      const { data, error } = await supabase
        .from('treasure_hunt')
        .select('*')
        .eq('session_id', sessionId)
        .order('id');

      if (error) {
        console.error('Error loading treasure locations:', error);
        toast({
          title: "Fout bij laden schattenjacht",
          description: "Kon de schattenjacht locaties niet laden.",
          variant: "destructive",
        });
        return;
      }

      setTreasureLocations(data || []);
    } catch (error) {
      console.error('Error loading treasure locations:', error);
      toast({
        title: "Netwerk fout",
        description: "Kon geen verbinding maken met de server.",
        variant: "destructive",
      });
    }
  };

  const loadChallenges = async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('session_id', sessionId)
        .order('id');

      if (error) {
        console.error('Error loading challenges:', error);
        toast({
          title: "Fout bij laden uitdagingen",
          description: "Kon de uitdagingen niet laden.",
          variant: "destructive",
        });
        return;
      }

      setChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast({
        title: "Netwerk fout",
        description: "Kon geen verbinding maken met de server.",
        variant: "destructive",
      });
    }
  };



  useEffect(() => {
    if (timer && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleStartGame = () => {
    setGamePhase('treasure_hunt');
    toast({
      title: "Schattenjacht begonnen!",
      description: "Volg de aanwijzingen om je vrienden te vinden!",
    });
  };

  const handleFoundLocation = async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      const { error } = await supabase
        .from('treasure_hunt')
        .update({ 
          found: true, 
          found_at: new Date().toISOString()
        })
        .eq('id', treasureLocations[treasureIndex].id);

      if (error) throw error;

      // Update local state
      setTreasureLocations(prev => 
        prev.map((location, index) => 
          index === treasureIndex 
            ? { ...location, found: true }
            : location
        )
      );

      toast({
        title: "🎉 Locatie gevonden!",
        description: "Ga naar de volgende locatie of terug naar bingo",
        duration: 3000,
      });

      // Move to next location or back to bingo
      if (treasureIndex < 2) {
        setTreasureIndex(prev => prev + 1);
      } else {
        setGamePhase('bingo');
        toast({
          title: "🏆 Schattenjacht voltooid!",
          description: "Ga verder met je bingo opdrachten!",
          duration: 4000,
        });
      }

    } catch (error) {
      console.error('Error marking location as found:', error);
      toast({
        title: "Fout",
        description: "Kon locatie niet markeren als gevonden",
        variant: "destructive"
      });
    }
  };

  // Bingo functions
  const toggleBingoTask = async (taskId: number) => {
    setSelectedTaskId(taskId);
    setShowPhotoUpload(true);
  };

  // Modify handlePhotoUpload to use offline manager
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setPhotoPreview(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error creating photo preview:', error);
      toast({
        title: "Fout bij foto preview",
        description: "Er ging iets mis bij het maken van de foto preview.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Clear photo preview and allow new photo selection
  const handleClearPhoto = () => {
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById('bingo-photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Upload photo and complete task
  const handleCompleteWithPhoto = async () => {
    if (!photoPreview || !selectedTaskId) return;

    setIsCompletingTask(true);

    try {
      // Get the file input to access the original file
      const fileInput = document.getElementById('bingo-photo-input') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      // Helper: compress image to reduce upload size (max 1200px width, 0.7 quality)
      const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const targetWidth = Math.round(img.width * scale);
            const targetHeight = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported'));
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            canvas.toBlob(
              (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
              'image/jpeg',
              quality
            );
          };
          img.onerror = () => reject(new Error('Image load failed'));
          const reader = new FileReader();
          reader.onload = () => { img.src = reader.result as string; };
          reader.onerror = () => reject(new Error('File read failed'));
          reader.readAsDataURL(file);
        });
      };
      
      if (file && navigator.onLine) {
        // Try to upload online first
        // Ensure storage buckets exist
        const storageReady = await StorageSetup.initializeStorage();
        
        if (storageReady) {
          const fileName = `bingo-${selectedTaskId}-${Date.now()}.jpg`;
          // Compress before upload
          const compressed = await compressImage(file);
          const { data, error } = await supabase.storage
            .from('bingo-photos')
            .upload(fileName, compressed);

          if (error) {
            console.error('Upload error:', error);
            throw error;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('bingo-photos')
            .getPublicUrl(fileName);

          console.log('Photo uploaded successfully:', publicUrl);
          
          // Complete the task with photo
          await completeBingoTask(selectedTaskId, publicUrl);
        } else {
          // Fallback to base64 if storage setup fails
          console.log('Using base64 fallback for bingo photo');
          await completeBingoTask(selectedTaskId, photoPreview);
        }
      } else if (!navigator.onLine) {
        // Queue for offline sync
        // If possible, compress before queue to save storage
        const compressed = file ? await compressImage(file) : null;
        await OfflineManager.queueAction('photo_upload', {
          fileName: `bingo-${selectedTaskId}-${Date.now()}.jpg`,
          file: compressed || file,
          taskId: selectedTaskId,
          sessionId: SessionManager.getSessionId()
        });

        toast({
          title: " Foto geüpload (offline)",
          description: "Foto wordt gesynchroniseerd zodra internet beschikbaar is",
        });

        // Complete task without photo for now
        await completeBingoTask(selectedTaskId, null);
      } else {
        // Use base64 preview as fallback
        await completeBingoTask(selectedTaskId, photoPreview);
      }

      // Reset states
      setShowPhotoUpload(false);
      setSelectedTaskId(null);
      setPhotoPreview(null);

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Fout bij uploaden",
        description: "Kon foto niet uploaden. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsCompletingTask(false);
    }
  };

  // Remove the handleSkipPhoto function as skipping is no longer allowed


  // Modify completeBingoTask to use offline manager
  const completeBingoTask = async (taskId: number, photoUrl: string | null) => {
    setIsCompletingTask(true);
    try {
      const sessionId = SessionManager.getSessionId();
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });

      // 1) Persist completion in DB – if THIS fails, show error and exit early
      const { error } = await supabase
        .from('bingo_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          photo_url: photoUrl,
        })
        .eq('id', taskId);
      if (error) {
        throw error;
      }

      // 2) Local state update (non-critical)
      try {
        setBingoTasks(prev =>
          prev.map(task =>
            task.id === taskId
              ? { ...task, completed: true, photo_url: photoUrl }
              : task
          )
        );
      } catch (stateError) {
        console.warn('Non-critical: failed to update local bingo state', stateError);
      }

      // 3) Bereken delta en voeg toe aan budget
      try {
        // Nieuwe breakdown na deze completion
        const newBreakdown = await getPointsBreakdown();
        const delta = Math.max(0, newBreakdown.totalEarned - pointsBreakdown.totalEarned);
        if (delta > 0) {
          await PointsManager.addPoints(delta);
          const updated = await PointsManager.getCurrentPoints();
          if (navigator.vibrate) navigator.vibrate(20);
          setPoints(updated);
          setPointsBreakdown(newBreakdown);
          window.dispatchEvent(new CustomEvent('pointsUpdated'));
        }
      } catch (pointsError) {
        console.warn('Non-critical: failed to update points delta', pointsError);
      }

      // 4) Bonuses and UI effects – wrap individually to avoid failing the whole flow
      try {
        const updatedTasks = bingoTasks.map(task =>
          task.id === taskId ? { ...task, completed: true } : task
        );
        // Row/column bonuses are now handled in PointsManager.calculateBonusPoints()
      } catch (bonusError) {
        console.warn('Non-critical: bonus checks failed', bonusError);
      }

      try {
        triggerConfetti();
        setCelebrationPhoto(photoUrl);
        setShowCelebration(true);
        setSelectedTaskId(taskId);
      } catch (uiError) {
        console.warn('Non-critical: UI celebration failed', uiError);
      }
    } catch (error) {
      console.error('Error completing task (critical):', error);
      toast({
        title: 'Fout',
        description: 'Kon opdracht niet voltooien',
        variant: 'destructive',
      });
    } finally {
      setIsCompletingTask(false);
    }
  };



  // Row/column bonuses are now handled in PointsManager.calculateBonusPoints()
  // No need for separate bonus awarding

  const handleStartChallenge = () => {
    if (currentChallenge?.type === 'timed') {
      setTimer(currentChallenge.time_limit || 0);
    }
  };

  const handleCompleteChallenge = async () => {
    // For challenges, we also need photo proof
    setSelectedTaskId(999); // Use a special ID for challenges
    setShowPhotoUpload(true);
  };

  const handleNeedHelp = () => {
    setShowInfoDialog(true);
  };

  // Handle task click - new task system
  const handleTaskClick = (taskIndex: number) => {
    if (pendingTask && pendingTask !== taskIndex) {
      toast({
        title: "Vorige opdracht eerst afronden!",
        description: "Je moet de vorige opdracht eerst voltooien voordat je een nieuwe kunt beginnen.",
        variant: "destructive"
      });
      return;
    }

    const task = bingoTasks[taskIndex];
    if (!task || task.completed) return;

    const { colorArray, taskTypeArray, starPositions } = gameLayout;
    const cellColor = colorArray[taskIndex];
    const taskType = taskTypeArray[taskIndex];
    const hasStarIcon = starPositions.includes(taskIndex);

    // Use actual task data from database instead of hardcoded descriptions
    setSelectedTask({
      taskIndex,
      task,
      color: cellColor,
      type: taskType,
      description: task.description || task.title, // Use actual task description from database
      hasStar: hasStarIcon
    });
    setShowTaskDialog(true);
  };

  // Handle task completion choice
  const handleTaskChoice = async (choice: 'later' | 'done') => {
    if (choice === 'later') {
      // Simply close dialog and return to overview
      setShowTaskDialog(false);
      setSelectedTask(null);
    } else {
      // Mark task as ready to complete with photo
      setSelectedTaskId(selectedTask.task.id);
      setShowTaskDialog(false);
      setShowPhotoUpload(true);
    }
  };

  // Open confirm dialog for skipping
  const handleOpenSkipConfirm = () => {
    setShowSkipConfirm(true);
  };

  // Confirm and perform skip: complete without photo and consume ability
  const confirmSkipTask = async () => {
    try {
      const taskId = selectedTask?.task?.id;
      if (!taskId) {
        setShowSkipConfirm(false);
        return;
      }
      // Close dialogs
      setShowSkipConfirm(false);
      setShowTaskDialog(false);

      // Complete without photo (awards points and marks completed)
      await completeBingoTask(taskId, null);

      // Consume skip (one-time)
      const sessionId = SessionManager.getSessionId();
      localStorage.setItem(`skipUsed:${sessionId}`, 'true');
      setHasSkipAbility(false);

      toast({
        title: "Opdracht geskipt",
        description: "Je hebt je skip gebruikt. Deze kan maar 1x worden gebruikt.",
      });
    } catch (e) {
      console.error('Error skipping task:', e);
      toast({
        title: "Fout bij skippen",
        description: "Kon de opdracht niet skippen. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  const cancelSkipTask = () => setShowSkipConfirm(false);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getChallengeVariant = (type: string) => {
    switch (type) {
      case 'emergency': return 'emergency';
      case 'timed': return 'warning';
      default: return 'party';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'pink': return 'bg-pink-500';
      case 'blue': return 'bg-blue-400';
      case 'yellow': return 'bg-yellow-400';
      case 'orange': return 'bg-orange-500';
      case 'green': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  // Add confetti trigger function
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Confetti overlay component
  const ConfettiOverlay = () => (
    showConfetti ? (
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute inset-0 bg-transparent overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
              🎉
          </div>
        ))}
      </div>
      </div>
    ) : null
  );

  // Show game info dialog on first visit
  useEffect(() => {
    if (gamePhase === 'bingo' && !hasSeenGameInfo) {
      const hasSeenInfo = localStorage.getItem('hasSeenGameInfo');
      if (!hasSeenInfo) {
        setShowGameInfoDialog(true);
        setHasSeenGameInfo(true);
        localStorage.setItem('hasSeenGameInfo', 'true');
      }
    }
  }, [gamePhase, hasSeenGameInfo]);

  return (
    <div 
      className="min-h-screen min-w-full fixed top-0 left-0 bg-white relative overflow-auto"
    >
      {/* Removed background overlay for clean white background */}
      {/* Status Bar - Optimized for mobile */}
      <div className="relative bg-card backdrop-blur-sm border-b border-border p-3 shadow-subtle">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => navigate('/home')}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-destructive'}`}></div>
            <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            {gamePhase === 'challenges' && (
              <span className="text-muted-foreground">
                | Voltooid: <span className="font-bold text-success">{completedChallenges}</span>
              </span>
            )}
            <Button
              onClick={() => setShowGameInfoDialog(true)}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
            >
              <Info className="w-4 h-4" />
            </Button>
            {gamePhase === 'bingo' && (
              <Button
                onClick={() => setShowQuickGrid(true)}
                variant="ghost"
                size="sm"
                className={`p-1 h-auto`}
              >
                {'👁️'}
              </Button>
            )}
          </div>
          <CountdownTimer compact={true} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md mx-auto">
          {/* Welcome Section - Mobile optimized with image */}
          <div className="text-center mb-6">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto mb-4">
              <img 
                src="/lovable-uploads/cb7df27d-63af-4307-a988-71139bf41906.png" 
                alt="Bingo Title" 
                className="w-full h-auto object-contain rounded-lg opacity-90 border border-white/20 shadow-subtle"
              />
            </div>
          </div>

          {/* Welcome Phase */}
          {gamePhase === 'welcome' && (
            <Card className="bg-card backdrop-blur-sm border-border animate-bounce-in shadow-subtle">
              <CardContent className="p-6 text-center space-y-6">
                <div className="mb-4">
                  <Play className="w-16 h-16 text-primary mx-auto" />
                </div>
                <h2 className="text-xl font-bold">Welkom bij je Vrijgezellenfeest!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Epische dag vol uitdagingen! Eerst schattenjacht, dan bingo opdrachten.
                </p>
                <Button
                  onClick={handleStartGame}
                  variant="party"
                  size="massive"
                  className="w-full"
                >
                  <Navigation className="w-6 h-6" />
                  Start het Avontuur!
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Treasure Hunt Phase */}
        {gamePhase === 'treasure_hunt' && (
          <Card className="bg-card backdrop-blur-sm border-border animate-bounce-in shadow-subtle">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <MapPin className="w-8 h-8 text-primary mr-3" />
                Schattenjacht - Locatie {treasureIndex + 1}/3
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                 <h3 className="text-lg font-bold mb-2 text-primary">📍 Locatie:</h3>
                 <p className="text-sm leading-relaxed">
                   {treasureLocations[treasureIndex]?.location_name}
                 </p>
               </div>
              
              <div className="space-y-4">
                <Button
                  onClick={handleNeedHelp}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <HelpCircle className="w-5 h-5" />
                  Hulp Nodig!
                </Button>

                <Button
                  onClick={handleFoundLocation}
                  variant="success"
                  size="massive"
                  className="w-full"
                >
                  <CheckCircle className="w-8 h-8" />
                  Locatie Gevonden!
                </Button>

                <Button
                  onClick={handleNeedHelp}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                >
                  <HelpCircle className="w-5 h-5" />
                  Hulp Nodig!
                </Button>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Bingo Phase */}
        {gamePhase === 'bingo' && (
          <div className="space-y-6">


            

            {/* Keer op Keer 2 Game Grid */}
            {isLoading ? (
              <div className="bg-gray-300/70 p-4 rounded-lg shadow-subtle">
                <div className="grid grid-cols-6 gap-1 mx-auto w-fit">
                  {Array.from({ length: 36 }).map((_, index) => (
                    <Skeleton key={index} className="w-12 h-12 sm:w-14 sm:h-14" />
                  ))}
                </div>
              </div>
            ) : (
              <div className={`bg-gray-300/70 p-4 rounded-lg shadow-subtle transition-all duration-300 ${
                pendingTask !== null ? 'backdrop-blur-sm' : ''
              }`}>
              <div className="grid grid-cols-6 gap-1 mx-auto w-fit">
                {/* First row: JELLE horizontally + empty cell */}
                {['J', 'E', 'L', 'L', 'E'].map((letter, index) => {
                  return (
                    <div
                      key={`top-${index}`}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 border flex items-center justify-center font-bold text-sm text-black transition-all duration-300 ${pendingTask !== null ? 'filter blur-[2px] opacity-50' : ''} ${awardedColumnIndex === index ? (index % 2 === 0 ? 'bg-yellow-300 border-yellow-600' : 'bg-blue-300 border-blue-600') : 'bg-white border-gray-600'}`}
                    >
                      {letter}
                    </div>
                  );
                })}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                  <Button
                    onClick={() => setShowInfoDialog(true)}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0 text-sm font-bold bg-white/90 hover:bg-white rounded-full border-2 border-gray-400"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* 5x5 grid with colored cells + vertical JELLE */}
                {gameLayout && Array.from({ length: 5 }).map((_, row) => {
                  const { colorArray, taskTypeArray, starPositions } = gameLayout;
                  
                  return (
                    <>
                      {Array.from({ length: 5 }).map((_, col) => {
                        const taskIndex = row * 5 + col;
                        const task = bingoTasks[taskIndex] || { 
                          id: taskIndex, 
                          title: isLoading ? 'Laden...' : 'Nog niet geladen', 
                          completed: false 
                        };
                        
                        // Show placeholder if no task loaded yet

                        const cellColor = colorArray[taskIndex];
                        const taskType = taskTypeArray[taskIndex];

                        // Color mapping
                        const colorClasses = {
                          pink: { bg: 'bg-pink-500', inner: 'bg-pink-300' },
                          blue: { bg: 'bg-blue-400', inner: 'bg-blue-200' },
                          yellow: { bg: 'bg-yellow-400', inner: 'bg-yellow-200' },
                          orange: { bg: 'bg-orange-500', inner: 'bg-orange-300' },
                          green: { bg: 'bg-green-400', inner: 'bg-green-200' }
                        };

                        const hasStarIcon = starPositions.includes(taskIndex);
                        const isPendingTask = pendingTask === taskIndex;
                        const isBlurred = pendingTask !== null && !isPendingTask;

                        return (
                          <div
                            key={task.id}
                            onClick={() => handleTaskClick(taskIndex)}
                            onMouseDown={() => handleTilePressStart(taskIndex)}
                            onMouseUp={handleTilePressEnd}
                            onMouseLeave={handleTilePressEnd}
                            onTouchStart={() => handleTilePressStart(taskIndex)}
                            onTouchEnd={handleTilePressEnd}
                            className={`
                              relative border border-black/20 rounded cursor-pointer
                              transition-all duration-300 ${colorClasses[cellColor].bg}
                              ${task.completed ? 'opacity-60 border-black' : ''}
                              w-12 h-12 sm:w-14 sm:h-14
                              ${isPendingTask ? 'ring-4 ring-red-500 ring-opacity-75 scale-105 z-10 shadow-lg border-red-500' : 'hover:scale-105'}
                              ${isBlurred ? 'filter blur-[2px] opacity-30 pointer-events-none' : ''}
                              ${highlightedTaskIndex === taskIndex ? 'ring-4 ring-primary animate-pulse' : ''}
                            `}
                          >
                            {longPressTaskIndex === taskIndex && (
                              <div className="absolute inset-0 z-30 bg-black/70 text-white text-[10px] sm:text-xs p-1 flex items-center justify-center text-center rounded">
                                <span className="line-clamp-4 px-1">{task.title}</span>
                              </div>
                            )}
                            {/* Inner circle - larger size (1.2x), hidden if has star */}
                            {!hasStarIcon && !isQuickViewMode && (
                              <div 
                                className={`
                                  absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                  w-10 h-10 sm:w-12 sm:h-12
                                  ${colorClasses[cellColor].inner}
                                `}
                              ></div>
                            )}

                            {/* Quick View Mode - Show task text */}
                            {isQuickViewMode && !hasStarIcon && (
                              <div className="absolute inset-0 flex items-center justify-center p-1">
                                <div className="text-xs font-bold text-white text-center leading-tight">
                                  {task.title.split(' ').slice(0, 3).join(' ')}
                                  {task.title.split(' ').length > 3 ? '...' : ''}
                                </div>
                              </div>
                            )}

                            {/* Star icon - larger size, no circle background, no shadow */}
                            {hasStarIcon && !isQuickViewMode && (
                              <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="relative" style={{ fontSize: '2.2rem' }}>
                                  {(() => {
                                    // Map star positions to specific color positions for fill
                                    const starFillMapping = {
                                      2: 8,   // ster op positie 2 → zelfde fill als rondje op positie 8
                                      6: 4,   // ster op positie 6 → zelfde fill als rondje op positie 4
                                      12: 9,  // ster op positie 12 → zelfde fill als rondje op positie 9
                                      19: 13, // ster op positie 19 → zelfde fill als rondje op positie 13
                                      24: 18  // ster op positie 24 → zelfde fill als rondje op positie 18
                                    };
                                    
                                    const targetColorPosition = starFillMapping[taskIndex];
                                    const targetColor = targetColorPosition !== undefined ? colorArray[targetColorPosition] : cellColor;
                                    const fillColor = colorClasses[targetColor].inner;
                                    
                                    // Extract the actual color value from Tailwind class
                                    const colorMap = {
                                      'bg-pink-300': '#f9a8d4',
                                      'bg-blue-200': '#bfdbfe', 
                                      'bg-yellow-200': '#fef08a',
                                      'bg-orange-300': '#fdba74',
                                      'bg-green-200': '#bbf7d0'
                                    };
                                    
                                    const actualFillColor = colorMap[fillColor] || '#ffffff';
                                    
                                    return (
                                       <span style={{
                                         color: actualFillColor,
                                         WebkitTextStroke: '2px white'
                                       }}>★</span>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* Quick View Mode - Show task text for stars */}
                            {isQuickViewMode && hasStarIcon && (
                              <div className="absolute inset-0 flex items-center justify-center p-1 z-20">
                                <div className="text-xs font-bold text-white text-center leading-tight">
                                  {task.title.split(' ').slice(0, 3).join(' ')}
                                  {task.title.split(' ').length > 3 ? '...' : ''}
                                </div>
                              </div>
                            )}

                            {/* Task completed indicator */}
                            {task.completed && !isQuickViewMode && (
                              <div className="absolute inset-0 flex items-center justify-center z-30">
                                <span className="font-bold text-white text-sm">
                                  ✓
                                </span>
                              </div>
                            )}

                            {/* Completion mark */}
                            {task.completed && !isQuickViewMode && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                                <img 
                                  src="/lovable-uploads/5494cc39-5957-49b4-8556-694f0dfab476.png" 
                                  alt="Completed" 
                                  className={`object-contain ${isPendingTask ? 'w-12 h-12' : 'w-10 h-10'}`}
                                />
                              </div>
                            )}

                            {/* Quick View Mode - Show completion status */}
                            {isQuickViewMode && task.completed && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                                ✓
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Vertical JELLE letters - with border boxes */}
                      <div className={`relative w-12 h-12 sm:w-14 sm:h-14 border flex items-center justify-center font-bold text-sm text-black transition-all duration-300 ${pendingTask !== null ? 'filter blur-[2px] opacity-50' : ''} ${awardedRowIndex === row ? (row % 2 === 0 ? 'bg-yellow-300 border-yellow-600' : 'bg-blue-300 border-blue-600') : 'bg-white border-gray-600'}`}>
                        {['J', 'E', 'L', 'L', 'E'][row]}
                      </div>
                    </>
                  );
                })}
              </div>
            </div>
            )}

{/* Bonus Status */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm border-primary/20 shadow-subtle">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center text-primary">
                  <Trophy className="w-5 h-5 mr-2" />
                  Bonus
                </h3>
                
                <div className="grid gap-3">
                  {/* Bonus Rules */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-subtle">
                    <p className="text-sm font-medium text-green-800 mb-2">🎁 Bonus:</p>
                    <div className="space-y-1 text-xs">
                      {(() => {
                        const status = getBonusStatus();
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className={status.has4SameColor ? 'line-through opacity-60' : ''}>4x dezelfde kleur</span>
                              <Badge variant="secondary" className="text-xs">30 punten</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={status.has5SameColor ? 'line-through opacity-60' : ''}>5x dezelfde kleur</span>
                              <Badge variant="secondary" className="text-xs">25 punten</Badge>
                            </div>
                            {/* Removed: Alle 5 kleuren bonus */}
                            <div className="flex items-center justify-between">
                              <span className={status.has5Stars ? 'line-through opacity-60' : ''}>5 sterren</span>
                              <Badge variant="secondary" className="text-xs">50 punten</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={status.hasRowBonus ? 'line-through opacity-60' : ''}>Eerste volledige rij</span>
                              <Badge variant="secondary" className="text-xs">35 punten</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={status.hasColumnBonus ? 'line-through opacity-60' : ''}>Eerste volledige kolom</span>
                              <Badge variant="secondary" className="text-xs">35 punten</Badge>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Star Penalty Section */}
                  {(() => {
                    const status = getBonusStatus();
                    const remainingStars = status.totalStars - status.completedStars;
                    const allStarsCompleted = status.completedStars === status.totalStars;
                    
                    if (allStarsCompleted) {
                      return (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-subtle">
                          <p className="text-sm font-medium text-green-800 mb-2">⭐ Sterrenjacht:</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span>Alle sterren voltooid!</span>
                              <Badge variant="secondary" className="text-xs">Dat scheelt weer betalen, goede deal!</Badge>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-subtle">
                          <p className="text-sm font-medium text-orange-800 mb-2">⭐ Sterrenjacht:</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span>Elke ster die 's avonds nog over is = 1 cocktail betalen voor iemand</span>
                              <Badge variant="destructive" className="text-xs">{remainingStars}/{status.totalStars}</Badge>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}

                  {/* Achieved Bonuses */}
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2 text-success">Behaalde bonussen:</h4>
                    {calculateRewards().length > 0 ? (
                      <div className="space-y-1">
                        {calculateRewards().map((reward, index) => (
                          <div key={index} className="text-sm bg-success/20 text-success px-2 py-1 rounded flex items-center">
                            <span className="mr-2">✅</span>
                            {reward}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        Nog geen bonussen behaald
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Points Counter & Bingo Actions */}
            <Card className="bg-card backdrop-blur-sm border-border shadow-subtle">
              <CardContent className="p-4 space-y-4">
                {/* Points Counter */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 shadow-subtle">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-primary mb-1">🏆 Punten Score</h3>
                    {isLoadingPoints ? (
                      <Skeleton className="h-8 w-24 mx-auto mb-2" />
                    ) : (
                      <div className="text-3xl font-bold text-primary">{points}</div>
                    )}
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <div>Opdrachten: {pointsBreakdown.basePoints} punten</div>
                      <div>Bonussen: {pointsBreakdown.bonusPoints} punten</div>
                      {actualExpenses !== 0 && (
                        <div className="text-xs">
                          {actualExpenses} (uitgaven)
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Elke opdracht = 20 punten
                    </p>
                    
                  </div>
                </div>

                {/* NIEUW: Deal Maker's Shop Button */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-3">
                  <div className="text-center mb-2">
                    <div className="text-lg font-bold text-green-600 mb-1">🛒 DEAL MAKER'S SHOP</div>
                    <p className="text-xs text-green-700">
                      Koop strategische voordelen met je punten!
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate('/deal-makers-shop')}
                    className="w-full bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 
                             text-white font-bold py-2 px-4 rounded-lg border-2 border-green-400 shadow-lg
                             active:transform active:translate-y-1 active:shadow-md
                             transition-all duration-150"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    🛒 BEZOEK DE SHOP
                  </button>
                  
                  <div className="text-center mt-2">
                    <p className="text-xs text-green-600">
                      Budget: <span className="font-bold">{points} punten</span>
                    </p>
                  </div>
                </div>

                {/* Simply Wild Button */}
                <div className="bg-gradient-to-br from-red-50 to-yellow-50 border-2 border-red-400 rounded-lg p-3">
                  <div className="text-center mb-2">
                    <div className="text-lg font-bold text-red-600 mb-1">🎰 SIMPLY WILD</div>
                    <p className="text-xs text-red-700">
                      Gebruik je punten in de gokkast!
                    </p>
                  </div>
                  
                  <button
                    onClick={() => navigate('/simply-wild')}
                    className="w-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 
                             text-white font-bold py-2 px-4 rounded-lg border-2 border-red-400 shadow-lg
                             active:transform active:translate-y-1 active:shadow-md
                             transition-all duration-150"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    🎲 SPEEL SIMPLY WILD
                  </button>
                  
                  <div className="text-center mt-2">
                    <p className="text-xs text-red-600">
                      Saldo: <span className="font-bold">{points} credits</span>
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Voltooide opdrachten: <span className="font-bold text-primary">
                      {bingoTasks.filter(task => task.completed).length}/25
                    </span>
                  </p>
                </div>
                
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Challenges Phase - Waiting State */}
        {gamePhase === 'challenges' && isWaiting && (
          <Card className="bg-card backdrop-blur-sm border-border animate-bounce-in shadow-subtle">
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Clock className="w-16 h-16 text-primary mx-auto" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Wachten op opdracht...</h2>
              <p className="text-muted-foreground">De organisator bereidt een nieuwe uitdaging voor!</p>
              <div className="flex justify-center mt-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Challenges Phase - Current Challenge */}
        {gamePhase === 'challenges' && currentChallenge && (
          <Card className={`bg-card backdrop-blur-sm border-border animate-bounce-in shadow-subtle ${
            currentChallenge.type === 'emergency' ? 'border-emergency/50' : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-2xl ${
                  currentChallenge.type === 'emergency' ? 'text-emergency' : 'text-foreground'
                }`}>
                  {currentChallenge.title}
                </CardTitle>
                {currentChallenge.type === 'timed' && timer !== null && (
                  <div className={`text-3xl font-bold ${timer < 30 ? 'text-emergency' : 'text-warning'}`}>
                    {formatTime(timer)}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">{currentChallenge.description}</p>

              {/* Action Buttons */}
              <div className="space-y-4">
                {currentChallenge.type === 'timed' && timer === null && (
                  <Button
                    onClick={handleStartChallenge}
                    variant="warning"
                    size="xl"
                    className="w-full"
                  >
                    <Clock className="w-6 h-6" />
                    Start Timer
                  </Button>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <Button
                    onClick={handleNeedHelp}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <HelpCircle className="w-5 h-5" />
                    Hulp Nodig!
                  </Button>

                  <Button
                    onClick={handleCompleteChallenge}
                    variant={getChallengeVariant(currentChallenge.type)}
                    size="massive"
                    className="w-full"
                  >
                    <CheckCircle className="w-8 h-8" />
                    Opdracht Voltooid!
                  </Button>
                </div>

                {/* Help Button */}
                <Button
                  onClick={handleNeedHelp}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                >
                  <HelpCircle className="w-5 h-5" />
                  Help! Stuur melding naar organisator
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/home')}
            variant="ghost"
            size="sm"
          >
            <Home className="w-4 h-4" />
            Terug naar Home
          </Button>
         </div>
        </div>
        
        <NavigationBar />
      </div>

      {/* Offline Status Indicator */}
      {!offlineStatus.isOnline && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Offline Mode
            {offlineStatus.pendingActions > 0 && (
              <Badge variant="secondary" className="ml-2">
                {offlineStatus.pendingActions} pending
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Quick Peek Drawer */}
      {gamePhase === 'bingo' && (
        <Drawer open={showQuickPeek} onOpenChange={setShowQuickPeek}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-center">📋 Snelkijker – Opdrachten</DrawerTitle>
            </DrawerHeader>
            <div className="p-3 space-y-3">
              <Input
                placeholder="Zoek opdracht..."
                value={quickPeekQuery}
                onChange={(e) => setQuickPeekQuery(e.target.value)}
              />
              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {filteredTasks.map(({ id, title, completed, index }) => {
                  const isStar = gameLayout?.starPositions?.includes(index);
                  const tileColor = gameLayout?.colorArray?.[index];
                  const colorDotMap: Record<string, string> = {
                    pink: 'bg-pink-500',
                    blue: 'bg-blue-400',
                    yellow: 'bg-yellow-400',
                    orange: 'bg-orange-500',
                    green: 'bg-green-400',
                  };
                  const dot = colorDotMap[tileColor as string] || 'bg-gray-400';
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setHighlightedTaskIndex(index);
                      }}
                      className={`w-full text-left px-3 py-2 border rounded flex items-center gap-2 hover:bg-muted ${highlightedTaskIndex === index ? 'ring-2 ring-primary' : ''}`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                      {isStar && <Star className="w-3 h-3 text-yellow-500" />}
                      <span className={`flex-1 text-sm ${completed ? 'line-through text-muted-foreground' : ''}`}>{title}</span>
                      {completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </button>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="text-xs text-muted-foreground p-3">Geen opdrachten gevonden</div>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Quick Grid Drawer (visual bingo grid with task texts) */}
      {gamePhase === 'bingo' && (
        <Drawer open={showQuickGrid} onOpenChange={setShowQuickGrid}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="text-center">👁️ Snelkijker – Grid</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 flex justify-center">
              <div className="grid grid-cols-5 gap-2 mx-auto" style={{ maxWidth: '520px' }}>
                {gameLayout && Array.from({ length: 25 }).map((_, idx) => {
                  const task = bingoTasks[idx] || { id: idx, title: '', completed: false } as any;
                  const color = gameLayout.colorArray?.[idx] || 'gray';
                  const star = gameLayout.starPositions?.includes(idx);
                  const colorMap: Record<string, { bg: string; inner: string; text: string; border: string }> = {
                    pink: { bg: 'bg-pink-500', inner: 'bg-pink-300', text: 'text-white', border: 'border-pink-700' },
                    blue: { bg: 'bg-blue-500', inner: 'bg-blue-300', text: 'text-white', border: 'border-blue-700' },
                    yellow: { bg: 'bg-yellow-400', inner: 'bg-yellow-200', text: 'text-black', border: 'border-yellow-600' },
                    orange: { bg: 'bg-orange-500', inner: 'bg-orange-300', text: 'text-white', border: 'border-orange-700' },
                    green: { bg: 'bg-green-500', inner: 'bg-green-300', text: 'text-white', border: 'border-green-700' },
                    gray: { bg: 'bg-gray-300', inner: 'bg-gray-200', text: 'text-black', border: 'border-gray-500' },
                  };
                  const c = colorMap[color] || colorMap.gray;
                  return (
                    <div
                      key={`quick-grid-${idx}`}
                      className={`relative ${c.bg} ${c.border} border rounded-lg w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shadow-subtle overflow-hidden`}
                    >
                      {/* inner tint */}
                      <div className={`absolute inset-1 ${c.inner} opacity-70 rounded`}></div>
                      {/* task text */}
                      <div className={`absolute inset-0 flex items-center justify-center px-2 text-center ${c.text}`}>
                        <div className="text-[10px] sm:text-xs font-semibold leading-tight line-clamp-4">
                          {task?.title || ''}
                        </div>
                      </div>
                      {/* star badge */}
                      {star && (
                        <div className="absolute top-1 left-1 text-yellow-300 drop-shadow-sm">★</div>
                      )}
                      {/* completed check */}
                      {task?.completed && (
                        <div className="absolute top-1 right-1 text-white bg-green-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">📸 Foto!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <p className="text-center text-warning-foreground font-medium">
                ⚠️ Maak een selfie of foto van jezelf tijdens het uitvoeren van de opdracht.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
                id="bingo-photo-input"
                disabled={isUploading}
              />
              
              {/* Photo Preview */}
              {photoPreview && (
                <div className="w-full">
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg border-2 border-primary/30"
                    />
                    <Button
                      onClick={handleClearPhoto}
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Voorvertoning van je foto
                  </p>
                </div>
              )}
              
              {/* Photo Upload Area */}
              {!photoPreview && (
                <label
                  htmlFor="bingo-photo-input"
                  className={`flex items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="text-center">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Foto wordt geladen...' : 'Klik om foto te selecteren'}
                    </p>
                  </div>
                </label>
              )}
              
              {/* Action Buttons */}
              {photoPreview ? (
                <div className="flex gap-3 w-full">
                  <Button
                    onClick={handleClearPhoto}
                    variant="outline"
                    className="flex-1"
                    disabled={isCompletingTask}
                  >
                    Nieuwe Foto
                  </Button>
                  <Button
                    onClick={handleCompleteWithPhoto}
                    variant="default"
                    className="flex-1"
                    disabled={isCompletingTask}
                  >
                    {isCompletingTask ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Afronden...
                      </>
                    ) : (
                      'Afronden'
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="bg-card/95 backdrop-blur-sm border-border max-w-sm w-full max-h-[50vh] flex flex-col">
          <div className="flex flex-col items-center justify-center space-y-4 p-4">
            <div className="flex justify-center space-x-2 animate-bounce">
              <PartyPopper className="w-8 h-8 text-primary" />
              <Heart className="w-8 h-8 text-emergency" />
              <Star className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold text-primary text-center">
              LEKKERRRR! 🎉
            </h2>
            {celebrationPhoto && (
              <div className="relative rounded-lg overflow-hidden w-full max-w-xs animate-scale-in">
                <img 
                  src={celebrationPhoto} 
                  alt="Bewijs foto" 
                  className="w-full h-auto object-contain rounded-lg shadow-2xl border-4 border-primary/50"
                  style={{
                    animation: "photoZoom 0.5s ease-in-out"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
              </div>
            )}
            {!celebrationPhoto && (
              <div className="text-center space-y-2">
                <div className="text-4xl animate-bounce">🏆</div>
                <p className="text-sm text-muted-foreground">
                  Opdracht voltooid zonder foto!
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className={`bg-card/95 backdrop-blur-sm border-border max-w-md w-full ${
          selectedTask?.color === 'pink' ? 'bg-pink-100/90' :
          selectedTask?.color === 'blue' ? 'bg-blue-100/90' :
          selectedTask?.color === 'yellow' ? 'bg-yellow-100/90' :
          selectedTask?.color === 'orange' ? 'bg-orange-100/90' :
          selectedTask?.color === 'green' ? 'bg-green-100/90' : ''
        }`}>
          <DialogHeader>
            <DialogTitle className="text-center text-foreground flex items-center justify-center gap-2">
              {selectedTask?.hasStar && <span className="text-white text-lg font-bold drop-shadow-lg">★</span>}
              {selectedTask?.hasStar && <span className="text-white text-lg font-bold drop-shadow-lg">★</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-4">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 overflow-hidden ${
                selectedTask?.color === 'pink' ? 'bg-pink-500' :
                selectedTask?.color === 'blue' ? 'bg-blue-400' :
                selectedTask?.color === 'yellow' ? 'bg-yellow-400' :
                selectedTask?.color === 'orange' ? 'bg-orange-500' :
                selectedTask?.color === 'green' ? 'bg-green-400' : 'bg-gray-400'
              }`}>
                <img 
                  src="/lovable-uploads/c7e77764-6650-4f71-a929-927eff97af37.png" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                {selectedTask?.description}
              </p>
              {selectedTask?.hasStar && (
                <p className="text-sm text-orange-600 font-medium">
                  ⭐ Ster opdracht
                </p>
              )}
            </div>
            
            <div className={`grid gap-3 ${hasSkipAbility ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <Button
                onClick={() => handleTaskChoice('later')}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Later Doen
              </Button>
              <Button
                onClick={() => handleTaskChoice('done')}
                variant="default"
                size="lg"
                className="w-full"
              >
                Afronden
              </Button>
              {hasSkipAbility && (
                <Button
                  onClick={handleOpenSkipConfirm}
                  variant="destructive"
                  size="lg"
                  className="w-full"
                >
                  Skip
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Skip Confirm Dialog */}
      <Dialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Weet je het zeker?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2">
            <p className="text-center">
              Weet je zeker dat je deze skipt? Je mag maar 1 opdracht skippen.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={cancelSkipTask}>Annuleren</Button>
              <Button variant="destructive" onClick={confirmSkipTask}>Ja, skippen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task List Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">📋 Alle Opdrachten</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 p-4">
            {bingoTasks.map((task, index) => (
              <div 
                key={task.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  task.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-lg">
                  {task.completed ? '✅' : '⏳'}
                </div>
                    <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </p>
                  {task.description &&
                   task.description.trim() &&
                   task.description.trim() !== (task.title || '').trim() && (
                    <p className={`text-xs text-muted-foreground ${task.completed ? 'line-through' : ''}`}>
                      {task.description}
                    </p>
                  )}
                    </div>
                  </div>
                ))}
              </div>
          <div className="p-4">
            <Button onClick={() => setShowInfoDialog(false)} className="w-full">
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Progress Dashboard removed */}

      {/* Game Info Dialog */}
      <Dialog open={showGameInfoDialog} onOpenChange={setShowGameInfoDialog}>
        <DialogContent className="max-w-sm w-[92vw] sm:w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg text-center">🎮 Speluitleg</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pb-4">
            {/* Blok: Verdien punten */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2"><Grid3X3 className="w-4 h-4" />Verdien punten</h3>
              <div className="text-xs text-green-900">Voltooi opdrachten en verdien <span className="font-semibold">20 punten per opdracht</span>.</div>
            </div>

            {/* Blok: Bonussen */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800 mb-2">🎁 Bonus</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between"><span>4x dezelfde kleur</span><Badge variant="secondary" className="text-xs">30 punten</Badge></div>
                <div className="flex items-center justify-between"><span>5x dezelfde kleur</span><Badge variant="secondary" className="text-xs">25 punten</Badge></div>
                <div className="flex items-center justify-between"><span>5 sterren</span><Badge variant="secondary" className="text-xs">50 punten</Badge></div>
                <div className="flex items-center justify-between"><span>Eerste volledige rij</span><Badge variant="secondary" className="text-xs">35 punten</Badge></div>
                <div className="flex items-center justify-between"><span>Eerste volledige kolom</span><Badge variant="secondary" className="text-xs">35 punten</Badge></div>
              </div>
            </div>

            {/* Blok: Sterrenjacht (compact) */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2"><Star className="w-4 h-4" />Sterrenjacht</h4>
              <div className="text-xs text-orange-800">Elke ster die 's avonds nog over is = 1 cocktail betalen.</div>
            </div>

            {/* Blok: Waar vind je de opdrachten */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2"><List className="w-4 h-4" />Opdrachten bekijken</h4>
              <ul className="text-xs text-blue-900 list-disc pl-4 space-y-1">
                <li>Klik op een veld in het bord om de opdracht te openen.</li>
                <li>Klik op het lijst-icoon rechtsboven om alle opdrachten onder elkaar te zien.</li>
                <li>Klik op het oogje bovenin voor een snelle blik op alle teksten onder de velden.</li>
              </ul>
            </div>

            {/* Blok: Overig */}
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600 flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Dealmaker's Shop</h3>
              <p className="text-xs leading-snug">Gebruik je punten voor slimme deals in de shop.</p>
              <h3 className="font-semibold text-yellow-600 flex items-center gap-2"><div className="w-4 h-4 text-center text-xs font-bold">🎰</div>Simply Jelle</h3>
              <p className="text-xs leading-snug">Gok met je punten – winst telt mee, verlies gaat naar uitgaven.</p>
              <h3 className="font-semibold text-pink-600 flex items-center gap-2"><Camera className="w-4 h-4" />Jelle's feed</h3>
              <p className="text-xs leading-snug">Foto’s die je maakt komen hier in je feed. Like!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confetti Overlay */}
      <ConfettiOverlay />
    </div>
  );
};

export default PlayerApp;
