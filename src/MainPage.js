/**
 * A class for the main page.
 */

import axios from "axios";
import React, {Component} from 'react';
import {Button, ProgressBar, OverlayTrigger, Tooltip} from "react-bootstrap";
import {isMobile} from "react-device-detect";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {config} from "./config";
import {BoxList} from "./BoxList";
import {BoxView, HIGHEST_HOME_BOX_NUM, MONS_PER_BOX, MONS_PER_COL, MONS_PER_ROW} from "./BoxView";
import {/*ClearBrowserDB,*/ GetDBVal, SetDBVal} from "./BrowserDB";
import {FriendTrade} from "./FriendTrade";
import {DoesPokemonSpeciesExistInGame, GetIconSpeciesName, GetItem, GetSpecies, HasEggLockeOT, IsBlankMon,
        IsEgg, IsHoldingBannedItem, PokemonAreDuplicates} from "./PokemonUtil";
import {BASE_GFX_LINK, CreateSingleBlankSelectedPos, GetBoxNumFromBoxOffset, GetBoxPosBoxColumn, GetBoxPosBoxRow,
        GetItemName, GetLocalBoxPosFromBoxOffset, GetOffsetFromBoxNumAndPos, GetSpeciesName} from "./Util";
import SaveData from "./data/Test Output.json";
import gSpeciesToDexNum from "./data/SpeciesToDexNum.json";

import {BiArrowBack} from "react-icons/bi";
import {FaArrowAltCircleRight, FaCloud, FaGamepad} from "react-icons/fa";
import {IoMdVolumeHigh, IoMdVolumeMute} from "react-icons/io"
import {MdSwapVert} from "react-icons/md"

import "./stylesheets/MainPage.css";

export const BOX_HOME = 0;
export const BOX_SAVE = 1;

export const BOX_SLOT_LEFT = 0;
export const BOX_SLOT_RIGHT = 1;

const STATE_WELCOME = 0
const STATE_ASK_FIRST_TIME = 1;
const STATE_UPLOAD_SAVE_FILE = 2;
const STATE_UPLOADING_SAVE_FILE = 3;
const STATE_UPLOAD_HOME_FILE = 4;
const STATE_UPLOADING_HOME_FILE = 5;
const STATE_CHOOSE_HOME_FOLDER = 6;
const STATE_CHOOSE_SAVE_HANDLE = 7;
const STATE_EDITING_HOME_BOXES = 8;
const STATE_EDITING_SAVE_FILE = 9;
const STATE_MOVING_POKEMON = 10;

const HOME_FILE_NAME = "cloud.dat";
const HOME_FILE_RANDOMIZER_NAME = "cloud_randomizer.dat"
const BLANK_PROGRESS_BAR = <ProgressBar className="upload-progress-bar" now={0} label={"0%"} />;
const GTS_ICON = <svg width="56px" height="56px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M254.777 93.275c-58.482 0-105.695 47.21-105.695 105.696 0 58.487 47.213 105.698 105.695 105.698 58.482 0 105.696-47.21 105.696-105.697 0-58.48-47.214-105.695-105.696-105.695zm-140.714 63.59C-40.9 155.67-21.26 276.118 227.043 357.748c225.954 74.28 319.04 10.624 239.48-69.973-.413-.55-.84-1.097-1.277-1.64-4.755 3.954-9.71 7.915-14.95 11.88 4.487 5.513 7.138 11.084 7.704 16.01.713 6.2-.9 11.8-6.986 17.977-5.84 5.927-16.25 11.98-32.307 16.49-24.074 5.698-58.427 5.6-102.287-2.656l.105-.04c-2.153-.38-4.3-.787-6.445-1.198-21.875-4.418-46.004-10.805-72.318-19.455-69.962-23-118.054-49.706-146.063-74.936.246-.19.48-.38.728-.568-.27.166-.532.333-.8.5-53.315-48.08-33.682-90.78 46.558-92.2-8.46-.665-16.502-1.016-24.124-1.075zm281.425 0c-7.62.06-15.663.41-24.123 1.076 80.24 1.42 99.86 44.115 46.537 92.193-.264-.165-.513-.33-.78-.494.244.184.472.368.712.553-26.017 23.434-69.357 48.144-131.455 69.973 21.19 5.413 42.82 9.363 64.815 11.64 34.83-15.125 63.025-30.916 84.91-46.554.01.007.02.014.032.02.522-.386 1.03-.773 1.547-1.16 90.502-65.565 69.686-128.11-42.196-127.247zM44.54 286.27c-74.364 73.55-5.467 133.668 176.683 89.125-22.844-7.563-44.89-15.83-65.84-24.194-25.396 2.316-46.41 1.29-62.842-2.346-16.802-4.544-27.613-10.765-33.61-16.852-6.086-6.176-7.697-11.776-6.985-17.977.56-4.88 3.17-10.395 7.582-15.86-5.253-3.968-10.22-7.935-14.986-11.894z"/></svg>;

const PopUp = withReactContent(Swal);
const DEBUG_ORIGINAL_FILE_METHOD = false; //Using the browser upload and download functions

