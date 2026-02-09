import requests
import sys
import json
from datetime import datetime

class EstadisticaMenteAPITester:
    def __init__(self, base_url="https://private-missions.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.dataset_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_create_project(self):
        """Test project creation"""
        project_data = {
            "name": "Test Project - Animales Favoritos",
            "educationLevel": "secundario",
            "analysisType": "univariado",
            "description": "Proyecto de prueba para testing"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   Project ID: {self.project_id}")
            return True
        return False

    def test_get_projects(self):
        """Test getting all projects"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "projects",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} projects")
            return True
        return False

    def test_get_project_by_id(self):
        """Test getting specific project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Project by ID",
            "GET",
            f"projects/{self.project_id}",
            200
        )
        
        return success and response.get('id') == self.project_id

    def test_create_dataset(self):
        """Test dataset creation"""
        if not self.project_id:
            print("❌ No project ID available for dataset testing")
            return False
            
        dataset_data = {
            "projectId": self.project_id,
            "rawData": [
                {"estudiante": 1, "animal": "Perro"},
                {"estudiante": 2, "animal": "Gato"},
                {"estudiante": 3, "animal": "Perro"},
                {"estudiante": 4, "animal": "Conejo"}
            ],
            "variables": [
                {
                    "name": "animal",
                    "type": "cualitativa_nominal",
                    "values": ["Perro", "Gato", "Perro", "Conejo"]
                }
            ],
            "source": "manual"
        }
        
        success, response = self.run_test(
            "Create Dataset",
            "POST",
            "datasets",
            200,
            data=dataset_data
        )
        
        if success and 'id' in response:
            self.dataset_id = response['id']
            print(f"   Dataset ID: {self.dataset_id}")
            return True
        return False

    def test_get_datasets(self):
        """Test getting datasets for project"""
        if not self.project_id:
            print("❌ No project ID available for dataset testing")
            return False
            
        success, response = self.run_test(
            "Get Datasets",
            "GET",
            f"datasets/{self.project_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} datasets")
            return True
        return False

    def test_calculate_statistics(self):
        """Test statistics calculation"""
        if not self.project_id:
            print("❌ No project ID available for statistics testing")
            return False
            
        stats_data = {
            "projectId": self.project_id,
            "variableName": "edad",
            "data": [15, 16, 15, 17, 16, 15, 18, 16]
        }
        
        success, response = self.run_test(
            "Calculate Statistics",
            "POST",
            f"statistics/calculate?projectId={stats_data['projectId']}&variableName={stats_data['variableName']}",
            200,
            data=stats_data['data']
        )
        
        if success and 'mean' in response:
            print(f"   Mean: {response.get('mean')}")
            return True
        return False

    def test_calculate_frequency(self):
        """Test frequency table calculation"""
        if not self.project_id:
            print("❌ No project ID available for frequency testing")
            return False
            
        freq_data = {
            "projectId": self.project_id,
            "variableName": "animal",
            "data": ["Perro", "Gato", "Perro", "Conejo", "Perro", "Gato"]
        }
        
        success, response = self.run_test(
            "Calculate Frequency",
            "POST",
            f"statistics/frequency?projectId={freq_data['projectId']}&variableName={freq_data['variableName']}",
            200,
            data=freq_data['data']
        )
        
        if success and 'absoluteFrequency' in response:
            print(f"   Frequencies: {response.get('absoluteFrequency')}")
            return True
        return False

    def test_chat_profe_marce(self):
        """Test Profe Marce chat functionality"""
        chat_data = {
            "message": "¿Qué es la media aritmética?",
            "sessionId": f"test_session_{datetime.now().strftime('%H%M%S')}",
            "educationLevel": "secundario"
        }
        
        success, response = self.run_test(
            "Chat with Profe Marce",
            "POST",
            "chat",
            200,
            data=chat_data
        )
        
        if success and 'response' in response:
            print(f"   AI Response length: {len(response['response'])} chars")
            return True
        return False

    def test_generate_report(self):
        """Test report generation"""
        if not self.project_id:
            print("❌ No project ID available for report testing")
            return False
            
        success, response = self.run_test(
            "Generate Report",
            "POST",
            f"reports/generate?project_id={self.project_id}&education_level=secundario",
            200
        )
        
        if success and 'report' in response:
            print(f"   Report length: {len(response['report'])} chars")
            return True
        return False

    def test_get_example_datasets(self):
        """Test getting example datasets"""
        success, response = self.run_test(
            "Get Example Datasets",
            "GET",
            "examples/datasets",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} example datasets")
            return True
        return False

    def test_file_upload_simulation(self):
        """Test file upload endpoints (simulation)"""
        # Test CSV upload endpoint structure
        success_csv, _ = self.run_test(
            "CSV Upload Endpoint Check",
            "POST",
            "upload/csv",
            400  # Expecting 400 without actual file
        )
        
        # Test Excel upload endpoint structure  
        success_excel, _ = self.run_test(
            "Excel Upload Endpoint Check", 
            "POST",
            "upload/excel",
            400  # Expecting 400 without actual file
        )
        
        return success_csv and success_excel

def main():
    print("🚀 Starting EstadísticaMente API Testing...")
    print("=" * 60)
    
    tester = EstadisticaMenteAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Create Project", tester.test_create_project),
        ("Get Projects", tester.test_get_projects),
        ("Get Project by ID", tester.test_get_project_by_id),
        ("Create Dataset", tester.test_create_dataset),
        ("Get Datasets", tester.test_get_datasets),
        ("Calculate Statistics", tester.test_calculate_statistics),
        ("Calculate Frequency", tester.test_calculate_frequency),
        ("Chat Profe Marce", tester.test_chat_profe_marce),
        ("Generate Report", tester.test_generate_report),
        ("Get Example Datasets", tester.test_get_example_datasets),
        ("File Upload Endpoints", tester.test_file_upload_simulation)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    print(f"\n🔗 Backend URL: {tester.base_url}")
    if tester.project_id:
        print(f"📁 Test Project ID: {tester.project_id}")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())