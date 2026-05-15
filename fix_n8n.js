const fs = require('fs');
const filepath = '/home/banerjeesumanto08/print_on_demand/n8n_content_generation.json';
const data = require(filepath);

// 1. Remove "Split In Batches" node
const splitNodeIdx = data.nodes.findIndex(n => n.name === 'Split In Batches');
if (splitNodeIdx !== -1) {
    data.nodes.splice(splitNodeIdx, 1);
}

// 2. Change all "Split In Batches" references to "If Empty"
data.nodes = data.nodes.map(node => {
    let text = JSON.stringify(node);
    text = text.replace(/\$\('Split In Batches'\)/g, "$('If Empty')");
    return JSON.parse(text);
});

// 3. Update "If Empty" connections to skip Split In Batches
if (data.connections['If Empty']) {
    // True path (index 0) goes to Google Sheets Lookup #1, False path (index 1) goes nowhere
    data.connections['If Empty'].main = [
        [{ "node": "Google Sheets Lookup #1", "type": "main", "index": 0 }],
        []
    ];
}

// 4. Update Google Sheets Append to not loop back
if (data.connections['Google Sheets: Append']) {
    data.connections['Google Sheets: Append'].main = [[]];
}

// 5. Update "Google Drive" to "Google Drive Search"
const gdNode = data.nodes.find(n => n.id === '09a141e2-f90c-46f3-aabd-00a863085d92' || n.name === 'Google Drive');
if (gdNode) {
    gdNode.name = 'Google Drive Search';
    gdNode.parameters = {
        operation: 'search',
        queryString: "={{ 'name = \\'Brand Guidelines - ' + $('If Empty').item.json.brand + '\\'' }}",
        options: {}
    };
    if (data.connections['Google Sheets Lookup #2']) {
        data.connections['Google Sheets Lookup #2'].main = [
            [{ "node": "Google Drive Search", "type": "main", "index": 0 }]
        ];
    }
}

// 6. Add "Google Docs Read" node
const docsNodeId = "google-docs-read-" + Date.now();
const docsNode = {
    "parameters": {
        "operation": "read",
        "documentId": {
            "__rl": true,
            "value": "={{ $json.id }}",
            "mode": "id"
        }
    },
    "id": docsNodeId,
    "name": "Google Docs Read",
    "type": "n8n-nodes-base.googleDocs",
    "typeVersion": 2,
    "position": [
        4400,
        -2160
    ]
};
data.nodes.push(docsNode);

// 7. Update connections for Google Drive Search -> Google Docs Read -> Loop Over Items
if (data.connections['Google Drive']) {
    // If it was already named 'Google Drive' in connections
    data.connections['Google Drive Search'] = {
        main: [
            [{ "node": "Google Docs Read", "type": "main", "index": 0 }]
        ]
    };
    delete data.connections['Google Drive'];
}
data.connections['Google Docs Read'] = {
    main: [
        [{ "node": "Loop Over Items", "type": "main", "index": 0 }]
    ]
};

// 8. Delete Split In Batches connections
delete data.connections['Split In Batches'];

// Write back
fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
console.log('n8n workflow updated successfully');
