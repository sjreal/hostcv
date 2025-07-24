from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    job_id_str = Column(String, index=True, unique=True)
    job_title = Column(String, index=True)
    company_name = Column(String)
    details = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    results = relationship("AnalysisResult", back_populates="job_description")

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    
    results = relationship("AnalysisResult", back_populates="candidate")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    job_description_id = Column(Integer, ForeignKey("job_descriptions.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    
    score = Column(Float)
    match_level = Column(String)
    details = Column(JSON)
    
    job_description = relationship("JobDescription", back_populates="results")
    candidate = relationship("Candidate", back_populates="results")
