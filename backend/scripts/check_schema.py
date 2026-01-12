import oracledb
import os

# Connection details
user = "RITEUSER"
pwd = "RITEUSER"
dsn = "129.80.10.69:1521/TIMERITETEST"

print(f"Connecting to {dsn} as {user}...")

try:
    connection = oracledb.connect(user=user, password=pwd, dsn=dsn)
    cursor = connection.cursor()

    query = """
    SELECT table_name, column_name, data_type, data_length
    FROM user_tab_columns
    WHERE table_name LIKE '%OR\_%' ESCAPE '\\'
    ORDER BY table_name, column_id
    """

    print("Executing query...")
    cursor.execute(query)
    rows = cursor.fetchall()

    if not rows:
        print("No tables found matching the pattern '%OR_%'")
    else:
        current_table = None
        output_file = os.path.join(os.path.dirname(__file__), "schema_report.txt")
        with open(output_file, "w") as f:
            for row in rows:
                table_name, col_name, data_type, data_len = row
                if table_name != current_table:
                    if current_table:
                        f.write("\n")
                    f.write(f"Table: {table_name}\n")
                    f.write("-" * 50 + "\n")
                    current_table = table_name
                
                f.write(f"{col_name:<30} {data_type:<15} {data_len}\n")
        
        print(f"Schema report generated at {output_file}")
        
        # Also print to stdout for immediate view
        with open(output_file, "r") as f:
            print(f.read())

except oracledb.Error as e:
    print(f"Error connecting to Oracle DB: {e}")
except Exception as ex:
    print(f"An unexpected error occurred: {ex}")
finally:
    if 'connection' in locals():
        connection.close()
