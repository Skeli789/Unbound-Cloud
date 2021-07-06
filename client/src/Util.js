import {MONS_PER_BOX} from "./BoxView";
import ItemNames from "./data/ItemNames.json";

export const BASE_GFX_LINK = "images/";


export function CreateSingleBlankSelectedPos()
{
    return Array.apply(null, Array(MONS_PER_BOX)).map(function () {return false});
}

export function GetItemName(item)
{
    if (item in ItemNames)
        return ItemNames[item]["name"];

    return "None";
}

export function GetItemIconLink(item)
{
    if (item in ItemNames)
    {
        if ("link" in ItemNames[item])
            return `https://raw.githubusercontent.com/msikma/pokesprite/master/items/${ItemNames[item]["link"]}.png`;

        return BASE_GFX_LINK + item + ".png";
    }
    
    return "";
}
