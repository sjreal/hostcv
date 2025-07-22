from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import shutil
import os
import json
import nltk

from app.schemas import MatchRequest, JDModel, CVModel
from app.parsing import extract_text_from_file, clean_resume_json
from app.llm import convert_jd_to_json, convert_resume_to_json, generate_interview_questions
from app.matching import compute_similarity, get_match_level

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

@app.post("/match_enhanced")
async def match_enhanced(data: MatchRequest):
    jd = data.jd
    cvs = data.cvs
    
    results = []
    for cv in cvs:
        score, details = compute_similarity(jd, cv)
        match_level = get_match_level(score)
        
        candidate_name = f"{cv.Personal_Data.firstName or ''} {cv.Personal_Data.lastName or ''}".strip()
        interview_questions = generate_interview_questions(jd, cv)
        
        results.append({
            "candidate_id": cv.UUID,
            "candidate_name": candidate_name,
            "match_score": round(score * 100, 2),
            "match_level": match_level,
            "match_details": details,
            "interview_questions": interview_questions,
            "job_stability": cv.Analytics.job_stability,
            "education_gap": cv.Analytics.education_gap,
            "suggested_role": cv.Analytics.suggested_role
        })
    
    results = sorted(results, key=lambda x: x["match_score"], reverse=True)
    
    return {
        "results": results,
        "matching_metadata": {
            "job_id": jd.jobId,
            "job_title": jd.jobTitle,
            "candidates_evaluated": len(cvs),
            "top_match_score": results[0]["match_score"] if results else 0,
            "average_match_score": round(sum(r["match_score"] for r in results) / len(results), 2) if results else 0
        }
    }

def process_json_input(json_data: dict) -> MatchRequest:
    try:
        return MatchRequest(**json_data)
    except Exception as e:
        print(f"Error processing JSON: {e}")
        raise

