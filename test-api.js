const axios = require('axios');
async function test() {
  try {
    const login = await axios.post('http://localhost:3002/api/auth/register', {
      name: 'testuser',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123'
    });
    const token = login.data.data.accessToken;
    console.log("Token:", token.substring(0, 20) + "...");
    
    const payload = {
        name: 'مشروع جديد',
        industry: 'آخر',
        location: 'غير محدد',
        targetCapital: 1000,
        durationYears: 3,
        description: 'وصف تجريبي للمشروع أكثر من 10 أحرف',
        financialInputs: {
          monthlyOperatingCosts: 0,
          expectedMonthlyRevenue: 0
        }
    };
    
    const res = await axios.post('http://localhost:3002/api/projects', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Status:", res.status);
    console.log("Data:", res.data);
  } catch (err) {
    console.error("Error Status:", err.response?.status);
    console.error("Error Data:", err.response?.data);
  }
}
test();
