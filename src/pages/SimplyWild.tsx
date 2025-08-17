import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PointsManager } from '@/utils/pointsManager';
import NavigationBar from '@/components/NavigationBar';

// SYMBOLS with numbers 1-12
const SYMBOLS = {
  1: { // CHERRY
    image: '/lovable-uploads/1f6d3856-30ad-46fa-9a9a-237698a5400b.png', 
    name: 'Cherry', 
    color: 'text-red-500', 
    glow: 'drop-shadow-lg shadow-red-500/50',
    payout: { 2: 2, 3: 10 }
  },
  2: { // LEMON
    image: '/lovable-uploads/09e8686d-8a15-4009-b1e8-3ef6b728f7cd.png', 
    name: 'Lemon', 
    color: 'text-yellow-500', 
    glow: 'drop-shadow-lg shadow-yellow-500/50',
    payout: { 2: 2, 3: 10 }
  },
  3: { // ORANGE
    image: '/lovable-uploads/07283db7-809f-4f50-899e-75a181c1a0f2.png', 
    name: 'Orange', 
    color: 'text-orange-500', 
    glow: 'drop-shadow-lg shadow-orange-500/50',
    payout: { 2: 2, 3: 10 }
  },
  4: { // PLUM
    image: '/lovable-uploads/e43af112-b8bc-4475-9115-aa6aa67a24bd.png', 
    name: 'Plum', 
    color: 'text-purple-600', 
    glow: 'drop-shadow-lg shadow-purple-600/50',
    payout: { 2: 2, 3: 10 }
  },
  5: { // GRAPE
    image: '/lovable-uploads/3beb844b-7038-47e3-96d3-9cabe9d5da79.png', 
    name: 'Grape', 
    color: 'text-purple-500', 
    glow: 'drop-shadow-lg shadow-purple-500/50',
    payout: { 2: 2, 3: 10 }
  },
  6: { // WATERMELON
    image: '/lovable-uploads/4451da40-f120-449a-9328-c6b90320e056.png', 
    name: 'Watermelon', 
    color: 'text-green-500', 
    glow: 'drop-shadow-lg shadow-green-500/50',
    payout: { 2: 2, 3: 10 }
  },
  7: { // SEVEN
    image: '/lovable-uploads/e7a30f81-aa69-40d5-b31f-82241748f230.png', 
    name: 'Seven', 
    color: 'text-red-600', 
    glow: 'drop-shadow-lg shadow-red-600/50',
    payout: { 2: 5, 3: 75 }
  },
  8: { // BELL
    image: '/lovable-uploads/d9507139-9ec0-44cd-a1e7-94cccca15054.png', 
    name: 'Bell', 
    color: 'text-yellow-600', 
    glow: 'drop-shadow-lg shadow-yellow-600/50',
    payout: { 2: 5, 3: 75 }
  },
  9: { // CROWN
    image: '/lovable-uploads/1ce45f89-5834-4793-bf75-b6b7b0f2f055.png',
    name: 'Crown', 
    color: 'text-yellow-400', 
    glow: 'drop-shadow-lg shadow-yellow-400/50',
    payout: { 2: 0, 3: 50 },
    isScatter: true
  },
  10: { // STAR
    image: '/lovable-uploads/54e16724-6b1c-44fe-b447-5031ba5b4b4d.png',
    name: 'Star', 
    color: 'text-blue-400', 
    glow: 'drop-shadow-lg shadow-blue-400/50',
    payout: { 2: 5, 3: 75 },
    isWild: true
  },
  11: { // PEAR
    image: '/lovable-uploads/6db4dddd-e2e7-4fd4-ada1-3744ddd187c0.png',
    name: 'Pear', 
    color: 'text-green-400', 
    glow: 'drop-shadow-lg shadow-green-400/50',
    payout: { 2: 2, 3: 10 }
  },
  12: { // STRAWBERRY
    image: '/lovable-uploads/890e2f85-79f6-4391-9ca4-35934f077228.png',
    name: 'Strawberry', 
    color: 'text-red-400', 
    glow: 'drop-shadow-lg shadow-red-400/50',
    payout: { 2: 2, 3: 10 }
  }
};

// REELS with numbers 1-12 (all symbols in each reel)
const BASE_REELS = [
  [1, 2, 3, 4, 1, 5, 6, 8, 7, 1, 3, 9, 1, 3, 5, 2, 8, 1, 6, 7, 10, 11, 12, 1, 9], // Reel 1
  [2, 1, 3, 1, 8, 5, 7, 2, 1, 6, 9, 1, 2, 8, 3, 1, 5, 7, 9, 10, 11, 12, 1, 6],    // Reel 2
  [3, 2, 1, 8, 1, 5, 2, 7, 1, 3, 9, 1, 4, 6, 1, 8, 5, 7, 10, 11, 12, 1, 9, 3]     // Reel 3
];


