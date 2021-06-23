// deno-lint-ignore-file no-unused-vars
import { X2 } from '../deps.ts';

import {
    Arg,
    Bool,
    ErrorGraph,
    Field,
    Float,
    GraphStorage,
    IFieldInfo,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Void
} from '../index.ts';

// to debug, set "debug.javascript.usePreview" to false
const { describe, it, expect, beforeEach } = new X2('GraphQL');

await describe('Field', () => {
    it('uses primitive property', () => {
        class Primitive {
            @Field(() => String)
            public prop!: string;
        }
    });

    it('uses "unknown" property without @Field type', () => {
        expect(() => {
            class PrimitiveIllegalType {
                @Field()
                public prop!: unknown;
            }
        }).toThrow(ErrorGraph.ReturnIsUnknown);
    });

    it('uses custom property type', () => {
        expect(() => {
            class Type {}

            class CustomType {
                @Field(() => Type)
                public prop!: Type;
            }
        });
    });

    it('uses array property type', () => {
        const callback = (field: IFieldInfo) => {
            expect(field.scalar).toBe(String.name);
            expect(field.info.customType).toBe(false);
        };
        class ArrayPrimitiveType {
            @Field(() => [String], { callback })
            public prop!: string[];
        }
    });

    it('uses array property without @Field type', () => {
        expect(() => {
            class ArrayNoType {
                @Field()
                public prop!: string[];
            }
        }).toThrow(ErrorGraph.ArrayNoReturnType);
    });

    it('uses array property with custom type', () => {
        const callback = (field: IFieldInfo) => {
            expect(field.scalar).toBe(Type.name);
            expect(field.info.customType).toBe(true);
        };

        class Type {}

        class ArrayCustomType {
            @Field(() => [Type], { callback })
            public prop!: Type[];
        }
    });

    it('uses array method', () => {
        const callback = (field: IFieldInfo) => {
            expect(field.scalar).toBe(Float.name);
            expect(field.info.customType).toBe(false);
        };

        class MethodArrayType {
            @Field(() => [Float], { callback })
            method(): number[] {
                return [0];
            }
        }
    });
}).run();

await describe('Resolver', () => {
    it('is success', () => {
        @Resolver()
        class ResolverSuccess {}
    });

    it('uses dependency inject', () => {
        const callback = (ctor: ResolverDependencyInject) => {
            expect(ctor.inject.works()).toBe(true);
        };

        class Dependency {
            works(): boolean {
                return true;
            }
        }

        @Resolver({ callback })
        class ResolverDependencyInject {
            constructor(public inject: Dependency) {}
        }
    });
}).run();

