-- Update treasure hunt to only have 3 locations with multiple choice questions
DELETE FROM treasure_hunt;

INSERT INTO treasure_hunt (location_name) VALUES 
('Dom St. Peter'),
('Historisches Zentrum'),
('Kloster Walburg');

-- Update challenges with multiple choice format for treasure hunt
UPDATE challenges 
SET 
  title = 'Schattenjacht Vraag 1: Dom St. Peter',
  description = 'Wat is de hoogte van de toren van de Dom St. Peter?||A) 78 meter||B) 104 meter||C) 119 meter||D) 92 meter||Antwoord: B',
  type = 'treasure_hunt'
WHERE id = 1;

UPDATE challenges 
SET 
  title = 'Schattenjacht Vraag 2: Historisches Zentrum',
  description = 'In welk jaar werd het historische centrum van Osnabrück gebouwd?||A) 1147||B) 1204||C) 1290||D) 1356||Antwoord: A',
  type = 'treasure_hunt'
WHERE id = 2;

UPDATE challenges 
SET 
  title = 'Schattenjacht Vraag 3: Kloster Walburg',
  description = 'Voor welke religieuze orde werd Kloster Walburg oorspronkelijk gebouwd?||A) Benedictijnen||B) Franciscanen||C) Dominicanen||D) Augustijnen||Antwoord: A',
  type = 'treasure_hunt'
WHERE id = 3;

-- Remove extra treasure hunt challenges
DELETE FROM challenges WHERE id > 3 AND type = 'treasure_hunt';