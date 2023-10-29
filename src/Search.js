/**
 * A class for applying a search filter to Pokemon.
 */

import React, { Component } from 'react';
import {Button, Form} from "react-bootstrap";
import {Dropdown} from 'semantic-ui-react';

import {BOX_HOME, BOX_SAVE} from './MainPage';
import {GetAbility, GetBaseStats, GetCaughtBall, GetGender, GetItem, GetLevel, GetNature,
        GetMoves, GetSpecies, GetVisibleNature, HasPokerus, IsEgg, IsShiny, MonWillLoseDataInSave, 
        MAX_LEVEL} from './PokemonUtil';
import {GetAbilityName, GetItemName, GetSpeciesName} from "./Util";

import AbilityNames from "./data/AbilityNames.json";
import BallTypeNames from "./data/BallTypeNames.json";
import ItemNames from "./data/ItemNames.json";
import MoveNames from "./data/MoveNames.json";
import NatureNames from "./data/NatureNames.json";
import SpeciesNames from "./data/SpeciesNames.json";
import TypeNames from "./data/TypeNames.json";

import {ImCancelCircle} from "react-icons/im";

import "./stylesheets/BoxView.css";
import "./stylesheets/Search.css";


export class Search extends Component
{
    /**
     * Sets up the data fields needed for the search menu.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            speciesIds: [],
            abilityIds: [],
            itemIds: [],
            moveIds: [],
            natureIds: [],
            ballTypeIds: [],
            typeIds: [],
            levelStart: "",
            levelEnd: "",
            genders: [false, false, false],
            shiny: [false, false],
            pokerus: [false, false],
            warning: [false, false],
            speciesNameList: [],
            abilityNameList: [],
            moveNameList: [],
            itemNameList: [],
            natureNameList: [],
            ballTypeNameList: [],
            typeNameList: [],
            boxType: this.props.boxType,
            boxSlot: this.props.boxSlot,
            parent: this.props.parent,
            mainPage: this.props.mainPage,
            loaded: false,
        };
    }

    /**
     * Starts changing the screen from "Loading..." when the loading screen is displayed.
     */
    async componentDidMount()
    {   
        await new Promise(r => setTimeout(r, 10)); //Allows the loading screen to render
        this.setState
        ({
            speciesNameList: this.createSpeciesNameList(),
            abilityNameList: this.createAbilityNameList(),
            moveNameList: this.createMoveNameList(),
            itemNameList: this.createItemNameList(),
            natureNameList: this.createNatureNameList(),
            ballTypeNameList: this.createBallTypeNameList(),
            typeNameList: this.createTypeNameList(),
            loaded: true
        });
    }

    /**
     * Gets whether or not the search filter is for Home storage boxes.
     * @returns {Boolean} True if the search will be applied to a Home box. False otherwise.
     */
    isHomeBox()
    {
        return this.state.boxType === BOX_HOME;
    }

    /**
     * Gets whether or not the search filter is for save data boxes.
     * @returns {Boolean} True if the search will be applied to a save box. False otherwise.
     */
    isSaveBox()
    {
        return this.state.boxType === BOX_SAVE;
    }

    /**
     * Creates a list of species names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: SPECIES_ID, text: Species Name, value: SPECIES_ID}.
     */
    createSpeciesNameList()
    {
        var species = [];
        var namesAdded = {};

        for (let speciesId of Object.keys(SpeciesNames))
        {
            if (speciesId === "SPECIES_NONE")
                continue;

            var name = GetSpeciesName(speciesId);
            if (name in namesAdded || name === "Unknown Species")
                continue; //Don't add duplicate names

            species.push({key: speciesId, text: name, value: speciesId});
            namesAdded[name] = true;
        }

        species.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return species;
    }

