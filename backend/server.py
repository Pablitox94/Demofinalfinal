from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json

from models import (
    ProjectCreate, Project, DatasetCreate, Dataset,
    ChatRequest, Statistics, Report
)
from statistics_calculator import StatisticsCalculator
from deepseek_service import ProfeMarceChat, ReportGenerator

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

@api_router.get("/")
async def root():
    return {"message": "EstadísticaMente API"}

@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    user_id = "demo_user"
    if credentials:
        user_id = credentials.credentials[:20]
    
    project_dict = project.model_dump()
    project_obj = Project(
        id=str(uuid.uuid4()),
        userId=user_id,
        **project_dict
    )
    
    doc = project_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    doc['updatedAt'] = doc['updatedAt'].isoformat()
    
    await db.projects.insert_one(doc)
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    user_id = "demo_user"
    if credentials:
        user_id = credentials.credentials[:20]
    
    projects = await db.projects.find({"userId": user_id}, {"_id": 0}).to_list(100)
    
    for proj in projects:
        if isinstance(proj.get('createdAt'), str):
            proj['createdAt'] = datetime.fromisoformat(proj['createdAt'])
        if isinstance(proj.get('updatedAt'), str):
            proj['updatedAt'] = datetime.fromisoformat(proj['updatedAt'])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(404, "Proyecto no encontrado")
    
    if isinstance(project.get('createdAt'), str):
        project['createdAt'] = datetime.fromisoformat(project['createdAt'])
    if isinstance(project.get('updatedAt'), str):
        project['updatedAt'] = datetime.fromisoformat(project['updatedAt'])
    
    return project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    try:
        # Delete project
        result = await db.projects.delete_one({"id": project_id})
        if result.deleted_count == 0:
            raise HTTPException(404, "Proyecto no encontrado")
        
        # Delete associated datasets
        await db.datasets.delete_many({"projectId": project_id})
        
        # Delete associated statistics
        await db.statistics.delete_many({"projectId": project_id})
        
        # Delete associated reports
        await db.reports.delete_many({"projectId": project_id})
        
        return {"success": True, "message": "Proyecto eliminado"}
    except Exception as e:
        raise HTTPException(500, f"Error al eliminar proyecto: {str(e)}")

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, project_update: ProjectCreate):
    try:
        update_data = {
            "name": project_update.name,
            "analysisType": project_update.analysisType,
            "description": project_update.description,
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.projects.update_one(
            {"id": project_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(404, "Proyecto no encontrado")
        
        return {"success": True, "message": "Proyecto actualizado"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al actualizar proyecto: {str(e)}")

@api_router.post("/datasets", response_model=Dataset)
async def create_dataset(dataset: DatasetCreate):
    dataset_dict = dataset.model_dump()
    dataset_obj = Dataset(
        id=str(uuid.uuid4()),
        **dataset_dict
    )
    
    doc = dataset_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.datasets.insert_one(doc)
    return dataset_obj

@api_router.get("/datasets/{project_id}", response_model=List[Dataset])
async def get_datasets(project_id: str):
    datasets = await db.datasets.find({"projectId": project_id}, {"_id": 0}).to_list(100)
    
    for ds in datasets:
        if isinstance(ds.get('createdAt'), str):
            ds['createdAt'] = datetime.fromisoformat(ds['createdAt'])
    
    return datasets

@api_router.delete("/datasets/project/{project_id}")
async def delete_datasets_by_project(project_id: str):
    try:
        result = await db.datasets.delete_many({"projectId": project_id})
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(500, f"Error al eliminar datasets: {str(e)}")

@api_router.post("/statistics/calculate")
async def calculate_statistics(projectId: str, variableName: str, data: List[float]):
    stats = StatisticsCalculator.calculate_basic_stats(data)
    
    stats_obj = Statistics(
        id=str(uuid.uuid4()),
        projectId=projectId,
        variableName=variableName,
        mean=stats.get('mean'),
        median=stats.get('median'),
        mode=stats.get('mode'),
        range=stats.get('range'),
        variance=stats.get('variance'),
        stdDev=stats.get('stdDev'),
        calculations=stats
    )
    
    doc = stats_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.statistics.insert_one(doc)
    return stats

@api_router.post("/statistics/frequency")
async def calculate_frequency(projectId: str, variableName: str, data: List):
    freq_table = StatisticsCalculator.calculate_frequency_table(data)
    
    freq_obj = {
        "id": str(uuid.uuid4()),
        "projectId": projectId,
        "variableName": variableName,
        **freq_table,
        "createdAt": datetime.utcnow().isoformat()
    }
    
    await db.frequencyTables.insert_one(freq_obj)
    return freq_table

@api_router.get("/statistics/{project_id}")
async def get_statistics(project_id: str):
    stats = await db.statistics.find({"projectId": project_id}, {"_id": 0}).to_list(100)
    return stats

@api_router.post("/chat")
async def chat_with_profe_marce(chat_req: ChatRequest):
    try:
        profe = ProfeMarceChat(education_level=chat_req.educationLevel)
        response = await profe.chat(chat_req.message, chat_req.sessionId)
        return {"response": response}
    except Exception as e:
        raise HTTPException(500, f"Error en el chat: {str(e)}")

@api_router.post("/reports/generate")
async def generate_report(project_id: str, education_level: str = "secundario"):
    try:
        project = await db.projects.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(404, "Proyecto no encontrado")
        
        datasets = await db.datasets.find({"projectId": project_id}, {"_id": 0}).to_list(10)
        stats = await db.statistics.find({"projectId": project_id}, {"_id": 0}).to_list(100)
        
        project_data = {
            **project,
            "datasets": datasets[:1] if datasets else [],
            "sampleData": datasets[0].get('rawData', [])[:10] if datasets else [],
            "statistics": stats[0] if stats else {}
        }
        
        report_content = await ReportGenerator.generate_report(project_data, education_level)
        
        report_obj = Report(
            id=str(uuid.uuid4()),
            projectId=project_id,
            content=report_content
        )
        
        doc = report_obj.model_dump()
        doc['createdAt'] = doc['createdAt'].isoformat()
        
        await db.reports.insert_one(doc)
        return {"report": report_content, "id": report_obj.id}
    except Exception as e:
        raise HTTPException(500, f"Error generando reporte: {str(e)}")

@api_router.get("/reports/{project_id}")
async def get_reports(project_id: str):
    reports = await db.reports.find({"projectId": project_id}, {"_id": 0}).to_list(100)
    return reports

@api_router.post("/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    try:
        import pandas as pd
        from io import BytesIO
        
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        data = df.to_dict(orient='records')
        columns = list(df.columns)
        
        return {
            "success": True,
            "data": data,
            "columns": columns,
            "rowCount": len(data)
        }
    except Exception as e:
        raise HTTPException(400, f"Error procesando Excel: {str(e)}")

@api_router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        import pandas as pd
        from io import StringIO
        
        contents = await file.read()
        text = contents.decode('utf-8')
        df = pd.read_csv(StringIO(text))
        
        data = df.to_dict(orient='records')
        columns = list(df.columns)
        
        return {
            "success": True,
            "data": data,
            "columns": columns,
            "rowCount": len(data)
        }
    except Exception as e:
        raise HTTPException(400, f"Error procesando CSV: {str(e)}")

@api_router.get("/examples/datasets")
async def get_example_datasets():
    examples = [
        {
            "id": "ejemplo_secundario_cualitativo",
            "name": "⚽ Mundial 2026: Selecciones Favoritas",
            "educationLevel": "secundario",
            "description": "Encuesta sobre selecciones favoritas para ganar el Mundial 2026",
            "analysisType": "univariado",
            "variables": [
                {"name": "seleccion", "type": "cualitativa_nominal", "values": ["Argentina", "Brasil", "Francia", "España", "Alemania", "Argentina", "Brasil", "Argentina", "Francia", "Argentina", "España", "Argentina", "Brasil", "Argentina", "Alemania", "Argentina", "Francia", "Brasil", "Argentina", "España"]}
            ],
            "rawData": [
                {"estudiante": 1, "seleccion": "Argentina"},
                {"estudiante": 2, "seleccion": "Brasil"},
                {"estudiante": 3, "seleccion": "Francia"},
                {"estudiante": 4, "seleccion": "España"},
                {"estudiante": 5, "seleccion": "Alemania"}
            ]
        },
        {
            "id": "ejemplo_secundario_cuantitativo",
            "name": "📊 Edades de Estudiantes",
            "educationLevel": "secundario",
            "description": "Análisis de edades de estudiantes de secundaria",
            "analysisType": "univariado",
            "variables": [
                {"name": "edad", "type": "cuantitativa_discreta", "values": [13, 14, 13, 15, 14, 16, 13, 14, 15, 14, 13, 16, 14, 15, 13, 14, 17, 14, 15, 14, 13, 15, 14, 16, 15]}
            ],
            "rawData": [
                {"estudiante": 1, "edad": 13},
                {"estudiante": 2, "edad": 14},
                {"estudiante": 3, "edad": 13}
            ]
        },
        {
            "id": "ejemplo_secundario_multivariable",
            "name": "🎮 Horas de Estudio vs Calificaciones",
            "educationLevel": "secundario",
            "description": "Relación entre horas de estudio semanal y promedio de calificaciones",
            "analysisType": "multivariado",
            "variables": [
                {"name": "horas_estudio", "type": "cuantitativa_continua", "values": [2.5, 4.0, 3.5, 5.0, 2.0, 6.0, 3.0, 4.5, 5.5, 3.5, 4.0, 6.5, 2.5, 5.0, 4.5, 3.0, 5.5, 4.0, 6.0, 3.5]},
                {"name": "promedio", "type": "cuantitativa_continua", "values": [6.5, 7.8, 7.2, 8.5, 6.0, 9.0, 7.0, 8.0, 8.8, 7.5, 7.8, 9.2, 6.8, 8.5, 8.2, 7.3, 8.7, 7.9, 9.1, 7.6]}
            ],
            "rawData": [
                {"estudiante": 1, "horas_estudio": 2.5, "promedio": 6.5},
                {"estudiante": 2, "horas_estudio": 4.0, "promedio": 7.8}
            ]
        },
        # Primaria examples
        {
            "id": "ejemplo_1",
            "name": "Animales Favoritos de la Clase",
            "educationLevel": "primario",
            "description": "Encuesta sobre animales favoritos",
            "variables": [
                {"name": "animal", "type": "cualitativa_nominal", "values": ["Perros", "Gatos", "Conejos", "Pájaros", "Peces"]},
                {"name": "cantidad", "type": "cuantitativa_discreta", "values": [15, 10, 8, 5, 3]}
            ],
            "rawData": [
                {"estudiante": 1, "animal": "Perros"},
                {"estudiante": 2, "animal": "Perros"},
                {"estudiante": 3, "animal": "Gatos"}
            ]
        }
    ]
    return examples

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
