# node-norm

node-norm is intermediate layer to access data source (database, file, else?).

```sh
npm i node-norm
```

## Features

- Adaptive persistence, you can easily extend by creating new adapters,
- Multiple connections to work with,
- NoSQL-like approaches,
- Data fixtures.

## How to work with it

```js

const { Manager } = require('node-norm');
const manager = new Manager({
  connections: [
    {
      name: 'default',
      adapter: Disk, // change with constructor of adapter
      schemas: [
        {
          name: 'friend',
        }
      ],
    },
  ],
})

(async () => {
  let session = manager.openSession();

  try {
    let friend = { first_name: 'John', last_name: 'Doe' };
    await session.factory('foo.friend').insert(friend).save(); // same as
    await session.factory('friend').insert(friend).save(); // same as
    await session.factory(['foo', 'friend']).insert(friend).save();
    
    let data = await session.factory('foo', { bar: 'foobar' }).single();
    //similiar with syntax: SELECT * FROM foo where bar = 'foobar' LIMIT 1 ;
    let data = await session.factory('foo', { bar: 'foobar' }).all();
    let data = await session.factory('foo').find({ bar: 'foobar' }).all();
    //similiar with syntax: SELECT * FROM foo where bar = 'foobar' ;
    let data = await session.factory('foo').all();
    //similiar with syntax: SELECT * FROM foo;
    let data = await session.factory('foo').find({ userId: 1, 'userName!like': 'foo' }).all();
    // on example userName separate by !, you can use 'or', 'lt', 'gt' 
    //similiar with syntax: SELECT * FROM foo where userId = 1 and userName LIKE %foo%;
    let { inserted, rows } = await session.factory('foo').insert({ field1: 'bar', field2: 'baz' }).save();
                             await session.factory('foo').insert({ field1: 'bar', field2: 'baz' }).insert({ field1: 'bar1' }).save();
    // insert data to table foo
    let { affected } = await session.factory('foo',{ barId = 2 }).set({ baz: 'bar' }).save();
    // edit record on field barId = 2

    let data = await session.factory('foo').delete();
    //delete data;
  
    console.log('Great, we have new friend');

    let newFriend = await session.factory('friend').single();

    await session.close();
  } catch (err) {
    console.error(err);
  }

  await session.dispose();


  // or

  manager.runSession((session) => {
    let friend = { first_name: 'John', last_name: 'Doe' };
    await session.factory('friend').insert(friend).save();

    console.log('Great, we have new friend');

    let newFriend = await session.factory('friend').single();
  });
})();
```

## Implement new adapter

Create connection class extends from `Connection` (`require('node-norm/connection')`)
and implement this methods:

### Mandatory methods

`#load (query, callback = () => {})`

`#insert (query, callback = () => {})`

`#update (query)`

`#drop (query)`

`#truncate (query)`

`#delete (query)`

`#count (query, useSkipAndLimit)`

### Optional methods

`#_begin ()`

`#_commit ()`

`#_rollback ()`

## Classes

### Manager

Manager manages multiple connections and sessions into single application context.

`Manager ({ connections = [] } = {})`

`#openSession ()`

Create new session

`#runSession (fn)`

Run session by function

### Session

Session manages single connection context

`Session ({ manager, autocommit = true })`

`#factory (schemaName, criteria = {})`

Create new query by its schema name

`#begin ()`

`#commit ()`

`#rollback ()`

### Connection

Connection is single connection to data source

`Connection ({ name })`

`#begin ()`

`#commit ()`

`#rollback ()`

### Schema

You may see schema is a single table or collection.

`Schema ({ name, fields = [], modelClass = Model })`

`#attach ()`

`#filter ()`

### Field

Field defines single property of schema. The `id` property does not have to be added as field and will be implicitly added.

`Field (name, ...filters)`

`#filter ()`

### Query

To load or persist data to data source, query object works as context of single request.

### Operators

- or
- and
- eq
- ne
- gt
- gte
- lt
- lte
- in
- nin
- regex
- like
- where: use function as determinator

`#find ()`

`#insert ()`

`#set ()`

`#save ()`

`#skip ()`

`#limit ()`

`#sort ()`

`#delete ()`

`#truncate ()`

`#drop ()`

`#all ()`

`#single ()`

`#count (useSkipAndLimit = false)`
