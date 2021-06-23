// deno-lint-ignore-file no-explicit-any
import { graphql, GraphQLSchema } from '../../deps.ts';

export class GraphSession {
    constructor(private schema: GraphQLSchema) {}

    /**
     * evaluate query
     * @param {string} query
     */
    private async executeSchema(query: string) {
        const result = await graphql(this.schema, query);
        return result;
    }

    /**
     * is $var object
     * @param {unknown} v
     */
    private isObject(v: unknown): boolean {
        return (
            typeof v == 'object' &&
            !(v instanceof Date) &&
            !Array.isArray(v) &&
            !(v instanceof RegExp)
        );
    }

    /**
     * recursively map each $var to it's value
     * @param {string} query
     * @param {Record<string, any>} input
     */
    private process(query: string, input: Record<string, any>): string {
        for (const k of Object.keys(input || {})) {
            if (!input || !input[k]) continue;

            // resolve nested objects recursively
            if (this.isObject(input[k])) {
                return this.process(query, input[k]);
            }

            // map $var to value
            const v = input[k];
            query = query.replace('$' + k, typeof v == 'string' ? `"${v}"` : v);
        }
        return query;
    }

    /**
     * execute query
     * @param {string} query
     * @param {Record<string, any> | undefined} input
     */
    public async query<T>(
        query: string,
        input?: Record<string, any>
    ): Promise<T> {
        query = this.process(query, input || {});
        const result = await this.executeSchema(query);

        if (result.errors) throw new Error(result.errors.join('\n'));
        return result.data as T;
    }
}
