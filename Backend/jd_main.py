PROMPT = """
You are a JSON-extraction engine. Convert the following raw job posting text into exactly the JSON schema below:
— Do not add any extra fields or prose.
— Use “YYYY-MM-DD” for all dates.
— Ensure any URLs (website, applyLink) conform to URI format.
— Do not change the structure or key names; output only valid JSON matching the schema.
- Do not format the response in Markdown or any other format. Just output raw JSON.

Schema:
```json
{0}
```

Job Posting:
{1}

Note: Please output only a valid JSON matching the EXACT schema with no surrounding commentary.
"""

def main():
    from pdf_to_text import extract_pdf
    from ollama_client import query_ollama
    from save_json import save_result

    # --- Config ---
    jd_pdf_path = "/Users/siddharthjain/Downloads/HR_Executive.pdf"
    schema_path = "schemas/json/extracted_jd_format.json"
    output_json = "llm_extracted_jd.json"
    model_name = "gemma3:4b"
    
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = f.read()
        
    print("Extracting PDF...")
    jd_text, jd_links = extract_pdf(jd_pdf_path)
    
    full_prompt = PROMPT.format(schema, jd_text + "\n\nLinks:\n" + "\n".join(jd_links))
    
    print("Querying Ollama...")
    response = query_ollama(model_name, full_prompt)
    
    print("Saving result...")
    save_result(response, output_json)
    
    print(f"Done. Result saved to {output_json}")   
    

if __name__ == "__main__":  
    main()