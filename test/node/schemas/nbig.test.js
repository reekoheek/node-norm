const assert = require('assert');
const { NBig } = require('../../../schemas');
const Big = require('big.js');
const createManager = require('../_lib/create-manager');

describe('NBig', () => {
  describe('#attach()', () => {
    it('return plain object or undefined', () => {
      let field = new NBig();

      assert.strictEqual(field.attach(0).toFixed(2), '0.00');
      assert.strictEqual(field.attach(1).toFixed(2), '1.00');
      assert.strictEqual(field.attach(1.2).toFixed(2), '1.20');
      assert.strictEqual(field.attach('1234567890.1234567890').toFixed(2), '1234567890.12');
      assert.strictEqual(field.attach(undefined), null);
      assert.strictEqual(field.attach(null), null);
      assert.strictEqual(field.attach(''), null);
    });
  });

  describe('#serialize()', () => {
    it('return serialized data', () => {
      let field = new NBig();

      assert.strictEqual(field.serialize(new Big('1.23')), '1.23');
      assert.strictEqual(field.serialize(new Big(1.23)), '1.23');
      assert.strictEqual(field.serialize(null), null);
    });
  });

  describe('respond to criteria', () => {
    let data = {
      foo: [
        { bar: '1' },
        { bar: '10' },
        { bar: '100' },
      ],
    };

    let schemas = [
      {
        name: 'foo',
        fields: [
          new NBig('bar'),
        ],
      },
    ];

    it('respond to eq', async () => {
      let manager = createManager({ data, schemas });
      await manager.runSession(async session => {
        let rows = await session.factory('foo', { bar: 10 }).all();
        assert.strictEqual(rows.length, 1);
      });
    });

    it('respond to gt', async () => {
      let manager = createManager({ data, schemas });
      await manager.runSession(async session => {
        let rows = await session.factory('foo', { 'bar!gt': 10 }).all();
        assert.strictEqual(rows.length, 1);
      });
    });

    it('respond to gte', async () => {
      let manager = createManager({ data, schemas });
      await manager.runSession(async session => {
        let rows = await session.factory('foo', { 'bar!gte': 10 }).all();
        assert.strictEqual(rows.length, 2);
      });
    });

    it('respond to lt', async () => {
      let manager = createManager({ data, schemas });
      await manager.runSession(async session => {
        let rows = await session.factory('foo', { 'bar!lt': 10 }).all();
        assert.strictEqual(rows.length, 1);
      });
    });

    it('respond to lte', async () => {
      let manager = createManager({ data, schemas });
      await manager.runSession(async session => {
        let rows = await session.factory('foo', { 'bar!lte': 10 }).all();
        assert.strictEqual(rows.length, 2);
      });
    });
  });
});
