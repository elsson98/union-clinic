// Create this as a new file named api-test.js
// You can use this to test your API endpoints

document.addEventListener('DOMContentLoaded', function () {
    const testButton = document.createElement('button');
    testButton.textContent = 'Test API Connection';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.right = '20px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '10px';
    testButton.style.background = '#4CAF50';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';

    testButton.addEventListener('click', testAPI);
    document.body.appendChild(testButton);
});

function testAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
        showResult('No authentication token found. Please log in.');
        return;
    }

    const resultDiv = document.createElement('div');
    resultDiv.style.position = 'fixed';
    resultDiv.style.top = '50%';
    resultDiv.style.left = '50%';
    resultDiv.style.transform = 'translate(-50%, -50%)';
    resultDiv.style.zIndex = '10000';
    resultDiv.style.padding = '20px';
    resultDiv.style.background = 'white';
    resultDiv.style.border = '1px solid #ccc';
    resultDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    resultDiv.style.maxWidth = '80%';
    resultDiv.style.maxHeight = '80%';
    resultDiv.style.overflow = 'auto';

    // Add a title
    const title = document.createElement('h3');
    title.textContent = 'API Connection Test';
    resultDiv.appendChild(title);

    // Add content area
    const content = document.createElement('div');
    content.style.marginBottom = '20px';
    content.innerHTML = '<p>Testing API connection...</p>';
    resultDiv.appendChild(content);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.padding = '5px 10px';
    closeBtn.onclick = () => document.body.removeChild(resultDiv);
    resultDiv.appendChild(closeBtn);

    document.body.appendChild(resultDiv);

    // Test endpoints
    const endpoints = [
        {name: 'Get all patients', url: 'http://localhost:8000/patients/'},
        {name: 'Get specific patient', url: 'http://localhost:8000/patients/TEST123'}
    ];

    let results = '';
    let completedTests = 0;

    endpoints.forEach(endpoint => {
        results += `<h4>Testing: ${endpoint.name}</h4>`;
        results += `<p>URL: ${endpoint.url}</p>`;

        fetch(endpoint.url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        })
            .then(response => {
                results += `<p>Status: ${response.status} ${response.statusText}</p>`;

                return response.text().then(text => {
                    try {
                        // Try to parse as JSON
                        const json = JSON.parse(text);
                        results += `<p>Response: JSON with ${Object.keys(json).length} keys</p>`;
                        if (Array.isArray(json)) {
                            results += `<p>Array with ${json.length} items</p>`;
                        }
                    } catch (e) {
                        // Not JSON, just show the text (truncated if too long)
                        const truncated = text.length > 200 ? text.substring(0, 200) + '...' : text;
                        results += `<p>Response text: ${truncated}</p>`;
                    }

                    completedTests++;
                    if (completedTests === endpoints.length) {
                        content.innerHTML = results;
                    }
                });
            })
            .catch(error => {
                results += `<p>Error: ${error.message}</p>`;
                completedTests++;
                if (completedTests === endpoints.length) {
                    content.innerHTML = results;
                }
            });
    });
}

function showResult(message) {
    alert(message);
}