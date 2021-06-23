// deno-lint-ignore-file ban-types
import {
    FieldOptions,
    IDecoratorProps,
    MethodAndPropDecorator,
    ReturnTypeFunc
} from '../graph-types.ts';
import { DecoratorService } from '../services/decorator-service.ts';
import { GraphStorage } from '../schema/graph-storage.ts';

export function Query(): MethodAndPropDecorator;
export function Query(returnType: ReturnTypeFunc): MethodAndPropDecorator;
export function Query(maybeOptions: FieldOptions): MethodAndPropDecorator;
export function Query(
    returnType: ReturnTypeFunc,
    maybeOptions: FieldOptions
): MethodAndPropDecorator;
export function Query(
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
            fieldType: 'query'
        } as IDecoratorProps;

        // build field
        const field = DecoratorService(props);

        // register Query
        GraphStorage.from(field.parent).addField(field);

        // callback if set
        const callback = field.options?.callback;
        if (callback instanceof Function) callback(field);
    };
}
