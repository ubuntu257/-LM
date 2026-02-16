
import json
import sys

# Try multiple encodings
encodings = ['utf-16', 'utf-8', 'cp949']
content = None

for enc in encodings:
    try:
        with open('pet_expo_manual_raw.txt', 'r', encoding=enc) as f:
            content = f.read()
        break
    except (UnicodeError, FileNotFoundError):
        continue

if content is None:
    print("Error: Could not read file")
    sys.exit(1)

try:
    # Try to parse as JSON
    data = json.loads(content)
    if isinstance(data, dict):
        # Look for the answer in likely fields
        # verify from previous step 471 output, it seems to be in the root or raw_response
        # actually step 471 was truncated, but usually these CLI tools output 'content' or 'answer'
        # Let's inspect the keys if we can
        pass
        
    print(content) 
except json.JSONDecodeError:
    # If not JSON, just print the content
    print(content)