// WINLINES
const BASE_WINLINES = [
  [1, 1, 1] // Only middle line
];


// PAYTABLES with numbers 1-12 - ONDERSPEL (3 rollen)
const BASE_PAYTABLE = {
  1: { 1: 2, 2: 5, 3: 10 },     // CHERRY - 1=2, 2=5, 3=10
  2: { 1: 0, 2: 5, 3: 10 },     // LEMON - 1=0, 2=5, 3=10
  3: { 1: 0, 2: 5, 3: 10 },     // ORANGE - 1=0, 2=5, 3=10
  4: { 1: 0, 2: 5, 3: 10 },     // PLUM - 1=0, 2=5, 3=10
  5: { 1: 0, 2: 10, 3: 50 },    // GRAPE - 1=0, 2=10, 3=50
  6: { 1: 0, 2: 10, 3: 75 },    // WATERMELON - 1=0, 2=10, 3=75
  7: { 1: 0, 2: 10, 3: 75 },    // SEVEN - 1=0, 2=10, 3=75
  8: { 1: 0, 2: 5, 3: 25 },     // BELL - 1=0, 2=5, 3=25
  9: {},                        // CROWN - scatter only; handled separately as mystery
  10: { 1: 0, 2: 20, 3: 200 },  // STAR - base game payouts (no wild)
  11: { 1: 0, 2: 5, 3: 10 },    // PEAR - 1=0, 2=5, 3=10
  12: { 1: 0, 2: 5, 3: 50 }     // STRAWBERRY - 1=0, 2=5, 3=50
};


interface GameState {
  credits: number;
  clubMeter: number;
  // SIMPLE: Just store the final symbol numbers (1-12)
  baseReelResults: number[];
  baseReelPositions: number[];
  baseSpinOffsets: number[];
  holds: boolean[];
  isSpinning: boolean;
  pendingWin: number;
  isGambling: boolean;

  lastWin: number;
  winningSymbols: Array<{reel: number, position: number, line?: number}>;
  isShowingWinAnimation: boolean;
  holdBlinking: boolean[];
  reelSpinDurations: number[];
  // NEW: Track which reels were auto-held and need to spin at least once
  autoHeldReels: boolean[];
  reelsThatMustSpin: boolean[];
}

