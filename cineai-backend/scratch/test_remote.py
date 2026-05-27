import http.client
import json

def test_remote():
    conn = http.client.HTTPSConnection("cine-ai-lqr6.onrender.com")
    payload = {
        "prompt": "best comedy movies",
        "context": []
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        conn.request("POST", "/api/v1/chat/guest/message", json.dumps(payload), headers)
        res = conn.getresponse()
        data = res.read().decode("utf-8")
        print(f"Status Code: {res.status}")
        try:
            print("Response:")
            print(json.dumps(json.loads(data), indent=2))
        except Exception:
            print(data)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_remote()
