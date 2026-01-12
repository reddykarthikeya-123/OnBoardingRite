import requests
import json
import sys

# Base URL
BASE_URL = "http://localhost:8000/api/v1/projects"

def get_first_project():
    try:
        resp = requests.get(f"{BASE_URL}/")
        if resp.status_code == 200:
            data = resp.json()
            if data['items']:
                return data['items'][0]['id']
    except:
        pass
    return "project-004"

def run_test():
    PROJECT_ID = get_first_project()
    print(f"Testing Settings API for Project: {PROJECT_ID}")
    
    # 1. Update Project (Edit)
    print("\n1. Updating Project Details...")
    update_url = f"{BASE_URL}/{PROJECT_ID}"
    update_payload = {
        "description": "Updated Description via API Test",
        "clientName": "Updated Client"
    }
    
    resp = requests.put(update_url, json=update_payload)
    if resp.status_code != 200:
        print(f"FAILED to update project: {resp.text}")
    else:
        print(f"SUCCESS: Updated project description and client.")
        
    # 2. Get Settings (Should be empty/default initially)
    print("\n2. Fetching Settings...")
    settings_url = f"{BASE_URL}/{PROJECT_ID}/settings"
    resp = requests.get(settings_url)
    
    if resp.status_code == 200:
        print(f"Initial Settings: {resp.json()}")
    else:
        print(f"FAILED to fetch settings: {resp.text}")
        
    # 3. Update Settings
    print("\n3. Updating Settings...")
    settings_payload = {
        "isDOD": True,
        "isODRISA": False,
        "disaOwnerId": "EMP-999",
        "perDiemRules": {"allowance": 150}
    }
    
    resp = requests.put(settings_url, json=settings_payload)
    if resp.status_code == 200:
        print(f"SUCCESS: Updated Settings: {resp.json()}")
    else:
        print(f"FAILED to update settings: {resp.text}")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Test Execution Failed: {e}")
