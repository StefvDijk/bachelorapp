import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Grid3X3, Camera, ShoppingCart } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';
import { SessionManager } from '@/utils/sessionManager';
const MainHub = () => {
  const navigate = useNavigate();
  const [hasFoundFriends, setHasFoundFriends] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  useEffect(() => {
    // Initialize session silently in background
    SessionManager.createSession('Jelle');

    // Check if treasure hunt is completed
    const treasureCompleted = localStorage.getItem('treasureHuntCompleted');
    setHasFoundFriends(treasureCompleted === 'true');

    // Show welcome dialog if just completed treasure hunt
    if (treasureCompleted === 'true' && !localStorage.getItem('hasSeenMainHubWelcome')) {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        setShowWelcomeDialog(true);
        localStorage.setItem('hasSeenMainHubWelcome', 'true');
      }, 100);
    }
  }, []);
  return <div className="h-screen w-full fixed top-0 left-0 bg-white relative overflow-hidden overscroll-none">
      <div className="fixed inset-0 bg-white z-0"></div>
      
      <div className="relative flex flex-col h-full p-3 gap-2">
        {/* Main Game - Jelle's Laatste Keer - Takes 35% of height */}
        <Card className="w-full max-w-md bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400 shadow-xl cursor-pointer hover:shadow-2xl transition-all flex-[32]" onClick={() => navigate('/player/Jelle')}>
          <CardContent className="p-2 bg-white/90 backdrop-blur-sm rounded-xl relative h-full flex flex-col">
            {/* Image takes most of the space */}
            <div className="flex-1 flex items-center justify-center p-2">
              <img src="/lovable-uploads/cb7df27d-63af-4307-a988-71139bf41906.png" alt="Jelle's Laatste Keer" className="w-full h-full object-contain" />
            </div>
              
            {/* Action Button at bottom */}
             <Button onClick={() => navigate('/player/Jelle')} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-3 py-1.5 rounded-full shadow-lg text-xs w-full mt-1">
              Start!
            </Button>
          </CardContent>
        </Card>

        {/* Secondary Features Row - Takes 30% of height */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-md flex-[30]">
          {/* Simply Wild */}
          <Card className="bg-gradient-to-br from-red-50 to-yellow-50 border-red-400 shadow-lg cursor-pointer hover:shadow-xl transition-all h-full" onClick={() => navigate('/simply-wild')}>
            <CardContent className="p-2 bg-white/90 backdrop-blur-sm rounded-xl relative h-full flex flex-col">
              {/* Image takes most of the space */}
              <div className="flex-1 flex items-center justify-center p-2">
                <img src="/lovable-uploads/35cd4000-cc2e-49ca-b8c7-eeac2c8e659f.png" alt="Simply Jelle" className="w-full h-full object-contain" />
              </div>
                
              {/* Action Button at bottom */}
              <Button onClick={() => navigate('/simply-wild')} className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-medium px-3 py-1.5 rounded-full shadow-lg text-xs w-full mt-1">
                🎰 Speel Nu!
              </Button>
            </CardContent>
          </Card>

          {/* Deal Maker's Shop */}
          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-400 shadow-lg cursor-pointer hover:shadow-xl transition-all h-full" onClick={() => navigate('/deal-makers-shop')}>
            <CardContent className="p-2 bg-white/90 backdrop-blur-sm rounded-xl relative h-full flex flex-col">
              {/* Image takes most of the space */}
              <div className="flex-1 flex items-center justify-center p-1">
                <img src="/lovable-uploads/a3a97c74-996f-4d56-beb0-82041c494941.png" alt="Dealmaker's Shop" className="w-full h-full object-contain" />
              </div>
                
              {/* Action Button at bottom */}
              <Button onClick={() => navigate('/deal-makers-shop')} className="bg-[#eda566] hover:bg-[#d89456] text-[#2d3c4d] font-medium px-3 py-1.5 rounded-full shadow-lg text-xs w-full mt-1">
                De beste deals
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Photo Wall - Bottom Feature - Takes 18% of height */}
        <Card className="w-full max-w-md bg-gradient-to-br from-pink-50 to-yellow-50 border-pink-400 shadow-xl cursor-pointer hover:shadow-2xl transition-all flex-[20]" onClick={() => navigate('/photo-wall')}>
          <CardContent className="p-2 bg-white/90 backdrop-blur-sm rounded-xl relative h-full flex flex-col justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 overflow-hidden border-2 border-pink-300">
                <img src="/lovable-uploads/973c23d1-9028-4d5c-a8ff-5e42800968dd.png" alt="Jelle's Profile" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm font-semibold text-pink-600">📸 @jellekrmht</h3>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="text-center mb-2">
              <div className="text-3xl mb-2">🎉</div>
              <DialogTitle className="text-base sm:text-lg text-center">We zijn compleet!</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm leading-snug text-center">
              In dit home scherm vind je:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm leading-snug"><strong>Jelle's laatste keer.</strong> Het hoofdspel met opdrachten en punten. Ga hier zo als eerst heen!</p>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm leading-snug"><strong>Dealmaker's Shop.</strong> Ruil punten in voor beloningen.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 text-yellow-600 flex-shrink-0 text-center text-xs font-bold">🎰</div>
                <p className="text-sm leading-snug"><strong>Simply Jelle.</strong> Waag een gokje met je punten.</p>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-pink-600 flex-shrink-0" />
                <p className="text-sm leading-snug"><strong>Jelle's feed.</strong> Bekijk alle foto's van de dag.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default MainHub;