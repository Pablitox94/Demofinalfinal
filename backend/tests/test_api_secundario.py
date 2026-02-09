"""
Backend API Tests for EstadísticaMente - Nivel Secundario
Tests for projects, datasets, statistics, chat, and reports endpoints
"""
import pytest
import requests
import os
import uuid

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


class TestProjectsCRUD:
    """Project CRUD operations for secundario level"""
    
    def test_create_project_secundario(self):
        """Create a new secundario project"""
        payload = {
            "name": "TEST_Proyecto Secundario",
            "educationLevel": "secundario",
            "analysisType": "univariado",
            "description": "Proyecto de prueba para secundario"
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["educationLevel"] == "secundario"
        assert data["analysisType"] == "univariado"
        assert "id" in data
        print(f"✓ Created project: {data['id']}")
        return data["id"]
    
    def test_get_projects(self):
        """Get all projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} projects")
    
    def test_get_project_by_id(self):
        """Create and retrieve a specific project"""
        # Create project first
        payload = {
            "name": "TEST_Get Project Test",
            "educationLevel": "secundario",
            "analysisType": "multivariado",
            "description": "Test for get by ID"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert create_response.status_code == 200
        project_id = create_response.json()["id"]
        
        # Get by ID
        get_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["id"] == project_id
        assert data["name"] == payload["name"]
        print(f"✓ Retrieved project by ID: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_update_project(self):
        """Create, update, and verify project"""
        # Create
        payload = {
            "name": "TEST_Update Project",
            "educationLevel": "secundario",
            "analysisType": "univariado",
            "description": "Original description"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert create_response.status_code == 200
        project_id = create_response.json()["id"]
        
        # Update
        update_payload = {
            "name": "TEST_Updated Project Name",
            "educationLevel": "secundario",
            "analysisType": "multivariado",
            "description": "Updated description"
        }
        update_response = requests.put(f"{BASE_URL}/api/projects/{project_id}", json=update_payload)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["name"] == update_payload["name"]
        assert data["analysisType"] == "multivariado"
        print(f"✓ Updated project: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_delete_project(self):
        """Create and delete a project"""
        # Create
        payload = {
            "name": "TEST_Delete Project",
            "educationLevel": "secundario",
            "analysisType": "univariado"
        }
        create_response = requests.post(f"{BASE_URL}/api/projects", json=payload)
        assert create_response.status_code == 200
        project_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/projects/{project_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted project: {project_id}")
    
    def test_get_nonexistent_project(self):
        """Test 404 for non-existent project"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/projects/{fake_id}")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent project")


class TestDatasets:
    """Dataset operations"""
    
    def test_create_dataset(self):
        """Create a dataset for a project"""
        # Create project first
        project_payload = {
            "name": "TEST_Dataset Project",
            "educationLevel": "secundario",
            "analysisType": "univariado"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        assert project_response.status_code == 200
        project_id = project_response.json()["id"]
        
        # Create dataset
        dataset_payload = {
            "projectId": project_id,
            "rawData": [
                {"index": 1, "valor": "Argentina"},
                {"index": 2, "valor": "Brasil"},
                {"index": 3, "valor": "Argentina"}
            ],
            "variables": [{
                "name": "valor",
                "type": "cualitativa_nominal",
                "values": ["Argentina", "Brasil", "Argentina"]
            }],
            "source": "manual"
        }
        dataset_response = requests.post(f"{BASE_URL}/api/datasets", json=dataset_payload)
        assert dataset_response.status_code == 200
        
        data = dataset_response.json()
        assert data["projectId"] == project_id
        assert len(data["rawData"]) == 3
        print(f"✓ Created dataset for project: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")
    
    def test_get_datasets_by_project(self):
        """Get datasets for a project"""
        # Create project
        project_payload = {
            "name": "TEST_Get Datasets Project",
            "educationLevel": "secundario",
            "analysisType": "univariado"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        project_id = project_response.json()["id"]
        
        # Create dataset
        dataset_payload = {
            "projectId": project_id,
            "rawData": [{"index": 1, "valor": 13}],
            "variables": [{"name": "edad", "type": "cuantitativa_discreta", "values": [13]}],
            "source": "manual"
        }
        requests.post(f"{BASE_URL}/api/datasets", json=dataset_payload)
        
        # Get datasets
        get_response = requests.get(f"{BASE_URL}/api/datasets/{project_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        print(f"✓ Retrieved datasets for project: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestExampleDatasets:
    """Test example datasets endpoint"""
    
    def test_get_example_datasets(self):
        """Get predefined example datasets"""
        response = requests.get(f"{BASE_URL}/api/examples/datasets")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least 3 examples
        
        # Check for secundario examples
        secundario_examples = [e for e in data if e.get("educationLevel") == "secundario"]
        assert len(secundario_examples) >= 3
        
        # Verify Mundial example exists
        mundial = next((e for e in data if "Mundial" in e.get("name", "")), None)
        assert mundial is not None
        assert mundial["analysisType"] == "univariado"
        print(f"✓ Retrieved {len(data)} example datasets, {len(secundario_examples)} for secundario")


class TestChat:
    """Chat with Profe Marce"""
    
    def test_chat_secundario(self):
        """Test chat endpoint for secundario level"""
        payload = {
            "message": "¿Qué es la media aritmética?",
            "sessionId": f"test_session_{uuid.uuid4()}",
            "educationLevel": "secundario"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert len(data["response"]) > 0
        print(f"✓ Chat response received ({len(data['response'])} chars)")
    
    def test_chat_primario(self):
        """Test chat endpoint for primario level"""
        payload = {
            "message": "¿Qué es contar?",
            "sessionId": f"test_session_{uuid.uuid4()}",
            "educationLevel": "primario"
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        print("✓ Chat response for primario level received")


class TestStatistics:
    """Statistics calculation endpoints"""
    
    def test_get_statistics_for_project(self):
        """Get statistics for a project"""
        # Create project
        project_payload = {
            "name": "TEST_Stats Project",
            "educationLevel": "secundario",
            "analysisType": "univariado"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        project_id = project_response.json()["id"]
        
        # Get statistics (should be empty initially)
        stats_response = requests.get(f"{BASE_URL}/api/statistics/{project_id}")
        assert stats_response.status_code == 200
        
        data = stats_response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved statistics for project: {project_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/projects/{project_id}")


class TestReports:
    """Report generation endpoints"""
    
    def test_get_reports_for_project(self):
        """Get reports for a project"""
        # Create project
        project_payload = {
            "name": "TEST_Reports Project",
            "educationLevel": "secundario",
            "analysisType": "univariado"
        }
        project_response = requests.post(f"{BASE_URL}/api/projects", json=project_payload)
        project_id = project_response.json()["id"]
        
        # Get reports (should be empty initially)
        reports_response = requests.get(f"{BASE_URL}/api/reports/{project_id}")
        assert reports_response.status_code == 200
        
        data = reports_response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved reports for project: {project_id}")
        
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
