/*
    A class for viewing a box of 30 Pokemon.
*/

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {isMobile} from "react-device-detect";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

import {BOX_HOME, BOX_SAVE} from './MainPage';
import {PokemonSummary} from "./PokemonSummary";
import {GetIconSpeciesName, GetIconSpeciesLink, GetIconSpeciesLinkBySpecies, IsBlankMon, GetSpeciesName, IsMonShiny, IsMonEgg} from "./PokemonUtil";
import {Search, MatchesSearchCriteria} from "./Search";
import {ShowdownExport} from "./ShowdownExport";
import {BASE_GFX_LINK, CreateSingleBlankSelectedPos} from "./Util";
import LivingDexOrder from "./data/LivingDexOrder.json"

import {AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineCheckCircle, AiOutlineSave, AiOutlineTool} from "react-icons/ai";
import {BiSearchAlt2} from "react-icons/bi";
import {CgPokemon, CgExport} from "react-icons/cg";
import {ImCancelCircle} from "react-icons/im"
import {GrEdit, GrMultiple, GrTrash} from "react-icons/gr";

import "./stylesheets/BoxView.css";

export const HIGHEST_SAVE_BOX_NUM = 25;
export const HIGHEST_HOME_BOX_NUM = 100;
export const MONS_PER_BOX = 30;
export const MONS_PER_ROW = 6;
export const MONS_PER_COL = MONS_PER_BOX / MONS_PER_ROW;

const LIVING_DEX_NONE = 0;
const LIVING_DEX_NO_FORMS = 1;
const LIVING_DEX_ALL = 2;

const PopUp = withReactContent(Swal);

