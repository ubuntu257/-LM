
import subprocess
import sys
import os

notebook_id = "222f385d-b97d-420a-88eb-662a8c1d2b81"

# Path to nlm executable
nlm_path = os.path.join(os.getcwd(), ".venv", "Scripts", "nlm.exe")

cmd = [
    nlm_path,
    "note",
    "list",
    notebook_id
]

print(f"Executing: {' '.join(cmd)} ...")
try:
    # Force output capture
    result = subprocess.run(cmd, capture_output=True)

    # Decode safely
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
