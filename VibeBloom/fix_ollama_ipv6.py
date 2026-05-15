import json
import glob

for f in glob.glob("/home/banerjeesumanto08/print_on_demand/VibeBloom/*.json"):
    with open(f, "r") as file:
        data = json.load(file)
        modified = False
        if "nodes" in data:
            for node in data["nodes"]:
                if node.get("type") == "n8n-nodes-base.httpRequest":
                    if "http://localhost:11434" in node["parameters"].get("url", ""):
                        node["parameters"]["url"] = node["parameters"]["url"].replace("http://localhost:11434", "http://127.0.0.1:11434")
                        modified = True
                        
    if modified:
        with open(f, "w") as file:
            json.dump(data, file, indent=2)
        print(f"Patched {f} to use 127.0.0.1!")
