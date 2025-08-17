import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Camera, ArrowLeft, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';
import { supabase } from '@/integrations/supabase/client';
import { StorageSetup } from '@/utils/storageSetup';
import { SessionManager } from '@/utils/sessionManager';
interface Question {
  id: number;
  question: string;
  answers: Array<{
    id: string;
    text: string;
    correct: boolean;
  }>;
  gpsLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  hint: string;
}
const STATE_KEY = 'treasureHuntUIState:v1';

type AnswerStatus = 'correct' | 'incorrect' | null;

interface TreasureUIState {
  currentLocation: number;
  showQuestion: boolean;
  showGPS: boolean;
  showHint: boolean;
  showPhotoUpload: boolean;
  selectedAnswerId: string | null;
  answerStatus: AnswerStatus;
  showSpecialImage: boolean;
}

const TreasureHunt = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [currentLocation, setCurrentLocation] = useState(1);
  const [showQuestion, setShowQuestion] = useState(true);
  const [showGPS, setShowGPS] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const [showInitialFeedback, setShowInitialFeedback] = useState(false);
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [showIntroDialog, setShowIntroDialog] = useState(false);

  // Add photo preview states
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompletingLocation, setIsCompletingLocation] = useState(false);
  const [showSpecialImage, setShowSpecialImage] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Preload the special image for location 3
  useEffect(() => {
    const img = new Image();
    img.src = '/lovable-uploads/df526fc9-00b5-47f5-870a-62e63510f2c5.png';
  }, []);

  // Restore UI state if available; else show intro once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) {
        const s: TreasureUIState = JSON.parse(saved);
        setCurrentLocation(s.currentLocation ?? 1);
        setShowQuestion(!!s.showQuestion);
        setShowGPS(!!s.showGPS);
        setShowHint(!!s.showHint);
        setShowPhotoUpload(!!s.showPhotoUpload);
        setSelectedAnswerId(s.selectedAnswerId ?? null);
        setAnswerStatus(s.answerStatus as AnswerStatus);
        setShowSpecialImage(!!s.showSpecialImage);
        return;
      }
    } catch (e) {
      // ignore parse errors
    }
    const hasSeenTreasureIntro = localStorage.getItem('hasSeenTreasureIntro');
    if (!hasSeenTreasureIntro) {
      setShowIntroDialog(true);
      localStorage.setItem('hasSeenTreasureIntro', 'true');
    }
  }, []);

  // Persist state on every relevant change and before backgrounding
  useEffect(() => {
    const state: TreasureUIState = {
      currentLocation,
      showQuestion,
      showGPS,
      showHint,
      showPhotoUpload,
      selectedAnswerId,
      answerStatus,
      showSpecialImage
    };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  }, [currentLocation, showQuestion, showGPS, showHint, showPhotoUpload, selectedAnswerId, answerStatus, showSpecialImage]);

  useEffect(() => {
    const save = () => {
      const state: TreasureUIState = {
        currentLocation,
        showQuestion,
        showGPS,
        showHint,
        showPhotoUpload,
        selectedAnswerId,
        answerStatus,
        showSpecialImage
      };
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
      } catch {}
    };
    const onVisibilityChange = () => { if (document.hidden) save(); };
    const onPageHide = () => save();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [currentLocation, showQuestion, showGPS, showHint, showPhotoUpload, selectedAnswerId, answerStatus, showSpecialImage]);
  const questions: Question[] = [{
    id: 1,
    question: "Klaar om te beginnen! Je bent net ingecheckt maar hoeveel kamers heeft ons hotel eigenlijk? Meer of minder dan 150?",
    answers: [{
      id: 'A',
      text: 'Meer',
      correct: true
    }, {
      id: 'B',
      text: 'Minder',
      correct: false
    }],
    gpsLocation: {
      lat: 52.272695,
      lng: 8.049242,
      name: 'Neumarkt 2, 49074 Osnabrück, Duitsland'
    },
    hint: "Bij een goed antwoord had je de **sleutel** naar de locatie gekregen, kan je het nu alsnog vinden?"
  }, {
    id: 2,
    question: "Zo, in het hart van Osnabrück, welkom! Wie heeft eigenlijk meer inwoners?",
    answers: [{
      id: 'A',
      text: 'Landgraaf + Leeuwarden',
      correct: false
    }, {
      id: 'B',
      text: 'Osnabrück',
      correct: true
    }],
    gpsLocation: {
      lat: 52.277593,
      lng: 8.041721,
      name: 'Historisches Rathaus Osnabrück, Markt 30, 49074 Osnabrück, Duitsland'
    },
    hint: "In Rome staat een iets bekendere variant, maar deze is ook niet mis!"
  }, {
    id: 3,
    question: "Die hersens zijn genoeg gekraakt, het wordt tijd om de laatste mannen te vinden. Een makkelijke vraag dit keer: wat is, mede door zijn supporters maar ook door de stad waavoor hij uitkomt verreweg de allermooiste club van de hele wereld?",
    answers: [{
      id: 'A',
      text: 'SC Cambuur Leeuwarden',
      correct: true
    }],
    gpsLocation: {
      lat: 52.27854331141567,
      lng: 8.043443730162643,
      name: 'Rampendahl Brewery'
    },
    hint: ""
  }];
  const handleAnswer = (answerId: string) => {
    const currentQuestion = questions[currentLocation - 1];
    const selectedAnswer = currentQuestion.answers.find(a => a.id === answerId);
    const isCorrect = selectedAnswer?.correct;

    // Set the selected answer and its status for visual feedback
    setSelectedAnswerId(answerId);
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');

    // Show feedback popup first
    let message = '';
    if (currentLocation === 1) {
      message = isCorrect ? "Goed! Het zijn er 158!" : "Fout! Het zijn er 158!";
    } else if (currentLocation === 2) {
      message = isCorrect ? "Goed! Osnabrück heeft 1.333 inwoners meer!" : "Fout! Osnabrück heeft 1.333 inwoners meer!";
    }
    
    if (message) {
      setFeedbackMessage(message);
      setShowFeedbackPopup(true);
      
      // Hide popup after 3 seconds and proceed with normal flow
      setTimeout(() => {
        setShowFeedbackPopup(false);
        proceedAfterFeedback(isCorrect);
      }, 3000);
    } else {
      // For location 3, proceed immediately without popup
      setTimeout(() => {
        proceedAfterFeedback(isCorrect);
      }, 1000);
    }
  };

  const proceedAfterFeedback = (isCorrect: boolean) => {
    // Hide the question
    setShowQuestion(false);

    // Reset answer feedback
    setSelectedAnswerId(null);
    setAnswerStatus(null);
    
    if (isCorrect) {
      if (currentLocation === 3) {
        // Show special image for location 3 for 3s, then show GPS
        setShowSpecialImage(true);
        setTimeout(() => {
          setShowSpecialImage(false);
          setShowGPS(true);
        }, 3000);
      } else {
        // Show GPS location directly
        setShowGPS(true);
      }
    } else {
      // Show hint directly
      setShowHint(true);
    }
  };
  const openMapsApp = (location: {
    lat: number;
    lng: number;
    name: string;
  }) => {
    // Persist UI state right before opening Maps, to ensure perfect restore on return
    try {
      const state: TreasureUIState = {
        currentLocation,
        showQuestion,
        showGPS,
        showHint,
        showPhotoUpload,
        selectedAnswerId,
        answerStatus,
        showSpecialImage
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
    const label = encodeURIComponent(location.name);
    const mapsWeb = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
    const geoUrl = `geo:${location.lat},${location.lng}?q=${location.lat},${location.lng}(${label})`;
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      // Use geo: intent on Android to open native Maps app
      window.location.href = geoUrl;
    } else {
      // Fallback to web maps in a new tab
      window.open(mapsWeb, '_blank', 'noopener,noreferrer');
    }
  };
  const handleLocationFound = () => {
    // Now require photo before proceeding
    setShowPhotoUpload(true);
    try {
      const state: TreasureUIState = {
        currentLocation,
        showQuestion,
        showGPS,
        showHint,
        showPhotoUpload: true,
        selectedAnswerId,
        answerStatus,
        showSpecialImage
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {}
  };
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setPhotoPreview(null);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error creating photo preview:', error);
      toast({
        title: "Fout bij foto preview",
        description: "Er ging iets mis bij het maken van de foto preview.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Clear photo preview and allow new photo selection
  const handleClearPhoto = () => {
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById('treasure-photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Upload photo and complete location
  const handleCompleteWithPhoto = async () => {
    if (!photoPreview) return;
    setIsCompletingLocation(true);
    try {
      // Get the file input to access the original file
      const fileInput = document.getElementById('treasure-photo-input') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (file) {
        // Ensure storage buckets exist
        const storageReady = await StorageSetup.initializeStorage();
        if (storageReady) {
          // Upload to Supabase Storage
          const fileName = `treasure-${currentLocation}-${Date.now()}.jpg`;
          const {
            data,
            error
          } = await supabase.storage.from('bingo-photos').upload(fileName, file);
          if (error) {
            console.error('Upload error:', error);
            throw error;
          }

          // Get public URL
          const {
            data: {
              publicUrl
            }
          } = supabase.storage.from('bingo-photos').getPublicUrl(fileName);

          // Complete the location with photo proof
          completeLocationWithPhoto(publicUrl);
        } else {
          // Fallback to base64 if storage setup fails

          completeLocationWithPhoto(photoPreview);
        }
      } else {
        // Use base64 preview as fallback
        completeLocationWithPhoto(photoPreview);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Fout bij foto upload",
        description: "Er ging iets mis bij het uploaden van de foto.",
        variant: "destructive"
      });
    } finally {
      setIsCompletingLocation(false);
    }
  };
  const completeLocationWithPhoto = async (photoUrl: string) => {
    setShowPhotoUpload(false);
    setPhotoPreview(null);
    try {
      // Save photo URL to database for this treasure hunt location
      const sessionId = SessionManager.getSessionId();
      const treasureHuntId = 237 + (currentLocation - 1); // Maps to IDs 237, 238, 239

      // Set session context for RLS security
      await supabase.rpc('set_session_context', {
        session_id: sessionId
      });
      const {
        error
      } = await supabase.from('treasure_hunt').update({
        photo_url: photoUrl,
        found_at: new Date().toISOString()
      }).eq('id', treasureHuntId);
      if (error) {
        console.error('Error saving treasure hunt photo to database:', error);
        toast({
          title: "Foto opgeslagen lokaal",
          description: "Foto kon niet worden opgeslagen in database, maar is wel geüpload.",
          variant: "destructive"
        });
      } else {}
    } catch (error) {
      console.error('Error updating treasure hunt database:', error);
    }
    if (currentLocation < 3) {
      // Go to next location
      setCurrentLocation(currentLocation + 1);
      setShowQuestion(true);
      setShowGPS(false);
      setShowHint(false);
    } else {
      // All locations completed
      localStorage.setItem('treasureHuntCompleted', 'true');

      // Navigate back to main hub
      navigate('/home');
    }
  };
  return <div className="h-screen w-full fixed top-0 left-0 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden overscroll-none" style={{
    backgroundImage: "url('/lovable-uploads/ca086661-f32b-48ee-a8d7-c1e8dd49a3b4.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center'
    // Avoid fixed attachment to prevent iOS scroll issues
  }}>
      <div className="fixed inset-0 bg-white/60 z-0"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 overflow-hidden">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-4">
              <img src="/lovable-uploads/7027bc15-b1c6-4496-bce1-136b2e4aa945.png" alt="Hidden Friends Logo" className="w-48 h-48 mx-auto object-contain rounded-xl" />
            </div>
          </div>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-party mb-4 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <MapPin className="w-6 h-6 text-primary mr-2" />
                Locatie {currentLocation}/3
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Section */}
              {showQuestion && <div className="question-container">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 mb-4">
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-4 leading-tight">
                      {questions[currentLocation - 1].question}
                    </h3>
                    <div className="answers space-y-3">
                      {questions[currentLocation - 1].answers.map(answer => {
                    const isSelected = selectedAnswerId === answer.id;
                    const isCorrect = answer.correct;
                    let buttonClass = "w-full p-4 sm:p-4 text-left justify-start h-auto min-h-[60px] text-sm sm:text-sm flex items-start";
                    if (isSelected && answerStatus === 'correct') {
                      buttonClass += " bg-green-500 text-white border-green-600 hover:bg-green-500";
                    } else if (isSelected && answerStatus === 'incorrect') {
                      buttonClass += " bg-red-500 text-white border-red-600 hover:bg-red-500";
                    }
                     return <Button key={answer.id} onClick={() => handleAnswer(answer.id)} variant="outline" className={buttonClass} disabled={selectedAnswerId !== null}
                    >
                            <span className="font-bold mr-3 flex-shrink-0 mt-0.5">{answer.id}:</span>
                            <span className="break-words leading-relaxed flex-1">{answer.text}</span>
                          </Button>;
                  })}
                    </div>
                  </div>
                </div>}



              {/* Special Image for Location 3 */}
              {showSpecialImage && <div className="text-center">
                  <img src="/lovable-uploads/df526fc9-00b5-47f5-870a-62e63510f2c5.png" alt="SC Cambuur juichmoment - Treasure Hunt correct antwoord" className="w-full max-h-60 object-cover rounded-lg shadow-party" loading="eager" />
                </div>}
              {/* GPS Section - Correct Answer */}
              {showGPS && <div className="gps-container">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-4 mb-4">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-3">🗺️</div>
                      
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
                      <p className="text-sm font-medium text-gray-600 mb-2">📍 Locatie:</p>
                      <p className="text-base font-semibold text-gray-800 break-words">
                        {questions[currentLocation - 1].gpsLocation.name}
                      </p>
                    </div>
                    
                    <Button onClick={() => openMapsApp(questions[currentLocation - 1].gpsLocation)} variant="default" className="w-full mb-3 bg-green-600 hover:bg-green-700 text-white">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      Open in Maps
                    </Button>
                  </div>

                  <Button onClick={handleLocationFound} variant="default" size="lg" className="w-full bg-primary hover:bg-primary/90">
                    <Camera className="w-5 h-5 mr-2" />
                    Ik heb ze gevonden!
                  </Button>
                </div>}

              {/* Hint Section - Wrong Answer */}
              {showHint && <div className="hint-container">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-300 rounded-lg p-4 mb-4">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-3">💡</div>
                      <h3 className="text-xl font-bold text-orange-800 mb-4">
                        Aanwijzing
                      </h3>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 mb-3 border border-orange-200">
                      {currentLocation === 1 ? (
                        <div className="flex justify-center">
                          <img 
                            src="/lovable-uploads/4cae04db-70e0-40c7-b6e0-e7d32d5ad6a7.png" 
                            alt="Tip 1" 
                            className="w-full max-w-sm h-auto object-contain rounded-lg"
                          />
                        </div>
                      ) : currentLocation === 2 ? (
                        <div className="flex justify-center">
                          <img 
                            src="/lovable-uploads/19cbe0eb-8e6f-4561-87ff-cfb0b5f2c2f7.png" 
                            alt="Tip 2" 
                            className="w-full max-w-md h-auto object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <p className="text-base leading-relaxed text-gray-800">
                          {questions[currentLocation - 1].hint}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleLocationFound} variant="default" size="lg" className="w-full bg-primary hover:bg-primary/90">
                    <Camera className="w-5 h-5 mr-2" />
                    Ik heb ze gevonden!
                  </Button>
                </div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intro Dialog */}
      <Dialog open={showIntroDialog} onOpenChange={setShowIntroDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="text-center mb-4">
              <img src="/lovable-uploads/7027bc15-b1c6-4496-bce1-136b2e4aa945.png" alt="Hidden Friends Logo" className="w-24 h-24 sm:w-32 sm:h-32 mx-auto object-contain rounded-xl mb-4" />
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">
                <strong>De rollen zijn omgedraaid:</strong> Vroeger bedacht je zelf de aanwijzingen, nu moet je zoeken!
              </p>
              
              <div className="space-y-2">
                <p className="text-sm"><strong>📍 Hoe werkt het?</strong></p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Je vrienden zijn verdeeld over 3 locaties</li>
                  <li>• Per locatie krijg je een quizvraag</li>
                  <li>• Goed antwoord = GPS locatie via Maps</li>
                  <li>• Fout antwoord = alleen een aanwijzing</li>
                </ul>
              </div>

              <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800">
                  💡 Houd het tempo erin, alleen is ook maar alleen! En vergeet niet: maak een mooie groepsselfie als je de locatie gevonden hebt!
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Dialog - Now mandatory for treasure hunt */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">📸 FOTO!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <p className="text-center text-warning-foreground font-medium">
                ⚠️ Je moet een foto maken om te bewijzen dat je op deze locatie bent!
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" id="treasure-photo-input" disabled={isUploading} />
              
              {/* Photo Preview */}
              {photoPreview && <div className="w-full max-w-xs">
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-primary/30" />
                    <Button onClick={handleClearPhoto} variant="destructive" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">Voorvertoning van je foto</p>
                </div>}
              
              {/* Photo Upload Area */}
              {!photoPreview && <label htmlFor="treasure-photo-input" className={`flex items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-lg cursor-pointer hover:border-primary transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="text-center">
                    {isUploading ? <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" /> : <Camera className="w-8 h-8 text-primary mx-auto mb-2" />}
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? 'Foto wordt geladen...' : 'Klik om foto te selecteren'}
                    </p>
                  </div>
                </label>}
              
              {/* Action Buttons */}
              {photoPreview ? <div className="flex gap-3 w-full">
                  <Button onClick={handleClearPhoto} variant="outline" className="flex-1" disabled={isCompletingLocation}>
                    Nieuwe Foto
                  </Button>
                  <Button onClick={handleCompleteWithPhoto} variant="default" className="flex-1" disabled={isCompletingLocation}>
                    {isCompletingLocation ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Afronden...
                      </> : 'Afronden'}
                  </Button>
                </div> : <p className="text-xs text-center text-muted-foreground">
                  Je kunt niet verder zonder bewijs foto van de locatie.
                </p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Popup Dialog */}
      <Dialog open={showFeedbackPopup} onOpenChange={setShowFeedbackPopup}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <p className="text-lg font-semibold text-foreground">
              {feedbackMessage}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default TreasureHunt;