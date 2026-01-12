import os

def patch_schema():
    # Path to schema_ddl.sql (in root)
    schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "schema_ddl.sql")
    
    print(f"Reading {schema_path}...")
    with open(schema_path, "r") as f:
        content = f.read()

    # Replace CREATE INDEX with CREATE INDEX IF NOT EXISTS
    # Ensure we don't break existing IF NOT EXISTS
    new_content = content.replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ")
    new_content = new_content.replace("CREATE INDEX IF NOT EXISTS IF NOT EXISTS ", "CREATE INDEX IF NOT EXISTS ")
    
    with open(schema_path, "w") as f:
        f.write(new_content)
    print("✅ Patched schema_ddl.sql with IF NOT EXISTS")

if __name__ == "__main__":
    patch_schema()
