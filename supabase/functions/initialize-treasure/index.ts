import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TreasureLocation {
  name: string;
  hint: string;
  latitude?: number;
  longitude?: number;
  verification_method: 'gps' | 'qr' | 'photo';
  qr_code?: string;
  points?: number;
}

interface InitializeTreasureRequest {
  event_id: string;
  session_id: string;
  locations?: TreasureLocation[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event_id, session_id, locations }: InitializeTreasureRequest = await req.json()

    if (!event_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'event_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if treasure hunt already exists for this session
    const { data: existingLocations } = await supabase
      .from('treasure_hunt')
      .select('id')
      .eq('event_id', event_id)
      .eq('session_id', session_id)
      .limit(1)

    if (existingLocations && existingLocations.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Treasure hunt already initialized for this session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default treasure hunt locations if none provided
    const defaultLocations: TreasureLocation[] = locations || [
      {
        name: "De Grote Markt",
        hint: "Hier staat het mooiste stadhuis van Nederland. Zoek naar de fontein!",
        latitude: 52.0907,
        longitude: 5.1214,
        verification_method: 'gps',
        points: 30
      },
      {
        name: "Café De Kroeg",
        hint: "De plek waar alles begon... Vraag de barman naar 'de speciale code'",
        verification_method: 'qr',
        qr_code: 'TREASURE_CAFE_SECRET_2024',
        points: 40
      },
      {
        name: "Het Park",
        hint: "Groen, rustig en vol met eenden. Maak een foto bij de grote eik!",
        latitude: 52.0856,
        longitude: 5.1289,
        verification_method: 'photo',
        points: 35
      }
    ]

    // Insert treasure hunt locations
    const locationsToInsert = defaultLocations.map((location, index) => ({
      event_id,
      session_id,
      order_index: index,
      location_name: location.name,
      hint: location.hint,
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      verification_method: location.verification_method,
      qr_code: location.qr_code || null,
      points: location.points || 30,
      found: false
    }))

    const { data: insertedLocations, error: insertError } = await supabase
      .from('treasure_hunt')
      .insert(locationsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting treasure hunt locations:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to initialize treasure hunt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        locations: insertedLocations,
        message: `Initialized ${insertedLocations?.length || 0} treasure hunt locations`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in initialize-treasure function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
