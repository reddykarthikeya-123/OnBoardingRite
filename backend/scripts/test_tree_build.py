from app.routers.eligibility import build_rule_tree
from app.core.database import get_db
from app.models.models import Elig ibilityriteria
import json

db = next(get_db())
criteria = db.query(EligibilityCriteria).first()

try:
    tree = build_rule_tree(criteria.rules)
    print("Tree built successfully:")
    print(json.dumps(tree, indent=2))
except Exception as e:
    print(f"Error building tree: {e}")
    import traceback
    traceback.print_exc()
