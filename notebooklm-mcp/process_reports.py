
import json
import os

def clean_response(raw_output):
    try:
        if isinstance(raw_output, str) and (")]}'" in raw_output or '["wrb.fr"' in raw_output):
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

def process_file(input_file, output_file, title):
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeError:
         with open(input_file, "r", encoding="cp949") as f:
            content = f.read()

    clean_content = clean_response(content)
    
    # Add title header if missing
    if not clean_content.strip().startswith("#"):
        clean_content = f"# {title}\n\n{clean_content}"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(clean_content)
    print(f"Processed {input_file} -> {output_file}")

# Process Development Report
process_file(
    "product_dev_raw.txt", 
    r"c:\Users\ubunt\.gemini\antigravity\brain\2e350998-e263-47ca-9339-15bfcb37729b\baby_product_development.md",
    "수익화 가능한 유아용품 개발"
)

# Process Sourcing Report
process_file(
    "product_sourcing_raw.txt", 
    r"c:\Users\ubunt\.gemini\antigravity\brain\2e350998-e263-47ca-9339-15bfcb37729b\baby_product_sourcing.md",
    "인기 유아용품 소싱"
)
