
import subprocess
import sys
import os

notebook_id = "222f385d-b97d-420a-88eb-662a8c1d2b81"
title = "펫박람회 운영 메뉴얼"
file_path = r"c:\Users\ubunt\.gemini\antigravity\brain\2e350998-e263-47ca-9339-15bfcb37729b\pet_expo_manual.md"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except Exception as e:
    print(f"Error reading file: {e}")
    sys.exit(1)

# Path to nlm executable
nlm_path = os.path.join(os.getcwd(), ".venv", "Scripts", "nlm.exe")

cmd = [
    nlm_path,
    "note",
    "create",
    notebook_id,
    "--content", content,
    "--title", title
]

print(f"Executing: {' '.join(cmd[:3])} ...")
try:
    # Don't specify text=True or encoding, capture bytes
    result = subprocess.run(cmd, capture_output=True)

    # Try decoding with cp949 (Windows default) or utf-8, fallback to replace
    try:
        stdout = result.stdout.decode('cp949')
    except:
        stdout = result.stdout.decode('utf-8', errors='replace')
        
    try:
        stderr = result.stderr.decode('cp949')
    except:
        stderr = result.stderr.decode('utf-8', errors='replace')

    if result.returncode == 0:
        print("Success!")
        print(stdout)
    else:
        print("Failed!")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
except Exception as e:
    print(f"Execution Error: {e}")
