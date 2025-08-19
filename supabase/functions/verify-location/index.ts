import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyLocationRequest {
  event_id: string;
  session_id: string;
  location_id: number;
  method_payload: {
    latitude?: number;
    longitude?: number;
    qr_code?: string;
    photo_url?: string;
  };
}

// Calculate distance between two GPS coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
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

    const { event_id, session_id, location_id, method_payload }: VerifyLocationRequest = await req.json()

    if (!event_id || !session_id || !location_id) {
      return new Response(
        JSON.stringify({ error: 'event_id, session_id, and location_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the treasure hunt location
    const { data: location, error: locationError } = await supabase
      .from('treasure_hunt')
      .select('*')
      .eq('id', location_id)
      .eq('event_id', event_id)
      .eq('session_id', session_id)
      .single()

    if (locationError || !location) {
      return new Response(
        JSON.stringify({ error: 'Location not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (location.found) {
      return new Response(
        JSON.stringify({ error: 'Location already found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let verified = false
    let verificationMessage = ''

    // Verify based on method
    switch (location.verification_method) {
      case 'gps':
        if (!method_payload.latitude || !method_payload.longitude) {
          return new Response(
            JSON.stringify({ error: 'GPS coordinates required for GPS verification' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!location.latitude || !location.longitude) {
          return new Response(
            JSON.stringify({ error: 'Location GPS coordinates not set' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const distance = calculateDistance(
          method_payload.latitude,
          method_payload.longitude,
          location.latitude,
          location.longitude
        )

        const maxDistance = 50 // 50 meters tolerance
        verified = distance <= maxDistance
        verificationMessage = verified 
          ? `GPS verified! You are ${Math.round(distance)}m from the location.`
          : `Too far away! You are ${Math.round(distance)}m from the location (max ${maxDistance}m).`
        break

      case 'qr':
        if (!method_payload.qr_code) {
          return new Response(
            JSON.stringify({ error: 'QR code required for QR verification' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        verified = method_payload.qr_code === location.qr_code
        verificationMessage = verified 
          ? 'QR code verified successfully!'
          : 'Invalid QR code. Please try again.'
        break

      case 'photo':
        if (!method_payload.photo_url) {
          return new Response(
            JSON.stringify({ error: 'Photo URL required for photo verification' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // For photo verification, we'll accept any photo and mark as verified
        // In a real implementation, you might want manual approval or AI verification
        verified = true
        verificationMessage = 'Photo uploaded successfully! Location found!'
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown verification method' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    if (!verified) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          message: verificationMessage 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark location as found
    const updateData: any = {
      found: true,
      found_at: new Date().toISOString()
    }

    if (method_payload.photo_url) {
      updateData.photo_url = method_payload.photo_url
    }

    const { error: updateError } = await supabase
      .from('treasure_hunt')
      .update(updateData)
      .eq('id', location_id)

    if (updateError) {
      console.error('Error updating treasure hunt location:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update location status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Award points
    const pointsToAward = location.points || 30
    
    // Update session points balance
    const { error: pointsError } = await supabase
      .from('sessions')
      .update({ 
        points_balance: supabase.sql`points_balance + ${pointsToAward}`
      })
      .eq('id', session_id)

    if (pointsError) {
      console.error('Error updating points balance:', pointsError)
    }

    // Record in points history
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        event_id,
        session_id,
        transaction_type: 'treasure_found',
        amount: pointsToAward,
        description: `Found treasure location: ${location.location_name}`
      })

    if (historyError) {
      console.error('Error recording points history:', historyError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        verified: true,
        points_awarded: pointsToAward,
        location_name: location.location_name,
        message: `${verificationMessage} You earned ${pointsToAward} points!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in verify-location function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
