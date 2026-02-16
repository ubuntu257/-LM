
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
            
        # Skip header if present (lines starting with # or empty)
        lines = content.splitlines()
        json_start = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('{'):
                json_start = i
                break
        
        if json_start != -1:
            json_text = "\n".join(lines[json_start:])
            try:
                data = json.loads(json_text)
                if "value" in data and "answer" in data["value"]:
                    clean_text = data["value"]["answer"]
                    
                    # Restore header if it existed
                    header = "\n".join(lines[:json_start]).strip()
                    if header:
                        final_content = f"{header}\n\n{clean_text}"
                    else:
                        final_content = clean_text
                        
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(final_content)
                    print(f"Fixed {os.path.basename(file_path)}")
                else:
                    print(f"No answer field in {os.path.basename(file_path)}")
            except json.JSONDecodeError as e:
                print(f"JSON Parse Error in {os.path.basename(file_path)}: {e}")
        else:
            print(f"No JSON start found in {os.path.basename(file_path)}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
