// deno-lint-ignore-file ban-types
import { IArgInfo, ScalarType } from '../graph-types.ts';
import { GraphStorage } from '../schema/graph-storage.ts';
import { Reflect } from '../utils/reflect.ts';

export function Arg(
    name?: string
    // _returnType?: ReturnTypeFunc
): ParameterDecorator {
    return function (
        target: Object,
        propertyKey: string | symbol,
        parameterIndex: number
    ): void {
        if (!name || name.length == 0) {
            throw new Error(
                `Invalid name for arg ${parameterIndex} at ${
                    target.constructor.name
                } > ${propertyKey.toString()}`
            );
        }

        // get all method params
        const args = Reflect.getMetadata(
            'design:paramtypes',
            target,
            propertyKey
        ) as Function[];

        // get param in question
        const type = args[parameterIndex].name;

        // is return type a JS object
        const customType =
            ScalarType.toScalar(args[parameterIndex].name) == null;

        // covert primitive types to equivalent Scalar or keep if JS object reference
        const scalar = customType ? type : ScalarType.toScalar(type);

        //
        const props = {
            parent: target.constructor.name,
            method: propertyKey,
            scalar,
            name,
            customType,
            index: parameterIndex
        } as IArgInfo;

        //
        GraphStorage.from(target.constructor.name).addArg(props);
    };
}
