import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { session_id, user_name, event_id } = await req.json()

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if session already exists
    const { data: existingSession } = await supabaseClient
      .from('sessions')
      .select('id')
      .eq('id', session_id)
      .single()

    if (existingSession) {
      // Session already exists, just update activity
      await supabaseClient
        .from('sessions')
        .update({ 
          last_activity: new Date().toISOString(),
          user_name: user_name || null
        })
        .eq('id', session_id)

      return new Response(
        JSON.stringify({ message: 'Session updated', session_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve event_id (use provided or legacy fallback)
    let resolved_event_id = event_id
    if (!resolved_event_id) {
      const { data: legacy } = await supabaseClient
        .from('_legacy_event')
        .select('id')
        .single()
      resolved_event_id = legacy?.id || null
    }

    // Create new session
    await supabaseClient
      .from('sessions')
      .insert({
        id: session_id,
        user_name: user_name || null,
        event_id: resolved_event_id,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })

    // Initialize default bingo tasks for this session
    const bingoTasks = [
      "Tap je eigen bier in een kroeg",
      "Laat een onbekende op video een liefdesboodschap uitspreken voor jou en Caro",
      "Doe een kaarttruc bij een vreemde (die mislukt)",
      "Maak een selfie met 'Fellaini'",
      "Eet een bratwurst met je handen op je rug",
      "Zing of laat ergens Ricky – Genot afspelen",
      "Bemoei je uit het niets met het gesprek van onbekenden",
      "Vind een Günther/Wolfgang/Fritz en ga ermee op de foto",
      "Doe een trick op een skateboard",
      "Maak een foto terwijl je door 4 onbekenden wordt gedragen",
      "Zorg voor een groepsfoto van ons allemaal",
      "Krijg ergens een mooie korting",
      "Maak een schwalbe bij een onbekende",
      "Untap een biertje speciaal uit Osnabrück",
      "Maak een selfie met een politieagente",
      "Klim (veilig) ergens op",
      "Krijg een rondje van onbekenden",
      "Eet iets dat je nog nooit hebt gegeten",
      "Doe een awkward handshake met een vreemde (zo lang mogelijk)",
      "Houd 30x hoog met een bal in een sportwinkel",
      "Daag een onbekende uit voor een bier at-wedstrijd",
      "Ga op de foto met een lotgenoot",
      "Houd de deur open voor iemand die nog heel ver weg is",
      "Teken het Cambuur-logo op een wildvreemde",
      "Verzamel geld (bij bekend en onbekend) en zet een bet voor de pot"
    ]

    const bingoInserts = bingoTasks.map((task, index) => ({
      title: task,
      description: task,
      completed: false,
      session_id: session_id,
      event_id: resolved_event_id
    }))

    await supabaseClient
      .from('bingo_tasks')
      .insert(bingoInserts)

    // Initialize treasure hunt locations for this session
    const treasureLocations = [
      "🍺 Zoek de plek waar het bier vloeit en de stemming hoog is - ga naar de bar en bestel je eerste drankje!",
      "🎵 Volg de muziek naar de dansvloer - laat zien dat je moves hebt!",
      "🎯 Tijd voor de echte uitdaging - ga naar de toiletten en maak een selfie bij de spiegel!"
    ]

    const treasureInserts = treasureLocations.map((location, index) => ({
      location_name: location,
      found: false,
      session_id: session_id,
      event_id: resolved_event_id
    }))

    await supabaseClient
      .from('treasure_hunt')
      .insert(treasureInserts)

    // Initialize challenges for this session
    const challenges = [
      {
        title: "Spreek een vreemde aan",
        description: "Ga naar iemand die je niet kent en stel jezelf voor. Vraag naar hun verhaal!",
        type: "social",
        session_id: session_id,
        event_id: resolved_event_id
      },
      {
        title: "Dans Battle!",
        description: "Uitdaging iemand voor een dans battle! Laat je beste moves zien!",
        type: "performance",
        time_limit: 60,
        session_id: session_id,
        event_id: resolved_event_id
      },
      {
        title: "Complimenten Ronde",
        description: "Geef 5 verschillende mensen een oprecht compliment binnen 10 minuten.",
        type: "timed",
        time_limit: 600,
        session_id: session_id,
        event_id: resolved_event_id
      }
    ]

    await supabaseClient
      .from('challenges')
      .insert(challenges)

    return new Response(
      JSON.stringify({ 
        message: 'Session initialized successfully', 
        session_id,
        bingo_tasks: bingoInserts.length,
        treasure_locations: treasureInserts.length,
        challenges: challenges.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})