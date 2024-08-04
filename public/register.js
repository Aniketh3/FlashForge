document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            alert('Registration successful!');
            window.location.href = 'login.html';
        } else {
            const data = await response.json();
            alert(`Registration failed: ${data.error}`);
        }
    } catch (error) {
        alert('Error registering user');
    }
});
