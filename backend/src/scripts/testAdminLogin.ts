const API_URL = 'http://localhost:5000/api';

const testAdminLogin = async () => {
  try {
    console.log('🔐 Testing Admin Login...\n');

    const response = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@menterprises.com',
        password: 'Admin@12345',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const data = result.data;

    console.log('✅ Login successful!\n');
    console.log('📋 User Details:');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Name: ${data.user.name}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Role: ${data.user.role}`);

    console.log('\n🔐 Tokens:');
    console.log(`   Access Token: ${data.accessToken.substring(0, 50)}...`);
    console.log(`   Refresh Token: ${data.refreshToken.substring(0, 50)}...`);

    console.log('\n✅ Admin authentication verified successfully!');
    console.log('\n🎯 The admin account is ready to use in the Admin Panel!');
  } catch (error) {
    console.error('❌ Login failed:', error instanceof Error ? error.message : error);
    console.error('\n⚠️  Make sure the backend server is running on port 5000');
    process.exit(1);
  }
};

void testAdminLogin();
