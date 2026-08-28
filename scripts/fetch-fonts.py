"""
Pulls the Inter subsets the site actually needs out of the Google Fonts CSS and
stores them in the repository, so a visitor's browser never contacts Google.
Prints the @font-face rules to paste into the stylesheet, unicode-range included.
"""
import re, subprocess, pathlib, sys

OUT = pathlib.Path('/home/user/Gedmma-app/apps/web/public/fonts')
OUT.mkdir(parents=True, exist_ok=True)
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
CSS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'

css = subprocess.run(['curl', '-sS', '-A', UA, CSS], capture_output=True, text=True, check=True).stdout

blocks = re.findall(r'/\*\s*([a-z-]+)\s*\*/\s*@font-face\s*\{(.*?)\}', css, re.S)
wanted = {'latin', 'latin-ext'}
seen = {}
for subset, body in blocks:
    if subset not in wanted:
        continue
    url = re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1)
    rng = re.search(r'unicode-range:\s*([^;]+);', body).group(1).strip()
    weight = re.search(r'font-weight:\s*([^;]+);', body).group(1).strip()
    if subset in seen:
        assert seen[subset]['url'] == url, f'{subset}: weight {weight} uses a different file - not a variable font'
        seen[subset]['weights'].append(weight)
        continue
    seen[subset] = {'url': url, 'range': rng, 'weights': [weight]}

for subset, info in seen.items():
    name = f'inter-{subset}.woff2'
    subprocess.run(['curl', '-sS', '-A', UA, '-o', str(OUT / name), info['url']], check=True)
    size = (OUT / name).stat().st_size
    head = (OUT / name).open('rb').read(4)
    assert head == b'wOF2', f'{name} is not a woff2 file'
    print(f'# {name}  {size/1024:.0f} kB  weights on Google: {", ".join(info["weights"])}', file=sys.stderr)
    print(f"""@font-face {{
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/{name}") format("woff2-variations"), url("/fonts/{name}") format("woff2");
  unicode-range: {info['range']};
}}""")
