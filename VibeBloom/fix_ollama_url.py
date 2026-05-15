import json
import glob

for f in glob.glob("/home/banerjeesumanto08/print_on_demand/VibeBloom/*.json"):
    with open(f, "r") as file:
        data = json.load(file)
        modified = False
        if "nodes" in data:
            for node in data["nodes"]:
                if node.get("type") == "n8n-nodes-base.httpRequest":
                    url = node["parameters"].get("url", "")
                    if "http://127.0.0.1:11434" in url:
                        node["parameters"]["url"] = url.replace("http://127.0.0.1:11434", "https://ollama.sbanerjee.cloud")
                        modified = True
                        
    if modified:
        with open(f, "w") as file:
            json.dump(data, file, indent=2)
        print(f"Patched {f} to use https://ollama.sbanerjee.cloud!")
