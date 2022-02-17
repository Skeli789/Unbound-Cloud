/**
 * A class for the main page.
 */

import axios from "axios";
import React, {Component} from 'react';
import {Button, ProgressBar} from "react-bootstrap";
import {isMobile} from "react-device-detect";

import {config} from "./config";
import {BoxList} from "./BoxList";
import {BoxView, HIGHEST_HOME_BOX_NUM, HIGHEST_SAVE_BOX_NUM, MONS_PER_BOX, MONS_PER_COL, MONS_PER_ROW} from "./BoxView";
import {GetSpecies, IsBlankMon, PokemonAreDuplicates} from "./PokemonUtil";
import {CreateSingleBlankSelectedPos, GetBoxNumFromBoxOffset, GetBoxPosBoxColumn, GetBoxPosBoxRow, GetLocalBoxPosFromBoxOffset, GetOffsetFromBoxNumAndPos, GetSpeciesName} from "./Util";
import SaveData from "./data/Test Output.json";

import {BiArrowBack} from "react-icons/bi";
import {FaArrowAltCircleRight, FaCloud, FaGamepad} from "react-icons/fa";

import "./stylesheets/MainPage.css";

export const BOX_HOME = 0;
export const BOX_SAVE = 1;

export const BOX_SLOT_LEFT = 0;
export const BOX_SLOT_RIGHT = 1;

const STATE_WELCOME = 0
const STATE_ASK_FIRST_TIME = 1;
const STATE_UPLOAD_HOME_FILE = 2;
const STATE_UPLOADING_HOME_FILE = 3;
const STATE_UPLOAD_SAVE_FILE = 4;
const STATE_UPLOADING_SAVE_FILE = 5;
const STATE_EDITING_HOME_BOXES = 6;
const STATE_EDITING_SAVE_FILE = 7;
const STATE_MOVING_POKEMON = 8;

const HOME_FILE_NAME = "cloud.dat";

const BLANK_PROGRESS_BAR = <ProgressBar className="upload-progress-bar" now={0} label={"0%"} />;

//TODO: Drag and drop file upload
//TODO: Unbound Base Stats
//TODO: More data fields like "Gigantamax" and "MapSec" (with like MAPSEC_BORRIUS_ROUTE_1) - use Met Game to advantage
//TODO: Make sure Wonder Trading can't be hijacked


export default class MainPage extends Component
{
    /**********************************
            Page Setup Functions       
    **********************************/

    /**
     * Sets up variables needed for application.
     */
    constructor(props)
    {
        super(props);

        this.state = //Set test data
        {
            editState: (localStorage.visitedBefore ? STATE_UPLOAD_HOME_FILE : STATE_WELCOME), //STATE_MOVING_POKEMON,

            //Uploading & Downloading Files
            uploadProgress: BLANK_PROGRESS_BAR,
            selectedSaveFile: null,
            selectedHomeFile: null,
            fileUploadError: false,
            serverConnectionError: false,
            saveFileData: {"data": []}, //Also used in downloading
            saveFileNumber: 0, //Also used in downloading
            fileDownloadUrl: null,

            //Box Side Data
            currentBox: [0, 0],
            selectedMonBox: [0, 0],
            selectedMonPos: this.generateBlankSelectedPos(),
            summaryMon: [null, null],
            searchCriteria: [null, null],
            changeWasMade: [false, false],
            errorMessage: ["", ""],
            impossibleMovement: null,
            viewingBoxList: -1,
            savingMessage: "",
            wonderTradeData: null,

            //Dragging
            draggingImg: "",
            draggingMon: -1,
            draggingOver: -1,
            draggingFromBox: 0,
            draggingToBox: 0,

            //Actual Stoage System
            saveBoxes: SaveData["boxes"],
            saveTitles: SaveData["titles"],
            homeBoxes: this.generateBlankHomeBoxes(),
            homeTitles: this.generateBlankHomeTitles(),
        };

        this.updateState = this.updateState.bind(this);
    }

    /**
     * Sets up event listeners for dragging Pokemon and trying to leave the page.
     */
    componentDidMount()
    {
        //localStorage.clear(); //For debugging
        window.addEventListener('beforeunload', this.tryPreventLeavingPage.bind(this));
        window.addEventListener('mouseup', this.handleReleaseDragging.bind(this));
    }

    /**
     * Removes event listeners for dragging Pokemon and trying to leave the page.
     */
    componentWillUnmount()
    {
        window.removeEventListener('beforeunload', this.tryPreventLeavingPage.bind(this));
        window.removeEventListener('mouseup', this.handleReleaseDragging.bind(this));
    }

    /**
     * Prevents the player from leaving the page if they have unsaved data.
     * @param {Object} e - The unload page event.
     */
    tryPreventLeavingPage(e)
    {
        if (this.state.changeWasMade.some((x) => x)) //Some boxes aren't saved
        {
            e.preventDefault();
            e.returnValue = true; //Display pop-up warning
        }
    }

    /**
     * A function passed to child components to allow them to easily modify the MainPage state.
     * @param {Object} stateChange - The changes to the state.
     */
    updateState(stateChange)
    {
        this.setState(stateChange);
    }

    /**
     * Removes the error messages displayed on the page (if any).
     */
    wipeErrorMessage()
    {
        return this.setState({
            errorMessage: ["", ""],
            impossibleMovement: null,
        });
    }

    /**
     * Generates a blank map used to hold which Pokemon the user has selected in both box slots.
     * @returns {Array <Array <Boolean>>} - Blank selected position maps for both box slots.
     */
    generateBlankSelectedPos()
    {
        return [CreateSingleBlankSelectedPos(), CreateSingleBlankSelectedPos()];
    }

    /**
     * Generates a blank map used to hold which Pokemon had an error being moved.
     * @returns {Array <Array <Boolean>>} - A blank selected position map (used like impossibleMovement[row][col]).
     */
    generateBlankImpossibleMovementArray()
    {
        return Array.apply(null, Array(MONS_PER_COL)).map(function () {return Array.apply(null, Array(MONS_PER_ROW)).map(function () {return false})});
    }

    /**
     * Creates a Pokemon object with no data in it.
     * @returns {Pokemon} - An empty Pokemon object.
     */
    generateBlankMonObject()
    {
        var blankObject = Object.assign({}, SaveData["boxes"][0]);

        for (let key of Object.keys(blankObject))
        {
            if (typeof(blankObject[key]) == "string")
                blankObject[key] = "";
            else if (typeof(blankObject[key]) == "number")
                blankObject[key] = 0;
            else
                blankObject[key] = null;
        }
        
        return blankObject;
    }

    /**
     * Creates the initial Home boxes.
     * @returns {Array <Pokemon>} - An empty list of the Home boxes.
     */
    generateBlankHomeBoxes()
    {
        var homeBoxes = [];
        var blankObject = this.generateBlankMonObject();

        for (let i = 1; i <= HIGHEST_HOME_BOX_NUM; ++i)
        {
            for (let j = 1; j <= MONS_PER_BOX; ++j)
                homeBoxes.push(Object.assign({}, blankObject))
        }

        return homeBoxes;
    }

    /**
     * Creates the initial Home box titles.
     * @returns {Array <String>} - The box names for the Home boxes.
     */
    generateBlankHomeTitles()
    {
        var titles = [];

        for (let i = 1; i <= HIGHEST_HOME_BOX_NUM; ++i)
            titles.push("Cloud " + i);

        return titles;
    }


    /**********************************
           Box Utility Functions       
    **********************************/

    /**
     * Gets whether or not the boxes should be displayed on top of each other or side by side.
     * @returns {Boolean} True if the boxes should be stacked, False if they should be side by side.
     */
    areBoxViewsVertical()
    {
        return window.innerWidth < 865; //px
    }

