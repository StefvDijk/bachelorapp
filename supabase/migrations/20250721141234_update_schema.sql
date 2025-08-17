-- Update bingo tasks with Osnabruck-themed content
UPDATE bingo_tasks SET 
title = 'Foto bij het Osnabrücker Dom',
description = 'Maak een groepsfoto voor de indrukwekkende Sint-Petrus kathedraal in het centrum van Osnabruck'
WHERE id = 1;

UPDATE bingo_tasks SET 
title = 'Probeer lokaal Osnabrücker bier',
description = 'Bestel een lokaal gebrouwen bier in een traditionele Duitse Gasthaus'
WHERE id = 2;

UPDATE bingo_tasks SET 
title = 'Vind de Heger Tor',
description = 'Zoek en fotografeer deze historische stadspoort uit de middeleeuwen'
WHERE id = 3;

UPDATE bingo_tasks SET 
title = 'Wandel door de Altstadt',
description = 'Maak een wandeling door het historische centrum met vakwerkhuizen'
WHERE id = 4;

-- Update challenges with Osnabruck-themed content
UPDATE challenges SET 
title = 'Spreek Plattdeutsch',
description = 'Leer en spreek 5 woorden in het lokale Plattdeutsch dialect',
type = 'creative'
WHERE id = 1;

UPDATE challenges SET 
title = 'Vind een Currywurst stand',
description = 'Zoek en eet een authentieke Duitse Currywurst binnen 30 minuten',
type = 'eating',
time_limit = 30
WHERE id = 2;

UPDATE challenges SET 
title = 'Ontdek de Friedensaal',
description = 'Bezoek de Vredeszaal waar de Vrede van Westfalen werd getekend in 1648',
type = 'historical'
WHERE id = 3;

-- Update treasure hunt with Osnabruck locations
UPDATE treasure_hunt SET 
location_name = 'Marktplatz Osnabrück'
WHERE id = 1;

UPDATE treasure_hunt SET 
location_name = 'Zoo Osnabrück'
WHERE id = 2;

UPDATE treasure_hunt SET 
location_name = 'Museum am Schölerberg'
WHERE id = 3;