import requests
import uuid

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

def run_test():
    print("Testing REST API Task Creation and Deletion...")
    
    # 1. Create a task
    task_name = f"Delete Me {str(uuid.uuid4())[:6]}"
    print(f"Creating task '{task_name}'...")
    
    create_resp = requests.post(f"{BASE_URL}/tasks/", json={
        "name": task_name,
        "description": "To be deleted",
        "type": "REST_API",
        "category": "INTEGRATION",
        "isRequired": False,
        "configuration": {
             "endpoint": "https://httpbin.org/delete",
             "method": "DELETE"
        }
    })
    
    if create_resp.status_code != 200:
        print(f"Failed to create task: {create_resp.text}")
        return
        
    task = create_resp.json()
    task_id = task['id']
    print(f"Created Task ID: {task_id}")

    # 2. Delete the task
    print(f"Deleting task {task_id}...")
    delete_resp = requests.delete(f"{BASE_URL}/tasks/{task_id}")
    
    if delete_resp.status_code == 200:
        print("Delete successful!")
        print(delete_resp.json())
    else:
        print(f"Delete failed: {delete_resp.status_code}")
        print(delete_resp.text)

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Exception: {e}")