    /**
     * Creates a list of Ability names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: ABILITY_ID, text: Ability Name, value: ABILITY_ID}.
     */
    createAbilityNameList()
    {
        var abilities = [];

        for (let abilityId of Object.keys(AbilityNames))
        {
            if (abilityId === "ABILITY_NONE")
                continue;

            abilities.push({key: abilityId, text: GetAbilityName(abilityId), value: abilityId});
        }

        abilities.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return abilities;
    }

    /**
     * Creates a list of move names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: MOVE_ID, text: Move Name, value: MOVE_ID}.
     */
    createMoveNameList()
    {
        var moves = [];

        for (let moveId of Object.keys(MoveNames))
        {
            if (moveId === "0"
            || MoveNames[moveId].startsWith("Z-Move")
            || MoveNames[moveId].startsWith("Max ")
            || MoveNames[moveId].startsWith("G-Max "))
                continue;

            moves.push({key: moveId, text: MoveNames[moveId], value: moveId});
        }

        moves.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return moves;
    }

    /**
     * Creates a list of item names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: ITEM_ID, text: Item Name, value: ITEM_ID}.
     */
    createItemNameList()
    {
        var items = [];

        for (let itemId of Object.keys(ItemNames))
        {
            if (itemId === "ITEM_NONE")
                continue;

            items.push({key: itemId, text: GetItemName(itemId), value: itemId});
        }

        items.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return items;
    }

    /**
     * Creates a list of nature names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: NATURE_ID, text: Nature Name, value: NATURE_ID}.
     */
    createNatureNameList()
    {
        var natures = [];

        for (let natureId of Object.keys(NatureNames))
            natures.push({key: natureId, text: NatureNames[natureId], value: natureId});

        natures.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return natures;
    }

    /**
     * Creates a list of Poke Ball names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: BALL_TYPE_ID, text: Ball Name, value: BALL_TYPE_ID}.
     */
    createBallTypeNameList()
    {
        var ballTypes = [];

        for (let ballTypeId of Object.keys(BallTypeNames))
            ballTypes.push({key: ballTypeId, text: BallTypeNames[ballTypeId], value: ballTypeId});

        ballTypes.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return ballTypes;
    }

    /**
     * Creates a list of Pokemon types that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: TYPE_ID, text: Type Name, value: TYPE_ID}.
     */
    createTypeNameList()
    {
        var types = [];

        for (let typeId of Object.keys(TypeNames))
            types.push({key: typeId, text: TypeNames[typeId], value: typeId});

        types.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return types;
    }

    /**
     * Makes it so the user's starting level input is always valid.
     */
    fixLevelStart()
    {
        var levelStart = this.state.levelStart.trim();
        var levelEnd = this.state.levelEnd;

        if (levelStart !== "" && isNaN(levelStart))
            levelStart = "";
        else if (parseInt(levelStart) < 1)
            levelStart = 1;
        else if (parseInt(levelStart) > MAX_LEVEL)
            levelStart = MAX_LEVEL;

        if (typeof(levelStart) == "number")
            levelStart = levelStart.toString();

        if (levelEnd !== "" && levelStart !== "" && !isNaN(levelEnd) && parseInt(levelStart) > parseInt(levelEnd))
            levelEnd = levelStart;

        this.setState({levelStart: levelStart, levelEnd: levelEnd});
    }

    /**
     * Makes it so the user's ending level input is always valid.
     */
    fixLevelEnd()
    {
        var levelEnd = this.state.levelEnd.trim();
        var levelStart = this.state.levelStart;

        if (levelEnd !== "" && isNaN(levelEnd))
            levelEnd = "";
        else if (parseInt(levelEnd) < 1)
            levelEnd = 1;
        else if (parseInt(levelEnd) > MAX_LEVEL)
            levelEnd = MAX_LEVEL;

        if (typeof(levelEnd) == "number")
            levelEnd = levelEnd.toString();
    
        if (levelStart !== "" && levelEnd !== "" && !isNaN(levelStart) && parseInt(levelEnd) < parseInt(levelStart))
            levelStart = levelEnd;

        this.setState({levelEnd: levelEnd, levelStart: levelStart});
    }