const renameTooltip = props => (<Tooltip {...props}>Rename</Tooltip>);
const saveTooltip = props => (<Tooltip {...props}>Save</Tooltip>);
const cancelTooltip = props => (<Tooltip {...props}>Cancel</Tooltip>);
const livingDexTooltip = props => (<Tooltip {...props}>Living Dex</Tooltip>);
const searchTooltip = props => (<Tooltip {...props}>Search</Tooltip>);
const selectAllTooltip = props => (<Tooltip {...props}>Select All</Tooltip>);
const showdownTooltip = props => (<Tooltip {...props}>Showdown</Tooltip>);
const releaseTooltip = props => (<Tooltip {...props}>Release</Tooltip>);
const fixLivingDexTooltip = props => (<Tooltip {...props}>Fix Living Dex</Tooltip>);


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
            boxSlot: props.boxSlot,
            isSameBoxBothSides: props.isSameBoxBothSides,
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

    isSameBoxBothSides()
    {
        return this.state.isSameBoxBothSides;
    }

    getCurrentBox()
    {
        return this.getParentState().currentBox[this.state.boxSlot];
    }

    shouldFilterSearchResults()
    {
        return this.getParentState().searchCriteria[this.state.boxSlot] !== null;
    }

    isSaving()
    {
        return this.getParentState().savingMessage !== "";
    }

    getParentState()
    {
        return this.state.parent.state;
    }

    isMonSelected(boxPos)
    {
        return this.getParentState().selectedMonBox[this.state.boxSlot] === this.getCurrentBox()
            && this.getParentState().selectedMonPos[this.state.boxSlot][boxPos];
    }

    shouldShowIconImpossibleMovewarning(boxPos)
    {
        if (this.getParentState().impossibleMovement !== null)
        {
            var impossibleMovement = this.getParentState().impossibleMovement[this.state.boxSlot];
            var row = Math.floor(boxPos / MONS_PER_ROW);
            var col = boxPos % MONS_PER_ROW;

            return impossibleMovement[row][col];
        }

        return false;
    }

    areAnyPokemonSelectedInCurrentBox()
    {
        var startIndex = this.getCurrentBox() * MONS_PER_BOX;
        var selectedMonPos = this.getParentState().selectedMonPos;
        var selectedMonBox = this.getParentState().selectedMonBox;

        if (selectedMonBox[this.state.boxSlot] === this.getCurrentBox())
        {
            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                if (!IsBlankMon(this.state.allPokemon[i + startIndex]) //Ignore blank slots
                && selectedMonPos[this.state.boxSlot][i])
                    return true; //At least one mon selected
            }
        }

        return false;
    }

    canSelectMonAtPos(boxPos)
    {
        var currSelectionActive = this.areAnyPokemonSelectedInCurrentBox();
        var otherSelectionActive = this.getParentState().selectedMonPos[this.state.boxSlot ^ 1].some((x) => x); //At least one mon selected in the other box
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = (speciesNameSelected === "none" || speciesNameSelected === "unknown");

        if (selectedNullSpecies && !currSelectionActive && !otherSelectionActive)
            return false; //Clicking on a blank spot doesn't nothing if no other Pokemon has been selected yet

        //The blank spot can be chosen to deselect the currently selected mon or move the other selected mon to
        return true;
    }

    doesClickingSpotDeselectChoice(boxPos)
    {
        var otherSelectionActive = this.getParentState().selectedMonPos[this.state.boxSlot ^ 1].some((x) => x); //At least one mon selected in the other box
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = (speciesNameSelected === "none" || speciesNameSelected === "unknown");

        if (selectedNullSpecies && !otherSelectionActive)
            return true; //Clicking a blank spot deselects the current choice in the same box. Otherwise it'll move the Pokemon

        if (this.isMonSelected(boxPos)
        && this.getParentState().draggingMon !== boxPos + this.getCurrentBox() * MONS_PER_BOX) //Isn't currently being dragged
            return true; //Clicking the same mon twice deselects it

        return false; //Keep selected
    }

    doingMultiSwap()
    {
        var currBoxSlot = this.state.boxSlot;

        if (this.getParentState().selectedMonPos[currBoxSlot].filter(x => x).length >= 2
        || this.getParentState().selectedMonPos[currBoxSlot ^ 1].filter(x => x).length >= 2) //At least two mons selected in one box
            return true;

        return false;
    }

    isViewingMonSummary()
    {
        return this.getViewingMon() != null;
    }

    getViewingMon()
    {
        return this.getParentState().viewingMon[this.state.boxSlot];
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

        var searchCriteria = this.getParentState().searchCriteria[this.state.boxSlot];

        return MatchesSearchCriteria(pokemon, searchCriteria);
    }

    canViewShowdownExportButton()
    {
        if (this.state.viewingShowdown)
            return true; //Can always close the view

        for (let i = 0; i < MONS_PER_BOX; ++i)
        {
            if (this.getParentState().selectedMonPos[this.state.boxSlot][i]) //Selected
            {
                let pokemon = this.getMonInCurrentBoxAt(i);
                if (!IsMonEgg(pokemon))
                    return true; //At least one viewable Pokemon
            }
        }

        return false;
    }

    setCurrentBox(boxNum)
    {
        var currentBoxes = this.getParentState().currentBox;
        var selectedMonPos = this.getParentState().selectedMonPos;
        var viewingMon = this.getParentState().viewingMon;
        currentBoxes[this.state.boxSlot] = boxNum;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxSlot] = null; //Wipe

        this.setState({editingTitle: false, viewingShowdown: false});
        this.state.parent.setState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            viewingMon: viewingMon,
        });
    }

    handleChangeBox(change)
    {
        var boxNum = this.getCurrentBox();

        while (true)
        {
            boxNum += change;

            if (boxNum < 0) //Underflow
            {
                //Wrap around
                if (this.isSaveBox())
                    boxNum = HIGHEST_SAVE_BOX_NUM - 1;
                else
                    boxNum = HIGHEST_HOME_BOX_NUM - 1;
            }
            else if (this.isSaveBox() && boxNum >= HIGHEST_SAVE_BOX_NUM)
                boxNum = 0; //Wrap around
            else if (this.isHomeBox() && boxNum >= HIGHEST_HOME_BOX_NUM)
                boxNum = 0; //Wrap around

            if (this.isSameBoxBothSides() && this.getParentState().currentBox[this.state.boxSlot ^ 1] === boxNum) //Same box on both sides
                continue; //Force another increase so both boxes don't display the same mons

            break;
        }

        this.setCurrentBox(boxNum);
        this.state.parent.wipeErrorMessage();
    }

    handleSelection(boxPos, pokemon)
    {
        if (this.isSaving())
            return; //Don't allow selections while saving

        var swapMons = false;
        var multiSwap = false;
        var boxSlot = this.state.boxSlot;
        var newSelectedMonBoxes = this.getParentState().selectedMonBox;
        var newSelectedMonPos = this.getParentState().selectedMonPos;
        var newViewingMon = this.getParentState().viewingMon;
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = (speciesNameSelected === "none" || speciesNameSelected === "unknown");

        //Check if can select the current spot
        if (this.canSelectMonAtPos(boxPos))
        {
            if (this.doesClickingSpotDeselectChoice(boxPos))
            {
                newSelectedMonPos[boxSlot] = CreateSingleBlankSelectedPos(); //Deselect all
                this.state.parent.wipeErrorMessage();
            }
            else
                newSelectedMonPos[boxSlot][boxPos] = true;

            newSelectedMonBoxes[boxSlot] = this.getCurrentBox();
        }

        //Update the selection variables
        if (this.getParentState().selectedMonPos[boxSlot ^ 1].some((x) => x)) //Both selections are now active
            swapMons = true;

        //Try remove viewing mons
        if (swapMons)
            newViewingMon = [null, null]; //No more viewing mons after the swap completes
        else if (selectedNullSpecies)
            newViewingMon[boxSlot] = null; //Deselected
        else
            newViewingMon[boxSlot] = pokemon;        

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
                this.state.parent.swapDifferentBoxSlotPokemon(multiSwap);
        });

        this.setState({
            viewingMonKey: this.getCurrentBox() * MONS_PER_BOX + boxPos,
            viewingShowdown: false,
        });
    }
    
    handleStartDragging(allBoxesPos, boxPos, icon, imgUrl, pokemon)
    {
        if (isMobile || this.isSaving())
            return; //No dragging on a touch screen or while prepping a save

        if (icon === "")
            return; //No dragging empty cell

        var viewingMon = this.getParentState().viewingMon;
        viewingMon[this.state.boxSlot] = pokemon;
    
        this.state.parent.setState({
            draggingMon: allBoxesPos,
            draggingImg: imgUrl,
            draggingFromBox: this.state.boxSlot,
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
                draggingToBox: this.state.boxSlot
            });
        }
    }

    handleSelectMonForViewing(e, boxPos, pokemon)
    {
        e.preventDefault(); //Prevent context menu from popping up

        if (this.isSaving())
            return; //Don't allow selections while saving

        var speciesName = GetIconSpeciesName(pokemon);
        if (speciesName !== "none" && speciesName !== "unknown") //Don't change when clicking on a blank spot
        {
            var newViewingMon = this.getParentState().viewingMon;
            newViewingMon[this.state.boxSlot] = pokemon;
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
        if (selectedMonBox[this.state.boxSlot] === this.getCurrentBox())
        {
            let i;
    
            for (i = 0; i < MONS_PER_BOX; ++i)
            {
                if (!IsBlankMon(this.state.allPokemon[i + startIndex]) //Ignore blank slots
                && !selectedMonPos[this.state.boxSlot][i])
                    break; //At least one mon not selected
            }

            if (i >= MONS_PER_BOX)
                allSelected = true;
        }

        if (allSelected)
            selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos();
        else //At least one mon not selected
        {
            //Select all mons in box
            selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos();

            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                if (!IsBlankMon(this.state.allPokemon[i + startIndex]) //Don't select blank slots
                && this.matchesSearchCriteria(this.state.allPokemon[i + startIndex]))
                    selectedMonPos[this.state.boxSlot][i] = true;
            }
        }

        selectedMonBox[this.state.boxSlot] = this.getCurrentBox();
        this.setState({selectedMonPos: selectedMonPos, selectedMonBox: selectedMonBox});
    }

    viewBoxList()
    {
        this.state.parent.setState({viewingBoxList: this.state.boxSlot});
    }

    startSearching()
    {
        if (this.shouldFilterSearchResults())
        {
            var searchCriteria = this.getParentState().searchCriteria;
            searchCriteria[this.state.boxSlot] = null; //Wipe and end search
            this.state.parent.setState({searchCriteria: searchCriteria});
            return;
        }

        var selectedMonPos = this.getParentState().selectedMonPos;
        var viewingMon = this.getParentState().viewingMon;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxSlot] = null; //Wipe

        this.state.parent.setState({
            viewingMon: viewingMon,
            selectedMonPos: selectedMonPos,
        });

        this.state.parent.wipeErrorMessage();
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
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxSlot] = null; //Wipe
        this.state.parent.setState({selectedMonPos: selectedMonPos, viewingMon: viewingMon});
        this.state.parent.wipeErrorMessage();
    }

    async fixLivingDex()
    {
        var speciesList = (this.state.livingDexState === LIVING_DEX_ALL) ? LivingDexOrder["allSpecies"] : LivingDexOrder["noAltForms"];
        var boxCount = Math.ceil(speciesList.length / MONS_PER_BOX);

        PopUp.fire(
        {
            title: `This will rearrange the Pokemon in your first ${boxCount} boxes and may move Pokemon out of others! Are you sure you want to do this?`,
            confirmButtonText: `Do It`,
            cancelButtonText: `Cancel`,
            showCancelButton: true,
            icon: 'warning',
        }).then(async (result) =>
        {
            if (result.isConfirmed)
            {
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
                this.state.parent.releaseSelectedPokemon(this.state.boxSlot, this.state.boxType);
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

            if (viewingMon[this.state.boxSlot] === null 
            || Object.keys(viewingMon[this.state.boxSlot]).length === 0) //Wasn't viewing any mon before
                viewingMon[this.state.boxSlot] = null;  //Don't show the summary after the showdown box closes
        }
        else //Start viewing
        {
            if (viewingMon[this.state.boxSlot] === null)
                viewingMon[this.state.boxSlot] = {}; //Not actually viewing but allow the showdown data to appear
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
        let alt = GetSpeciesName(species);
        let icon = <img src={link} alt={alt} aria-label={alt} className="box-icon-image living-dex-icon"
                        onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging

        if (link === monInSlotLink.replace("shiny/", "regular/")) //Links are for same species
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
            let heldItemIcon = ""
            let shinyIcon = ""

            if (species === "none")
                icon = "";
            else
            {
                var matchesSearchCriteria = true;
                var className = "box-icon-image";
                var alt = pokemon["nickname"];

                if (!this.matchesSearchCriteria(pokemon))
                {
                    matchesSearchCriteria = false;
                    className += " box-icon-faded";
                }

                icon = <img src={link} alt={alt} aria-label={alt} className={className}
                            onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging
                
                if (pokemon["item"] !== "ITEM_NONE")
                {
                    heldItemIcon = <img src={BASE_GFX_LINK + "held_item.png"} alt="I" aria-label="Holds Item"
                                        className={"box-icon-item-icon" + (!matchesSearchCriteria ? " box-icon-faded" : "")}
                                        onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging
                }

                if (IsMonShiny(pokemon))
                {
                    shinyIcon = <span className={"box-icon-shiny-icon" + (!matchesSearchCriteria ? " box-icon-faded" : "")}
                                      aria-label="Shiny">★</span>
                }
            }

            if (addLivingDexIcon)
            {
                livingDexIcon = this.getLivingDexSpeciesIcon(i, link);
                if (livingDexIcon !== "")
                    icon = livingDexIcon;
            }

            let spanClassName = "box-icon"
                              + (!isMobile ? " box-icon-hoverable" : "")
                              + (this.isMonSelected(key) ? " selected-box-icon" : "")
                              + (this.shouldShowIconImpossibleMovewarning(key) ? " error-box-icon" : "");

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
                                key={key}>{shinyIcon} {icon} {heldItemIcon}
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
                    if (this.getParentState().selectedMonPos[this.state.boxSlot][i]) //Selected
                    {
                        pokemon = this.getMonInCurrentBoxAt(i);
                        if (!IsMonEgg(pokemon))
                            pokemonList.push(pokemon);
                    }
                }

                return(<ShowdownExport pokemonList={pokemonList} key={this.state.viewingMonKey}/>);
            }
            else
                return(<PokemonSummary pokemon={pokemon} areBoxViewsVertical={this.state.parent.areBoxViewsVertical()}
                                       key={this.state.viewingMonKey}/>);
        }
        else
            return "";
    }

    printSearchView()
    {
        return <Search boxType={this.state.boxType} boxSlot={this.state.boxSlot} parent={this} mainPage={this.state.parent}/>;
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
            livingDexIcon =
                <OverlayTrigger placement="top" overlay={livingDexTooltip}>
                    <CgPokemon size={editIconSize  + 10} onClick={this.changeLivingDexView.bind(this)}
                                    className="box-name-living-dex-icon" style={{color: this.state.livingDexState === LIVING_DEX_NO_FORMS ? "violet"
                                                                                    : this.state.livingDexState === LIVING_DEX_ALL ? "lightseagreen"
                                                                                    : "black"}} />
                </OverlayTrigger>;

        if (this.state.titles != null)
        {
            
            title = this.state.titles[this.getCurrentBox()];
            titleEditIcon = this.state.editingTitle ? ""
                          : this.isHomeBox() ?
                                <OverlayTrigger placement="top" overlay={renameTooltip}>
                                    <GrEdit size={editIconSize}
                                            onClick={this.startEditingTitle.bind(this)} className="box-name-edit-icon" />
                                </OverlayTrigger>
                          : "";

            if (this.state.editingTitle)
            {
                title =
                    <div>
                        <OverlayTrigger placement="top" overlay={cancelTooltip}>
                            <ImCancelCircle size={editIconSize  + 9}
                                  onClick={this.cancelEditingTitle.bind(this)} className="box-name-cancel-icon" />
                        </OverlayTrigger>
                        <input type="text" className="box-name-text box-name-input"
                                            onChange={(event) => this.updateTitleNameInput(event.target.value)}
                                            onKeyDown={(event) => event.keyCode === 13 ? this.renameTitle() : {}}
                                            value={this.state.titleInput}/>
                        <OverlayTrigger placement="top" overlay={saveTooltip}>
                            <AiOutlineCheckCircle size={editIconSize + 14}
                                        onClick={this.renameTitle.bind(this)} className="box-name-save-icon" />
                        </OverlayTrigger>
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

        var lowerIcons = 
            <div className="box-lower-icons">
                <OverlayTrigger placement="bottom" overlay={searchTooltip}>
                    <BiSearchAlt2 size={34} className={"box-lower-icon" + (this.shouldFilterSearchResults() ? " green-icon" : "")}
                            onClick={this.startSearching.bind(this)}/>
                </OverlayTrigger>
                <OverlayTrigger placement="bottom" overlay={selectAllTooltip}>
                    <GrMultiple size={28} className="box-lower-icon" onClick={this.handleSelectAll.bind(this)}/>
                </OverlayTrigger>
                {
                    //Save Icon
                    this.getParentState().changeWasMade[this.state.boxType] ?
                        <OverlayTrigger placement="bottom" overlay={saveTooltip}>
                            <AiOutlineSave size={36} className="box-lower-icon" onClick={() => this.state.parent.saveAndExit(this.state.boxSlot)}/>
                        </OverlayTrigger>
                    :
                        ""
                }
                {
                    //Fix Living Dex Icon
                    this.state.livingDexState !== LIVING_DEX_NONE && !this.state.fixingLivingDex && this.isHomeBox() ?
                        <OverlayTrigger placement="bottom" overlay={fixLivingDexTooltip}>
                            <AiOutlineTool size={36} className="box-lower-icon" onClick={this.fixLivingDex.bind(this)}/>
                        </OverlayTrigger>
                    :
                        ""
                }
                {
                    //Release & Showdown Icons
                    this.areAnyPokemonSelectedInCurrentBox() ?
                        <>
                            <OverlayTrigger placement="bottom" overlay={releaseTooltip}>
                                <GrTrash size={28} className="box-lower-icon" onClick={this.releaseSelectedPokemon.bind(this)}/>
                            </OverlayTrigger>
                            {
                                this.canViewShowdownExportButton() ?
                                    <OverlayTrigger placement="bottom" overlay={showdownTooltip}>
                                        <CgExport size={30} className="box-lower-icon"
                                                onClick = {this.viewShowdownExport.bind(this)}/>
                                    </OverlayTrigger>
                                :
                                    ""
                            }
                        </>
                    :
                        ""
                }
            </div>

        if (this.state.fixingLivingDex)
            lowerIcons = <p className="lower-icon-message box-lower-icons">Please Wait...</p>
        else if (this.isSaving())
            lowerIcons = <p className="lower-icon-message box-lower-icons">{this.getParentState().savingMessage}</p>

        return (
            <div className="box-view">
                <div className={titleContainerClass}>
                    <AiOutlineArrowLeft size={42} aria-label="Previous Box" onClick={this.handleChangeBox.bind(this, -1)} className="box-change-arrow" />
                    <span className="box-name">
                        {livingDexIcon}
                        {title}
                        {titleEditIcon}
                    </span>
                    <AiOutlineArrowRight size={42} aria-label="Next Box" onClick={this.handleChangeBox.bind(this, 1)} className="box-change-arrow" />
                </div>

                <div className={"box " + (this.isHomeBox() ? "home-box" : "save-box")}>
                    {icons}
                </div>

                {lowerIcons}

                {
                    this.getParentState().errorMessage[this.state.boxSlot] !== ""
                    ?
                        <p className="error-message">{this.getParentState().errorMessage[this.state.boxSlot]}</p>
                    :
                        monToView
                }
            </div>
        )
    }
}
