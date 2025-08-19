import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AwardBonusRequest {
  event_id: string;
  session_id: string;
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

    const { event_id, session_id }: AwardBonusRequest = await req.json()

    if (!event_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'event_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all completed bingo tasks for this session
    const { data: tasks, error: tasksError } = await supabase
      .from('bingo_tasks')
      .select('position, completed')
      .eq('event_id', event_id)
      .eq('session_id', session_id)
      .order('position')

    if (tasksError) {
      console.error('Error fetching bingo tasks:', tasksError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bingo tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const completedTasks = tasks?.filter(task => task.completed) || []
    const completedPositions = completedTasks.map(task => task.position)

    // Get existing bonus audits to avoid duplicates
    const { data: existingBonuses } = await supabase
      .from('bingo_bonus_audits')
      .select('bonus_type')
      .eq('event_id', event_id)
      .eq('session_id', session_id)

    const existingBonusTypes = new Set(existingBonuses?.map(b => b.bonus_type) || [])

    // Color mapping (5x5 grid)
    const colorMap = {
      0: 0, 1: 1, 2: 2, 3: 3, 4: 4,  // Row 0
      5: 0, 6: 1, 7: 2, 8: 3, 9: 4,  // Row 1
      10: 0, 11: 1, 12: 2, 13: 3, 14: 4,  // Row 2
      15: 0, 16: 1, 17: 2, 18: 3, 19: 4,  // Row 3
      20: 0, 21: 1, 22: 2, 23: 3, 24: 4   // Row 4
    }

    const starPositions = [2, 6, 12, 18, 22] // Star positions in the grid

    const newBonuses = []
    let totalBonusPoints = 0

    // Check for row completions (0-4, 5-9, 10-14, 15-19, 20-24)
    for (let row = 0; row < 5; row++) {
      const rowPositions = [row * 5, row * 5 + 1, row * 5 + 2, row * 5 + 3, row * 5 + 4]
      const rowComplete = rowPositions.every(pos => completedPositions.includes(pos))
      
      if (rowComplete && !existingBonusTypes.has('row')) {
        newBonuses.push({ bonus_type: 'row', points: 35 })
        totalBonusPoints += 35
        existingBonusTypes.add('row') // Prevent multiple row bonuses
        break // Only award first row completion
      }
    }

    // Check for column completions (0,5,10,15,20 etc.)
    for (let col = 0; col < 5; col++) {
      const colPositions = [col, col + 5, col + 10, col + 15, col + 20]
      const colComplete = colPositions.every(pos => completedPositions.includes(pos))
      
      if (colComplete && !existingBonusTypes.has('column')) {
        newBonuses.push({ bonus_type: 'column', points: 35 })
        totalBonusPoints += 35
        existingBonusTypes.add('column') // Prevent multiple column bonuses
        break // Only award first column completion
      }
    }

    // Check for color bonuses
    const colorCounts = {}
    completedPositions.forEach(pos => {
      const color = colorMap[pos]
      colorCounts[color] = (colorCounts[color] || 0) + 1
    })

    for (const [color, count] of Object.entries(colorCounts)) {
      if (count >= 5 && !existingBonusTypes.has('five_same_color')) {
        newBonuses.push({ bonus_type: 'five_same_color', points: 25 })
        totalBonusPoints += 25
        existingBonusTypes.add('five_same_color')
      } else if (count >= 4 && !existingBonusTypes.has('four_same_color')) {
        newBonuses.push({ bonus_type: 'four_same_color', points: 30 })
        totalBonusPoints += 30
        existingBonusTypes.add('four_same_color')
      }
    }

    // Check for five stars completion
    const starsCompleted = starPositions.filter(pos => completedPositions.includes(pos))
    if (starsCompleted.length >= 5 && !existingBonusTypes.has('five_stars')) {
      newBonuses.push({ bonus_type: 'five_stars', points: 50 })
      totalBonusPoints += 50
    }

    // Insert new bonus audits
    if (newBonuses.length > 0) {
      const bonusRecords = newBonuses.map(bonus => ({
        event_id,
        session_id,
        bonus_type: bonus.bonus_type,
        points_awarded: bonus.points
      }))

      const { error: bonusError } = await supabase
        .from('bingo_bonus_audits')
        .insert(bonusRecords)

      if (bonusError) {
        console.error('Error inserting bonus audits:', bonusError)
        return new Response(
          JSON.stringify({ error: 'Failed to record bonuses' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update points balance (assuming there's a points system)
      if (totalBonusPoints > 0) {
        const { error: pointsError } = await supabase
          .from('sessions')
          .update({ 
            points_balance: supabase.sql`points_balance + ${totalBonusPoints}`
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
            transaction_type: 'bingo_bonus',
            amount: totalBonusPoints,
            description: `Bingo bonuses: ${newBonuses.map(b => b.bonus_type).join(', ')}`
          })

        if (historyError) {
          console.error('Error recording points history:', historyError)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        bonuses_awarded: newBonuses,
        total_points: totalBonusPoints,
        completed_tasks: completedTasks.length,
        message: newBonuses.length > 0 ? `Awarded ${newBonuses.length} bonuses for ${totalBonusPoints} points!` : 'No new bonuses to award'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in award-bingo-bonus function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
