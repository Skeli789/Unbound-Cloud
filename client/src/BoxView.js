/*
    A class for viewing a box of 30 Pokemon.
*/

import React, {Component} from 'react';
import {isMobile} from "react-device-detect";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import {BOX_HOME, BOX_SAVE} from './MainPage';
import {PokemonSummary} from "./PokemonSummary";
import {GetIconSpeciesName, GetIconSpeciesLink, GetIconSpeciesLinkBySpecies, IsBlankMon} from "./PokemonUtil";
import {Search, MatchesSearchCriteria} from "./Search";
import {ShowdownExport} from "./ShowdownExport";
import {CreateSingleBlankSelectedPos} from "./Util";
import LivingDexOrder from "./data/LivingDexOrder.json"

import {AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSave, AiOutlineTool} from "react-icons/ai";
import {BiSearchAlt2} from "react-icons/bi";
import {CgPokemon, CgExport} from "react-icons/cg";
import {GiCancel} from "react-icons/gi"
import {GrEdit, GrMultiple, GrTrash} from "react-icons/gr";

import "./stylesheets/BoxView.css";

export const HIGHEST_SAVE_BOX_NUM = 25 - 1; //Starts at 0
export const HIGHEST_HOME_BOX_NUM = 100 - 1; //Starts at 0
export const MONS_PER_ROW = 6;
export const MONS_PER_BOX = 30;

const LIVING_DEX_NONE = 0;
const LIVING_DEX_NO_FORMS = 1;
const LIVING_DEX_ALL = 2;

const PopUp = withReactContent(Swal);


export class BoxView extends Component
{
    constructor(props)
    {
        super(props);

        this.state = //Set test data
        {
            editingTitle: false,
            titleInput: "",
            viewingMonKey: 0,
            livingDexState: LIVING_DEX_NONE,
            fixingLivingDex: false,
            searching: false,
            viewingShowdown: false,

            allPokemon: props.pokemonJSON,
            titles: props.titles,
            boxType: props.boxType,
            parent: props.parent,
        };
    }

    isSaveBox()
    {
        return this.state.boxType === BOX_SAVE;
    }

    isHomeBox()
    {
        return this.state.boxType === BOX_HOME;
    }

    getCurrentBox()
    {
        return this.getParentState().currentBox[this.state.boxType];
    }

    shouldFilterSearchResults()
    {
        return this.getParentState().searchCriteria[this.state.boxType] !== null;
    }

    getParentState()
    {
        return this.state.parent.state;
    }

    isMonSelected(boxPos)
    {
        return this.getParentState().selectedMonBox[this.state.boxType] === this.getCurrentBox()
            && this.getParentState().selectedMonPos[this.state.boxType][boxPos];
    }

    areAnyPokemonSelectedInCurrentBox()
    {
        var startIndex = this.getCurrentBox() * MONS_PER_BOX;
        var selectedMonPos = this.getParentState().selectedMonPos;
        var selectedMonBox = this.getParentState().selectedMonBox;

        if (selectedMonBox[this.state.boxType] === this.getCurrentBox())
        {
            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                if (!IsBlankMon(this.state.allPokemon[i + startIndex]) //Ignore blank slots
                && selectedMonPos[this.state.boxType][i])
                    return true; //At least one mon selected
            }
        }

