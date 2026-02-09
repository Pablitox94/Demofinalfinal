"""
Backend API Tests for EstadísticaMente - Nivel Superior (Universitario)
Tests for projects, datasets, statistics, chat, and reports endpoints with education_level=superior
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "EstadísticaMente API"
        print("✓ API root endpoint working")


class TestProjectsSuperior:
    """Project CRUD operations for superior level"""
    
    def test_create_project_superior(self):
        """Create a new superior level project"""
        payload = {
            "name": "TEST_Proyecto Superior Universitario",
            "educationLevel": "superior",
            "analysisType": "multivariado",
            "description": "Proyecto de análisis estadístico avanzado para nivel universitario"
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["educationLevel"] == "superior"
        assert data["analysisType"] == "multivariado"
        assert "id" in data
        print(f"✓ Created superior project: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{data['id']}")
    
    def test_create_project_regresion_type(self):
        """Create a superior project with regresion analysis type"""
        payload = {
            "name": "TEST_Proyecto Regresión",
            "educationLevel": "superior",
            "analysisType": "regresion",
            "description": "Análisis de regresión lineal múltiple"
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["analysisType"] == "regresion"
        print(f"✓ Created regresion project: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{data['id']}")
    
    def test_create_project_inferencia_type(self):
        """Create a superior project with inferencia analysis type"""
        payload = {
            "name": "TEST_Proyecto Inferencia",
            "educationLevel": "superior",
            "analysisType": "inferencia",
            "description": "Pruebas de hipótesis e intervalos de confianza"
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["analysisType"] == "inferencia"
        print(f"✓ Created inferencia project: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{data['id']}")
    
    def test_create_project_experimental_type(self):
        """Create a superior project with experimental design type"""
        payload = {
            "name": "TEST_Proyecto Experimental",
            "educationLevel": "superior",
            "analysisType": "experimental",
            "description": "Diseño experimental con grupos control y tratamiento"
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["analysisType"] == "experimental"
        print(f"✓ Created experimental project: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{data['id']}")
    
    def test_get_projects_filter_superior(self):
        """Get all projects and filter for superior level"""
        # Create a superior project first
        payload = {
            "name": "TEST_Filter Superior Project",
            "educationLevel": "superior",
            "analysisType": "univariado"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        project_id = create_response.json()["id"]
        
        # Get all projects
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Filter for superior
        superior_projects = [p for p in data if p.get("educationLevel") == "superior"]
        assert len(superior_projects) >= 1
        print(f"✓ Found {len(superior_projects)} superior projects")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestDatasetsSuperior:
    """Dataset operations for superior level with complex multivariate data"""
    
    def test_create_multivariate_dataset(self):
        """Create a multivariate dataset for superior level analysis"""
        # Create project first
        project_payload = {
            "name": "TEST_Multivariate Dataset Project",
            "educationLevel": "superior",
            "analysisType": "multivariado"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        assert project_response.status_code == 200
        project_id = project_response.json()["id"]
        
        # Create multivariate dataset (similar to Rendimiento Académico example)
        dataset_payload = {
            "projectId": project_id,
            "rawData": [
                {"index": 1, "horas_estudio": 4.5, "asistencia": 85, "promedio": 7.8},
                {"index": 2, "horas_estudio": 6.2, "asistencia": 92, "promedio": 8.5},
                {"index": 3, "horas_estudio": 3.8, "asistencia": 70, "promedio": 6.2},
                {"index": 4, "horas_estudio": 7.1, "asistencia": 95, "promedio": 9.2},
                {"index": 5, "horas_estudio": 5.5, "asistencia": 88, "promedio": 7.5}
            ],
            "variables": [
                {"name": "horas_estudio", "type": "cuantitativa_continua", "values": [4.5, 6.2, 3.8, 7.1, 5.5]},
                {"name": "asistencia", "type": "cuantitativa_continua", "values": [85, 92, 70, 95, 88]},
                {"name": "promedio", "type": "cuantitativa_continua", "values": [7.8, 8.5, 6.2, 9.2, 7.5]}
            ],
            "source": "example"
        }
        dataset_response = requests.post(f"{BASE_URL}/api/datasets", json=dataset_payload)
        assert dataset_response.status_code == 200
        
        data = dataset_response.json()
        assert data["projectId"] == project_id
        assert len(data["variables"]) == 3
        assert len(data["rawData"]) == 5
        print(f"✓ Created multivariate dataset with 3 variables for project: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_create_experimental_dataset(self):
        """Create a dataset for experimental design (treatment vs control)"""
        # Create project
        project_payload = {
            "name": "TEST_Experimental Dataset",
            "educationLevel": "superior",
            "analysisType": "experimental"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        project_id = project_response.json()["id"]
        
        # Create experimental dataset (similar to Ensayo Clínico example)
        dataset_payload = {
            "projectId": project_id,
            "rawData": [
                {"index": 1, "grupo": 1, "edad": 45, "presion_inicial": 145, "presion_final": 128},
                {"index": 2, "grupo": 1, "edad": 52, "presion_inicial": 152, "presion_final": 130},
                {"index": 3, "grupo": 0, "edad": 43, "presion_inicial": 144, "presion_final": 142},
                {"index": 4, "grupo": 0, "edad": 56, "presion_inicial": 153, "presion_final": 150}
            ],
            "variables": [
                {"name": "grupo", "type": "cualitativa_nominal", "values": [1, 1, 0, 0]},
                {"name": "edad", "type": "cuantitativa_continua", "values": [45, 52, 43, 56]},
                {"name": "presion_inicial", "type": "cuantitativa_continua", "values": [145, 152, 144, 153]},
                {"name": "presion_final", "type": "cuantitativa_continua", "values": [128, 130, 142, 150]}
            ],
            "source": "example"
        }
        dataset_response = requests.post(f"{BASE_URL}/api/datasets", json=dataset_payload)
        assert dataset_response.status_code == 200
        
        data = dataset_response.json()
        assert len(data["variables"]) == 4
        print(f"✓ Created experimental dataset with treatment/control groups")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestChatSuperior:
    """Chat with Profe Marce at superior (university) level"""
    
    def test_chat_superior_basic(self):
        """Test chat endpoint for superior level with basic question"""
        payload = {
            "message": "¿Qué es el coeficiente de correlación de Pearson?",
            "sessionId": f"test_superior_{uuid.uuid4()}",
            "educationLevel": "superior"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"✓ Chat superior response received ({len(data['response'])} chars)")
    
    def test_chat_superior_hypothesis_testing(self):
        """Test chat about hypothesis testing at superior level"""
        payload = {
            "message": "¿Cuándo debo usar una prueba t de Student y cuándo ANOVA?",
            "sessionId": f"test_superior_hyp_{uuid.uuid4()}",
            "educationLevel": "superior"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 50  # Should be a detailed response
        print(f"✓ Chat superior hypothesis testing response received")
    
    def test_chat_superior_regression(self):
        """Test chat about regression at superior level"""
        payload = {
            "message": "¿Cómo interpreto el coeficiente de determinación R² en una regresión?",
            "sessionId": f"test_superior_reg_{uuid.uuid4()}",
            "educationLevel": "superior"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        print(f"✓ Chat superior regression response received")
    
    def test_chat_superior_confidence_intervals(self):
        """Test chat about confidence intervals at superior level"""
        payload = {
            "message": "¿Cómo construyo un intervalo de confianza para la media poblacional?",
            "sessionId": f"test_superior_ci_{uuid.uuid4()}",
            "educationLevel": "superior"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        print(f"✓ Chat superior confidence intervals response received")


class TestReportsSuperior:
    """Report generation for superior level"""
    
    def test_generate_report_superior_with_data(self):
        """Generate a report for superior level project with data"""
        # Create project
        project_payload = {
            "name": "TEST_Report Superior Project",
            "educationLevel": "superior",
            "analysisType": "multivariado",
            "description": "Análisis de rendimiento académico universitario"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        assert project_response.status_code == 200
        project_id = project_response.json()["id"]
        
        # Create dataset
        dataset_payload = {
            "projectId": project_id,
            "rawData": [
                {"index": 1, "horas_estudio": 4.5, "promedio": 7.8},
                {"index": 2, "horas_estudio": 6.2, "promedio": 8.5},
                {"index": 3, "horas_estudio": 3.8, "promedio": 6.2}
            ],
            "variables": [
                {"name": "horas_estudio", "type": "cuantitativa_continua", "values": [4.5, 6.2, 3.8]},
                {"name": "promedio", "type": "cuantitativa_continua", "values": [7.8, 8.5, 6.2]}
            ],
            "source": "manual"
        }
        requests.post(f"{BASE_URL}/api/datasets", json=dataset_payload)
        
        # Generate report with education_level=superior
        report_response = requests.post(
            f"{BASE_URL}/api/reports/generate",
            params={"project_id": project_id, "education_level": "superior"}
        )
        assert report_response.status_code == 200
        
        data = report_response.json()
        assert "report" in data
        assert len(data["report"]) > 100  # Should be a substantial report
        assert "id" in data
        print(f"✓ Generated superior level report ({len(data['report'])} chars)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_get_reports_for_superior_project(self):
        """Get reports for a superior project"""
        # Create project
        project_payload = {
            "name": "TEST_Get Reports Superior",
            "educationLevel": "superior",
            "analysisType": "univariado"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        project_id = project_response.json()["id"]
        
        # Get reports (should be empty initially)
        reports_response = requests.get(f"{BASE_URL}/api/reports/{project_id}")
        assert reports_response.status_code == 200
        
        data = reports_response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved reports for superior project: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestStatisticsSuperior:
    """Statistics endpoints for superior level"""
    
    def test_get_statistics_for_superior_project(self):
        """Get statistics for a superior project"""
        # Create project
        project_payload = {
            "name": "TEST_Stats Superior Project",
            "educationLevel": "superior",
            "analysisType": "multivariado"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        project_id = project_response.json()["id"]
        
        # Get statistics
        stats_response = requests.get(f"{BASE_URL}/api/statistics/{project_id}")
        assert stats_response.status_code == 200
        
        data = stats_response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved statistics for superior project: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_projects(self):
        """Delete all TEST_ prefixed projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        if response.status_code == 200:
            projects = response.json()
            test_projects = [p for p in projects if p.get("name", "").startswith("TEST_")]
            for project in test_projects:
                requests.delete(f"{BASE_URL}/api/projects/{project['id']}")
            print(f"✓ Cleaned up {len(test_projects)} test projects")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