    /**
     * Gets the type of box in a specific box slot (BOX_SLOT_LEFT or BOX_SLOT_RIGHT).
     * @param {Number} boxSlot - The slot number to check.
     * @returns {Number} Either BOX_HOME or BOX_SAVE.
     */
    getBoxTypeByBoxSlot(boxSlot)
    {
        if (this.state.editState === STATE_EDITING_HOME_BOXES)
            return BOX_HOME;
        else if (this.state.editState === STATE_EDITING_SAVE_FILE)
            return BOX_SAVE;

        if (boxSlot === BOX_SLOT_LEFT)
            return BOX_HOME;
        else
            return BOX_SAVE;
    }

    /**
     * Gets the box names for the the boxes in a specific box slot (BOX_SLOT_LEFT or BOX_SLOT_RIGHT).
     * @param {Number} boxSlot - The slot number to check.
     * @returns {Array <String>} The box names for all of the boxes in the requested slot.
     */
    getTitlesByBoxSlot(boxSlot)
    {
        if (this.getBoxTypeByBoxSlot(boxSlot) === BOX_HOME)
            return this.state.homeTitles;
        else
            return this.state.saveTitles;
    }

    /**
     * Gets the list of a Pokemon in a specific type of box.
     * @param {Number} boxType - Either BOX_HOME or BOX_SAVE.
     * @returns {Array <Pokemon>} The Pokemon in the boxes of the requested slot.
     */
    getBoxesByBoxType(boxType)
    {
        if (boxType === BOX_HOME)
            return this.state.homeBoxes;
        else
            return this.state.saveBoxes;
    }

    /**
     * Gets the list of a Pokemon in one of the two box slots.
     * @param {Number} boxSlot - Either BOX_SLOT_LEFT or BOX_SLOT_RIGHT.
     * @returns {Array <Pokemon>} The Pokemon in the boxes of the requested slot.
     */
    getBoxesByBoxSlot(boxSlot)
    {
        return this.getBoxesByBoxType(this.getBoxTypeByBoxSlot(boxSlot));
    }

    /**
     * Gets the number of boxes in one of the two box slots.
     * @param {Number} boxSlot - Either BOX_SLOT_LEFT or BOX_SLOT_RIGHT.
     * @returns {Number} - The number of boxes in the requested slot.
     */
    getBoxAmountByBoxSlot(boxSlot)
    {
        if (this.getBoxTypeByBoxSlot(boxSlot) === BOX_HOME)
            return HIGHEST_HOME_BOX_NUM;
        else
            return HIGHEST_SAVE_BOX_NUM; //TODO: Variable based on game
    }

    /**
     * Checks if a given box number is within the range of total boxes for a specific box slot.
     * @param {Number} boxNum - The box num to check.
     * @param {Number} boxSlot - Either BOX_SLOT_LEFT or BOX_SLOT_RIGHT.
     * @returns {Boolean} True if the box number is valid, False otherwise.
     */
    isValidBoxNumByBoxSlot(boxNum, boxSlot)
    {
        return boxNum >= 0 && boxNum < this.getBoxAmountByBoxSlot(boxSlot);
    }

    /**
     * Checks if a given box position is within the range of a single box.
     * @param {Number} boxPos - The box position to check.
     * @returns {Boolean} True if the position is valid, False otherwise.
     */
    isValidBoxPos(boxPos)
    {
        return boxPos >= 0 && boxPos < MONS_PER_BOX;
    }

    /**
     * Gets a Pokemon in a specific box slot and at a specific position in the entire list of boxes.
     * @param {Number} boxSlot - Either BOX_SLOT_LEFT or BOX_SLOT_RIGHT.
     * @param {Number} boxPos - A position from 0 until getBoxAmountByBoxSlot(boxSlot) - 1
     * @returns {Pokemon} The Pokemon at the requested position.
     */
    getMonAtBoxPos(boxSlot, boxPos)
    {
        return this.getBoxesByBoxSlot(boxSlot)[boxPos];
    }

    /**
     * Checks if a Pokemon has a duplicate in a specific set of boxes already.
     * @param {Pokemon} pokemon - The Pokemon to check.
     * @param {Array <Pokemon>} boxes - The boxes to check for the Pokemon.
     * @param {Number} boxCount - The number of boxes in the set.
     * @param {Number} ignorePos - The position in the list of boxes to ignore (the original mon).
     * @returns {Object} The position of the duplicate if one is found {boxNum: X, offset: X}, or {boxNum: -1, offset: -1} if it's not.
     */
    monAlreadyExistsInBoxes(pokemon, boxes, boxCount, ignorePos)
    {
        if (IsBlankMon(pokemon))
            return -1; //Don't waste time

        for (let boxNum = 0; boxNum < boxCount; ++boxNum)
        {
            for (let boxPos = 0; boxPos < MONS_PER_BOX; ++boxPos)
            {
                var offset = GetOffsetFromBoxNumAndPos(boxNum, boxPos);

                if (offset === ignorePos) //This is the mon being moved
                    continue;

                if (IsBlankMon(boxes[offset]))
                    continue;

                if (PokemonAreDuplicates(pokemon, boxes[offset]))
                    return {boxNum: boxNum, offset: offset};
            }
        }

        return {boxNum: -1, offset: -1};
    }

    /**
     * Checks if a Pokemon at a certain position is being Wonder Traded.
     * @param {Number} boxType - Either BOX_HOME or BOX_SAVE.
     * @param {Number} boxOffset - The position in the list of boxes to check.
     * @returns True if the Pokemon is in a Wonder Trade, False if not.
     */
    isMonInWonderTrade(boxType, boxOffset)
    {
        var boxNum = GetBoxNumFromBoxOffset(boxOffset);
        var boxPos = GetLocalBoxPosFromBoxOffset(boxOffset);

        return this.state.wonderTradeData !== null
            && this.state.wonderTradeData.boxType === boxType
            && this.state.wonderTradeData.boxNum === boxNum
            && this.state.wonderTradeData.boxPos === boxPos;
    }


    /**********************************
          Upload Handler Functions     
    **********************************/

    /**
     * Checks if a file name is valid to be a save file.
     * @param {String} fileName - The file name to check.
     * @returns True if the file name is valid, False otherwise.
     */
    isValidSaveFileName(fileName)
    {
        return fileName.endsWith(".sav")
            || fileName.endsWith(".srm")
            || fileName.endsWith(".sa1");
    }

    /**
     * Checks if a file name is valid to be a Home data file.
     * @param {String} fileName - The file name to check.
     * @returns True if the file name is valid, False otherwise.
     */
    isValidHomeFileName(fileName)
    {
        return fileName.endsWith(".dat");
    }

    /**
     * Handles the user's choice of a save file.
     * @param {Object} e - The file upload event.
     */
    async chooseSaveFile(e)
    {
        var file = e.target.files[0];

        if (!this.isValidSaveFileName(file.name.toLowerCase()) || file.size !== 131072) //128 kb
            this.setState({fileUploadError: true, serverConnectionError: false});
        else
        {
            this.setState({selectedSaveFile: file, fileUploadError: false, serverConnectionError: false}, () =>
            {
                this.handleUpload(true); //Upload immediately
            });
        }
    }

    /**
     * Handles the user's choice of a Home data file.
     * @param {Object} e - The file upload event.
     */
    async chooseHomeFile(e)
    {
        var file = e.target.files[0];

        if (!this.isValidHomeFileName(file.name.toLowerCase()))
            this.setState({fileUploadError: true, serverConnectionError: false});
        else
        {
            this.setState({selectedHomeFile: file, fileUploadError: false, serverConnectionError: false}, () =>
            {
                this.handleUpload(false); //Upload immediately
            });
        }
    }

    /**
     * Adds the Home boxes to form data for sending to the server.
     * @param {*} homeData - The Home boxes to send to the server.
     * @param {*} formData - The object used to send them to the server.
     */
    addHomeDataToFormData(homeData, formData)
    {
        //The data is split into four parts to guarantee it'll all be sent
        for (let i = 0; i < 4; ++i)
        {
            if (i + 1 >= 4)
                formData.append(`homeDataP${i + 1}`, homeData.slice((homeData.length / 4) * i, homeData.length));
            else
                formData.append(`homeDataP${i + 1}`, homeData.slice((homeData.length / 4) * i, (homeData.length / 4) * (i + 1)));
        }
    }

