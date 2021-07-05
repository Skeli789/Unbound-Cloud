
import React, {Component} from 'react';

import {GetMonAbility, GetMonNature, GetVisibleIVs, GetVisibleEVs, IsMonShiny, GetMonGender, CanMonGigantamax,
        GetSpeciesName, GetNatureName, GetAbilityName, GetMoveName, GetItemName, GetMonLevel} from './PokemonUtil';

import "./stylesheets/ShowdownExport.css";

const EV_IV_NAMES = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

export class ShowdownExport extends Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            pokemonList: props.pokemonList,
        }
    }

    getMonShowdownText(pokemon)
    {
        var i, nameLine;
        var nickname = pokemon["nickname"];
        var speciesName = GetSpeciesName(pokemon["species"]);
        var genderLetter = GetMonGender(pokemon);
        var itemName = GetItemName(pokemon["item"]);
        var abilityLine = "Ability: " + GetAbilityName(GetMonAbility(pokemon));
        var levelLine = "Level: " + GetMonLevel(pokemon);
        var shinyLine = "Shiny: " + (IsMonShiny(pokemon) ? "Yes" : "No");
        var gigantamaxLine = "";
        var friendshipLine = "Happiness: " + pokemon["friendship"];
        var natureLine = GetNatureName(GetMonNature(pokemon)) + " Nature";
        var evsLine = "EVs: ";
        var ivsLine = "IVs: ";
        var moveNames = [];

        if (CanMonGigantamax(pokemon)) //Only display if it can
            gigantamaxLine = "Gigantamax: Yes\n"

        var ivs = GetVisibleIVs(pokemon);
        for (i = 0; i < ivs.length; ++i)
        {
            ivsLine += `${ivs[i]} ${EV_IV_NAMES[i]}`;
            if (i + 1 < ivs.length) //Not last iteration
                ivsLine += " / ";
        }

        var evs = GetVisibleEVs(pokemon);
        for (i = 0; i < evs.length; ++i)
        {
            evsLine += `${evs[i]} ${EV_IV_NAMES[i]}`;
            if (i + 1 < evs.length) //Not last iteration
                evsLine += " / ";
        }

        for (let move of pokemon["moves"])
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

    getShowdownText()
    {
        var text = ""

        for (let pokemon of this.state.pokemonList)
            text += this.getMonShowdownText(pokemon) + "\n\n";

        return text.trimEnd();
    }

    highlightTextArea()
    {
        var elem = document.getElementById("showdown-textarea");
        if (elem !== null)
        {
            elem.select(); //Select all text
            elem.setSelectionRange(0, 99999); //For mobile devices
            //document.execCommand("copy"); //Copy the text inside the text field
        }
    }

    render()
    {
        var text = this.getShowdownText();

        return (
            <div className="showdown-export">
                <textarea id="showdown-textarea" onClick={this.highlightTextArea.bind(this)} readOnly="readonly" value={text}/>
            </div>
        )
    }
}
