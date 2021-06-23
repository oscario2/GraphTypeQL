// deno-lint-ignore-file ban-types
import { IArgInfo, IFieldInfo, IObjectTypeInfo } from '../graph-types.ts';
import { GraphBuilder } from './graph-builder.ts';
import { GraphSession } from './graph-session.ts';

// storage for either 'type' or 'resolver'
export class GraphStorage {
    private static stores = {} as Record<string, GraphStorage>;

    // @Field property or method
    public fields = [] as IFieldInfo[];

    // @Arg attached to @Field
    public args = {} as Record<string, IArgInfo[]>;

    // @ObjectType or @InputType
    public type = {} as IObjectTypeInfo;

    // @Resolver
    public resolver = {} as Object;

    /**
     * add 'Type' (DTO) object
     * @param {IObjectTypeInfo} type
     */
    public addObject(type: IObjectTypeInfo): void {
        if (Object.keys(this.resolver).length > 0) {
            throw new Error(`Storage is already of type "Resolver"`);
        }
        this.type = type;
    }

    /**
     * add 'Input' (DTO) object
     * @param {IObjectTypeInfo} input
     */
    public addInput(input: IObjectTypeInfo): void {
        if (Object.keys(this.resolver).length > 0) {
            throw new Error(`Storage is already of type "Resolver"`);
        }
        this.type = input;
    }

    /**
     * add 'Arg'
     * @param {IArgInfo} arg
     */
    public addArg(arg: IArgInfo): void {
        if (!this.args[arg.method]) this.args[arg.method] = [];
        this.args[arg.method][arg.index] = arg;
    }

    /**
     * add field to it's respective 'Type' object
     * @param {IFieldInfo} field
     */
    public addField(field: IFieldInfo): void {
        this.fields.push(field);
    }

    /**
     * add 'resolver' (controller) class which handles queries/mutations
     * @param {Object} resolver
     */
    public addResolver(resolver: Object): void {
        if (Object.keys(this.type).length > 0) {
            throw new Error(`Storage is already of type "Type"`);
        }
        this.resolver = resolver;
    }

    /**
     * create storage for resolver (class)
     * @param {string} cls
     */
    public static from(cls: string): GraphStorage {
        return (this.stores[cls] = this.stores[cls] || new GraphStorage());
    }

    /**
     * build schema from one or more resolvers (class)
     * @param {string | string[]} resolver
     */
    public static build(resolver: string | string[]): GraphSession {
        const array = Array.isArray(resolver) ? resolver : [resolver];
        const storage = array.map(r => this.from(r));
        const schema = new GraphBuilder().buildSchema(storage);

        return new GraphSession(schema);
    }

    /**
     * return all storages
     */
    public static all(): Record<string, GraphStorage> {
        return this.stores;
    }

    /**
     * clear all storages
     */
    public static clear(): void {
        this.stores = {};
    }
}
