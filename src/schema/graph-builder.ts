// deno-lint-ignore-file no-explicit-any ban-types
import {
    GraphQLObjectType,
    GraphQLInt,
    GraphQLScalarType,
    GraphQLString,
    GraphQLFloat,
    GraphQLList,
    GraphQLSchema,
    GraphQLBoolean,
    GraphQLInputObjectType,
    GraphQLNonNull,
    // isolated module
    GraphQLInputFieldConfigMap,
    GraphQLType
} from '../../deps.ts';

import { GraphStorage } from './graph-storage.ts';
import { Bool, Float, Int, TFieldType, Void } from '../graph-types.ts';
import { ErrorGraph } from '../graph-errors.ts';

// https://graphql.org/graphql-js/type/#graphqlobjecttype
type GraphQLObject<T = GraphQLObjectType> = {
    type: GraphQLScalarType | GraphQLList<GraphQLType> | T;
    args?: GraphQLArgsConfig;
    resolve?: any; // TODO: find type @oscario2
};

// GraphQLObjectType
type GraphQLArgsConfig = Record<
    string,
    { type: GraphQLScalarType | GraphQLInputObjectType }
>;

class Session {
    public types = {} as Record<string, GraphQLObjectType>;
    public inputs = {} as Record<string, GraphQLInputObjectType>;
}

export class GraphBuilder {
    private session = new Session();

    /**
     * handle DTO of Type @ObjectType
     * may not contain any @Query or @Mutation
     * @param {GraphStorage} obj
     */
    private buildType(obj: GraphStorage): GraphQLObjectType {
        const fields = {} as Record<string, GraphQLObject>;

        for (const { name, info, scalar, options } of obj.fields) {
            // recursively resolve custom type
            if (info.customType) {
                const next = GraphStorage.from(scalar);
                fields[name] = {
                    type: this.buildType(next)
                };
            }

            // handle primitive
            else {
                fields[name] = {
                    type: this.toScalar(scalar)
                };
            }

            // if nullable
            if (!options.nullable) {
                fields[name].type = GraphQLNonNull(fields[name].type);
            }

            // wrap object to list
            if (info.isArray) {
                fields[name].type = GraphQLList(fields[name].type);
            }
        }

        return new GraphQLObjectType({
            name: obj.type.name,
            fields: () => fields
        });
    }

    /**
     * handle DTO of Input @InputType
     * may not contain any @Query or @Mutation
     * @param {GraphStorage} input
     */
    private buildInput(input: GraphStorage): GraphQLInputObjectType {
        const fields = {} as Record<
            string,
            GraphQLObject<GraphQLInputObjectType>
        >;

        for (const { name, info, scalar, options } of input.fields) {
            // recursively resolve custom type
            if (info.customType) {
                const next = GraphStorage.from(scalar);
                fields[name] = {
                    type: this.buildInput(next)
                };
            }

            // handle primitive
            else {
                fields[name] = {
                    type: this.toScalar(scalar)
                };
            }

            // if nullable
            if (!options.nullable) {
                fields[name].type = GraphQLNonNull(fields[name].type);
            }

            // wrap object to list
            if (info.isArray) {
                fields[name].type = GraphQLList(fields[name].type);
            }
        }

        return new GraphQLInputObjectType({
            name: input.type.name,
            fields: () => fields as GraphQLInputFieldConfigMap
        });
    }

