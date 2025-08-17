
-- Verwijder de ongebruikte treasure hunt entries uit de database
DELETE FROM treasure_hunt;

-- Verwijder de ongebruikte treasure hunt challenges uit de database  
DELETE FROM challenges WHERE type = 'treasure_hunt';

-- Voeg nieuwe entries toe die matchen met de werkelijke "Zoek de rest" functionaliteit
-- Deze zijn alleen voor tracking in het admin dashboard
INSERT INTO treasure_hunt (location_name) VALUES 
('Neumarkt, Osnabrück'),
('Markt 1, 49074 Osnabrück, Duitsland'), 
('Hasestraße 35, 49074 Osnabrück, Duitsland');
