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
    print(f"Testing Checklist API for Project: {PROJECT_ID}")
    
    
    # 1. Create Task Group
    print("\n1. creating Task Group...")
    group_url = f"{BASE_URL}/{PROJECT_ID}/groups"
    group_payload = {
        "name": "API Test Group",
        "category": "FORMS"
    }
    
    resp = requests.post(group_url, json=group_payload)
    if resp.status_code != 200:
        print(f"FAILED to create group: {resp.text}")
        return
    
    group_data = resp.json()
    group_id = group_data['id']
    print(f"SUCCESS: Created Group '{group_data['name']}' (ID: {group_id})")
    
    # 2. Add Task to Group
    print("\n2. Adding Task to Group...")
    task_url = f"{BASE_URL}/{PROJECT_ID}/groups/{group_id}/tasks"
    task_payload = {
        "name": "Upload API Specs",
        "description": "Upload the API documentation.",
        "type": "DOCUMENT",
        "isRequired": True,
        "category": "DOCUMENTS",
        "configuration": {"docType": "PDF"}
    }
    
    resp = requests.post(task_url, json=task_payload)
    if resp.status_code != 200:
        print(f"FAILED to add task: {resp.text}")
        return
        
    task_data = resp.json()
    print(f"SUCCESS: Added Task '{task_data['task']['name']}' (ID: {task_data['taskId']}) at order {task_data['sortOrder']}")
    
    # 3. Fetch Full Checklist
    print("\n3. Fetching Full Checklist...")
    checklist_url = f"{BASE_URL}/{PROJECT_ID}/checklist"
    resp = requests.get(checklist_url)
    
    if resp.status_code != 200:
        print(f"FAILED to fetch checklist: {resp.text}")
        return
        
    checklist = resp.json()
    print(f"SUCCESS: Fetched {len(checklist)} groups.")
    
    # Verify our group is there
    found = False
    for g in checklist:
        if g['id'] == group_id:
            print(f"Found our group! Has {len(g['tasks'])} tasks.")
            if len(g['tasks']) > 0 and g['tasks'][0]['name'] == "Upload API Specs":
                print("Task verification PASSED.")
                found = True
                break
    
    if not found:
        print("ERROR: Created group not found in checklist response!")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Test Execution Failed: {e}")
