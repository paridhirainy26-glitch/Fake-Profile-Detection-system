
from dotenv import load_dotenv
import mysql.connector
import os

load_dotenv()

try:
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "fake_profile_db")
    )

    print("MySQL connection successful!")

    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    print("Tables:", cursor.fetchall())

    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    print("Database connection failed:", err)
