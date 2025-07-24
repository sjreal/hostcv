from sqlalchemy.orm import Session
import json
from . import models, schemas

def get_or_create_job_description(db: Session, jd: schemas.JDModel):
    db_jd = db.query(models.JobDescription).filter(models.JobDescription.job_id_str == jd.jobId).first()
    if db_jd:
        return db_jd
    db_jd = models.JobDescription(
        job_id_str=jd.jobId,
        job_title=jd.jobTitle,
        company_name=jd.companyProfile.companyName,
        details=json.loads(jd.json()) # Store the full JD object
    )
    db.add(db_jd)
    db.commit()
    db.refresh(db_jd)
    return db_jd

def get_or_create_candidate(db: Session, cv: schemas.CVModel):
    db_candidate = db.query(models.Candidate).filter(models.Candidate.email == cv.Personal_Data.email).first()
    if not db_candidate:
        db_candidate = models.Candidate(
            name=f"{cv.Personal_Data.firstName or ''} {cv.Personal_Data.lastName or ''}".strip(),
            email=cv.Personal_Data.email,
            phone=cv.Personal_Data.phone
        )
        db.add(db_candidate)
        db.commit()
        db.refresh(db_candidate)
    return db_candidate

def create_analysis_result(db: Session, jd_db_id: int, candidate_db_id: int, result: dict):
    db_result = models.AnalysisResult(
        job_description_id=jd_db_id,
        candidate_id=candidate_db_id,
        score=result["match_score"],
        match_level=result["match_level"],
        details=result["match_details"]
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_jds(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.JobDescription).offset(skip).limit(limit).all()

def get_jd_results(db: Session, jd_id: int):
    return db.query(models.AnalysisResult).filter(models.AnalysisResult.job_description_id == jd_id).all()