const SimplyWild = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<GameState>({
    credits: 0,
    clubMeter: 0,
    baseReelResults: [1, 1, 1], // Final symbol numbers
    baseReelPositions: [0, 0, 0],
    baseSpinOffsets: [0, 0, 0],
    holds: [false, false, false],
    isSpinning: false,
    pendingWin: 0,
    isGambling: false,

    lastWin: 0,
    winningSymbols: [],
    isShowingWinAnimation: false,
    holdBlinking: [false, false, false],
    reelSpinDurations: [1000, 1200, 1400, 1600],
    autoHeldReels: [false, false, false],
    reelsThatMustSpin: [false, false, false]
  });

  // Popup bij geen punten
  const [showNoCreditsPopup, setShowNoCreditsPopup] = useState(false);

  // Load credits from completed bingo tasks
  useEffect(() => {
    loadCreditsFromBingo();
  }, []);



  const loadCreditsFromBingo = async () => {
    try {
      const currentPoints = await PointsManager.getCurrentPoints();
      setGameState(prev => ({
        ...prev,
        credits: currentPoints
      }));

      setShowNoCreditsPopup(currentPoints === 0);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  // Toon melding als punten naar 0 gaan
  useEffect(() => {
    setShowNoCreditsPopup(gameState.credits === 0);
  }, [gameState.credits]);

  const syncCreditsToDatabase = async (newCreditAmount: number) => {
    try {
      await PointsManager.setPoints(newCreditAmount);
      window.dispatchEvent(new CustomEvent('pointsUpdated'));
    } catch (error) {
      console.error('Error syncing credits to database:', error);
    }
  };

  const getVisibleSymbols = (reelStrip: number[], position: number) => {
    const symbols = [];
    for (let i = -1; i <= 1; i++) {
      const index = (position + i + reelStrip.length) % reelStrip.length;
      symbols.push(reelStrip[index]);
    }
    return symbols;
  };

  const getSpinningSymbols = (reelStrip: number[], offset: number) => {
    const SYMBOL_HEIGHT = 43;
    const symbols = [];
    
    // EXACT dezelfde logica als getVisibleSymbols
    const position = Math.floor(-offset / SYMBOL_HEIGHT);
    
    for (let i = -1; i <= 1; i++) {
      const index = (position + i + reelStrip.length) % reelStrip.length;
      const yPos = i * SYMBOL_HEIGHT;
      
      symbols.push({
        symbol: reelStrip[index],
        yPosition: yPos
      });
    }
    
    return symbols;
  };

  const handleStart = () => {
    // If there is a pending win from previous spin/gamble, bank it before starting a new spin
    if (gameState.pendingWin > 0) {
      const newCredits = gameState.credits + gameState.pendingWin;
      setGameState(prev => ({
        ...prev,
        credits: newCredits,
        pendingWin: 0,
        isGambling: false
      }));
      // Persist updated credits before starting a new spin
      syncCreditsToDatabase(newCredits);
      // Defer spin to ensure state is applied
      setTimeout(() => handleBaseSpin(), 0);
      return;
    }
    handleBaseSpin();
  };

  const handleBaseSpin = () => {
    if (gameState.credits < 1) {
      // Stil - geen popup
      return;
    }

    // Spel doorgaan zonder winst in te nemen - trek 1 punt af
    const newCredits = gameState.credits - 1;

    setGameState(prev => ({
      ...prev,
      credits: newCredits,
      isSpinning: true,
      baseSpinOffsets: [0, 0, 0],
      winningSymbols: [], // Reset any previous wins
      isShowingWinAnimation: false,
      // Reset gamble state when starting a new spin
      isGambling: false
    }));

    syncCreditsToDatabase(newCredits);

    // SIMPEL: Laat reels willekeurig stoppen, geen win logica
    const SYMBOL_HEIGHT = 43;
    const SPIN_ITERATIONS = 3;
    
    // Staggered stop times: left reel stops first, then middle, then right
    const stopTimes = [1200, 2400, 3600]; // 1200ms apart as requested
    const maxStopTime = Math.max(...stopTimes);
    
    // Bepaal willekeurige stop posities voor elke reel
    const randomStopPositions = BASE_REELS.map((reelStrip, index) => 
      gameState.holds[index] ? gameState.baseReelPositions[index] : Math.floor(Math.random() * reelStrip.length)
    );

    // Store the current holds state before we reset it
    const currentHolds = [...gameState.holds];

    let animationFrame: number;
    const startTime = Date.now();
    
        const animateSpinning = () => {
      const elapsed = Date.now() - startTime;
      
      setGameState(prev => ({
        ...prev,
        baseReelPositions: prev.baseReelPositions.map((currentPos, reelIndex) => {
          if (currentHolds[reelIndex]) return currentPos; // Use stored holds
          
          const reelStopTime = stopTimes[reelIndex];
          const reelLength = BASE_REELS[reelIndex].length;

          if (elapsed < reelStopTime) {
            // Still spinning - cycle through positions rapidly
            const cycleSpeed = 10; // positions per second
            const currentCycle = Math.floor((elapsed / 1000) * cycleSpeed);
            return currentCycle % reelLength;
          } else {
            // STOPPED: Use the final stop position
            const stopPosition = randomStopPositions[reelIndex];
            
            // DEBUG: Log when each reel stops individually
            if (elapsed >= reelStopTime && elapsed < reelStopTime + 50) { // Only log once per reel
              const visibleSymbols = getVisibleSymbols(BASE_REELS[reelIndex], stopPosition);
              const middleSymbol = visibleSymbols[1];
      
              

            }
            
            return stopPosition;
          }
        })
      }));
      
      if (elapsed < maxStopTime) {
        animationFrame = requestAnimationFrame(animateSpinning);
      } else {
        // All reels have stopped - final cleanup
        setGameState(prev => {
          // Een reel die VAST stond heeft niet gedraaid -> moet minimaal 1x draaien (true)
          // Een reel die NIET vast stond heeft gedraaid -> mag weer vast (false)
          const newReelsThatMustSpin = prev.reelsThatMustSpin.map((_, index) => {
            return currentHolds[index] ? true : false;
          });

          return {
            ...prev,
            isSpinning: false,
            holds: [false, false, false], // Reset alle holds na elke spin
            reelsThatMustSpin: newReelsThatMustSpin
          };
        });

                  // WIN BEREKENING - bepaal finale resultaten en bereken winst
          setTimeout(() => {
            const visualResults = randomStopPositions.map((pos, index) => {
              const visibleSymbols = getVisibleSymbols(BASE_REELS[index], pos);
              return visibleSymbols[1]; // Middle symbol (winline position)
            });

            // Update de results voor display EN de positions voor crown detection
            setGameState(prev => ({
              ...prev,
              baseReelResults: visualResults,
              baseReelPositions: randomStopPositions // Critical fix: update positions here
            }));

            // BEREKEN WINST op basis van visuele resultaten EN finale posities
            calculateBaseWin(visualResults, randomStopPositions);
          }, 100);
      }
    };

    animationFrame = requestAnimationFrame(animateSpinning);
  };

  const calculateBaseWin = (visualResults: number[], finalPositions: number[]) => {
    
    let win = 0;
    let winningSymbols: Array<{reel: number, position: number, line?: number}> = [];
    
    // Use the visual results directly (middle symbols)
    const winLineSymbols = visualResults;
    
    // KROON SCATTER: Check ALLE posities op elke reel voor kronen
    const crownOnReel = [0, 1, 2].map(reelIndex => {
      // Gebruik de finale positie data die net werd berekend
      const reelPosition = finalPositions[reelIndex];
      const visibleSymbols = getVisibleSymbols(BASE_REELS[reelIndex], reelPosition);
      console.log(`🔍 Checking crowns on reel ${reelIndex}, position ${reelPosition}, symbols:`, visibleSymbols);
      return visibleSymbols.some(symbol => symbol === 9); // Check alle 3 posities per reel
    });

    console.log("👑 Crown check results:", crownOnReel);

    if (crownOnReel[0] && crownOnReel[1] && crownOnReel[2]) {
      // 3 kronen in zicht (rol 1-2-3): 5-100 in stappen van 5, lagere bedragen meer kans
      const possibleWins = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
      // Sterker naar lage bedragen sturen met kwadratische weging
      const weights = possibleWins.map((_, index) => {
        const w = Math.max(1, 21 - index); // basis: 20..1
        return w * w; // kwadratisch voor zwaardere bias naar lage uitkomsten
      });
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      let random = Math.random() * totalWeight;
      let winIndex = 0;
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          winIndex = i;
          break;
        }
      }
      
      win = possibleWins[winIndex];
      console.log("🎯 3 CROWNS WIN:", win);
      // Markeer alle zichtbare kronen
      winningSymbols = [];
      for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
        const visibleSymbols = getVisibleSymbols(BASE_REELS[reelIndex], finalPositions[reelIndex]);
        for (let posIndex = 0; posIndex < 3; posIndex++) {
          if (visibleSymbols[posIndex] === 9) {
            winningSymbols.push({ reel: reelIndex, position: posIndex });
          }
        }
      }
    } else if (crownOnReel[0] && crownOnReel[1]) {
      // 2 kronen (rol 1 en 2): 2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 met lagere bedragen meer kans
      const possibleWins = [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
      // Sterker naar lage bedragen sturen met kwadratische weging
      const weights = possibleWins.map((_, index) => {
        const w = Math.max(1, 12 - index); // basis: 11..1
        return w * w; // kwadratisch voor zwaardere bias naar lage uitkomsten
      });
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      let random = Math.random() * totalWeight;
      let winIndex = 0;
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          winIndex = i;
          break;
        }
      }
      
      win = possibleWins[winIndex];
      console.log("🎯 2 CROWNS WIN:", win);
      winningSymbols = [];
      for (let reelIndex = 0; reelIndex < 2; reelIndex++) {
        const visibleSymbols = getVisibleSymbols(BASE_REELS[reelIndex], finalPositions[reelIndex]);
        for (let posIndex = 0; posIndex < 3; posIndex++) {
          if (visibleSymbols[posIndex] === 9) {
            winningSymbols.push({ reel: reelIndex, position: posIndex });
          }
        }
      }
    } else {
      // REGULIERE WINS - LINKS-NAAR-RECHTS REGEL
      const symbol = winLineSymbols[0]; // Start met linkerrol
      
      if (BASE_PAYTABLE[symbol]) {
        // Check 3 van dezelfde (aaneengesloten van links naar rechts)
        if (winLineSymbols[0] === winLineSymbols[1] && winLineSymbols[1] === winLineSymbols[2]) {
          win = BASE_PAYTABLE[symbol][3] || 0;
          winningSymbols = [
            { reel: 0, position: 1 },
            { reel: 1, position: 1 },
            { reel: 2, position: 1 }
          ];
        } 
        // Check 2 van dezelfde (MOET beginnen in linkerrol)
        else if (winLineSymbols[0] === winLineSymbols[1]) {
          win = BASE_PAYTABLE[symbol][2] || 0;
          winningSymbols = [
            { reel: 0, position: 1 },
            { reel: 1, position: 1 }
          ];
        } 
        // Check 1 symbool (alleen voor Cherry)
        else if (symbol === 1) {
          win = BASE_PAYTABLE[symbol][1] || 0;
          winningSymbols = [{ reel: 0, position: 1 }];
        }
        // GEEN WIN - midden/rechts combinaties tellen niet
      }
    }

    if (win > 0) {
      setGameState(prev => ({
        ...prev,
        // Start a fresh gamble window for each resolved spin result
        pendingWin: win,
        lastWin: win,
        winningSymbols: winningSymbols,
        isShowingWinAnimation: true,
        isGambling: true // Enable gambling when there's a win
      }));

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          isShowingWinAnimation: false
        }));
      }, 3000);

        // Crown auto-hold hint handled in checkNearWins; no action needed here
      } else {
        // Alleen auto-hold checken als er geen handmatige holds zijn
        const hasManualHolds = gameState.holds.some(hold => hold);
        if (!hasManualHolds) {
          checkNearWins(winLineSymbols);
        }
      }
  };


  const suggestHolds = (results: number[], targetSymbol: number) => {
    const newHolds = results.map(symbol => symbol === targetSymbol);
    setGameState(prev => ({ ...prev, holds: newHolds }));
  };

  const checkNearWins = (results: number[]) => {
    // Check voor automatische holds bij 2 van dezelfde symbolen
    let newHolds = [false, false, false];
    let holdMessage = "";
    
    console.log("🔍 checkNearWins called with results:", results);
    
    // KROON SPECIALE REGEL - Check alle posities voor kronen
    let allCrowns: Array<{reel: number, position: number}> = [];
    
    // FIX: Gebruik de results (winline symbols) in plaats van baseReelPositions
    const leftSymbol = results[0];   // Reel 0 (linker) - winline
    const middleSymbol = results[1]; // Reel 1 (midden) - winline
    const rightSymbol = results[2];  // Reel 2 (rechter) - winline
    
    console.log("🔍 Winline symbols:", { leftSymbol, middleSymbol, rightSymbol });
    
    // Check alleen de winline posities (midden van elke rol)
    if (leftSymbol === 9) {
      allCrowns.push({ reel: 0, position: 1 }); // Midden positie van linkerrol
      console.log(`👑 Crown found at reel 0, position 1 (winline)`);
    }
    if (middleSymbol === 9) {
      allCrowns.push({ reel: 1, position: 1 }); // Midden positie van middelste rol
      console.log(`👑 Crown found at reel 1, position 1 (winline)`);
    }
    if (rightSymbol === 9) {
      allCrowns.push({ reel: 2, position: 1 }); // Midden positie van rechterrol
      console.log(`👑 Crown found at reel 2, position 1 (winline)`);
    }
    
    console.log("👑 All crowns found:", allCrowns);
    
    // REGEL 1: Als er 2 kronen zijn, hold die reels
    if (allCrowns.length === 2) {
      allCrowns.forEach(crown => {
        newHolds[crown.reel] = true;
      });
      holdMessage = "Twee kronen gevonden - reels vastgehouden!";
      console.log("🎯 Rule 1: Two crowns - holding reels:", newHolds);
    } 
    // REGEL 2: Als er 1 kroon op de linkerrol staat, hold die rol
    else if (allCrowns.length === 1 && allCrowns[0].reel === 0) {
      newHolds[0] = true; // Hold linkerrol
      holdMessage = "Kroon op linkerrol gevonden - reel 1 vastgehouden!";
      console.log("🎯 Rule 2: Single crown on left reel - holding reel 0:", newHolds);
    }
    // REGEL 3: Als er 1 kroon op de middelste rol staat, hold die rol
    else if (allCrowns.length === 1 && allCrowns[0].reel === 1) {
      newHolds[1] = true; // Hold middelste rol
      holdMessage = "Kroon op middelste rol gevonden - reel 2 vastgehouden!";
      console.log("🎯 Rule 3: Single crown on middle reel - holding reel 1:", newHolds);
    }
    // REGEL 4: Als er 1 kroon op de rechterrol staat, NIET vastgehouden
    else if (allCrowns.length === 1 && allCrowns[0].reel === 2) {
      // Geen hold - kroon op rechterrol wordt genegeerd
      holdMessage = "";
    } else {
      // REGULIERE AUTO-HOLD LOGICA - alleen voor midden symbolen
      const leftSymbol = results[0];   // Reel 1 (linker)
      const middleSymbol = results[1]; // Reel 2 (midden)
      const rightSymbol = results[2];  // Reel 3 (rechter)
      
      console.log("🔍 Regular auto-hold check - symbols:", { leftSymbol, middleSymbol, rightSymbol });
      
      // Check alle mogelijke combinaties van 2 van dezelfde
      if (leftSymbol === middleSymbol && leftSymbol !== rightSymbol) {
        // Reel 1 en Reel 2 hetzelfde
        newHolds = [true, true, false];
        holdMessage = `Twee ${SYMBOLS[leftSymbol]?.name || 'symbolen'} gevonden - reels 1 & 2 vastgehouden!`;
        console.log("🎯 Regular: Two same symbols on reels 1&2 - holding:", newHolds);
      } else if (leftSymbol === rightSymbol && leftSymbol !== middleSymbol) {
        // Reel 1 en Reel 3 hetzelfde
        newHolds = [true, false, true];
        holdMessage = `Twee ${SYMBOLS[leftSymbol]?.name || 'symbolen'} gevonden - reels 1 & 3 vastgehouden!`;
        console.log("🎯 Regular: Two same symbols on reels 1&3 - holding:", newHolds);
      } else if (middleSymbol === rightSymbol && middleSymbol !== leftSymbol) {
        // Reel 2 en Reel 3 hetzelfde
        newHolds = [false, true, true];
        holdMessage = `Twee ${SYMBOLS[middleSymbol]?.name || 'symbolen'} gevonden - reels 2 & 3 vastgehouden!`;
        console.log("🎯 Regular: Two same symbols on reels 2&3 - holding:", newHolds);
      }
    }
    
    // Alleen holds toepassen als er een combinatie is gevonden
    if (holdMessage) {
      console.log("✅ Applying holds:", newHolds, "Message:", holdMessage);
      
      // Mark which reels were auto-held and must spin at least once before being held again
      const newAutoHeldReels = [false, false, false];
      const newReelsThatMustSpin = [...gameState.reelsThatMustSpin];
      
      newHolds.forEach((isHeld, index) => {
        if (isHeld) {
          newAutoHeldReels[index] = true;
          newReelsThatMustSpin[index] = true; // This reel must spin at least once
        }
      });
      
      setGameState(prev => ({ 
        ...prev, 
        holds: newHolds,
        autoHeldReels: newAutoHeldReels,
        reelsThatMustSpin: newReelsThatMustSpin
      }));
      // Silent auto-hold - geen popup
    } else {
      console.log("❌ No holds applied - no matching conditions");
    }
  };

  
  const handleHold = (reelIndex: number) => {
    if (gameState.isSpinning) return;
    
    // Check if this reel must spin (was auto-held before)
    if (gameState.reelsThatMustSpin[reelIndex]) {
      // This reel was auto-held and must spin at least once before being held again
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      holds: prev.holds.map((hold, index) => 
        index === reelIndex ? !hold : hold
      )
    }));
  };


  const handleCollect = () => {
    if (gameState.pendingWin > 0) {
      // INNEN: Voeg WIN toe aan PUNTEN en reset WIN naar 0
      const newCredits = gameState.credits + gameState.pendingWin;
      
      setGameState(prev => ({
        ...prev,
        credits: newCredits,
        pendingWin: 0,
        isGambling: false // Reset gamble state when collecting
      }));
      
      syncCreditsToDatabase(newCredits);
      
      // Silent - geen popup
    }
  };

  const handleGamble = (choice: 'HEAD' | 'TAIL') => {
    if (gameState.pendingWin === 0) return;

    // Dynamische kans: hoe hoger de pendingWin, hoe lager de slagingskans
    const getGambleWinProbability = (amount: number): number => {
      if (amount < 10) return 0.4;      // 40%
      if (amount < 20) return 0.35;     // 35%
      if (amount < 40) return 0.3;      // 30%
      if (amount < 80) return 0.25;     // 25%
      if (amount < 120) return 0.2;     // 20%
      return 0.15;                      // 15% bij hoge bedragen richting het plafond
    };

    const winProbability = getGambleWinProbability(gameState.pendingWin);
    const didWin = Math.random() < winProbability;
    const result = didWin ? choice : (choice === 'HEAD' ? 'TAIL' : 'HEAD');
    console.log(`🎲 Gamble: Choice=${choice}, Result=${result}, WinProbability=${winProbability}, Current pendingWin=${gameState.pendingWin}`);
    
    if (choice === result) {
      const doubled = Math.min(gameState.pendingWin * 2, 200);
      setGameState(prev => ({
        ...prev,
        pendingWin: doubled,
        isGambling: doubled < 200 // allow another gamble only if under cap
      }));
      console.log(`🎉 Gamble won! New pendingWin: ${doubled}`);
      if (doubled >= 200) {
        // Auto-collect at cap
        const newCredits = gameState.credits + doubled;
        setGameState(prev => ({ ...prev, credits: newCredits, pendingWin: 0, isGambling: false }));
        syncCreditsToDatabase(newCredits);
        toast({ title: "Maximum bereikt", description: "Gamble uitbetaling is begrensd op 200 credits en is automatisch geïncasseerd.", variant: "default" });
      }
    } else {
      console.log(`💸 Gamble lost! Setting pendingWin to 0`);
      setGameState(prev => ({
        ...prev,
        pendingWin: 0,
        isGambling: false
      }));
    }
  };



  return (
    <div className="h-screen w-full fixed top-0 left-0 bg-gradient-to-br from-red-800 via-red-900 to-red-950 p-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="outline" 
          onClick={() => navigate('/home')}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug
        </Button>
        
      </div>


      {/* Main Game Area */}
      <div className="flex-1 flex flex-col justify-center">
        <Card className="max-w-md mx-auto bg-gradient-to-b from-red-600 to-red-800 border-4 border-yellow-400 shadow-2xl">
          <CardContent className="p-3">
          
          {/* PUNTEN DISPLAY - Punten en Win compact */}
          <div className="grid grid-cols-2 gap-2 mb-1">
            <Card className="bg-black border-yellow-400 border-2 p-2">
              <CardContent className="p-0 text-center">
                <div className="text-red-400 text-xs font-bold mb-1">PUNTEN</div>
                <div className="text-yellow-400 text-xl font-bold">{gameState.credits.toString().padStart(4, '0')}</div>
              </CardContent>
            </Card>

            <Card className="bg-black border-green-400 border-2 p-2">
              <CardContent className="p-0 text-center">
                <div className="text-green-400 text-xs font-bold mb-1">WIN</div>
                <div className="text-green-400 text-xl font-bold">{(gameState.pendingWin || 0).toString().padStart(4, '0')}</div>
              </CardContent>
            </Card>
          </div>

          {/* Game Area */}
          <div className="flex-1 flex flex-col justify-center">
            {/* JELLE WILD LOGO - Compact */}
            <div className="text-center mt-0.5 mb-0.5">
              <img 
                src="/lovable-uploads/49a391a8-79af-4d11-b991-cafe566db161.png" 
                alt="JELLE WILD logo – Simply Wild"
                className="w-full h-auto object-contain mx-auto"
                loading="lazy"
              />
            </div>

          {/* Base Game Area (3 reels) - Ultra compact */}
          <div className="mb-1 bg-red-900/80 p-2 rounded-lg border-4 border-red-600 shadow-2xl">
            <div className="grid grid-cols-3 gap-2 mb-1">
              {[0, 1, 2].map((index) => (
                <div key={index} className="text-center">
                  <div className="relative bg-black rounded-lg border-2 border-gray-600 overflow-hidden opacity-100 shadow-lg shadow-yellow-400/20" style={{ height: '130px' }}>
                    
                    <div 
                      className="absolute inset-0 flex flex-col"
                       style={{
                         transform: gameState.isSpinning 
                           ? 'none'
                           : 'none',
                         transition: gameState.isSpinning 
                           ? 'none' 
                           : `transform ${gameState.reelSpinDurations[index] / 1000}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                       }}
                    >
                      {/* ALTIJD HETZELFDE LAYOUT SYSTEEM - GEEN VERSCHIL TUSSEN SPINNING EN STATIC */}
                      {getVisibleSymbols(BASE_REELS[index], gameState.baseReelPositions[index]).map((symbol, rowIndex) => {
                        const symbolData = SYMBOLS[symbol as keyof typeof SYMBOLS];
                        const isMiddleLine = rowIndex === 1;
                        const isWinningSymbol = gameState.winningSymbols.some(
                          win => win.reel === index && win.position === rowIndex
                        );
                        
                        return (
                          <div
                            key={`unified-${rowIndex}`}
                            className={`
                              flex-shrink-0 h-[43px] w-full flex items-center justify-center text-3xl font-bold
                              border-b border-gray-500/30 relative transition-all duration-200
                              ${isMiddleLine ? 'bg-gradient-to-b from-yellow-100/10 to-yellow-200/10 border-yellow-400/50' : 'bg-black/20'}
                              ${isWinningSymbol && gameState.isShowingWinAnimation ? 'animate-pulse bg-yellow-300/30 border-yellow-400' : ''}
                              ${symbolData?.color || 'text-white'}
                              ${symbolData?.glow || ''}
                            `}
                          >
                            <img src={symbolData?.image} alt={symbolData?.name} className="h-full w-auto" />
                            {isMiddleLine && (
                              <div className="absolute inset-0 border-l-2 border-r-2 border-yellow-400/30 pointer-events-none" />
                            )}
                            {isWinningSymbol && gameState.isShowingWinAnimation && (
                              <div className="absolute inset-0 bg-yellow-400/20 animate-ping rounded" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
                  </div>
                  
                  {/* Hold Button */}
                  <Button
                    onClick={() => handleHold(index)}
                    disabled={gameState.reelsThatMustSpin[index]}
                    className={`
                      mt-2 text-xs h-8 w-full font-bold border-2 transition-all duration-200
                      ${gameState.holds[index] 
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-300 shadow-lg shadow-yellow-500/50' 
                        : gameState.reelsThatMustSpin[index]
                        ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' // Disabled state
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
                      }
                      ${gameState.holdBlinking[index] ? 'animate-pulse bg-yellow-400 text-black' : ''}
                    `}
                  >
                    {`ROL ${['A', 'B', 'C'][index]}`}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-1">
            {/* INNEN - Voeg win toe aan punten */}
            <Button
              onClick={handleCollect}
              disabled={gameState.pendingWin === 0}
              className="
                bg-gradient-to-b from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 
                disabled:from-gray-500 disabled:to-gray-700 disabled:text-gray-300
                text-white font-bold text-xs h-12 border-2 border-yellow-400 shadow-lg
                active:transform active:translate-y-1 active:shadow-md
                transition-all duration-150 disabled:cursor-not-allowed
              "
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
            >
              INNEN
            </Button>

            {/* ROLLEN LOS */}
            <Button
              onClick={() => setGameState(prev => ({ 
                ...prev, 
                holds: [false, false, false],
                // Laat reelsThatMustSpin ongemoeid; die resetten alleen wanneer de reel echt draait
                isGambling: false // Reset gamble state when manually releasing reels
              }))}
              disabled={gameState.holds.every(h => !h)}
              className="
                bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 
                disabled:from-gray-500 disabled:to-gray-700 disabled:text-gray-300
                text-black font-bold text-xs h-12 border-2 border-yellow-400 shadow-lg
                active:transform active:translate-y-1 active:shadow-md
                transition-all duration-150 disabled:cursor-not-allowed
              "
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              ROLLEN<br/>LOS
            </Button>

            {/* START/SPAREN */}
            <Button
              onClick={handleStart}
              disabled={gameState.isSpinning || gameState.credits < 1}
              className="
                bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 
                disabled:from-gray-500 disabled:to-gray-700 disabled:text-gray-300
                text-white font-bold text-sm h-12 border-2 border-green-400 shadow-xl
                active:transform active:translate-y-1 active:shadow-lg
                transition-all duration-150 disabled:cursor-not-allowed
              "
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
            >
              START<br/>SPAREN
            </Button>
          </div>

          {/* Gamble Section - Muntje icoon met kop/munt opties */}
          {gameState.pendingWin > 0 && gameState.isGambling && (
            <div className="flex justify-center items-center space-x-4 mb-2">
              {/* Muntje icoon */}
              <div className="flex items-center justify-center">
                <Coins 
                  size={48} 
                  className="text-yellow-400 animate-pulse" 
                  style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))' }}
                />
              </div>
              
              {/* Kop/Munt knoppen */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleGamble('HEAD')}
                  className="
                    bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 
                    text-white font-bold text-sm px-4 py-2 border-2 border-yellow-400 shadow-lg
                    active:transform active:translate-y-1 active:shadow-md
                    transition-all duration-150
                  "
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                >
                  KOP<br/>({Math.min(gameState.pendingWin * 2, 200)})
                </Button>
                <Button
                  onClick={() => handleGamble('TAIL')}
                  className="
                    bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 
                    text-white font-bold text-sm px-4 py-2 border-2 border-yellow-400 shadow-lg
                    active:transform active:translate-y-1 active:shadow-md
                    transition-all duration-150
                  "
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                >
                  MUNT<br/>({Math.min(gameState.pendingWin * 2, 200)})
                </Button>
              </div>
            </div>
          )}

            {/* No extra bottom content to avoid scroll */}
          </div>
        </CardContent>
      </Card>
    </div>

      {/* No bottom navigation to keep one-screen layout */}
      {showNoCreditsPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div 
            className="bg-black/80 text-white px-4 py-2 rounded-md border border-yellow-400 shadow-xl pointer-events-none"
            role="alert"
          >
            Verdien eerst punten om te kunnen gokken
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplyWild; 