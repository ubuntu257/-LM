
import subprocess
import sys
import os
import json

notebook_id = "222f385d-b97d-420a-88eb-662a8c1d2b81"
title = "수익화 가능한 유아용품 개발"
nlm_path = os.path.join(os.getcwd(), ".venv", "Scripts", "nlm.exe")

def clean_response(raw_output):
    try:
        if ")]}'" in raw_output or '["wrb.fr"' in raw_output:
            start_marker = 'wrb.fr",null,"'
            parts = raw_output.split(start_marker)
            full_text = []

            for part in parts[1:]:
                end_marker = '",null,['
                if end_marker in part:
                    content_str = part.split(end_marker)[0]
                    try:
                        decoded = json.loads(f'"{content_str}"')
                        full_text.append(decoded)
                    except:
                        full_text.append(content_str)
            
            if full_text:
                return "\n".join(full_text).replace('\\n', '\n')
    
        return raw_output

    except Exception as e:
        print(f"Error cleaning response: {e}")
        return raw_output

try:
    with open("product_dev_raw.txt", "r", encoding="utf-8") as f:
        # It might be cp949 encoded if written by subprocess on windows default?
        # But we wrote it with utf-8 in query_dev.py. Let's check query_dev.py
        # Yes, we enforced utf-8 writing if decoding worked.
        content = f.read()
except UnicodeError:
     with open("product_dev_raw.txt", "r", encoding="cp949") as f:
        content = f.read()

clean_content = clean_response(content)

if len(clean_content) < 50:
    print("Content too short, aborting note creation.")
    print(clean_content)
    sys.exit(1)

print(f"Creating Note: {title}...")
cmd = [
    nlm_path, "note", "create", notebook_id, 
    "--title", title,
    "--content", clean_content
]
result = subprocess.run(cmd, capture_output=True)

def decode_output(data):
    try: return data.decode('utf-8')
    except: return data.decode('cp949', errors='replace')
    
if result.returncode == 0:
    print(f"Successfully created note: {title}")
else:
    print(f"Failed to create note: {title}")
    print(decode_output(result.stdout))
    print(decode_output(result.stderr))
