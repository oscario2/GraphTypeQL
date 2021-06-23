// deno-lint-ignore-file no-explicit-any ban-types
import { ReturnTypeFunc } from '../graph-types.ts';
import { GraphStorage } from '../schema/graph-storage.ts';
import { Injector, New } from '../utils/injector.ts';

export interface ResolverOptions {
    callback: (ctor: any) => void;
}

export function Resolver(): (target: New<any>) => void;
export function Resolver(
    maybeOptions: ResolverOptions
): (target: New<any>) => void;
export function Resolver(returnNew: ReturnTypeFunc): (target: New<any>) => void;
export function Resolver(
    returnNew: ReturnTypeFunc,
    maybeOptions: ResolverOptions
): (target: New<any>) => void;
export function Resolver(
    returnNew?: ReturnTypeFunc | ResolverOptions,
    maybeOptions?: ResolverOptions
): (target: New<any>) => void {
    return (target: New<any>) => {
        // resolve any dependencies
        const resolver: Object = Injector.resolve(target);

        // register resolver
        GraphStorage.from(target.name).addResolver(resolver);

        // add 'options' from either first or second parameter
        const options = typeof returnNew == 'object' ? returnNew : maybeOptions;

        // callback if set
        const callback = options?.callback;
        if (callback instanceof Function) callback(resolver);
    };
}
