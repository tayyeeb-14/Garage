import assert from 'assert';
import { Customer } from '../models/Customer.js';

const passwordHash = '$2a$10$examplehashforregression';
const customer = new Customer({
  fullName: 'Regression Test',
  email: 'regression@example.com',
  phone: '+1234567890',
  passwordHash,
});

assert.ok(Customer.schema.path('passwordHash'), 'passwordHash should be defined in the customer schema');
assert.strictEqual(customer.toObject().passwordHash, passwordHash, 'passwordHash should be preserved on the customer document');

console.log('Customer password hash regression check passed');
