-- Update all existing sessions with new bingo tasks
-- First, delete all existing bingo tasks for all sessions
DELETE FROM bingo_tasks WHERE session_id IS NOT NULL;

-- Now recreate bingo tasks for each existing session with the new tasks
-- Get all unique session_ids and create the new tasks for each
DO $$
DECLARE
    session_record RECORD;
    task_titles text[] := ARRAY[
        'Tap je eigen bier in een kroeg',
        'Daag een onbekende uit voor een at wedstrijd',
        'Wissel je shirt met een vreemde',
        'Verzamel 10 handtekeningen van vreemden op je borst',
        'Zing een Duitse slager terwijl je op een tafel staat',
        'Maak een groepsfoto',
        'Zing of laat ergens Ricky - Genot afspelen',
        'Laat een vrouw Teun ten huwelijk vragen',
        'Vraag een voorbijganger om een liefdesboodschap op video uit te spreken voor Caro en jou',
        'Untap een biertje speciaal uit Osnabruck',
        'Ga op de foto met een lotgenoot',
        'Oefen je openingsdans met een dame',
        'FREE',
        'Bestel een rondje voor onbekenden',
        'Leer een Duits liedje van een local',
        'Krijg een telefoonnummer van een Duitse dame', 
        'Doe een Schuhplattler dans in het openbaar',
        'Eet een bratwurst met je handen op je rug',
        'Vraag de weg in gebrekkig Duits',
        'Maak een selfie met een politieagent',
        'Drink een shotje uit de schoen van een vreemde',
        'Organiseer een conga lijn in een kroeg',
        'Zing het Duitse volkslied op de Marktplatz',
        'Krijg een kus van een oma',
        'Dans de Macarena met 5 onbekenden'
    ];
    task_descriptions text[] := ARRAY[
        'Ga achter de bar en tap zelf een perfect biertje',
        'Vind een local voor een potje armdrukken',
        'Ruil je shirt met een andere feestganger',
        'Laat mensen op je borst tekenen',
        'Klim op een tafel en geef een Oktoberfest show',
        'Verzamel zoveel mogelijk mensen voor een epische groepsfoto',
        'Het ultieme Nederlandse vrijgezellenlied',
        'Een dame moet Teun een huwelijksaanzoek doen',
        'Een romantische videoboodschap voor jullie beiden',
        'Probeer een lokaal Osnabrücker bier',
        'Vind iemand die ook vrijgezel is of gaat trouwen',
        'Dans de eerste dans van je bruiloft',
        'Gratis vakje - automatisch voltooid',
        'Verras vreemden met een gratis drankje',
        'Een Duitser moet je een liedje leren',
        'Flirt je weg naar een telefoonnummer',
        'De traditionele Beierse klappensdans',
        'Eet een worst zonder je handen te gebruiken',
        'Spreek Duits alsof je het net hebt geleerd',
        'Vraag vriendelijk om een foto met de politie',
        'Het ultieme vertrouwensspel',
        'Start een dansende slang door de hele kroeg',
        'Das Deutschlandlied op het centrale plein',
        'Charmeer een lieve Duitse oma',
        'De klassieke groepsdans uit de jaren 90'
    ];
    i INTEGER;
BEGIN
    -- Loop through all existing sessions
    FOR session_record IN 
        SELECT DISTINCT id FROM sessions 
        WHERE id IS NOT NULL
    LOOP
        -- Insert the 25 new bingo tasks for this session
        FOR i IN 1..25 LOOP
            INSERT INTO bingo_tasks (title, description, completed, session_id) 
            VALUES (
                task_titles[i], 
                task_descriptions[i], 
                CASE WHEN task_titles[i] = 'FREE' THEN true ELSE false END,
                session_record.id
            );
        END LOOP;
    END LOOP;
END $$; 