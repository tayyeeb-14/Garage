(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@menterprises.com', password: 'Admin@12345' }),
    });
    const loginJson = await loginRes.json();
    console.log('LOGIN_STATUS', loginRes.status);
    console.log(JSON.stringify(loginJson, null, 2));
    const token = loginJson?.data?.accessToken;
    if (!token) return;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    console.log('TOKEN_PAYLOAD', payload);

    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('PROFILE_STATUS', profileRes.status);
    console.log(await profileRes.text());

    const dashRes = await fetch('http://localhost:5000/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('DASH_STATUS', dashRes.status);
    console.log(await dashRes.text());
  } catch (err) {
    console.error('ERR', err);
  }
})();
