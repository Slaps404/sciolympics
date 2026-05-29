-- Add description column to events and update to 2027 season
alter table public.events add column if not exists description text;

-- Update season year to 2027 and add descriptions
update public.events set season_year = 2027, description = 'Identify anatomical structures, solve physiology problems, and diagnose conditions across body systems.' where slug = 'anatomy-and-physiology';
update public.events set season_year = 2027, description = 'Investigate disease outbreaks using epidemiological methods and public health data analysis.' where slug = 'disease-detectives';
update public.events set season_year = 2027, description = 'Analyze physical evidence using chemistry, biology, and physics to solve forensic case studies.' where slug = 'forensics';
update public.events set season_year = 2027, description = 'Decode messages using classical and modern cryptographic techniques and cipher systems.' where slug = 'codebusters';
update public.events set season_year = 2027, description = 'Design, build, and fly a rubber-band-powered helicopter for maximum flight time.' where slug = 'helicopter';
update public.events set season_year = 2027, description = 'Build a device that launches a projectile to land as close as possible to a target.' where slug = 'trajectory';
