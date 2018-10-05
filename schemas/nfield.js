const Filter = require('../filter');

class NField {
  constructor (name) {
    this.name = name;
    this.rawFilters = [];
    this.filters = [];
  }

  filter (...filters) {
    filters.forEach(filter => {
      try {
        filter = Filter.tokenize(filter);
      } catch (err) {
        // noop
      }

      this.rawFilters.push(filter);
      this.filters.push(Filter.get(filter));
    });

    return this;
  }

  execFilter (value, { session, row, schema }) {
    // when value is string, trim first before filtering
    if (typeof value === 'string') {
      value = value.trim();
    }

    let field = this;
    return this.filters.reduce(
      async (promise, filter) => filter(await promise, { session, row, schema, field }),
      value
    );
  }

  attach (value) {
    return value;
  }
}

module.exports = NField;
