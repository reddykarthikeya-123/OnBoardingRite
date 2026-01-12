from app.core.database import SessionLocal
from app.models.models import Project, ChecklistTemplate

db = SessionLocal()
project = db.query(Project).filter(Project.id == 'ce001111-1111-1111-1111-111111111111').first()

print(f"Project: {project.name}")
print(f"Template ID: {project.template_id}")

if project.template_id:
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == project.template_id).first()
    if template:
        print(f"Template Name from DB: {template.name}")
    else:
        print("Template not found in DB")
else:
    print("No template assigned")

if project.template:
    print(f"Template via Relation: {project.template.name}")
else:
    print("Template relation is None")

db.close()
