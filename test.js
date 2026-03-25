async function runTests() {
    const baseUrl = 'http://localhost:3000/users';
    
    console.log('--- Testing POST /users ---');
    let res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' })
    });
    let data = await res.json();
    console.log(data);
    let newUserId = data.data.id;

    console.log('\n--- Testing GET /users ---');
    res = await fetch(baseUrl);
    data = await res.json();
    console.log(data);

    console.log('\n--- Testing GET /users/:id ---');
    res = await fetch(`${baseUrl}/${newUserId}`);
    data = await res.json();
    console.log(data);

    console.log('\n--- Testing PUT /users/:id ---');
    res = await fetch(`${baseUrl}/${newUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice Smith' })
    });
    data = await res.json();
    console.log(data);

    console.log('\n--- Testing GET /users?search= ---');
    res = await fetch(`${baseUrl}?search=Alice`);
    data = await res.json();
    console.log(data);

    console.log('\n--- Testing DELETE /users/:id ---');
    res = await fetch(`${baseUrl}/${newUserId}`, { method: 'DELETE' });
    data = await res.json();
    console.log(data);
}

runTests().catch(console.error);
