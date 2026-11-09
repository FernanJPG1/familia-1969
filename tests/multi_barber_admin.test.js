const { createApp } = require('../dist/app');

async function runTests() {
  const app = createApp();
  const server = app.listen(3098, async () => {
    try {
      console.log('=== TEST 1: Login Master Admin (admin@familia1969.com) ===');
      const adminLoginRes = await fetch('http://localhost:3098/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@familia1969.com',
          password: 'FamiliaAdmin1969*'
        })
      });
      const adminLoginData = await adminLoginRes.json();
      console.log('Admin login status:', adminLoginRes.status, 'Role:', adminLoginData.user?.role);
      if (adminLoginRes.status !== 200 || adminLoginData.user?.role !== 'admin') {
        throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
      }
      const adminToken = adminLoginData.token;

      const carlosEmail = `carlos.mendoza.${Date.now()}@familia1969.com`;
      console.log('\n=== TEST 2: Register New Barber (Carlos Barber) ===');
      const barberRegRes = await fetch('http://localhost:3098/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Carlos Mendoza',
          email: carlosEmail,
          password: 'ClaveCarlos1969*',
          phone: '+57 315 777 8899'
        })
      });
      const barberRegData = await barberRegRes.json();
      console.log('Barber register status:', barberRegRes.status, 'Status:', barberRegData.user?.status, 'isActive:', barberRegData.user?.isActive);
      console.log('Message:', barberRegData.message);
      if (barberRegRes.status !== 201 || barberRegData.user?.status !== 'pending') {
        throw new Error('Barber registration failed or was not pending');
      }
      const newBarberId = barberRegData.user.id;

      console.log('\n=== TEST 3: Attempt Login BEFORE Admin Approval ===');
      const unapprovedLoginRes = await fetch('http://localhost:3098/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: carlosEmail,
          password: 'ClaveCarlos1969*'
        })
      });
      const unapprovedLoginData = await unapprovedLoginRes.json();
      console.log('Unapproved login status (expected 403):', unapprovedLoginRes.status, 'isPending:', unapprovedLoginData.isPending);
      console.log('Error message:', unapprovedLoginData.error);
      if (unapprovedLoginRes.status !== 403 || !unapprovedLoginData.isPending) {
        throw new Error('Unapproved barber was not blocked with 403 isPending');
      }

      console.log('\n=== TEST 4: Admin Lists Barbers (GET /api/admin/barbers) ===');
      const listRes = await fetch('http://localhost:3098/api/admin/barbers', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const listData = await listRes.json();
      console.log('Total barbers in admin list:', listData.barbers?.length);
      const foundCarlos = listData.barbers.find(b => b.email === carlosEmail);
      console.log('Found Carlos in Admin Panel:', Boolean(foundCarlos), 'WhatsApp:', foundCarlos?.phone, 'Status:', foundCarlos?.status);
      if (!foundCarlos || foundCarlos.status !== 'pending') {
        throw new Error('Carlos not found in pending state in admin panel');
      }

      console.log('\n=== TEST 5: Admin Approves/Activates Carlos (PATCH /api/admin/barbers/:id/status) ===');
      const approveRes = await fetch(`http://localhost:3098/api/admin/barbers/${newBarberId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'active', isActive: true })
      });
      const approveData = await approveRes.json();
      console.log('Approve status:', approveRes.status, 'Message:', approveData.message);
      if (approveRes.status !== 200 || !approveData.user?.isActive) {
        throw new Error('Approval failed: ' + JSON.stringify(approveData));
      }

      console.log('\n=== TEST 6: Carlos Logs In AFTER Admin Approval ===');
      const approvedLoginRes = await fetch('http://localhost:3098/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: carlosEmail,
          password: 'ClaveCarlos1969*'
        })
      });
      const approvedLoginData = await approvedLoginRes.json();
      console.log('Approved login status:', approvedLoginRes.status, 'Token exists:', Boolean(approvedLoginData.token));
      console.log('Barber user:', approvedLoginData.user?.name, 'Role:', approvedLoginData.user?.role, 'Status:', approvedLoginData.user?.status);
      if (approvedLoginRes.status !== 200 || !approvedLoginData.token) {
        throw new Error('Approved barber login failed');
      }
      const carlosToken = approvedLoginData.token;

      console.log('\n=== TEST 7: Public Active Barbers for Client Booking (GET /api/barbers/active) ===');
      const pubBarbersRes = await fetch('http://localhost:3098/api/barbers/active');
      const pubBarbersData = await pubBarbersRes.json();
      console.log('Active barbers available for booking:', pubBarbersData.barbers.map(b => b.name));
      const carlosInPublic = pubBarbersData.barbers.find(b => b.name === 'Carlos Mendoza');
      if (!carlosInPublic) {
        throw new Error('Carlos Mendoza not found in active barbers catalog');
      }

      console.log('\n=== TEST 8: Carlos Updates His WhatsApp Phone (PATCH /api/auth/me) ===');
      const updatePhoneRes = await fetch('http://localhost:3098/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${carlosToken}`
        },
        body: JSON.stringify({ phone: '+57 320 888 7766' })
      });
      const updatePhoneData = await updatePhoneRes.json();
      console.log('Updated WhatsApp:', updatePhoneData.user?.phone);
      if (updatePhoneData.user?.phone !== '+57 320 888 7766') {
        throw new Error('Phone update failed');
      }

      console.log('\n=== TEST 9: Admin Stats (GET /api/admin/stats) ===');
      const statsRes = await fetch('http://localhost:3098/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const statsData = await statsRes.json();
      console.log('Admin Stats:', {
        totalBarbers: statsData.totalBarbers,
        activeBarbers: statsData.activeBarbers,
        pendingBarbers: statsData.pendingBarbers,
        totalRevenue: statsData.totalRevenue
      });

      console.log('\n=== ALL MULTI-BARBER & ADMIN PERMISSION TESTS PASSED PERFECTLY! ===');
    } catch (err) {
      console.error('TEST ERROR:', err);
      process.exit(1);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();
