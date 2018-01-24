// tslint:disable:no-let
// tslint:disable:no-any
import test from 'ava';
import * as Knex from 'knex';

import { allLengthOf, head } from '../src/helpers';
import { Model } from '../src/model';

const db: Knex = Knex({
  client: 'pg',
  pool: { min: 0, max: 7 },
  connection: process.env.DATABASE_URL || { user: 'jrasanen', database: 'jrasanen' }
});


let entryID: null | number = null;
let entries: null | Model = null;

interface Entry {
  readonly id: number;
  readonly first_name: string;
  readonly last_name: string;
  readonly postal_code: number;
  readonly description: string;
  readonly created_at: Date;
  readonly updated_at: Date;
}

test.after.always(async(t) => {
  await db.schema.dropTable('entries');
  t.pass();
});

test.before(async(t) => {
  await db.schema.createTableIfNotExists('entries', (table) => {
    table.increments();
    table.string('first_name', 10).notNullable();
    table.string('last_name', 10).notNullable();
    table.string('postal_code', 4).nullable();
    table.text('description').nullable();
    table.timestamps(true, true);
  });

  entries = new Model(db, 'entries');

  entryID = await entries.insert({
    first_name: 'foo',
    last_name: 'bar',
    postal_code: 123,
    description: 'hi'
  });

  t.pass('DB seeds added');
});

test('can fetch a record', async(t) => {
  if (entries === null || !entryID) {
    t.fail(`no entries found`);
  } else {
    const res: Entry = head(await entries.fetchBy<Entry[]>('id', entryID));

    const params: string[] = ['first_name', 'last_name', 'postal_code', 'description', 'created_at'];

    if (res && !isNaN(res.id) && allLengthOf(res, params, 2) && typeof(res.created_at) === 'object') {
      t.pass(`found ${JSON.stringify(res)}`);
    } else {
      t.fail(`expected entry not found ${JSON.stringify(res)}`);
    }
  }
});

test('can fetch records', async(t) => {
  if (entries === null || !entryID) {
    t.fail(`no entries found`);
  } else {
    const res: Entry[] = await entries.fetchBy<Entry[]>();

    if (res && res.length > 0) {
      t.pass(`found ${JSON.stringify(res)}`);
    } else {
      t.fail(`expected entry not found ${JSON.stringify(res)}`);
    }
  }
});

test('can insert a record', async(t) => {
  if (entries === null || !entryID) {
    t.fail(`no entries found`);
  } else {
    const res: number = await entries.insert({
      first_name: 'foo',
      last_name: 'bar',
      postal_code: 123,
      description: 'hi'
    });

    if (res) {
      t.pass();
    } else {
      t.fail();
    }
  }
});


test('validation works', async(t) => {
  if (entries === null || !entryID) {
    t.fail(`no entries found`);
  } else {
    try {
      const res: number | null = await entries.insert({
        first_name: null,
        last_name: null
      });
      t.fail(`should throw an error, got this instead: ${res}`);
    } catch (e) {
      t.pass();
    }

  }
});


test('cant write duplicate ids', async(t) => {
  if (entries === null || !entryID) {
    t.fail(`no entries found`);
  } else {
    try {
      const res: number | null = await entries.insert({
        id: 1,
        first_name: 'foo',
        last_name: 'bar',
        postal_code: 123,
        description: 'hi'
      });
      t.fail(`should throw an error, got this instead: ${res}`);
    } catch (e) {
      t.pass();
    }
  }
});

test('cant write to non-existing table', async(t) => {
  try {
    const res: number | null = await (new Model(db, 'mehe')).insert({
      first_name: null,
      last_name: null
    });
    t.fail(`should throw an error, got this instead: ${res}`);
  } catch (e) {
    t.pass();
  }
});


test('cant write to non-existing table', async(t) => {
  try {
    const res: number | null = await (new Model((null as any), 'mehe')).insert({
      first_name: null,
      last_name: null
    });
    t.fail(`should throw an error, got this instead: ${res}`);
  } catch (e) {
    t.pass();
  }
});

test('wont let too long strings to fields', async(t) => {
  if (entries === null || !entryID) {
    t.fail(`no entries found`);
  } else {
    try {
      const res: number | null = await entries.insert({
        id: 1,
        first_name: 'foo mehe hee he he he he',
        last_name: 'bar',
        postal_code: 123,
        description: 'hi'
      });
      t.fail(`should throw an error, got this instead: ${res}`);
    } catch (e) {
      t.pass();
    }
  }
});

test('required values must be defined', async(t) => {
  if (entries === null || !entryID) {
    t.fail(`no entries found`);
  } else {
    try {
      const res: number | null = await entries.insert({
        id: 1,
        first_name: 'foo mehe hee he he he he',
      });
      t.fail(`should throw an error, got this instead: ${res}`);
    } catch (e) {
      t.pass();
    }
  }
});
