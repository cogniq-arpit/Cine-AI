import http.client
import json

def test_remote_movies():
    conn = http.client.HTTPSConnection("cine-ai-lqr6.onrender.com")
    try:
        print("--- Testing Remote Trending Movies ---")
        conn.request("GET", "/api/v1/movies/trending")
        res = conn.getresponse()
        data = res.read().decode("utf-8")
        print(f"Status: {res.status}")
        try:
            parsed = json.loads(data)
            print(f"Number of movies: {len(parsed)}")
            if len(parsed) > 0:
                print("First movie details:")
                print(json.dumps(parsed[0], indent=2))
        except Exception:
            print(data[:300])

        print("\n--- Testing Remote Popular Movies ---")
        conn.request("GET", "/api/v1/movies/popular")
        res2 = conn.getresponse()
        data2 = res2.read().decode("utf-8")
        print(f"Status: {res2.status}")
        try:
            parsed2 = json.loads(data2)
            print(f"Number of movies: {len(parsed2)}")
            if len(parsed2) > 0:
                print("First movie details:")
                print(json.dumps(parsed2[0], indent=2))
        except Exception:
            print(data2[:300])

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_remote_movies()
