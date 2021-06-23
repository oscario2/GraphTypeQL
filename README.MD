# GraphTypeQL

[![GraphQL](https://github.com/oscario2/GraphTypeQL/actions/workflows/main.yaml/badge.svg)](https://github.com/oscario2/GraphTypeQL/actions/workflows/main.yaml)

## Introduction

A `graphql-js` object builder. Made in `deno` as a learning experience.

- [X] Zero dependencies besides `graphql-js`
- [X] Supports `deno`, `node` and the `browser` bundled
- [x] Supports dependency injection, schema stiching, $var mapping and callbacks
- [ ] Generate SDL from GQL object
- [ ] Query complexity

Below is an example showcasing most features of this module. More examples can be found under `tests/`.

```js
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
const mutation = await session.query('mutation { setId(id: $id) }', 
    { id: 1 }
);

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

// using x2
expect(getUser.name).toEqual(input.name);
expect(getUser.info.admin).toBe(input.info.admin);
expect(getUser.id).toEqual(1); // 1 since mutation modified it
expect(getString).toBe('hello');
```
