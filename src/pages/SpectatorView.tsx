import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Camera, CheckCircle, Star, ArrowLeft, Grid3X3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CountdownTimer from '@/components/CountdownTimer';
import { useToast } from '@/hooks/use-toast';

interface BingoTask {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  photo_url?: string;
  session_id?: string;
}

interface PhotoFeedItem {
  id: number;
  title: string;
  photo_url: string;
  completed_at: string;
  source_type: 'bingo' | 'treasure' | 'challenge';
}

const SpectatorView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bingoTasks, setBingoTasks] = useState<BingoTask[]>([]);
  const [photoFeed, setPhotoFeed] = useState<PhotoFeedItem[]>([]);
  const [gameLayout, setGameLayout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFeedItem | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // Hardcoded game layout (same as PlayerApp)
  const colorArray = [
    'pink', 'blue', 'yellow', 'orange', 'green',
    'blue', 'green', 'pink', 'yellow', 'orange', 
    'yellow', 'pink', 'orange', 'blue', 'green',
    'orange', 'yellow', 'green', 'pink', 'blue',
    'green', 'orange', 'blue', 'yellow', 'pink'
  ];

  const taskTypeArray = Array(25).fill('20');
  const starPositions = [2, 6, 12, 19, 24];

  useEffect(() => {
    setGameLayout({
      colorArray,
      taskTypeArray,
      starPositions
    });

    loadSpectatorData();
    
    // Set up real-time subscriptions for live updates
    const bingoSubscription = supabase
      .channel('spectator-bingo-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bingo_tasks' },
        () => {
          
          loadSpectatorData();
        }
      )
      .subscribe();

    const treasureSubscription = supabase
      .channel('spectator-treasure-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'treasure_hunt' },
        () => {
          
          loadSpectatorData();
        }
      )
      .subscribe();

    const challengeSubscription = supabase
      .channel('spectator-challenge-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'challenges' },
        () => {
          
          loadSpectatorData();
        }
      )
      .subscribe();

    return () => {
      bingoSubscription.unsubscribe();
      treasureSubscription.unsubscribe();
      challengeSubscription.unsubscribe();
    };
  }, []);

  const loadSpectatorData = async () => {
    try {
      setIsLoading(true);
      
      // 1) If a session is forced via URL, always use that
      const urlParams = new URLSearchParams(window.location.search);
      const forcedSessionId = urlParams.get('session');
      let activeSessionId = forcedSessionId || null;

      // 2) Otherwise, find the most recent session (prefer name 'Jelle')
      if (!activeSessionId) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, user_name')
          .order('last_activity', { ascending: false });

        if (sessions && sessions.length > 0) {
          const jelleSession = sessions.find(s => 
            s.user_name === 'Jelle' || 
            s.user_name === 'jelle'
          );
          activeSessionId = jelleSession ? jelleSession.id : sessions[0].id;
        }
      }

      if (activeSessionId) {
        setActiveSession(activeSessionId);
      }

      if (!activeSessionId) {
        setBingoTasks([]);
        setPhotoFeed([]);
        return;
      }

      // Load Jelle's bingo tasks
      const { data: tasks, error } = await supabase
        .from('bingo_tasks')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('id');

      if (error) {
        console.error('Error loading bingo tasks:', error);
        return;
      }

      setBingoTasks(tasks || []);

      // Load all photos from different sources
      await loadAllPhotos(activeSessionId);

    } catch (error) {
      console.error('Error loading spectator data:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon de spectator data niet laden. Probeer opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllPhotos = async (sessionId: string) => {
    try {
      // Load bingo photos
      const { data: bingoData } = await supabase
        .from('bingo_tasks')
        .select('id, photo_url, completed_at, title, session_id')
        .eq('session_id', sessionId)
        .not('photo_url', 'is', null)
        .order('completed_at', { ascending: false });

      // Load challenge photos
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('id, photo_url, completed_at, title')
        .eq('session_id', sessionId)
        .not('photo_url', 'is', null)
        .order('completed_at', { ascending: false });

      // Load treasure hunt photos (if photo_url column exists)
      let treasureData = null;
      try {
        const result = await supabase
          .from('treasure_hunt')
          .select('id, photo_url, found_at, location_name')
          .eq('session_id', sessionId)
          .not('photo_url', 'is', null)
          .order('found_at', { ascending: false });
        treasureData = result.data;
      } catch (error) {
        console.log('Treasure hunt photo_url column not found - skipping treasure photos');
        treasureData = null;
      }

      // Combine all photos
      const allPhotos: PhotoFeedItem[] = [
        ...(bingoData || []).map(item => ({
          id: item.id,
          title: item.title || 'Bingo Opdracht',
          photo_url: item.photo_url!,
          completed_at: item.completed_at,
          source_type: 'bingo' as const
        })),
        ...(challengeData || []).map(item => ({
          id: item.id,
          title: item.title || 'Challenge',
          photo_url: item.photo_url!,
          completed_at: item.completed_at,
          source_type: 'challenge' as const
        })),
        ...(treasureData || []).map((item, index) => ({
          id: item.id,
          title: item.location_name || `Locatie ${index + 1}`,
          photo_url: item.photo_url!,
          completed_at: item.found_at || new Date().toISOString(),
          source_type: 'treasure' as const
        }))
      ];

      // Sort by date - newest first
      allPhotos.sort((a, b) => 
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );

      setPhotoFeed(allPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const getColorClasses = (color: string) => {
    const colorClasses = {
      pink: { bg: 'bg-pink-500', inner: 'bg-pink-300', text: 'text-pink-600' },
      blue: { bg: 'bg-blue-400', inner: 'bg-blue-200', text: 'text-blue-600' },
      yellow: { bg: 'bg-yellow-400', inner: 'bg-yellow-200', text: 'text-yellow-600' },
      orange: { bg: 'bg-orange-500', inner: 'bg-orange-300', text: 'text-orange-600' },
      green: { bg: 'bg-green-400', inner: 'bg-green-200', text: 'text-green-600' }
    };
    return colorClasses[color] || { bg: 'bg-gray-400', inner: 'bg-gray-200', text: 'text-gray-600' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Laden van Jelle's voortgang...</p>
          <p className="text-sm text-muted-foreground mt-2">Live data wordt geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full fixed top-0 left-0 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-auto"
      style={{
        backgroundImage: "url('/lovable-uploads/924ba668-e9c0-474c-9cd1-ea54e24263ba.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 bg-white/75 z-0"></div>
      {/* Status Bar */}
      <div className="relative bg-card/90 backdrop-blur-sm border-b border-border p-3">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-medium">Spectator</span>
            <Badge variant="secondary" className="animate-pulse">🔴 Live</Badge>
          </div>
          <CountdownTimer compact={true} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2">
            🎉 Jelle's Vrijgezellenfeest
          </h1>
          <p className="text-muted-foreground">
            Bekijk live hoe het gaat met Jelle – alleen lezen
          </p>
          {activeSession && (
            <Badge variant="outline" className="mt-2">
              Session: {activeSession.substring(0, 8)}...
            </Badge>
          )}
        </div>
        {/* Opdrachtenlijst */}
        <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-border/50 shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Grid3X3 className="w-4 h-4" />
              Opdrachten (bingo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bingoTasks.map((task, index) => {
                const cellColor = colorArray[index];
                const color = getColorClasses(cellColor);
                const isStar = starPositions.includes(index);
                return (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded border bg-background/60">
                    <span className={`inline-block w-3 h-3 rounded-full ${color.bg}`}></span>
                    {isStar && <Star className="w-4 h-4 text-yellow-500" />}
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title || `Opdracht ${index + 1}`}</span>
                    {task.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className="text-xs text-muted-foreground">open</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Compact Bingo Grid (readonly) */}
        <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-border/50 shadow">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              Bingo Grid (alleen-kijken)
              <Badge variant="secondary" className="text-xs">Jelle ziet dit niet</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-1 mx-auto w-fit">
              {Array.from({ length: 25 }).map((_, index) => {
                const cellColor = colorArray[index];
                const color = getColorClasses(cellColor);
                const task = bingoTasks[index];
                const isCompleted = task?.completed;
                const hasStarIcon = starPositions.includes(index);

                // Map star fill color to matching inner circle like PlayerApp
                const starFillMapping: Record<number, number> = { 2: 8, 6: 4, 12: 9, 19: 13, 24: 18 };
                const targetColorPosition = starFillMapping[index];
                const targetColor = targetColorPosition !== undefined ? colorArray[targetColorPosition] : cellColor;
                const targetInnerClass = getColorClasses(targetColor).inner;
                const colorMap: Record<string, string> = {
                  'bg-pink-300': '#f9a8d4',
                  'bg-blue-200': '#bfdbfe',
                  'bg-yellow-200': '#fef08a',
                  'bg-orange-300': '#fdba74',
                  'bg-green-200': '#bbf7d0'
                };
                const starFill = colorMap[targetInnerClass] || '#ffffff';

                return (
                  <div
                    key={`cell-${index}`}
                    className={`relative border border-black/20 rounded w-10 h-10 ${color.bg}`}
                    title={`Vak ${index + 1}${isCompleted ? ' • voltooid' : ''}`}
                  >
                    {!hasStarIcon && (
                      <div className={`absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 ${color.inner}`}></div>
                    )}
                    {hasStarIcon && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span style={{ color: starFill, WebkitTextStroke: '2px white', fontSize: '1.4rem', lineHeight: 1 }}>★</span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <CheckCircle className="w-5 h-5 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Insta-Style Feed (spectator) */}
        <Card className="w-full max-w-md bg-white border shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <span className="font-semibold">jellekrmht</span>
              </div>
              <Badge variant="outline">{photoFeed.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photoFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm">Nog geen berichten</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {photoFeed.map((photo) => (
                  <button
                    key={`${photo.source_type}-${photo.id}`}
                    className="aspect-square overflow-hidden"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Screen Photo Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl h-[90vh] p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedPhoto.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={selectedPhoto.photo_url} 
                alt={selectedPhoto.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-4 bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                {new Date(selectedPhoto.completed_at).toLocaleString('nl-NL')} • {selectedPhoto.source_type === 'bingo' ? '🎯 Bingo' : selectedPhoto.source_type === 'treasure' ? '🏴‍☠️ Treasure Hunt' : '⚡ Challenge'}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SpectatorView; 