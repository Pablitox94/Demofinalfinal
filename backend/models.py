from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserProfile(BaseModel):
    uid: str
    email: str
    name: str
    role: str = "estudiante"
    educationLevel: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Variable(BaseModel):
    name: str
    type: str
    values: List[Any]

class Project(BaseModel):
    id: str
    userId: str
    name: str
    educationLevel: str
    analysisType: str = "univariado"
    description: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    name: str
    educationLevel: str
    analysisType: str = "univariado"
    description: Optional[str] = None

class Dataset(BaseModel):
    id: str
    projectId: str
    rawData: List[Dict[str, Any]]
    variables: List[Variable]
    source: str = "manual"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class DatasetCreate(BaseModel):
    projectId: str
    rawData: List[Dict[str, Any]]
    variables: List[Variable]
    source: str = "manual"

class FrequencyTable(BaseModel):
    id: str
    projectId: str
    variableName: str
    absoluteFrequency: Dict[str, int]
    relativeFrequency: Dict[str, float]
    percentageFrequency: Dict[str, float]
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ChartConfig(BaseModel):
    id: str
    projectId: str
    chartType: str
    config: Dict[str, Any]
    data: Dict[str, Any]
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Statistics(BaseModel):
    id: str
    projectId: str
    variableName: str
    mean: Optional[float] = None
    median: Optional[float] = None
    mode: Optional[Any] = None
    range: Optional[float] = None
    variance: Optional[float] = None
    stdDev: Optional[float] = None
    calculations: Dict[str, Any] = {}
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Report(BaseModel):
    id: str
    projectId: str
    content: str
    generatedBy: str = "AI"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    sessionId: str
    educationLevel: str = "secundario"