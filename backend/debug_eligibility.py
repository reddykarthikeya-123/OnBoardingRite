from app.core.database import get_db
from app.models.models import EligibilityCriteria
import json

db = next(get_db())

# Get first criteria
criteria = db.query(EligibilityCriteria).first()
if not criteria:
    print("No criteria found")
    exit()

print(f"Criteria: {criteria.name}")
print(f"Rules count: {len(criteria.rules)}")
print(f"Root logic: {criteria.root_group_logic}")

# Check rules
for rule in criteria.rules:
    print(f"\nRule {rule.id}:")
    print(f"  Type: {rule.rule_type}")
    print(f"  Parent: {rule.parent_group_id}")
    if rule.rule_type == 'FIELD_RULE':
        print(f"  Field: {rule.field_category}.{rule.field_name}")
        print(f"  Operator: {rule.operator}")
        print(f"  Value: {rule.value}")
