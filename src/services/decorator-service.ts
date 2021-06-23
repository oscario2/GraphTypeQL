// deno-lint-ignore-file ban-types
import { ErrorGraph } from '../graph-errors.ts';
import {
    IFieldInfo,
    IDecoratorProps,
    ScalarType,
    Void
} from '../graph-types.ts';
import { log } from '../utils/logger.ts';
import { Reflect } from '../utils/reflect.ts';

// @Field, @Query, @Mutation
export const DecoratorService = (props: IDecoratorProps): IFieldInfo => {
    const { target, returnType, maybeOptions, propertyKey, fieldType } = props;
    if (typeof propertyKey == 'symbol') throw new Error('Symbol not allowed');

    const parent = target.constructor.name;

    // caller of decorator
    const caller = `${parent} > ${propertyKey}`;

    // 'properties' of a class wrapped in a function provides a .descriptor
    const isMethod = target[propertyKey] ? true : false;
    const propType = isMethod ? 'Method' : 'Property';

    // @Query or @Mutation must be 'method'
    if (!isMethod && fieldType != 'field') {
        throw new ErrorGraph.ResolverFieldMustBeMethod(
            caller,
            propType,
            fieldType
        );
    }

    // get return type of 'method' or 'property'
    const reflect = Reflect.getMetadata(
        isMethod ? 'design:returntype' : 'design:type',
        target,
        propertyKey
    ) as { name: string };

    // can't reflect return types of methods from a class wrapped in function
    const reflectType = reflect ? reflect.name : 'Object';

    // is returnType provided
    const hasReturnType = returnType instanceof Function;

    // method must have a return type
    if (isMethod && !hasReturnType) {
        throw new ErrorGraph.MethodNoReturnType(caller);
    }

    // error if primitive 'Array' without a 'type' provided
    if (!hasReturnType && reflectType == 'Array') {
        throw new ErrorGraph.ArrayNoReturnType(caller);
    }

    // error if 'any' or 'unknown' without a type provided
    if (!hasReturnType && reflectType == 'Object') {
        throw new ErrorGraph.ReturnIsUnknown(caller);
    }

    // evaluate 'returnType' if provided
    const evaluate = hasReturnType ? (returnType as Function)() : reflect;

    // is evaluated type an Array
    const isArray = Array.isArray(evaluate);

    // set final type
    const finalType: string = isArray ? evaluate[0].name : evaluate.name;

    // handle ambigious types
    if (finalType == 'Number') {
        const info = `[${caller}]: Found ambigious type '${finalType}'. Assuming Float`;
        log.warn(info);
    }

    // is returning type a JS object
    const customType = ScalarType.toScalar(finalType) == null;

    // covert primitive types to equivalent Scalar or keep if JS object reference
    const scalar = customType ? finalType : ScalarType.toScalar(finalType);

    // convert reflected type to Scalar for type comparison
    const reflectScalar = customType
        ? reflectType
        : ScalarType.toScalar(reflectType);

    // reflected and evaluated type mismatch
    const skip = ['Array', 'Object', 'Boolean', 'Number'];
    if (skip.indexOf(reflectType) == -1 && reflectScalar != scalar) {
        throw new ErrorGraph.TypeMismatch(
            caller,
            propType,
            reflectType,
            finalType
        );
    }

    // add 'options' from either first or second parameter
    const options = typeof returnType == 'object' ? returnType : maybeOptions;

    // is @Query or @Mutation
    const hasResolver = fieldType != 'field' ? true : false;

    // build field info
    const field = {
        parent,
        scalar,
        name: propertyKey,
        info: { isArray, isMethod, customType, hasResolver, fieldType },
        options: options ? options : {}
    } as IFieldInfo;

    // if type void, automatically make field or method nullable
    if (finalType == Void.name) {
        Object.assign(field.options, { nullable: true });
    }

    const outType = isArray ? scalar + '[]' : scalar;
    const outText = `[${caller}]: @${fieldType} is a '${propType}' of type '${outType}'`;
    log.debug(outText);

    return field;
};
