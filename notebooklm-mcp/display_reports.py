
import json
import os

files = [
    r"c:\Users\ubunt\.gemini\antigravity\brain\2e350998-e263-47ca-9339-15bfcb37729b\baby_product_development.md",
    r"c:\Users\ubunt\.gemini\antigravity\brain\2e350998-e263-47ca-9339-15bfcb37729b\baby_product_sourcing.md"
]

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # The file content seems to be:
        # # Title
        # 
        # { "value": { "answer": "..." } }
        
        # We need to extract the JSON part.
        # Find the first '{'
        start_idx = content.find('{')
        if start_idx != -1:
            json_str = content[start_idx:]
            data = json.loads(json_str)
            if "value" in data and "answer" in data["value"]:
                print(f"\n{'='*20} REPORT START {'='*20}\n")
                print(f"SOURCE: {os.path.basename(file_path)}\n")
                print(data["value"]["answer"])
                print(f"\n{'='*20} REPORT END {'='*20}\n")
            else:
                 print(f"Could not find answer in {file_path}")
        else:
            print(f"No JSON found in {file_path}")

    except Exception as e:
        print(f"Error reading {file_path}: {e}")
