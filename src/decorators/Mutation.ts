// deno-lint-ignore-file ban-types
import {
    FieldOptions,
    IDecoratorProps,
    MethodAndPropDecorator,
    ReturnTypeFunc
} from '../graph-types.ts';
import { DecoratorService } from '../services/decorator-service.ts';
import { GraphStorage } from '../schema/graph-storage.ts';

export function Mutation(): MethodAndPropDecorator;
export function Mutation(returnType: ReturnTypeFunc): MethodAndPropDecorator;
export function Mutation(maybeOptions: FieldOptions): MethodAndPropDecorator;
export function Mutation(
    returnType: ReturnTypeFunc,
    maybeOptions: FieldOptions
): MethodAndPropDecorator;
export function Mutation(
    returnType?: ReturnTypeFunc | FieldOptions,
    maybeOptions?: FieldOptions
): MethodAndPropDecorator {
    return function (
        target: Object,
        propertyKey: string | symbol,
        descriptor?: PropertyDescriptor
    ): void {
        //
        const props = {
            returnType,
            maybeOptions,
            target,
            propertyKey,
            descriptor,
            fieldType: 'mutation'
        } as IDecoratorProps;

        // build field
        const field = DecoratorService(props);

        // register Mutation
        GraphStorage.from(field.parent).addField(field);

        // callback if set
        const callback = field.options?.callback;
        if (callback instanceof Function) callback(field);
    };
}
