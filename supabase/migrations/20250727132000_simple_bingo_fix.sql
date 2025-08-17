-- Simple fix: Delete all bingo tasks and insert new default ones
-- This will be picked up by the initialize-session function for new sessions

DELETE FROM bingo_tasks;

-- Insert the 25 new default bingo tasks (without session_id, they'll be copied per session)
INSERT INTO bingo_tasks (title, description, completed) VALUES 
('Tap je eigen bier in een kroeg', 'Ga achter de bar en tap zelf een perfect biertje', false),
('Daag een onbekende uit voor een at wedstrijd', 'Vind een local voor een potje armdrukken', false),
('Wissel je shirt met een vreemde', 'Ruil je shirt met een andere feestganger', false),
('Verzamel 10 handtekeningen van vreemden op je borst', 'Laat mensen op je borst tekenen', false),
('Maak een groepsfoto van ons allemaal', 'Verzamel zoveel mogelijk mensen voor een epische groepsfoto', false),
('Zing of laat ergens Ricky - Genot afspelen', 'Het ultieme Nederlandse vrijgezellenlied', false),
('Verzamel geld van bekenden en onbekenden en zet in op een wedstrijd naar keuze vandaag en win geld voor in de pot', 'Verzamel geld en zet in op een wedstrijd', false),
('Vraag een voorbijganger om een liefdesboodschap op video uit te spreken voor Caro en jou', 'Een romantische videoboodschap voor jullie beiden', false),
('Untap een biertje speciaal uit Osnabruck', 'Probeer een lokaal Osnabrücker bier', false),
('Ga op de foto met een lotgenoot', 'Vind iemand die ook vrijgezel is of gaat trouwen', false),
('FREE', 'Gratis vakje - automatisch voltooid', true),
('Oefen je openingsdans met een dame', 'Dans de eerste dans van je bruiloft', false),
('Bestel een rondje voor onbekenden', 'Verras vreemden met een gratis drankje', false),
('Krijg een rondje van onbekenden', 'Laat vreemden jou trakteren', false),
('Loop langs een onbekende en doe alsof hij/zij je laat struikelen', 'Doe alsof iemand je laat struikelen', false),
('Houd de deur voor iemand open die nog heel ver weg is', 'Wees extra beleefd', false),
('Eet een bratwurst met je handen op je rug', 'Eet een worst zonder je handen te gebruiken', false),
('Maak een selfie met een politieagente', 'Vraag vriendelijk om een foto met de politie', false),
('Doe een awkward handshake met een vreemde en laat het zo lang mogelijk duren', 'Maak een ongemakkelijke handshake', false),
('Maak een selfie met Fellaini', 'Vind iemand die op Fellaini lijkt', false),
('Maak een foto waarbij je wordt gedragen door 4 onbekenden', 'Laat je dragen door vreemden', false),
('Klim (veilig!) ergens op', 'Klim op iets veiligs', false),
('Doe een trucje op een skateboard', 'Probeer een skateboard truc', false),
('Bemoei je uit het niets met het gesprek van onbekenden', 'Doe mee met een vreemd gesprek', false),
('Eet iets dat je nog nooit hebt gegeten', 'Probeer iets nieuws', false); 