    /**
     * Adds a checkmark for a specific gender selection.
     * @param {Object} e - The checkbox event.
     * @param {Number} genderId - The number in the gender selection to check off.
     */
    checkOffGender(e, genderId)
    {
        var isChecked = e.target.checked;
        var genders = this.state.genders;

        genders[genderId] = isChecked;
        this.setState({genders: genders});
    }

    /**
     * Adds a checkmark for a specific shiny selection.
     * @param {Object} e - The checkbox event.
     * @param {Number} shinyId - The number in the shiny selection to check off.
     */
    checkOffShinyChoice(e, shinyId)
    {
        var isChecked = e.target.checked;
        var shinyChoice = [false, false];

        if (shinyId >= 0)
            shinyChoice[shinyId] = isChecked; //Max one choice at a time
        this.setState({shiny: shinyChoice});
    }

    /**
     * Adds a checkmark for a specific Pokerus selection.
     * @param {Object} e - The checkbox event.
     * @param {Number} pokerusId - The number in the Pokerus selection to check off.
     */
    checkOffPokerusChoice(e, pokerusId)
    {
        var isChecked = e.target.checked;
        var pokerusChoice = [false, false];

        if (pokerusId >= 0)
            pokerusChoice[pokerusId] = isChecked; //Max one choice at a time
        this.setState({pokerus: pokerusChoice});
    }

    /**
     * Adds a checkmark for a specific data loss warning selection.
     * @param {Object} e - The checkbox event.
     * @param {Number} warningId - The number in the data loss warning selection to check off.
     */
    checkOffWarningChoice(e, warningId)
    {
        var isChecked = e.target.checked;
        var warningChoice = [false, false];

        if (warningId >= 0)
            warningChoice[warningId] = isChecked; //Max one choice at a time
        this.setState({warning: warningChoice});
    }

    /**
     * Closes a search menu without searching.
     */
    cancelSearch()
    {
        this.state.parent.setState({searching: false});
    }

    /**
     * Starts searching for Pokemon matching the user's criteria.
     * @param {Object} e - The form submission event.
     */
    updateSearchCriteria(e)
    {
        e.preventDefault(); //Prevent page reload

        var criteria = {};
        var searchCriteria = this.state.mainPage.state.searchCriteria;
        const reduceFunc = (a, key) => ({ ...a, [key]: true}); //Converts list into object - turns all search checks into O(1)

        if (this.state.speciesIds.length > 0)
            criteria["species"] = this.state.speciesIds.map((species) => GetSpeciesName(species)).reduce(reduceFunc, {});

        if (this.state.moveIds.length > 0)
            criteria["move"] = this.state.moveIds.reduce(reduceFunc, {});

        if (this.state.abilityIds.length > 0)
            criteria["ability"] = this.state.abilityIds.reduce(reduceFunc, {});

        if (this.state.itemIds.length > 0)
            criteria["item"] = this.state.itemIds.reduce(reduceFunc, {});

        if (this.state.natureIds.length > 0)
            criteria["nature"] = this.state.natureIds.reduce(reduceFunc, {});

        if (this.state.ballTypeIds.length > 0)
            criteria["ballType"] = this.state.ballTypeIds.reduce(reduceFunc, {});

        if (this.state.typeIds.length > 0)
            criteria["type"] = this.state.typeIds.reduce(reduceFunc, {});

        if (this.state.levelStart !== "" && !isNaN(this.state.levelStart) && parseInt(this.state.levelStart) > 1)
            criteria["levelStart"] = parseInt(this.state.levelStart);

        if (this.state.levelEnd !== "" && !isNaN(this.state.levelEnd) && parseInt(this.state.levelEnd) < MAX_LEVEL)
            criteria["levelEnd"] = parseInt(this.state.levelEnd);

        if (this.state.genders.some((x) => x) //At least one gender option selected
        && !this.state.genders.every((x) => x)) //And not all selected
        {
            criteria["gender"] = [];

            if (this.state.genders[0])
                criteria["gender"].push("M");

            if (this.state.genders[1])
                criteria["gender"].push("F");

            if (this.state.genders[2])
                criteria["gender"].push("U");
            
            criteria["gender"] = criteria["gender"].reduce(reduceFunc, {});
        }

        if (this.state.shiny.some((x) => x)) //At least one shiny option selected
        {
            if (this.state.shiny[0])
                criteria["shiny"] = true; //Only Shinies
            else
                criteria["shiny"] = false; //No Shinies
        }

        if (this.state.pokerus.some((x) => x)) //At least one Pokerus option selected
        {
            if (this.state.pokerus[0])
                criteria["pokerus"] = true; //Only Pokerus
            else
                criteria["pokerus"] = false; //No Pokerus
        }

        if (this.state.warning.some((x) => x)) //At least one data loss warning option selected
        {
            if (this.state.warning[0])
                criteria["warning"] = true; //Only with data loss warnings
            else
                criteria["warning"] = false; //No data loss warnings
        }

        if (Object.keys(criteria).length === 0) //Nothing specified
            criteria = null;

        searchCriteria[this.state.boxSlot] = criteria;
        this.state.mainPage.setState({searchCriteria: searchCriteria});
        this.state.parent.setState({searching: false});
    }

