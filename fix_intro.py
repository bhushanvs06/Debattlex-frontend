import re

with open(r"src\Components\Intro\intro.jsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
new_lines = []
image_map = {}

for line in lines:
    if line.strip() == 'type MotionValue,':
        continue
    
    img_match = re.match(r'import\s+(\w+)\s+from\s+["\'].*?/([^/]+?\.(?:jpg|png|json|svg|jpeg))["\'];?', line)
    if img_match:
        var_name = img_match.group(1)
        filename = img_match.group(2)
        if filename.endswith('.asset.json'):
            filename = filename.replace('.asset.json', '')
        image_map[var_name] = f'/intro/{filename}'
        continue
    
    new_lines.append(line)

content = '\n'.join(new_lines)

for var_name, path in image_map.items():
    content = re.sub(rf'\b{var_name}\.url\b', f'"{path}"', content)
    content = re.sub(rf'\b{var_name}\b', f'"{path}"', content)

content = re.sub(r'useRef\s*<\s*[A-Za-z0-9_]+\s*(?:\|\s*null\s*)?>\s*\(', 'useRef(', content)
content = re.sub(r'useRef\s*<\s*[A-Za-z0-9_]+\s*>\s*\(', 'useRef(', content)
content = re.sub(r':\s*{\s*className\??:\s*string\s*}', '', content)
content = re.sub(r':\s*{\s*density\??:\s*number;\s*hue\??:\s*number\s*}', '', content)
content = re.sub(r'\(e:\s*MouseEvent\)', '(e)', content)
content = re.sub(r'progress:\s*MotionValue<number>', 'progress', content)
content = re.sub(r':\s*{\s*progress:\s*MotionValue<number>\s*}', '', content)
content = re.sub(r':\s*{\s*label:\s*string;\s*from:\s*number;\s*to:\s*number;\s*suffix\??:\s*string;\s*color\??:\s*string;\s*progress:\s*MotionValue<number>;?\s*}', '', content)
content = re.sub(r':\s*{\s*delay\??:\s*number\s*}', '', content)
content = re.sub(r':\s*{\s*children:\s*React\.ReactNode;\s*variant\??:\s*"[^"]+"\s*\|\s*"[^"]+"\s*\|\s*"[^"]+";\s*href\??:\s*string;\s*className\??:\s*string;?\s*}', '', content)

with open(r"src\Components\Intro\intro.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Conversion complete.")
