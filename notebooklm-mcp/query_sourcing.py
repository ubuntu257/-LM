
import subprocess
import sys
import os

notebook_id = "222f385d-b97d-420a-88eb-662a8c1d2b81"
nlm_path = os.path.join(os.getcwd(), ".venv", "Scripts", "nlm.exe")

question = "인기 유아용품 소싱 리스트와 선정 기준을 알려줘. 어떤 제품이 잘 팔리는지, 소싱할 때 주의할 점은 무엇인지."

cmd = [nlm_path, "query", "notebook", notebook_id, question]

print(f"Querying: {question}...")
with open("product_sourcing_raw.txt", "w", encoding="utf-8") as f:
    try:
        result = subprocess.run(cmd, capture_output=True)
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
