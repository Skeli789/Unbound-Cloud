/*
    A class for viewing a Pokemon's summary.
*/

import React, {Component} from 'react';
import {GetMonLevel, GetMonAbility, GetMonNature, GetMonGender, GetVisibleStats, /*GetVisibleEVs, GetVisibleIVs,*/
        GetMonOTName, GetMonOTGender, GetMonVisibleOTId,
        GetMoveName, GetAbilityName, GetNatureName} from "./PokemonUtil";

import "./stylesheets/PokemonSummary.css";

const NATURE_STAT_TABLE =
[
    // Atk Def Spd Sp.Atk Sp.Def
    [    0,  0,  0,     0,     0], // Hardy
    [   +1, -1,  0,     0,     0], // Lonely
    [   +1,  0, -1,     0,     0], // Brave
    [   +1,  0,  0,    -1,     0], // Adamant
    [   +1,  0,  0,     0,    -1], // Naughty
    [   -1, +1,  0,     0,     0], // Bold
    [    0,  0,  0,     0,     0], // Docile
    [    0, +1, -1,     0,     0], // Relaxed
    [    0, +1,  0,    -1,     0], // Impish
    [    0, +1,  0,     0,    -1], // Lax
    [   -1,  0, +1,     0,     0], // Timid
    [    0, -1, +1,     0,     0], // Hasty
    [    0,  0,  0,     0,     0], // Serious
    [    0,  0, +1,    -1,     0], // Jolly
    [    0,  0, +1,     0,    -1], // Naive
    [   -1,  0,  0,    +1,     0], // Modest
    [    0, -1,  0,    +1,     0], // Mild
    [    0,  0, -1,    +1,     0], // Quiet
    [    0,  0,  0,     0,     0], // Bashful
    [    0,  0,  0,    +1,    -1], // Rash
    [   -1,  0,  0,     0,    +1], // Calm
    [    0, -1,  0,     0,    +1], // Gentle
    [    0,  0, -1,     0,    +1], // Sassy
    [    0,  0,  0,    -1,    +1], // Careful
    [    0,  0,  0,     0,     0], // Quirky
];


export class PokemonSummary extends Component
{
    constructor(props)
    {
        super(props);
        this.state = //Set test data
        {
            pokemon: props.pokemon,
        };
    }

    printStats()
    {
        var key = 0;
        var statNames = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var visibleStatIdToStatId = [0, 1, 2, 4, 5, 3];
        var stats = GetVisibleStats(this.state.pokemon);
        var nature = GetMonNature(this.state.pokemon);
        /*var evs = GetVisibleEVs(this.state.pokemon);
        var ivs = GetVisibleIVs(this.state.pokemon);*/
        var printableStats = [];

        for (let visibleStatId = 0; visibleStatId < stats.length; ++visibleStatId)
        {
            let natureColour;
            let realStatId = visibleStatIdToStatId[visibleStatId];

            if (realStatId > 0) //Not HP
                natureColour = NATURE_STAT_TABLE[nature][realStatId - 1] === 1 ? "red"
                             : NATURE_STAT_TABLE[nature][realStatId  - 1] === -1 ? "cornflowerblue" : "";

            printableStats.push(
                <span className="summary-stat-title" key={key++}>
                    {statNames[visibleStatId]}
                </span>
            );

            printableStats.push(
                    <span className={"summary-stat-value"} style={{color: natureColour}} key={key++}>
                        {stats[visibleStatId]}
                    </span>
            );

            /*printableStats.push(
                    <span className="summary-stat-ev" key={key++}>
                        {evs[statId]}
                    </span>
            );

            printableStats.push(
                    <span className="summary-stat-iv" key={key++}>
                        {ivs[statId]}
                    </span>
            );*/
        }

        return (
            <div className="summary-stats-container">
                {printableStats}
            </div>
        );
    }

    printMoves()
    {
        var moves = [];
        var key = 0;

        if (this.state.pokemon !== null && this.state.pokemon["moves"] !== null)
        {
            for (let move of this.state.pokemon["moves"])
            {
                var moveName = GetMoveName(move);
                moves.push(<span className="summary-move" key={key++}>{moveName}</span>)
            }
        }

        return (
            <div className="summary-moves-container">
                {moves}
            </div>
        )
    }

    getGenderSymbol()
    {
        var symbol = "";
        var gender = GetMonGender(this.state.pokemon).toUpperCase();

        if (gender === "M")
            symbol = <span className="male-gender-symbol">♂</span>;
        else if (gender === "F")
            symbol = <span className="female-gender-symbol">♀</span>;

        return symbol;
    }

    render()
    {
        var level = GetMonLevel(this.state.pokemon);
        var ability = GetAbilityName(GetMonAbility(this.state.pokemon));
        var nature = GetNatureName(GetMonNature(this.state.pokemon));

        return (
            <div className="pokemon-summary-container">
                <div className="summary-name-level-container">
                    <span>
                        {this.state.pokemon["nickname"]}
                    </span>
                    <span>
                        {this.getGenderSymbol()}
                    </span>
                    <span className="summary-level">
                        Lv. {level}
                    </span>
                </div>
                <div className="summary-ot-container">
                    <span className={GetMonOTGender(this.state.pokemon) === "M" ? "summary-male-ot" : "summary-female-ot"}>
                        {GetMonOTName(this.state.pokemon)}
                    </span>
                    : {GetMonVisibleOTId(this.state.pokemon)}
                </div>
                <div className="summary-ability">
                    Ability: {ability}
                </div>
                <div className="summary-nature">
                    Nature: {nature}
                </div>
                {this.printStats()}
                {this.printMoves()}
            </div>
        );
    }
}
