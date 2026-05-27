import http.client
import json

def test_diagnostics():
    print("--- Testing Diagnostics Endpoint ---")
    conn = http.client.HTTPConnection("127.0.0.1", 8000)
    try:
        conn.request("GET", "/api/v1/chat/diagnostics")
        res = conn.getresponse()
        data = res.read().decode("utf-8")
        print(f"Status: {res.status}")
        print("Response:")
        print(json.dumps(json.loads(data), indent=2))
    except Exception as e:
        print(f"Failed: {e}")
    finally:
        conn.close()

def test_guest_chat():
    print("\n--- Testing Guest Chat Endpoint ---")
    prompts = [
        "Ryan Coogler movies",
        "something emotional",
        "best comedy movies"
    ]
    for prompt in prompts:
        print(f"\n>> Sending prompt: '{prompt}'")
        conn = http.client.HTTPConnection("127.0.0.1", 8000)
        payload = {
            "prompt": prompt,
            "context": []
        }
        headers = {
            "Content-Type": "application/json"
        }
        try:
            conn.request("POST", "/api/v1/chat/guest/message", json.dumps(payload), headers)
            res = conn.getresponse()
            data = res.read().decode("utf-8")
            print(f"Status: {res.status}")
            try:
                parsed = json.loads(data)
                if "content" in parsed:
                    content_parsed = json.loads(parsed["content"])
                    print("Parsed AI Response:")
                    print(json.dumps(content_parsed, indent=2))
                else:
                    print("Response:", parsed)
            except Exception:
                print("Raw Response:", data)
        except Exception as e:
            print(f"Failed: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    test_diagnostics()
    test_guest_chat()
