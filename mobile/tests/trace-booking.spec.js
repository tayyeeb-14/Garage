const { test, expect } = require('playwright/test');

test('trace real customer booking flow', async ({ page, request }) => {
  test.setTimeout(120000);
  const apiBase = 'https://m-enterprises-api.onrender.com/api';
  const stamp = Date.now();
  const email = `trace.${stamp}@example.com`;
  const password = 'Pass1234!';

  const registerResponse = await request.post(`${apiBase}/auth/customer/register`, {
    data: {
      fullName: 'Trace Customer',
      email,
      phone: '9999999999',
      password,
    },
  });
  expect(registerResponse.ok()).toBeTruthy();

  const servicesResponse = await request.get(`${apiBase}/services/public`);
  const servicesJson = await servicesResponse.json();
  const firstService = servicesJson?.data?.[0];

  const vehiclesResponse = await request.get(`${apiBase}/vehicles`);
  const vehiclesJson = await vehiclesResponse.json();
  const firstVehicle = vehiclesJson?.data?.[0];

  expect(firstService).toBeTruthy();
  expect(firstVehicle).toBeTruthy();

  const trace = {
    loginEmail: email,
    requestPayload: null,
    authorizationHeader: null,
    status: null,
    responseBody: null,
    bookingId: null,
    bookingHistoryVisible: false,
    profileCalls: [],
  };

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/auth/profile')) {
      trace.profileCalls.push({
        status: response.status(),
        body: await response.text().catch(() => ''),
      });
    }
  });

  await page.goto('http://localhost:8081');
  await page.getByText('Welcome Back').waitFor({ timeout: 20000 });
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByText('Login').click();

  const partsTab = page.getByText('Parts', { exact: true }).last();
  await partsTab.waitFor({ timeout: 20000 });
  await partsTab.click();
  await page.getByText('View Details').first().click();
  await page.getByText('Book Now').click();

  await page.getByText('Step 1: Select Vehicle').waitFor({ timeout: 20000 });
  await page.getByText(firstVehicle.plateNumber, { exact: false }).click();
  await page.getByText('Next').click();

  const bookingDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const minutes = String((Math.floor(Math.random() * 6) + 1) * 10).padStart(2, '0');
  const preferredTime = `11:${minutes}`;
  const address = `Trace Address ${stamp}`;
  const notes = `Trace booking ${stamp}`;

  await page.getByPlaceholder('YYYY-MM-DD').fill(bookingDate);
  await page.getByPlaceholder('HH:MM (24h)').fill(preferredTime);
  await page.getByPlaceholder('Service address').fill(address);
  await page.getByPlaceholder('Additional notes (optional)').fill(notes);
  await page.getByText('Next').click();
  await page.getByText('Next').click();

  const bookingResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/bookings') && response.request().method() === 'POST',
    { timeout: 20000 }
  );

  await page.getByText('Confirm Booking').click();
  const bookingResponse = await bookingResponsePromise;
  const bookingRequest = bookingResponse.request();
  trace.requestPayload = bookingRequest.postDataJSON();
  trace.authorizationHeader = bookingRequest.headers()['authorization'] ?? null;
  trace.status = bookingResponse.status();
  trace.responseBody = await bookingResponse.text();

  if (trace.status === 201) {
    const parsed = JSON.parse(trace.responseBody);
    trace.bookingId = parsed?.data?.bookingId ?? null;
    await page.getByText('Booking Confirmed').waitFor({ timeout: 20000 });
    await page.getByText('Bookings').click();
    if (trace.bookingId) {
      await page.getByText(trace.bookingId, { exact: false }).waitFor({ timeout: 20000 });
      trace.bookingHistoryVisible = true;
    }
  }

  console.log(JSON.stringify(trace, null, 2));
});
