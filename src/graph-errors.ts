// deno-lint-ignore-file no-namespace
export namespace ErrorGraph {
    export class ArrayNoReturnType extends Error {
        constructor(caller: string) {
            super(
                `[${caller}]: Need to define a return type for primtive array; e.g @Field(returns => [String]) for string[]`
            );
        }
    }

    export class EmptyReflection extends Error {
        constructor(caller: string) {
            super(
                `[${caller}]: No return type provided and no arguments found`
            );
        }
    }

    export class InputAsOutput extends Error {
        constructor() {
            super('Input type used as return');
        }
    }

    export class MethodNoArguments extends Error {
        constructor(caller: string) {
            super(`[${caller}]: No method arguments found`);
        }
    }

    export class MethodNoReturnType extends Error {
        constructor(caller: string) {
            super(
                `[${caller}]: Need to define a returnType for method; e.g @Field(returns => [String])'`
            );
        }
    }

    export class NoQueryFieldsFound extends Error {
        constructor() {
            super('No @Query fields found');
        }
    }

    export class ObjectTypeAlreadyRegistered extends Error {
        constructor(caller: string) {
            super(`@ObjectType: ${caller} already registered`);
        }
    }

    export class OutputAsInput extends Error {
        constructor() {
            super('Input type used as return');
        }
    }

    export class ResolverAlreadyRegistered extends Error {
        constructor(caller: string) {
            super(`@Resolver: ${caller} already registered`);
        }
    }

    export class ResolverFieldMustBeMethod extends Error {
        constructor(caller: string, propType: string, fieldType: string) {
            super(
                `[${caller}]: ${propType} can't have @${fieldType} decorator. Must be 'method'`
            );
        }
    }

    export class ReturnIsUnknown extends Error {
        constructor(caller: string) {
            super(
                `[${caller}]: Property 'any', 'unknown', 'object' or method is not allowed without @Field() type`
            );
        }
    }

    export class ResolverNoDecorator extends Error {
        constructor(parent: string, fieldType: string, fieldName: string) {
            super(
                `No @Resolver on class '${parent}' for @${fieldType} '${fieldName}'`
            );
        }
    }

    export class TypeNoFieldDecorator extends Error {
        constructor(caller: string) {
            super(
                `[${caller}]: does not have any @Field decorator; but is called by resolver`
            );
        }
    }
    export class TypeMismatch extends Error {
        constructor(
            caller: string,
            propType: string,
            reflectType: string,
            finalType: string
        ) {
            super(
                `[${caller}]: @Field and '${propType}' type mismatch. '${propType}' returns '${reflectType}' but @Field returns '${finalType}'`
            );
        }
    }
}
