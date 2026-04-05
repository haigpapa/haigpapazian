with open('index.html', 'r') as f:
    target_content = f.read()

with open('/tmp/old_index_end.txt', 'r') as f:
    source_content = f.read()

# Find the start of the section we want to replace in target
start_idx = target_content.find("hamburger?.addEventListener('click'")
if start_idx == -1:
    print("Could not find start index in index.html")
    exit(1)

# Find the same section in the source
src_start_idx = source_content.find("hamburger?.addEventListener('click'")
if src_start_idx == -1:
    print("Could not find start index in source")
    exit(1)

# Create the new content
new_content = target_content[:start_idx] + source_content[src_start_idx:]
new_content += "\n<script src=\"nav.js\"></script>\n" # Ensure nav.js is injected

with open('index.html', 'w') as f:
    f.write(new_content)

print("Fixed index.html successfully")
