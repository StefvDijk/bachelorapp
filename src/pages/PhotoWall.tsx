import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Grid3X3, ArrowLeft, Bell, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import NavigationBar from '@/components/NavigationBar';

interface JellePhoto {
  id: number;
  photo_url: string;
  uploaded_at: string;
  source_type: 'treasure_hunt' | 'bingo' | 'challenge';
  source_id: number;
  caption: string; // Add caption for display
}

const PhotoWall = () => {
  const navigate = useNavigate();
  const [jellePhotos, setJellePhotos] = useState<JellePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<JellePhoto | null>(null);

  useEffect(() => {
    loadJellePhotos();
    
    // Set up real-time subscriptions
    const bingoSubscription = supabase
      .channel('bingo-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bingo_tasks' },
        () => {
          loadJellePhotos();
        }
      )
      .subscribe();

    const treasureHuntSubscription = supabase
      .channel('treasure-hunt-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'treasure_hunt' },
        () => {
          loadJellePhotos();
        }
      )
      .subscribe();

    return () => {
      bingoSubscription.unsubscribe();
      treasureHuntSubscription.unsubscribe();
    };
  }, []);

  const loadJellePhotos = async () => {
    try {
      setIsLoading(true);
      
      // Load bingo photos with task titles - from current session only
      const { data: bingoData } = await supabase
        .from('bingo_tasks')
        .select('id, photo_url, created_at, updated_at, title, session_id')
        .not('photo_url', 'is', null)
        .order('updated_at', { ascending: false });

      // Load challenge photos
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('id, photo_url, created_at, title')
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false });

      // Load treasure hunt photos with location names (if photo_url column exists)
      let treasureData = null;
      try {
        const result = await supabase
          .from('treasure_hunt')
          .select('id, photo_url, found_at, location_name')
          .in('id', [237, 238, 239])
          .not('photo_url', 'is', null)
          .order('found_at', { ascending: false });
        treasureData = result.data;
      } catch (error) {
        
        treasureData = null;
      }

      // Debug logging to see what photos we found

      // Combine all photos with captions
      const allJellePhotos: JellePhoto[] = [
        ...(bingoData || []).map(item => ({
          id: item.id,
          photo_url: item.photo_url!,
          uploaded_at: item.updated_at || item.created_at,
          source_type: 'bingo' as const,
          source_id: item.id,
          caption: item.title || 'Bingo Opdracht'
        })),
        ...(challengeData || []).map(item => ({
          id: item.id,
          photo_url: item.photo_url!,
          uploaded_at: item.created_at,
          source_type: 'challenge' as const,
          source_id: item.id,
          caption: item.title || 'Challenge'
        })),
        ...(treasureData || []).map((item, index) => ({
          id: item.id,
          photo_url: item.photo_url!,
          uploaded_at: item.found_at || new Date().toISOString(),
          source_type: 'treasure_hunt' as const,
          source_id: item.id,
          caption: `Locatie ${index + 1}`
        }))
      ];

      // Sort by upload date - newest first (most recent photo goes top-left)
      allJellePhotos.sort((a, b) => {
        const dateA = new Date(a.uploaded_at).getTime();
        const dateB = new Date(b.uploaded_at).getTime();
        return dateB - dateA; // Newest first
      });
      
      setJellePhotos(allJellePhotos);
    } catch (error) {
      console.error('Error loading Jelle photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full fixed inset-0 flex flex-col bg-white overflow-hidden">
      {/* Instagram Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/home')}
              className="p-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">jellekrmht</h1>
            <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6" />
              <MoreHorizontal className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Profile Section */}
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/lovable-uploads/973c23d1-9028-4d5c-a8ff-5e42800968dd.png" />
              <AvatarFallback>JK</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-around text-center">
                 <div>
                   <div className="text-lg font-bold">{jellePhotos.length}</div>
                   <div className="text-sm text-gray-600">berichten</div>
                 </div>
                <div>
                  <div className="text-lg font-bold">234</div>
                  <div className="text-sm text-gray-600">volgers</div>
                </div>
                <div>
                  <div className="text-lg font-bold">429</div>
                  <div className="text-sm text-gray-600">volgend</div>
                </div>
              </div>
            </div>
          </div>

          {/* Username and Bio */}
          <div className="mb-4">
            <h1 className="text-lg font-bold mb-1">jellekrmht</h1>
            <p className="text-sm text-gray-600">Leeuwarden en daarbuiten</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mb-4">
            <button 
              className="flex-1 bg-gray-300 text-gray-500 py-1.5 px-4 rounded-md text-sm font-medium cursor-not-allowed"
              disabled
            >
              Volgend
            </button>
            <button 
              onClick={() => navigate('/home')}
              className="flex-1 bg-gray-100 text-black py-1.5 px-4 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              Home
            </button>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="max-w-md mx-auto flex-1 flex flex-col overflow-hidden">
        {/* Feed Tabs */}
        <div className="flex border-b border-gray-200">
          <button className="flex-1 flex items-center justify-center py-3 border-b-2 border-black">
            <Grid3X3 className="w-6 h-6" />
          </button>
        </div>

        {/* Photo Grid or Empty State */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : jellePhotos.length === 0 ? (
            // Empty State - "Nog geen berichten"
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nog geen berichten</h3>
            </div>
          ) : (
            // Photo Grid
            <div className="grid grid-cols-3 gap-1 pb-20">
              {jellePhotos.map((photo) => (
                <div key={`photo-${photo.id}`} className="aspect-square cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                  <img 
                    src={photo.photo_url} 
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Full Screen Photo Modal with Caption */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            {/* Back Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 left-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            {/* Photo */}
            <img 
              src={selectedPhoto.photo_url} 
              alt="Full Screen Photo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          {/* Caption at bottom */}
          <div className="bg-black/80 text-white p-4 text-center">
            <h3 className="text-lg font-semibold">{selectedPhoto.caption}</h3>
            <p className="text-sm text-gray-300 mt-1">
              {new Date(selectedPhoto.uploaded_at).toLocaleDateString('nl-NL')}
            </p>
          </div>
        </div>
      )}
      
      <NavigationBar />
    </div>
  );
};

export default PhotoWall;