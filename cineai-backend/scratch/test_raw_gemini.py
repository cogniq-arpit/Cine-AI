import os
import json
import httpx
import asyncio

async def test_raw_gemini():
    api_key = "AIzaSyDnlzBZu7d8u4yYiKr7o68llJ5v_5TkKww"
    model = "gemini-3.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    system_instruction = (
        "You are Cine AI, an elite cinematic intelligence and personal movie companion. "
        "You respond like a warm, specific, opinionated film critic. "
        "Never use generic filler. Always adapt to the user's exact prompt, including people, directors, actors, genres, languages, moods, dates, and constraints.\n\n"
        "Return ONLY strict JSON with this shape:\n"
        "{\n"
        "  \"message\": \"A natural 2-4 sentence response tailored to the user prompt.\",\n"
        "  \"movieSearchQueries\": [\"Exact Movie Title 1\", \"Exact Movie Title 2\", \"Exact Movie Title 3\"],\n"
        "  \"moodTags\": [\"tag1\", \"tag2\", \"tag3\"]\n"
        "}\n\n"
        "Rules:\n"
        "1. movieSearchQueries must contain real film titles suitable for TMDB search.\n"
        "2. For director or actor prompts, recommend movies strongly connected to that person.\n"
        "3. For greetings or non-recommendation chatter, use empty arrays for movieSearchQueries and moodTags.\n"
        "4. Do not wrap JSON in markdown fences.\n"
        "5. Do not invent platform availability or ratings.\n"
        "6. If you cannot satisfy the exact request, explain briefly in message and return the closest valid titles."
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system_instruction}\n\nUser prompt: Ryan Coogler movies"}]
            }
        ],
        "generationConfig": {
            "temperature": 0.75,
            "maxOutputTokens": 700,
            "responseMimeType": "application/json",
        },
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    print("Sending request to Gemini...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        res_json = response.json()
        print("Response JSON:")
        print(json.dumps(res_json, indent=2))
        
        candidates = res_json.get("candidates") or []
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            text = "".join(part.get("text", "") for part in parts).strip()
            print("\nRaw Text inside Response:")
            print(text)
            
            try:
                parsed = json.loads(text)
                print("\nParsed JSON:")
                print(json.dumps(parsed, indent=2))
            except Exception as e:
                print(f"\nJSON parsing failed: {e}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_raw_gemini())
