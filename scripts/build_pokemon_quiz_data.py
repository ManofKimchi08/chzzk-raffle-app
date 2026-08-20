import json
import urllib.request
import concurrent.futures
import time
import os
import re

CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

def get_chosung(text):
    result = []
    for ch in text:
        code = ord(ch)
        if 0xAC00 <= code <= 0xD7A3:
            idx = (code - 0xAC00) // (21 * 28)
            result.append(CHOSUNG[idx])
        else:
            result.append(ch)
    return ''.join(result)

def get_generation(p_id):
    if p_id <= 151: return 1
    elif p_id <= 251: return 2
    elif p_id <= 386: return 3
    elif p_id <= 493: return 4
    elif p_id <= 649: return 5
    elif p_id <= 721: return 6
    elif p_id <= 809: return 7
    elif p_id <= 905: return 8
    else: return 9

# Load existing pokemon_data.json
base_path = r'C:\Users\dlwjd\.gemini\antigravity\scratch\chzzk-raffle-app\public\pokemon_data.json'
with open(base_path, 'r', encoding='utf-8') as f:
    base_data = json.load(f)

pokemons = base_data.get('pokemons', [])
unique_ids = sorted(list(set(p['id'] for p in pokemons)))
print(f"Total pokemons: {len(pokemons)}, Unique species IDs: {len(unique_ids)}")

def fetch_species_info(species_id):
    url = f"https://pokeapi.co/api/v2/pokemon-species/{species_id}/"
    req = urllib.request.Request(url, headers={'User-Agent': 'ChzzkQuizBuilder/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            
            # Genus
            genus_list = [g['genus'] for g in data.get('genera', []) if g.get('language', {}).get('name') == 'ko']
            genus = genus_list[0] if genus_list else ''
            
            # Flavor texts (Korean)
            flavors = []
            seen = set()
            for f in data.get('flavor_text_entries', []):
                if f.get('language', {}).get('name') == 'ko':
                    txt = f.get('flavor_text', '').replace('\n', ' ').replace('\f', ' ').strip()
                    txt = re.sub(r'\s+', ' ', txt)
                    if txt and txt not in seen:
                        seen.add(txt)
                        version = f.get('version', {}).get('name', 'official')
                        flavors.append({"text": txt, "version": version})
                        
            return species_id, {"genus": genus, "flavors": flavors}
    except Exception as e:
        print(f"Error fetching species {species_id}: {e}")
        return species_id, {"genus": "", "flavors": []}

species_cache = {}
print("Fetching PokeAPI species metadata in parallel...")
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
    future_to_id = {executor.submit(fetch_species_info, sid): sid for sid in unique_ids}
    for future in concurrent.futures.as_completed(future_to_id):
        sid, info = future.result()
        species_cache[sid] = info

print(f"Fetched info for {len(species_cache)} species.")

# Build enriched quiz dataset
quiz_pokemons = []
for p in pokemons:
    pid = p['id']
    name = p['name']
    types = p.get('types', [])
    stats = p.get('stats', {})
    sprite_front = p.get('sprite_front', f"/pokemon/{pid}.png")
    
    spec_info = species_cache.get(pid, {"genus": "", "flavors": []})
    genus = spec_info.get('genus', '')
    flavors = spec_info.get('flavors', [])
    
    # Fallback flavor text if none found
    if not flavors:
        flavors = [{
            "text": f"{name}은(는) {', '.join(types)} 타입의 포켓몬이다. 배틀에서 뛰어난 활약을 펼친다.",
            "version": "기본"
        }]
    if not genus:
        genus = f"{types[0]}포켓몬"
        
    chosung = get_chosung(name)
    gen = get_generation(pid)
    cry_url = f"https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{pid}.ogg"
    
    # Build aliases
    aliases = [name, name.replace(' ', ''), chosung]
    if '메가' in name:
        base_n = name.replace('메가', '').replace('X', '').replace('Y', '').strip()
        if base_n and base_n not in aliases:
            aliases.append(base_n)
            
    quiz_pokemons.append({
        "id": pid,
        "code": p.get('code', str(pid)),
        "name": name,
        "chosung": chosung,
        "aliases": list(set(aliases)),
        "types": types,
        "genus": genus,
        "generation": gen,
        "stats": stats,
        "sprite_front": sprite_front,
        "cry_url": cry_url,
        "pokedex_entries": flavors
    })

quiz_data_output = {
    "version": "1.0.0",
    "total": len(quiz_pokemons),
    "pokemons": quiz_pokemons
}

out_path = r'C:\Users\dlwjd\.gemini\antigravity\scratch\chzzk-raffle-app\public\pokemon_quiz_data.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(quiz_data_output, f, ensure_ascii=False, indent=2)

print(f"Successfully generated {out_path} with {len(quiz_pokemons)} pokemons!")
