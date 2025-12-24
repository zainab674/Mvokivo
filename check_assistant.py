
import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def check_assistant():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "ultratalk")
    
    print(f"MongoDB URI: {uri[:30]}...")
    print(f"Database: {db_name}\n")
    
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # First, list all assistants
    print("=== ALL ASSISTANTS ===")
    cursor = db.assistants.find({}).limit(10)
    assistants = await cursor.to_list(length=10)
    
    if assistants:
        for asst in assistants:
            asst_id = asst.get("id") or str(asst.get("_id"))
            name = asst.get("name", "Unnamed")
            nodes_count = len(asst.get("nodes") or [])
            edges_count = len(asst.get("edges") or [])
            print(f"- ID: {asst_id}")
            print(f"  Name: {name}")
            print(f"  Nodes: {nodes_count}, Edges: {edges_count}")
            print()
    else:
        print("No assistants found in database!")
        
    # Now check specific assistant
    assistant_id = "694c438399e5550209b3b7e6"
    print(f"\n=== CHECKING SPECIFIC ASSISTANT: {assistant_id} ===")
    
    query = {"id": assistant_id}
    if len(assistant_id) == 24:
        try:
            query = {"_id": ObjectId(assistant_id)}
        except:
            pass
            
    assistant = await db.assistants.find_one(query)
    
    if assistant:
        print("✓ Assistant found!")
        assistant_copy = assistant.copy()
        if "_id" in assistant_copy: assistant_copy["_id"] = str(assistant_copy["_id"])
        
        print(f"Name: {assistant_copy.get('name')}")
        print(f"Nodes count: {len(assistant_copy.get('nodes') or [])}")
        print(f"Edges count: {len(assistant_copy.get('edges') or [])}")
        
        if assistant_copy.get("nodes"):
            print("\nNodes summary:")
            for node in assistant_copy.get("nodes", []):
                print(f"- Node {node.get('id')}: {node.get('type')} - {node.get('data', {}).get('title')}")
            
        if assistant_copy.get("edges"):
            print("\nEdges summary:")
            for edge in assistant_copy.get("edges", []):
                edge_data = edge.get('data', {})
                desc = edge_data.get('description') or edge_data.get('label') or 'no label'
                print(f"- Edge {edge.get('id')}: {edge.get('source')} -> {edge.get('target')} ({desc})")
    else:
        print("✗ Assistant NOT FOUND")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_assistant())
