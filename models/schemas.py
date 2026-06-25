from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class UserProfile(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    target_role: Optional[str] = None
    readiness_score: float = 0.0

class ResumeInsights(BaseModel):
    ats_score: float = Field(..., description="ATS compatibility score out of 100")
    skills_extracted: List[str] = Field(..., description="List of skills extracted from resume")
    experience_summary: str = Field(..., description="Summary of work experience")
    projects: List[str] = Field(..., description="Key projects mentioned")
    education: List[str] = Field(..., description="List of degree programs and schools")
    strengths: List[str] = Field(..., description="Core candidate strengths")
    weaknesses_improvements: List[str] = Field(..., description="Areas for ATS improvement")

class CareerRecommendation(BaseModel):
    predicted_roles: List[str] = Field(..., description="Top 3 career path role matches")
    alignment_reasoning: str = Field(..., description="Reasoning behind role recommendations")
    growth_trends: Dict[str, str] = Field(..., description="Market growth/demand trends for predicted roles")

class SkillGapItem(BaseModel):
    skill_name: str
    current_proficiency: str = Field(..., description="e.g., None, Beginner, Intermediate")
    required_proficiency: str = Field(..., description="Required proficiency level for target role")
    estimated_learning_hours: int = Field(..., description="Estimated study time required to close the gap")
    priority: str = Field(..., description="Learning priority: High, Medium, Low")

class SkillGapAnalysis(BaseModel):
    target_role: str
    gaps: List[SkillGapItem]
    overall_gap_percentage: float = Field(..., description="Percentage of target role skills currently missing")

class RoadmapStep(BaseModel):
    week: int = Field(..., description="Week number")
    topic: str = Field(..., description="Core subject or technology to learn")
    resources: List[str] = Field(..., description="Recommended blogs, docs, courses")
    project_milestone: str = Field(..., description="Mini project milestone to build")
    certification_suggestion: Optional[str] = None

class LearningRoadmap(BaseModel):
    target_role: str
    weekly_plan: List[RoadmapStep]
    estimated_completion_weeks: int

class InterviewQuestion(BaseModel):
    id: int
    question: str
    category: str = Field(..., description="Technical, HR, Company-Specific")
    difficulty: str = Field(..., description="Easy, Medium, Hard")

class InterviewAnswer(BaseModel):
    question_id: int
    beginner_answer: str
    intermediate_answer: str
    expert_answer: str
    keywords: List[str] = Field(..., description="Essential terms that must be mentioned")

class CareerReadiness(BaseModel):
    overall_percentage: float = Field(..., description="Overall readiness from 0.0 to 100.0")
    profile_strength: float = Field(..., description="Resume & ATS score metric weight")
    skill_match_strength: float = Field(..., description="Target role skill fit weight")
    mock_interview_strength: float = Field(..., description="Mock interview performance weight")
    next_steps: List[str] = Field(..., description="Prioritized recommendations to become job-ready")
