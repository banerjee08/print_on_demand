import json
import glob

for f in glob.glob("/home/banerjeesumanto08/print_on_demand/VibeBloom/*.json"):
    with open(f, "r") as file:
        data = json.load(file)
        modified = False
        if "nodes" in data:
            for node in data["nodes"]:
                if node.get("type") == "n8n-nodes-base.ollama":
                    node["type"] = "@n8n/n8n-nodes-langchain.ollama"
                    old_model = node["parameters"].get("model", "qwen3:1.7b")
                    old_prompt = node["parameters"].get("prompt", "")
                    
                    node["parameters"] = {
                        "resource": "text",
                        "operation": "message",
                        "modelId": {
                            "__rl": True,
                            "mode": "list",
                            "value": old_model.replace("={{ $json.model || '", "").replace("' }}", "") if "||" in old_model else old_model
                        },
                        "messages": {
                            "values": [
                                {
                                    "role": "user",
                                    "content": old_prompt
                                }
                            ]
                        },
                        "options": {}
                    }
                    if "||" in old_model:
                       node["parameters"]["modelId"]["mode"] = "id"
                       node["parameters"]["modelId"]["value"] = old_model
                       
                    modified = True
                    
    if modified:
        with open(f, "w") as file:
            json.dump(data, file, indent=2)
        print(f"Patched {f}")
