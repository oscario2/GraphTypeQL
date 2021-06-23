// deno-lint-ignore-file no-explicit-any
export type TFieldType = 'field' | 'query' | 'mutation';

// decorator types
export type MethodAndPropDecorator = PropertyDecorator & MethodDecorator;
export type ReturnTypeFunc = (returns?: any) => void;

// decorator info
export interface IDecoratorProps {
    returnType?: ReturnTypeFunc | FieldOptions;
    maybeOptions?: FieldOptions;
    target: Record<string, unknown>;
    propertyKey: string | symbol;
    descriptor?: PropertyDescriptor;
    fieldType: TFieldType;
}

// JS reflection info
export interface IReflectionInfo {
    isMethod: boolean;
    isArray: boolean;
    customType: boolean;
    hasResolver: boolean;
    fieldType: TFieldType;
}

// @Arg - parameter
export type IArgInfo = {
    parent: string;
    method: string;
    name: string;
    scalar: string;
    customType: boolean;
    index: number;
};

// @ObjectType - class
export type IObjectTypeInfo = {
    name: string;
    input: boolean; // Input or Type
};

// @Field - property or method
// @Query/@Mutation - method
export interface IFieldInfo {
    parent: string; // parent 'class' of property
    name: string; // property type
    info: IReflectionInfo; // property info
    scalar: string; // GQL Scalar or JS object as string
    options: FieldOptions; // avaliable 'options' argument
}

// @Field options
export interface FieldOptions {
    nullable?: boolean;
    comment?: string;
    defaultValue?: string;
    complexity?: number;
    callback?: (field: IFieldInfo) => void;
}

// GQL 'Scalar' types
export class Float {}
export class Int {}
export class Bool {}
export class Void {}

// primitive JS to GQL types
export class ScalarType {
    static toScalar(type: string) {
        switch (type) {
            case String.name:
                return String.name;
            case Number.name:
                return Number.name;
            case Bool.name:
            case Boolean.name:
                return Bool.name;
            case Int.name:
                return Int.name;
            case Float.name:
                return Float.name;
            case Void.name:
                return Void.name;
        }
        // custom class
        return null;
    }
}
