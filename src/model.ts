import Knex from 'knex';

import * as h from './helpers';

export class Model {
  private readonly ready: Promise<Error|void>;
  // tslint:disable-next-line:readonly-keyword
  private schema: Knex.ColumnInfo;

  constructor(private db: Knex, private tableName: string) {
    this.ready = new Promise((ok, no) => {
      if (!this.db) {
        throw new Error('No DB found');
      }
      this.db(this.tableName)
        .columnInfo()
        .then((info) => {
          if (!info || Object.keys(info).length < 1) {
            throw new Error(`No schema found for table "${tableName}"`);
          }
          this.schema = info;
          ok();
        })
        .catch(no);
    });
  }


  public fetchBy<T>(column?: string, term?: number | string): Promise<T> {
    return this.ready.then(() => {
      const qs: Knex.QueryBuilder = this.db.select('*').from(this.tableName);
      if (term && column) {
        // tslint:disable-next-line:no-any
        return qs.where(column, term).then((res: any) => {
          return JSON.parse(JSON.stringify(res, null, 3), this.revive);
        });
      }

      return qs;
    });
  }

  // tslint:disable-next-line
  public revive(key: string, value: any): any {
    if (key === 'created_at' || key === 'updated_at') {
      return new Date(value);
    }

    return value;
  }

  // tslint:disable:no-any
  public insert(data: any): Promise<number> {
    return new Promise((ok, no) =>
      this.ready
        .then(() => {
          const res: string[] = this.validate(data);

          if (res.length > 0) {
            throw new Error(JSON.stringify(res, null, 2));
          } else {
            return this.db.transaction((trx) =>
              trx
              .insert(data, 'id')
              .into(this.tableName)
              .catch((e) => {
                trx.rollback();
                no(e);
              })
            );
          }
        })
        .then((e: any) => ok(h.head(e)))
        .catch(no)
    );
  }
  // tslint:enable:no-any

  // tslint:disable:no-any
  private validate(data: any): string[] {
    // Ignore columns with default value or if they're nullable
    const ignored: (x: string) => boolean =
      (x) =>
        // tslint:disable-next-line
        (this.schema as any)[x].nullable === false && (this.schema as any)[x].defaultValue === null

    const required: string[] = Object.keys(this.schema).filter(ignored);
    const errors: string[] = [];

    const missing: string[] = h.diff(
      required,
      Object.keys(data)
    );

    if (missing.length > 0) {
      errors.push(`Missing values: ${missing.join(', ')}`);
    }

    Object.entries(data).map((x: [string, string]) => {
      const [ key, value ]: [string, string]  = x;

      const max: number = this.schema.hasOwnProperty(key) ? (this.schema as any)[key].maxLength : null;

      if (value && max && value.length > max) {
        errors.push(`Value for ${key} exceeds max length of ${max}, length was: ${value.length}`);
      }

      if (!value && !(this.schema as any)[key].nullable) {
        errors.push(`"${value}" value in column ${key} violates not-null constraint.`);
      }
    });

    return errors;
  }
  // tslint:enable:no-any

}

