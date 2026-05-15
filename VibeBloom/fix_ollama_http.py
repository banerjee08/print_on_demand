import json
import glob

for f in glob.glob("/home/banerjeesumanto08/print_on_demand/VibeBloom/*.json"):
    with open(f, "r") as file:
        data = json.load(file)
        modified = False
        if "nodes" in data:
            for node in data["nodes"]:
                if node.get("type") in ["n8n-nodes-base.ollama", "@n8n/n8n-nodes-langchain.ollama"]:
                    node["type"] = "n8n-nodes-base.httpRequest"
                    node["typeVersion"] = 4.1
                    
                    if "modelId" in node["parameters"]:
                        old_model = node["parameters"]["modelId"].get("value", "qwen3:1.7b")
                        prompt_expr = node["parameters"]["messages"]["values"][0]["content"]
                    else:
                        old_model = node["parameters"].get("model", "qwen3:1.7b")
                        prompt_expr = node["parameters"].get("prompt", "={{ '' }}")

                    # Extract raw JS from the prompt expression
                    if prompt_expr.startswith("={{") and prompt_expr.endswith("}}"):
                        raw_js = prompt_expr[3:-2].strip()
                    else:
                        raw_js = f"'{prompt_expr}'"
                        
                    # Handle dynamic model vs static
                    if "||" in old_model:
                        model_js = old_model.replace("={{", "").replace("}}", "").strip()
                    else:
                        model_js = f"'{old_model}'"

                    node["parameters"] = {
                        "method": "POST",
                        "url": "http://localhost:11434/api/chat",
                        "sendBody": True,
                        "specifyBody": "json",
                        "jsonBody": f"={{{{ {{ model: {model_js}, stream: false, messages: [ {{ role: 'user', content: {raw_js} }} ] }} }}}}",
                        "options": {}
                    }
                    
                    # Also need to fix the downstream node references since HTTP Request returns data in `$json.choices[0].message.content` or `$json.message.content`
                    modified = True
                    
            if modified:
                # Need to patch where the output is read. In HTTP Request hitting Ollama /api/chat, the response is { "model": "...", "message": { "role": "assistant", "content": "..." } }
                # So `$json.message.content` still holds true!
                pass
                    
    if modified:
        with open(f, "w") as file:
            json.dump(data, file, indent=2)
        print(f"Patched {f} to use native HTTP Request!")
