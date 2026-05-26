import urllib.request
import json
import traceback

def test_gemma_api():
    api_key = "AIzaSyDVZclwVZn0kKdUd2Ye7-d8xewtY76cBXg"
    base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent"
    
    url = f"{base_url}?key={api_key}"
    
    payload_basic = {
        "contents": [{
            "parts": [{"text": "Hello, who are you?"}]
        }]
    }
    
    print("--- Testing Basic Request via urllib ---")
    data = json.dumps(payload_basic).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"Status Code: {status}")
            print(f"Response: {body}\n")
    except urllib.error.HTTPError as e:
        print(f"HTTPError Status: {e.code}")
        print(f"HTTPError Reason: {e.reason}")
        print(f"HTTPError Body: {e.read().decode('utf-8')}\n")
    except Exception as e:
        print("General Exception:")
        traceback.print_exc()

if __name__ == "__main__":
    test_gemma_api()
