SYSTEM_PROMPT = PROMPT = """
You are a JSON extraction engine. Convert the following resume text into precisely the JSON schema specified below.
- Do not compose any extra fields or commentary.
- Do not make up values for any fields.
- Use "Present" if an end date is ongoing.
- Make sure dates are in YYYY-MM-DD.
- Do not format the response in Markdown or any other format. Just output raw JSON.

Schema:
```json
{0}
```

Resume:
```text
{1}
```

NOTE: Please output only a valid JSON matching the EXACT schema.
"""

def main():
    from pdf_to_text import extract_pdf
    from ollama_client import query_ollama
    from save_json import save_result

    # --- Config ---
    pdf_path = "/Users/siddharthjain/Downloads/Siddharth Jain.pdf"
    schema_path = "schemas/json/extracted_resume_format.json"
    output_json = "llm_extracted_resume.json"
    model_name = "gemma3:4b"
    
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = f.read()

    # --- Workflow ---
    print("Extracting PDF...")
    resume_text = extract_pdf(pdf_path)
    
    full_prompt = SYSTEM_PROMPT.format(schema, resume_text)

    print("Querying Ollama...")
    response = query_ollama(model_name, full_prompt)

    print("Saving result...")
    save_result(response, output_json)

    print(f"Done. Result saved to {output_json}")

if __name__ == "__main__":
    main()
