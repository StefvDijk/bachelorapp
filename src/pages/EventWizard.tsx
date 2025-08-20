import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, User, Palette, Settings, Eye, Save, Wand2, 
  Grid3X3, MapPin, Camera, ShoppingCart, Dice1, Users,
  Plus, ArrowRight, ArrowLeft, Check, Sparkles, Crown,
  Music, Heart, Trophy, Gamepad2, Beer, Target, Star,
  MessageCircle, Clock, Zap, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EventData {
  name: string;
  slug: string;
  event_date: string;
  description: string;
  city: string;
  guest_count: string;
  features: Record<string, { enabled: boolean; config: any }>;
  branding: {
    primary_color: string;
    logo_url?: string;
    background_image?: string;
  };
  template_id?: string;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic',
    title: 'Event Basics',
    description: 'Naam, datum en locatie van je event',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    id: 'features',
    title: 'Spellen & Features',
    description: 'Kies welke games en functies je wilt',
    icon: <Gamepad2 className="w-5 h-5" />
  },
  {
    id: 'template',
    title: 'Template & Inhoud',
    description: 'Selecteer een template en pas content aan',
    icon: <Wand2 className="w-5 h-5" />
  },
  {
    id: 'branding',
    title: 'Branding & Styling',
    description: 'Kleuren, logo en persoonlijke touch',
    icon: <Palette className="w-5 h-5" />
  },
  {
    id: 'review',
    title: 'Review & Launch',
    description: 'Controleer alles en ga live!',
    icon: <Eye className="w-5 h-5" />
  }
];

const FEATURE_CATEGORIES = {
  CORE: {
    title: '🎯 Core Features',
    description: 'Altijd inbegrepen',
    features: {
      CORE_Bingo: { name: 'Bingo 5×5 Grid', description: 'Klassiek 25-opdrachten bingo spel', icon: <Grid3X3 className="w-4 h-4" /> },
      CORE_TreasureHunt: { name: 'Treasure Hunt', description: 'Zoek vrienden op verschillende locaties', icon: <MapPin className="w-4 h-4" /> },
      CORE_PhotoWall: { name: 'Photo Wall', description: 'Live foto feed van alle deelnemers', icon: <Camera className="w-4 h-4" /> },
      CORE_SpectatorView: { name: 'Spectator View', description: 'Live kijken voor vrienden thuis', icon: <Eye className="w-4 h-4" /> },
      CORE_DealShop: { name: 'Deal Makers Shop', description: 'Koop voordelen met punten', icon: <ShoppingCart className="w-4 h-4" /> },
      CORE_SimplyWild: { name: 'Simply Wild', description: 'Gokspel om punten te vermeerderen', icon: <Dice1 className="w-4 h-4" /> }
    }
  },
  SOCIAL: {
    title: '👥 Social Features',
    description: 'Teamwork en interactie',
    features: {
      SOCIAL_TeamBattle: { name: 'Team Battle Mode', description: 'Verdeel in teams die tegen elkaar spelen', icon: <Users className="w-4 h-4" /> },
      SOCIAL_GroupChat: { name: 'Group Chat', description: 'Live chat tijdens het event', icon: <MessageCircle className="w-4 h-4" /> },
      SOCIAL_BachelorRoast: { name: 'Bachelor Roast', description: 'Grappige verhalen over de bachelor', icon: <Crown className="w-4 h-4" /> },
      SOCIAL_MemoryLane: { name: 'Memory Lane', description: 'Deel oude foto\'s en herinneringen', icon: <Heart className="w-4 h-4" /> }
    }
  },
  DRINKING: {
    title: '🍻 Drinking Games',
    description: 'Voor de echte feestgangers',
    features: {
      DRINKING_BeerPong: { name: 'Beer Pong Tournament', description: 'Georganiseerde beer pong competitie', icon: <Beer className="w-4 h-4" /> },
      DRINKING_ShotRoulette: { name: 'Shot Roulette', description: 'Draai het wiel, drink de shot', icon: <Target className="w-4 h-4" /> },
      DRINKING_NeverHaveIEver: { name: 'Never Have I Ever', description: 'Digitale versie van het klassieke spel', icon: <Star className="w-4 h-4" /> },
      DRINKING_TruthOrDare: { name: 'Truth or Dare', description: 'Waarheid of durf opdrachten', icon: <Zap className="w-4 h-4" /> }
    }
  },
  COMPETITION: {
    title: '🏆 Competition',
    description: 'Leaderboards en achievements',
    features: {
      COMP_Leaderboard: { name: 'Real-time Leaderboard', description: 'Live rankings van alle spelers', icon: <Trophy className="w-4 h-4" /> },
      COMP_Achievements: { name: 'Achievement Badges', description: 'Unlock badges voor prestaties', icon: <Star className="w-4 h-4" /> },
      COMP_MVPVoting: { name: 'MVP Voting', description: 'Stem op de beste speler', icon: <Crown className="w-4 h-4" /> }
    }
  },
  MEDIA: {
    title: '📱 Media Features',
    description: 'Content en entertainment',
    features: {
      MEDIA_StoryMode: { name: 'Story Mode', description: 'Instagram-style verhalen', icon: <Camera className="w-4 h-4" /> },
      MEDIA_MemeGenerator: { name: 'Meme Generator', description: 'Maak memes van foto\'s', icon: <Sparkles className="w-4 h-4" /> },
      MEDIA_PlaylistControl: { name: 'Playlist Control', description: 'Collaborative Spotify playlist', icon: <Music className="w-4 h-4" /> }
    }
  }
};

