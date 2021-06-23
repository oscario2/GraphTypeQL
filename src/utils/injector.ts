// @ts-skip
// deno-lint-ignore-file no-explicit-any
import { Reflect } from './reflect.ts';

export interface New<T> {
    new (...args: any[]): T;
}

export const Injector = new (class {
    resolve<T>(target: New<any>): T {
        // get each constructor argument
        const tokens = Reflect.getMetadata('design:paramtypes', target) || [];

        // recursively resolve each constructor arguments for all nested classes
        const injections = tokens.map((token: New<any>) =>
            Injector.resolve(token)
        );

        // create a new instance with vargs
        return new target(...injections);
    }
})();
