import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_database():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "ultratalk")
    
    print(f"MongoDB URI: {uri[:30]}...")
    print(f"Database: {db_name}\n")
    
    client = AsyncIOMotorClient(uri)
    
    # List all databases
    print("=== ALL DATABASES ===")
    db_list = await client.list_database_names()
    for db in db_list:
        print(f"- {db}")
    
    # Check collections in the configured database
    db = client[db_name]
    print(f"\n=== COLLECTIONS IN '{db_name}' ===")
    collections = await db.list_collection_names()
    for coll in collections:
        count = await db[coll].count_documents({})
        print(f"- {coll}: {count} documents")
    
    # Check if there's data in other common database names
    for alt_db_name in ["test", "admin", "local", "voiceagents", "ultratalk_dev"]:
        if alt_db_name in db_list and alt_db_name != db_name:
            alt_db = client[alt_db_name]
            alt_collections = await alt_db.list_collection_names()
            if alt_collections:
                print(f"\n=== COLLECTIONS IN '{alt_db_name}' ===")
                for coll in alt_collections:
                    count = await alt_db[coll].count_documents({})
                    if count > 0:
                        print(f"- {coll}: {count} documents")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_database())
