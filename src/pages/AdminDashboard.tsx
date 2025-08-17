import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, CheckCircle, Clock, MapPin, Grid3X3, RotateCcw, Users, Eye, Trash2, Send, MessageCircle, AlertTriangle,
  Undo2, Camera, Star, Coins, RefreshCw, Target, Award, AlertCircle, Shield, Database, Wifi, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PhotoBackup } from '@/utils/photoBackup';

interface BingoTask {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
}

interface TreasureLocation {
  id: number;
  location_name: string;
  found: boolean;
  found_at?: string;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  type: string;
  completed: boolean;
  completed_at?: string;
}

// Remove WebhookSettings interface and all webhook functionality
interface PhotoItem {
  id: string;
  fileName: string;
  taskId?: number;
  uploadedAt: string;
  type: 'bingo' | 'treasure' | 'challenge';
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bingoTasks, setBingoTasks] = useState<BingoTask[]>([]);
  const [treasureLocations, setTreasureLocations] = useState<TreasureLocation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  
  // Live Admin Controls State
  const [liveMessage, setLiveMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'urgent' | 'celebration'>('info');
  const [customChallengeTitle, setCustomChallengeTitle] = useState('');
  const [customChallengeDescription, setCustomChallengeDescription] = useState('');
  const [challengeType, setChallengeType] = useState<'instant' | 'timed' | 'emergency'>('instant');
  const [timeLimit, setTimeLimit] = useState<number>(300);
  const [pointsReward, setPointsReward] = useState<number>(50);

  // Photo management state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showPhotoManager, setShowPhotoManager] = useState(false);

  // Emergency controls state
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [backupStats, setBackupStats] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadSessions();
    loadBackupStats();
  }, []);

  const loadData = async () => {
    try {
      const [bingoResult, treasureResult, challengesResult] = await Promise.all([
        supabase.from('bingo_tasks').select('*').order('id').limit(25), // Only first 25 bingo tasks
        supabase.from('treasure_hunt').select('*').order('id').limit(3), // Only first 3 treasure locations
        supabase.from('challenges').select('*').order('id')
      ]);

      if (bingoResult.data) setBingoTasks(bingoResult.data);
      if (treasureResult.data) setTreasureLocations(treasureResult.data);
      if (challengesResult.data) setChallenges(challengesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon data niet laden",
        variant: "destructive"
      });
    }
  };

  const resetApp = async () => {
    setIsLoading(true);
    try {
      // Local reset with session preservation
      const keep = localStorage.getItem('gameSessionId');
      localStorage.clear();
      if (keep) localStorage.setItem('gameSessionId', keep);
      
      // Reset database data for the currently selected session if present, else all
      await Promise.all([
        supabase.from('bingo_tasks').update({ completed: false, completed_at: null, photo_url: null }),
        supabase.from('treasure_hunt').update({ found: false, found_at: null, photo_url: null }),
        supabase.from('challenges').update({ completed: false, completed_at: null, photo_url: null }),
      ]);

      // Clear all photos from storage (but NOT on event day!)
      if (!PhotoBackup.isEventDay()) {
        const photosCleared = await clearAllPhotos();
        if (!photosCleared) {
          toast({
            title: "Waarschuwing",
            description: "Kon niet alle foto's verwijderen, maar app is wel gereset",
            variant: "destructive"
          });
        }
      } else {
        console.log('Event day detected - preserving photos in backup');
      }
      
      toast({
        title: "App gereset!",
        description: "Alle voortgang en foto's zijn gewist. Navigeer naar info pagina...",
      });

      // Navigate to info page after a short delay
      setTimeout(() => {
        navigate('/info');
      }, 1000);
    } catch (error) {
      console.error('Error resetting app:', error);
      toast({
        title: "Fout",
        description: "Kon app niet volledig resetten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetBingo = async () => {
    setIsLoading(true);
    try {
      // Debug: Check what bingo tasks exist first
      const { data: allBingoTasks } = await supabase
        .from('bingo_tasks')
        .select('id, title, session_id, photo_url, completed');
      
      console.log('🔍 All bingo tasks in database:', allBingoTasks);
      
      const tasksWithPhotos = allBingoTasks?.filter(task => task.photo_url) || [];
      console.log('📸 Bingo tasks with photos:', tasksWithPhotos);

      // Reset ALL bingo tasks, including session-specific ones
      const { error } = await supabase
        .from('bingo_tasks')
        .update({ 
          completed: false, 
          completed_at: null,
          photo_url: null 
        });

      if (error) throw error;

      // Clear bingo photos from storage (but NOT on event day!)
      if (!PhotoBackup.isEventDay()) {
        try {
          const { data: bingoPhotoFiles } = await supabase.storage
            .from('bingo-photos')
            .list('', { limit: 1000 });

          if (bingoPhotoFiles && bingoPhotoFiles.length > 0) {
            const bingoFileNames = bingoPhotoFiles.filter(file => 
              file.name.includes('bingo-') || file.name.includes('treasure-')
            ).map(file => file.name);
            
            if (bingoFileNames.length > 0) {
              await supabase.storage
                .from('bingo-photos')
                .remove(bingoFileNames);
              console.log(`Removed ${bingoFileNames.length} bingo/treasure photos`);
            }
          }
        } catch (error) {
          console.error('Error clearing bingo photos:', error);
        }
      }

      toast({
        title: "Bingo gereset!",
        description: "Alle 25 bingo vakjes en foto's zijn weer leeg",
      });
      
      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error('Error resetting bingo:', error);
      toast({
        title: "Fout",
        description: "Kon bingo niet resetten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTreasureHunt = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('treasure_hunt')
        .update({ 
          found: false, 
          found_at: null,
          photo_url: null
        })
        .in('id', [1, 2, 3, 237, 238, 239]); // Reset both original IDs and PhotoWall IDs

      if (error) throw error;

      // Clear treasure hunt photos from storage (but NOT on event day!)
      if (!PhotoBackup.isEventDay()) {
        try {
          const { data: treasurePhotoFiles } = await supabase.storage
            .from('bingo-photos')
            .list('', { limit: 1000 });

          if (treasurePhotoFiles && treasurePhotoFiles.length > 0) {
            const treasureFileNames = treasurePhotoFiles.filter(file => 
              file.name.includes('treasure-')
            ).map(file => file.name);
            
            if (treasureFileNames.length > 0) {
              await supabase.storage
                .from('bingo-photos')
                .remove(treasureFileNames);
              console.log(`Removed ${treasureFileNames.length} treasure hunt photos`);
            }
          }
        } catch (error) {
          console.error('Error clearing treasure hunt photos:', error);
        }
      }

      toast({
        title: "Zoek de rest gereset!",
        description: "Alle 3 vrienden zijn weer verstopt en foto's verwijderd",
      });
      
      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error('Error resetting treasure hunt:', error);
      toast({
        title: "Fout",
        description: "Kon zoek de rest niet resetten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove saveWebhookSettings function


  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadBackupStats = async () => {
    try {
      const stats = await PhotoBackup.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  };

  // Clear all photos from storage buckets
  const clearAllPhotos = async () => {
    try {
      // Clear bingo-photos bucket
      const { data: bingoPhotoFiles } = await supabase.storage
        .from('bingo-photos')
        .list('', { limit: 1000 });

      if (bingoPhotoFiles && bingoPhotoFiles.length > 0) {
        const bingoFileNames = bingoPhotoFiles.map(file => file.name);
        await supabase.storage
          .from('bingo-photos')
          .remove(bingoFileNames);
        console.log(`Removed ${bingoFileNames.length} files from bingo-photos`);
      }

      // Clear party-photos bucket
      const { data: partyPhotoFiles } = await supabase.storage
        .from('party-photos')
        .list('', { limit: 1000 });

      if (partyPhotoFiles && partyPhotoFiles.length > 0) {
        const partyFileNames = partyPhotoFiles.map(file => file.name);
        await supabase.storage
          .from('party-photos')
          .remove(partyFileNames);
        console.log(`Removed ${partyFileNames.length} files from party-photos`);
      }

      return true;
    } catch (error) {
      console.error('Error clearing photos:', error);
      return false;
    }
  };

  // Separate function to only clear photos
  const resetAllPhotos = async () => {
    setIsLoading(true);
    try {
      // Clear all photos from storage (but NOT on event day!)
      if (!PhotoBackup.isEventDay()) {
        const photosCleared = await clearAllPhotos();
        if (photosCleared) {
          toast({
            title: "Alle foto's verwijderd!",
            description: "Alle foto's zijn succesvol verwijderd uit de storage buckets",
          });
        } else {
          throw new Error("Kon niet alle foto's verwijderen");
        }
      } else {
        toast({
          title: "Event Day Detectie",
          description: "Foto's worden bewaard vanwege event day backup",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error clearing all photos:', error);
      toast({
        title: "Fout",
        description: "Kon niet alle foto's verwijderen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetChallenges = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ 
          completed: false, 
          completed_at: null,
          photo_url: null 
        });

      if (error) throw error;

      toast({
        title: "Challenges gereset!",
        description: "Alle challenges zijn gereset en foto's verwijderd",
      });
      
      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error('Error resetting challenges:', error);
      toast({
        title: "Fout",
        description: "Kon challenges niet resetten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Nuclear option: Delete ALL session-specific data
  const resetAllSessions = async () => {
    setIsLoading(true);
    try {
      // Delete all session-specific bingo tasks
      await supabase
        .from('bingo_tasks')
        .delete()
        .not('session_id', 'is', null);

      // Delete all sessions
      await supabase
        .from('sessions')
        .delete()
        .neq('id', '');

      // Clear localStorage
      localStorage.clear();

      // Clear photos
      const photosCleared = await clearAllPhotos();

      toast({
        title: "🚨 Alle sessies verwijderd!",
        description: "Alle sessie data en foto's zijn permanent verwijderd",
      });

      // Reload data
      loadData();
      loadSessions();
    } catch (error) {
      console.error('Error resetting all sessions:', error);
      toast({
        title: "Fout",
        description: "Kon niet alle sessies verwijderen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      
      // Reset all data for this session
      await Promise.all([
        supabase.from('bingo_tasks').update({ 
          completed: false, 
          completed_at: null,
          photo_url: null 
        }).eq('session_id', sessionId),
        supabase.from('treasure_hunt').update({ 
          found: false, 
          found_at: null
        }).eq('session_id', sessionId),
        supabase.from('challenges').update({
          completed: false,
          completed_at: null
        }).eq('session_id', sessionId)
      ]);

      toast({
        title: "Sessie reset!",
        description: `Sessie ${sessionId} is volledig gereset.`,
      });

      loadSessions();
    } catch (error) {
      console.error('Error resetting session:', error);
      toast({
        title: "Fout",
        description: "Kon sessie niet resetten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      
      // Delete all data for this session
      await Promise.all([
        supabase.from('bingo_tasks').delete().eq('session_id', sessionId),
        supabase.from('treasure_hunt').delete().eq('session_id', sessionId),
        supabase.from('challenges').delete().eq('session_id', sessionId),
        supabase.from('sessions').delete().eq('id', sessionId)
      ]);

      toast({
        title: "Sessie verwijderd!",
        description: `Sessie ${sessionId} is volledig verwijderd.`,
      });

      loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Fout",
        description: "Kon sessie niet verwijderen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllSessions = async () => {
    try {
      setIsLoading(true);
      
      // Delete all sessions and their data, but keep the base game data
      await Promise.all([
        supabase.from('sessions').delete().neq('id', ''),
        supabase.from('challenges').delete().neq('id', 0)
      ]);

      toast({
        title: "Alle sessies verwijderd!",
        description: "Alle 65+ sessies zijn volledig opgeruimd.",
      });

      loadSessions();
    } catch (error) {
      console.error('Error deleting all sessions:', error);
      toast({
        title: "Fout",
        description: "Kon sessies niet verwijderen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove testWebhook function
  const sendLiveMessage = async () => {
    if (!liveMessage.trim()) {
      toast({
        title: "Geen bericht",
        description: "Voer een bericht in om te verzenden",
        variant: "destructive"
      });
      return;
    }

    // Find Jelle's session
    const jelleSession = sessions.find(s => s.user_name === 'Jelle' || s.user_name === 'jelle') || sessions[0];
    if (!jelleSession) {
      toast({
        title: "Geen actieve sessie",
        description: "Jelle is nog niet online",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('live_messages')
        .insert({
          session_id: jelleSession.id,
          message: liveMessage,
          message_type: messageType
        });

      if (error) throw error;

      toast({
        title: "Bericht verzonden! 📨",
        description: `${messageType.toUpperCase()}: "${liveMessage}"`,
      });

      setLiveMessage('');
    } catch (error) {
      console.error('Error sending live message:', error);
      toast({
        title: "Fout bij verzenden",
        description: "Kon bericht niet verzenden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendCustomChallenge = async () => {
    if (!customChallengeTitle.trim() || !customChallengeDescription.trim()) {
      toast({
        title: "Incomplete opdracht",
        description: "Vul zowel titel als beschrijving in",
        variant: "destructive"
      });
      return;
    }

    // Find Jelle's session
    const jelleSession = sessions.find(s => s.user_name === 'Jelle' || s.user_name === 'jelle') || sessions[0];
    if (!jelleSession) {
      toast({
        title: "Geen actieve sessie",
        description: "Jelle is nog niet online",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('live_challenges')
        .insert({
          session_id: jelleSession.id,
          title: customChallengeTitle,
          description: customChallengeDescription,
          type: challengeType,
          time_limit: challengeType === 'timed' ? timeLimit : null
        });

      if (error) throw error;

      toast({
        title: "Opdracht verzonden! ⚡",
        description: `${challengeType.toUpperCase()}: "${customChallengeTitle}" (${pointsReward} punten)`,
      });

      setCustomChallengeTitle('');
      setCustomChallengeDescription('');
    } catch (error) {
      console.error('Error sending custom challenge:', error);
      toast({
        title: "Fout bij verzenden",
        description: "Kon opdracht niet verzenden",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Correct progress calculations
  const completedBingoTasks = bingoTasks.filter(task => task.completed).length;
  const totalBingoTasks = bingoTasks.length; // Use actual count from database
  
  const foundTreasureLocations = treasureLocations.filter(loc => loc.found).length;
  const totalTreasureLocations = treasureLocations.length; // Use actual count from database
  
  const completedChallenges = challenges.filter(challenge => challenge.completed).length;

  // Add new selective reset functions
  const resetSingleBingoTask = async (taskId: number) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bingo_tasks')
        .update({ 
          completed: false, 
          completed_at: null,
          photo_url: null 
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Opdracht gereset!",
        description: "Deze specifieke bingo opdracht is weer leeg",
      });
      
      loadData();
    } catch (error) {
      console.error('Error resetting single bingo task:', error);
      toast({
        title: "Fout",
        description: "Kon opdracht niet resetten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSingleTreasureLocation = async (locationId: number) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('treasure_hunt')
        .update({ 
          found: false, 
          found_at: null
        })
        .eq('id', locationId);

      if (error) throw error;

      toast({
        title: "Locatie gereset!",
        description: "Deze specifieke locatie is weer verstopt",
      });
      
      loadData();
    } catch (error) {
      console.error('Error resetting single treasure location:', error);
      toast({
        title: "Fout",
        description: "Kon locatie niet resetten",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      // Load photos from storage bucket
      const { data: photoFiles } = await supabase.storage
        .from('bingo-photos')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (photoFiles) {
        const photoItems: PhotoItem[] = photoFiles.map(file => ({
          id: file.id || file.name,
          fileName: file.name,
          uploadedAt: file.created_at || new Date().toISOString(),
          type: file.name.startsWith('treasure-') ? 'treasure' : 
                file.name.startsWith('challenge-') ? 'challenge' : 'bingo'
        }));

        setPhotos(photoItems);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const deleteSinglePhoto = async (photoId: string, fileName: string) => {
    setIsLoading(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('bingo-photos')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Remove photo reference from tasks
      await supabase
        .from('bingo_tasks')
        .update({ photo_url: null })
        .eq('photo_url', fileName);

      toast({
        title: "Foto verwijderd!",
        description: "Foto is permanent verwijderd",
      });
      
      loadPhotos();
      loadData();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Fout",
        description: "Kon foto niet verwijderen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restorePhoto = async (photoId: string, fileName: string) => {
    setIsLoading(true);
    try {
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('bingo-photos')
        .getPublicUrl(fileName);

      // Find associated task and restore photo
      const { data: tasks } = await supabase
        .from('bingo_tasks')
        .select('*')
        .eq('photo_url', publicUrl);

      if (tasks && tasks.length > 0) {
        await supabase
          .from('bingo_tasks')
          .update({ photo_url: publicUrl })
          .eq('id', tasks[0].id);
      }

      toast({
        title: "Foto hersteld!",
        description: "Foto is weer gekoppeld aan opdracht",
      });
      
      loadData();
    } catch (error) {
      console.error('Error restoring photo:', error);
      toast({
        title: "Fout",
        description: "Kon foto niet herstellen",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add emergency control functions
  const emergencyControls = {
    forceSync: async () => {
      setIsLoading(true);
      try {
        // Force sync all pending actions
        const pendingActions = localStorage.getItem('offlinePendingActions');
        if (pendingActions) {
          const actions = JSON.parse(pendingActions);
          console.log(`🔄 Force syncing ${actions.length} pending actions...`);
          
          // Clear pending actions
          localStorage.removeItem('offlinePendingActions');
          
          toast({
            title: "Sync geforceerd",
            description: `${actions.length} pending acties gesynchroniseerd`,
          });
        } else {
          toast({
            title: "Geen pending acties",
            description: "Alles is al gesynchroniseerd",
          });
        }
      } catch (error) {
        console.error('Error force syncing:', error);
        toast({
          title: "Fout bij sync",
          description: "Kon pending acties niet synchroniseren",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    
    resetJelleSession: async () => {
      setIsLoading(true);
      try {
        // Reset Jelle's session
        const { error } = await supabase
          .from('sessions')
          .update({ 
            points_balance: 0,
            last_activity: new Date().toISOString()
          })
          .eq('user_name', 'Jelle');

        if (error) throw error;

        toast({
          title: "Session gereset",
          description: "Jelle's sessie is opnieuw gestart",
        });
      } catch (error) {
        console.error('Error resetting Jelle session:', error);
        toast({
          title: "Fout",
          description: "Kon Jelle's sessie niet resetten",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    
    emergencyMessage: async () => {
      if (!emergencyMessage.trim()) {
        toast({
          title: "Leeg bericht",
          description: "Vul een bericht in",
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);
      try {
        // Send emergency message
        const { error } = await supabase
          .from('live_messages')
          .insert({
            message: emergencyMessage,
            session_id: 'admin',
            timestamp: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "Emergency bericht verzonden",
          description: emergencyMessage,
        });
        
        setEmergencyMessage('');
      } catch (error) {
        console.error('Error sending emergency message:', error);
        toast({
          title: "Fout",
          description: "Kon emergency bericht niet verzenden",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    
    backupData: async () => {
      setIsLoading(true);
      try {
        // Get all data
        const [sessionsData, bingoData, treasureData, challengesData] = await Promise.all([
          supabase.from('sessions').select('*'),
          supabase.from('bingo_tasks').select('*'),
          supabase.from('treasure_hunt').select('*'),
          supabase.from('challenges').select('*')
        ]);

        const backupData = {
          timestamp: new Date().toISOString(),
          sessions: sessionsData.data || [],
          bingo_tasks: bingoData.data || [],
          treasure_hunt: treasureData.data || [],
          challenges: challengesData.data || []
        };

        // Create and download backup file
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bachelor-party-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Backup gedownload",
          description: "Alle data is opgeslagen",
        });
      } catch (error) {
        console.error('Error creating backup:', error);
        toast({
          title: "Fout",
          description: "Kon backup niet maken",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },

    checkSystemStatus: async () => {
      setIsLoading(true);
      try {
        // Check database connection
        const { data: testData, error: dbError } = await supabase
          .from('sessions')
          .select('count')
          .limit(1);

        // Check storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('bingo-photos')
          .list('', { limit: 1 });

        // Check webhook
        // const webhookStatus = webhookSettings?.is_active ? 'Actief' : 'Inactief'; // Removed webhookSettings

        const status = {
          database: dbError ? '❌ Fout' : '✅ OK',
          storage: storageError ? '❌ Fout' : '✅ OK',
          // webhook: webhookStatus, // Removed webhookStatus
          offlineActions: localStorage.getItem('offlinePendingActions') ? '⚠️ Pending' : '✅ Geen'
        };

        toast({
          title: "Systeem Status",
          description: `DB: ${status.database} | Storage: ${status.storage} | Offline Actions: ${status.offlineActions}`,
          duration: 5000,
        });

        console.log('System Status:', status);
      } catch (error) {
        console.error('Error checking system status:', error);
        toast({
          title: "Fout",
          description: "Kon systeem status niet controleren",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div 
      className="h-screen w-full fixed top-0 left-0 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-auto"
      style={{
        backgroundImage: "url('/lovable-uploads/3c8e75cc-3ad2-41c6-99b7-e0a94b2f28de.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 bg-white/75 z-0"></div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Admin Dashboard - Osnabruck
            </h1>
            <p className="text-muted-foreground">
              Overzicht van Jelle's Osnabruck voortgang en live controles
            </p>
          </div>

        {/* Reset Controls */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Controles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={resetBingo}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                {isLoading ? "Resetten..." : "Reset Bingo"}
              </Button>
              
              <Button 
                onClick={resetTreasureHunt}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isLoading ? "Resetten..." : "Reset Zoek de Rest"}
              </Button>

              <Button 
                onClick={resetChallenges}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Target className="h-4 w-4 mr-2" />
                {isLoading ? "Resetten..." : "Reset Challenges"}
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button 
                onClick={resetAllPhotos}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                disabled={isLoading}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isLoading ? "Verwijderen..." : "🗑️ Reset Alle Foto's"}
              </Button>
            </div>
            
            <div className="border-t pt-4 space-y-3">
              <Button 
                onClick={resetApp}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isLoading ? "Resetten..." : "Reset Hele App"}
              </Button>
              
              <Button 
                onClick={resetAllSessions}
                variant="destructive"
                className="w-full bg-red-700 hover:bg-red-800 border-red-600"
                disabled={isLoading}
              >
                <Database className="h-4 w-4 mr-2" />
                {isLoading ? "Verwijderen..." : "🚨 NUCLEAR RESET (Alle Sessies)"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selective Reset Controls */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Selectieve Reset Controles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Single Bingo Task Reset */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Individuele Bingo Opdrachten
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {bingoTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded border bg-background/50">
                    <span className={`text-sm flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.completed && (
                      <Button
                        onClick={() => resetSingleBingoTask(task.id)}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className="ml-2"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Single Treasure Location Reset */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Individuele Schattenjacht Locaties
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {treasureLocations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-3 rounded border bg-background/50">
                    <span className={`text-sm flex-1 ${location.found ? 'line-through text-muted-foreground' : ''}`}>
                      {location.location_name}
                    </span>
                    {location.found && (
                      <Button
                        onClick={() => resetSingleTreasureLocation(location.id)}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        className="ml-2"
                      >
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Foto Manager
                </h3>
                <Button
                  onClick={() => {
                    setShowPhotoManager(!showPhotoManager);
                    if (!showPhotoManager) loadPhotos();
                  }}
                  variant="outline"
                  size="sm"
                >
                  {showPhotoManager ? 'Verbergen' : 'Foto\'s Beheren'}
                </Button>
              </div>
              
              {showPhotoManager && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {photos.map((photo) => (
                    <div key={photo.id} className="flex items-center justify-between p-3 rounded border bg-background/50">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{photo.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {photo.type} • {new Date(photo.uploadedAt).toLocaleString('nl-NL')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => restorePhoto(photo.id, photo.fileName)}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => deleteSinglePhoto(photo.id, photo.fileName)}
                          variant="destructive"
                          size="sm"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Live Admin Controls */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              🎮 Live Admin Controls (Alleen voor jou!)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Live Message Section */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-700">📨 Stuur Live Bericht naar Jelle</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="message-type">Type Bericht</Label>
                  <Select value={messageType} onValueChange={(value: 'info' | 'warning' | 'urgent' | 'celebration') => setMessageType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ Info</SelectItem>
                      <SelectItem value="warning">⚠️ Waarschuwing</SelectItem>
                      <SelectItem value="urgent">🚨 Urgent</SelectItem>
                      <SelectItem value="celebration">🎉 Felicitatie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="live-message">Bericht</Label>
                  <Textarea
                    id="live-message"
                    placeholder="Typ je bericht hier... (bijv: 'Ga naar de bar!', 'Goed bezig!', 'Tijd voor een drankje!')"
                    value={liveMessage}
                    onChange={(e) => setLiveMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={sendLiveMessage}
                  disabled={isLoading || !liveMessage.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? "Verzenden..." : "Verstuur Bericht"}
                </Button>
              </div>
            </div>

            {/* Custom Challenge Section */}
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-700">⚡ Stuur Custom Opdracht naar Jelle</h3>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="challenge-title">Opdracht Titel</Label>
                    <Input
                      id="challenge-title"
                      placeholder="bijv: Zing Karaoke!"
                      value={customChallengeTitle}
                      onChange={(e) => setCustomChallengeTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="challenge-type">Type Opdracht</Label>
                    <Select value={challengeType} onValueChange={(value: 'instant' | 'timed' | 'emergency') => setChallengeType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">⚡ Direct</SelectItem>
                        <SelectItem value="timed">⏰ Met Timer</SelectItem>
                        <SelectItem value="emergency">🚨 Noodgeval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="challenge-description">Beschrijving</Label>
                  <Textarea
                    id="challenge-description"
                    placeholder="Beschrijf wat Jelle moet doen... (bijv: 'Ga naar de karaoke en zing een liedje van je eigen keuze!')"
                    value={customChallengeDescription}
                    onChange={(e) => setCustomChallengeDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {challengeType === 'timed' && (
                    <div>
                      <Label htmlFor="time-limit">Tijd Limiet (seconden)</Label>
                      <Input
                        id="time-limit"
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(parseInt(e.target.value) || 300)}
                        min="30"
                        max="1800"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="points-reward">Punten Beloning</Label>
                    <Input
                      id="points-reward"
                      type="number"
                      value={pointsReward}
                      onChange={(e) => setPointsReward(parseInt(e.target.value) || 50)}
                      min="10"
                      max="200"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={sendCustomChallenge}
                  disabled={isLoading || !customChallengeTitle.trim() || !customChallengeDescription.trim()}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {isLoading ? "Verzenden..." : "Verstuur Opdracht"}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> Deze berichten en opdrachten verschijnen direct op Jelle's scherm. 
                De spectators zien dit niet - dit is alleen tussen jou en Jelle!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Actieve Sessies ({sessions.length})
              </div>
              {sessions.length > 0 && (
                <Button
                  onClick={deleteAllSessions}
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijder Alle
                </Button>
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              💡 Sessies zijn gebruikers die de app hebben geopend. Elke keer als iemand de app opent, wordt er een nieuwe sessie aangemaakt. 
              Dit kan leiden tot veel oude sessies. Gebruik "Verwijder Alle" om op te ruimen.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Geen actieve sessies gevonden
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{session.user_name || 'Onbekende gebruiker'}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {session.id.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Laatste activiteit: {new Date(session.last_activity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => window.open(`/player/${session.user_name || 'speler'}?session=${session.id}`, '_blank')}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => resetSession(session.id)}
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteSession(session.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t pt-4">
              <Button 
                onClick={loadSessions}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ververs Sessies
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photo Backup Management */}
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Database className="h-5 w-5" />
              📸 Foto Backup Systeem
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              💡 Automatische backup van alle foto's op de event dagen (16 & 17 augustus 2025). 
              Foto's worden dubbel opgeslagen en blijven bewaard, zelfs bij app crashes of resets.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Backup Status */}
            {backupStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{backupStats.totalBackups}</div>
                  <div className="text-xs text-green-600">Totaal Backups</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{backupStats.eventDayBackups}</div>
                  <div className="text-xs text-green-600">Event Dag</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{backupStats.manualBackups}</div>
                  <div className="text-xs text-green-600">Handmatig</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {PhotoBackup.isEventDay() ? '✅' : '❌'}
                  </div>
                  <div className="text-xs text-green-600">Event Dag</div>
                </div>
              </div>
            )}

            {/* Backup Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const result = await PhotoBackup.createManualBackup();
                    toast({
                      title: result.success ? "Backup voltooid!" : "Backup mislukt",
                      description: result.message,
                      variant: result.success ? "default" : "destructive"
                    });
                    loadBackupStats();
                  } catch (error) {
                    toast({
                      title: "Backup fout",
                      description: "Kon backup niet maken",
                      variant: "destructive"
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
                variant="outline"
                className="border-green-500 text-green-700 hover:bg-green-50"
                disabled={isLoading}
              >
                <Database className="w-4 h-4 mr-2" />
                {isLoading ? "Backup maken..." : "Handmatige Backup"}
              </Button>
              
              <Button
                onClick={loadBackupStats}
                variant="outline"
                className="border-blue-500 text-blue-700 hover:bg-blue-50"
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ververs Statistieken
              </Button>
            </div>

            {/* Event Day Warning */}
            {PhotoBackup.isEventDay() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    🎉 Event Dag Actief!
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Alle foto's worden automatisch gebackupt. Je foto's zijn veilig!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bingo Taken</CardTitle>
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedBingoTasks}/{totalBingoTasks}</div>
              <p className="text-xs text-muted-foreground">
                van de {totalBingoTasks} taken voltooid
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zoek de Rest</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{foundTreasureLocations}/{totalTreasureLocations}</div>
              <p className="text-xs text-muted-foreground">
                van de {totalTreasureLocations} vrienden gevonden
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Challenges</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedChallenges}</div>
              <p className="text-xs text-muted-foreground">
                live uitdagingen voltooid
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Systeem Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="default">
                  Online
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                App status
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bingo Tasks */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Bingo Voortgang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bingoTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded border">
                    <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.completed ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-xs text-muted-foreground">
                          {task.completed_at ? new Date(task.completed_at).toLocaleString('nl-NL') : ''}
                        </span>
                      </div>
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Zoek de Rest */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Zoek de Rest Voortgang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {treasureLocations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-2 rounded border">
                    <span className={`text-sm ${location.found ? 'line-through text-muted-foreground' : ''}`}>
                      {location.location_name}
                    </span>
                    {location.found ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-xs text-muted-foreground">
                          {location.found_at ? new Date(location.found_at).toLocaleString('nl-NL') : ''}
                        </span>
                      </div>
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spectator Link Generator */}
        <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <Eye className="h-5 w-5 mr-2" />
              👥 Spectator View voor Vrienden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-3">🔗 Deel deze links met de vrienden:</h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Spectator View Link:</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={`${window.location.origin}/spectator`}
                      readOnly
                      className="bg-white"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/spectator`);
                        toast({ title: "Link gekopieerd!", description: "Deel deze link met de vrienden" });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Alternatieve Link:</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={`${window.location.origin}/watch`}
                      readOnly
                      className="bg-white"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/watch`);
                        toast({ title: "Link gekopieerd!", description: "Ook deze werkt voor spectators" });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white rounded border">
                <h4 className="font-medium text-green-700 mb-2">📱 Wat zien de vrienden?</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>• ✅ Alle 25 bingo opdrachten (Jelle ziet ze niet!)</li>
                  <li>• 📸 Live foto feed van voltooide opdrachten</li>
                  <li>• 🏆 Jelle's huidige punten score</li>
                  <li>• 📊 Voortgang in real-time</li>
                  <li>• 🎯 Welke opdrachten hij heeft voltooid</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-medium text-blue-700 mb-2">🔒 Beveiliging:</h4>
                <p className="text-sm text-blue-600">
                  Jelle kan NIET bij de spectator view komen - hij wordt automatisch terug gestuurd naar zijn game als hij het probeert!
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => window.open('/spectator', '_blank')}
              variant="outline"
              className="w-full border-green-500 text-green-700 hover:bg-green-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Spectator View
            </Button>
          </CardContent>
        </Card>



          {/* Emergency Controls */}
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                🚨 Emergency Controls & Live Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">📋 Emergency Controls Uitleg:</h4>
                <div className="text-sm text-red-700 space-y-2">
                  <p><strong>🔄 Force Sync:</strong> Synchroniseert alle offline pending acties die nog niet zijn opgeslagen</p>
                  <p><strong>🗄️ Reset Jelle Session:</strong> Reset Jelle's punten naar 0 en start zijn sessie opnieuw</p>
                  <p><strong>🛡️ Check Systeem:</strong> Controleert database, storage en offline acties status</p>
                  <p><strong>💾 Backup Data:</strong> Downloadt alle data als JSON bestand voor veiligheid</p>
                  <p><strong>📨 Emergency Bericht:</strong> Stuurt een urgent bericht naar alle actieve sessies</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Gebruik deze knoppen alleen in noodgevallen!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={emergencyControls.forceSync}
                  variant="outline"
                  className="border-blue-500 text-blue-700 hover:bg-blue-50"
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Force Sync
                </Button>
                
                <Button
                  onClick={emergencyControls.resetJelleSession}
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  disabled={isLoading}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Reset Jelle Session
                </Button>
                
                <Button
                  onClick={emergencyControls.checkSystemStatus}
                  variant="outline"
                  className="border-green-500 text-green-700 hover:bg-green-50"
                  disabled={isLoading}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Check Systeem
                </Button>
                
                <Button
                  onClick={emergencyControls.backupData}
                  variant="outline"
                  className="border-purple-500 text-purple-700 hover:bg-purple-50"
                  disabled={isLoading}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Backup Data
                </Button>
              </div>

              {/* Emergency Message */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">🚨 Emergency Bericht:</Label>
                <div className="flex gap-2">
                  <Input
                    value={emergencyMessage}
                    onChange={(e) => setEmergencyMessage(e.target.value)}
                    placeholder="Type een urgent bericht..."
                    className="flex-1"
                  />
                  <Button
                    onClick={emergencyControls.emergencyMessage}
                    variant="destructive"
                    disabled={isLoading || !emergencyMessage.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Verstuur
                  </Button>
                </div>
              </div>

              {/* Emergency Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                <div>
                  <div className="font-medium text-red-700">Emergency Mode</div>
                  <div className="text-sm text-red-600">Extra controles en logging</div>
                </div>
                <Button
                  onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                  variant={isEmergencyMode ? "destructive" : "outline"}
                  size="sm"
                >
                  {isEmergencyMode ? "Uitschakelen" : "Inschakelen"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
