from fastapi import FastAPI, UploadFile, File, Form, Body, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import shutil
import os
import json
import nltk
from sqlalchemy.orm import Session
from typing import List

from app import crud, models, schemas
from app.database import SessionLocal, engine
from app.schemas import JDModel, CVModel
from app.parsing import extract_text_from_file, clean_resume_json
from app.llm import convert_jd_to_json, convert_resume_to_json, generate_interview_questions
from app.matching import compute_similarity, get_match_level

models.Base.metadata.create_all(bind=engine)

# NLTK setup
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')
try:
    nltk.data.find('corpora/omw-1.4')
except LookupError:
    nltk.download('omw-1.4')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/extract_jd")
async def extract_jd(jd_file: UploadFile = File(...)):
    with tempfile.TemporaryDirectory() as tmpdir:
        jd_path = os.path.join(tmpdir, jd_file.filename)
        with open(jd_path, "wb") as f:
            shutil.copyfileobj(jd_file.file, f)
        jd_text = extract_text_from_file(jd_path)
        jd_json = convert_jd_to_json(jd_text)
        if not jd_json:
            return JSONResponse(status_code=400, content={"error": "Failed to extract JD JSON"})
        return jd_json


@app.post("/extract_resumes")
async def extract_resumes(
    resume_files: list[UploadFile] = File(...),
    jd_json: str = Form(...)
):
    jd_json = json.loads(jd_json)
    required_skills = jd_json.get("requiredSkills", [])
    skill_categories = None
    if isinstance(required_skills, dict):
        skill_categories = required_skills
    
    results = []
    with tempfile.TemporaryDirectory() as tmpdir:
        for resume_file in resume_files:
            resume_path = os.path.join(tmpdir, resume_file.filename)
            with open(resume_path, "wb") as f:
                shutil.copyfileobj(resume_file.file, f)
            resume_text = extract_text_from_file(resume_path)
            resume_json = convert_resume_to_json(resume_text, skill_categories)
            if not resume_json:
                continue
            resume_json = clean_resume_json(resume_json)
            if skill_categories:
                resume_json["skill_presence"] = ensure_complete_skill_presence(
                    resume_json.get("skill_presence", {}), 
                    skill_categories
                )
            results.append({
                "cv_json": resume_json,
                "skill_presence": resume_json.get("skill_presence", {})
            })
    return results

@app.post("/match")
async def match(
    jd_json: dict = Body(...),
    cvs: list = Body(...),
    db: Session = Depends(get_db)
):
    required_skills = jd_json.get("requiredSkills", [])
    skill_categories = None
    if isinstance(required_skills, dict):
        skill_categories = required_skills
        flat_skills = [s for cat in required_skills.values() for s in cat]
        jd_json_flat = {**jd_json, "requiredSkills": flat_skills}
    else:
        flat_skills = required_skills
        jd_json_flat = jd_json

    jd_obj = JDModel.parse_obj(jd_json_flat)
    
    # Save JD to DB
    db_jd = crud.get_or_create_job_description(db=db, jd=jd_obj)

    results = []
    for cv_entry in cvs:
        cv_json = cv_entry["cv_json"]
        skill_presence = cv_entry.get("skill_presence", {})
        cv_obj = CVModel.parse_obj(cv_json)

        # Save candidate to DB
        db_candidate = crud.get_or_create_candidate(db=db, cv=cv_obj)

        # Filtering, matching, etc. (existing logic)
        filter_status = {"passed": True, "reason": ""}
        # ... (rest of the filtering logic)

        score, details = compute_similarity(jd_obj, cv_obj)
        
        # This part reconstructs all the details needed by the frontend
        present = [s for s in flat_skills if skill_presence.get(s, False)]
        absent = [s for s in flat_skills if not skill_presence.get(s, False)]
        critical_skills = skill_categories.get("critical", []) if skill_categories else []
        critical_present = [s for s in critical_skills if skill_presence.get(s, False)]
        critical_absent = [s for s in critical_skills if not skill_presence.get(s, False)]
        
        if len(critical_absent) == 0 and len(critical_present) > 0:
            critical_skill_status = "All Present"
        elif len(critical_present) == 0 and len(critical_absent) > 0:
            critical_skill_status = "All Absent"
        else:
            critical_skill_status = "Partial Present"
        
        disclaimer = "Disclaimer: None of the critical required skills are present in this CV." if critical_skill_status == "All Absent" else None

        result_data = {
            "candidate_id": cv_obj.UUID,
            "candidate_name": f"{cv_obj.Personal_Data.firstName or ''} {cv_obj.Personal_Data.lastName or ''}".strip(),
            "match_score": round(score * 100, 2),
            "match_level": get_match_level(score),
            "match_details": details,
            "critical_skill_status": critical_skill_status,
            "critical_present": critical_present,
            "critical_absent": critical_absent,
            "present_skills": present,
            "absent_skills": absent,
            "disclaimer": disclaimer,
            "job_stability": cv_obj.Analytics.job_stability,
            "education_gap": cv_obj.Analytics.education_gap,
            "suggested_role": cv_obj.Analytics.suggested_role,
            "interview_questions": generate_interview_questions(jd_obj, cv_obj),
            "skill_presence": skill_presence,
            "filter_status": filter_status
        }
        results.append(result_data)

        # Save analysis result to DB, ensuring details are stored
        crud.create_analysis_result(
            db=db, 
            jd_db_id=db_jd.id, 
            candidate_db_id=db_candidate.id, 
            result={
                "match_score": result_data["match_score"],
                "match_level": result_data["match_level"],
                "match_details": result_data["match_details"]
            }
        )

    results = sorted(results, key=lambda x: x["match_score"], reverse=True)
    return {
        "results": results,
        "matching_metadata": {
            "job_title": jd_obj.jobTitle,
            "candidates_evaluated": len(results),
            "top_match_score": results[0]["match_score"] if results else 0,
            "average_match_score": round(sum(r["match_score"] for r in results) / len(results), 2) if results else 0
        }
    }

@app.get("/jds", response_model=List[schemas.JobDescription])
def read_jds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jds = crud.get_jds(db, skip=skip, limit=limit)
    return jds

@app.get("/jds/{jd_id}/results", response_model=List[schemas.AnalysisResult])
def read_jd_results(jd_id: int, db: Session = Depends(get_db)):
    results = crud.get_jd_results(db, jd_id=jd_id)
    return results


def ensure_complete_skill_presence(skill_presence: dict, skill_categories: dict) -> dict:
    """Ensure all skills from categories are present in skill_presence with boolean values"""
    if not skill_presence:
        skill_presence = {}
    
    all_skills = [skill for category_skills in skill_categories.values() for skill in category_skills]
    
    for skill in all_skills:
        if skill not in skill_presence:
            skill_presence[skill] = False
        elif not isinstance(skill_presence[skill], bool):
            skill_presence[skill] = bool(skill_presence[skill])
    
    return skill_presence

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
