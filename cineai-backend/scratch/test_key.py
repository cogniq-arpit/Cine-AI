import http.client
import json

def test_local_key():
    conn = http.client.HTTPConnection("127.0.0.1", 8000)
    payload = {
        "prompt": "Recommend an emotional sci-fi film",
        "context": []
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        print("--- Testing Local Chatbot with New Gemini Key ---")
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
    test_local_key()
