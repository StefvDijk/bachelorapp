import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Eye, Edit, Share, Settings, Users, Calendar, MapPin, 
  Sparkles, ExternalLink, Copy, CheckCircle, Crown,
  Gamepad2, Camera, Trophy, MessageCircle, Music
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  is_public: boolean;
  features: Record<string, { enabled: boolean; config: any }>;
  theme: any;
  billing_status: string;
  created_at: string;
}

const EventPreview = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: "Event niet gevonden",
        description: "Het opgevraagde event bestaat niet of is niet toegankelijk.",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Gekopieerd!",
        description: `${type} link is gekopieerd naar je klembord.`,
      });
    } catch (error) {
      toast({
        title: "Kopiëren mislukt",
        description: "Kon de link niet kopiëren. Selecteer en kopieer handmatig.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Event wordt geladen...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event niet gevonden</h2>
          <p className="text-gray-600 mb-4">Het opgevraagde event bestaat niet.</p>
          <Button onClick={() => navigate('/')}>Terug naar home</Button>
        </div>
      </div>
    );
  }

  const enabledFeatures = Object.entries(event.features)
    .filter(([_, feature]) => feature.enabled)
    .length;

  const playerUrl = `${window.location.origin}/${event.slug}`;
  const spectatorUrl = `${window.location.origin}/spectator/${event.slug}`;
  const adminUrl = `${window.location.origin}/admin/${event.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                {event.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Event succesvol aangemaakt! Hier zijn je links en instellingen.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => navigate('/create-event')}>
                Nieuw Event
              </Button>
              <Button onClick={() => navigate(`/admin/${event.slug}`)}>
                <Settings className="w-4 h-4 mr-2" />
                Beheren
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Event Status */}
        <Card className={event.billing_status === 'trial' ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {event.billing_status === 'trial' ? (
                  <Crown className="w-5 h-5 text-orange-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                <div>
                  <h3 className={`font-semibold ${event.billing_status === 'trial' ? 'text-orange-900' : 'text-green-900'}`}>
                    {event.billing_status === 'trial' ? 'Trial Periode' : 'Betaald Plan'}
                  </h3>
                  <p className={`text-sm ${event.billing_status === 'trial' ? 'text-orange-700' : 'text-green-700'}`}>
                    {event.billing_status === 'trial' 
                      ? '24 uur gratis toegang, daarna upgrade vereist'
                      : 'Volledige toegang tot alle features'
                    }
                  </p>
                </div>
              </div>
              {event.billing_status === 'trial' && (
                <Button variant="default">
                  Upgrade naar Pro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">Datum</p>
                  <p className="text-sm text-gray-600">{event.event_date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Gamepad2 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">Actieve Features</p>
                  <p className="text-sm text-gray-600">{enabledFeatures} features ingeschakeld</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Eye className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">Status</p>
                  <Badge variant={event.is_public ? "default" : "secondary"}>
                    {event.is_public ? 'Publiek' : 'Privé'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Toegang Links</CardTitle>
              <p className="text-sm text-gray-600">Deel deze links met je deelnemers</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Speler App</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded">{playerUrl}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(playerUrl, 'Speler')}
                  >
                    {copied === 'Speler' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Spectator View</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded">{spectatorUrl}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(spectatorUrl, 'Spectator')}
                  >
                    {copied === 'Spectator' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Admin Dashboard</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded">{adminUrl}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(adminUrl, 'Admin')}
                  >
                    {copied === 'Admin' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Eye className="w-5 h-5" />
                <span className="text-sm">Preview Spel</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Edit className="w-5 h-5" />
                <span className="text-sm">Bewerk Content</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Share className="w-5 h-5" />
                <span className="text-sm">Deel Event</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Settings className="w-5 h-5" />
                <span className="text-sm">Instellingen</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Volgende Stappen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <p className="font-medium">Test je event</p>
                  <p className="text-sm text-gray-600">Open de speler app en probeer een paar opdrachten uit</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <p className="font-medium">Pas content aan</p>
                  <p className="text-sm text-gray-600">Bewerk bingo opdrachten en treasure hunt locaties</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <p className="font-medium">Deel met deelnemers</p>
                  <p className="text-sm text-gray-600">Stuur de speler link naar je vrienden</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventPreview;