    /**
     * build @Query or @Mutation
     * @param {GraphStorage} storage
     * @param {TFieldType} fieldType
     */
    private queryOrMutation(storage: GraphStorage, fieldType: TFieldType) {
        const fields = {} as Record<string, GraphQLObject>;
        const { session, toScalar } = this;

        // handle returns
        for (const { name, info, scalar } of storage.fields) {
            // skip non query or mutation
            if (!info.hasResolver && info.fieldType != fieldType) continue;

            // get resolved custom object or primitive scalar
            const type = info.customType
                ? session.types[scalar]
                : toScalar(scalar);

            // resolver class of query method
            const resolver = storage.resolver as Record<string, Function>;

            // build initial field
            fields[name] = {
                type,
                // .bind() 'this' context to 'resolver' function
                resolve: resolver[name].bind(resolver)
            };
        }

        // handle args
        for (const { name, info } of storage.fields) {
            // skip non query or mutation
            if (!info.hasResolver && info.fieldType != fieldType) continue;

            // if method has args
            const args = storage.args[name];
            if (!args) continue;

            // args
            fields[name].args = {};

            for (const arg of args) {
                // get resolved custom object or primitive scalar
                const type = arg.customType
                    ? session.inputs[arg.scalar]
                    : toScalar(arg.scalar);

                // add
                (fields[name].args as GraphQLArgsConfig)[arg.name] = {
                    type
                };
            }

            // add args to query or mutation in resolver
            const _resolve = fields[name].resolve;
            fields[name].resolve = function (..._args: any[]) {
                // align each argument to it's correct index
                const align = args.map(k => {
                    // TODO: Number.isInteger() if Int scalar @oscario2
                    return _args[1][k.name];
                });
                return _resolve.apply(this, align);
            };
        }

        return fields;
    }

    /**
     * build controller @Query
     * @param {GraphStorage} storage
     */
    private buildQuery(storage: GraphStorage) {
        const fields = this.queryOrMutation(storage, 'query');
        return fields;
    }

    /**
     * build controller @Mutation
     * @param {GraphStorage} storage
     */
    private buildMutation(storage: GraphStorage) {
        const fields = this.queryOrMutation(storage, 'mutation');
        return fields;
    }

    /**
     * construct GQL compatible object from resolver
     * @param {GraphStorage[]} resolvers
     */
    public buildSchema(resolvers: GraphStorage[]): GraphQLSchema {
        this.session = new Session();
        const { session } = this; // objects passed by reference

        const queries = {} as Record<string, GraphQLObject>;
        const mutations = {} as Record<string, GraphQLObject>;

        for (const resolver of resolvers) {
            // resolve every custom objectType property or method referenced in resolver class
            for (const { scalar, info } of resolver.fields) {
                if (!info.customType) continue;
                const obj = GraphStorage.from(scalar);

                if (obj.type.input) {
                    throw new ErrorGraph.InputAsOutput();
                }
                session.types[scalar] = this.buildType(obj);
            }

            // resolve every custom inputType referenced in resolver class
            for (const { name } of resolver.fields) {
                const args = resolver.args[name];
                if (!args) continue;

                for (const { scalar, customType } of args) {
                    if (!customType) continue;
                    const obj = GraphStorage.from(scalar);

                    if (!obj.type.input) {
                        throw new ErrorGraph.OutputAsInput();
                    }
                    session.inputs[scalar] = this.buildInput(obj);
                }
            }

            // build each query in resolver
            Object.assign(queries, this.buildQuery(resolver));

            // build each mutation in resolver
            Object.assign(mutations, this.buildMutation(resolver));
        }

        // stich together
        const query = new GraphQLObjectType({
            name: 'RootQuery',
            fields: () => queries
        });

        const mutation = new GraphQLObjectType({
            name: 'RootMutation',
            fields: () => mutations
        });

        // a query root needs to be provided at all times
        // https://github.com/ardatan/graphql-tools/issues/764#issuecomment-419556241
        const dummy = new GraphQLObjectType({
            name: 'Query',
            fields: () => ({ key: { type: GraphQLString } })
        });

        const hasQuery = Object.keys(query.getFields()).length > 0;
        const hasMutation = Object.keys(mutation.getFields()).length > 0;

        return new GraphQLSchema({
            query: hasQuery ? query : dummy,
            mutation: hasMutation ? mutation : undefined
        });
    }

    /**
     * convert our classes to scalar object
     * @param {string} type
     */
    private toScalar(type: string): GraphQLScalarType {
        switch (type) {
            case String.name:
                return GraphQLString;
            case Int.name:
                return GraphQLInt;
            case Number.name:
            case Float.name:
                return GraphQLFloat;
            case Bool.name:
                return GraphQLBoolean;
            case Void.name:
                return GraphQLBoolean;
            case 'ID':
                return GraphQLString;
        }
        throw new Error(`Unhandled Scalar type - ${type}`);
    }
}
