import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BingoTask {
  position: number;
  title: string;
  description?: string;
  points?: number;
}

interface InitializeBingoRequest {
  event_id: string;
  session_id: string;
  template_tasks?: BingoTask[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { event_id, session_id, template_tasks }: InitializeBingoRequest = await req.json()

    // Validate input
    if (!event_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'event_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if bingo tasks already exist for this session
    const { data: existingTasks } = await supabase
      .from('bingo_tasks')
      .select('id')
      .eq('event_id', event_id)
      .eq('session_id', session_id)
      .limit(1)

    if (existingTasks && existingTasks.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Bingo already initialized for this session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default bingo tasks if none provided
    const defaultTasks: BingoTask[] = template_tasks || [
      { position: 0, title: "Drink een shotje", description: "Neem een foto tijdens het drinken", points: 20 },
      { position: 1, title: "Maak een selfie met een vreemdeling", description: "Vraag netjes om een foto", points: 25 },
      { position: 2, title: "Dans op straat", description: "Minimaal 30 seconden dansen", points: 30 },
      { position: 3, title: "Zing een liedje", description: "Hardop zingen in het openbaar", points: 25 },
      { position: 4, title: "Koop een drankje voor iemand anders", description: "Voor een vreemdeling", points: 35 },
      { position: 5, title: "Vertel een grap", description: "En zorg dat iemand lacht", points: 20 },
      { position: 6, title: "Maak een TikTok", description: "Post hem ook echt", points: 40 },
      { position: 7, title: "Vraag om een telefoonnummer", description: "Van iemand die je leuk vindt", points: 50 },
      { position: 8, title: "Eet iets wat je nog nooit hebt gegeten", description: "Bewijs met foto", points: 30 },
      { position: 9, title: "Complimenteer 5 mensen", description: "Oprechte complimenten", points: 25 },
      { position: 10, title: "Doe een handstand", description: "Of probeer het tenminste", points: 20 },
      { position: 11, title: "Ga op de foto met een dier", description: "Huisdier of straatdier", points: 25 },
      { position: 12, title: "Imiteer een beroemdheid", description: "Laat anderen raden wie", points: 30 },
      { position: 13, title: "Koop iets geks", description: "Iets wat je normaal nooit zou kopen", points: 35 },
      { position: 14, title: "Maak contact met een ex", description: "Stuur een berichtje", points: 40 },
      { position: 15, title: "Ga ergens naar binnen waar je nog nooit bent geweest", description: "In deze stad", points: 30 },
      { position: 16, title: "Leer iemand iets nieuws", description: "Teach a skill", points: 25 },
      { position: 17, title: "Krijg een high-five van een kind", description: "Met toestemming van ouders", points: 20 },
      { position: 18, title: "Maak een nieuwe vriend", description: "Uitwisseling van contactinfo", points: 45 },
      { position: 19, title: "Doe iets aardigs voor een vreemdeling", description: "Random act of kindness", points: 35 },
      { position: 20, title: "Ga naar een plek uit je jeugd", description: "En maak een foto", points: 30 },
      { position: 21, title: "Zing karaoke", description: "In een bar of app", points: 40 },
      { position: 22, title: "Maak een foto in een fotohokje", description: "Old school photo booth", points: 25 },
      { position: 23, title: "Probeer een nieuwe cocktail", description: "Iets wat je nog nooit hebt gehad", points: 20 },
      { position: 24, title: "Zeg tegen 3 mensen dat je van ze houdt", description: "En meen het ook", points: 50 }
    ]

    // Insert all 25 bingo tasks
    const tasksToInsert = defaultTasks.map(task => ({
      event_id,
      session_id,
      position: task.position,
      title: task.title,
      description: task.description || '',
      points: task.points || 20,
      completed: false
    }))

    const { data: insertedTasks, error: insertError } = await supabase
      .from('bingo_tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting bingo tasks:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to initialize bingo tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize bingo colors for the event if not exists
    const { error: colorsError } = await supabase
      .from('bingo_colors')
      .upsert({ event_id }, { onConflict: 'event_id' })

    if (colorsError) {
      console.error('Error initializing bingo colors:', colorsError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tasks: insertedTasks,
        message: `Initialized ${insertedTasks?.length || 0} bingo tasks`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in initialize-bingo function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
