import {MONS_PER_BOX} from "./BoxView";

export function CreateSingleBlankSelectedPos()
{
    return Array.apply(null, Array(MONS_PER_BOX)).map(function () {return false});
}
