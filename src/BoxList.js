/**
 * A page displaying a list of boxes.
 */

import React, {Component} from 'react';
import {isMobile} from "react-device-detect";

import {MONS_PER_BOX} from "./BoxView";
import {GetIconSpeciesName} from "./PokemonUtil";
import {MatchesSearchCriteria} from "./Search";
import {CreateSingleBlankSelectedPos, GetBoxStartIndex, IsHomeBox, IsNullSpeciesName} from "./Util";

import "./stylesheets/BoxList.css";

const PokeBallIconInterior = <g clipPath="url(#cPath)"><g><circle cx="0" cy="0" r="90" transform="matrix(1,0,0,-1,0,0)" /*fill="rgba(0,0,0,1)"*/ fillOpacity="1"></circle><circle cx="0" cy="0" r="27" transform="matrix(1,0,0,-1,0,0)" fill="none" strokeWidth="18" stroke="rgba(255,255,255,1)" strokeOpacity="1"></circle></g><g><defs><mask id="c1"><g><rect x="-96" y="-64" width="192" height="128" transform="matrix(1,0,0,-1,0,0)" fill="rgba(0,0,0,1)" fillOpacity="1"></rect><g><circle cx="0" cy="0" r="90" transform="matrix(1,0,0,-1,0,0)" fill="rgba(255,255,255,1)" fillOpacity="1"></circle><circle cx="0" cy="0" r="27" transform="matrix(1,0,0,-1,0,0)" fill="rgba(255,255,255,1)" fillOpacity="1" strokeWidth="18" stroke="rgba(255,255,255,1)" strokeOpacity="1"></circle></g></g></mask></defs><g mask="url(#c1)"><g><rect x="-31.5" y="-9" width="63" height="18" transform="matrix(1,0,0,-1,63,0)" fill="rgba(255,255,255,1)" fillOpacity="1"></rect><rect x="-31.5" y="-9" width="63" height="18" transform="matrix(1,0,0,-1,-63,0)" fill="rgba(255,255,255,1)" fillOpacity="1"></rect></g></g></g></g>;


export class BoxList extends Component
{
    /**
     * Sets up the box listing page.
    */
    constructor(props)
    {
        super(props);

        this.state =
        {
            boxType: props.boxType,
            boxSlot: props.boxSlot, //Left or right
            boxes: props.boxes,
            titles: props.titles,
            boxCount: props.boxCount,
            currentBoxes: props.currentBoxes,
            selectedMonPos: props.selectedMonPos,
            summaryMon: props.summaryMon,
            setParentState: props.updateParentState,
            searchCriteria: props.searchCriteria,
            isSameBoxBothSides: props.isSameBoxBothSides,
            globalState: props.globalState,
            gameId: props.gameId,
            loaded: false,
        };
    }

    /**
     * Starts changing the screen from "Loading..." when the loading screen is displayed.
     * Also overrides the back button to return to the main page.
     */
    async componentDidMount()
    {
        await new Promise(r => setTimeout(r, 10)); //Allows the loading screen to render
        this.setState({loaded: true});

        //Override back button
        window.history.pushState(null, document.title, window.location.href)
        window.addEventListener("popstate", this.state.globalState.navBackButtonPressed.bind(this.state.globalState));
    }

    /**
     * Jumps to a specific box. If modified, also modify "setCurrentBox" in BoxView.js.
     * @param {Number} boxId - The id number of the box to jump to.
     */
    jumpToBox(boxId)
    {
        var currentBoxes = this.state.currentBoxes;
        var selectedMonPos = this.state.selectedMonPos;
        var summaryMon = this.state.summaryMon;

        currentBoxes[this.state.boxSlot] = boxId;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        summaryMon[this.state.boxSlot] = null; //Wipe
    
        this.setState({currentBoxes: currentBoxes});

        this.state.setParentState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            summaryMon: summaryMon,
            errorMessage: ["", ""],
            impossibleMovement: null,
            viewingBoxList: -1, //No more viewing box list
        });

        window.scrollTo(0, 0); //Undoes scroll offset on mobile devices caused by scrolling through box list
    }

    /**
     * Creates the mini-image of a specific box.
     * @param {Number} boxId - The id number of the box to make the image of.
     * @returns {MiniBox} A mini box element.
     */
    createBoxView(boxId)
    {
        var title;
        var icons = [];
        var startIndex = GetBoxStartIndex(boxId);
        var disabledBox = false;

        //Make little Poke Ball icons
        for (let i = startIndex, key = 0; i < startIndex + MONS_PER_BOX; ++i, ++key)
        {
            let icon;
            let pokemon = this.state.boxes[i];
            let species = GetIconSpeciesName(pokemon);
            let colour = "rgba(0, 0, 0, 0.8)";

            if (species == "none") //Still show "unknown" because they take up slots
                icon = <div className="mini-box-cell" key={key}></div>;
            else
            {
                if (MatchesSearchCriteria(pokemon, this.state.searchCriteria, this.state.gameId))
                    colour = "#f33d21"; //Highlight icon red

                icon =
                    <div className="mini-box-cell" key={key}>
                        <svg width="100%" height="100%" style={{fill: colour, position: "absolute", top: "0px", left: "0px"}} viewBox="-96 -64 192 128" id="render">
                            {PokeBallIconInterior}
                        </svg>
                    </div>
            }

            icons.push(icon);
        }

        //Make the box's title
        title =
            <h4 className={"mini-box-title" + (this.state.currentBoxes[this.state.boxSlot] === boxId ? " mini-box-current-box-title" : "")}>
                {this.state.titles[boxId]}
            </h4>

        //Try disable jumping to a box already active (in a Home -> Home or Box -> Box view)
        if (this.state.isSameBoxBothSides && this.state.currentBoxes[this.state.boxSlot ^ 1] === boxId) //Other box has this
            disabledBox = true; //Prevent jumping to this box since the other box is already showing it

        //Create the entire box
        return(
            <div className="mini-box-with-title" key={boxId}>
                <div className={"mini-box " + (disabledBox ? "disabled-box" : IsHomeBox(this.state.boxType) ? "home-box" : "save-box")}
                     onClick={disabledBox ? null : this.jumpToBox.bind(this, boxId)}>
                    {icons}
                </div>
                {title}
            </div>
        )
    }

    /**
     * Renders all of the boxes in the list.
     * @returns {Array <MiniBox>} The mini boxes to be displayed.
     */
    printBoxes()
    {
        var boxes = [];

        for (let i = 0; i < this.state.boxCount; ++i)
            boxes.push(this.createBoxView(i));

        return boxes;
    }

    /**
     * Renders the box list page.
     */
    render()
    {
        if (!this.state.loaded)
        {
            return (
                <div className={"box-list-loading-screen box-list-loading-screen-position" + (isMobile ? "-mobile" : "")}>
                    Loading...
                </div>
            );
        }
        else
        {
            return(
                <div className={"mini-boxes scroll-container-box-list" + (isMobile ? "-mobile" : "")}>
                    {this.printBoxes()}
                </div>
            )
        }
    }
}
