import json
import glob

files = glob.glob("/home/banerjeesumanto08/print_on_demand/VibeBloom/*.json")
for f in files:
    with open(f, "r") as file:
        wf = json.load(file)
        modified = False
        
        if "nodes" in wf:
            for node in wf["nodes"]:
                if node.get("type") == "n8n-nodes-base.googleSheets":
                    # Force resource
                    node["parameters"]["resource"] = "sheet"
                    op = node["parameters"].get("operation")
                    
                    if op == "getAll":
                        node["parameters"]["operation"] = "read"
                        # For V4 mapping
                        node["parameters"]["filtersUI"] = {}
                        node["parameters"]["options"] = {}
                    
                    modified = True
                    
        if modified:
            with open(f, "w") as file:
                json.dump(wf, file, indent=2)
            print(f"Patched Google Sheets nodes in {f} to v4 syntax")
