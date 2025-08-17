import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { 
  ShoppingCart, Coins,
  ArrowLeft, CheckCircle, AlertCircle, HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager } from '@/utils/sessionManager';
import { PointsManager } from '@/utils/pointsManager';
import { PointsHistoryManager } from '@/utils/pointsHistoryManager';
import CountdownTimer from '@/components/CountdownTimer';
import NavigationBar from '@/components/NavigationBar';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: 'social' | 'game' | 'luxury' | 'ultimate';
  isBundle?: boolean;
  bundleItems?: string[];
  originalPrice?: number;
  discount?: number;
  repeatable?: boolean;
}



// Add Mystery Box interface
interface MysteryBox {
  id: string;
  name: string;
  description: string;
  price: number;
  possibleRewards: ShopItem[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

const DealMakersShop = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentPoints, setCurrentPoints] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);
  const [purchasedCounts, setPurchasedCounts] = useState<Record<string, number>>({});
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [variableSpend, setVariableSpend] = useState<number>(0);
  


  const handleBackToPlayer = async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      // Ensure RLS context for reading user_name
      await supabase.rpc('set_session_context', { session_id: sessionId });
      const { data } = await supabase
        .from('sessions')
        .select('user_name')
        .eq('id', sessionId)
        .single();
      const userName = (data as any)?.user_name || 'Jelle';
      const search = window.location.search || '';
      navigate(`/player/${encodeURIComponent(userName)}${search}`);
    } catch (e) {
      // Fallback
      navigate('/home');
    }
  };

  // Individual shop items
  const shopItems: ShopItem[] = [
    {
      id: 'anne-is-de-lul',
      name: 'Anne is de lul!',
      description: 'Geef je pakje weg aan je broer voor een halfuur.',
      price: 10,
      icon: '👔',
      category: 'social'
    },
    {
      id: 'adtje-voor-de-sfeer',
      name: 'Atje voor de sfeer!',
      description: 'Deel een shotje of een atje uit aan iemand. Je kan het vaker doen, maar 1 keer per persoon.',
      price: 20,
      icon: '🍻',
      category: 'social',
      repeatable: true
    },
    {
      id: 'arm-wrestle-shot',
      name: 'Armpje Drukken',
      description: "Wijs 2 personen aan die armpje drukken. De verliezer neemt een atje of een shotje.",
      price: 30,
      icon: '💪',
      category: 'game',
      repeatable: true
    },
    {
      id: 'even-rust',
      name: 'Even rust',
      description: 'Voor 15 minuten ben je even niet de bachelor maar gewoon 1 van ons. Even rust.',
      price: 50,
      icon: '🧘',
      category: 'luxury'
    },
    {
      id: 'bierslaaf',
      name: 'Bierslaaf',
      description: 'Wijs 1 iemand aan die je een uur lang in al je wensen omtrent je drinken voorziet.',
      price: 50,
      icon: '🍺',
      category: 'social'
    },
    {
      id: 'skip-opdracht-straf',
      name: 'Skip Opdracht',
      description: 'Skip eenmalig een opdracht.',
      price: 60,
      icon: '🎯',
      category: 'game'
    },
    {
      id: 'drinking-buddy',
      name: 'Drinking Buddy',
      description: 'Laat een vriend voor een uur drinken wat jij drinkt.',
      price: 75,
      icon: '🍺',
      category: 'social'
    },
    {
      id: 'drinking-rule',
      name: 'Drankregel',
      description: 'Deel één drankregel (bv: alleen drinken met rechterhand) uit voor een uur aan iedereen (incl. straf).',
      price: 80,
      icon: '📜',
      category: 'social'
    },
    {
      id: 'massage-sessie',
      name: 'Massage Sessie',
      description: 'Krijg een 5 minuten massage van iemand naar keuze.',
      price: 100,
      icon: '💆‍♂️',
      category: 'luxury'
    },
    {
      id: 'vele-handen',
      name: 'Vele handen',
      description: 'Kies een persoon om samen je opdracht mee te doen.',
      price: 100,
      icon: '🤝',
      category: 'game'
    },
    {
      id: 'deel-opdracht-uit',
      name: 'Deel Opdracht Uit',
      description: 'Deel een (zelfbedachte) opdracht uit aan iemand anders.',
      price: 150,
      icon: '🎭',
      category: 'game'
    },
    {
      id: 'pakje-uit-uur',
      name: 'Pakje doorgeven',
      description: 'Deel voor 1 uur je pakje uit aan iemand anders.',
      price: 200,
      icon: '👔',
      category: 'social'
    },
    {
      id: 'opdracht-vervanging-iemand',
      name: 'Vervang Iemand',
      description: 'Laat iemand anders jouw opdracht doen.',
      price: 250,
      icon: '👥',
      category: 'game'
    },
    {
      id: 'pakje-uit',
      name: 'Pakje',
      description: 'Helemaal verlost van je pakje.',
      price: 350,
      icon: '👔',
      category: 'social'
    },
    {
      id: 'koop-stripper-af',
      name: 'Koop Stripper Af',
      description: 'Koop de stripper af en skip de lapdance.',
      price: 600,
      icon: '💃',
      category: 'luxury'
    },
    {
      id: 'koop-iets-uit-de-pot',
      name: 'Koop iets uit de pot!',
      description: '1 punt = €0,05. Druk hieronder op de knop en vul in hoeveel punten je uitgeeft.',
      price: 1,
      icon: '🪙',
      category: 'luxury'
    },
  ];

  // Only show regular items in the main grid
  const allItems = shopItems;

  useEffect(() => {
    loadCurrentPoints();
    loadPurchasedItems();
    
    // Show help dialog on first visit
    const hasSeenHelp = localStorage.getItem('dealMakersShopHelpSeen');
    if (!hasSeenHelp) {
      setShowHelpDialog(true);
      localStorage.setItem('dealMakersShopHelpSeen', 'true');
    }
  }, []);

  const loadCurrentPoints = async () => {
    try {
      const points = await PointsManager.getCurrentPoints();
      setCurrentPoints(points);
    } catch (error) {
      console.error('Error loading points:', error);
    }
  };

  const loadPurchasedItems = async () => {
    try {
      const sessionId = SessionManager.getSessionId();
      
      const { data, error } = await (supabase as any)
        .from('shop_purchases')
        .select('item_id')
        .eq('session_id', sessionId) as { data: any[] | null, error: any };

      if (error) {
        console.error('Error loading purchased items:', error);
        return;
      }

      // Build counts per item_id
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        counts[row.item_id] = (counts[row.item_id] || 0) + 1;
      });
      setPurchasedCounts(counts);

      // For non-repeatable items, mark as purchased to disable button
      const purchasedIds = Object.keys(counts).filter(id => !shopItems.find(si => si.id === id)?.repeatable);
      setPurchasedItems(purchasedIds);
    } catch (error) {
      console.error('Error loading purchased items:', error);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    // Check if item is already purchased
    if (isItemPurchased(item.id)) {
      toast({
        title: "Al gekocht!",
        description: "Je hebt dit item al gekocht en kunt het niet opnieuw kopen.",
        variant: "destructive",
      });
      return;
    }

    // Special flow for variable-spend deal
    if ((item as ShopItem).id === 'koop-iets-uit-de-pot') {
      const freshBalance = await PointsManager.getCurrentPoints();
      setCurrentPoints(freshBalance);
      if (freshBalance <= 0) {
        if (navigator.vibrate) navigator.vibrate(10);
        toast({ title: "nog niet genoeg punten om een deal te maken!", variant: "destructive" });
        return;
      }
      setVariableSpend(Math.min(freshBalance, 1));
      setSelectedItem(item);
      setShowPurchaseDialog(true);
      return;
    }

    // Check balance before opening dialog; show short toast if insufficient
    const price = item.price;
    const freshBalance = await PointsManager.getCurrentPoints();
    setCurrentPoints(freshBalance);
    if (freshBalance < price) {
      if (navigator.vibrate) navigator.vibrate(10);
      toast({
        title: "nog niet genoeg punten om een deal te maken!",
        variant: "destructive",
      });
      return;
    }

    setSelectedItem(item);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    // Double check if item is already purchased
    if (isItemPurchased(selectedItem.id)) {
      toast({
        title: "Al gekocht!",
        description: "Je hebt dit item al gekocht en kunt het niet opnieuw kopen.",
        variant: "destructive",
      });
      setShowPurchaseDialog(false);
      setSelectedItem(null);
      return;
    }

    try {
      const isVariable = selectedItem.id === 'koop-iets-uit-de-pot';
      const price = isVariable ? Math.max(0, Math.floor(variableSpend || 0)) : selectedItem.price;
      
      // Validate for variable deal
      if (isVariable) {
        if (price < 1) {
          toast({ title: "Vul minimaal 1 punt in", variant: "destructive" });
          return;
        }
        if (price > currentPoints) {
          toast({ title: "Te veel punten gekozen", description: `Maximaal ${currentPoints}`, variant: "destructive" });
          return;
        }
      }

      // Get fresh points balance to avoid stale state
      const freshBalance = await PointsManager.getCurrentPoints();
      setCurrentPoints(freshBalance);
      
      // Haptic feedback for confirm
      if (navigator.vibrate) navigator.vibrate(15);

      if (freshBalance < price) {
        toast({
          title: "Onvoldoende punten",
          description: `Je hebt ${freshBalance} punten, maar hebt ${price} punten nodig.`,
          variant: "destructive",
        });
        return;
      }

      // Deduct points using centralized manager (clamped at 0)
      const deducted = await PointsManager.subtractPoints(price);
      if (!deducted) {
        toast({
          title: "Onvoldoende punten",
          description: `Aankoop mislukt. Probeer opnieuw.`,
          variant: "destructive",
        });
        return;
      }

      // Record purchase
      const { error: purchaseError } = await (supabase as any)
            .from('shop_purchases')
            .insert({
          session_id: SessionManager.getSessionId(),
          item_id: (selectedItem as any).id,
          item_name: (selectedItem as any).name,
          price: price,
              purchased_at: new Date().toISOString()
            });

      if (purchaseError) {
        // If unique constraint hit, surface friendly message
        const msg = (purchaseError as any)?.message || '';
        if (msg.includes('shop_purchases_unique_per_session')) {
          toast({
            title: "Al gekocht!",
            description: "Je kunt dit item maar één keer kopen.",
            variant: "destructive",
          });
          setShowPurchaseDialog(false);
          setSelectedItem(null);
          return;
        }
        console.error('Error recording purchase:', purchaseError);
        toast({
          title: "Fout bij aankoop",
          description: "Er ging iets mis bij het registreren van je aankoop.",
          variant: "destructive",
        });
        return;
      }

      // Add to points history
      await PointsHistoryManager.addSpent(price, `Shop: ${selectedItem.name}${isVariable ? ` (€${(price * 0.05).toFixed(2)})` : ''}`);

      // Update local state
      setCurrentPoints(prev => prev - price);
      const repeatable = !!shopItems.find(i => i.id === selectedItem.id)?.repeatable;
      if (repeatable) {
        setPurchasedCounts(prev => ({ ...prev, [selectedItem.id]: (prev[selectedItem.id] || 0) + 1 }));
      } else {
        setPurchasedItems(prev => [...prev, selectedItem.id]);
      }

      toast({
        title: "Aankoop voltooid! 🎉",
             });

      setShowPurchaseDialog(false);
      setSelectedItem(null);
      setVariableSpend(0);

    } catch (error) {
      console.error('Error processing purchase:', error);
      toast({
        title: "Fout bij aankoop",
        description: "Er ging iets mis bij het verwerken van je aankoop.",
        variant: "destructive",
      });
    }
  };

  const updatePointsInDatabase = async (pointsToDeduct: number) => {
    try {
      const sessionId = SessionManager.getSessionId();
      
      // Set session context for RLS security
      await supabase.rpc('set_session_context', { session_id: sessionId });
      
      const { data: currentData, error: fetchError } = await supabase
        .from('sessions')
        .select('points_balance')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (currentData?.points_balance || 0) - pointsToDeduct;

      const { error: updateError } = await supabase
        .from('sessions')
        .update({ points_balance: newBalance })
        .eq('id', sessionId);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error updating points:', error);
      throw error;
    }
  };

  const isItemPurchased = (itemId: string) => {
    const repeatable = !!shopItems.find(i => i.id === itemId)?.repeatable;
    return !repeatable && purchasedItems.includes(itemId);
  };



  return (
    <div className="min-h-screen bg-white">
      {/* Status Bar */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border p-3 sticky top-0 z-10">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleBackToPlayer}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4 text-[#eda566]" />
              <span className="font-bold text-lg text-[#2d3c4d]">{currentPoints}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowHelpDialog(true)}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <CountdownTimer compact={true} />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 pb-20">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-1">
            <img 
              src="/lovable-uploads/a3a97c74-996f-4d56-beb0-82041c494941.png"
              alt="Dealmaker's Shop"
              className="w-full max-w-[200px] mx-auto object-contain"
            />
          </div>
        </div>
          


        {/* Regular Shop Items */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* All items (repeatable items stay here even when purchased) */}
            {allItems.map((item) => {
            const isVariable = item.id === 'koop-iets-uit-de-pot';
            const price = item.price;
            const purchased = isItemPurchased(item.id);

            return (
              <Card 
                key={item.id}
                className={`relative transition-all duration-300 hover:shadow-lg bg-[#FAFAFA] border-2 border-[#354E62] h-full ${
                  purchased && !item.repeatable ? 'opacity-75' : 'hover:scale-105'
                }`}
              >
                <CardContent className="p-3 flex flex-col h-full">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h3 className="font-bold text-xs text-[#354E62]">{item.name}</h3>
                        {/* Show count for repeatable items */}
                        {item.repeatable && purchasedCounts[item.id] > 0 && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {purchasedCounts[item.id]}x gekocht
                          </Badge>
                        )}
                      </div>
                    </div>
                    {purchased && !item.repeatable && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#354E62] mb-3 leading-relaxed">
                    {item.description}
                  </p>



                  {/* Price removed from card body; shown in button if needed */}

                  {/* Action Button */}
                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={currentPoints === 0}
                    variant={purchased && !item.repeatable ? 'outline' : 'default'}
                    size="sm"
                    className="w-full mt-auto"
                  >
                    {purchased && !item.repeatable ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Gekocht
                      </>
                    ) : currentPoints < price ? (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isVariable ? 'x punten' : `${price} punten`}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isVariable ? 'Koop Nu - x punten' : `Koop Nu - ${price} punten`}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </div>



        {/* Gemaakte Deals - Purchased Items at the bottom */}
        {purchasedItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center mb-6">✅ Gemaakte Deals</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Purchased regular items (only non-repeatable) */}
              {allItems.filter(item => isItemPurchased(item.id) && !item.repeatable).map((item) => {
                const price = item.price;
                const purchased = true;

                return (
                  <Card 
                    key={item.id}
                    className="relative transition-all duration-300 bg-[#FAFAFA] border-2 border-[#354E62] opacity-75 h-full"
                  >
                    <CardContent className="p-3 flex flex-col h-full">
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                                                    <h3 className="font-bold text-xs text-[#354E62]">{item.name}</h3>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[#354E62] mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      

                      {/* Price removed from card body; shown in button if needed */}

                      {/* Action Button */}
                      <Button
                        disabled={true}
                        variant="outline"
                        size="sm"
                        className="w-full mt-auto"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Gekocht
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}


            </div>
          </div>
        )}
      </div>
      


      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedItem?.icon}</span>
              <span>Bevestig Aankoop</span>
            </DialogTitle>
          </DialogHeader>
          
      {selectedItem && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">{selectedItem.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedItem.description}
                </p>
                
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <span className="font-bold text-lg">
                      {(selectedItem.id === 'koop-iets-uit-de-pot') ? 
                        Math.max(0, Math.floor(variableSpend || 0)) : 
                        selectedItem.price} punten
                    </span>
                  </div>
              <p className="text-xs text-muted-foreground">
                {(selectedItem.id === 'koop-iets-uit-de-pot') ? (
                  <>Je kan iets kopen voor €{(Math.max(0, Math.floor(variableSpend || 0)) * 0.05).toFixed(2)}</>
                ) : (
                  <>Jelle's nieuwe budget: {currentPoints - selectedItem.price} punten</>
                )}
              </p>
                </div>
              </div>

          {((selectedItem as ShopItem).id === 'koop-iets-uit-de-pot') && (
            <div className="space-y-2">
              <label className="text-xs text-[#354E62] font-semibold">Hoeveel punten wil je uitgeven? (max {currentPoints})</label>
              <Input
                type="number"
                min={1}
                max={currentPoints}
                value={variableSpend}
                onChange={(e) => setVariableSpend(Number(e.target.value))}
              />
            </div>
          )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowPurchaseDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={confirmPurchase}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bevestig Deal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>DealMakers Shop Uitleg</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Eigenlijk is een uitleg niet nodig want jij bent de enige echte dealmaker, maar op deze pagina kan je:
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Punten Spenderen</h4>
                  <p className="text-xs text-muted-foreground">
                    Gebruik je verdiende punten om voordelen te kopen die je helpen tijdens de dag of die gewoon leuk zijn.
                  </p>
                </div>
              </div>



              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Gemaakte Deals</h4>
                  <p className="text-xs text-muted-foreground">
                    Gekochte voordelen worden groen gemarkeerd en zijn direct beschikbaar voor gebruik tijdens het feest. Bijna elk item is maar 1x de koop. Sommigen meerdere keren, die blijven actief, ook na aankoop.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-primary">
                Dealmakers klaar? Deals maken maar!
              </p>
            </div>

            <Button
              onClick={() => setShowHelpDialog(false)}
              className="w-full"
            >
              Begrepen!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <NavigationBar />
    </div>
  );
};

export default DealMakersShop; 