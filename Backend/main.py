from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import docx
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file_bytes):
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

def extract_text_from_docx(file_bytes):
    doc = docx.Document(io.BytesIO(file_bytes))
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    contents = await file.read()
    file_type = file.filename.split(".")[-1].lower()

    if file_type == "pdf":
        extracted_text = extract_text_from_pdf(contents)
    elif file_type == "docx":
        extracted_text = extract_text_from_docx(contents)
    else:
        return {"error": "Unsupported file type. Upload a PDF or DOCX file."}

    return {
        "filename": file.filename,
        "type": file.content_type,
        "extracted_text": extracted_text[:1000] + "..."  # preview only
    }

@app.get("/")
def home():
    return {"message": "FastAPI is running 🚀"}
