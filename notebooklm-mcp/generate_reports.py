
import subprocess
import sys
import os
import json
import re

notebook_id = "222f385d-b97d-420a-88eb-662a8c1d2b81"
nlm_path = os.path.join(os.getcwd(), ".venv", "Scripts", "nlm.exe")

def clean_response(raw_output):
    """
    Extracts the markdown content from the raw CLI output.
    """
    try:
        # Simple heuristic: The CLI output for query often wraps the answer in JSON-like structure
        # or printed text. If it's pure text, return it.
        # If it's the complex Google JSON, parsing it is hard. 
        # But we observed in previous steps that the answer text is usually clear.
        
        # In step 451/485, the output was a JSON string starting with )]}'
        # containing "raw_response".
        # We reused the logic from extract_manual_v2.py
        
        # Check if it looks like the messy JSON
        if ")]}'" in raw_output or '["wrb.fr"' in raw_output:
            # Re-implement the extraction logic
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
    
        # Fallback: if we can't parse it nicely, just return the raw output 
        # (maybe stripped of obvious JSON chars if it's messy)
        return raw_output

    except Exception as e:
        print(f"Error cleaning response: {e}")
        return raw_output

def run_query(question):
    print(f"Querying: {question}...")
    cmd = [nlm_path, "query", "notebook", notebook_id, question]
    # We use utf-8 for input/output to avoid encoding issues
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    
    result = subprocess.run(cmd, capture_output=True)
    
    # helper for decoding
    def decode_output(data):
        try: return data.decode('utf-8')
        except: return data.decode('cp949', errors='replace')

    output = decode_output(result.stdout)
    if not output.strip():
        # sometimes error is in stderr?
        output = decode_output(result.stderr)
        
    return clean_response(output)

def create_note(title, content):
    print(f"Creating Note: {title}...")
    cmd = [
        nlm_path, "note", "create", notebook_id, 
        "--title", title,
        "--content", content
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

# 1. Product Development
question1 = "수익화 가능한 유아용품 개발 아이디어와 전략을 제안해줘. 트렌드와 수익성 분석을 포함해서."
content1 = run_query(question1)
if content1 and len(content1) > 50:
    create_note("수익화 가능한 유아용품 개발", content1)
else:
    print("Failed to get valid content for Product Development")
    print("Raw output snippet:", content1[:200])

print("-" * 30)

# 2. Product Sourcing
question2 = "인기 유아용품 소싱 리스트와 선정 기준을 알려줘. 어떤 제품이 잘 팔리는지, 소싱할 때 주의할 점은 무엇인지."
content2 = run_query(question2)
if content2 and len(content2) > 50:
    create_note("인기 유아용품 소싱", content2)
else:
    print("Failed to get valid content for Product Sourcing")
    print("Raw output snippet:", content2[:200])
