// deno-lint-ignore-file ban-types
import { IObjectTypeInfo } from '../graph-types.ts';
import { GraphStorage } from '../schema/graph-storage.ts';

export function ObjectType(): ClassDecorator {
    return function <TFunction extends Function>(
        target: TFunction
    ): TFunction | void {
        //
        const props = {
            name: target.name,
            input: false
        } as IObjectTypeInfo;

        //
        GraphStorage.from(target.name).addObject(props);
    };
}
