const { Manager } = require('../../..');
const Actorable = require('../../../observers/actorable');
const assert = require('assert');

describe('Observer: Actorable', () => {
  it('append created_by and updated_by at insert', async () => {
    const manager = createManager();

    await manager.runSession(async session => {
      session.state.user = { sub: 'user' };
      const { rows } = await session.factory('foo').insert({ foo: 'bar' }).save();
      assert.strictEqual(rows[0].created_by, 'user');
      assert.strictEqual(rows[0].updated_by, 'user');
    });
  });

  it('update updated_by at update', async () => {
    const data = {
      foo: [
        { foo: 'bar', created_by: 'someone' },
      ],
    };
    const manager = createManager(data);

    await manager.runSession(async session => {
      session.state.user = { sub: 'user' };
      await session.factory('foo', { foo: 'bar' })
        .set({ foo: 'bar1' })
        .save();
      assert.strictEqual(data.foo[0].created_by, 'someone');
      assert.strictEqual(data.foo[0].updated_by, 'user');
    });
  });

  it('append created_by and updated_by at insert', async () => {
    const data = {};
    let actor = 'user';
    const manager = createManager(data, () => actor);

    await manager.runSession(async session => {
      const { rows } = await session.factory('foo').insert({ foo: 'bar' }).save();
      assert.strictEqual(rows[0].created_by, 'user');
      assert.strictEqual(rows[0].updated_by, 'user');

      actor = 'user1';

      await session.factory('foo', { foo: 'bar' })
        .set({ foo: 'bar1' })
        .save();

      assert.strictEqual(data.foo[0].created_by, 'user');
      assert.strictEqual(data.foo[0].updated_by, 'user1');
    });
  });

  function createManager (data, userCallback) {
    return new Manager({
      connections: [
        {
          adapter: require('../../../adapters/memory'),
          data,
          schemas: [
            {
              name: 'foo',
              observers: [
                new Actorable({ userCallback }),
              ],
            },
          ],
        },
      ],
    });
  }
});
