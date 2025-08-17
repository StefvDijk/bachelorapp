-- Create table for bingo tasks
CREATE TABLE public.bingo_tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for treasure hunt progress
CREATE TABLE public.treasure_hunt (
  id SERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  found BOOLEAN DEFAULT FALSE,
  found_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for challenges
CREATE TABLE public.challenges (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  photo_url TEXT,
  time_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for webhook settings
CREATE TABLE public.webhook_settings (
  id SERIAL PRIMARY KEY,
  zapier_webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (we'll make everything public since it's just for Jelle)
ALTER TABLE public.bingo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasure_hunt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (public access since no authentication)
CREATE POLICY "Allow all operations on bingo_tasks" ON public.bingo_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on treasure_hunt" ON public.treasure_hunt FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on webhook_settings" ON public.webhook_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert initial bingo tasks
INSERT INTO public.bingo_tasks (title, description) VALUES
('Maak een selfie met een politieagent', 'Vraag vriendelijk of je een foto mag maken'),
('Drink een biertje in café de Kleine Veer', 'Het stamcafé van SC Cambuur supporters'),
('Maak een foto bij het Cambuurstadion', 'Voor de hoofdingang van het stadion'),
('Eet een frikandel bij een snackbar', 'Een echte Friese traditie'),
('Maak een groepsfoto met 5 onbekenden', 'Leg uit dat je een spelletje speelt'),
('Vind iemand die ook van SC Cambuur is', 'Praat over de club'),
('Maak een foto bij de Oldehove', 'De bekende scheve toren van Leeuwarden'),
('Zing het Cambuur lied op straat', 'Laat je Cambuur hart spreken'),
('Koop iets geel-blauw', 'In de clubkleuren van Cambuur');

-- Insert initial treasure hunt locations
INSERT INTO public.treasure_hunt (location_name) VALUES
('Oldehove (Scheve toren)'),
('Prinsentuin'),
('Natuurmuseum Fryslân'),
('Wilhelminaplein'),
('Ruiterskwartier');

-- Insert initial challenges
INSERT INTO public.challenges (title, description, type, time_limit) VALUES
('Doe 20 push-ups', 'Laat zien hoe fit je bent!', 'fitness', 120),
('Zing 30 seconden lang', 'Kies je favoriete lied', 'performance', 60),
('Vertel een mop', 'Maak iemand aan het lachen', 'social', 180);

-- Insert webhook settings (empty initially)
INSERT INTO public.webhook_settings (zapier_webhook_url, is_active) VALUES (NULL, FALSE);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_bingo_tasks_updated_at
  BEFORE UPDATE ON public.bingo_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_settings_updated_at
  BEFORE UPDATE ON public.webhook_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();