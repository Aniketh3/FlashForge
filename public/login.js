document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            alert('Login successful!');
            window.location.href = 'index.html'; // Redirect to a protected page
        } else {
            const data = await response.json();
            alert(`Login failed: ${data.error}`);
        }
    } catch (error) {
        alert('Error logging in');
    }
});