@app.post("/extract_and_match")
async def extract_and_match(
    jd_file: UploadFile = File(...),
    resume_files: list[UploadFile] = File(...)
):
    with tempfile.TemporaryDirectory() as tmpdir:
        jd_path = os.path.join(tmpdir, jd_file.filename)
        with open(jd_path, "wb") as f:
            shutil.copyfileobj(jd_file.file, f)
        jd_text = extract_text_from_file(jd_path)
        jd_json = convert_jd_to_json(jd_text)
        if not jd_json:
            return JSONResponse(status_code=400, content={"error": "Failed to extract JD JSON"})
        os.makedirs("debug_outputs", exist_ok=True)
        with open("debug_outputs/jd_extracted.json", "w", encoding="utf-8") as f:
            json.dump(jd_json, f, indent=2, ensure_ascii=False)
        cvs = []
        for i, resume_file in enumerate(resume_files):
            resume_path = os.path.join(tmpdir, resume_file.filename)
            with open(resume_path, "wb") as f:
                shutil.copyfileobj(resume_file.file, f)
            resume_text = extract_text_from_file(resume_path)
            resume_json = convert_resume_to_json(resume_text)
            if not resume_json:
                continue
            resume_json = clean_resume_json(resume_json)
            with open(f"debug_outputs/resume_extracted_{i+1}.json", "w", encoding="utf-8") as f:
                json.dump(resume_json, f, indent=2, ensure_ascii=False)
            try:
                cv_obj = CVModel.parse_obj(resume_json)
                cvs.append(cv_obj)
            except Exception as e:
                print(f"❌ Error parsing extracted resume JSON: {e}")
                continue
        try:
            jd_obj = JDModel.parse_obj(jd_json)
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": f"Failed to parse JD JSON: {e}"})
        results = []
        for cv in cvs:
            score, details = compute_similarity(jd_obj, cv)
            match_level = get_match_level(score)
            candidate_name = f"{cv.Personal_Data.firstName or ''} {cv.Personal_Data.lastName or ''}".strip()
            interview_questions = generate_interview_questions(jd_obj, cv)
            results.append({
                "candidate_id": cv.UUID,
                "candidate_name": candidate_name,
                "match_score": round(score * 100, 2),
                "match_level": match_level,
                "match_details": details,
                "interview_questions": interview_questions,
                "job_stability": cv.Analytics.job_stability,
                "education_gap": cv.Analytics.education_gap,
                "suggested_role": cv.Analytics.suggested_role
            })
        results = sorted(results, key=lambda x: x["match_score"], reverse=True)
        return {
            "results": results,
            "matching_metadata": {
                "job_title": jd_obj.jobTitle,
                "candidates_evaluated": len(cvs),
                "top_match_score": results[0]["match_score"] if results else 0,
                "average_match_score": round(sum(r["match_score"] for r in results) / len(results), 2) if results else 0
            }
        }

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
    import json
    jd_json = json.loads(jd_json)
    # Flatten requiredSkills if dict
    required_skills = jd_json.get("requiredSkills", [])
    skill_categories = None
    if isinstance(required_skills, dict):
        skill_categories = required_skills
        flat_skills = [s for cat in required_skills.values() for s in cat]
    else:
        flat_skills = required_skills
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
            
            # Ensure all skills from categories are present in skill_presence
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
    cvs: list = Body(...)
):
    # Flatten requiredSkills if dict
    required_skills = jd_json.get("requiredSkills", [])
    skill_categories = None
    if isinstance(required_skills, dict):
        skill_categories = required_skills
        flat_skills = [s for cat in required_skills.values() for s in cat]
        jd_json = {**jd_json, "requiredSkills": flat_skills}
    else:
        flat_skills = required_skills
    
    jd_obj = JDModel.parse_obj(jd_json)
    results = []
    for cv_entry in cvs:
        cv_json = cv_entry["cv_json"]
        skill_presence = cv_entry.get("skill_presence", {})
        cv_obj = CVModel.parse_obj(cv_json)

        # Age and Gender Filtering
        filter_status = {"passed": True, "reason": ""}
        if jd_obj.age_filter:
            if cv_obj.Personal_Data.age:
                if jd_obj.age_filter.min_age and cv_obj.Personal_Data.age < jd_obj.age_filter.min_age:
                    filter_status = {"passed": False, "reason": f"Age ({cv_obj.Personal_Data.age}) is below minimum ({jd_obj.age_filter.min_age})"}
                if jd_obj.age_filter.max_age and cv_obj.Personal_Data.age > jd_obj.age_filter.max_age:
                    filter_status = {"passed": False, "reason": f"Age ({cv_obj.Personal_Data.age}) is above maximum ({jd_obj.age_filter.max_age})"}
            else:
                filter_status = {"passed": False, "reason": "Age not found in CV"}
        
        if filter_status["passed"] and jd_obj.gender_filter and jd_obj.gender_filter.lower() != 'any':
            if cv_obj.Personal_Data.gender:
                if cv_obj.Personal_Data.gender.lower() != jd_obj.gender_filter.lower():
                    filter_status = {"passed": False, "reason": f"Gender ({cv_obj.Personal_Data.gender}) does not match requirement ({jd_obj.gender_filter})"}
            else:
                filter_status = {"passed": False, "reason": "Gender not found in CV"}

        # For each skill, present if in skill_presence, else absent
        present = [s for s in flat_skills if skill_presence.get(s, False)]
        absent = [s for s in flat_skills if not skill_presence.get(s, False)]
        # For critical skills, check status
        critical_skills = skill_categories["critical"] if skill_categories and "critical" in skill_categories else []
        critical_present = [s for s in critical_skills if skill_presence.get(s, False)]
        critical_absent = [s for s in critical_skills if not skill_presence.get(s, False)]
        if len(critical_absent) == 0 and len(critical_present) > 0:
            critical_skill_status = "All Present"
        elif len(critical_present) == 0 and len(critical_absent) > 0:
            critical_skill_status = "All Absent"
        else:
            critical_skill_status = "Partial Present"
        disclaimer = None
        if critical_skill_status == "All Absent":
            disclaimer = "Disclaimer: None of the critical required skills are present in this CV."
        score, details = compute_similarity(jd_obj, cv_obj)
        results.append({
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
        })
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

def ensure_complete_skill_presence(skill_presence: dict, skill_categories: dict) -> dict:
    """Ensure all skills from categories are present in skill_presence with boolean values"""
    if not skill_presence:
        skill_presence = {}
    
    # Get all skills from all categories
    all_skills = []
    for category_skills in skill_categories.values():
        all_skills.extend(category_skills)
    
    # Ensure each skill has a boolean value
    for skill in all_skills:
        if skill not in skill_presence:
            skill_presence[skill] = False
        elif not isinstance(skill_presence[skill], bool):
            # Convert to boolean if not already
            skill_presence[skill] = bool(skill_presence[skill])
    
    return skill_presence

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
