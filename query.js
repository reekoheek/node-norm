class Query {
  constructor (options) {
    if (options instanceof Query) {
      this.session = options.session;
      this.connection = options.connection;
      this.schema = options.schema;
      this.find(options.criteria);

      this.length = options.length;
      this.offset = options.offset;
      this.sorts = options.sorts;

      return;
    }

    const { session, schema, criteria } = options;

    this.session = session;

    [this.connection, this.schema] = this.session.parseSchema(schema);

    this.find(criteria);

    this.rows = [];
    this.sets = {};
    this.length = -1;
    this.offset = 0;
    this.sorts = undefined;
  }

  clone () {
    return new Query(this);
  }

  find (criteria = {}) {
    this.criteria = typeof criteria === 'object' ? criteria : { id: criteria };

    return this;
  }

  insert (row) {
    this.mode = 'insert';
    this.rows.push(this.schema.attach(row));

    return this;
  }

  sort (sorts) {
    this.sorts = sorts;

    return this;
  }

  limit (length) {
    this.length = length;

    return this;
  }

  skip (offset) {
    this.offset = offset;

    return this;
  }

  set (set) {
    this.mode = 'update';
    this.sets = this.schema.attach(set, true);

    return this;
  }

  async delete ({ observer = true } = {}) {
    this.mode = 'delete';

    const ctx = { query: this };

    if (observer) {
      await this.schema.observe(ctx, ctx => this._delete(ctx));
    } else {
      await this._delete(ctx);
    }

    return ctx.result;
  }

  async _delete () {
    const connection = await this.session.acquire(this.connection);
    const result = await connection.delete(this);
    return result;
  }

  async save ({ filter = true, observer = true } = {}) {
    const ctx = { query: this, filter };

    if (observer) {
      await this.schema.observe(ctx, ctx => this._save(ctx));
    } else {
      await this._save(ctx);
    }

    return this;
  }

  async _save (ctx) {
    const connection = await this.session.acquire(this.connection);
    const { session } = this;
    const { filter } = ctx;

    if (this.rows.length) {
      if (filter) {
        await Promise.all(this.rows.map(row => this.schema.filter(row, { session })));
      }

      const rows = [];
      this.affected = await connection.insert(this, row => rows.push(this.schema.attach(row)));
      this.rows = rows;
    } else {
      if (filter) {
        const partial = true;
        await this.schema.filter(this.sets, { session, partial });
      }

      if (Object.keys(this.sets).length === 0) {
        throw new Error('Neither insert and update to save');
      }

      this.affected = await connection.update(this);
    }
  }

  async drop () {
    const connection = await this.session.acquire(this.connection);
    const result = await connection.drop(this);
    return result;
  }

  async truncate () {
    const connection = await this.session.acquire(this.connection);
    const result = await connection.truncate(this);
    return result;
  }

  async all () {
    const rows = [];
    const connection = await this.session.acquire(this.connection);
    await connection.load(this, row => rows.push(this.schema.attach(row)));
    return rows;
  }

  async count (useSkipAndLimit = false) {
    const connection = await this.session.acquire(this.connection);
    if (typeof connection.count !== 'function') {
      throw new Error('Connection does not implement method count');
    }
    return connection.count(this, useSkipAndLimit);
  }

  async single () {
    const [row] = await this.limit(1).all();
    return row;
  }

  getInsertedRows () {
    return this.rows;
  }
}

module.exports = Query;
