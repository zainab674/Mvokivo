
import os
from dotenv import load_dotenv

# Try root .env
root_env = os.path.join(os.getcwd(), '.env')
if os.path.exists(root_env):
    print(f"Loading {root_env}")
    load_dotenv(root_env, override=True)

print(f"ROOT_LIVEKIT_URL: {os.getenv('LIVEKIT_URL')}")
print(f"ROOT_LIVEKIT_API_KEY: {os.getenv('LIVEKIT_API_KEY')[:5]}...")
print(f"ROOT_LIVEKIT_API_SECRET: {os.getenv('LIVEKIT_API_SECRET')[:5]}...")
