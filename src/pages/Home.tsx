import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartyPopper, User, Info, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';
import CountdownTimer from '@/components/CountdownTimer';
import { SessionManager } from '@/utils/sessionManager';
const Home = () => {
  const navigate = useNavigate();
  const hasStartedApp = localStorage.getItem('hasStartedApp') === 'true';
  const treasureCompleted = localStorage.getItem('treasureHuntCompleted') === 'true';
  const hasSeenImportant = localStorage.getItem('hasSeenImportant') === 'true';
  const [showImportant, setShowImportant] = useState(false);

  // No redirect logic needed since this is now /info route
  useEffect(() => {
    // Touch the session when info page is opened, so admin sees an active session
    SessionManager.createSession('Jelle');
    SessionManager.updateActivity();
  }, []);

  const handleStartPlayer = () => {
    localStorage.setItem('hasStartedApp', 'true');
    // Show 'Belangrijk' once before first treasure hunt
    if (!treasureCompleted && !hasSeenImportant) {
      setShowImportant(true);
      return;
    }
    if (!treasureCompleted) {
      navigate('/treasure-hunt');
    } else {
      navigate('/home');
    }
  };

  // Always show the same content (like in the image)
  return <div className="h-screen w-full fixed top-0 left-0 bg-white relative overflow-hidden overscroll-none">
      <div className="fixed inset-0 bg-white z-0"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 overflow-hidden">
        <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          
        </div>

          {/* Info Sections */}
          <div className="space-y-4">
          
            {/* Welkom & Intro */}
            <Card className="bg-card/90 backdrop-blur-sm border-primary/20 mb-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
                  <Info className="w-4 h-4" />
                  Welkom & Intro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm leading-relaxed">Jelle, de timer hieronder telt af tot het moment dat jij geen vrij man meer bent. Dit is dus de laatste keer dat je nog even van je vrijheid kan genieten, en wij gaan je daarmee helpen vandaag!</p>
                <p className="text-sm leading-relaxed">Eerst iedereen maar eens vinden. We hebben dit keer geen cheque verstopt, maar wel de rest van de aanwezigen.</p>
              </CardContent>
            </Card>

            {/* Countdown Timer */}
            <Card className="bg-card/90 backdrop-blur-sm border-primary/20 mb-2">
              <CardContent className="text-center p-4">
                <CountdownTimer />
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
              <CardContent className="p-4 text-center">
                <h3 className="text-lg font-bold text-primary mb-2">
                  {hasStartedApp ? '🎯 Terug naar je spel?' : '🚀 Laten we beginnen!'}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {hasStartedApp ? 'Klik hier om terug te gaan naar je huidige voortgang.' : 'Klik hier om te beginnen met het vinden van je vrienden!'}
                </p>
                <Button onClick={handleStartPlayer} variant="party" size="lg" className="w-full">
                  <User className="w-5 h-5 mr-2" />
                  {hasStartedApp ? 'TERUG NAAR SPEL' : 'HIDDEN FRIENDS!'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button onClick={() => navigate('/create-event')} variant="outline" size="lg" className="w-full mt-3">
                  <Sparkles className="w-5 h-5 mr-2" />
                  NIEUW EVENT AANMAKEN
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <NavigationBar />

      {/* Belangrijk dialog - shown once before first treasure hunt */}
      <Dialog open={showImportant} onOpenChange={(open) => {
        setShowImportant(open);
        if (!open) {
          localStorage.setItem('hasSeenImportant', 'true');
          navigate('/treasure-hunt');
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-orange-600 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Belangrijk
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm leading-relaxed">
            Zorg dat je bij het afronden van iedere opdracht een leuke foto maakt. Dat is leuk voor de rest om vandaag te kunnen volgen, maar nog leuker als (vertrouwelijk) naslagwerk voor later. Niet vergeten!
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Home;