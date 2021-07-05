/*
    A class for viewing a Pokemon's summary.
*/

import React, {Component} from 'react';
import {GetMonLevel, GetMonAbility, GetMonNature, GetMonGender, GetVisibleStats, GetVisibleEVs, GetVisibleIVs,
        GetMoveName, GetAbilityName, GetNatureName} from "./PokemonUtil";

import "./stylesheets/PokemonSummary.css";

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
        var stats = GetVisibleStats(this.state.pokemon);
        var evs = GetVisibleEVs(this.state.pokemon);
        var ivs = GetVisibleIVs(this.state.pokemon);
        var printableStats = [];

        for (let statId = 0; statId < stats.length; ++statId)
        {
            printableStats.push(
                <span className="summary-stat-title" key={key++}>
                    {statNames[statId]}
                </span>
            );

            printableStats.push(
                    <span className="summary-stat-value" key={key++}>
                        {stats[statId]}
                    </span>
            );

            printableStats.push(
                    <span className="summary-stat-ev" key={key++}>
                        {evs[statId]}
                    </span>
            );

            printableStats.push(
                    <span className="summary-stat-iv" key={key++}>
                        {ivs[statId]}
                    </span>
            );
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
