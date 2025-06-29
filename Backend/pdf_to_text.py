# /// script
# dependencies = [
#   "PyMuPDF",
# ]
# ///

import fitz  # PyMuPDF

def extract_pdf(pdf_path):
    """
    Extract all text from a PDF file.
    Returns the complete text content and a list of all links found.
    """
    doc = fitz.open(pdf_path)
    
    full_text = ""
    all_links = []
    for page in doc:
        full_text += page.get_text() + "\n"
        # Extract links from the page
        links = page.get_links()
        for link in links:
            uri = link.get("uri")
            if uri:
                all_links.append(uri)
    
    doc.close()
    
    clean_text = '\n'.join(line.strip() for line in full_text.split('\n') if line.strip())
    
    return clean_text, all_links

# # Main code
# pdf_file = "/Users/siddharthjain/Downloads/Siddharth Jain.pdf"

# print("Extracting PDF content...")
# text, links = extract_pdf(pdf_file)

# if text:
#     print("PDF TEXT:")
#     print(text)
# else:
#     print("Could not extract text from PDF.")

# if links:
#     print("\nPDF LINKS:")
#     for link in links:
#         print(link)
# else:
#     print("\nNo links found in PDF.")