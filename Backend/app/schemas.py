from pydantic import BaseModel, Field, root_validator
from typing import Dict, List, Any, Tuple, Optional, Union

class CompanyProfile(BaseModel):
    companyName: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

class LocationModel(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    remoteStatus: Optional[str] = None

class Qualifications(BaseModel):
    required: List[str] = []
    preferred: List[str] = []

class CompensationBenefits(BaseModel):
    salaryRange: Optional[str] = None
    benefits: List[str] = []

class ApplicationInfo(BaseModel):
    howToApply: Optional[str] = None
    applyLink: Optional[str] = None
    contactEmail: Optional[str] = None

class AgeFilter(BaseModel):
    min_age: Optional[int] = None
    max_age: Optional[int] = None

    @root_validator(pre=True)
    def coerce_non_int_to_none(cls, values):
        for field in ['min_age', 'max_age']:
            val = values.get(field)
            if isinstance(val, str):
                if not val.isdigit():
                    values[field] = None
                else:
                    values[field] = int(val)
            elif not (val is None or isinstance(val, int)):
                values[field] = None
        return values

class JDModel(BaseModel):
    jobId: Optional[str] = None
    jobTitle: str
    companyProfile: CompanyProfile
    location: LocationModel
    datePosted: str
    employmentType: Optional[str] = None
    jobSummary: str
    keyResponsibilities: List[str]
    qualifications: Qualifications
    requiredSkills: Union[List[str], Dict[str, List[str]]] = []  # Accepts both flat and categorized
    educationRequired: List[str] = []
    compensationAndBenefits: CompensationBenefits
    applicationInfo: ApplicationInfo
    extractedKeywords: List[str]
    age_filter: Optional[AgeFilter] = None
    gender_filter: Optional[str] = None

class PersonalData(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    location: LocationModel
    age: Optional[int] = None
    gender: Optional[str] = None

class Education(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    fieldOfStudy: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    grade: Optional[str] = None
    description: Optional[str] = None

class Experience(BaseModel):
    jobTitle: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    description: List[str] = []
    technologiesUsed: List[str] = []

class Project(BaseModel):
    projectName: Optional[str] = None
    description: Optional[str] = None
    technologiesUsed: List[str] = []
    link: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None

class Skill(BaseModel):
    category: Optional[str] = None
    skillName: str

class JobStability(BaseModel):
    average_duration_years: Optional[float] = None
    frequent_switching_flag: bool = False

class EducationGap(BaseModel):
    has_gap: bool = False
    gap_duration_years: float = 0

class KeywordAnalysis(BaseModel):
    teamwork: bool = False
    management_experience: bool = False
    geographic_experience: bool = False
    extracted_keywords: List[str] = []

class Analytics(BaseModel):
    job_stability: JobStability
    education_gap: EducationGap
    keyword_analysis: KeywordAnalysis
    suggested_role: str

class CVModel(BaseModel):
    UUID: Optional[str] = None
    Personal_Data: PersonalData = Field(alias="Personal Data")
    education_list: List[Education] = Field(alias="Education", default=[])
    experiences_list: List[Experience] = Field(alias="Experiences", default=[])
    projects_list: List[Project] = Field(alias="Projects", default=[])
    skills_list: List[Skill] = Field(alias="Skills", default=[])
    research_work_list: List[Dict[str, Any]] = Field(alias="Research Work", default=[])
    achievements_list: List[str] = Field(alias="Achievements", default=[])
    Analytics: Analytics
    skill_presence: Optional[Dict[str, bool]] = None  # Changed to Dict[str, bool] for boolean skill presence

    class Config:
        allow_population_by_field_name = True
        populate_by_name = True

class MatchRequest(BaseModel):
    jd: JDModel
    cvs: List[CVModel]