const TEMPLATES = [
  {
    id: 'leeuwarden',
    name: '🏛️ Leeuwarden Special',
    description: 'Perfect voor een avond in de Friese hoofdstad',
    preview: 'Lokale hotspots, Friese uitdagingen, stadsgericht'
  },
  {
    id: 'wild-west',
    name: '🤠 Wild West Bachelor',
    description: 'Cowboy thema met saloon uitdagingen',
    preview: 'Western opdrachten, sheriff badges, rodeo challenges'
  },
  {
    id: 'superhero',
    name: '🦸 Superhero Squad',
    description: 'Red de bachelor zoals een echte held',
    preview: 'Hero missies, superkrachten, villain challenges'
  },
  {
    id: 'classic',
    name: '🎉 Classic Bachelor',
    description: 'Traditionele vrijgezellenfeest opdrachten',
    preview: 'Klassieke uitdagingen, bewezen concept, tijdloos'
  }
];

const COLOR_THEMES = [
  { name: 'Purple & Gold', primary: '#8b5cf6', secondary: '#ffd700' },
  { name: 'Blue & Orange', primary: '#3b82f6', secondary: '#f97316' },
  { name: 'Red & Black', primary: '#ef4444', secondary: '#1f2937' },
  { name: 'Green & Yellow', primary: '#10b981', secondary: '#f59e0b' },
  { name: 'Pink & Purple', primary: '#ec4899', secondary: '#8b5cf6' }
];

const EventWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState<EventData>({
    name: '',
    slug: '',
    event_date: '',
    description: '',
    city: '',
    guest_count: '',
    features: {
      // CORE Features (always enabled)
      CORE_Bingo: { enabled: true, config: {} },
      CORE_TreasureHunt: { enabled: true, config: {} },
      CORE_PhotoWall: { enabled: true, config: {} },
      CORE_SpectatorView: { enabled: true, config: {} },
      CORE_DealShop: { enabled: false, config: {} },
      CORE_SimplyWild: { enabled: false, config: {} },
      // Other features (disabled by default)
      SOCIAL_TeamBattle: { enabled: false, config: {} },
      SOCIAL_GroupChat: { enabled: false, config: {} },
      SOCIAL_BachelorRoast: { enabled: false, config: {} },
      SOCIAL_MemoryLane: { enabled: false, config: {} },
      DRINKING_BeerPong: { enabled: false, config: {} },
      DRINKING_ShotRoulette: { enabled: false, config: {} },
      DRINKING_NeverHaveIEver: { enabled: false, config: {} },
      DRINKING_TruthOrDare: { enabled: false, config: {} },
      COMP_Leaderboard: { enabled: false, config: {} },
      COMP_Achievements: { enabled: false, config: {} },
      COMP_MVPVoting: { enabled: false, config: {} },
      MEDIA_StoryMode: { enabled: false, config: {} },
      MEDIA_MemeGenerator: { enabled: false, config: {} },
      MEDIA_PlaylistControl: { enabled: false, config: {} }
    },
    branding: {
      primary_color: '#8b5cf6'
    }
  });

  // Generate slug from name
  useEffect(() => {
    if (eventData.name) {
      const slug = eventData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setEventData(prev => ({ ...prev, slug }));
    }
  }, [eventData.name]);

  const currentStep = WIZARD_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  const nextStep = () => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep.id) {
      case 'basic':
        return eventData.name.trim() && eventData.event_date && eventData.city.trim();
      case 'features':
        return true; // Always can proceed
      case 'template':
        return eventData.template_id;
      case 'branding':
        return true; // Always can proceed
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const toggleFeature = (featureKey: string) => {
    // Don't allow disabling core features except DealShop and SimplyWild
    if (featureKey.startsWith('CORE_') && !['CORE_DealShop', 'CORE_SimplyWild'].includes(featureKey)) {
      return;
    }

    setEventData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: {
          ...prev.features[featureKey],
          enabled: !prev.features[featureKey].enabled
        }
      }
    }));
  };

  const selectTemplate = (templateId: string) => {
    setEventData(prev => ({ ...prev, template_id: templateId }));
  };

  const selectColorTheme = (theme: { primary: string; secondary: string }) => {
    setEventData(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        primary_color: theme.primary
      }
    }));
  };

  const createEvent = async () => {
    setIsLoading(true);
    try {
      // Create event in database
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          name: eventData.name,
          slug: eventData.slug,
          event_date: eventData.event_date,
          is_public: true,
          features: eventData.features,
          theme: eventData.branding,
          billing_status: 'trial' // Start as trial
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Load and apply template (simplified for now)
      if (eventData.template_id) {
        const templateResponse = await fetch(`/templates/default-template.json`);
        const templateData = await templateResponse.json();
        
        // Store template
        await supabase
          .from('event_templates')
          .insert({
            event_id: event.id,
            name: TEMPLATES.find(t => t.id === eventData.template_id)?.name || 'Default',
            data: templateData,
            is_published: true
          });
      }

      toast({
        title: "🎉 Event aangemaakt!",
        description: `${eventData.name} is succesvol aangemaakt en klaar voor gebruik!`,
      });

      // Navigate to event preview/admin
      navigate(`/event-preview/${eventData.slug}`);

    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Fout bij aanmaken",
        description: "Er ging iets mis bij het aanmaken van je event. Probeer het opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Basics</h2>
              <p className="text-gray-600">Vertel ons over je vrijgezellenfeest</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Event Naam *</Label>
                <Input
                  id="name"
                  value={eventData.name}
                  onChange={(e) => setEventData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="bijv. Jelle's Bachelor Party"
                  className="mt-1"
                />
                {eventData.slug && (
                  <p className="text-sm text-gray-500 mt-1">
                    URL: <code>/{eventData.slug}</code>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Event Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventData.event_date}
                    onChange={(e) => setEventData(prev => ({ ...prev, event_date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Stad/Locatie *</Label>
                  <Input
                    id="city"
                    value={eventData.city}
                    onChange={(e) => setEventData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="bijv. Leeuwarden"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="guests">Aantal Gasten</Label>
                <Input
                  id="guests"
                  value={eventData.guest_count}
                  onChange={(e) => setEventData(prev => ({ ...prev, guest_count: e.target.value }))}
                  placeholder="bijv. 12-15 personen"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={eventData.description}
                  onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Vertel kort over het event..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Spellen & Features</h2>
              <p className="text-gray-600">Kies welke games en functies je wilt inschakelen</p>
            </div>

            <div className="space-y-6">
              {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
                <Card key={categoryKey}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {Object.entries(category.features).map(([featureKey, feature]) => {
                        const isEnabled = eventData.features[featureKey]?.enabled;
                        const isCoreRequired = featureKey.startsWith('CORE_') && !['CORE_DealShop', 'CORE_SimplyWild'].includes(featureKey);
                        
                        return (
                          <div key={featureKey} className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50/50">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="text-gray-600">
                                {feature.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{feature.name}</h4>
                                  {isCoreRequired && (
                                    <Badge variant="secondary" className="text-xs">Altijd aan</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => toggleFeature(featureKey)}
                              disabled={isCoreRequired}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Selectie</h2>
              <p className="text-gray-600">Kies een template die past bij je event</p>
            </div>

            <div className="grid gap-4">
              {TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    eventData.template_id === template.id 
                      ? 'ring-2 ring-primary border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => selectTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                        <p className="text-xs text-gray-500">{template.preview}</p>
                      </div>
                      {eventData.template_id === template.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Branding & Styling</h2>
              <p className="text-gray-600">Geef je event een persoonlijke uitstraling</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Kleurenschema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLOR_THEMES.map((theme, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer p-3 rounded-lg border transition-all ${
                        eventData.branding.primary_color === theme.primary
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => selectColorTheme(theme)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.secondary }}
                          />
                        </div>
                        <span className="font-medium text-sm">{theme.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo Upload</CardTitle>
                <p className="text-sm text-gray-600">Upload een logo voor je event (optioneel)</p>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Sleep een bestand hierheen of klik om te uploaden</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG tot 2MB</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'review':
        const enabledFeatures = Object.entries(eventData.features)
          .filter(([_, feature]) => feature.enabled)
          .map(([key, _]) => {
            // Find feature name from categories
            for (const category of Object.values(FEATURE_CATEGORIES)) {
              if (category.features[key]) {
                return category.features[key].name;
              }
            }
            return key;
          });

        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Launch</h2>
              <p className="text-gray-600">Controleer je instellingen en ga live!</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Event Overzicht
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Event Naam</Label>
                    <p className="font-semibold">{eventData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Datum</Label>
                    <p className="font-semibold">{eventData.event_date}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Locatie</Label>
                    <p className="font-semibold">{eventData.city}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Gasten</Label>
                    <p className="font-semibold">{eventData.guest_count || 'Niet opgegeven'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-gray-600">Actieve Features ({enabledFeatures.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {enabledFeatures.map((featureName, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {featureName}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-gray-600">Template</Label>
                  <p className="font-semibold">
                    {TEMPLATES.find(t => t.id === eventData.template_id)?.name || 'Geen template geselecteerd'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Kleurenschema</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: eventData.branding.primary_color }}
                    />
                    <span className="text-sm">{eventData.branding.primary_color}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Klaar om te lanceren!</h4>
                    <p className="text-sm text-green-700">
                      Je event wordt aangemaakt met een 24-uur trial periode. 
                      Upgrade later naar een betaald plan voor volledige toegang.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Event Creation Wizard</h1>
              <p className="text-sm text-gray-600">
                Stap {currentStepIndex + 1} van {WIZARD_STEPS.length}: {currentStep.title}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/')}>
              Annuleren
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index === currentStepIndex ? 'text-primary' : 
                  index < currentStepIndex ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index === currentStepIndex ? 'bg-primary text-white' :
                    index < currentStepIndex ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {index < currentStepIndex ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vorige</span>
          </Button>

          <div className="flex space-x-3">
            {currentStepIndex === WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={createEvent}
                disabled={!canProceed() || isLoading}
                className="flex items-center space-x-2"
                size="lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isLoading ? 'Event wordt aangemaakt...' : 'Event Aanmaken & Lanceren'}</span>
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center space-x-2"
              >
                <span>Volgende</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventWizard;