    /**
     * Prints an error to the console and updates the state after a failed file upload.
     * @param {Object} error - The error object after the server request completed.
     * @param {Number} newState - The new editState.
     */
    handleUploadError(error, newState)
    {
        console.log("An error occurred uploading the file.");

        if (error.message === "Network Error")
        {
            console.log("Could not connect to the server.");

            this.setState({
                editState: newState,
                fileUploadError: false,
                serverConnectionError: true,
            });
        }
        else
        {
            console.log(error["response"]["data"]);

            this.setState({
                editState: newState,
                fileUploadError: true,
                serverConnectionError: false,
            });
        }
    }

    /**
     * Handles the user's choice to use the Home data file stored in the local storage.
     */
    async useLastSavedHomeFile()
    {
        const formData = new FormData(); //formData contains the Home boxes
        var homeData = localStorage.lastSavedHomeData;
        var route = `${config.dev_server}/uploadLastHomeData`;

        this.addHomeDataToFormData(homeData, formData);
        this.setState
        ({
            editState: STATE_UPLOADING_HOME_FILE,
            uploadProgress: BLANK_PROGRESS_BAR, //Update here in case the connection has been lost
            selectedHomeFile: {"name": "last saved home data"},
        });

        let res;
        try
        {
            res = await axios.post(route, formData,
            {
                onUploadProgress: (ProgressEvent) => this.updateUploadProgress(ProgressEvent, false)
            });
        }
        catch (error)
        {
            //Some error occurred
            var newState = STATE_UPLOAD_HOME_FILE;
            this.handleUploadError(error, newState);
            return;
        }

        //Accepted, no error occurred
        console.log("Last home file upload successful.");

        this.setState({
            editState: STATE_UPLOAD_SAVE_FILE,
            homeBoxes: res.data.boxes,
            homeTitles: res.data.titles,
            fileUploadError: false,
            serverConnectionError: false,
        });
    }

    /**
     * Handles the user's upload of a save file or Home data file.
     * @param {Boolean} isSaveFile - True if a save file is being upload, False if a Home data file is being uploaded.
     */
    async handleUpload(isSaveFile)
    {
        var file = isSaveFile ? this.state.selectedSaveFile : this.state.selectedHomeFile;
        var route = isSaveFile ? "uploadSaveFile" : "uploadHomeData";
        route = `${config.dev_server}/${route}`;
        const formData = new FormData(); //formData contains the file to be sent to the server

        formData.append("file", file);
        formData.append("isSaveFile", isSaveFile);
        this.setState({
            editState: isSaveFile ? STATE_UPLOADING_SAVE_FILE : STATE_UPLOADING_HOME_FILE,
            uploadProgress: BLANK_PROGRESS_BAR, //Update here in case the connection has been lost
        });

        let res;
        try
        {
            res = await axios.post(route, formData,
            {
                onUploadProgress: (ProgressEvent) => this.updateUploadProgress(ProgressEvent, isSaveFile)
            });
        }
        catch (error)
        {
            //Some error occurred
            var newState = (isSaveFile) ? STATE_UPLOAD_SAVE_FILE : STATE_UPLOAD_HOME_FILE;
            this.handleUploadError(error, newState);
            return;
        }

        //Accepted, no error occurred
        if (isSaveFile)
        {
            console.log("Save file upload successful.");

            this.setState({
                editState: STATE_MOVING_POKEMON,
                saveBoxes: res.data.boxes,
                saveTitles: res.data.titles,
                saveFileNumber: res.data.fileIdNumber,
                saveFileData: res.data.saveFileData,
                fileUploadError: false,
                serverConnectionError: false,
            });

            localStorage.visitedBefore = true; //Set cookie now
        }
        else //Home File
        {
            console.log("Home file upload successful.");

            this.setState({
                editState: STATE_UPLOAD_SAVE_FILE,
                homeBoxes: res.data.boxes,
                homeTitles: res.data.titles,
                fileUploadError: false,
                serverConnectionError: false,
            });
        }
    }

    /**
     * Updates the upload status during a file upload.
     * @param {Object} progressEvent - An object containing the current state of the upload.
     * @param {Boolean} isSaveFile - True if a save file is being upload, False if a Home data file is being uploaded.
     */
    updateUploadProgress(progressEvent, isSaveFile)
    {
        if (progressEvent.loaded <= 0 || progressEvent.total <= 0) //Faulty numbers
            return;

        let progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);

        if (progress >= 100)
        {
            var fileName;

            if (isSaveFile)
                fileName = this.state.selectedSaveFile.name;
            else
                fileName = this.state.selectedHomeFile.name;

            progress = `Processing ${fileName}`;
        }
        else
            progress = <ProgressBar className="upload-progress-bar" now={progress} label={`${progress}%`} />;