    /**
     * Prints the search menu.
     */
    render()
    {
        var titleBar =
            <div className="box-title-no-edit">
                <ImCancelCircle size={34} className="box-change-arrow" onClick={this.cancelSearch.bind(this)}/>
                <span className="box-name">
                    <h2 className="search-title-text">Search</h2>
                </span>
                <ImCancelCircle size={34} className="box-change-arrow" style={{visibility: "hidden"}}/>
            </div>;

        if (!this.state.loaded)
        {
            return (
                <div className="search-view">
                    {titleBar}

                    <Form
                        className={"search-form search-loading " + (this.isHomeBox() ? "home-box" : "save-box")}
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <Form.Label>Loading...</Form.Label>
                    </Form>
                </div>
            );
        }

        return(
            <div className="search-view">
                {titleBar}

                <Form
                        className={"search-form " + (this.isHomeBox() ? "home-box" : "save-box save-box-search")}
                        onSubmit={(e) => this.updateSearchCriteria(e)}
                >
                    {/* Species Input */}
                    <Form.Group controlId="formSpecies">
                        <Form.Label>Species</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.speciesNameList}
                            onChange={(e, data) => this.setState({speciesIds: data.value})}
                        />
                    </Form.Group>

                    {/* Ability Input */}
                    <Form.Group controlId="formAbility">
                        <Form.Label>Ability</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.abilityNameList}
                            onChange={(e, data) => this.setState({abilityIds: data.value})}
                        />
                    </Form.Group>

