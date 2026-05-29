insert into public.events (name, slug, practice_type, season_year, description) values
  ('Anatomy and Physiology', 'anatomy-and-physiology', 'quiz',   2027, 'Identify anatomical structures, solve physiology problems, and diagnose conditions across body systems.'),
  ('Disease Detectives',     'disease-detectives',     'quiz',   2027, 'Investigate disease outbreaks using epidemiological methods and public health data analysis.'),
  ('Forensics',              'forensics',              'hybrid', 2027, 'Analyze physical evidence using chemistry, biology, and physics to solve forensic case studies.'),
  ('Codebusters',            'codebusters',            'quiz',   2027, 'Decode messages using classical and modern cryptographic techniques and cipher systems.'),
  ('Helicopter',             'helicopter',             'build',  2027, 'Design, build, and fly a rubber-band-powered helicopter for maximum flight time.'),
  ('Trajectory',             'trajectory',             'build',  2027, 'Build a device that launches a projectile to land as close as possible to a target.')
on conflict (slug) do update set
  season_year = excluded.season_year,
  description = excluded.description;
