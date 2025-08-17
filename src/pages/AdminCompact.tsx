import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Eye, Grid3X3, MapPin, RotateCcw, Copy, ExternalLink, CheckCircle, Clock, Trash2, Shield
} from 'lucide-react';
import { SessionBackup } from '@/utils/sessionBackup';

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
  description?: string;
  completed: boolean;
  completed_at?: string;
}

const AdminCompact = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [bingoTasks, setBingoTasks] = useState<BingoTask[]>([]);
  const [treasureLocations, setTreasureLocations] = useState<TreasureLocation[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sessionPhotos, setSessionPhotos] = useState<Array<{ url: string; title: string; source: 'bingo' | 'treasure' }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadDataForSession(currentSessionId);
    } else {
      setBingoTasks([]);
      setTreasureLocations([]);
      setChallenges([]);
    }
  }, [currentSessionId]);

  const initializeSessions = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const forced = urlParams.get('session');
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .order('last_activity', { ascending: false });
      setSessions(data || []);
      const selected = forced || (data?.find(s => s.user_name?.toLowerCase() === 'jelle')?.id || data?.[0]?.id) || null;
      setCurrentSessionId(selected);
      if (selected) {
        const sess = (data || []).find(s => s.id === selected) || null;
        setCurrentSession(sess);
      }
    } catch (e) {
      console.error('Error initializing sessions:', e);
    }
  };

  const loadDataForSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const [bingoRes, treasureRes, challengesRes] = await Promise.all([
        supabase.from('bingo_tasks').select('*').eq('session_id', sessionId).order('id').limit(25),
        // Treasure Hunt has exactly 3 global locations (not session-bound)
        supabase.from('treasure_hunt').select('*').in('id', [237, 238, 239]).order('id'),
        supabase.from('challenges').select('*').eq('session_id', sessionId).order('id')
      ]);
      // De-duplicate bingo tasks and enforce 25 max
      const uniqueBingo: BingoTask[] = Array.from(
        new Map((bingoRes.data || []).map((t: any) => [t.id, t])).values()
      ).slice(0, 25) as BingoTask[];
      setBingoTasks(uniqueBingo);
      setTreasureLocations(treasureRes.data || []);
      setChallenges(challengesRes.data || []);

      // Build photo list for admin download (from DB photo_url fields)
      const bingoPhotos = (uniqueBingo || [])
        .filter((t) => !!t.completed && !!(t as any).photo_url)
        .map((t) => ({ url: (t as any).photo_url as string, title: t.title, source: 'bingo' as const }));
      const treasurePhotos = (treasureRes.data || [])
        .filter((l: any) => !!l.photo_url)
        .map((l: any) => ({ url: l.photo_url as string, title: l.location_name as string, source: 'treasure' as const }));
      setSessionPhotos([...bingoPhotos, ...treasurePhotos]);
    } catch (error) {
      console.error('Error loading session data:', error);
      toast({ title: 'Fout bij laden', description: 'Kon sessie data niet laden', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetBingo = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    try {
      await supabase.from('bingo_tasks').update({ completed: false, completed_at: null, photo_url: null }).eq('session_id', currentSessionId);
      toast({ title: 'Bingo gereset', description: 'Alle 25 vakjes zijn weer leeg' });
      loadDataForSession(currentSessionId);
    } catch (e) {
      console.error(e);
      toast({ title: 'Fout', description: 'Kon bingo niet resetten', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetTreasureHunt = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    try {
      await supabase
        .from('treasure_hunt')
        .update({ found: false, found_at: null, photo_url: null })
        .in('id', [237, 238, 239]);
      toast({ title: 'Zoek de Rest gereset', description: 'Alle locaties zijn weer verstopt' });
      loadDataForSession(currentSessionId);
    } catch (e) {
      console.error(e);
      toast({ title: 'Fout', description: 'Kon schattenjacht niet resetten', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Full DB reset for selected session (without deleting the session record)
  const resetWholeAppForSession = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    try {
      await Promise.all([
        supabase.from('bingo_tasks').update({ completed: false, completed_at: null, photo_url: null }).eq('session_id', currentSessionId),
        supabase.from('treasure_hunt').update({ found: false, found_at: null, photo_url: null }).eq('session_id', currentSessionId),
        supabase.from('challenges').update({ completed: false, completed_at: null, photo_url: null }).eq('session_id', currentSessionId),
        supabase.from('sessions').update({ points_balance: 0, pending_task: null }).eq('id', currentSessionId),
      ]);
      toast({ title: 'App reset (DB)', description: 'Alle data voor deze sessie is teruggezet' });
      await loadDataForSession(currentSessionId);
    } catch (e) {
      console.error('resetWholeAppForSession', e);
      toast({ title: 'Fout', description: 'Kon app reset (DB) niet uitvoeren', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Local app reset on this device (no network required)
  const appResetLocal = async () => {
    try {
      const keep = localStorage.getItem('gameSessionId');
      localStorage.clear();
      if (keep) localStorage.setItem('gameSessionId', keep);
      toast({ title: 'App reset (lokaal)', description: 'App wordt opnieuw gestart' });
      window.location.assign('/info');
    } catch (e) {
      console.error('appResetLocal', e);
      toast({ title: 'Fout', description: 'Kon lokale reset niet uitvoeren', variant: 'destructive' });
    }
  };

  const resetSingleBingoTask = async (taskId: number) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('bingo_tasks')
        .update({ completed: false, completed_at: null, photo_url: null })
        .eq('id', taskId);
      if (error) throw error;
      toast({ title: 'Opdracht heropend', description: `Opdracht ${taskId} staat weer open` });
      if (currentSessionId) loadDataForSession(currentSessionId);
    } catch (e) {
      console.error('Error resetting single task:', e);
      toast({ title: 'Fout', description: 'Kon opdracht niet heropenen', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSingleTreasureLocation = async (locationId: number) => {
    setIsLoading(true);
    try {
      await supabase
        .from('treasure_hunt')
        .update({ found: false, found_at: null, photo_url: null })
        .eq('id', locationId);
      toast({ title: 'Locatie hersteld', description: 'Deze locatie is weer verstopt' });
      if (currentSessionId) loadDataForSession(currentSessionId);
    } catch (e) {
      console.error('Error resetting treasure location:', e);
      toast({ title: 'Fout', description: 'Kon locatie niet herstellen', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const completedBingoTasks = bingoTasks.filter(t => t.completed).length;
  const totalBingoTasks = bingoTasks.length;
  const foundTreasureLocations = treasureLocations.filter(l => l.found).length;
  const totalTreasureLocations = treasureLocations.length;
  const completedChallenges = challenges.filter(c => c.completed).length;

  const getPlayerLink = () => `${window.location.origin}/player/${currentSession?.user_name || 'Jelle'}?session=${currentSessionId}`;
  const getSpectatorLink = () => `${window.location.origin}/spectator?session=${currentSessionId}`;
  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Gekopieerd', description: label });
  };

  // Simple remote controls via live_messages protocol
  const sendCommand = async (cmd: string) => {
    if (!currentSessionId) {
      toast({ title: 'Geen sessie', description: 'Selecteer eerst een sessie', variant: 'destructive' });
      return;
    }
    try {
      // Set session context first so RLS allows insert for targeted session if needed
      await supabase.rpc('set_session_context', { session_id: currentSessionId });
      await supabase.from('live_messages').insert({ session_id: currentSessionId, message: `CMD:${cmd}` });
      toast({ title: 'Verzonden', description: `Commando verstuurd: ${cmd}` });
    } catch (e) {
      console.error('sendCommand error', e);
      toast({ title: 'Fout', description: 'Kon commando niet versturen', variant: 'destructive' });
    }
  };

  const refreshSessions = async () => {
    // Pull latest sessions, but also try to poke the DB to update last_activity ordering reliably
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('last_activity', { ascending: false });
    setSessions(data || []);
  };

  const downloadImage = async (url: string, suggestedName?: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = suggestedName || `photo-${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      // Fallback: open in new tab so user can long-press/save on mobile
      window.open(url, '_blank');
    }
  };

  // Automatic snapshots every 30 minutes (silent)
  useEffect(() => {
    if (!currentSessionId) return;
    const interval = setInterval(async () => {
      try {
        const res = await SessionBackup.createSnapshot(currentSessionId);
        if (res.success) {
          localStorage.setItem(`lastAutoSnapshot:${currentSessionId}`, new Date().toISOString());
        }
      } catch (e) {
        // Silent fail - no UI changes
        console.debug('Auto snapshot failed', e);
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentSessionId]);

  // Nuclear reset: delete session data and re-initialize
  const nuclearReset = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    try {
      await Promise.all([
        supabase.from('bingo_tasks').delete().eq('session_id', currentSessionId),
        supabase.from('treasure_hunt').delete().eq('session_id', currentSessionId),
        supabase.from('challenges').delete().eq('session_id', currentSessionId),
        supabase.from('sessions').delete().eq('id', currentSessionId)
      ]);

      // Recreate session with same id
      await supabase.functions.invoke('initialize-session', {
        body: {
          session_id: currentSessionId,
          user_name: currentSession?.user_name || 'Jelle'
        }
      });

      toast({ title: 'Nuclear reset voltooid', description: 'Sessie opnieuw opgebouwd' });
      await initializeSessions();
      if (currentSessionId) await loadDataForSession(currentSessionId);
    } catch (e) {
      console.error('Nuclear reset error', e);
      toast({ title: 'Fout', description: 'Kon nuclear reset niet uitvoeren', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Snapshots (emergency recovery)
  const createSnapshot = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    const res = await SessionBackup.createSnapshot(currentSessionId);
    setIsLoading(false);
    if (res.success) toast({ title: 'Snapshot gemaakt', description: res.fileName });
    else toast({ title: 'Snapshot fout', description: res.error, variant: 'destructive' });
  };

  const restoreLatestSnapshot = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    const list = await SessionBackup.listSnapshots(currentSessionId);
    if (list.length === 0) {
      setIsLoading(false);
      toast({ title: 'Geen snapshots', description: 'Maak eerst een snapshot', variant: 'destructive' });
      return;
    }
    const latest = list[0];
    const res = await SessionBackup.restoreSnapshot(currentSessionId, latest);
    setIsLoading(false);
    if (res.success) {
      toast({ title: 'Herstel gelukt', description: 'Sessie hersteld naar laatste snapshot' });
      await loadDataForSession(currentSessionId);
    } else {
      toast({ title: 'Herstel fout', description: res.error, variant: 'destructive' });
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
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-primary">Admin</h1>
            <p className="text-xs text-muted-foreground">Kies sessie • Kopieer links • Snelle resets</p>
          </div>

          {/* Current Session & Links */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Huidige sessie</span>
                <Badge variant="secondary">{sessions.length} actief</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Sessie kiezen</Label>
                <select
                  className="w-full border rounded p-2 bg-background"
                  value={currentSessionId || ''}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setCurrentSessionId(id);
                    const sess = sessions.find(s => s.id === id) || null;
                    setCurrentSession(sess);
                  }}
                >
                  <option value="">Geen</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.user_name || 'Onbekend')} — {s.id.substring(0, 8)}...
                    </option>
                  ))}
                </select>
              </div>
              {currentSessionId && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    ID: <span className="font-mono">{currentSessionId.substring(0,8)}...</span> • Naam: {currentSession?.user_name || 'Onbekend'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => copy(getPlayerLink(), 'Player link gekopieerd')}>
                      <Copy className="h-4 w-4 mr-2" /> Player link
                    </Button>
                    <Button variant="outline" onClick={() => window.open(getPlayerLink(), '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Open Player
                    </Button>
                    <Button variant="outline" onClick={() => copy(getSpectatorLink(), 'Spectator link gekopieerd')}>
                      <Copy className="h-4 w-4 mr-2" /> Spectator link
                    </Button>
                    <Button variant="outline" onClick={() => window.open(getSpectatorLink(), '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-2" /> Open Spectator
                    </Button>
                    <Button variant="outline" onClick={() => sendCommand('NAV:/info')}>
                      Navigeer naar Info
                    </Button>
                    <Button variant="outline" onClick={() => sendCommand('NAV:/player/Jelle')}>
                      Navigeer naar Spel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick controls */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Snelle resets</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={resetBingo} variant="outline" disabled={!currentSessionId || isLoading}>
                <Grid3X3 className="h-4 w-4 mr-2" /> Bingo
              </Button>
              <Button onClick={resetTreasureHunt} variant="outline" disabled={!currentSessionId || isLoading}>
                <MapPin className="h-4 w-4 mr-2" /> Zoek de Rest
              </Button>
              <Button onClick={createSnapshot} variant="outline" disabled={!currentSessionId || isLoading}>
                Snapshot
              </Button>
            </CardContent>
          </Card>

          {/* Bingo taken */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Grid3X3 className="h-4 w-4" /> Bingo taken</span>
                <Badge variant="outline">{completedBingoTasks}/{totalBingoTasks}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSessionId ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bingoTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded border bg-background/50">
                      <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                      <div className="flex items-center gap-2">
                        {task.completed ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-success" />
                            {task.completed_at ? new Date(task.completed_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        {task.completed && (
                          <Button variant="outline" size="sm" onClick={() => resetSingleBingoTask(task.id)}>Heropen</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Geen sessie geselecteerd</div>
              )}
            </CardContent>
          </Card>

          {/* Zoek de Rest & Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Zoek de Rest</span>
                  <Badge variant="outline">{foundTreasureLocations}/{totalTreasureLocations}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {treasureLocations.map((loc) => (
                    <div key={loc.id} className="flex items-center justify-between p-2 rounded border bg-background/50">
                      <span className={`text-sm ${loc.found ? 'line-through text-muted-foreground' : ''}`}>{loc.location_name}</span>
                      <div className="flex items-center gap-2">
                        {loc.found ? <CheckCircle className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                        {loc.found && (
                          <Button variant="outline" size="sm" onClick={() => resetSingleTreasureLocation(loc.id)}>Herstel</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Emergency / Recovery */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Emergency & Recovery</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="destructive" onClick={nuclearReset} disabled={!currentSessionId || isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" /> Nuclear reset (DB)
                </Button>
                <Button variant="outline" onClick={restoreLatestSnapshot} disabled={!currentSessionId || isLoading}>
                  Herstel laatste snapshot
                </Button>
                <Button variant="outline" onClick={() => sendCommand('APP_RESET')} disabled={!currentSessionId || isLoading}>
                  App reset (client)
                </Button>
                <Button variant="outline" onClick={() => sendCommand('RELOAD')} disabled={!currentSessionId || isLoading}>
                  Herlaad scherm
                </Button>
                <Button variant="outline" onClick={resetWholeAppForSession} disabled={!currentSessionId || isLoading}>
                  App reset (DB, sessie)
                </Button>
                <Button variant="outline" onClick={appResetLocal}>
                  App reset (lokaal)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Foto's van deze sessie */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Foto's (bingo + treasure)</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionPhotos.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nog geen foto's</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {sessionPhotos.map((p, idx) => (
                    <div key={`${p.url}-${idx}`} className="relative">
                      <img src={p.url} alt={p.title} className="w-full h-24 object-cover rounded border" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 w-full"
                        onClick={() => downloadImage(p.url, `${p.source}-${idx + 1}.jpg`)}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sessies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Actieve sessies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Geen actieve sessies</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded border bg-background/50">
                      <div className="text-sm">
                        <div className="font-medium">{s.user_name || 'Onbekend'}</div>
                        <div className="text-xs text-muted-foreground">{s.id.substring(0,8)}... • {new Date(s.last_activity).toLocaleTimeString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(`/player/${s.user_name || 'speler'}?session=${s.id}`, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setCurrentSessionId(s.id); setCurrentSession(s); }}>
                          Gebruik
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={refreshSessions} variant="outline" className="w-full">Ververs sessies</Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default AdminCompact;


