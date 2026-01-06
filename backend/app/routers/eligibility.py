from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import uuid as uuid_lib
import json

from app.core.database import get_db
from app.models.models import EligibilityCriteria, EligibilityRule
from app.schemas.eligibility import (
    EligibilityCriteriaListItem, EligibilityCriteriaDetail,
    CreateEligibilityCriteriaRequest, UpdateEligibilityCriteriaRequest
)

router = APIRouter()

def count_rules_recursive(rules: List[EligibilityRule]) -> int:
    """Recursively count all non-group rules"""
    count = 0
    # Build lookup by parent for recursive counting
    rules_by_parent = {}
    for rule in rules:
        parent_id = str(rule.parent_group_id) if rule.parent_group_id else None
        if parent_id not in rules_by_parent:
            rules_by_parent[parent_id] = []
        rules_by_parent[parent_id].append(rule)
    
    def count_children(parent_id):
        child_count = 0
        for child in rules_by_parent.get(parent_id, []):
            if child.rule_type != 'GROUP':
                child_count += 1
            else:
                child_count += count_children(str(child.id))
        return child_count
    
    return count_children(None)

def build_rule_tree(rules: List[EligibilityRule]) -> List[dict]:
    """Convert flat DB rules to nested JSON structure"""
    # Group by parent_group_id
    rules_by_parent = {}
    for rule in rules:
        parent_id = str(rule.parent_group_id) if rule.parent_group_id else None
        if parent_id not in rules_by_parent:
            rules_by_parent[parent_id] = []
        rules_by_parent[parent_id].append(rule)
    
    def build_tree_node(rule: EligibilityRule) -> dict:
        if rule.rule_type == 'GROUP':
            return {
                "id": str(rule.id),
                "type": "GROUP",
                "logic": rule.group_logic,
                "rules": [build_tree_node(r) for r in rules_by_parent.get(str(rule.id), [])]
            }
        elif rule.rule_type == 'FIELD_RULE':
            value = rule.value
            try:
                value = json.loads(value) if value and value.startswith('[') else value
            except:
                pass
            return {
                "id": str(rule.id),
                "type": "FIELD_RULE",
                "fieldId": f"{rule.field_category}.{rule.field_name}" if rule.field_category and rule.field_name else rule.field_name,
                "operator": rule.operator,
                "value": value
            }
        elif rule.rule_type == 'SQL_RULE':
            return {
                "id": str(rule.id),
                "type": "SQL_RULE",
                "name": rule.field_name or "Custom SQL",
                "description": rule.value or "",
                "sqlQuery": rule.sql_query
            }
    
    return [build_tree_node(r) for r in rules_by_parent.get(None, [])]


def save_rule_tree(criteria_id: str, parent_group_id: Optional[str], rules: List[dict], db: Session, order: int = 0) -> None:
    """Recursively save nested rule tree to flat DB structure"""
    for idx, rule_data in enumerate(rules):
        rule_id = uuid_lib.uuid4()
        
        if rule_data.get("type") == "GROUP":
            new_rule = EligibilityRule(
                id=rule_id,
                criteria_id=criteria_id,
                parent_group_id=parent_group_id,
                rule_type="GROUP",
                group_logic=rule_data.get("logic", "AND"),
                display_order=order + idx
            )
            db.add(new_rule)
            db.flush()
            # Recursively save child rules
            save_rule_tree(criteria_id, str(rule_id), rule_data.get("rules", []), db, 0)
            
        elif rule_data.get("type") == "FIELD_RULE":
            field_id = rule_data.get("fieldId", "")
            field_parts = field_id.split(".", 1) if "." in field_id else [None, field_id]
            value = rule_data.get("value")
            if isinstance(value, list):
                value = json.dumps(value)
            
            new_rule = EligibilityRule(
                id=rule_id,
                criteria_id=criteria_id,
                parent_group_id=parent_group_id,
                rule_type="FIELD_RULE",
                field_category=field_parts[0],
                field_name=field_parts[1] if len(field_parts) > 1 else field_parts[0],
                operator=rule_data.get("operator"),
                value=str(value) if value is not None else None,
                display_order=order + idx
            )
            db.add(new_rule)
            
        elif rule_data.get("type") == "SQL_RULE":
            new_rule = EligibilityRule(
                id=rule_id,
                criteria_id=criteria_id,
                parent_group_id=parent_group_id,
                rule_type="SQL_RULE",
                field_name=rule_data.get("name"),
                value=rule_data.get("description"),
                sql_query=rule_data.get("sqlQuery"),
                display_order=order + idx
            )
            db.add(new_rule)