const SUPPORTED_HACKS = ["Unbound", "Magical Altering Gym Menagerie"];

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

        this.state =
        {
            editState: GetInitialPageState(), //STATE_MOVING_POKEMON,

            //Uploading & Downloading Files
            uploadProgress: BLANK_PROGRESS_BAR,
            selectedSaveFile: null,
            selectedHomeFile: null,
            fileUploadError: false,
            serverConnectionError: false,
            mismatchedRandomizerError: false,
            saveFileData: {"data": []}, //Also used in downloading
            saveFileNumber: 0, //Also used in downloading
            homeDirHandle: null,  //Modern file system API
            saveFileHandle: null,
            homeFileHandle: null,

            //Box Side Data
            currentBox: [0, 0],
            selectedMonBox: [0, 0],
            livingDexState: [0, 0],
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
            draggingFromBox: -1,
            draggingToBox: -1,
            draggedAtLeastOnce: false,

            //Actual Storage System
            saveGameId: SaveData["gameId"],
            saveBoxCount: SaveData["boxCount"],
            saveBoxes: SaveData["boxes"],
            saveTitles: SaveData["titles"],
            homeBoxes: this.generateBlankHomeBoxes(),
            homeTitles: this.generateBlankHomeTitles(),
            isRandomizedSave: false,

            //Other
            muted: ("muted" in localStorage && localStorage.muted === "true") ? true : false,
            inFriendTrade: false,
            tradeData: null,
            viewingSummaryEVsIVs: false,
            isSaving: false,
        };

        this.updateState = this.updateState.bind(this);
    }

    /**
     * Sets up event listeners for dragging Pokemon and trying to leave the page.
     * Also loads cached Home data directory and save file handles from previous visit.
     */
    async componentDidMount()
    {
        //localStorage.clear(); //For debugging
        //ClearBrowserDB(); //For debugging
        window.addEventListener('beforeunload', this.tryPreventLeavingPage.bind(this));
        window.addEventListener('mouseup', this.handleReleaseDragging.bind(this));

        if (CanUseFileHandleAPI())
        {
            this.setState
            ({
                homeDirHandle: await GetDBVal("cloudDirectory"),
                saveFileHandle: await GetDBVal("saveFile"),
            });
        }
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
            fileUploadError: false,
            serverConnectionError: false,
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

    /**
     * Alternates between sounds muted and unmuted.
     */
    changeMuteState()
    {
        this.setState({muted: !this.state.muted}, () =>
        {
            localStorage.muted = this.state.muted; //Save cookie for future visits to the site
        });
    }

    /**
     * Handles the functionality of pressing the navbar's back button.
     */
    navBackButtonPressed()
    {
        if (this.state.viewingBoxList >= 0)
            this.setState({viewingBoxList: -1}); //Overrides Friend Trade because could be jumping boxes looking for a Pokemon
        else if (this.state.inFriendTrade)
            this.tryResetFriendTradeState();
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
     * Gets whether or not the screen needs to be zoomed out to see an entire box at once (mainly phones).
     * @returns True if the screen needs to be shrunk to fit a box. False if the default size is fine.
     */
    isScreenLessThanBoxWidth()
    {
        return document.documentElement.clientWidth < 428; //px
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
            return this.state.saveBoxCount;
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
     * Gets a Pokemon in a specific box type and at a specific position in the entire list of boxes.
     * @param {Number} boxType - Either BOX_HOME or BOX_SAVE.
     * @param {Number} boxPos - A position from 0 until getBoxAmountByBoxSlot(boxSlot) - 1
     * @returns {Pokemon} The Pokemon at the requested position.
     */
    getMonAtBoxPosByBoxType(boxType, boxPos)
    {
        return this.getBoxesByBoxType(boxType)[boxPos];
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
     * Checks if a Pokemon can't be placed in a box because it's holding an item that can't be placed in the cloud boxes.
     * @param {Pokemon} pokemon - The Pokemon to check.
     * @param {number} placedInBoxType - The box type the Pokemon is being placed in.
     * @returns {Boolean} True if the Pokemon can't be placed in the box. False if it can be.
     */
    cantBePlacedInBoxBecauseOfBannedItem(pokemon, placedInBoxType)
    {
        return IsHoldingBannedItem(pokemon) && placedInBoxType === BOX_HOME;
    }

    /**
     * Checks if a Pokemon can't be placed in a box because it doesn't exist in the save hack.
     * @param {Pokemon} pokemon - The Pokemon to check.
     * @param {number} placedInBoxType - The box type the Pokemon is being placed in.
     * @returns {Boolean} True if the Pokemon can't be placed in the box. False if it can be.
     */
    cantBePlacedInBoxBecauseOfNonExistentSpecies(pokemon, placedInBoxType)
    {
        switch (placedInBoxType)
        {
            case BOX_SAVE:
                if (!DoesPokemonSpeciesExistInGame(pokemon, this.state.saveGameId))
                    return true;
                break;
            case BOX_HOME:
            default:
                if (!this.state.isRandomizedSave && HasEggLockeOT(pokemon))
                    return true;
                break;
        }

        return false;
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

        return this.state.wonderTradeData != null
            && this.state.wonderTradeData.boxType === boxType
            && this.state.wonderTradeData.boxNum === boxNum
            && this.state.wonderTradeData.boxPos === boxPos;
    }

    /**
     * Gets whether or not any mon is currently up for a Wonder Trade.
     * @returns {Boolean} True if any Pokemon is up for a Wonder Trade, False otherwise.
     */
    isAnyMonInWonderTrade()
    {
        var wonderTradeData = this.state.wonderTradeData;
        return wonderTradeData != null;
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
     * Checks if a file's possible to be a valid save file.
     * @param {File} file - The save file to check.
     * @returns {Boolean} - True if the save file could be valid. False otherwise.
     */
    isValidSaveFile(file)
    {
        return  file != null
            /*&& this.isValidSaveFileName(file.name.toLowerCase())*/ //Extension doesn't matter because the user will be guided to pick the right one anyway
            && (file.size === 0x20000 || file.size === 0x20010); //Flashcarts append 0x10 bytes onto the end
    }

    /**
     * Gets the correct name of the home file based on the uploaded save file.
     * @returns {String} HOME_FILE_NAME for a regular save, HOME_FILE_RANDOMIZER_NAME for a randomized save.
     */
    getHomeFileName()
    {
        return this.state.isRandomizedSave ? HOME_FILE_RANDOMIZER_NAME : HOME_FILE_NAME;
    }

    /**
     * Handles the user's choice of a save file.
     * @param {Object} e - The file upload event.
     */
    async chooseSaveFile(e)
    {
        var file = e.target.files[0];
        if (file == null) //Cancelled the file upload
            return;

        if (!(await this.handleChooseSaveFile(file)) && !this.state.serverConnectionError)
            this.printSaveFileUploadError();
    }

    /**
     * Handles uploading a save file to the server to check it.
     * @param {File} file - The file to upload.
     * @returns {Boolean} - True if the upload was a success. False if not.
     */
    async handleChooseSaveFile(file)
    {
        if (!this.isValidSaveFile(file))
        {
            await this.setState({fileUploadError: true, serverConnectionError: false});
            return false;
        }
        else
        {
            await this.setState({selectedSaveFile: file, fileUploadError: false, serverConnectionError: false});
            return await this.handleUpload(true);
        }
    }

    /**
     * Handles the user's choice of a Home data file.
     * @param {Object} e - The file upload event.
     * @param {String} errorMsg - An error message to display in the pop-up if the upload fails due to a bad file.
     */
    async chooseHomeFile(e, errorMsg)
    {
        var file = e.target.files[0];
        if (file == null) //Cancelled the file upload
            return;

        if (!(await this.handleChooseHomeFile(file))
        && !this.state.serverConnectionError
        && !this.state.mismatchedRandomizerError)
        {
            PopUp.fire
            ({
                icon: "error",
                title: "Problem With Cloud File",
                html: errorMsg,
                scrollbarPadding: false,
            });
        }
    }

    /**
     * Handles uploading a Home data file to the server to check it.
     * @param {File} file - The file to upload.
     * @returns {Boolean} - True if the upload was a success. False if not.
     */
    async handleChooseHomeFile(file)
    {
        if (!this.isValidHomeFileName(file.name.toLowerCase()))
        {
            await this.setState({fileUploadError: true, serverConnectionError: false});
            return false;
        }
        else
        {
            await this.setState({selectedHomeFile: file, fileUploadError: false, serverConnectionError: false});
            return await this.handleUpload(false); //Upload immediately
        }
    }

    /**
     * Checks if last saved Home data exists based on the user's save file.
     * @returns {Boolean} True if the user can load last saved home data. False if not.
     */
    existsLastSavedHomeData()
    {
        if (this.state.isRandomizedSave)
        {
            return "lastSavedRandomizerHomeData" in localStorage
                && localStorage.lastSavedRandomizerHomeData != null
                && localStorage.lastSavedRandomizerHomeData !== "";
        }
        else
        {
            return "lastSavedHomeData" in localStorage
                && localStorage.lastSavedHomeData != null
                && localStorage.lastSavedHomeData !== "";
        }
    }

    /**
     * Handles the user's choice to use the Home data file stored in the local storage.
     * @param {String} errorMsg - An error message to display in the pop-up if the upload fails due to a bad file.
     */
    async useLastSavedHomeFile(errorMsg)
    {
        const formData = new FormData(); //formData contains the Home boxes
        var homeData = (this.state.isRandomizedSave) ? localStorage.lastSavedRandomizerHomeData : localStorage.lastSavedHomeData;
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
                onUploadProgress: (progressEvent) => this.updateUploadProgress(progressEvent, false)
            });
        }
        catch (error)
        {
            //Some error occurred
            var newState = STATE_UPLOAD_HOME_FILE;
            await this.handleUploadError(error, newState);

            if (!this.state.serverConnectionError) //Pop-up would have already played for this
            {
                PopUp.fire
                ({
                    icon: "error",
                    title: "Problem With Last Cloud File",
                    html: errorMsg,
                    scrollbarPadding: false,
                });
            }

            return;
        }

        if ((this.state.isRandomizedSave && res.data.randomizer)
        || (!this.state.isRandomizedSave && !res.data.randomizer))
        {
            //Accepted, no error occurred
            console.log("Last home file upload successful.");

            this.setState({
                editState: STATE_MOVING_POKEMON,
                homeBoxes: res.data.boxes,
                homeTitles: res.data.titles,
            });

            this.wipeErrorMessage();
        }
        else
        {
            await this.printMismatchedRandomizerError();
        }
    }

    /**
     * Handles the user's upload of a save file or Home data file.
     * @param {Boolean} isSaveFile - True if a save file is being uploaded. False if a Home data file is being uploaded.
     * @returns {Boolean} - True if the upload was a success. False if not.
     */
    async handleUpload(isSaveFile)
    {
        var file = isSaveFile ? this.state.selectedSaveFile : this.state.selectedHomeFile;
        var route = `${config.dev_server}/${isSaveFile ? "uploadSaveFile" : "uploadHomeData"}`;
        var isUsingFileHandles = (isSaveFile && this.state.saveFileHandle != null)
                             || (!isSaveFile && this.state.homeFileHandle != null); //Using modern FileSystem API

        const formData = new FormData(); //formData contains the file to be sent to the server
        formData.append("file", file);
        formData.append("isSaveFile", isSaveFile);

        this.setState
        ({
            editState: isSaveFile ? STATE_UPLOADING_SAVE_FILE : STATE_UPLOADING_HOME_FILE,
            uploadProgress: BLANK_PROGRESS_BAR, //Update here in case the connection has been lost
        });

        let res;
        try
        {
            res = await axios.post(route, formData,
            {
                onUploadProgress: (progressEvent) => this.updateUploadProgress(progressEvent, isSaveFile)
            });
        }
        catch (error)
        {
            //Some error occurred
            let errorShouldBlockUser = !isUsingFileHandles || isSaveFile; //Home file errors are ignored when using file handles

            if (errorShouldBlockUser)
            {
                var newState = (isUsingFileHandles) ? STATE_CHOOSE_SAVE_HANDLE : (isSaveFile) ? STATE_UPLOAD_SAVE_FILE : STATE_UPLOAD_HOME_FILE;
                await this.handleUploadError(error, newState);
            }

            if (isUsingFileHandles && !isSaveFile) //isHomeFileHandle
                this.setState({homeFileHandle: null}); //Remove any if they were there already (since it's corrupt)

            return false;
        }

        //Accepted, no error occurred
        if (isSaveFile)
        {
            console.log("Save file upload successful.");
            await this.setSaveBoxesFromResponse(res);

            if (!localStorage.displayedRandomizerInfo)
                this.tryPrintRandomizerNoticePopUp();

            if (isUsingFileHandles)
            {
                //Upload the standard name for a cloud file if it exists
                //If it doesn't or there's an error, just use a blank new home file
                try
                {
                    let homeFileHandle = await this.findFileHandleWithNameInDirHandle(this.getHomeFileName(), this.state.homeDirHandle);
                    if (homeFileHandle != null) //Home file has already been created
                    {
                        await this.setState({homeFileHandle: homeFileHandle});
                        if (!(await this.handleChooseHomeFile(await homeFileHandle.getFile()))
                        && !this.state.mismatchedRandomizerError)
                        {
                            //Site can still be used, but warn user
                            PopUp.fire
                            ({
                                icon: "warning",
                                title: "Cloud Data Corrupt",
                                html: "The Cloud data found was corrupt. If you did not tamper with the file, please report this to Skeli at once.",
                                scrollbarPadding: false,
                            });
                        }
                    }
                    else
                    {
                        this.setState({homeTitles: this.generateBlankHomeTitles()}); //In case they need updating for a randomizer
                    }
                }
                catch (e)
                {
                    //Site can't be used at all
                    console.log(`Error uploading last Cloud directory: ${this.state.homeDirHandle.name} was not found.`);
                    PopUp.fire
                    ({
                        icon: "error",
                        title: "Last Cloud Folder Not Found",
                        html: `The folder "${this.state.homeDirHandle.name}" has likely been moved or renamed since it was last used.`,
                        scrollbarPadding: false,
                    }).then(async () =>
                    {
                        await SetDBVal("cloudDirectory", null); //Prevent user from picking it again
                        window.location.reload(); //Force a reload because normally wouldn't stop for a missing cloud file
                    });
                }

                this.setState({editState: STATE_MOVING_POKEMON});
                localStorage.visitedBefore = true; //Set cookie now
            }
            else
            {
                this.setState({editState: STATE_UPLOAD_HOME_FILE});
            }

            this.wipeErrorMessage();
        }
        else //Home File
        {
            console.log("Home file upload successful.");

            if ((this.state.isRandomizedSave && res.data.randomizer)
            || (!this.state.isRandomizedSave && !res.data.randomizer))
            {
                this.setState
                ({
                    editState: (!isUsingFileHandles) ? STATE_MOVING_POKEMON : this.state.editState, //Uploading a home file handle doesn't change the edit state (updated above in the call stack)
                    homeBoxes: res.data.boxes,
                    homeTitles: res.data.titles,
                });

                this.wipeErrorMessage();

                if (!isUsingFileHandles)
                    localStorage.visitedBefore = true; //Set cookie now
            }
            else
            {
                await this.printMismatchedRandomizerError(isUsingFileHandles);
                return false;
            }
        }

        return true;
    }

    /**
     * Adds the Home boxes to form data for sending to the server.
     * @param {Array} homeData - The Home boxes to send to the server.
     * @param {Object} formData - The object used to send them to the server.
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
     * Updates the upload status during a file upload.
     * @param {Object} progressEvent - An object containing the current state of the upload.
     * @param {Boolean} isSaveFile - True if a save file is being uploaded. False if a Home data file is being uploaded.
     */
    updateUploadProgress(progressEvent, isSaveFile)
    {
        if (progressEvent.loaded <= 0 || progressEvent.total <= 0) //Faulty numbers
            return;

        var progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);

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

    /**
     * Sets the state of for the save Boxes after the server processes the save file.
     * @param {Object} res - The response from the server.
     */
    async setSaveBoxesFromResponse(res)
    {
        await this.setState
        ({
            saveBoxes: res.data.boxes,
            saveTitles: res.data.titles,
            saveGameId: res.data.gameId,
            saveBoxCount: res.data.boxCount,
            isRandomizedSave: res.data.randomizer,
            saveFileNumber: res.data.fileIdNumber,
            saveFileData: res.data.saveFileData,
        });
    }

    /**
     * Displays an error pop-up and updates the state after a failed file upload.
     * @param {Object} error - The error object after the server request completed.
     * @param {Number} newState - The new editState.
     */
    async handleUploadError(error, newState)
    {
        var errorText;
        console.log("An error occurred uploading the file.");

        if (error.message === "Network Error")
        {
            console.log("Could not connect to the server.");

            await this.setState({
                editState: newState,
                fileUploadError: false,
                serverConnectionError: true,
            });

            errorText = "Couldn't connect!\nPlease try again later.";
        }
        else
        {
            console.log(error["response"]["data"]);

            await this.setState({
                editState: newState,
                fileUploadError: true,
                serverConnectionError: false,
            });

            errorText = "Server error!\nPlease try again later."; //Will usually be overwritten with a more specific error
        }

        PopUp.fire
        ({
            icon: 'error',
            title: errorText,
            scrollbarPadding: false,
        });
    }

    /**
     * Displays an error pop-up after a failed save file upload.
     */
    printSaveFileUploadError()
    {
        PopUp.fire
        ({
            icon: "error",
            title: "Unacceptable Save File",
            text: "Make sure it's a save file for a supported ROM Hack and is not corrupted.",
            confirmButtonText: "Which ROM Hacks are supported?",
            scrollbarPadding: false,
        }).then((result) =>
        {
            if (result.isConfirmed)
            {
                let supportedHacks = [];
    
                for (let hack of SUPPORTED_HACKS)
                    supportedHacks.push(`<li>${hack}</li>`);
    
                supportedHacks = supportedHacks.toString().replaceAll(",", "");
                PopUp.fire
                ({
                    title: "Supported Hacks",
                    html: `<ul style="text-align: left">${supportedHacks}</ul>`,
                });
            }
        });
    }

    /**
     * Displays an error pop-up when the user tries uploading a Cloud file incompatible with the
     * save file due to a difference in randomizers.
     */
    async printMismatchedRandomizerError(isUsingFileHandles)
    {
        let text;

        if (this.state.isRandomizedSave)
            text = "The Cloud file uploaded is for regular saves.<br/>Please upload a Cloud data file created for randomized saves."
        else
            text = "The Cloud file uploaded is for randomized saves.<br/>Please upload a Cloud data file created for regular saves."

        await this.setState({mismatchedRandomizerError: true}); //Prevent the pop-up from showing up for file handles

        console.log("Home file randomizer doesn't match save randomizer.");
        PopUp.fire
        ({
            icon: "warning",
            title: "Cloud File Randomizer Mismatch",
            html: text,
            scrollbarPadding: false,
        }).then(() =>
        {
            if (isUsingFileHandles)
                window.location.reload() //Force reload page afterwards
            else
                this.setState({editState: STATE_UPLOAD_HOME_FILE});
        });
    }

    /**
     * Displays a pop-up when the user uploads a randomized save file for the first time.
     */
    tryPrintRandomizerNoticePopUp()
    {
        if (this.state.isRandomizedSave)
        {
            PopUp.fire
            ({
                icon: "warning",
                title: "A Note About Randomizers",
                text: "Please be aware that save files with randomizers active use separate Cloud data files.",
                confirmButtonText: "I Understand",
                scrollbarPadding: false,
                allowOutsideClick: false,
            });

            localStorage.displayedRandomizerInfo = true;
        }
    }


    /**********************************
        Modern File Handle Functions   
    **********************************/

    /**
     * Gets read/write permission for a given file or directory handle.
     * @param {FileSystemHandle} handle - The file or directory handle to request read/write permission for.
     * @returns {Boolean} True if the user gave permission. False otherwise.
     */
    async getFileHandlePermission(handle)
    {
        var opts = {mode: "readwrite"};
        var granted = "granted";

        return ((await handle.queryPermission(opts)) === granted)
            || ((await handle.requestPermission(opts)) === granted);
    }

    /**
     * Let's the user choose the directory where to save their Home data.
     * Requires the modern FileSystem API to function.
     */
    async chooseHomeFileDirectory()
    {
        try
        {
            var dirHandle = await window.showDirectoryPicker({startIn: "documents"});

            if (!(await this.getFileHandlePermission(dirHandle)))
                throw(new Error("Home directory write permission denied by user."));

            await SetDBVal("cloudDirectory", dirHandle); //Remember user's choice for the last used button
            localStorage.mostRecentHomeDir = dirHandle.name;

            this.wipeErrorMessage();
            this.setState
            ({
                editState: STATE_CHOOSE_SAVE_HANDLE,
                homeDirHandle: dirHandle,
            });
        }
        catch (e)
        {
            console.log(`Failed to pick Home directory: ${e}`);

            PopUp.fire
            ({
                icon: "error",
                title: "Cloud Folder Not Chosen",
                html: `<p>If you already have a Cloud storage file, then pick the folder with the <b>${this.getHomeFileName()}</b> file.</p>`,
                scrollbarPadding: false,
            });
        }
    }

    /**
     * Uses the user's previous choice of Home data directory.
     * Requires the modern FileSystem API to function.
     */
    async useMostRecentHomeDirectoryHandle()
    {
        var dirHandle = this.state.homeDirHandle;

        try
        {
            if (dirHandle == null)
                throw(new Error("homeDirHandle is null.")); //Button shouldn't be shown anyway

            if (!(await this.getFileHandlePermission(dirHandle)))
                throw(new Error("Home directory read/write permission denied by user."));

            this.wipeErrorMessage();
            this.setState
            ({
                editState: STATE_CHOOSE_SAVE_HANDLE,
                homeDirHandle: dirHandle,
            });
        }
        catch (e)
        {
            var errorTitle, errorText;
            console.log(`Failed to pick last Home directory: ${e}`);

            if (e.message != null && e.message === "A requested file or directory could not be found at the time an operation was processed.")
            {
                errorTitle = "Cloud Folder Not Found";
                errorText = `${dirHandle.name} could not be located.`;
            }
            else
            {
                errorTitle = "Permission Not Given";
                errorText = "Make sure to give full permissions to view and edit your Cloud data file's folder.";
            }

            PopUp.fire
            ({
                icon: "error",
                title: errorTitle,
                text: errorText,
                scrollbarPadding: false,
            });
        }
    }

    /**
     * Let's the user pick their save file and requests full permissions over it.
     * Requires the modern FileSystem API to function.
     */
    async chooseSaveFileHandle()
    {
        const saveFilePickerOptions =
        {
            types: [
                {
                    description: 'Save Files',
                    accept: {
                        "application/octet-stream": [".sav", ".srm", ".sa1"]
                    },
                },
            ],
            excludeAcceptAllOption: true, //Must match one of the given file types, but won't be enforced by the file picker
        };

        try
        {
            var [fileHandle] = await window.showOpenFilePicker(saveFilePickerOptions);

            if (!(await this.getFileHandlePermission(fileHandle)))
                throw(new Error("Save file write permission denied by user."));

            await SetDBVal("saveFile", fileHandle); //Remember user's choice for the last used button
            localStorage.mostRecentSaveFile = fileHandle.name;

            await this.useSaveHandle(fileHandle);
        }
        catch (e)
        {
            console.log(`Failed to pick save file: ${e}`);

            PopUp.fire
            ({
                icon: "error",
                title: "Save File Not Chosen",
                text: "Choose your ROM's save file and make sure to give full permissions to view and edit it.",
                scrollbarPadding: false,
            });
        }
    }

    /**
     * Uses the user's previous choice of save file.
     * Requires the modern FileSystem API to function.
     */
    async useMostRecentSaveHandle()
    {
        var fileHandle = this.state.saveFileHandle;

        try
        {
            if (fileHandle == null)
                throw(new Error("saveFileHandle is null.")); //This button shouldn't be visible anyway

            if (!(await this.getFileHandlePermission(fileHandle)))
                throw(new Error("Save file read/write permission denied by user."));

            await this.useSaveHandle(fileHandle);
        }
        catch (e)
        {
            var errorTitle, errorText;
            console.log(`Failed to pick last save file: ${e}`);

            if (e.message != null && e.message === "A requested file or directory could not be found at the time an operation was processed.")
            {
                errorTitle = "Save File Not Found";
                errorText = `${fileHandle.name} could not be located.`;
            }
            else
            {
                errorTitle = "Permission Not Given";
                errorText = "Make sure to give full permissions to view and edit your save file.";
            }

            PopUp.fire
            ({
                icon: "error",
                title: errorTitle,
                text: errorText,
                scrollbarPadding: false,
            });
        }
    }

    /**
     * Uploads a save file handle's data to the server and sets the save data.
     * @param {FileSystemFileHandle} fileHandle - The save file handle to use.
     */
    async useSaveHandle(fileHandle)
    {
        this.wipeErrorMessage(); //In preparation for uploading the file
        await this.setState({saveFileHandle: fileHandle});
        if (await this.uploadSaveFileHandle()) //True if file uploaded successfully
            this.wipeErrorMessage();
        else if (this.state.fileUploadError)
            this.printSaveFileUploadError();
    }

    /**
     * Uploads the state's save file handle's data to the server.
     * @returns {Boolean} - True if the upload completed successfully. False otherwise.
     */
    async uploadSaveFileHandle()
    {
        var file = await this.state.saveFileHandle.getFile();

        if (!this.isValidSaveFile(file))
        {
            PopUp.fire
            ({
                icon: "error",
                title: "Invalid Save File",
                text: "Please upload an actual save file.",
                scrollbarPadding: false,
            });

            return false;
        }
        else
            return await this.handleChooseSaveFile(file);
    }

    /**
     * Gets the file handle of a certain file in a directory.
     * @param {String} name - The name of the file to look for.
     * @param {FileSystemDirectoryHandle} dirHandle - The directory handle of the directory to search in.
     * @returns {FileSystemFileHandle} - The file handle if found. Null otherwise.
     */
    async findFileHandleWithNameInDirHandle(name, dirHandle)
    {
        for await (const file of dirHandle.values())
        {
            if (file.name === name)
                return file;
        }

        return null;
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
     * @param {Number} fromBoxSlot - The box slot of the box the Pokemon is being moved from.
     * @param {Number} fromOffset - The offset in the "from" set of boxes the Pokemon was being moved from.
     * @param {Number} toBoxSlot - The box slot of the box the Pokemon is being moved to.
     * @param {Object} duplicateData - The offset in the "to" set of boxes the Pokemon was being moved to.
     */
    setDuplicatePokemonSwappingError(fromBoxSlot, fromOffset, toBoxSlot, duplicateData)
    {
        var errorMessage = ["", ""];
        var impossibleTo =   this.generateBlankImpossibleMovementArray();
        var impossibleFrom = this.generateBlankImpossibleMovementArray();
        var impossibleMovement = [null, null];
        var selectedMonPos = this.state.selectedMonPos;
        var fromPos = GetLocalBoxPosFromBoxOffset(fromOffset);
        var toPos = GetLocalBoxPosFromBoxOffset(duplicateData.offset);

        var boxName = this.getTitlesByBoxSlot(toBoxSlot)[duplicateData.boxNum];
        impossibleFrom[GetBoxPosBoxRow(fromPos)][GetBoxPosBoxColumn(fromPos)] = true;
        if (duplicateData.boxNum === this.state.currentBox[toBoxSlot]) //Only display red if that box is being viewed
            impossibleTo[GetBoxPosBoxRow(toPos)][GetBoxPosBoxColumn(toPos)] = true;

        impossibleMovement[toBoxSlot] = impossibleTo;
        impossibleMovement[fromBoxSlot] = impossibleFrom;
        errorMessage[toBoxSlot] = `A duplicate is in ${boxName}.`;

        if (impossibleMovement[0] == null)
            impossibleMovement[0] = this.generateBlankImpossibleMovementArray();
        else if (impossibleMovement[1] == null)
            impossibleMovement[1] = this.generateBlankImpossibleMovementArray();

        selectedMonPos[toBoxSlot] = CreateSingleBlankSelectedPos(); //Undo selections just clicked on

        this.setState({
            selectedMonPos: selectedMonPos,
            errorMessage: errorMessage,
            impossibleMovement: impossibleMovement,
        });
    }

    /**
     * Sets the error message for a Pokemon holding a banned item being moved to a Home box.
     * @param {Pokemon} pokemon - The Pokemon holding the banned item.
     * @param {Number} fromOffset - The offset in the "from" set of boxes the Pokemon was being moved from.
     * @param {Number} fromBoxSlot - The box slot of the box the Pokemon is being moved from.
     * @param {Number} toBoxSlot - The box slot of the box the Pokemon is being moved to.
     */
    setBannedItemError(pokemon, fromOffset, fromBoxSlot, toBoxSlot)
    {
        var errorMessage = ["", ""];
        var impossibleFrom = this.generateBlankImpossibleMovementArray();
        var impossibleMovement = [null, null];
        var selectedMonPos = this.state.selectedMonPos;
        var fromPos = GetLocalBoxPosFromBoxOffset(fromOffset);

        impossibleFrom[GetBoxPosBoxRow(fromPos)][GetBoxPosBoxColumn(fromPos)] = true;
        impossibleMovement[fromBoxSlot] = impossibleFrom;
        errorMessage[fromBoxSlot] = `The ${GetItemName(GetItem(pokemon))} can't be stored.`;

        if (impossibleMovement[0] == null)
            impossibleMovement[0] = this.generateBlankImpossibleMovementArray();
        else if (impossibleMovement[1] == null)
            impossibleMovement[1] = this.generateBlankImpossibleMovementArray();

        selectedMonPos[toBoxSlot] = CreateSingleBlankSelectedPos(); //Undo selections just clicked on

        this.setState({
            selectedMonPos: selectedMonPos,
            errorMessage: errorMessage,
            impossibleMovement: impossibleMovement,
        });
    }

    /**
     * Sets the error message for a Pokemon not existing in the save game being moved to the save box.
     * @param {Pokemon} pokemon - The Pokemon that doesn't exist in the save hack.
     * @param {Number} fromOffset - The offset in the "from" set of boxes the Pokemon was being moved from.
     * @param {Number} fromBoxSlot - The box slot of the box the Pokemon is being moved from.
     * @param {Number} toBoxSlot - The box slot of the box the Pokemon is being moved to.
     */
    setNonExistentSpeciesError(pokemon, fromOffset, fromBoxSlot, toBoxSlot)
    {
        var errorMessage = ["", ""];
        var impossibleFrom = this.generateBlankImpossibleMovementArray();
        var impossibleMovement = [null, null];
        var selectedMonPos = this.state.selectedMonPos;
        var fromPos = GetLocalBoxPosFromBoxOffset(fromOffset);

        impossibleFrom[GetBoxPosBoxRow(fromPos)][GetBoxPosBoxColumn(fromPos)] = true;
        impossibleMovement[fromBoxSlot] = impossibleFrom;

        if (this.getBoxTypeByBoxSlot(toBoxSlot) === BOX_HOME)
        {
            //Error placing randomized Pokemon in the cloud storage
            errorMessage[fromBoxSlot] = "A randomized Pokémon can't be stored."; //Intentionally fromBoxSlot
        }
        else
        {
            if (IsEgg(pokemon))
                errorMessage[toBoxSlot] = "The Egg's Pokémon doesn't exist in this game.";
            else
                errorMessage[toBoxSlot] = `${GetSpeciesName(GetSpecies(pokemon))} doesn't exist in this game.`;
        }

        if (impossibleMovement[0] == null)
            impossibleMovement[0] = this.generateBlankImpossibleMovementArray();
        else if (impossibleMovement[1] == null)
            impossibleMovement[1] = this.generateBlankImpossibleMovementArray();

        selectedMonPos[toBoxSlot] = CreateSingleBlankSelectedPos(); //Undo selections just clicked on

        this.setState({
            selectedMonPos: selectedMonPos,
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
                    let holdingBannedItem =
                        this.cantBePlacedInBoxBecauseOfBannedItem(leftBoxes[leftOffset], rightBoxType);

                    let doesntExistInGame =
                        this.cantBePlacedInBoxBecauseOfNonExistentSpecies(leftBoxes[leftOffset], rightBoxType);
        
                    if (alreadyExistsRet.boxNum >= 0)
                    {
                        this.setDuplicatePokemonSwappingError(BOX_SLOT_LEFT, leftOffset, BOX_SLOT_RIGHT, alreadyExistsRet);
                        return;
                    }
                    else if (holdingBannedItem)
                    {
                        this.setBannedItemError(leftBoxes[leftOffset], leftOffset, BOX_SLOT_LEFT, BOX_SLOT_RIGHT);
                        return;
                    }
                    else if (doesntExistInGame)
                    {
                        this.setNonExistentSpeciesError(leftBoxes[leftOffset], leftOffset, BOX_SLOT_LEFT, BOX_SLOT_RIGHT);
                        return;
                    }
                    else
                    {
                        //Check if mon already exists in the left boxes
                        alreadyExistsRet =
                            this.monAlreadyExistsInBoxes(rightBoxes[rightOffset], leftBoxes, this.getBoxAmountByBoxSlot(BOX_SLOT_LEFT),
                                                        (leftBoxType === rightBoxType) ? rightOffset : -1); //Ignore the mon being moved
                        holdingBannedItem =
                            this.cantBePlacedInBoxBecauseOfBannedItem(rightBoxes[rightOffset], leftBoxType);

                        doesntExistInGame =
                            this.cantBePlacedInBoxBecauseOfNonExistentSpecies(rightBoxes[rightOffset], leftBoxType);
            
                        if (alreadyExistsRet.boxNum >= 0)
                        {
                            this.setDuplicatePokemonSwappingError(BOX_SLOT_RIGHT, rightOffset, BOX_SLOT_LEFT, alreadyExistsRet);
                            return;
                        }
                        else if (holdingBannedItem)
                        {
                            this.setBannedItemError(rightBoxes[rightOffset], rightOffset, BOX_SLOT_RIGHT, BOX_SLOT_LEFT);
                            return;
                        }
                        else if (doesntExistInGame)
                        {
                            this.setNonExistentSpeciesError(rightBoxes[rightOffset], rightOffset, BOX_SLOT_RIGHT, BOX_SLOT_LEFT);
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
                var fromBoxType = this.getBoxTypeByBoxSlot(multiFrom);
                var toBoxType = this.getBoxTypeByBoxSlot(multiTo);

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
                        let holdingBannedItem =
                            this.cantBePlacedInBoxBecauseOfBannedItem(pokemon, toBoxType);

                        let doesntExistInGame =
                            this.cantBePlacedInBoxBecauseOfNonExistentSpecies(pokemon, toBoxType);
            
                        if (alreadyExistsRet.boxNum >= 0)
                        {
                            this.setDuplicatePokemonSwappingError(multiFrom, offset, multiTo, alreadyExistsRet);
                            return;
                        }
                        else if (holdingBannedItem)
                        {
                            this.setBannedItemError(pokemon, offset, multiFrom, multiTo);
                            return;
                        }
                        else if (doesntExistInGame)
                        {
                            this.setNonExistentSpeciesError(pokemon, offset, multiFrom, multiTo);
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

                    changeWasMade[toBoxType] = true;
                    changeWasMade[fromBoxType] = true;
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

        if (icon != null)
        {
            icon.style.visibility = "initial";
            icon.style.left = e.pageX - (68 / 2) + 'px'; //Follow the mouse
            icon.style.top = e.pageY - (56 / 2) + 'px';
            this.setState({draggedAtLeastOnce: true}); //Icon is now attached to mouse
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
        if (icon != null)
        {
            icon.style.visibility = "initial";
            icon.style.left = x - (68 / 2) + 'px'; //Follow the finger
            icon.style.top = y - (56 / 2) + 'px';
        }

        //Update hovering over
        var element = document.elementFromPoint(x, y);
        if (element != null && element.className !== undefined && !element.className.includes("box-icon"))
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
        && !this.isMonInWonderTrade(this.getBoxTypeByBoxSlot(this.state.draggingToBox), toOffset)
        && GetIconSpeciesName(this.getMonAtBoxPos(this.state.draggingToBox, toOffset)) !== "unknown") //Potentially unofficial species from a certain hack
        {
            let alreadyExistsRet =
                this.monAlreadyExistsInBoxes(fromBoxes[fromOffset], toBoxes, this.getBoxAmountByBoxSlot(this.state.draggingToBox),
                                            (fromBoxType === toBoxType) ? fromOffset : -1); //Ignore the mon being moved
            let holdingBannedItem =
                this.cantBePlacedInBoxBecauseOfBannedItem(fromBoxes[fromOffset], toBoxType);

            let doesntExistInGame =
                this.cantBePlacedInBoxBecauseOfNonExistentSpecies(fromBoxes[fromOffset], toBoxType);

            if (alreadyExistsRet.boxNum >= 0)
            {
                this.setDuplicatePokemonSwappingError(this.state.draggingFromBox, fromOffset, this.state.draggingToBox, alreadyExistsRet);
            }
            else if (holdingBannedItem)
            {
                this.setBannedItemError(fromBoxes[fromOffset], fromOffset, this.state.draggingFromBox, this.state.draggingToBox);
            }
            else if (doesntExistInGame)
            {
                this.setNonExistentSpeciesError(fromBoxes[fromOffset], fromOffset, this.state.draggingFromBox, this.state.draggingToBox);
            }
            else
            {
                alreadyExistsRet =
                    this.monAlreadyExistsInBoxes(toBoxes[toOffset], fromBoxes, this.getBoxAmountByBoxSlot(this.state.draggingToBox),
                                                (fromBoxType === toBoxType) ? toOffset : -1); //Ignore the mon being moved
                holdingBannedItem =
                    this.cantBePlacedInBoxBecauseOfBannedItem(toBoxes[toOffset], fromBoxType);

                doesntExistInGame =
                    this.cantBePlacedInBoxBecauseOfNonExistentSpecies(toBoxes[toOffset], fromBoxType);
    
                if (alreadyExistsRet.boxNum >= 0)
                {
                    this.setDuplicatePokemonSwappingError(this.state.draggingToBox, toOffset, this.state.draggingFromBox, alreadyExistsRet);
                }
                else if (holdingBannedItem)
                {
                    this.setBannedItemError(toBoxes[toOffset], toOffset, this.state.draggingToBox, this.state.draggingFromBox);
                }
                else if (doesntExistInGame)
                {
                    this.setNonExistentSpeciesError(toBoxes[toOffset], toOffset, this.state.draggingToBox, this.state.draggingFromBox);
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
            draggedAtLeastOnce: false,
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

    /**
     * Either opens or closes the Friend Trade screen.
     */
    startFriendTrade()
    {
        if (this.state.inFriendTrade)
            this.tryResetFriendTradeState();
        else if (CanUseFileHandleAPI() && this.state.changeWasMade.some((x) => x)) //Some boxes aren't saved
        {
            //Force a save
            PopUp.fire
            ({
                icon: 'warning',
                title: "Your data must be saved before starting a trade.",
                confirmButtonText: "OK, Save It",
                cancelButtonText: "I'll Do It Myself",
                showCancelButton: true,
                scrollbarPadding: false,
            }).then((result) =>
            {
                if (result.isConfirmed)
                    this.trySaveAndExit();
            });

            return;
        }

        this.setState({inFriendTrade: !this.state.inFriendTrade});
        this.resetStateForStartingFriendTrade(false);
        this.wipeErrorMessage();
    }

    /**
     * Resets the state variables needed to be blank when starting a Friend Trade.
     * @param {Boolean} keepOldTradeData - True if the tradeData state variable should be retained. False if it can be wiped too.
     */
    resetStateForStartingFriendTrade(keepOldTradeData)
    {
        var tradeData = (keepOldTradeData) ? this.state.tradeData : null;

        this.setState
        ({
            selectedMonBox: [0, 0],
            selectedMonPos: this.generateBlankSelectedPos(),
            summaryMon: [null, null],
            livingDexState: [0, 0],
            searchCriteria: [null, null],
            tradeData: tradeData,
            viewingBoxList: -1,
            draggingMon: -1,
        });
    }

    /**
     * Tries to disconnect from the Friend Trade socket and reset the state changed by it.
     */
    tryResetFriendTradeState()
    {
        if (this.state.tradeData != null)
        {
            PopUp.fire
            ({
                title: `Going back now will disconnect you from the trade!\nAre you sure you want to go back?`,
                denyButtonText: `Stop Trading`,
                cancelButtonText: `Cancel`,
                showDenyButton: true, //Red button
                showCancelButton: true,
                showConfirmButton: false,
                icon: 'warning',
                scrollbarPadding: false,
            }).then((result) =>
            {
                if (result.isDenied)
                {
                    this.state.tradeData.socket.off("disconnect"); //Prevents disconnected pop-up from showing
                    this.state.tradeData.socket.close();
                    this.setState
                    ({
                        inFriendTrade: false,
                        tradeData: null,
                        pokemonToTrade: null,
                    });
                }
            });
        }
        else
        {
            this.setState
            ({
                inFriendTrade: false,
                pokemonToTrade: null,
            });
        }
    }


    /**********************************
          Living Pokedex Functions     
    **********************************/

    /**
     * Arranges the species in the Home boxes to satisfy the living Pokedex order.
     * @param {Array <String>} speciesList - The list of species ids to arrange Pokemon into.
     * @param {Boolean} compareDexNums - True if the Pokemon should be compared by their Pokedex numbers. False if directly by species id.
     */
    async fixLivingDex(speciesList, compareDexNums)
    {
        var i;
        var newBoxes = this.generateBlankHomeBoxes();
        var speciesIndexDict = {};
        var freeSlot = speciesList.length;

        //First build a hash table for quick access
        if (compareDexNums)
        {
            for (i = 0; i < speciesList.length; ++i)
                speciesIndexDict[gSpeciesToDexNum[speciesList[i]]] = i;
        }
        else
        {
            for (i = 0; i < speciesList.length; ++i)
                speciesIndexDict[speciesList[i]] = i;
        }

        //Then move any Pokemon that are already placed after where the living dex would end
        //This ensures those Pokemon at least may remain in their positions
        for (i = speciesList.length; i < this.state.homeBoxes.length; ++i)
            newBoxes[i] = this.state.homeBoxes[i];

        //Then move the Pokemon that are in the living dex area
        for (i = 0; i < speciesList.length; ++i)
        {
            let pokemon = this.state.homeBoxes[i]
            let species = GetSpecies(pokemon);
            let inDict = (compareDexNums) ? species in gSpeciesToDexNum && gSpeciesToDexNum[species] in speciesIndexDict : species in speciesIndexDict;

            if (inDict)
            {
                let index = (compareDexNums) ? speciesIndexDict[gSpeciesToDexNum[species]] : speciesIndexDict[species];
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
            let inDict = (compareDexNums) ? species in gSpeciesToDexNum && gSpeciesToDexNum[species] in speciesIndexDict : species in speciesIndexDict;
    
            if (inDict)
            {
                let index = (compareDexNums) ? speciesIndexDict[gSpeciesToDexNum[species]] : speciesIndexDict[species];
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
     * Downloads any updated data.
     * @returns {Boolean} True if the save completed successfully. False if it did not.
     */
    async downloadSaveFileAndHomeData()
    {
        var encryptedHomeData = null;
        var dataBuffer = null;
        var serverConnectionErrorMsg = <span>Could not connect to the server.<br/>DO NOT RELOAD THE PAGE!</span>;
        this.wipeErrorMessage();

        //Get Encrypted Home File
        if (this.state.changeWasMade[BOX_HOME]) //Don't waste time if there's no updated version
        {
            this.printSavingPopUp("Preparing Cloud data...");
            encryptedHomeData = await this.getEncryptedHomeFile(serverConnectionErrorMsg);
            if (encryptedHomeData == null)
                return false;
        }

        //Get Updated Save File
        if (this.state.changeWasMade[BOX_SAVE]) //Don't waste time if there's no updated version
        {
            this.printSavingPopUp("Preparing Save data...");
            dataBuffer = await this.getUpdatedSaveFile(serverConnectionErrorMsg);
            if (dataBuffer == null)
                return false;
        }

        //Download the Save Data (done first because more likely to be problematic)
        if (this.state.changeWasMade[BOX_SAVE])
        {
            this.printSavingPopUp("Downloading Save data...");
            if (!(await this.downloadSaveFile(dataBuffer))) //Couldn't save because file probably in use
                return false;
        }

        //Download the Home Data
        if (this.state.changeWasMade[BOX_HOME])
        {
            this.printSavingPopUp("Downloading Cloud data...");
            if (!(await this.downloadHomeData(encryptedHomeData))) //Couldn't save because file missing
                return false;
        }

        this.setState({savingMessage: "", isSaving: false, changeWasMade: [false, false]});
        return true;
    }

    /**
     * Displays a pop-up while saving is in progress.
     * @param {String} text - The text to display in the pop-up.
     */
    printSavingPopUp(text)
    {
        this.setState({savingMessage: text, isSaving: true}, () =>
        {
            PopUp.fire
            ({
                title: text,
                allowOutsideClick: false,
                scrollbarPadding: false,
                didOpen: () =>
                {
                    PopUp.showLoading();
                }
            });
        })
    }

    /**
     * Gets the encrypted version of the Home boxes from the server.
     * @param {String} serverConnectionErrorMsg - The message to display if the server couldn't be connected to.
     * @returns {String} The encrypted Home data text.
     */
    async getEncryptedHomeFile(serverConnectionErrorMsg)
    {
        var res;
        var homeRoute = `${config.dev_server}/encryptHomeData`;
        var formData = new FormData(); //formData contains the home data split into four parts to guarantee it'll all be sent
        var homeData = JSON.stringify
        ({
            titles: this.state.homeTitles,
            boxes: this.state.homeBoxes,
            randomizer: this.state.isRandomizedSave,
            version: 2, //No version was in the original tester release
        });

        this.addHomeDataToFormData(homeData, formData);

        try
        {
            res = await axios.post(homeRoute, formData, {});
        }
        catch (error)
        {
            let errorMsg = (error.message === "Network Error") ? serverConnectionErrorMsg : error.response.data;
            console.log(`Error saving Home data: ${errorMsg}`);
            this.setState({savingMessage: errorMsg});
            return null;
        }

        return res.data.newHomeData;   
    }

    /**
     * Gets the updated save file data after processing on the server.
     * @param {String} serverConnectionErrorMsg - The message to display if the server couldn't be connected to.
     * @returns {Buffer} The data buffer for the updated save file.
     */
    async getUpdatedSaveFile(serverConnectionErrorMsg)
    {
        var res, originalSaveContents, formData;
        var saveRoute = `${config.dev_server}/getUpdatedSaveFile`;

        formData = new FormData(); //formData contains the data to send to the server
        formData.append("newBoxes", JSON.stringify(this.state.saveBoxes));
        formData.append("saveFileData", JSON.stringify(this.state.saveFileData["data"]));
        formData.append("fileIdNumber", JSON.stringify(this.state.saveFileNumber));

        //Check if save has been externally modified while using the app
        if (this.state.saveFileHandle != null) //Only possible to check when using save file handles
        {
            //Get original save contents
            try
            {
                originalSaveContents = await this.state.saveFileHandle.getFile();
            }
            catch (e)
            {
                console.log(`Error loading the save file: ${e}`);
                let errorMsg = "Save file was not found.";
                this.setState({savingMessage: errorMsg});
                return null;
            }

            var typedArray = new Uint8Array(await originalSaveContents.arrayBuffer());
            typedArray = Array.from(typedArray);

            //Compare original save contents to the one saved in the state
            const equals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

            if (!equals(typedArray, this.state.saveFileData["data"]))
            {
                //Save file has been modified and can't be overwritten
                let errorMsg = <span>Saving can't be completed.<br/>The save file has been used recently.<br/>Please reload the page.</span>;
                this.setState({savingMessage: errorMsg});
                return null;
            }
        }

        //Get the updated save file contents
        try
        {
            res = await axios.post(saveRoute, formData, {});
        }
        catch (error)
        {
            let errorMsg = (error.message === "Network Error") ? serverConnectionErrorMsg : error.response.data;
            console.log(`Error saving Save data: ${errorMsg}`);
            this.setState({savingMessage: errorMsg});
            return null;
        }

        //No error occurred good to proceed
        return res.data.newSaveFileData;
    }

    /**
     * Downloads the updated save file.
     * @param {Buffer} dataBuffer - The data buffer for the updated save file.
     * @returns {Boolean} True if the download completed successfully. False if not.
     */
    async downloadSaveFile(dataBuffer)
    {
        var saveFileName = (this.state.selectedSaveFile == null) ? "savefile.sav" : this.state.selectedSaveFile.name; //Same name as original file
        var output = [];

        //Convert to downloadable format
        for (let byte of dataBuffer["data"])
        {
            let newArray = new Uint8Array(1);
            newArray[0] = byte;
            output.push(newArray);
        }

        //Download the Save File
        var fileContents = new Blob(output, {type: 'application/octet-stream'});

        if (this.state.saveFileHandle != null)
        {
            if (this.state.changeWasMade[BOX_HOME])
            {
                //Test to make sure the Cloud folder is still present and can be saved to
                try
                {
                    
                    var iterator = await this.state.homeDirHandle.values();
                    await iterator.next();
                }
                catch (e)
                {
                    //Cloud file is missing so cancel the save altogether
                    console.log(`Cancelling saving save file since Cloud file was not found: ${e}`);
                    let errorMsg = "Cloud file was not found.";
                    this.setState({savingMessage: errorMsg});
                    return false;
                }
            }

            try
            {
                let writable = await this.state.saveFileHandle.createWritable();
                await writable.write(fileContents); //Write the contents of the file to the stream.
                await writable.close(); //Close the file and write the contents to disk.
            }
            catch (e)
            {
                console.log(`Error saving Save file: ${e}`);
                let errorMsg = <span>Save file is being used elsewhere.<br/>Close open emulators before trying again.</span>;
                this.setState({savingMessage: errorMsg});
                return false;
            }
        }
        else
        {
            let element = document.createElement("a");
            element.href = URL.createObjectURL(fileContents);
            element.download = saveFileName;
            document.body.appendChild(element); //Required for this to work in FireFox
            element.click();
        }

        this.setState({saveFileData: dataBuffer}); //Update the data in the state so it's up-to-date
        return true;
    }

    /**
     * Downloads the updated Home data file.
     * @param {String} encryptedHomeData - The encrypted Home data text.
     * @returns {Boolean} True if the download completed successfully. False if not.
     */
    async downloadHomeData(encryptedHomeData)
    {
        var fileContents = new Blob([encryptedHomeData], {type: 'application/octet-stream'});

        if (this.state.saveFileHandle != null)
        {
            var homeFileHandle = this.state.homeFileHandle;

            try
            {
                if (homeFileHandle == null)
                {
                    //Backup old Home file (if present) and create fresh one
                    await this.tryBackupCorruptedHomeFile();
                    console.log("Creating new Home file");
                    homeFileHandle = await this.state.homeDirHandle.getFileHandle(this.getHomeFileName(), {create: true});
                    this.setState({homeFileHandle: homeFileHandle});
                }

                var writable = await homeFileHandle.createWritable();
                await writable.write(fileContents); //Write the contents of the file to the stream.
                await writable.close(); //Close the file and write the contents to disk.
            }
            catch (e)
            {
                console.log(`Error saving Cloud file: ${e}`);
                let errorMsg = "Cloud file was not found.";
                this.setState({savingMessage: errorMsg});
                return false;
            }
        }
        else
        {
            let element = document.createElement("a");
            element.href = URL.createObjectURL(fileContents);
            element.download = this.getHomeFileName();
            document.body.appendChild(element); //Required for this to work in FireFox
            element.click();
        }

        if (this.state.isRandomizedSave)
            localStorage.lastSavedRandomizerHomeData = encryptedHomeData;
        else
            localStorage.lastSavedHomeData = encryptedHomeData;

        return true;
    }

    /**
     * Tries renaming a Home file that didn't get used if there is one in the Home file directory.
     */
    async tryBackupCorruptedHomeFile()
    {
        var homeDirHandle = this.state.homeDirHandle;
        var oldHomeFileHandle = await this.findFileHandleWithNameInDirHandle(this.getHomeFileName(), homeDirHandle);

        if (oldHomeFileHandle != null) //There is a home file that's not getting used because it's corrupt
        {
            //Back it up in case the user intentionally corrupted it
            console.log("Backing up corrupted Home file");
            var oldFileContents = await oldHomeFileHandle.getFile(); //Get corrupted file contents
            var backupFileHandle = await homeDirHandle.getFileHandle(this.getHomeFileName().split(".dat")[0] + "_corrupt.dat", {create: true});
            var writable = await backupFileHandle.createWritable();
            await writable.write(oldFileContents); //Write the contents of the file to the stream.
            await writable.close(); //Close the file and write the contents to disk.
        }
    }

    /**
     * Handles trying to download the updated data.
     */
    async trySaveAndExit()
    {
        /*if (this.isAnyMonInWonderTrade())
        {
            let pokemon = this.getMonAtBoxPos(this.state.wonderTradeData.boxType,
                                GetOffsetFromBoxNumAndPos(this.state.wonderTradeData.boxNum, this.state.wonderTradeData.boxPos));

            PopUp.fire
            ({
                imageUrl: GetIconSpeciesLink(pokemon),
                imageAlt: "",
                title: `Saving can't be done while a Pokemon is up for a Wonder Trade!\nStop trying to Wonder Trade ${GetNickname(pokemon)}?`,
                confirmButtonText: `No, keep it going.`,
                denyButtonText: `Cancel the trade.`,
                showDenyButton: true,
                scrollbarPadding: false,
            }).then((result) =>
            {
                if (result.isDenied) //In this case it means agreed to cancel trade
                {
                    //End previous Wonder Trade
                    if (this.state.wonderTradeData != null)
                        this.state.wonderTradeData.socket.close();
    
                    this.setState({wonderTradeData: null}, async () =>
                    {
                        PopUp.close(); //Close the "connection lost" pop up
                        await this.saveAndExit();
                    });
                }
            });
        }
        else*/
            await this.saveAndExit();
    }

    /**
     * Handles downloading the updated data.
     */
    async saveAndExit()
    {
        if (!(await this.downloadSaveFileAndHomeData()))
        {
            PopUp.fire
            ({
                icon: 'error',
                title: "Error saving data!",
                html: this.state.savingMessage,
                confirmButtonText: "Awww",
                scrollbarPadding: false,
                didOpen: () =>
                {
                    PopUp.hideLoading(); //From previous pop-ups
                }
            }).then(() =>
            {
                //Force the save to end after this first one
                this.wipeErrorMessage();
                this.setState({savingMessage: "", isSaving: false});
            });      
        }
        else
            PopUp.close();
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
                         aria-label="Back" onClick={this.navBackButtonPressed.bind(this)}/>
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

        var viewingNonBoxView = this.state.viewingBoxList >= 0 || this.state.inFriendTrade;
        var sticky = viewingNonBoxView || !this.areBoxViewsVertical();

        if (viewingNonBoxView)
        {
            return (
                <div className={"top-bar-buttons " + (this.state.viewingBoxList >= 0 ? "fixed-navbar" : "sticky-navbar")}>
                    {this.backToMainViewButton()}
                </div>
            );
        }

        return (
            <div className="top-bar-buttons" style={{zIndex: 100,
                                                     position: !sticky ? "unset" : "sticky"}}>
                {this.homeToHomeButton()}
                {this.homeToSaveButton()}
                {this.saveToSaveButton()}
            </div>
        );
    }

    /**
     * Gets the blank navbar displayed at the top of the page.
     * @returns {JSX} The navbar.
     */
    navBarNoButtons()
    {
        return <div className="top-bar-buttons navbar-blank" />;
    }

    /**
     * Gets the button for starting a peer-to-peer trade.
     * @returns {JSX} A button element.
     */
    startTradeButton()
    {
        var size = 42;
        const tooltip = props => (<Tooltip {...props}>Friend Trade</Tooltip>);

        // if (this.state.isSaving)
        //     return ""; //Can't use while saving

        return (
            <OverlayTrigger placement="top" overlay={tooltip}>
                <Button size="lg" className="footer-button"
                        aria-label="Start Trade With a Friend"
                        onClick={this.startFriendTrade.bind(this)}>
                    <MdSwapVert size={size} />
                </Button>
            </OverlayTrigger>
        );
    }

    /**
     * Gets the button for accessing the Global Trade Station.
     * @returns {JSX} A button element.
     */
    openGTSButton()
    {
        const tooltip = props => (<Tooltip {...props}>Global Trade Station</Tooltip>);

        // if (this.state.isSaving)
        //     return ""; //Can't use while saving

        return (
            <Button size="lg" className="footer-button" style={{display: "contents"}} //Style needed to properly position svg
                    aria-label="Go To Global Trade Station">
                    <OverlayTrigger placement="top" overlay={tooltip}>
                        <div style={{width: "fit-content", paddingLeft: "14px", paddingRight: "14px"}}>
                            {GTS_ICON}
                        </div>
                    </OverlayTrigger>
            </Button>
        );
    }

    /**
     * Gets the button for turning on and off sounds.
     * @returns {JSX} A button element.
     */
    muteSoundsButton()
    {
        var size = 42;
        var icon = (this.state.muted) ? <IoMdVolumeMute size={size} /> : <IoMdVolumeHigh size={size} />;
        var tooltipText = (this.state.muted) ? "Sounds Are Off" : "Sounds Are On";
        const tooltip = props => (<Tooltip {...props}>{tooltipText}</Tooltip>);

        return (
            <OverlayTrigger placement="top" overlay={tooltip}>
                <Button size="lg" className="footer-button"
                        aria-label={tooltipText}
                        onClick={this.changeMuteState.bind(this)}>
                    {icon}
                </Button>
            </OverlayTrigger>
        );
    }

    /**
     * Gets the footer displayed at the bottom of the page.
     * @returns {JSX} The footer and its buttons.
     */
    footerButtons()
    {
        return (
            <div className={"footer-buttons" + (this.state.inFriendTrade && this.isScreenLessThanBoxWidth() ? " footer-buttons-fixed" : "")}
                 style={isMobile ? {justifyContent: "space-evenly"} : {}}>
                {this.startTradeButton()}
                {this.openGTSButton()}
                {this.muteSoundsButton()}
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
                     gameId={this.state.saveGameId} globalState={this}
                     updateParentState={this.updateState}/>
        );
    }

    /**
     * Gets the screen shown when trying to trade directly with a friend.
     * @returns {JSX} The friend trade page.
     */
    friendTradeScreen()
    {
        return (
            <div className={!isMobile ? "scroll-container" : "scroll-container-mobile"}>
                <FriendTrade globalState={this}
                            setGlobalState={this.setState.bind(this)}
                            homeBoxes={this.state.homeBoxes}
                            homeTitles={this.state.homeTitles}
                            finishFriendTrade={this.finishWonderTrade.bind(this)}/>
                {this.footerButtons()}
            </div>
        );
    }

    /**
     * Displays an error message that the server could not be connected to.
     * @returns {JSX} A container with the error message.
     */
    printServerConnectionError()
    {
        return (
            <div className="error-text" style={{visibility: this.state.serverConnectionError ? "visible" : "hidden"}}>
                <p>Could not connect to the server. Please try again later.</p>
            </div>
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
                        onClick={() => this.setState({editState: (CanUseFileHandleAPI()) ? STATE_CHOOSE_HOME_FOLDER : STATE_ASK_FIRST_TIME})} />
            </div>
        );
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
        const error = "Make sure it was a proper Cloud data file and is not corrupted.";

        return (
            <div className="main-page-upload-instructions fade-in">
                <h2>Upload your Cloud data.</h2>
                <h3>It should be a file called <b>{this.getHomeFileName()}</b>.</h3>
                <div>
                    {
                        this.existsLastSavedHomeData() ?
                            <div>
                                <Button size="lg" variant="info" onClick={() => this.useLastSavedHomeFile(error)}
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
                            <input type="file" hidden onChange={(e) => this.chooseHomeFile(e, error)}
                                   accept=".dat" />
                        </label>
                    </div>

                    <div>
                        <Button size="lg" onClick={() => this.setState({editState: STATE_MOVING_POKEMON, fileUploadError: false, serverConnectionError: false})}
                                className="choose-home-file-button">
                            Create New
                        </Button>
                    </div>
                </div>
            </div>
        );
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
                <span style={{visibility: "visible"}}>{this.navBarNoButtons()}</span> {/*Used to centre uploading bar*/}
            </div>
        );
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
                <h3>If you don't know where it is, start by looking in the same place as your ROM.</h3>
                <h3>The save file is a 128 kB .sav, .srm, or .sa1 file that has your ROM's name.</h3>
                <label className="btn btn-success btn-lg choose-save-file-button">
                    Upload File
                    <input type="file" hidden onChange={(e) => this.chooseSaveFile(e)}
                           accept=".sav,.srm,.sa1" />
                </label>
            </div>
        );
    }

    /**
     * Gets the page that asks the user to choose the directory where their Home file is located.
     * This uses the modern FileSystem API in order to function.
     * @returns {JSX} The choose save folder page.
     */
    printChooseHomeFolder()
    {
        var showLastUsedButton = this.state.homeDirHandle != null;
        var lastUsedButton = 
            <Button size="lg" variant="info" onClick={() => this.useMostRecentHomeDirectoryHandle()}
                    className="choose-home-file-button">
                <b>Last Used</b>
            </Button>;

        if ("mostRecentHomeDir" in localStorage)
        {
            const tooltip = props => (<Tooltip {...props}>{localStorage.mostRecentHomeDir}</Tooltip>);

            lastUsedButton =
                <OverlayTrigger placement="bottom" overlay={tooltip}>
                    {lastUsedButton}
                </OverlayTrigger>
        }

        return (
            <div className={"main-page-upload-instructions fade-in" + (isMobile ? " file-handle-page-mobile" : "")}>
                <h2>Choose your Cloud Data folder.</h2>
                <h3>This is the folder on your {isMobile ? "device" : "computer"} where your Boxes {showLastUsedButton ? "are" : "will be"} stored.</h3>
                {
                    showLastUsedButton ?
                        <h3>Since you've made one before, pick <b>Last Used</b>.</h3>
                    :
                        <h3>It's best to <b>create</b> a folder called <b>Unbound Cloud</b> in your <b>Documents</b> and save it there.</h3>
                }
                <div>
                    {
                        showLastUsedButton ? //Loaded one in the past
                            <div>
                                {lastUsedButton}
                            </div>
                        :
                            ""
                    }

                    <div>
                        <Button size="lg" onClick={() => this.chooseHomeFileDirectory()}
                                className="btn-success choose-home-file-button">
                            Choose Folder
                        </Button>
                    </div>
                    {
                        !showLastUsedButton && !isMobile ?
                            <div className="main-page-home-storage-example-container">
                                <img src={BASE_GFX_LINK + "DataStorageExample1.png"}
                                    alt="Make a new folder in Documents."
                                    className="main-page-home-storage-example"/>
                                <img src={BASE_GFX_LINK + "DataStorageExample2.png"}
                                     alt="Name that folder Unbound Cloud and select it."
                                     className="main-page-home-storage-example"/>
                            </div>
                        :
                            ""
                    }
                </div>
                {showLastUsedButton ? this.printServerConnectionError() : "" /*Won't actually get used here, but needed to fill space*/}
            </div>
        );
    }

    /**
     * Gets the page that asks the user to choose the directory where their save file is located.
     * This uses the modern FileSystem API in order to function.
     * @returns {JSX} The choose save folder page.
     */
    printChooseSaveFile()
    {
        var showLastUsedButton = this.state.saveFileHandle != null;
        var lastUsedButton = 
            <Button size="lg" variant="info" onClick={() => this.useMostRecentSaveHandle()}
                    className="choose-home-file-button">
                <b>Last Used</b>
            </Button>;

        if ("mostRecentSaveFile" in localStorage)
        {
            const tooltip = props => (<Tooltip {...props}>{localStorage.mostRecentSaveFile}</Tooltip>);

            lastUsedButton =
                <OverlayTrigger placement="bottom" overlay={tooltip}>
                    {lastUsedButton}
                </OverlayTrigger>
        }

        return (
            <div className={"main-page-upload-instructions fade-in" + (isMobile ? " file-handle-page-mobile" : "")}>
                <h2>Choose your save file.</h2>
                <h3>If you don't know where it is, start by looking in the same folder as your ROM.</h3>
                <h3>The save file is a 128 kB .sav, .srm, or .sa1 file that has your ROM's name.</h3>
                <div>
                    {
                        showLastUsedButton ? //Loaded one in the past
                            <div>
                                {lastUsedButton}
                            </div>
                        :
                            ""
                    }

                    <div>
                        <Button size="lg" onClick={() => this.chooseSaveFileHandle()}
                                className="btn-success choose-home-file-button">
                            Choose File
                        </Button>
                    </div>
                </div>

                {this.printServerConnectionError() /*Won't actually get used here, but needed to fill space*/}
            </div>
        );
    }

    /**
     * Gets the page with a Home box in both box slots.
     * @returns {JSX} The Home <-> Home page.
     */
    printEditingHomeBoxes()
    {
        var homeBoxView1 = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                    parent={this} boxType={BOX_HOME} boxSlot={BOX_SLOT_LEFT} inTrade={false}
                                    isSameBoxBothSides={true} key={BOX_HOME + 3}/>; //The +3 forces a rerender by assigning a new key
        var homeBoxView2 = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                    parent={this} boxType={BOX_HOME} boxSlot={BOX_SLOT_RIGHT} inTrade={false}
                                    isSameBoxBothSides={true} key={BOX_HOME + 4}/>; //The +4 forces a rerender by assigning a new key

        return (
            <>
            {
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                this.state.inFriendTrade ?
                    this.friendTradeScreen()
                :
                    <div className={!isMobile ? "scroll-container" : "scroll-container-mobile"}>
                        <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {homeBoxView1}
                                {homeBoxView2}
                        </div>
                        {this.footerButtons()}
                    </div>
            }
            </>
        );
    }

    /**
     * Gets the page with a Save box in both box slots.
     * @returns {JSX} The Save <-> Save page.
     */
    printEditingSaveBoxes()
    {
        var saveBoxView1 = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                    parent={this} boxType={BOX_SAVE} boxSlot={BOX_SLOT_LEFT} inTrade={false}
                                    isSameBoxBothSides={true} key={BOX_SAVE + 5}/>; //The +5 forces a rerender by assigning a new key
        var saveBoxView2 = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                    parent={this} boxType={BOX_SAVE} boxSlot={BOX_SLOT_RIGHT} inTrade={false}
                                    isSameBoxBothSides={true} key={BOX_SAVE + 6}/>; //The +6 forces a rerender by assigning a new key

        return (
            <>
            {
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                this.state.inFriendTrade ?
                    this.friendTradeScreen()
                :
                    <div className={!isMobile ? "scroll-container" : "scroll-container-mobile"}>
                        <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {saveBoxView1}
                                {saveBoxView2}
                        </div>
                        {this.footerButtons()}
                    </div>
            }
            </>
        );
    }

    /**
     * Gets the page with a Home box in one slot, and the save box in the other.
     * @returns {JSX} The Home <-> Save page.
     */
    printMovingPokemon()
    {
        var homeBoxView = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                   parent={this} boxType={BOX_HOME} boxSlot={BOX_SLOT_LEFT} inTrade={false}
                                   isSameBoxBothSides={false} key={BOX_HOME}/>;
        var saveBoxView = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                   parent={this} boxType={BOX_SAVE} boxSlot={BOX_SLOT_RIGHT} inTrade={false}
                                   isSameBoxBothSides={false} key={BOX_SAVE}/>;
 
        return (
            <>
                {
                    this.state.viewingBoxList >= 0 ?
                        this.boxListScreen()
                    :
                    this.state.inFriendTrade ?
                        this.friendTradeScreen()
                    :
                        <div className={!isMobile ? "scroll-container" : "scroll-container-mobile"}>
                            <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {homeBoxView}
                                {saveBoxView}
                            </div>
                            {this.footerButtons()}
                        </div>
                }
            </>
        );
    }

    printNotSupportedInBrowser()
    {
        return (
            <div className="main-page-upload-instructions fade-in">
                <h2>😞 <b>Unbound Cloud is not supported in this browser. 😞</b></h2>
                <h3>Please use an updated Google Chrome, Microsoft Edge, or Opera.</h3>
                <h3>Why? See <a href="https://caniuse.com/?search=showOpenFilePicker">here</a>.</h3>
            </div>
        )
    }

    /**
     * Prints the main page.
     */
    render()
    {
        var title = <h1 className="main-page-title">Welcome to Unbound Cloud</h1>;
        var page, draggingImg;
        var navBar = false;
        var noScroll = true;

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
            case STATE_CHOOSE_HOME_FOLDER:
                page = this.printChooseHomeFolder();
                break;
            case STATE_CHOOSE_SAVE_HANDLE:
                page = this.printChooseSaveFile();
                break;
            case STATE_EDITING_HOME_BOXES:
                page = this.printEditingHomeBoxes(); //Don't display title
                navBar = true;
                noScroll = false;
                break;
            case STATE_EDITING_SAVE_FILE:
                page = this.printEditingSaveBoxes(); //Don't display title
                navBar = true;
                noScroll = false;
                break;
            case STATE_MOVING_POKEMON:
                page = this.printMovingPokemon(); //Don't display title
                navBar = true;
                noScroll = false;
                break;
            default:
                page = "";
                break;
        }

        if (!DEBUG_ORIGINAL_FILE_METHOD && !isMobile && !CanUseFileHandleAPI())
        {
            page = this.printNotSupportedInBrowser();
            navBar = false;
            noScroll = true;
        }

        draggingImg = ""
        if (this.state.draggingImg !== "")
            draggingImg = <img src={this.state.draggingImg} alt={GetSpeciesName(GetSpecies(this.getMonAtBoxPos(this.state.draggingFromBox, this.state.draggingMon)))}
                               onMouseDown={(e) => e.preventDefault()} id="moving-icon" className="dragging-image"/>;

        let cursorStyle = draggingImg !== "" ? {cursor: "grabbing"} : {};
        let scrollStyle = noScroll ? {height: "100vh"} : {};
        return (
            <div className={isMobile && navBar ? "main-page-mobile" : ""}
                 style={{...cursorStyle, ...scrollStyle}}
                 onMouseMove={(e) => this.moveDraggingMonIcon(e)}>
                {navBar ? this.navBarButtons() : this.navBarNoButtons()}
                {page}
                {draggingImg}
            </div>
        );
    }
}

/**
 * Gets the starting site the user is directed to when the access the site.
 * @returns {Number} The starting edit state.
 */
function GetInitialPageState()
{
    if (localStorage.visitedBefore)
    {
        if (CanUseFileHandleAPI())
            return STATE_CHOOSE_HOME_FOLDER;

        return STATE_UPLOAD_SAVE_FILE;
    }

    return STATE_WELCOME;
}

/**
 * Checks if the user's browser supports the modern FileSystem API.
 * @returns {Boolean} True if the user's browser supports the feature. False otherwise.
 */
export function CanUseFileHandleAPI()
{
    if (DEBUG_ORIGINAL_FILE_METHOD)
        return false;

    return typeof(window.showOpenFilePicker) === "function";
}
