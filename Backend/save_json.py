import re
import json

def save_result(response: str, output_path: str):
    """
    Extracts the first JSON object from an LLM response (stripping out any markdown fences
    or stray text), parses it, and writes it as pretty-printed JSON to output_path.
    
    Raises:
        ValueError: If no valid JSON object can be found or parsed.
    """
    # 1. Strip markdown fences like ```json ... ``` or ```
    fence_pattern = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)
    match = fence_pattern.search(response)
    text = match.group(1) if match else response

    # 2. Find the outermost JSON braces
    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end == -1 or start >= end:
        raise ValueError("No JSON object found in response")

    json_str = text[start:end+1]

    # 3. Parse the JSON
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        # Provide context for easier debugging
        snippet = json_str[:200] + ('…' if len(json_str) > 200 else '')
        raise ValueError(f"Failed to decode JSON. Snippet:\n{snippet}\nError: {e}") from e

    # 4. Write it out nicely
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)