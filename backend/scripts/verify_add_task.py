import requests
import json
import uuid

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

def run_test():
    print("Testing Add Task to Group...")
    
    # 1. Get first template
    resp = requests.get(f"{BASE_URL}/templates/")
    if resp.status_code != 200:
        print(f"Error fetching templates: {resp.text}")
        return

    templates = resp.json()
    if not templates:
        print("No templates found.")
        return
        
    template = templates[0]
    template_id = template['id']
    print(f"Using template: {template['name']} ({template_id})")

    # 2. Get groups
    resp = requests.get(f"{BASE_URL}/templates/{template_id}")
    t_detail = resp.json()
    groups = t_detail.get('taskGroups', [])
    
    if not groups:
        print("No groups found in template.")
        # Create one
        g_resp = requests.post(f"{BASE_URL}/templates/{template_id}/groups", json={
            "name": "Debug Group",
            "category": "GENERAL"
        })
        if g_resp.status_code != 200:
             print(f"Failed to create group: {g_resp.text}")
             return
        group = g_resp.json()
    else:
        group = groups[0]
        
    group_id = group['id']
    print(f"Using group: {group['name']} ({group_id})")

    # 3. Create a library task to add (REST_API)
    task_name = f"Test API Task {str(uuid.uuid4())[:6]}"
    task_resp = requests.post(f"{BASE_URL}/tasks/", json={
        "name": task_name,
        "description": "Test Description",
        "type": "REST_API",
        "category": "INTEGRATION",
        "isRequired": True,
        "configuration": {
             "endpoint": "https://httpbin.org/post",
             "method": "POST",
             "headers": [{"key": "Content-Type", "value": "application/json"}]
        }
    })
    
    if task_resp.status_code != 200:
        print(f"Failed to create library task: {task_resp.text}")
        return
        
    lib_task = task_resp.json()
    print(f"Created Library Task: {lib_task['id']}")

    # 4. Add to group
    payload = {
        "taskId": lib_task['id'],
        "name": lib_task['name'],
        "description": lib_task['description'],
        "type": lib_task['type'],
        "category": lib_task['category'],
        "isRequired": lib_task['is_required'] if 'is_required' in lib_task else True,
        "configuration": lib_task['configuration']
    }
    
    # Note: Frontend sends 'isRequired', backend schema expects 'isRequired' (snake case mapping handled by validations? NO, Pydantic needs alias or exact match)
    # Check schema: AddTaskToGroupRequest has `isRequired: bool`. 
    # BUT `task_resp` (library task) might return snake_case `is_required`?
    # Let's see what happens.
    
    print(f"Sending payload: {json.dumps(payload)}")
    url = f"{BASE_URL}/templates/{template_id}/groups/{group_id}/tasks"
    resp = requests.post(url, json=payload)
    
    print(f"Add Task Status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Exception: {e}")
