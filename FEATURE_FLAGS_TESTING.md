# Feature Flags Testing Guide

## Overzicht
Dit document beschrijft hoe de feature flag infrastructuur te testen en te valideren.

## Implementatie Samenvatting

### ✅ Voltooide Onderdelen

1. **Database Infrastructure**
   - `events.features` JSONB kolom toegevoegd
   - Helper functies: `is_feature_enabled()`, `get_feature_config()`, `update_feature_settings()`
   - Default CORE features enabled, andere features disabled

2. **Client-side Utilities**
   - `src/utils/featureFlags.ts` met complete API
   - Caching mechanisme (30s TTL)
   - TypeScript types voor alle features

3. **UI Gating**
   - MainHub components conditioneel gerenderd
   - Loading states voor feature loading
   - Graceful fallbacks

4. **Admin Controls**
   - AdminDashboard met feature toggles
   - Real-time updates
   - Categorische weergave (CORE vs anderen)

5. **CORE Features**
   - Database schemas voor alle CORE features
   - Edge functions: `initialize-bingo`, `award-bingo-bonus`, `initialize-treasure`, `verify-location`
   - React hooks: `useBingo`, `useTreasure`
   - RLS policies

6. **Non-CORE Features (Proof of Concept)**
   - SOCIAL_TeamBattle, COMP_Leaderboard, MEDIA_StoryMode
   - Database schemas en RLS policies
   - Example hook: `useLeaderboard`

## Database Migraties Uitvoeren

```bash
cd /Users/prive/Desktop/bachelor-party-quest-saas

# Start Supabase (als nog niet gedaan)
supabase start

# Reset database (optioneel, voor clean start)
supabase db reset

# Of pas nieuwe migraties toe
supabase db push
```

## Testing Scenario's

### 1. Feature Flag Basis Functionaliteit

**Test: Feature flags laden**
```bash
# Open browser console op admin dashboard
# URL: http://localhost:5173/admin-dashboard-secret-2025

# Check of features correct laden
console.log(await getAllFeatures());
```

**Verwacht resultaat:**
```json
{
  "CORE_Bingo": {"enabled": true, "config": {}},
  "CORE_TreasureHunt": {"enabled": true, "config": {}},
  "CORE_PhotoWall": {"enabled": true, "config": {}},
  "CORE_DealShop": {"enabled": true, "config": {}},
  "CORE_SimplyWild": {"enabled": true, "config": {}},
  "CORE_SpectatorView": {"enabled": true, "config": {}},
  "SOCIAL_TeamBattle": {"enabled": false, "config": {}},
  "COMP_Leaderboard": {"enabled": false, "config": {}},
  "MEDIA_StoryMode": {"enabled": false, "config": {}}
}
```

### 2. UI Gating Testen

**Test: MainHub feature visibility**

