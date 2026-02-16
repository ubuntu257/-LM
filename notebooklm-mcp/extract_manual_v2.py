
import json
import re

try:
    with open('pet_expo_manual_raw.txt', 'r', encoding='utf-16') as f:
        content = f.read()
except UnicodeError:
    with open('pet_expo_manual_raw.txt', 'r', encoding='utf-8') as f:
        content = f.read()

try:
    data = json.loads(content)
    raw = data.get('raw_response', '')
    
    # The raw_response seems to be a series of JSON arrays, possibly streamed.
    # It starts with )]}' which is a common prefix for Google's JSON responses to prevent execution.
    # We need to extract the actual text content.
    # Based on the snippet: "[[\\\"**Defining the Pet Expo**...
    
    # Let's try to find the longest string that looks like the manual content
    # It seems to be inside a nested JSON string.
    
    # Simple heuristic: extract all strings and join them if they look like content?
    # Or cleaner: parse the JSON inside the string.
    
    # Remove prefix )]}'
    if raw.startswith(")]}'"):
        raw = raw[4:].strip()
    
    # It might be multiple JSON objects separated by newlines and numbers (length prefix)
    # e.g. 855\n[...]
    
    # Let's clean up and find the main content.
    # The content seems to be in markdown format (**Title**).
    
    # Regex to find markdown-like content
    # Look for "[[... string ...]]" pattern
    
    # Just printing the raw_response to a file might be easier to debug, or try to decode the JSON string manually
    
    # Let's try to parse the first valid JSON array found
    match = re.search(r'\[\["wrb.fr",null,"(.*?)",null', raw, re.DOTALL)
    if match:
        inner_json_str = match.group(1)
        # unescape the string
        inner_json = json.loads(f'"{inner_json_str}"') # hacky decode? No, standard string decode
        # actually match.group(1) is the content of the string literal... but it's doubly escaped?
        # Let's just print it raw first to see
        
        # Actually, simpler approach:
        # The content we want is the long markdown text.
        # Let's just Regex for it.
        pass

    # New plan:
    # The response form is: ... "[[ \"CONTENT\" ...
    # We can try to extract the content by finding the large string starting with **
    
    manual_content = ""
    # Find all strings that look like markdown headers
    # match = re.findall(r'(\*\*.*?\*\*)', raw)
    
    # Let's try to extract the main response text block
    # It typically starts after "wrb.fr",null,"
    
    start_marker = 'wrb.fr",null,"'
    parts = raw.split(start_marker)
    
    full_text = []
    
    for part in parts[1:]:
        # The content is a JSON string, which ends with ",null,[
        end_marker = '",null,['
        if end_marker in part:
            content_str = part.split(end_marker)[0]
            # Decode JSON string escapes
            try:
                # Wrap in quotes to make it a valid JSON string for decoding
                decoded = json.loads(f'"{content_str}"')
                full_text.append(decoded)
            except:
                full_text.append(content_str)
                
    final_manual = "\n".join(full_text)
    # Clean up double escaped newlines just in case
    print(final_manual.replace('\\n', '\n'))
    
except Exception as e:
    print(f"Error parsing: {e}")
    # Fallback: print raw content
    print(content)
