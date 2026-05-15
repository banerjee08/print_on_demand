import json
import glob

files = [
    "/home/banerjeesumanto08/print_on_demand/VibeBloom/vibebloom_slogan_generation.json",
    "/home/banerjeesumanto08/print_on_demand/VibeBloom/vibebloom_dress_design_prompt_from_slogan.json",
    "/home/banerjeesumanto08/print_on_demand/VibeBloom/vibebloom_dress_design_prompt_no_slogan.json"
]

for f in files:
    with open(f, 'r') as file:
        wf = json.load(file)
        modified = False
        if "nodes" in wf:
            for node in wf["nodes"]:
                if node["name"] == "Format Memory" and node["type"] == "n8n-nodes-base.code":
                    code = node["parameters"]["jsCode"]
                    # Remove the offending lines
                    lines = code.split("\n")
                    new_lines = [line for line in lines if not line.strip().startswith("const bPrompt = $('Ollama")]
                    node["parameters"]["jsCode"] = "\n".join(new_lines)
                    modified = True
                    
    if modified:
        with open(f, 'w') as file:
            json.dump(wf, file, indent=2)
        print(f"Patched {f}")