@router.get("/", response_model=List[EligibilityCriteriaListItem])
def list_eligibility_criteria(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(EligibilityCriteria)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                EligibilityCriteria.name.ilike(search_term),
                EligibilityCriteria.description.ilike(search_term)
            )
        )
    
    criteria_list = query.all()
    
    result = []
    for c in criteria_list:
        rule_count = count_rules_recursive(c.rules)
        result.append(EligibilityCriteriaListItem(
            id=str(c.id),
            name=c.name,
            description=c.description,
            isActive=c.is_active,
            ruleCount=rule_count,
            createdAt=c.created_at,
            updatedAt=c.updated_at
        ))
    
    return result

@router.get("/{criteria_id}", response_model=EligibilityCriteriaDetail)
def get_eligibility_criteria(criteria_id: str, db: Session = Depends(get_db)):
    criteria = db.query(EligibilityCriteria).filter(EligibilityCriteria.id == criteria_id).first()
    if not criteria:
        raise HTTPException(status_code=404, detail="Eligibility criteria not found")
    
    rule_tree = build_rule_tree(criteria.rules)
    root_group = {
        "id": "root",
        "type": "GROUP",
        "logic": criteria.root_group_logic,
        "rules": rule_tree
    }
    
    return EligibilityCriteriaDetail(
        id=str(criteria.id),
        name=criteria.name,
        description=criteria.description,
        isActive=criteria.is_active,
        rootGroup=root_group,
        createdAt=criteria.created_at,
        updatedAt=criteria.updated_at
    )

@router.post("/", response_model=EligibilityCriteriaDetail)
def create_eligibility_criteria(data: CreateEligibilityCriteriaRequest, db: Session = Depends(get_db)):
    new_criteria = EligibilityCriteria(
        id=uuid_lib.uuid4(),
        name=data.name,
        description=data.description,
        is_active=True,
        root_group_logic=data.rootGroup.get("logic", "AND"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_criteria)
    db.flush()
    
    # Save nested rules
    save_rule_tree(str(new_criteria.id), None, data.rootGroup.get("rules", []), db)
    
    db.commit()
    db.refresh(new_criteria)
    
    return get_eligibility_criteria(str(new_criteria.id), db)

@router.put("/{criteria_id}", response_model=EligibilityCriteriaDetail)
def update_eligibility_criteria(
    criteria_id: str,
    data: UpdateEligibilityCriteriaRequest,
    db: Session = Depends(get_db)
):
    criteria = db.query(EligibilityCriteria).filter(EligibilityCriteria.id == criteria_id).first()
    if not criteria:
        raise HTTPException(status_code=404, detail="Eligibility criteria not found")
    
    if data.name is not None:
        criteria.name = data.name
    if data.description is not None:
        criteria.description = data.description
    if data.isActive is not None:
        criteria.is_active = data.isActive
    if data.rootGroup is not None:
        # Delete existing rules
        db.query(EligibilityRule).filter(EligibilityRule.criteria_id == criteria_id).delete()
        # Save new rules
        criteria.root_group_logic = data.rootGroup.get("logic", "AND")
        save_rule_tree(criteria_id, None, data.rootGroup.get("rules", []), db)
    
    criteria.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(criteria)
    
    return get_eligibility_criteria(criteria_id, db)

@router.delete("/{criteria_id}")
def delete_eligibility_criteria(criteria_id: str, db: Session = Depends(get_db)):
    criteria = db.query(EligibilityCriteria).filter(EligibilityCriteria.id == criteria_id).first()
    if not criteria:
        raise HTTPException(status_code=404, detail="Eligibility criteria not found")
    
    db.delete(criteria)
    db.commit()
    
    return {"success": True}
