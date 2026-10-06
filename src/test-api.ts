import request from 'supertest';
import app from './app.js';

async function runTests() {
  console.log('[TEST SUITE] Starting automated verification of RBAC, contracts, and evaluations...');

  let adminToken = '';
  let eicToken = '';
  let vendorToken = '';

  // 1. Authenticate Admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@enterprise.org', password: 'Admin@123' });

  if (adminRes.status !== 200 || !adminRes.body.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminRes.body)}`);
  }
  adminToken = adminRes.body.token;
  console.log('✔ [PASS] Admin authentication successful.');

  // 2. Authenticate EIC
  const eicRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'eic.sharma@enterprise.org', password: 'Eic@123' });

  if (eicRes.status !== 200 || !eicRes.body.token) {
    throw new Error(`EIC login failed: ${JSON.stringify(eicRes.body)}`);
  }
  eicToken = eicRes.body.token;
  console.log('✔ [PASS] EIC authentication successful.');

  // 3. Authenticate Vendor
  const vendorRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'vendor.apex@enterprise.org', password: 'Vendor@123' });

  if (vendorRes.status !== 200 || !vendorRes.body.token) {
    throw new Error(`Vendor login failed: ${JSON.stringify(vendorRes.body)}`);
  }
  vendorToken = vendorRes.body.token;
  console.log('✔ [PASS] Vendor authentication successful.');

  // 4. Test RBAC: Vendor cannot create contract
  const vendorCreatePoRes = await request(app)
    .post('/api/contracts')
    .set('Authorization', `Bearer ${vendorToken}`)
    .send({ poNumber: 'PO/FORBIDDEN/001' });

  if (vendorCreatePoRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for Vendor creating contract, got ${vendorCreatePoRes.status}`);
  }
  console.log('✔ [PASS] RBAC Enforced: Vendor cannot create contract (HTTP 403 Forbidden).');

  // 5. Test RBAC: EIC cannot create vendor
  const eicCreateVendorRes = await request(app)
    .post('/api/vendors')
    .set('Authorization', `Bearer ${eicToken}`)
    .send({ vendorCode: 'VND-FORBIDDEN' });

  if (eicCreateVendorRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for EIC creating vendor, got ${eicCreateVendorRes.status}`);
  }
  console.log('✔ [PASS] RBAC Enforced: EIC cannot create vendor master (HTTP 403 Forbidden).');

  // 6. Test Data Validation: Completion date before PO date must fail
  const invalidDatePoRes = await request(app)
    .post('/api/contracts')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      poNumber: 'PO/2026/TEST/0999',
      contractType: 'PO',
      poDate: '2026-05-10',
      completionDate: '2026-05-01', // Before poDate
      poValueWithoutTax: 100000,
      poValueWithTax: 118000,
      plantCode: 'PLANT-01',
      vendorId: 'any',
      eicId: 'any'
    });

  if (invalidDatePoRes.status !== 422) {
    throw new Error(`Expected 422 for invalid date range, got ${invalidDatePoRes.status}`);
  }
  console.log('✔ [PASS] Validation Enforced: Contract completion date before PO date rejected (HTTP 422).');

  // 7. Test Dashboard Metrics
  const dashRes = await request(app)
    .get('/api/reports/dashboard')
    .set('Authorization', `Bearer ${adminToken}`);

  if (dashRes.status !== 200 || !dashRes.body.kpis) {
    throw new Error(`Dashboard retrieval failed: ${JSON.stringify(dashRes.body)}`);
  }
  console.log(`✔ [PASS] Admin Dashboard KPIs verified. Total Contracts: ${dashRes.body.kpis.totalContracts}, Active: ${dashRes.body.kpis.activeContracts}`);

  // 8. Test Evaluations listing for Vendor (must only show APPROVED)
  const vendorEvalsRes = await request(app)
    .get('/api/evaluations')
    .set('Authorization', `Bearer ${vendorToken}`);

  if (vendorEvalsRes.status !== 200) {
    throw new Error(`Vendor evaluations retrieval failed: ${JSON.stringify(vendorEvalsRes.body)}`);
  }
  const anyNonApproved = vendorEvalsRes.body.evaluations.some((e: any) => e.status !== 'APPROVED');
  if (anyNonApproved) {
    throw new Error('Vendor was able to view non-approved evaluations!');
  }
  console.log(`✔ [PASS] Vendor Data Isolation: Vendor only sees APPROVED evaluations (${vendorEvalsRes.body.evaluations.length} records).`);

  console.log('\n========================================');
  console.log('ALL BACKEND API & SECURITY TESTS PASSED!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('[TEST SUITE FAILURE]:', err);
  process.exit(1);
});