                    {/* Moves Input */}
                    <Form.Group controlId="formMoves">
                        <Form.Label>Moves</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.moveNameList}
                            onChange={(e, data) => this.setState({moveIds: data.value})}
                        />
                    </Form.Group>

                    {/* Item Input */}
                    {<Form.Group controlId="formItem">
                        <Form.Label>Item</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.itemNameList}
                            onChange={(e, data) => this.setState({itemIds: data.value})}
                        />
                        </Form.Group>}

                    {/* Nature Input */}
                    <Form.Group controlId="formNature">
                        <Form.Label>Nature</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.natureNameList}
                            onChange={(e, data) => this.setState({natureIds: data.value})}
                        />
                    </Form.Group>

                    {/* Caught Ball Input */}
                    <Form.Group controlId="formBall">
                        <Form.Label>Caught Ball</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.ballTypeNameList}
                            onChange={(e, data) => this.setState({ballTypeIds: data.value})}
                        />
                    </Form.Group>

                    {/* Type Input */}
                    <Form.Group controlId="formBall">
                        <Form.Label>Type</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.typeNameList}
                            onChange={(e, data) => this.setState({typeIds: data.value})}
                        />
                    </Form.Group>

                    {/* Level Range Input */}
                    <Form.Group controlId="formLevelStart">
                        <Form.Label>At Least Level</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="-"
                            value={this.state.levelStart}
                            onChange={(e) => this.setState({levelStart: e.target.value})}
                            onBlur={this.fixLevelStart.bind(this)}
                        />
                    </Form.Group>

                    <Form.Group controlId="formLevelEnd">
                        <Form.Label>At Most Level</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="-"
                            value={this.state.levelEnd}
                            onChange={(e) => this.setState({levelEnd: e.target.value})}
                            onBlur={this.fixLevelEnd.bind(this)}
                        />
                    </Form.Group>

                    {/* Gender Input */}
                    <Form.Group>
                        <Form.Label>Gender</Form.Label>
                        <br/>
                        {
                            ["Male", "Female", "Unknown"].map
                            (
                                (gender, id) =>
                                    <Form.Check
                                        inline
                                        type="checkbox"
                                        label={gender}
                                        size="lg"
                                        id={`gender-${gender}-radio-${this.state.boxSlot}`}
                                        onChange={e => this.checkOffGender(e, id)}
                                        checked={this.state.genders[id]}
                                        key={id}
                                    />
                            )
                        }
                    </Form.Group>

                    {/* Shiny Input */}
                    <Form.Group>
                        <Form.Label>Shiny</Form.Label>
                        <br/>
                        <Form.Check
                            inline
                            type="radio"
                            label="Either"
                            size="lg"
                            id={`shiny-either-radio-${this.state.boxSlot}`}
                            onChange={e => this.checkOffShinyChoice(e, -1)}
                            checked={!this.state.shiny[0] && !this.state.shiny[1]}
                        />
                        {
                            ["Only", "Exclude"].map
                            (
                                (name, id) =>
                                    <Form.Check
                                        inline
                                        type="radio"
                                        label={name}
                                        size="lg"
                                        id={`shiny-${name}-radio-${this.state.boxSlot}`}
                                        onChange={e => this.checkOffShinyChoice(e, id)}
                                        checked={this.state.shiny[id]}
                                        key={"shiny-" + id}
                                    />
                            )
                        }
                    </Form.Group>

                    {/* Pokerus Input */}
                    <Form.Group>
                        <Form.Label>Pokérus</Form.Label>
                        <br/>
                        <Form.Check
                            inline
                            type="radio"
                            label="Either"
                            size="lg"
                            id={`pokerus-either-radio-${this.state.boxSlot}`}
                            onChange={e => this.checkOffPokerusChoice(e, -1)}
                            checked={!this.state.pokerus[0] && !this.state.pokerus[1]}
                        />
                        {
                            ["Only", "Exclude"].map
                            (
                                (name, id) =>
                                    <Form.Check
                                        inline
                                        type="radio"
                                        label={name}
                                        size="lg"
                                        id={`pokerus-${name}-radio-${this.state.boxSlot}`}
                                        onChange={e => this.checkOffPokerusChoice(e, id)}
                                        checked={this.state.pokerus[id]}
                                        key={"pokerus-" + id}
                                    />
                            )
                        }
                    </Form.Group>

                    {/* Warning Input */}
                    {
                        this.isSaveBox() ?
                            <Form.Group>
                                <Form.Label>Will Lose Data When Saved</Form.Label>
                                <br/>
                                <Form.Check
                                    inline
                                    type="radio"
                                    label="Either"
                                    size="lg"
                                    id={`warning-either-radio-${this.state.boxSlot}`}
                                    onChange={e => this.checkOffWarningChoice(e, -1)}
                                    checked={!this.state.warning[0] && !this.state.warning[1]}
                                />
                                {
                                    ["Only", "Exclude"].map
                                    (
                                        (name, id) =>
                                            <Form.Check
                                                inline
                                                type="radio"
                                                label={name}
                                                size="lg"
                                                id={`warning-${name}-radio-${this.state.boxSlot}`}
                                                onChange={e => this.checkOffWarningChoice(e, id)}
                                                checked={this.state.warning[id]}
                                                key={"warning-" + id}
                                            />
                                    )
                                }
                            </Form.Group>
                        :
                            ""
                    }

                    {/* Search Button */}
                    <div className = "search-form-buttons">
                        <Button className="search-button" type="submit">
                            Search
                        </Button>
                    </div>
                </Form>
            </div>
        )
    }
}

