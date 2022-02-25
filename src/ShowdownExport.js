/**
 * Text display for exporting Pokemon data to Pokemon Showdown.
 */

import React, {Component} from 'react';

import {CanMonGigantamax, GetAbility, GetEVs, GetFriendship, GetGender, GetItem, GetIVs,
        GetLevel, GetMoves, GetNickname, GetSpecies, GetVisibleNature, IsShiny} from './PokemonUtil';
import {GetAbilityName, GetItemName, GetMoveName, GetNatureName, GetSpeciesName} from "./Util";

import "./stylesheets/ShowdownExport.css";

const EV_IV_NAMES = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
const TEXT_AREA_ID = "showdown-textarea";


export class ShowdownExport extends Component
{
    /**
     * Sets up variables for the Showdown view.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            pokemonList: props.pokemonList, //Can display multiple Pokemon at the same time.
        }
    }

    /**
     * Gets the text of a Pokemon's Showdown data.
     * @param {Pokemon} pokemon - The Pokemon to display.
     * @returns {JSX} An element with text of the Pokemon's data.
     */
    getMonShowdownText(pokemon)
    {
        var i, nameLine;
        var nickname = GetNickname(pokemon);
        var speciesName = GetSpeciesName(GetSpecies(pokemon));
        var genderLetter = GetGender(pokemon);
        var itemName = GetItemName(GetItem(pokemon));
        var abilityLine = "Ability: " + GetAbilityName(GetAbility(pokemon));
        var levelLine = "Level: " + GetLevel(pokemon);
        var shinyLine = "Shiny: " + (IsShiny(pokemon) ? "Yes" : "No");
        var gigantamaxLine = "";
        var friendshipLine = "Happiness: " + GetFriendship(pokemon);
        var natureLine = GetNatureName(GetVisibleNature(pokemon)) + " Nature";
        var evsLine = "EVs: ";
        var ivsLine = "IVs: ";
        var moveNames = [];

        if (CanMonGigantamax(pokemon)) //Only display if it can
            gigantamaxLine = "Gigantamax: Yes\n"

        var ivs = GetIVs(pokemon);
        for (i = 0; i < ivs.length; ++i)
        {
            ivsLine += `${ivs[i]} ${EV_IV_NAMES[i]}`;
            if (i + 1 < ivs.length) //Not last iteration
                ivsLine += " / ";
        }

        var evs = GetEVs(pokemon);
        for (i = 0; i < evs.length; ++i)
        {
            evsLine += `${evs[i]} ${EV_IV_NAMES[i]}`;
            if (i + 1 < evs.length) //Not last iteration
                evsLine += " / ";
        }

        for (let move of GetMoves(pokemon))
        {
            var moveName = GetMoveName(move);
            if (moveName !== "-")
                moveNames.push(moveName);
        }

        //Prepare Final Output
        nameLine = `${nickname} (${speciesName})`
        if (genderLetter !== "U")
            nameLine += ` (${genderLetter})`;
        
        if (itemName.toLowerCase() !== "none")
            nameLine += ` @ ${itemName}`;
        
        var textArea =
            `${nameLine}\n${abilityLine}\n${levelLine}\n${shinyLine}\n${gigantamaxLine}${friendshipLine}\n${evsLine}\n${natureLine}\n${ivsLine}\n`;

        for (let moveName of moveNames)
            textArea += `- ${moveName}\n`;

        return textArea.trimEnd();
    }

    /**
     * Gets the text of multiple Pokemon's Showdown data.
     * @returns {JSX} An element with text of all the Pokemon's data.
     */
    getShowdownText()
    {
        var text = "";

        for (let pokemon of this.state.pokemonList)
            text += this.getMonShowdownText(pokemon) + "\n\n";

        return text.trimEnd();
    }

    /**
     * Selects all text in the showdown text area.
     */
    highlightTextArea()
    {
        var elem = document.getElementById(TEXT_AREA_ID);

        if (elem != null)
        {
            elem.select(); //Select all text
            elem.setSelectionRange(0, 99999); //For mobile devices
            //document.execCommand("copy"); //Copy the text inside the text field
        }
    }

    /**
     * Prints the Showdown data display.
     */
    render()
    {
        var text = this.getShowdownText();

        return (
            <div className="showdown-export">
                <textarea id={TEXT_AREA_ID} onClick={this.highlightTextArea.bind(this)} readOnly="readonly" value={text}/>
            </div>
        );
    }
}
