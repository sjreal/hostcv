import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the ngrok URL from environment variables or use default
ngrok_url = os.getenv("NGROK_URL", "http://localhost:8000")

# Test credentials (you should use actual test credentials)
test_email = "admin@example.com"
test_password = "password123"

def test_user_role():
    # Step 1: Login to get the token
    login_url = f"{ngrok_url}/token"
    login_data = {
        "username": test_email,
        "password": test_password
    }
    
    try:
        response = requests.post(login_url, data=login_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"Login successful. Token: {token[:20]}...")
        else:
            print(f"Login failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return
    except Exception as e:
        print(f"Error during login: {e}")
        return
    
    # Step 2: Get user data
    user_url = f"{ngrok_url}/users/me"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(user_url, headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print(f"User data retrieved successfully:")
            print(f"  ID: {user_data['id']}")
            print(f"  Username: {user_data['username']}")
            print(f"  Email: {user_data['email']}")
            print(f"  Role: {user_data['role']}")
            print(f"  Is Active: {user_data['is_active']}")
        else:
            print(f"Failed to get user data. Status code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error getting user data: {e}")

if __name__ == "__main__":
    test_user_role()