1. **Initiële staat** - Ga naar http://localhost:5173/home
   - ✅ Bingo card (Jelle's Laatste Keer) zichtbaar
   - ✅ Simply Wild card zichtbaar  
   - ✅ Deal Shop card zichtbaar
   - ✅ Photo Wall card zichtbaar

2. **Feature uitschakelen** - Ga naar admin dashboard
   - Schakel "Bingo" uit via toggle
   - Ga terug naar MainHub
   - ❌ Bingo card verdwenen
   - ✅ Andere cards nog steeds zichtbaar

3. **Alle features uitschakelen**
   - Schakel alle CORE features uit
   - MainHub toont alleen loading state
   - Geen cards zichtbaar

### 3. Admin Dashboard Testen

**Test: Feature toggles**

1. Open admin dashboard: http://localhost:5173/admin-dashboard-secret-2025
2. Scroll naar "Feature Instellingen" sectie
3. Test toggles:
   - Schakel CORE_Bingo uit → Should update database
   - Schakel SOCIAL_TeamBattle in → Should enable non-core feature
4. Refresh pagina → Settings should persist

**Verwachte UI:**
- CORE Features sectie (blauw)
- Andere Features sectie (paars) 
- Switches werken real-time
- Toast notifications bij wijzigingen

### 4. Database Validatie

**Test: Direct database queries**

```sql
-- Check events.features column
SELECT slug, features FROM public.events WHERE slug = 'legacy';

-- Test helper functions
SELECT public.is_feature_enabled(
  (SELECT id FROM public.events WHERE slug = 'legacy'), 
  'CORE_Bingo'
);

-- Update feature setting
SELECT public.update_feature_settings(
  (SELECT id FROM public.events WHERE slug = 'legacy'),
  'SOCIAL_TeamBattle',
  true,
  '{"max_team_size": 4}'::jsonb
);
```

### 5. Edge Functions Testen

**Test: Bingo initialization**

```bash
# Via Supabase CLI
supabase functions invoke initialize-bingo --data '{
  "event_id": "YOUR_EVENT_ID",
  "session_id": "YOUR_SESSION_ID"
}'
```

**Test: Treasure hunt initialization**

```bash
supabase functions invoke initialize-treasure --data '{
  "event_id": "YOUR_EVENT_ID", 
  "session_id": "YOUR_SESSION_ID"
}'
```

### 6. React Hooks Testen

**Test: useBingo hook**

```tsx
// In een test component
import { useBingo } from '@/hooks/useBingo';

function TestBingo() {
  const { tasks, loading, error, completeTask } = useBingo('your-session-id');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h3>Bingo Tasks: {tasks.length}</h3>
      {tasks.map(task => (
        <div key={task.id}>
          {task.title} - {task.completed ? '✅' : '⏳'}
        </div>
      ))}
    </div>
  );
}
```

### 7. RLS Policies Testen

**Test: Row Level Security**

```sql
-- Set session context
SELECT public.set_session_context('your-session-id'::uuid);

-- Try to access bingo tasks (should only see own)
SELECT * FROM public.bingo_tasks;

-- Try to access shop items (should see event items)
SELECT * FROM public.shop_items;
```

## Validatie Checklist

### Database ✅
- [ ] Migraties succesvol uitgevoerd
- [ ] `events.features` kolom bestaat
- [ ] Helper functions werken
- [ ] RLS policies actief
- [ ] Default data aanwezig

### Client-side ✅  
- [ ] Feature flags utils laden correct
- [ ] Caching werkt (geen dubbele requests)
- [ ] TypeScript types kloppen
- [ ] Error handling werkt

### UI ✅
- [ ] MainHub reageert op feature flags
- [ ] Admin toggles werken
- [ ] Loading states tonen
- [ ] Toast notifications verschijnen

### API ✅
- [ ] Edge functions deploybaar
- [ ] React hooks werken
- [ ] Real-time updates functioneren
- [ ] Error handling correct

## Troubleshooting

### Veelvoorkomende Problemen

**1. Features laden niet**
```bash
# Check database connectie
supabase status

# Check migraties
supabase db diff

# Reset als nodig
supabase db reset
```

**2. UI updates niet**
```typescript
// Clear feature cache
import { clearFeatureCache } from '@/utils/featureFlags';
clearFeatureCache();
```

**3. RLS policies blokkeren toegang**
```sql
-- Check session context
SELECT current_setting('app.session_id', true);

-- Disable RLS tijdelijk voor debugging (NIET in productie!)
ALTER TABLE public.bingo_tasks DISABLE ROW LEVEL SECURITY;
```

**4. Edge functions falen**
```bash
# Check logs
supabase functions logs initialize-bingo

# Test lokaal
supabase functions serve
```

## Performance Overwegingen

1. **Feature Flag Caching**: 30s TTL voorkomt excessive database calls
2. **Database Indexing**: GIN index op `events.features` voor snelle queries  
3. **RLS Policies**: Efficient policies voorkomen table scans
4. **Real-time**: Selective subscriptions per feature type

## Uitbreiding Patroon

Voor nieuwe features:

1. **Voeg toe aan `FeatureKey` type** in `featureFlags.ts`
2. **Database schema** in nieuwe migratie 
3. **RLS policies** voor security
4. **React hook** voor client-side gebruik
5. **Edge functions** indien nodig
6. **Update default features** in migratie

Voorbeeld:
```typescript
// 1. Type toevoegen
export type FeatureKey = 
  | 'EXISTING_FEATURES'
  | 'NEW_FEATURE_NAME';

// 2. Database schema
create table if not exists public.new_feature_table (...);

// 3. RLS policy  
create policy new_feature_policy on public.new_feature_table ...;

// 4. React hook
export function useNewFeature(sessionId: string) { ... }
```

## Conclusie

De feature flag infrastructuur is volledig geïmplementeerd en klaar voor gebruik. Alle CORE features zijn standaard enabled, en het systeem is uitbreidbaar voor nieuwe features via het gedefinieerde patroon.
