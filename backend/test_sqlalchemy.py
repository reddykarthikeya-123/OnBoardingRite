import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

print(f"DEBUG: ORACLE_USER={settings.ORACLE_USER}")
# print(f"DEBUG: ORACLE_PASSWORD={settings.ORACLE_PASSWORD}") # Safety
print(f"DEBUG: ORACLE_DSN={settings.ORACLE_DSN}")
print(f"DEBUG: DATABASE_URL={settings.DATABASE_URL}")

try:
    # Try alternate format
    # Ref: https://docs.sqlalchemy.org/en/20/dialects/oracle.html#url-encoding
    alt_url = f"oracle+oracledb://{settings.ORACLE_USER}:{settings.ORACLE_PASSWORD}@{settings.ORACLE_DSN.split('/')[0]}/?service_name={settings.ORACLE_DSN.split('/')[1]}"
    print(f"Trying ALT URL: {alt_url}")
    
    engine = create_engine(alt_url)
    connection = engine.connect()
    print("SUCCESS: Connection established via SQLAlchemy (Alt URL)!")
    
    result = connection.execute(text("SELECT 1 FROM DUAL"))
    print(f"Test Query Result: {result.fetchone()}")
    
    connection.close()
except Exception as e:
    print(f"ERROR: {e}")
    # Print detailed traceback
    import traceback
    traceback.print_exc()
