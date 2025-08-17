-- Update bingo tasks with new German bachelor party themed tasks
-- Clear existing tasks first
DELETE FROM bingo_tasks;

-- Insert the new 25 bachelor party tasks
INSERT INTO bingo_tasks (title, description) VALUES 
('Tap je eigen bier in een kroeg', 'Ga achter de bar en tap zelf een perfect biertje'),
('Daag een onbekende uit voor een at wedstrijd', 'Vind een local voor een potje armdrukken'),
('Wissel je shirt met een vreemde', 'Ruil je shirt met een andere feestganger'),
('Verzamel 10 handtekeningen van vreemden op je borst', 'Laat mensen op je borst tekenen'),
('Maak een groepsfoto van ons allemaal', 'Verzamel zoveel mogelijk mensen voor een epische groepsfoto'),
('Zing of laat ergens Ricky - Genot afspelen', 'Het ultieme Nederlandse vrijgezellenlied'),
('Verzamel geld van bekenden en onbekenden en zet in op een wedstrijd naar keuze vandaag en win geld voor in de pot', 'Verzamel geld en zet in op een wedstrijd'),
('Vraag een voorbijganger om een liefdesboodschap op video uit te spreken voor Caro en jou', 'Een romantische videoboodschap voor jullie beiden'),
('Untap een biertje speciaal uit Osnabruck', 'Probeer een lokaal Osnabrücker bier'),
('Ga op de foto met een lotgenoot', 'Vind iemand die ook vrijgezel is of gaat trouwen'),
('FREE', 'Gratis vakje - automatisch voltooid'),
('Oefen je openingsdans met een dame', 'Dans de eerste dans van je bruiloft'),
('Bestel een rondje voor onbekenden', 'Verras vreemden met een gratis drankje'),
('Krijg een rondje van onbekenden', 'Laat vreemden jou trakteren'),
('Loop langs een onbekende en doe alsof hij/zij je laat struikelen', 'Doe alsof iemand je laat struikelen'),
('Houd de deur voor iemand open die nog heel ver weg is', 'Wees extra beleefd'),
('Eet een bratwurst met je handen op je rug', 'Eet een worst zonder je handen te gebruiken'),
('Maak een selfie met een politieagente', 'Vraag vriendelijk om een foto met de politie'),
('Doe een awkward handshake met een vreemde en laat het zo lang mogelijk duren', 'Maak een ongemakkelijke handshake'),
('Maak een selfie met Fellaini', 'Vind iemand die op Fellaini lijkt'),
('Maak een foto waarbij je wordt gedragen door 4 onbekenden', 'Laat je dragen door vreemden'),
('Klim (veilig!) ergens op', 'Klim op iets veiligs'),
('Doe een trucje op een skateboard', 'Probeer een skateboard truc'),
('Bemoei je uit het niets met het gesprek van onbekenden', 'Doe mee met een vreemd gesprek'),
('Eet iets dat je nog nooit hebt gegeten', 'Probeer iets nieuws'); 