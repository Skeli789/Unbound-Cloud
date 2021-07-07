
import React, {Component} from 'react';
import {isMobile} from "react-device-detect";

import {MONS_PER_BOX} from "./BoxView";
import {BOX_HOME/*, BOX_SAVE*/} from './MainPage';
import {GetIconSpeciesName} from "./PokemonUtil";
import {MatchesSearchCriteria} from "./Search";
import {CreateSingleBlankSelectedPos} from "./Util";

import "./stylesheets/BoxList.css";

const PokeBallIconInterior = <g clipPath="url(#cPath)"><g><circle cx="0" cy="0" r="90" transform="matrix(1,0,0,-1,0,0)" /*fill="rgba(0,0,0,1)"*/ fillOpacity="1"></circle><circle cx="0" cy="0" r="27" transform="matrix(1,0,0,-1,0,0)" fill="none" strokeWidth="18" stroke="rgba(255,255,255,1)" strokeOpacity="1"></circle></g><g><defs><mask id="c1"><g><rect x="-96" y="-64" width="192" height="128" transform="matrix(1,0,0,-1,0,0)" fill="rgba(0,0,0,1)" fillOpacity="1"></rect><g><circle cx="0" cy="0" r="90" transform="matrix(1,0,0,-1,0,0)" fill="rgba(255,255,255,1)" fillOpacity="1"></circle><circle cx="0" cy="0" r="27" transform="matrix(1,0,0,-1,0,0)" fill="rgba(255,255,255,1)" fillOpacity="1" strokeWidth="18" stroke="rgba(255,255,255,1)" strokeOpacity="1"></circle></g></g></mask></defs><g mask="url(#c1)"><g><rect x="-31.5" y="-9" width="63" height="18" transform="matrix(1,0,0,-1,63,0)" fill="rgba(255,255,255,1)" fillOpacity="1"></rect><rect x="-31.5" y="-9" width="63" height="18" transform="matrix(1,0,0,-1,-63,0)" fill="rgba(255,255,255,1)" fillOpacity="1"></rect></g></g></g></g>;

export class BoxList extends Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            boxType: props.boxType,
            boxSlot: props.boxSlot,
            boxes: props.boxes,
            titles: props.titles,
            boxCount: props.boxCount,
            currentBoxes: props.currentBoxes,
            selectedMonPos: props.selectedMonPos,
            viewingMon: props.viewingMon,
            setParentState: props.updateParentState,
            searchCriteria: props.searchCriteria,
            isSameBoxBothSides: props.isSameBoxBothSides,
        };
    }

    jumpToBox(boxId)
    {
        var currentBoxes = this.state.currentBoxes;
        var selectedMonPos = this.state.selectedMonPos;
        var viewingMon = this.state.viewingMon;

        currentBoxes[this.state.boxSlot] = boxId;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxSlot] = null; //Wipe
    
        this.setState({
            currentBoxes: currentBoxes,
        });

        this.state.setParentState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            viewingMon: viewingMon,
            viewingBoxList: -1, //No more viewing box list
            errorMessage: ["", ""],
            impossibleMovement: null,
        });
    }

    createBoxView(boxId)
    {
        var title;
        var icons = [];
        var startIndex = boxId * MONS_PER_BOX;
        var disabledBox = false;

        for (let i = startIndex, key = 0; i < startIndex + MONS_PER_BOX; ++i, ++key)
        {
            let icon;
            let pokemon = this.state.boxes[i];
            let species = GetIconSpeciesName(pokemon);
            let colour = "rgba(0, 0, 0, 0.8)";

            if (species === "none")
                icon = <div className="mini-box-cell" key={key}></div>;
            else
            {
                if (MatchesSearchCriteria(pokemon, this.state.searchCriteria))
                    colour = "#f33d21"; //Red

                icon =
                    <div className="mini-box-cell" key={key}>
                        <svg width="100%" height="100%" style={{fill: colour, position: "absolute", top: "0px", left: "0px"}} viewBox="-96 -64 192 128" id="render">
                            {PokeBallIconInterior}
                        </svg>
                    </div>
            }

            icons.push(icon);
        }

        title = <h4 className={"mini-box-title" + (this.state.currentBoxes[this.state.boxSlot] === boxId ? " mini-box-current-box-title" : "")}>
                    {this.state.titles[boxId]}
                </h4>

        if (this.state.isSameBoxBothSides && this.state.currentBoxes[this.state.boxSlot ^ 1] === boxId) //Other box has this
            disabledBox = true; //Prevent jumping to this box since the other box is already showing it

        return(
            <div className="mini-box-with-title" key={boxId}>
                <div className={"mini-box " + (disabledBox ? "disabled-box" : this.state.boxType === BOX_HOME ? "home-box" : "save-box")}
                     onClick={disabledBox ? null : this.jumpToBox.bind(this, boxId)}>
                    {icons}
                </div>
                {title}
            </div>
        )
    }

    printBoxes()
    {
        var boxes = [];

        for (let i = 0; i < this.state.boxCount; ++i)
            boxes.push(this.createBoxView(i));

        return boxes;
    }

    render()
    {
        return(
            <div className={"mini-boxes" + (!isMobile ? " scroll-container" : "")}>
                {this.printBoxes()}
            </div>
        )
    }
}