await describe('Schema', () => {
    // clear storage before every 'it'
    beforeEach(() => GraphStorage.clear());

    it('should crash on returning InputType', () => {
        @InputType()
        class Input {}

        @Resolver()
        class Root {
            @Query(() => Input)
            get() {}
        }

        expect(() => {
            const session = GraphStorage.build([Root.name]);
        }).toThrow(ErrorGraph.InputAsOutput);
    });

    it('should crash on using ObjectType as input', () => {
        @ObjectType()
        class Output {}

        @Resolver()
        class Root {
            @Query(() => Void)
            get(@Arg('input') inp: Output) {}
        }

        expect(() => {
            const session = GraphStorage.build([Root.name]);
        }).toThrow(ErrorGraph.OutputAsInput);
    });

    it('should fragment and process $vars', async () => {
        @InputType()
        class InputTwo {
            @Field(() => Int)
            public age!: number;
        }

        @InputType()
        class InputOne {
            @Field(() => String)
            public name!: string;
        }

        @ObjectType()
        class SearchResult {
            @Field(() => String)
            public name!: string;

            @Field(() => Int)
            public age!: number;
        }

        @Resolver()
        class Root {
            @Query(() => SearchResult)
            getName(@Arg('input') { name }: InputOne): SearchResult {
                return Object.assign(new SearchResult(), {
                    name,
                    age: 25
                } as SearchResult);
            }

            @Query(() => SearchResult)
            getAge(@Arg('input') { age }: InputTwo): SearchResult {
                return Object.assign(new SearchResult(), {
                    name: 'John',
                    age
                } as SearchResult);
            }
        }

        interface IQuery {
            getName: SearchResult;
            getAge: SearchResult;
        }

        const session = GraphStorage.build([Root.name]);
        const input = { name: 'John', age: 25 } as InputOne & InputTwo;

        const { getName, getAge } = await session.query<IQuery>(
            `fragment UserData on SearchResult {
                name, age
            }
            query { 
                getName(input: { name: $name }) {
                    ...UserData
                }
                getAge(input: { age: $age }) {
                    ...UserData
                }
            }`,
            input
        );

        expect(getName.name).toEqual(input.name);
        expect(getName.age).toEqual(input.age);
        expect(getAge.name).toEqual(input.name);
        expect(getAge.age).toEqual(input.age);
    });

    it('should query with nested, args and depedency inject', async () => {
        @InputType()
        class Input {
            @Field(() => String)
            name!: string;
        }

        @ObjectType()
        class Nested {
            @Field(() => Int, { nullable: true })
            age!: number;

            @Field(() => Bool, { comment: 'Is user admin' })
            admin!: boolean;
        }

        @ObjectType()
        class Output {
            @Field(() => Int)
            id!: number;

            @Field(() => String)
            name!: string;

            @Field(() => Nested)
            info!: Nested;
        }

        class Inject {
            private id = 0;

            getId(): number {
                return this.id;
            }

            setId(n: number): void {
                this.id = n;
            }
        }

        @Resolver()
        class Root {
            constructor(private inject: Inject) {}

            @Query(() => Output)
            public getUser(@Arg('input') { name }: Input) {
                return {
                    id: this.inject.getId(),
                    name,
                    info: { age: 30, admin: false }
                } as Output;
            }

            @Query(() => String)
            public getString(): string {
                return 'hello';
            }

            @Mutation(() => Void)
            public setId(@Arg('id') id: number) {
                this.inject.setId(id);
            }
        }

        interface IQuery {
            getUser: Output;
            getString: string;
        }

        const session = GraphStorage.build(Root.name);

        const mut = await session.query(
            `mutation {
                setId(id: $id)
            }`,
            { id: 1 }
        );

        const input = { name: 'John' } as Input;
        const { getUser } = await session.query<IQuery>(
            `query { 
                getUser(input: { name: $name }) { 
                    id, name, info { admin }
                } 
                getString
            }`,
            input
        );

        expect(getUser.name).toBe(input.name);
        expect(getUser.id).toBe(1);
        expect(getUser.info.admin).toBe(false);
    });

    it('should schema stich multiple @Resolver(s)', async () => {
        @Resolver()
        class B {
            @Query(() => String)
            getB() {
                return 'B';
            }
        }

        @Resolver()
        class A {
            @Query(() => String)
            getA() {
                return 'A';
            }
        }

        const session = GraphStorage.build([A.name, B.name]);
        const { getA, getB } = await session.query<{
            getA: string;
            getB: string;
        }>('query { getA, getB }');

        expect(getA).toEqual('A');
        expect(getB).toEqual('B');
    });

    it('should run demo example', async () => {
        // input type
        @InputType()
        class NestedInput {
            @Field(() => Bool)
            admin!: boolean;
        }

        // input type
        @InputType()
        class Input {
            @Field(() => String)
            name!: string;

            @Field(() => NestedInput)
            info!: NestedInput;
        }

        // output type
        @ObjectType()
        class NestedOutput {
            @Field(() => Bool)
            admin!: boolean;
        }

        // output type
        @ObjectType()
        class Output {
            @Field(() => Int)
            id!: number;

            @Field(() => String)
            name!: string;

            // nested object
            @Field(() => NestedOutput)
            info!: NestedOutput;
        }

        // dependency
        class Inject {
            private id = 0;

            getId(): number {
                return this.id;
            }

            setId(n: number): void {
                this.id = n;
            }
        }

        // callback with instantiated resolver class
        const callback = (ctor: Root) => {
            expect(ctor.inject.getId()).toEqual(0);
        };

        @Resolver({ callback })
        class Root {
            // dependency inject
            constructor(public inject: Inject) {}

            // return custom ObjectType from Query
            @Query(() => Output)
            public getUser(@Arg('input') { name, info }: Input): Output {
                return {
                    // access dependency injected function
                    id: this.inject.getId(),
                    name,
                    info
                } as Output;
            }

            // void
            @Mutation(() => Void)
            public setId(@Arg('id') id: number): void {
                // access dependency injected function
                this.inject.setId(id);
            }
        }

        @Resolver()
        class Stitch {
            // return primitive value
            @Query(() => String)
            public getString(): string {
                return 'hello';
            }
        }

        //
        interface IQuery {
            getUser: Output;
            getString: string;
        }

        // build session, string or string[] for schema stitching
        const session = GraphStorage.build([Root.name, Stitch.name]);

        // mutation, map $var to value
        const mutation = await session.query('mutation { setId(id: $id) }', {
            id: 1
        });

        // query, map nested $var to value
        const input = { name: 'John', info: { admin: true } } as Input;
        const { getUser, getString } = await session.query<IQuery>(
            `query { 
                getUser(input: { name: $name, info: { admin: $admin } }) { 
                    id, name, info { admin }
                } 
                getString
            }`,
            input
        );

        expect(getUser.name).toEqual(input.name);
        expect(getUser.info.admin).toBe(input.info.admin);
        expect(getUser.id).toEqual(1); // 1 since mutation modified it
        expect(getString).toBe('hello');
    });
}).run();

describe('Writer', () => {
    it('should write .gql file', () => {});
});