/**
 * Checks if a Pokemon matches a given search criteria.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {Object} searchCriteria - The search criteria to check against.
 * @returns True if the Pokemon matches the given search criteria. False otherwise.
 */
export function MatchesSearchCriteria(pokemon, searchCriteria, gameId)
{
    if (searchCriteria == null || Object.keys(searchCriteria).length === 0)
        return false; //No search criteria

    var isEgg = IsEgg(pokemon);

    //Check Wanted Species
    if ("species" in searchCriteria)
    {
        let name = isEgg ? "Egg" : GetSpeciesName(GetSpecies(pokemon));
        if (!(name in searchCriteria["species"]))
            return false;
    }

    if (isEgg)
        return false; //From here down nothing is applicable to an Egg

    //Check Has Move
    if ("move" in searchCriteria)
    {
        let i;
        let moves = GetMoves(pokemon);

        for (i = 0; i < moves.length; ++i)
        {
            if (moves[i] in searchCriteria["move"])
                break; //Has at least one requested move
        }

        if (i >= moves.length)
            return false; //Didn't have needed move
    }

    //Check Has Ability
    if ("ability" in searchCriteria)
    {
        if (!(GetAbility(pokemon, gameId) in searchCriteria["ability"]))
            return false;
    }

    //Check Holds Item
    if ("item" in searchCriteria)
    {
        if (!(GetItem(pokemon) in searchCriteria["item"]))
            return false;
    }

    //Check Has Nature
    if ("nature" in searchCriteria)
    {
        if (!(GetNature(pokemon) in searchCriteria["nature"])
        && !(GetVisibleNature(pokemon) in searchCriteria["nature"])) //Eg. Nature Mint
            return false;
    }

    //Check Caught In Ball
    if ("ballType" in searchCriteria)
    {
        if (!(GetCaughtBall(pokemon) in searchCriteria["ballType"]))
            return false;
    }

    //Check Is Of Type
    if ("type" in searchCriteria)
    {
        let baseStats = GetBaseStats(pokemon, gameId);
        if (baseStats == null)
            return false;

        if (!(baseStats["type1"] in searchCriteria["type"])
         && !(baseStats["type2"] in searchCriteria["type"]))
            return false;
    }

    //Check correct level range
    if ("levelStart" in searchCriteria)
    {
        if (GetLevel(pokemon, gameId) < searchCriteria["levelStart"])
            return false;
    }

    if ("levelEnd" in searchCriteria)
    {
        if (GetLevel(pokemon, gameId) > searchCriteria["levelEnd"])
            return false;
    }

    //Check Matches Gender
    if ("gender" in searchCriteria)
    {
        if (!(GetGender(pokemon) in searchCriteria["gender"]))
            return false;

    }

    //Check Matches Shiny
    if ("shiny" in searchCriteria)
    {
        if (IsShiny(pokemon) !== searchCriteria["shiny"])
            return false;
    }

    //Check Matches Pokerus
    if ("pokerus" in searchCriteria)
    {
        if (HasPokerus(pokemon) !== searchCriteria["pokerus"])
            return false;
    }

    //Check Has Data Loss Warning
    if ("warning" in searchCriteria) //No need to check for save box since the choice can only be selected there
    {
        if (MonWillLoseDataInSave(pokemon, gameId) !== searchCriteria["warning"])
            return false;
    }

    return true;
}
