
import subprocess
import sys
import os

notebook_id = "222f385d-b97d-420a-88eb-662a8c1d2b81"
nlm_path = os.path.join(os.getcwd(), ".venv", "Scripts", "nlm.exe")

question = "수익화 가능한 유아용품 개발 아이디어와 전략을 제안해줘. 트렌드와 수익성 분석을 포함해서."

cmd = [nlm_path, "query", "notebook", notebook_id, question]

print(f"Querying: {question}...")
with open("product_dev_raw.txt", "w", encoding="utf-8") as f:
    # Use shell=True might help with environment? No, subprocess list is safer.
    # But we need to handle encoding.
    try:
        result = subprocess.run(cmd, capture_output=True)
        # Decode and write
        def decode(b):
            try: return b.decode('utf-8')
            except: return b.decode('cp949', errors='replace')
        
        output = decode(result.stdout)
        if not output.strip():
            output = decode(result.stderr)
            
        f.write(output)
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")
