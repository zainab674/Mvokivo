
import os
from dotenv import load_dotenv

# Try livekit/.env first
livekit_env = os.path.join(os.getcwd(), 'livekit', '.env')
if os.path.exists(livekit_env):
    print(f"Loading {livekit_env}")
    load_dotenv(livekit_env)

print(f"LIVEKIT_URL: {os.getenv('LIVEKIT_URL')}")
print(f"LIVEKIT_API_KEY: {os.getenv('LIVEKIT_API_KEY')[:5]}...")
print(f"LIVEKIT_API_SECRET: {os.getenv('LIVEKIT_API_SECRET')[:5]}...")
print(f"LK_AGENT_NAME: {os.getenv('LK_AGENT_NAME')}")
