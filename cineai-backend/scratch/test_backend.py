import urllib.request
import json
import traceback

def test_live_backend():
    url = "https://cine-ai-lqr6.onrender.com/api/v1/chat/guest/message"
    
    payload = {
        "prompt": "Recommend me some good space movies",
        "context": []
    }
    
    print("--- Testing Live Render Backend Chat Endpoint ---")
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"Status Code: {status}")
            print(f"Response Body: {body}\n")
    except urllib.error.HTTPError as e:
        print(f"HTTPError Status: {e.code}")
        print(f"HTTPError Reason: {e.reason}")
        try:
            print(f"HTTPError Body: {e.read().decode('utf-8')}\n")
        except:
            pass
    except Exception as e:
        print("General Exception:")
        traceback.print_exc()

if __name__ == "__main__":
    test_live_backend()
