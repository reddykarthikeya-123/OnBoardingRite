import requests
import json
from datetime import date

url = "http://localhost:8000/api/v1/projects/"

payload = {
    "name": "API Test Project",
    "clientName": "Test Client",
    "description": "Created via API test script",
    "location": "Test City, TX",
    "startDate": "2025-05-01",
    "endDate": "2025-06-01",
    "status": "DRAFT",
    "isDOD": False,
    "isODRISA": True,
    "templateId": "template-001"
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Request failed: {e}")