        return false;
    }

    canSelectMonAtPos(boxPos)
    {
        var saveSelectionActive = this.getParentState().selectedMonPos[BOX_SAVE].some((x) => x); //At least one mon selected
        var homeSelectionActive = this.getParentState().selectedMonPos[BOX_HOME].some((x) => x); //At least one mon selected
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = (speciesNameSelected === "none" || speciesNameSelected === "unknown");

        if (selectedNullSpecies
        && ((this.state.boxType === BOX_HOME && !saveSelectionActive)
         || (this.state.boxType === BOX_SAVE && !homeSelectionActive)))
            return false; //Clicking on a blank spot doesn't nothing if no other Pokemon has been selected yet

        if (!homeSelectionActive && !saveSelectionActive && selectedNullSpecies) //A home mon hasn't been selected yet
            return false; //Can't select a blank spot

        //The blank spot can be chosen to deselect the currently selected mon or move the other selected mon to
        return true;
    }

    doesClickingSpotDeselectChoice(boxPos)
    {
        var saveSelectionActive = this.getParentState().selectedMonPos[BOX_SAVE].some((x) => x); //At least one mon selected
        var homeSelectionActive = this.getParentState().selectedMonPos[BOX_HOME].some((x) => x); //At least one mon selected
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = (speciesNameSelected === "none" || speciesNameSelected === "unknown");
    
        if (selectedNullSpecies && !homeSelectionActive && !saveSelectionActive)
            return true; //Clicking a blank spot deselects the current choice in the same box

        if (this.isMonSelected(boxPos)
        && this.getParentState().draggingMon !== boxPos + this.getCurrentBox() * MONS_PER_BOX) //Isn't currently being dragged
            return true; //Clicking the same mon twice deselects it

        return false; //Keep selected
    }

    doingMultiSwap()
    {
        var currBoxType = this.state.boxType;

        if (this.getParentState().selectedMonPos[currBoxType].filter(x => x).length >= 2
        || this.getParentState().selectedMonPos[currBoxType ^ 1].filter(x => x).length >= 2) //At least two mons selected in one box
            return true;

        return false;
    }

    isViewingMonSummary()
    {
        return this.getViewingMon() != null;
    }

    getViewingMon()
    {
        return this.getParentState().viewingMon[this.state.boxType];
    }

    getMonInCurrentBoxAt(boxPos)
    {
        var offset = this.getCurrentBox() * MONS_PER_BOX + boxPos;
        return this.state.allPokemon[offset];
    }

    getSpeciesNameInCurrentBoxAt(boxPos)
    {
        return GetIconSpeciesName(this.getMonInCurrentBoxAt(boxPos));
    }

    matchesSearchCriteria(pokemon)
    {
        if (!this.shouldFilterSearchResults())
            return true; //Not searching

        var searchCriteria = this.getParentState().searchCriteria[this.state.boxType];

        return MatchesSearchCriteria(pokemon, searchCriteria);
    }

    setCurrentBox(boxNum)
    {
        var currentBoxes = this.getParentState().currentBox;
        var selectedMonPos = this.getParentState().selectedMonPos;
        var viewingMon = this.getParentState().viewingMon;
        currentBoxes[this.state.boxType] = boxNum;
        selectedMonPos[this.state.boxType] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxType] = null; //Wipe

        this.setState({editingTitle: false, viewingShowdown: false});
        this.state.parent.setState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            viewingMon: viewingMon,
        });
    }

    handleChangeBox(change)
    {
        var boxNum = this.getCurrentBox() + change;

        if (boxNum < 0) //Underflow
        {
            if (this.isSaveBox())
                boxNum = HIGHEST_SAVE_BOX_NUM;
            else
                boxNum = HIGHEST_HOME_BOX_NUM;
        }
        else if (this.isSaveBox() && boxNum > HIGHEST_SAVE_BOX_NUM)
            boxNum = 0; //Wrap around
        else if (this.isHomeBox() && boxNum > HIGHEST_HOME_BOX_NUM)
            boxNum = 0; //Wrap around

        this.setCurrentBox(boxNum);
    }

    handleSelection(boxPos, pokemon)
    {
        var swapMons = false;
        var multiSwap = false;
        var boxType = this.state.boxType;
        var newSelectedMonBoxes = this.getParentState().selectedMonBox;
        var newSelectedMonPos = this.getParentState().selectedMonPos;
        var newViewingMon = this.getParentState().viewingMon;
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = (speciesNameSelected === "none" || speciesNameSelected === "unknown");

        //Check if can select the current spot
        if (this.canSelectMonAtPos(boxPos))
        {
            if (this.doesClickingSpotDeselectChoice(boxPos))
                newSelectedMonPos[boxType] = CreateSingleBlankSelectedPos(); //Deselect all
            else
                newSelectedMonPos[boxType][boxPos] = true;

            newSelectedMonBoxes[boxType] = this.getCurrentBox();
        }

        //Update the selection variables
        if (this.getParentState().selectedMonPos[boxType ^ 1].some((x) => x)) //Both selections are now active
            swapMons = true;

        //Try remove viewing mons
        if (swapMons)
            newViewingMon = [null, null]; //No more viewing mons after the swap completes
        else if (selectedNullSpecies)
            newViewingMon[this.state.boxType] = null; //Deselected
        else
            newViewingMon[this.state.boxType] = pokemon;        

        //Check for multi swap
        if (swapMons && this.doingMultiSwap())
            multiSwap = true;

        this.state.parent.setState({
            viewingMon: newViewingMon,
            selectedMonBox: newSelectedMonBoxes,
            selectedMonPos: newSelectedMonPos,
        }, () =>
        {
            if (swapMons)
                this.state.parent.swapDifferentBoxedPokemon(multiSwap);
        });

        this.setState({
            viewingMonKey: this.getCurrentBox() * MONS_PER_BOX + boxPos,
            viewingShowdown: false,
        });
    }
    
    handleStartDragging(allBoxesPos, boxPos, icon, imgUrl, pokemon)
    {
        if (isMobile)
            return; //No dragging on a touch screen

        if (icon === "")
            return; //No dragging empty cell

        var viewingMon = this.getParentState().viewingMon;
        viewingMon[this.state.boxType] = pokemon;
    
        this.state.parent.setState({
            draggingMon: allBoxesPos,
            draggingImg: imgUrl,
            draggingFromBox: this.state.boxType,
            viewingMon: viewingMon,
        });

        this.setState({viewingMonKey: boxPos, viewingShowdown: false});
    }

    handleSetDraggingOver(allBoxesPos)
    {
        if (!isMobile)
        {
            this.state.parent.setState({
                draggingOver: allBoxesPos,
                draggingToBox: this.state.boxType
            });
        }
    }

    handleSelectMonForViewing(e, boxPos, pokemon)
    {
        e.preventDefault(); //Prevent context menu from popping up

        var speciesName = GetIconSpeciesName(pokemon);
        if (speciesName !== "none" && speciesName !== "unknown") //Don't change when clicking on a blank spot
        {
            var newViewingMon = this.getParentState().viewingMon;
            newViewingMon[this.state.boxType] = pokemon;
            this.state.parent.setState({viewingMon: newViewingMon});
            this.setState({viewingMonKey: boxPos, viewingShowdown: false});
        }
    }

    handleSelectAll()
    {
        var allSelected = false;
        var startIndex = this.getCurrentBox() * MONS_PER_BOX;
        var selectedMonPos = this.getParentState().selectedMonPos;
        var selectedMonBox = this.getParentState().selectedMonBox;

        //Check if all are selected
        if (selectedMonBox[this.state.boxType] === this.getCurrentBox())
        {
            let i;
    
            for (i = 0; i < MONS_PER_BOX; ++i)
            {
                if (!IsBlankMon(this.state.allPokemon[i + startIndex]) //Ignore blank slots
                && !selectedMonPos[this.state.boxType][i])
                    break; //At least one mon not selected
            }

            if (i >= MONS_PER_BOX)
                allSelected = true;
        }

        if (allSelected)
            selectedMonPos[this.state.boxType] = CreateSingleBlankSelectedPos();
        else //At least one mon not selected
        {
            //Select all mons in box
            selectedMonPos[this.state.boxType] = CreateSingleBlankSelectedPos();

            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                if (!IsBlankMon(this.state.allPokemon[i + startIndex]) //Don't select blank slots
                && this.matchesSearchCriteria(this.state.allPokemon[i + startIndex]))
                    selectedMonPos[this.state.boxType][i] = true;
            }
        }

        selectedMonBox[this.state.boxType] = this.getCurrentBox();
        this.setState({selectedMonPos: selectedMonPos, selectedMonBox: selectedMonBox});
    }

    viewBoxList()
    {
        this.state.parent.setState({viewingBoxList: this.state.boxType});
    }

    startSearching()
    {
        if (this.shouldFilterSearchResults())
        {
            var searchCriteria = this.getParentState().searchCriteria;
            searchCriteria[this.state.boxType] = null; //Wipe and end search
            this.state.parent.setState({searchCriteria: searchCriteria});
            return;
        }

        var selectedMonPos = this.getParentState().selectedMonPos;
        var viewingMon = this.getParentState().viewingMon;
        selectedMonPos[this.state.boxType] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxType] = null; //Wipe

        this.state.parent.setState({
            viewingMon: viewingMon,
            selectedMonPos: selectedMonPos,
            multiMoveError: [false, false],
        });

        this.setState({searching: true, viewingShowdown: false});
    }

    startEditingTitle()
    {
        this.setState({
            editingTitle: true,
            titleInput: this.state.titles[this.getCurrentBox()],
        });
    }

    cancelEditingTitle()
    {
        this.setState({editingTitle: false})
    }

    renameTitle()
    {
        var titles = this.state.titles;
        var changeWasMade = this.getParentState().changeWasMade;

        if (this.state.titleInput !== titles[this.getCurrentBox()]) //Title changed
        {
            titles[this.getCurrentBox()] = this.state.titleInput;
            changeWasMade[this.state.boxType] = true;
        }

        this.setState({
            editingTitle: false,
            titles: titles,
        })

        this.state.parent.setState({
            changeWasMade: changeWasMade,
        })
    }

    updateTitleNameInput(input)
    {
        if (input.length <= 16) //Max 16 characters in the title
            this.setState({titleInput: input});
    }

    changeLivingDexView()
    {
        var livingDexState = this.state.livingDexState;
        var selectedMonPos = this.getParentState().selectedMonPos;
        var viewingMon = this.getParentState().viewingMon;
    
        //Adjust Current state
        if (livingDexState< LIVING_DEX_ALL)
            ++livingDexState;
        else
            livingDexState = LIVING_DEX_NONE; //Wrap around
        
        this.setState({livingDexState: livingDexState, viewingShowdown: false});

        //Adjust Parent State
        selectedMonPos[this.state.boxType] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxType] = null; //Wipe
        this.state.parent.setState({selectedMonPos: selectedMonPos, viewingMon: viewingMon});
    }

    async fixLivingDex()
    {
        PopUp.fire(
        {
            title: 'This will rearrange all of the Pokemon in your boxes! Are you sure you want to do this?',
            confirmButtonText: `Do It`,
            cancelButtonText: `Cancel`,
            showCancelButton: true,
            icon: 'warning',
        }).then(async (result) =>
        {
            if (result.isConfirmed)
            {
                let speciesList = (this.state.livingDexState === LIVING_DEX_ALL) ? LivingDexOrder["allSpecies"] : LivingDexOrder["noAltForms"];

                this.setState({fixingLivingDex: true});

                await this.state.parent.fixLivingDex(speciesList).then(newBoxes =>
                {
                    var changeWasMade = this.getParentState().changeWasMade;
                    changeWasMade[this.state.boxType] = true;

                    this.setState({
                        allPokemon: newBoxes,
                        fixingLivingDex: false,
                    });

                    this.state.parent.setState({
                        changeWasMade: changeWasMade,
                    });
                });
            }
        })
    }

    releaseSelectedPokemon()
    {
        PopUp.fire(
        {
            title: 'Release selected Pokémon?',
            showConfirmButton: false,
            showCancelButton: true,
            showDenyButton: true,
            cancelButtonText: `Keep`,
            denyButtonText: `Release`,
            icon: 'warning',
        }).then((result) =>
        {
            if (result.isDenied) //Denied means released because it's the red button
            {
                this.state.parent.releaseSelectedPokemon(this.state.boxType);
                PopUp.fire('Bye-bye, Pokémon!', '', 'success')
            }
        })
    }

    viewShowdownExport()
    {
        var shouldView = true;
        var viewingMon = this.getParentState().viewingMon;

        if (this.state.viewingShowdown) //End viewing
        {
            shouldView = false;

            if (viewingMon[this.state.boxType] === null 
            || Object.keys(viewingMon[this.state.boxType]).length === 0) //Wasn't viewing any mon before
                viewingMon[this.state.boxType] = null;  //Don't show the summary after the showdown box closes
        }
        else //Start viewing
        {
            if (viewingMon[this.state.boxType] === null)
                viewingMon[this.state.boxType] = {}; //Not actually viewing but allow the showdown data to appear
        }

        this.setState({viewingShowdown: shouldView});
        this.state.parent.setState({viewingMon: viewingMon});
    }

    getLivingDexSpeciesIcon(i, monInSlotLink)
    {
        let speciesList = (this.state.livingDexState === LIVING_DEX_ALL) ? LivingDexOrder["allSpecies"] : LivingDexOrder["noAltForms"];

        if (i >= speciesList.length)
            return ""; //All done

        let species = speciesList[i];
        let link = GetIconSpeciesLinkBySpecies(species);
        let alt = species.split("SPECIES_")[1];
        let icon = <img src={link} alt={alt} className="box-icon-image living-dex-icon"
                        onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging

        if (link === monInSlotLink)
            return ""; //Display full colour image instead

        return icon;
    }

    getPokemonIconsToShow()
    {
        var icons = [];
        var startIndex = this.getCurrentBox() * MONS_PER_BOX;
        var addLivingDexIcon = (this.isHomeBox() && this.state.livingDexState !== LIVING_DEX_NONE);

        //Add regular icons
        for (let i = startIndex, key = 0; i < startIndex + MONS_PER_BOX; ++i, ++key)
        {
            let icon;
            let pokemon = this.state.allPokemon[i];
            let species = GetIconSpeciesName(pokemon);
            let link = GetIconSpeciesLink(pokemon);
            let livingDexIcon = "";

            if (species === "none")
                icon = "";
            else
            {
                var className = "box-icon-image";
                var alt = pokemon["species"];
                if (alt.startsWith("SPECIES_"))
                    alt = alt.split("SPECIES_")[1];

                if (!this.matchesSearchCriteria(pokemon))
                    className += " box-icon-faded";

                icon = <img src={link} alt={alt} className={className}
                            onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging
            }

            if (addLivingDexIcon)
            {
                livingDexIcon = this.getLivingDexSpeciesIcon(i, link);
                if (livingDexIcon !== "")
                    icon = livingDexIcon;
            }

            let spanClassName = "box-icon" + (this.isMonSelected(key) ? " selected-box-icon" : "");

            if (addLivingDexIcon && livingDexIcon !== "") //Can't click on this
            {
                icons.push(<span className={spanClassName}
                    onMouseEnter = {this.handleSetDraggingOver.bind(this, i)}
                    onMouseLeave = {this.handleSetDraggingOver.bind(this, -1)}
                    key={key}>{icon}</span>);
            }
            else
            {
                icons.push(<span className={spanClassName}
                                onClick={this.handleSelection.bind(this, key, pokemon)}
                                onMouseDown={this.handleStartDragging.bind(this, i, key, icon, link, pokemon)}
                                onMouseEnter = {this.handleSetDraggingOver.bind(this, i)}
                                onMouseLeave = {this.handleSetDraggingOver.bind(this, -1)}
                                onContextMenu={(e) => this.handleSelectMonForViewing(e, key, pokemon)}
                                key={key}>{icon}
                            </span>);
            }
        }

        return icons;
    }

    printMonToView()
    {
        var pokemon = this.getViewingMon();

        if (pokemon != null)
        {
            if (this.state.viewingShowdown)
            {
                var pokemonList = [];

                for (let i = 0; i < MONS_PER_BOX; ++i)
                {
                    if (this.getParentState().selectedMonPos[this.state.boxType][i]) //Selected
                        pokemonList.push(this.getMonInCurrentBoxAt(i));
                }

                return(<ShowdownExport pokemonList={pokemonList} key={this.state.viewingMonKey}/>);
            }
            else
                return(<PokemonSummary pokemon={pokemon} key={this.state.viewingMonKey}/>);
        }
        else
            return "";
    }

    printSearchView()
    {
        return <Search boxType={this.state.boxType} parent={this} mainPage={this.state.parent}/>;
    }

    /*
        Prints the box view page.
    */
    render()
    {
        var title, titleEditIcon, titleContainerClass;
        var icons = this.getPokemonIconsToShow();
        var monToView = !this.isViewingMonSummary() ? "" : this.printMonToView();
        var editIconSize = 28;
        var livingDexIcon = "";

        if (this.state.searching)
            return this.printSearchView();

        if (this.isHomeBox() && !this.state.editingTitle)
            livingDexIcon = <CgPokemon size={editIconSize  + 10} onClick={this.changeLivingDexView.bind(this)}
                                       className="box-name-living-dex-icon" style={{color: this.state.livingDexState === LIVING_DEX_NO_FORMS ? "violet"
                                                                                         : this.state.livingDexState === LIVING_DEX_ALL ? "lightseagreen"
                                                                                         : "black"}} />;

        if (this.state.titles != null)
        {
            
            title = this.state.titles[this.getCurrentBox()];
            titleEditIcon = this.state.editingTitle ? ""
                          : this.isHomeBox() ? <GrEdit size={editIconSize} onClick={this.startEditingTitle.bind(this)} className="box-name-edit-icon" />
                          : "";
            
            if (this.state.editingTitle)
            {
                title =
                    <div>
                        <GiCancel size={editIconSize  + 10} onClick={this.cancelEditingTitle.bind(this)} className="box-name-cancel-icon" />
                        <input type="text" className="box-name-text box-name-input"
                                            onChange={(event) => this.updateTitleNameInput(event.target.value)}
                                            onKeyDown={(event) => event.keyCode === 13 ? this.renameTitle() : {}}
                                            value={this.state.titleInput}/>
                        <AiOutlineSave size={editIconSize + 10} onClick={this.renameTitle.bind(this)} className="box-name-save-icon" />
                    </div>

                titleEditIcon = "";
                titleContainerClass = "box-title-edit";
            }
            else
            {
                title = <h2 className={"box-name-text"} onClick={this.viewBoxList.bind(this)}>{title}</h2>
                titleContainerClass = "box-title-no-edit";
            }
        }
        else
        {
            title = <h2 className="box-name-text">{"Box " + (this.getCurrentBox() + 1)}</h2>
            titleEditIcon = "";
            titleContainerClass = "box-title-no-edit";
        }

        return (
            <div className="box-view">
                <div className={titleContainerClass}>
                    <AiOutlineArrowLeft size={42} onClick={this.handleChangeBox.bind(this, -1)} className="box-change-arrow" />
                    <span className="box-name">
                        {livingDexIcon}
                        {title}
                        {titleEditIcon}
                    </span>
                    <AiOutlineArrowRight size={42} onClick={this.handleChangeBox.bind(this, 1)} className="box-change-arrow" />
                </div>
                <div className={"box " + (this.isHomeBox() ? "home-box" : "save-box")}>
                    {icons}
                </div>
                <div className="box-lower-icons">
                    <BiSearchAlt2 size={34} className={"box-lower-icon" + (this.shouldFilterSearchResults() ? " green-icon" : "")}
                              onClick={this.startSearching.bind(this)}/>
                    <GrMultiple size={28} className="box-lower-icon" onClick={this.handleSelectAll.bind(this)}/>
                    {
                        //Save Icon
                        this.getParentState().changeWasMade[this.state.boxType] ?
                            <AiOutlineSave size={36} className="box-lower-icon" onClick={() => this.state.parent.saveAndExit()}/>
                        :
                            ""
                    }
                    {
                        //Fix Living Dex Icon
                        this.state.livingDexState !== LIVING_DEX_NONE && !this.state.fixingLivingDex && this.isHomeBox() ?
                            <AiOutlineTool size={36} className="box-lower-icon" onClick={this.fixLivingDex.bind(this)}/>
                        :
                            ""
                    }
                    {
                        //Release & Showdown Icons
                        this.areAnyPokemonSelectedInCurrentBox() ?
                            <>
                                <GrTrash size={28} className="box-lower-icon" onClick={this.releaseSelectedPokemon.bind(this)}/>
                                <CgExport size={30} className="box-lower-icon" onClick = {this.viewShowdownExport.bind(this)}/>
                            </>
                        :
                            ""
                    }
                </div>
                {
                    this.state.fixingLivingDex
                    ?
                        <p>Please Wait...</p>
                    : this.getParentState().multiMoveError[this.state.boxType]
                    ?
                        <p className="no-multi-move-space-error">Not enough space for the move.</p>
                    :
                        monToView
                }
            </div>
        )
    }
}
