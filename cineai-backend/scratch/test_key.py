import httpx
import asyncio

async def test_gemma_api():
    api_key = "AIzaSyDXy6VzKcCL92UtN2QyYYxGvDRbd4RXkoc"
    base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent"
    
    headers = {"Content-Type": "application/json"}
    url = f"{base_url}?key={api_key}"
    
    # 1. Test basic request (no complex tools)
    payload_basic = {
        "contents": [{
            "parts": [{"text": "Hello, who are you?"}]
        }]
    }
    
    # 2. Test full request with tools & thinkingConfig
    payload_full = {
        "contents": [{
            "parts": [{"text": "Hello, who are you?"}]
        }],
        "tools": [{"googleSearch": {}}],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 600,
            "thinkingConfig": {
                "thinkingLevel": "HIGH"
            }
        }
    }
    
    async with httpx.AsyncClient() as client:
        print("--- Testing Basic Request ---")
        try:
            res = await client.post(url, headers=headers, json=payload_basic, timeout=10.0)
            print(f"Status Code: {res.status_code}")
            print(f"Response Text: {res.text}\n")
        except Exception as e:
            print(f"Failed: {e}\n")
            
        print("--- Testing Full Request with Tools & Thinking ---")
        try:
            res = await client.post(url, headers=headers, json=payload_full, timeout=10.0)
            print(f"Status Code: {res.status_code}")
            print(f"Response Text: {res.text}\n")
        except Exception as e:
            print(f"Failed: {e}\n")

if __name__ == "__main__":
    asyncio.run(test_gemma_api())