        this.setState({uploadProgress: progress});
    }


    /**********************************
           Move Pokemon Functions      
    **********************************/

    /**
     * Swaps Pokemon at two different box offsets.
     * @param {Array <Pokemon>} boxes1 - The set of boxes the first Pokemon is in.
     * @param {Array <Pokemon>} boxes2 - The set of boxes the second Pokemon is in.
     * @param {Number} boxesOffset1 - The offset in the first set of boxes the first Pokemon is at.
     * @param {Number} boxesOffset2 - The offset in the second set of boxes the second Pokemon is at.
     */
    swapBoxedPokemon(boxes1, boxes2, boxesOffset1, boxesOffset2)
    {
        var temp = boxes1[boxesOffset1];
        boxes1[boxesOffset1] = boxes2[boxesOffset2];
        boxes2[boxesOffset2] = temp;
    }

    /**
     * Sets the error message for a duplicate Pokemon being moved.
     * @param {*} fromBoxSlot - The box slot of the box the Pokemon is being moved from.
     * @param {*} fromOffset - The offset in the "from" set of boxes the Pokemon was being moved from.
     * @param {*} toBoxSlot - The box slot of the box the Pokemon is being moved to.
     * @param {*} duplicateData - The offset in the "to" set of boxes the Pokemon was being moved to.
     */
    setDuplicatePokemonSwappingError(fromBoxSlot, fromOffset, toBoxSlot, duplicateData)
    {
        var errorMessage = ["", ""];
        var impossibleTo =   this.generateBlankImpossibleMovementArray();
        var impossibleFrom = this.generateBlankImpossibleMovementArray();
        var impossibleMovement = [null, null];
        var fromPos = GetLocalBoxPosFromBoxOffset(fromOffset);
        var toPos = GetLocalBoxPosFromBoxOffset(duplicateData.offset);

        var boxName = this.getTitlesByBoxSlot(toBoxSlot)[duplicateData.boxNum];
        impossibleFrom[GetBoxPosBoxRow(fromPos)][GetBoxPosBoxColumn(fromPos)] = true;
        if (duplicateData.boxNum === this.state.currentBox[toBoxSlot]) //Only display red if that box is being viewing
            impossibleTo[GetBoxPosBoxRow(toPos)][GetBoxPosBoxColumn(toPos)] = true;

        impossibleMovement[toBoxSlot] = impossibleTo;
        impossibleMovement[fromBoxSlot] = impossibleFrom;
        errorMessage[toBoxSlot] = `A duplicate is in ${boxName}.`;

        if (impossibleMovement[0] === null)
            impossibleMovement[0] = this.generateBlankImpossibleMovementArray();
        else if (impossibleMovement[1] === null)
            impossibleMovement[1] = this.generateBlankImpossibleMovementArray();

        this.setState({
            selectedMonPos: this.generateBlankSelectedPos(),
            errorMessage: errorMessage,
            impossibleMovement: impossibleMovement,
        });
    }

    /**
     * Handles moving Pokemon from one box slot to another (can be same box type, though).
     * @param {Boolean} multiSwap - True if more than one Pokemon is being at once, False if only one is being moved.
     */
    swapDifferentBoxSlotPokemon(multiSwap)
    {
        var leftBoxes = this.getBoxesByBoxSlot(BOX_SLOT_LEFT);
        var rightBoxes = this.getBoxesByBoxSlot(BOX_SLOT_RIGHT);
        var leftBoxType = this.getBoxTypeByBoxSlot(BOX_SLOT_LEFT);
        var rightBoxType = this.getBoxTypeByBoxSlot(BOX_SLOT_RIGHT);
        var leftSelectedMonBox = this.state.selectedMonBox[BOX_SLOT_LEFT];
        var rightSelectedMonBox = this.state.selectedMonBox[BOX_SLOT_RIGHT];
        var changeWasMade = this.state.changeWasMade;

        if (this.isValidBoxNumByBoxSlot(leftSelectedMonBox,  BOX_SLOT_LEFT)
         && this.isValidBoxNumByBoxSlot(rightSelectedMonBox, BOX_SLOT_RIGHT)) //Bounds checking
        {
            if (!multiSwap) //Moving one Pokemon
            {
                var leftOffset  = GetOffsetFromBoxNumAndPos(leftSelectedMonBox,  this.state.selectedMonPos[BOX_SLOT_LEFT].indexOf(true));
                var rightOffset = GetOffsetFromBoxNumAndPos(rightSelectedMonBox, this.state.selectedMonPos[BOX_SLOT_RIGHT].indexOf(true));

                if (!this.isMonInWonderTrade(this.getBoxTypeByBoxSlot(BOX_SLOT_LEFT), leftOffset)
                &&  !this.isMonInWonderTrade(this.getBoxTypeByBoxSlot(BOX_SLOT_RIGHT), rightOffset))
                {
                    //Check if mon already exists in the right boxes
                    let alreadyExistsRet =
                        this.monAlreadyExistsInBoxes(leftBoxes[leftOffset], rightBoxes, this.getBoxAmountByBoxSlot(BOX_SLOT_RIGHT),
                                                    (leftBoxType === rightBoxType) ? leftOffset : -1); //Ignore the mon being moved

                    if (alreadyExistsRet.boxNum >= 0)
                    {
                        this.setDuplicatePokemonSwappingError(BOX_SLOT_LEFT, leftOffset, BOX_SLOT_RIGHT, alreadyExistsRet);
                        return;
                    }
                    else
                    {
                        //Check if mon already exists in the left boxes
                        alreadyExistsRet =
                            this.monAlreadyExistsInBoxes(rightBoxes[rightOffset], leftBoxes, this.getBoxAmountByBoxSlot(BOX_SLOT_LEFT),
                                                        (leftBoxType === rightBoxType) ? rightOffset : -1); //Ignore the mon being moved

                        if (alreadyExistsRet.boxNum >= 0)
                        {
                            this.setDuplicatePokemonSwappingError(BOX_SLOT_RIGHT, rightOffset, BOX_SLOT_LEFT, alreadyExistsRet);
                            return;
                        }
                        else
                        {
                            this.swapBoxedPokemon(leftBoxes, rightBoxes, leftOffset, rightOffset);
                            changeWasMade[leftBoxType] = true;
                            changeWasMade[rightBoxType] = true;
                        }
                    }
                }
            }
            else //Moving multiple Pokemon
            {
                var i, j, multiFrom, multiTo, multiTopLeftPos, toTopRow, toLeftCol;
                var topRow = Number.MAX_SAFE_INTEGER;
                var bottomRow = 0;
                var leftCol = Number.MAX_SAFE_INTEGER;
                var rightCol = 0;

                if (this.state.selectedMonPos[BOX_SLOT_RIGHT].filter(x => x).length >= 2) //Count number of "true"s in array
                {
                    multiFrom = BOX_SLOT_RIGHT;
                    multiTo = BOX_SLOT_LEFT;
                    multiTopLeftPos = this.state.selectedMonPos[BOX_SLOT_LEFT].indexOf(true);
                }
                else
                {
                    multiFrom = BOX_SLOT_LEFT;
                    multiTo = BOX_SLOT_RIGHT;
                    multiTopLeftPos = this.state.selectedMonPos[BOX_SLOT_RIGHT].indexOf(true);
                }

                var fromBoxes = this.getBoxesByBoxSlot(multiFrom);
                var toBoxes = this.getBoxesByBoxSlot(multiTo);

                //Confirm no mons selected are duplicates
                for (i = 0; i < MONS_PER_BOX; ++i)
                {
                    if (this.state.selectedMonPos[multiFrom][i])
                    {
                        let offset = GetOffsetFromBoxNumAndPos(this.state.selectedMonBox[multiFrom], i);
                        let pokemon = this.getMonAtBoxPos(multiFrom, offset);
                        let alreadyExistsRet =
                            this.monAlreadyExistsInBoxes(pokemon, toBoxes, this.getBoxAmountByBoxSlot(multiTo),
                                                        (leftBoxType === rightBoxType) ? offset : -1); //Ignore the mon being moved

                        if (alreadyExistsRet.boxNum >= 0)
                        {
                            this.setDuplicatePokemonSwappingError(multiFrom, offset, multiTo, alreadyExistsRet);
                            return;
                        }
                    }
                }

                //Get area of moving mons
                for (i = 0; i < MONS_PER_BOX; ++i)
                {
                    if (this.state.selectedMonPos[multiFrom][i])
                    {
                        let row = GetBoxPosBoxRow(i);
                        let col = GetBoxPosBoxColumn(i);

                        if (row < topRow)
                            topRow = row;
                        
                        if (row > bottomRow)
                            bottomRow = row;
                        
                        if (col < leftCol)
                            leftCol = col;

                        if (col > rightCol)
                            rightCol = col;
                    }
                }

                //Confirm moving mons can fit snugly in spot
                var possible = true;
                var width = (rightCol - leftCol) + 1;
                var height = (bottomRow - topRow) + 1;
                var impossibleFrom = this.generateBlankImpossibleMovementArray();
                var impossibleTo = this.generateBlankImpossibleMovementArray();
                toTopRow = GetBoxPosBoxRow(multiTopLeftPos);
                toLeftCol = GetBoxPosBoxColumn(multiTopLeftPos);

                for (i = 0; i < height; ++i)
                {
                    let row = toTopRow + i;

                    for (j = 0; j < width; ++j)
                    {
                        let col = toLeftCol + j;
                        let offset = GetOffsetFromBoxNumAndPos(this.state.selectedMonBox[multiFrom], (topRow + i) * MONS_PER_ROW + (leftCol + j));
                        let movingPokemon = this.getMonAtBoxPos(multiFrom, offset);
                        let isMonAndIsSelected = !IsBlankMon(movingPokemon) && this.state.selectedMonPos[multiFrom][offset];

                        if (row >= MONS_PER_BOX / MONS_PER_ROW) //5 Rows
                        {
                            possible = false; //Outside of bounds
                            if (isMonAndIsSelected) //Only highlight actual selected Pokemon
                                impossibleFrom[topRow + i][leftCol + j] = true;
                            continue;
                        }

                        if (col >= MONS_PER_ROW) //6 Colums
                        {
                            possible = false; //Outside of bounds
                            if (isMonAndIsSelected) //Only highlight actual selected Pokemon
                                impossibleFrom[topRow + i][leftCol + j] = true;
                            continue;
                        }

                        if (!this.state.selectedMonPos[multiFrom][topRow * MONS_PER_ROW + i * MONS_PER_ROW + leftCol + j])
                            continue; //No mon would be going in this spot anyway

                        offset = GetOffsetFromBoxNumAndPos(this.state.selectedMonBox[multiTo], row * MONS_PER_ROW + col);
                        if (!IsBlankMon(this.getMonAtBoxPos(multiTo, offset)))
                        {
                            possible = false; //There's a Pokemon at this spot
                            impossibleFrom[topRow + i][leftCol + j] = true;
                            impossibleTo[row][col] = true;
                        }
                    }
                }

                //Move Pokemon
                if (possible)
                {
                    for (i = 0; i < MONS_PER_BOX; ++i)
                    {
                        if (this.state.selectedMonPos[multiFrom][i]) //Moving mon from this spot
                        {
                            let fromRow = GetBoxPosBoxRow(i);
                            let fromCol = GetBoxPosBoxColumn(i);
                            let toRow = toTopRow + (fromRow - topRow);
                            let toCol = toLeftCol + (fromCol - leftCol);

                            let fromOffset = GetOffsetFromBoxNumAndPos(this.state.selectedMonBox[multiFrom], i);
                            let toOffset = GetOffsetFromBoxNumAndPos(this.state.selectedMonBox[multiTo], toRow * MONS_PER_ROW + toCol);
                            this.swapBoxedPokemon(fromBoxes, toBoxes, fromOffset, toOffset);
                        }
                    }

                    changeWasMade[this.getBoxTypeByBoxSlot(multiTo)] = true;
                    changeWasMade[this.getBoxTypeByBoxSlot(multiFrom)] = true;
                }
                else
                {
                    //Update impossible highlighting
                    var impossibleMovement = [null, null];
                    impossibleMovement[multiFrom] = impossibleFrom;
                    impossibleMovement[multiTo] = impossibleTo;

                    //Only deselect clicked on spot
                    var selectedMonPos = this.state.selectedMonPos;
                    var errorMessage = this.state.errorMessage;
                    selectedMonPos[multiTo] = CreateSingleBlankSelectedPos();
                    errorMessage[multiTo] = "Not enough space for the move.";
                    this.setState({
                        selectedMonPos: selectedMonPos,
                        errorMessage: errorMessage,
                        impossibleMovement: impossibleMovement,
                    });

                    return;
                }
            }
        }

        this.setState({
            selectedMonPos: this.generateBlankSelectedPos(),
            saveBoxes: (leftBoxType === BOX_SAVE) ? leftBoxes : (rightBoxType === BOX_SAVE) ? rightBoxes : this.state.saveBoxes,
            homeBoxes: (leftBoxType === BOX_HOME) ? leftBoxes : (rightBoxType === BOX_HOME) ? rightBoxes : this.state.homeBoxes,
            changeWasMade: changeWasMade,
        })

        this.wipeErrorMessage();
    }


    /**********************************
           Drag Pokemon Functions      
    **********************************/

    /**
     * Moves the icon of the Pokemon being dragged.
     * @param {Object} e - The drag mouse event.
     */
    moveDraggingMonIcon(e)
    {
        let icon = document.getElementById('moving-icon');

        if (icon !== null)
        {
            icon.style.visibility = "initial";
            icon.style.left = e.pageX - (68 / 2) + 'px'; //Follow the mouse
            icon.style.top = e.pageY - (56 / 2) + 'px';
        }
    }

    /**
     * [UNUSED] Moves the icon of the Pokemon being dragged on mobile devices.
     * @param {Object} e - The touch event.
     */
    /*moveDraggingMonIconTouch(e)
    {
        let icon = document.getElementById('moving-icon');
        let x = e.touches[0].pageX;
        let y = e.touches[0].pageY;

        //Update icon coordinates
        if (icon !== null)
        {
            icon.style.visibility = "initial";
            icon.style.left = x - (68 / 2) + 'px'; //Follow the finger
            icon.style.top = y - (56 / 2) + 'px';
        }

        //Update hovering over
        var element = document.elementFromPoint(x, y);
        if (element !== null && element.className !== undefined && !element.className.includes("box-icon"))
            this.setState({draggingOver: -1}); //No longer dragging over box cell
    }*/

    /**
     * Stops dragging a Pokemon.
     */
    handleReleaseDragging()
    {
        if (this.state.draggingMon !== -1) //Actually dragging
            this.swapDraggingBoxPokemon(); //Also releases the dragging
    }

    /**
     * Handles moving a Pokemon by dragging it.
     */
    swapDraggingBoxPokemon()
    {
        var fromBoxes = this.getBoxesByBoxSlot(this.state.draggingFromBox);
        var toBoxes = this.getBoxesByBoxSlot(this.state.draggingToBox);
        var fromBoxType = this.getBoxTypeByBoxSlot(this.state.draggingFromBox);
        var toBoxType = this.getBoxTypeByBoxSlot(this.state.draggingToBox);
        var fromOffset = this.state.draggingMon;
        var toOffset = this.state.draggingOver;
        var selectedMonPos = this.state.selectedMonPos;
        var summaryMon = this.state.summaryMon;
        var changeWasMade = this.state.changeWasMade;

        if (fromOffset >= 0 && toOffset >= 0
        && (this.state.draggingFromBox !== this.state.draggingToBox || fromOffset !== toOffset) //Make sure different Pokemon are being swapped
        && !this.isMonInWonderTrade(this.getBoxTypeByBoxSlot(this.state.draggingToBox), toOffset))
        {
            let alreadyExistsRet =
                this.monAlreadyExistsInBoxes(fromBoxes[fromOffset], toBoxes, this.getBoxAmountByBoxSlot(this.state.draggingToBox),
                                            (fromBoxType === toBoxType) ? fromOffset : -1); //Ignore the mon being moved

            if (alreadyExistsRet.boxNum >= 0)
            {
                this.setDuplicatePokemonSwappingError(this.state.draggingFromBox, fromOffset, this.state.draggingToBox, alreadyExistsRet);
            }
            else
            {
                alreadyExistsRet =
                    this.monAlreadyExistsInBoxes(toBoxes[toOffset], fromBoxes, this.getBoxAmountByBoxSlot(this.state.draggingToBox),
                                                (fromBoxType === toBoxType) ? toOffset : -1); //Ignore the mon being moved

                if (alreadyExistsRet.boxNum >= 0)
                {
                    this.setDuplicatePokemonSwappingError(this.state.draggingToBox, toOffset, this.state.draggingFromBox, alreadyExistsRet);
                }
                else
                {
                    this.swapBoxedPokemon(fromBoxes, toBoxes, fromOffset, toOffset);
                    selectedMonPos = this.generateBlankSelectedPos(); //Only remove if swap was made
                    summaryMon = [null, null];
                    changeWasMade[fromBoxType] = true;
                    changeWasMade[toBoxType] = true;
                    this.wipeErrorMessage();
                }
            }
        }
        else
            this.wipeErrorMessage();

        this.setState({
            draggingMon: -1,
            draggingImg: "",
            selectedMonPos: selectedMonPos,
            summaryMon: summaryMon,
            changeWasMade: changeWasMade,
            saveBoxes: (fromBoxType === BOX_SAVE) ? fromBoxes : (toBoxType === BOX_SAVE) ? toBoxes : this.state.saveBoxes,
            homeBoxes: (fromBoxType === BOX_HOME) ? fromBoxes : (toBoxType === BOX_HOME) ? toBoxes : this.state.homeBoxes,
        })
    }


    /**********************************
         Release Pokemon Functions      
    **********************************/

    /**
     * Releases a specific Pokemon.
     * @param {Array <Pokemon>} boxes - The set of boxes to release the Pokemon from.
     * @param {Number} boxNum - The box number the Pokemon is at.
     * @param {Number} boxPos - The position in the box the Pokemon is at.
     */
    releaseMonAtBoxPos(boxes, boxNum, boxPos)
    {
        let offset = GetOffsetFromBoxNumAndPos(boxNum, boxPos);
        boxes[offset] = this.generateBlankMonObject();
    }

    /**
     * Releases all selected Pokemon.
     * @param {Number} boxSlot - The box slot to release Pokemon from.
     * @param {Number} boxType - The box type to release Pokemon from.
     * @param {Boolean} releaseSummaryMon - True if the Pokemon whose summary is displayed should be released, False if selected Pokemon.
     */
    releaseSelectedPokemon(boxSlot, boxType, releaseSummaryMon)
    {
        var boxes = this.getBoxesByBoxSlot(boxSlot);
        var selectedMonPos = this.state.selectedMonPos;
        var summaryMon = this.state.summaryMon;
        var changeWasMade = this.state.changeWasMade;
    
        if (releaseSummaryMon)
        {
            if (summaryMon[boxSlot] != null
            && this.isValidBoxNumByBoxSlot(summaryMon[boxSlot].boxNum, boxSlot)
            && this.isValidBoxPos(summaryMon[boxSlot].boxPos))
            {
                this.releaseMonAtBoxPos(boxes, summaryMon[boxSlot].boxNum, summaryMon[boxSlot].boxPos);
                changeWasMade[boxType] = true;
            }
        }
        else if (this.isValidBoxNumByBoxSlot(this.state.selectedMonBox[boxSlot], boxSlot))
        {
            //Release selected Pokemon
            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                if (this.state.selectedMonPos[boxSlot][i])
                {
                    this.releaseMonAtBoxPos(boxes, this.state.selectedMonBox[boxSlot], i);
                    changeWasMade[boxType] = true;
                }
            }
        }

        selectedMonPos[boxSlot] = CreateSingleBlankSelectedPos();
        summaryMon[boxSlot] = null;

        this.setState({
            saveBoxes: (boxType === BOX_SAVE) ? boxes : this.state.saveBoxes,
            homeBoxes: (boxType === BOX_HOME) ? boxes : this.state.homeBoxes,
            selectedMonPos: selectedMonPos,
            summaryMon: summaryMon,
            changeWasMade: changeWasMade,
        })

        this.wipeErrorMessage();
    }


    /**********************************
          Trade Pokemon Functions      
    **********************************/

    /**
     * Saves the Pokemon received via Wonder Trade.
     * @param {Pokemon} newPokemon - The Pokemon received from the Wonder Trade.
     * @param {Number} boxType - The box type to deposit the new Pokemon in.
     * @param {Number} boxNum - The box number to deposit the new Pokemon in.
     * @param {Number} boxPos - The box position to deposit the new Pokemon in.
     */
    finishWonderTrade(newPokemon, boxType, boxNum, boxPos)
    {
        var boxSlot = -1;
        var boxes = this.getBoxesByBoxType(boxType);
        var offset = GetOffsetFromBoxNumAndPos(boxNum, boxPos);
        var changeWasMade = this.state.changeWasMade;
        var summaryMon = [null, null];
        changeWasMade[boxType] = true;
        boxes[offset] = newPokemon;

        if (this.getBoxTypeByBoxSlot(BOX_SLOT_LEFT) === boxType)
            boxSlot = BOX_SLOT_LEFT;
        else if (this.getBoxTypeByBoxSlot(BOX_SLOT_RIGHT) === boxType)
            boxSlot = BOX_SLOT_RIGHT;

        this.setState({summaryMon: summaryMon}, () => //Force rerender first
        {
            if (boxSlot >= 0)
                summaryMon[boxSlot] = {pokemon: newPokemon, boxNum: boxNum, boxPos: boxPos};

            this.setState({
                saveBoxes: (boxType === BOX_SAVE) ? boxes : this.state.saveBoxes,
                homeBoxes: (boxType === BOX_HOME) ? boxes : this.state.homeBoxes,
                summaryMon: summaryMon,
                selectedMonBox: [0, 0],
                selectedMonPos: this.generateBlankSelectedPos(),
                changeWasMade: changeWasMade,
                wonderTradeData: null,
            });
        });
    }


    /**********************************
          Living Pokedex Functions     
    **********************************/

    /**
     * Arranges the species in the Home boxes to satisfy the living Pokedex order.
     * @param {Array <String>} speciesList - The list of species ids to arrange Pokemon into.
     */
    async fixLivingDex(speciesList)
    {
        var i;
        var newBoxes = this.generateBlankHomeBoxes();
        var speciesIndexDict = {};
        var freeSlot = speciesList.length;

        //First build a hash table for quick access
        for (i = 0; i < speciesList.length; ++i)
            speciesIndexDict[speciesList[i]] = i;

        //Then move any Pokemon that are already placed after where the living dex would end
        //This ensures those Pokemon at least may remain in their positions
        for (i = speciesList.length; i < this.state.homeBoxes.length; ++i)
            newBoxes[i] = this.state.homeBoxes[i];

        //Then move the Pokemon that are in the living dex area
        for (i = 0; i < speciesList.length; ++i)
        {
            let pokemon = this.state.homeBoxes[i]
            let species = GetSpecies(pokemon);

            if (species in speciesIndexDict)
            {
                let index = speciesIndexDict[species];
                if (IsBlankMon(newBoxes[index])) //Free spot
                    newBoxes[index] = pokemon;
                else
                    newBoxes[freeSlot] = pokemon;
            }
            else
                newBoxes[freeSlot] = pokemon;

            if (freeSlot >= newBoxes.length)
                freeSlot = 0;

            while (!IsBlankMon(newBoxes[freeSlot]))
                ++freeSlot; //Increment until a free slot is found
        }

        //And finally try moving the Pokemon moved earlier
        for (i = speciesList.length; i < newBoxes.length; ++i)
        {
            let pokemon = newBoxes[i];
            let species = GetSpecies(pokemon);
    
            if (species in speciesIndexDict)
            {
                let index = speciesIndexDict[species];
                if (IsBlankMon(newBoxes[index])) //Free spot
                {
                    //"Swap" them
                    let blank = newBoxes[index];
                    newBoxes[index] = pokemon;
                    newBoxes[i] = blank;
                }
            }
        }

        this.state.homeBoxes = newBoxes;
        return newBoxes;
    }


    /**********************************
             Box View Functions        
    **********************************/

    /**
     * Changes the box view between Home <-> Home, Home <-> Save, and Save <-> Save
     * @param {Number} newState - The edit state for the new box view.
     */
    changeBoxView(newState)
    {
        if (newState !== this.state.editState || this.state.viewingBoxList >= 0) //Can use this to get out of box list
        {
            var oldState = this.state.editState;
            var currentBoxes = this.state.currentBox;

            if ((newState === STATE_EDITING_HOME_BOXES || newState === STATE_EDITING_SAVE_FILE)
            && ((oldState === STATE_EDITING_HOME_BOXES || oldState === STATE_EDITING_SAVE_FILE)))
                currentBoxes = [0, 1]; //Stagger boxes
            else
            {
                if (newState === STATE_MOVING_POKEMON)
                {
                    if (oldState === STATE_EDITING_HOME_BOXES)
                        currentBoxes[BOX_SLOT_RIGHT] = 0; //Reset save box
                    else
                        currentBoxes[BOX_SLOT_LEFT] = 0; //Reset home box
                }
                else if (newState === STATE_EDITING_HOME_BOXES)
                {
                    currentBoxes[BOX_SLOT_RIGHT] = 0; //Reset old save box
                    if (currentBoxes[BOX_SLOT_LEFT] === currentBoxes[BOX_SLOT_RIGHT]) //Both are 0
                        currentBoxes[BOX_SLOT_RIGHT] = 1;
                }
                else
                {
                    currentBoxes[BOX_SLOT_LEFT] = 0; //Reset home box
                    if (currentBoxes[BOX_SLOT_LEFT] === currentBoxes[BOX_SLOT_RIGHT]) //Both are 0
                        currentBoxes[BOX_SLOT_LEFT] = 1;
                }
            }

            this.setState({
                editState: newState,
                selectedMonBox: [0, 0],
                selectedMonPos: this.generateBlankSelectedPos(),
                summaryMon: [null, null],
                currentBox: currentBoxes,
                viewingBoxList: -1,
                draggingMon: -1,
            });

            this.wipeErrorMessage();
        }
    }


    /**********************************
           Save Changes Functions      
    **********************************/

    /**
     * Downloads the updated data for one of the box slots.
     * @param {Number} boxSlot - The box slot to save and download.
     */
    async downloadSaveFileAndHomeData(boxSlot)
    {
        var res, formData;
        var errorMessage = this.state.errorMessage;
        var homeRoute = `${config.dev_server}/encryptHomeData`;
        var saveRoute = `${config.dev_server}/getUpdatedSaveFile`;
        var serverConnectionErrorMsg = <span>Could not connect to the server.<br/>DO NOT RELOAD THE PAGE!</span>;
        this.setState({savingMessage: "Preparing save data..."});
        this.wipeErrorMessage();

        //Get Encrypted Home File
        var homeData = JSON.stringify({
            titles: this.state.homeTitles,
            boxes: this.state.homeBoxes,
        });

        formData = new FormData(); //formData contains the home data split into four parts to guarantee it'll all be sent
        this.addHomeDataToFormData(homeData, formData);

        try
        {
            res = await axios.post(homeRoute, formData, {});
        }
        catch (error)
        {
            errorMessage[boxSlot] = (error.message === "Network Error") ? serverConnectionErrorMsg : error.response.data;
            console.log(errorMessage[boxSlot]);
            this.setState({savingMessage: "", errorMessage: errorMessage});
            return;
        }

        var encryptedHomeData = res.data.newHomeData;

        //Get Updated Save File
        formData = new FormData(); //formData contains the data to send to the server
        formData.append("newBoxes", JSON.stringify(this.state.saveBoxes));
        formData.append("saveFileData", JSON.stringify(this.state.saveFileData["data"]));
        formData.append("fileIdNumber", JSON.stringify(this.state.saveFileNumber));

        this.setState({savingMessage: "Preparing save data..."});
        this.wipeErrorMessage();

        try
        {
            res = await axios.post(saveRoute, formData, {});
        }
        catch (error)
        {
            errorMessage[boxSlot] = (error.message === "Network Error") ? serverConnectionErrorMsg : error.response.data;
            console.log(errorMessage[boxSlot]);
            this.setState({savingMessage: "", errorMessage: errorMessage});
            return;
        }

        //No error occurred good to proceed
        var dataBuffer = res.data.newSaveFileData;
        var name = (this.state.selectedSaveFile === null) ? "savefile.sav" : this.state.selectedSaveFile.name; //Same name as original file

        var output = []
        for (let byte of dataBuffer["data"])
        {
            let newArray = new Uint8Array(1);
            newArray[0] = byte;
            output.push(newArray);
        }

        //Download the Save File
        if (this.state.changeWasMade[BOX_SAVE])
        {
            var file = new Blob(output, {type: 'application/octet-stream'});
            var element = document.createElement("a");
            element.href = URL.createObjectURL(file);
            element.download = name;
            document.body.appendChild(element); //Required for this to work in FireFox
            element.click();
        }

        if (this.state.changeWasMade[BOX_HOME])
        {
            //Download the Home Data
            file = new Blob([encryptedHomeData], {type: 'application/octet-stream'});
            element = document.createElement("a");
            element.href = URL.createObjectURL(file);
            element.download = HOME_FILE_NAME;
            document.body.appendChild(element); //Required for this to work in FireFox
            element.click();
            localStorage.lastSavedHomeData = encryptedHomeData;
        }

        this.setState({savingMessage: "", changeWasMade: [false, false]});
    }

    /**
     * Handles downloading the updated data for one of the box slots.
     * @param {Number} boxSlot - The box slot to save and download.
     */
    async saveAndExit(boxSlot)
    {
        await this.downloadSaveFileAndHomeData(boxSlot);
    }


    /**********************************
               Page Elements           
    **********************************/

    /**
     * Gets the button for viewing the Home boxes in both box slots.
     * @returns {JSX} A button element.
     */
    homeToHomeButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;

        return (
            <Button size="lg" className={"top-bar-button" + (this.state.editState === STATE_EDITING_HOME_BOXES ? " top-bar-button-selected" : "")}
                    aria-label="Home to Home"
                    onClick={() => this.changeBoxView(STATE_EDITING_HOME_BOXES)}>
                <FaCloud size={size} /> ↔ <FaCloud size={size} />
            </Button>
        );
    }

    /**
     * Gets the button for viewing the Save boxes in both box slots.
     * @returns {JSX} A button element.
     */
    saveToSaveButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;

        return (
            <Button size="lg" className={"top-bar-button" + (this.state.editState === STATE_EDITING_SAVE_FILE ? " top-bar-button-selected" : "")}
                    aria-label="Save File to Save File"
                    onClick={() => this.changeBoxView(STATE_EDITING_SAVE_FILE)}>
                <FaGamepad size={size} /> ↔ <FaGamepad size={size} />
            </Button>
        );
    }

    /**
     * Gets the button for viewing both the Home boxes and the save boxes in the box slots.
     * @returns {JSX} A button element.
     */
    homeToSaveButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;

        return (
            <Button size="lg" className={"top-bar-button" + (this.state.editState === STATE_MOVING_POKEMON ? " top-bar-button-selected" : "")}
                    aria-label="Home to Save File"
                    onClick={() => this.changeBoxView(STATE_MOVING_POKEMON)}>
                <FaCloud size={size} /> ↔ <FaGamepad size={size} />
            </Button>
        );
    }

    /**
     * Gets the button for returning to the box view from the box list page.
     * @returns {JSX} A arrow meant to be pressed as a button.
     */
    backToMainViewButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;
        var paddingRight = window.innerWidth < 500 ? "0%" : "90%";

        return (
            <BiArrowBack size={size} className="top-bar-back-button" style={{paddingRight: paddingRight}}
                         aria-label="Back" onClick={() => this.setState({viewingBoxList: -1})}/>
        );
    }

    /**
     * Gets the navbar displayed at the top of the page.
     * @returns {JSX} The navbar.
     */
    navBarButtons()
    {
        //Appear above everything when boxes are side by side
        //Otherwise scroll with everything else if possible

        var viewingBoxList = this.state.viewingBoxList >= 0;
        var sticky = viewingBoxList || !this.areBoxViewsVertical();

        if (viewingBoxList)
        {
            return (
                <div className="top-bar-buttons" style={{zIndex: 100, position: "sticky"}}>
                    {this.backToMainViewButton()}
                </div>
            );
        }

        return (
            <div className="top-bar-buttons" style={{zIndex: !sticky ? -1 : 100,
                                                     position: !sticky ? "unset" : "sticky"}}>
                {this.homeToHomeButton()}
                {this.homeToSaveButton()}
                {this.saveToSaveButton()}
            </div>
        );
    }

    /**
     * Gets the screen shown when quick jumping between boxes.
     * @returns {JSX} The box list page.
     */
    boxListScreen()
    {
        return (
            <BoxList boxes={this.getBoxesByBoxSlot(this.state.viewingBoxList)}
                     titles={this.getTitlesByBoxSlot(this.state.viewingBoxList)}
                     boxCount={this.getBoxAmountByBoxSlot(this.state.viewingBoxList)}
                     boxType={this.getBoxTypeByBoxSlot(this.state.viewingBoxList)} boxSlot={this.state.viewingBoxList}
                     currentBoxes={this.state.currentBox} selectedMonPos={this.state.selectedMonPos}
                     summaryMon={this.state.summaryMon} searchCriteria={this.state.searchCriteria[this.state.viewingBoxList]}
                     isSameBoxBothSides={this.state.editState === STATE_EDITING_SAVE_FILE || this.state.editState === STATE_EDITING_HOME_BOXES}
                     updateParentState={this.updateState}/>
        );
    }

    /**
     * Gets the screen shown the first time the user accesses the site (based on the local storage).
     * @returns {JSX} The welcome page.
     */
    printWelcome(title)
    {
        return (
            <div className="main-page-upload-instructions fade-in">
                {title}
                <FaArrowAltCircleRight aria-label="Next" className="main-page-purple-icon-button"
                        size={48}
                        onClick={() => this.setState({editState: STATE_ASK_FIRST_TIME})} />
            </div>
        )
    }

    /**
     * Gets the page that asks the user if it's their first time on the site.
     * @returns {JSX} The ask first time page.
     */
    printAskFirstTime()
    {
        return (
            <div className="main-page-upload-instructions fade-in">
                <h2>Is this your first time here?</h2>
                <div>
                    <div>
                        <Button size="lg" variant="success" onClick={() => this.setState({editState: STATE_UPLOAD_SAVE_FILE})}
                                className="choose-home-file-button">
                            Yes
                        </Button>
                    </div>

                    <div>
                        <Button size="lg" variant="secondary" onClick={() => this.setState({editState: STATE_UPLOAD_HOME_FILE})}
                                className="choose-home-file-button">
                            No
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Gets the page that asks the user to create a new Home file or upload an existing one.
     * @returns {JSX} The choose Home file page.
     */
    printUploadHomeFile()
    {
        return (
            <div className="main-page-upload-instructions fade-in">
                <h2>Upload your Cloud data.</h2>
                <h3>It should be a file called {HOME_FILE_NAME}</h3>
                <div>
                    {
                        "lastSavedHomeData" in localStorage && localStorage.lastSavedHomeData !== null && localStorage.lastSavedHomeData !== "" ?
                            <div>
                                <Button size="lg" variant="info" onClick={() => this.useLastSavedHomeFile()}
                                        className="choose-home-file-button">
                                    Last Saved
                                </Button>
                            </div>
                        :
                            ""
                    }

                    <div>
                        <label className="btn btn-success btn-lg choose-home-file-button">
                            Upload File
                            <input type="file" hidden onChange={(e) => this.chooseHomeFile(e)} />
                        </label>
                    </div>

                    <div>
                        <Button size="lg" onClick={() => this.setState({editState: STATE_UPLOAD_SAVE_FILE, fileUploadError: false, serverConnectionError: false})}
                                className="choose-home-file-button">
                            Create New
                        </Button>
                    </div>
                </div>

                {
                    this.state.fileUploadError ?
                        <div className="error-text">
                            <p>There was a problem with the data file chosen.</p>
                            <p>Please make sure it was a correct data file with no corruption.</p>
                        </div>
                    : this.state.serverConnectionError ?
                        <div className="error-text">
                            <p>Could not connect to the server.</p>
                            <p>Please try again later.</p>
                        </div>
                    :
                        ""
                }
            </div>
        )
    }

    /**
     * Gets the page that displays the upload progress to the user.
     * @returns {JSX} The upload progress page.
     */
    printUploadingFile()
    {
        var uploadProgress;

        if (typeof(this.state.uploadProgress) === "string" && this.state.uploadProgress.startsWith("Processing"))
            uploadProgress = <h2>{this.state.uploadProgress}</h2>;
        else
            uploadProgress =
                <>
                    <h2>Uploading</h2>
                    {this.state.uploadProgress}
                </>;

        return (
            <div className="main-page-upload-instructions fade-in">
                {uploadProgress}
                <h3>Please wait...</h3>
            </div>
        )
    }

    /**
     * Gets the page that asks the user to upload their save file.
     * @returns {JSX} The choose save file page.
     */
    printUploadSaveFile()
    {
        return (
            <div className="main-page-upload-instructions fade-in">
                <h2>Upload your save file.</h2>
                <h3>It should be a file ending with .sav, .srm, or .sa1.</h3>
                <label className="btn btn-success btn-lg choose-save-file-button">
                    Upload File
                    <input type="file" hidden onChange={(e) => this.chooseSaveFile(e)} />
                </label>

                {
                    this.state.fileUploadError
                    ?
                        <div className="error-text">
                            <p>There was a problem with the save file chosen.</p>
                            <p>Please make sure it was a correct 128 kb save file with no corruption.</p>
                        </div>
                    : this.state.serverConnectionError ?
                        <div className="error-text">
                            <p>Could not connect to the server.</p>
                            <p>Please try again later.</p>
                        </div>
                    :
                        ""
                }
            </div>
        )
    }

    /**
     * Gets the page with a Home box in both box slots.
     * @returns {JSX} The Home <-> Home page.
     */
    printEditingHomeBoxes()
    {
        var homeBoxView1 = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                    parent={this} boxType={BOX_HOME} boxSlot={BOX_SLOT_LEFT}
                                    isSameBoxBothSides={true} key={BOX_HOME + 3}/>; //The +3 forces a rerender by assigning a new key
        var homeBoxView2 = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                    parent={this} boxType={BOX_HOME} boxSlot={BOX_SLOT_RIGHT}
                                    isSameBoxBothSides={true} key={BOX_HOME + 4}/>; //The +4 forces a rerender by assigning a new key

        return (
            <div>         
                {this.navBarButtons()}

            {
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                    <div className={!isMobile ? "scroll-container" : ""}>
                        <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {homeBoxView1}
                                {homeBoxView2}
                        </div>
                    </div>
            }
            </div>
        )
    }

    /**
     * Gets the page with a Save box in both box slots.
     * @returns {JSX} The Save <-> Save page.
     */
    printEditingSaveBoxes()
    {
        var saveBoxView1 = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                    parent={this} boxType={BOX_SAVE} boxSlot={BOX_SLOT_LEFT}
                                    isSameBoxBothSides={true} key={BOX_SAVE + 5}/>; //The +5 forces a rerender by assigning a new key
        var saveBoxView2 = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                    parent={this} boxType={BOX_SAVE} boxSlot={BOX_SLOT_RIGHT}
                                    isSameBoxBothSides={true} key={BOX_SAVE + 6}/>; //The +6 forces a rerender by assigning a new key

        return (
            <div>                
                {this.navBarButtons()}

            {
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                    <div className={!isMobile ? "scroll-container" : ""}>
                        <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {saveBoxView1}
                                {saveBoxView2}
                        </div>
                    </div>
            }
            </div>
        )
    }

    /**
     * Gets the page with a Home box in one slot, and the save box in the other.
     * @returns {JSX} The Home <-> Save page.
     */
    printMovingPokemon()
    {
        var homeBoxView = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                   parent={this} boxType={BOX_HOME} boxSlot={BOX_SLOT_LEFT}
                                   isSameBoxBothSides={false} key={BOX_HOME}/>;
        var saveBoxView = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                   parent={this} boxType={BOX_SAVE} boxSlot={BOX_SLOT_RIGHT}
                                   isSameBoxBothSides={false} key={BOX_SAVE}/>;
 
        return (
            <div>
                {this.navBarButtons()}

                {
                    this.state.viewingBoxList >= 0 ?
                        this.boxListScreen()
                    :
                        <div className={!isMobile ? "scroll-container" : ""}>
                            <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {homeBoxView}
                                {saveBoxView}
                            </div>
                        </div>
                }
            </div>
        )
    }

    /**
     * Prints the main page.
     */
    render()
    {
        var title = <h1 className="main-page-title">Welcome to Unbound Home</h1>;
        var page, draggingImg;

        switch (this.state.editState)
        {
            case STATE_WELCOME:
                page = this.printWelcome(title);
                break;
            case STATE_ASK_FIRST_TIME:
                page = this.printAskFirstTime();
                break;
            case STATE_UPLOAD_HOME_FILE:
                page = this.printUploadHomeFile();
                break;
            case STATE_UPLOADING_HOME_FILE:
                page = this.printUploadingFile();
                break;
            case STATE_UPLOAD_SAVE_FILE:
                page = this.printUploadSaveFile();
                break;
            case STATE_UPLOADING_SAVE_FILE:
                page = this.printUploadingFile();
                break;
            case STATE_EDITING_HOME_BOXES:
                page = this.printEditingHomeBoxes(); //Don't display title
                break;
            case STATE_EDITING_SAVE_FILE:
                page = this.printEditingSaveBoxes(); //Don't display title
                break;
            case STATE_MOVING_POKEMON:
                page = this.printMovingPokemon(); //Don't display title
                break;
            default:
                page = "";
                break;
        }

        draggingImg = ""
        if (this.state.draggingImg !== "")
            draggingImg = <img src={this.state.draggingImg} alt={GetSpeciesName(GetSpecies(this.getMonAtBoxPos(this.state.draggingFromBox, this.state.draggingMon)))}
                               onMouseDown={(e) => e.preventDefault()} id="moving-icon" className="dragging-image"/>;

        return (
            <div style={{minWidth: "428px"}} onMouseMove={(e) => this.moveDraggingMonIcon(e)}>
                {page}
                {draggingImg}
            </div>
        )
    }
}
