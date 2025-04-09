/**
 * A class for the main page.
 */

import axios from "axios";
import React, {Component} from 'react';
import {Button, ProgressBar, OverlayTrigger, Tooltip} from "react-bootstrap";
import {isMobile, isSmartTV, isWearable, isConsole, isEmbedded, isAndroid, isWinPhone, isIOS} from "react-device-detect";
import {StatusCode} from "status-code-enum";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {config} from "./config";
import {ActivateAccount} from "./ActivateAccount";
import {BoxList} from "./BoxList";
import {BoxView, HIGHEST_HOME_BOX_NUM, MONS_PER_BOX, MONS_PER_COL, MONS_PER_ROW} from "./BoxView";
import {/*ClearBrowserDB,*/ GetDBVal, SetDBVal} from "./BrowserDB";
import {ForgotPassword} from "./ForgotPassword";
import {NO_SERVER_CONNECTION_ERROR} from "./FormUtil";
import {FriendTrade} from "./FriendTrade";
import {GlobalTradeStation} from "./GlobalTradeStation";
// eslint-disable-next-line
import {GoogleAd} from "./GoogleAd";
import {Login} from "./Login";
import {DoesPokemonSpeciesExistInGame, GetIconSpeciesName, GetItem, GetNickname, GetSpecies,
        HasIllegalEVs, HasEggLockeOT, IsBlankMon, IsEgg, IsHoldingBannedItem, IsShiny,
        UpdateSpeciesBasedOnIdenticalRegionalForm, UpdateSpeciesBasedOnMonGender,
        /*PokemonAreDuplicates,*/ WillAtLeastOneMonLoseDataInSave} from "./PokemonUtil";
import {SymbolTutorial} from "./SymbolTutorial";
import {SignUp} from "./SignUp";
import {BASE_GFX_LINK, CreateSingleBlankSelectedPos, GetBoxNumFromBoxOffset, GetBoxPosBoxColumn, GetBoxPosBoxRow,
        GetItemName, GetLocalBoxPosFromBoxOffset, GetOffsetFromBoxNumAndPos, GetSpeciesName} from "./Util";
import SaveData from "./data/Test Output.json";
import gSpeciesToDexNum from "./data/SpeciesToDexNum.json";

import {BiArrowBack} from "react-icons/bi";
import {FaCloud, FaGamepad} from "react-icons/fa";
import {RiVolumeUpFill, RiVolumeMuteFill} from "react-icons/ri"
import {MdSwapVert, MdMusicNote, MdMusicOff, MdHelp} from "react-icons/md"

import UnboundCloudTheme from './audio/UnboundCloudTheme.mp3';

import "./stylesheets/MainPage.css";
import "./stylesheets/Navbar.css";
import "./stylesheets/Footer.css";

export const BOX_HOME = 0;
export const BOX_SAVE = 1;

export const BOX_SLOT_LEFT = 0;
export const BOX_SLOT_RIGHT = 1;

export const STATE_WELCOME = 0
export const STATE_ASK_FIRST_TIME = 1;
export const STATE_UPLOAD_SAVE_FILE = 2;
export const STATE_UPLOADING_SAVE_FILE = 3;
export const STATE_UPLOAD_HOME_FILE = 4;
export const STATE_UPLOADING_HOME_FILE = 5;
export const STATE_CHOOSE_HOME_FOLDER = 6;
export const STATE_CHOOSE_SAVE_HANDLE = 7;
export const STATE_EDITING_HOME_BOXES = 8;
export const STATE_EDITING_SAVE_FILE = 9;
export const STATE_MOVING_POKEMON = 10;

export const STATE_SIGN_UP = 11;
export const STATE_LOGIN = 12;
export const STATE_ENTER_ACTIVATION_CODE = 13;
export const STATE_FORGOT_PASSWORD = 14;

const HOME_FILE_NAME = "cloud.dat";
const HOME_FILE_RANDOMIZER_NAME = "cloud_randomizer.dat"
export const BLANK_PROGRESS_BAR = <ProgressBar now={0} label={"0%"} />;
export const PURPLE_CLOUD = <span style={{color: "var(--purple)"}}>☁︎</span>;
export const UNBOUND_LINK = <a href="https://www.pokecommunity.com/threads/pok%C3%A9mon-unbound-completed.382178/" target="_blank" rel="noopener noreferrer">Unbound</a>;
const GTS_ICON = <svg width="56px" height="56px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="M254.777 93.275c-58.482 0-105.695 47.21-105.695 105.696 0 58.487 47.213 105.698 105.695 105.698 58.482 0 105.696-47.21 105.696-105.697 0-58.48-47.214-105.695-105.696-105.695zm-140.714 63.59C-40.9 155.67-21.26 276.118 227.043 357.748c225.954 74.28 319.04 10.624 239.48-69.973-.413-.55-.84-1.097-1.277-1.64-4.755 3.954-9.71 7.915-14.95 11.88 4.487 5.513 7.138 11.084 7.704 16.01.713 6.2-.9 11.8-6.986 17.977-5.84 5.927-16.25 11.98-32.307 16.49-24.074 5.698-58.427 5.6-102.287-2.656l.105-.04c-2.153-.38-4.3-.787-6.445-1.198-21.875-4.418-46.004-10.805-72.318-19.455-69.962-23-118.054-49.706-146.063-74.936.246-.19.48-.38.728-.568-.27.166-.532.333-.8.5-53.315-48.08-33.682-90.78 46.558-92.2-8.46-.665-16.502-1.016-24.124-1.075zm281.425 0c-7.62.06-15.663.41-24.123 1.076 80.24 1.42 99.86 44.115 46.537 92.193-.264-.165-.513-.33-.78-.494.244.184.472.368.712.553-26.017 23.434-69.357 48.144-131.455 69.973 21.19 5.413 42.82 9.363 64.815 11.64 34.83-15.125 63.025-30.916 84.91-46.554.01.007.02.014.032.02.522-.386 1.03-.773 1.547-1.16 90.502-65.565 69.686-128.11-42.196-127.247zM44.54 286.27c-74.364 73.55-5.467 133.668 176.683 89.125-22.844-7.563-44.89-15.83-65.84-24.194-25.396 2.316-46.41 1.29-62.842-2.346-16.802-4.544-27.613-10.765-33.61-16.852-6.086-6.176-7.697-11.776-6.985-17.977.56-4.88 3.17-10.395 7.582-15.86-5.253-3.968-10.22-7.935-14.986-11.894z"/></svg>;

const PopUp = withReactContent(Swal);
const ACCOUNT_SYSTEM = true; //Use an account system to login instead of saving the Cloud data locally
const DEBUG_ORIGINAL_FILE_METHOD = process.env.REACT_APP_USE_ORIGINAL_UPLOAD_DOWNLOAD === "true"; //Using the browser upload and download functions
const DISABLE_ON_MOBILE = false; //Prevent mobile devices from using the site without a password
const DEMO_SITE = false; //Initial loading page is the box moving so people can see how the site would work
const MAINTENANCE = false; //Locks the site from non beta-testers while new features are integrated
export const UNOFFICIAL_RELEASE = false; //Only allow testers with a password to access the site

const mainTheme = new Audio(UnboundCloudTheme);

const SUPPORTED_HACKS = ["Unbound >= v2.1.0",
                         "Unbound Battle Frontier Demo >= v2.0.0",
                         "Magical Altering Gym Menagerie >= v1.2",
                         "Inflamed Red >= v1.1.0pb1.2",
                         "GS Chronicles >= 2.7.1"];


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
            uploadProgress: -1,
            isFirstTime: false,
            selectedSaveFile: null,
            selectedHomeFile: null,
            fileUploadError: false,
            serverConnectionError: false,
            mismatchedRandomizerError: false,
            inaccessibleSaveError: false,
            oldVersionSaveError: false,
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
            draggingLeftCell: false,

            //Actual Storage System
            saveGameId: SaveData["gameId"],
            saveBoxCount: SaveData["boxCount"],
            saveBoxes: SaveData["boxes"],
            saveTitles: SaveData["titles"],
            homeBoxes: this.generateBlankHomeBoxes(),
            homeTitles: this.generateBlankHomeTitles(),
            isRandomizedSave: false,

            //Account System
            username: ("username" in localStorage) ? localStorage.username : "",
            accountCode: ("accountCode" in localStorage) ? localStorage.accountCode : "",
            cloudDataSyncKey: "",
            uploadedTesterHomeFile: false,
            uploadedTesterRandomizedHomeFile: false,

            //Other
            muted: ("muted" in localStorage && localStorage.muted === "true") ? true : false,
            songMuted: ("songOff" in localStorage && localStorage.songOff === "true") ? true : false,
            inFriendTrade: false,
            inGTS: false,
            tradeData: null,
            viewingSummaryEVsIVs: false,
            isSaving: false,
            unlockedMobile: false,
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

        if (DEMO_SITE && !localStorage.visitedBefore)
        {
            PopUp.fire
            ({
                icon: "warning",
                text: "This is a preview of the website. If you are a tester and actually want to use the tool, please state so now.",
                confirmButtonText: "I am a Tester",
                cancelButtonText: "I am not a Tester",
                showCancelButton: true,
                scrollbarPadding: false,
            }).then((result) =>
            {
                if (result.isConfirmed)
                    this.setState({editState: STATE_WELCOME});
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

    async setStateAndWait(newState)
    {
        return new Promise(resolve => this.setState(newState, resolve));
    }

    /**
     * Removes the error messages displayed on the page (if any).
     */
    wipeErrorMessage()
    {
        return this.setState
        ({
            errorMessage: ["", ""],
            impossibleMovement: null,
            fileUploadError: false,
            serverConnectionError: false,
            mismatchedRandomizerError: false,
            inaccessibleSaveError: false,
            oldVersionSaveError: false,
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
     * Alternates between music muted and unmuted.
     */
    changeMusicMuteState()
    {
        this.setState({songMuted: !this.state.songMuted}, () =>
        {
            this.playOrPauseMainMusicTheme();
            localStorage.songOff = this.state.songMuted; //Save cookie for future visits to the site (not songMuted because of way cookie works)
        });
    }

    /**
     * Shows a pop-up explaining the different symbols on the page.
     */
    showSymbolTutorial()
    {
        PopUp.fire
        ({
            icon: "question",
            title: "Symbols",
            html: <SymbolTutorial/>,
            scrollbarPadding: false,
        });

        localStorage.visitedBefore = true; //Set cookie only once user has seen this pop-up
    }

    /**
     * Plays or pauses the main music theme that plays in the background.
     */
    playOrPauseMainMusicTheme()
    {
        if (this.state.songMuted)
            mainTheme.pause();
        else
        {
            mainTheme.loop = true;
            mainTheme.play();
        }
    }
 
    /**
     * Handles the functionality of pressing the navbar's back button.
     */
    navBackButtonPressed()
    {
        this.wipeErrorMessage();

        switch (this.state.editState)
        {
            case STATE_UPLOAD_HOME_FILE:
                this.setState({editState: STATE_UPLOAD_SAVE_FILE, saveFileData: {"data": []}, saveFileNumber: 0});
                return;
            case STATE_CHOOSE_SAVE_HANDLE:
                if (!ACCOUNT_SYSTEM)
                    this.setState({editState: STATE_CHOOSE_HOME_FOLDER, homeFileHandle: null}); //Don't clear homeDirHandle because it's populated on page load
                //Fallthrough
            case STATE_UPLOAD_SAVE_FILE:
            case STATE_ENTER_ACTIVATION_CODE:
            case STATE_FORGOT_PASSWORD:
                if (ACCOUNT_SYSTEM)
                {
                    this.setState
                    ({
                        editState: STATE_LOGIN,
                        username: "",
                        accountCode: "",
                    });

                    delete localStorage.username;
                    delete localStorage.accountCode;
                }
                return;
            default:
                break;
        }

        if (this.state.viewingBoxList >= 0)
            this.setState({viewingBoxList: -1}); //Overrides Friend Trade because could be jumping boxes looking for a Pokemon
        else if (this.state.inFriendTrade)
            this.tryResetFriendTradeState();
        else if (this.state.inGTS)
            this.tryResetGTSState();
    }


    /**********************************
           Box Utility Functions       
    **********************************/

    /**
     * Gets whether or not the user can only access the Home Boxes and not the save boxes.
     * @returns {Boolean} True if only the Home Boxes are accessible, false if the Save Boxes are too.
     */
    areOnlyHomeBoxesAccessible()
    {
        return this.state.saveBoxCount === 0;
    }

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
     * @returns {Boolean} True if the screen needs to be shrunk to fit a box. False if the default size is fine.
     */
    isScreenLessThanBoxWidth()
    {
        return window.innerWidth < 428; //px
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
        return {boxNum: -1, offset: -1}; //Honestly, dupe checking is pointless since it's easy to clone a Pokemon by just changing its nature

        /*if (IsBlankMon(pokemon))
            return {boxNum: -1, offset: -1}; //Don't waste time

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

        return {boxNum: -1, offset: -1};*/
    }

    /**
     * Checks if a Pokemon can't be placed in a box because it's holding an item that can't be placed in the Home boxes.
     * @param {Pokemon} pokemon - The Pokemon to check.
     * @param {number} placedInBoxType - The box type the Pokemon is being placed in.
     * @returns {Boolean} True if the Pokemon can't be placed in the box. False if it can be.
     */
    cantBePlacedInBoxBecauseOfBannedItem(pokemon, placedInBoxType)
    {
        return IsHoldingBannedItem(pokemon) && placedInBoxType === BOX_HOME;
    }

    /**
     * Checks if a Pokemon can't be placed in a Home box because it has too many EVs.
     * @param {Pokemon} pokemon - The Pokemon to check.
     * @param {number} placedInBoxType - The box type the Pokemon is being placed in.
     * @returns {Boolean} True if the Pokemon can't be placed in the box. False if it can be.
     */
    cantBePlacedInBoxBecauseOfIllegalEVs(pokemon, placedInBoxType)
    {
        return HasIllegalEVs(pokemon) && placedInBoxType === BOX_HOME;
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
            || fileName.endsWith(".sa1")
            || fileName.endsWith(".fla");
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
            await this.setStateAndWait({fileUploadError: true, serverConnectionError: false});
            return false;
        }
        else
        {
            await this.setStateAndWait({selectedSaveFile: file, fileUploadError: false, serverConnectionError: false});
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
            await this.setStateAndWait({fileUploadError: true, serverConnectionError: false});
            return false;
        }
        else
        {
            await this.setStateAndWait({selectedHomeFile: file, fileUploadError: false, serverConnectionError: false});
            return await this.handleUpload(false); //Upload immediately
        }
    }

    /**
     * Checks if last saved Home data exists based on the user's save file.
     * @returns {Boolean} True if the user can load last saved Home data. False if not.
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
        var homeData = (this.state.isRandomizedSave) ? localStorage.lastSavedRandomizerHomeData : localStorage.lastSavedHomeData;
        var route = `${config.dev_server}/uploadCloudData`;

        this.setState
        ({
            editState: STATE_UPLOADING_HOME_FILE,
            uploadProgress: BOX_HOME,
            selectedHomeFile: {"name": "last saved Cloud data"},
        });

        let res;
        try
        {
            res = await axios.post(route, {file: homeData});
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

            this.playOrPauseMainMusicTheme();
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
        var route = `${config.dev_server}/${isSaveFile ? "uploadSaveFile" : "uploadCloudData"}`;
        var isUsingFileHandles = (isSaveFile && this.state.saveFileHandle != null)
                             || (!isSaveFile && this.state.homeFileHandle != null); //Using modern FileSystem API

        //Read file as an array buffer and convert to array of bytes
        var fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (isSaveFile)
                    resolve(new Uint8Array(reader.result));
                else //Cloud data is sent as plain text
                    resolve(reader.result);
            }
            reader.onerror = () => {
                reject(reader.error);
            }

            if (isSaveFile)
                reader.readAsArrayBuffer(file);
            else //Cloud data is sent as plain text
                reader.readAsText(file);
        });

        const requestData =
        {
            file: fileData,
            isSaveFile: isSaveFile,
        }

        if (ACCOUNT_SYSTEM)
        {
            requestData.username = this.state.username;
            requestData.accountCode = this.state.accountCode; //Used for an extra layer of security
        }

        this.setState
        ({
            editState: ACCOUNT_SYSTEM && !isSaveFile ? this.state.editState : //A tester uploading their Cloud file should stay on the same page
                    isSaveFile ? STATE_UPLOADING_SAVE_FILE : STATE_UPLOADING_HOME_FILE,
            uploadProgress: (isSaveFile) ? BOX_SAVE : BOX_HOME,
        });

        let res;
        try
        {
            res = await axios.post(route, requestData);
        }
        catch (error)
        {
            //Some error occurred
            let errorShouldBlockUser = !isUsingFileHandles || isSaveFile; //Home file errors are ignored when using file handles

            if (errorShouldBlockUser)
            {
                var newState = ACCOUNT_SYSTEM && !isSaveFile ? this.state.editState
                             : isUsingFileHandles ? STATE_CHOOSE_SAVE_HANDLE
                             : isSaveFile ? STATE_UPLOAD_SAVE_FILE
                             : STATE_UPLOAD_HOME_FILE;
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
                if (!ACCOUNT_SYSTEM) //Cloud data would have been received already
                {
                    //Upload the standard name for a cloud file if it exists
                    //If it doesn't or there's an error, just use a blank new home file
                    try
                    {
                        let homeFileHandle = await this.findFileHandleWithNameInDirHandle(this.getHomeFileName(), this.state.homeDirHandle);
                        if (homeFileHandle != null) //Home file has already been created
                        {
                            await this.setStateAndWait({homeFileHandle: homeFileHandle});
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
                            this.showSymbolTutorial(); //Since it's probably the first time using the site
                        }
                    }
                    catch (e)
                    {
                        //Site can't be used at all
                        console.error(`Error uploading last Cloud directory: ${this.state.homeDirHandle.name} was not found.`);
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
                }

                this.setState({editState: STATE_MOVING_POKEMON});
                this.playOrPauseMainMusicTheme();
                if (!localStorage.visitedBefore)
                    this.showSymbolTutorial();
            }
            else
            {
                if (ACCOUNT_SYSTEM || this.state.isFirstTime)
                {
                    this.setState({editState: STATE_MOVING_POKEMON}, () =>
                    {
                        this.playOrPauseMainMusicTheme();
                        if (!localStorage.visitedBefore)
                            this.showSymbolTutorial();
                    });
                }
                else
                    this.setState({editState: STATE_UPLOAD_HOME_FILE});
            }

            this.wipeErrorMessage();
        }
        else //Home File
        {
            console.log("Home file upload successful.");

            if (ACCOUNT_SYSTEM)
            {
                if (res.data.randomizer)
                {
                    this.setState
                    ({
                        randomizedHomeBoxes: res.data.boxes,
                        randomizedHomeTitles: res.data.titles,
                        uploadedTesterRandomizedHomeFile: true,
                    });
                }
                else
                {
                    this.setState
                    ({
                        homeBoxes: res.data.boxes,
                        homeTitles: res.data.titles,
                        uploadedTesterHomeFile: true,
                    });
                }

                this.wipeErrorMessage();
                this.setState({uploadProgress: -1});
            }
            else if ((this.state.isRandomizedSave && res.data.randomizer)
            || (!this.state.isRandomizedSave && !res.data.randomizer))
            {
                this.setState
                ({
                    homeBoxes: res.data.boxes,
                    homeTitles: res.data.titles,
                });

                if (!isUsingFileHandles)
                    this.setState({editState: STATE_MOVING_POKEMON}, () => {this.playOrPauseMainMusicTheme()});
                else
                    this.setState({editState: this.state.editState}); //Uploading a home file handle doesn't change the edit state (updated above in the call stack)

                this.wipeErrorMessage();
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
     * Sets the state of for the save Boxes after the server processes the save file.
     * @param {Object} res - The response from the server.
     */
    async setSaveBoxesFromResponse(res)
    {
        let newState =
        {
            saveBoxes: res.data.boxes,
            saveTitles: res.data.titles,
            saveGameId: res.data.gameId,
            saveBoxCount: res.data.boxCount,
            isRandomizedSave: res.data.randomizer,
            saveFileNumber: res.data.fileIdNumber,
            saveFileData: res.data.saveFileData,
        }

        await this.setStateAndWait(newState);

        if (ACCOUNT_SYSTEM
        && "cloudBoxes" in res.data
        && "cloudTitles" in res.data
        && "cloudDataSyncKey" in res.data)
        {
            await this.setStateAndWait
            ({
                homeBoxes: res.data.cloudBoxes.length === 0 ? this.state.homeBoxes : res.data.cloudBoxes,
                homeTitles: res.data.cloudTitles.length === 0 ? this.state.homeTitles : res.data.cloudTitles,
                cloudDataSyncKey: res.data.cloudDataSyncKey,
            });    
        }
    }

    /**
     * Displays an error pop-up and updates the state after a failed file upload.
     * @param {Object} error - The error object after the server request completed.
     * @param {Number} newState - The new editState.
     */
    async handleUploadError(error, newState)
    {
        var errorText;
        console.error("An error occurred uploading the file.");

        if (error.message === "Network Error")
        {
            await this.setStateAndWait
            ({
                editState: newState,
                fileUploadError: false,
                inaccessibleSaveError: false,
                oldVersionSaveError: false,
                serverConnectionError: true,
            });

            errorText = NO_SERVER_CONNECTION_ERROR;
            console.error(errorText);
        }
        else
        {
            await this.setStateAndWait
            ({
                editState: newState,
                fileUploadError: true,
                inaccessibleSaveError: error["response"]["status"] === StatusCode.ClientErrorForbidden,
                oldVersionSaveError: error["response"]["status"] === StatusCode.ClientErrorUpgradeRequired,
                serverConnectionError: false,
                errorResponseText: error["response"]["data"],
            });

            errorText = "Server error!\nPlease try again later."; //Will usually be overwritten with a more specific error
            console.error(error["response"]["data"]);
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
        if (this.state.inaccessibleSaveError)
        {
            PopUp.fire
            ({
                icon: "error",
                title: "Save File Can't Be Used Right Now",
                text: this.state.errorResponseText,
                scrollbarPadding: false,
            });
        }
        else
        {
            var title, text;

            if (this.state.oldVersionSaveError)
            {
                title = "Save File From Old Version"
                text = "Make sure to update your ROM to the latest version, and then save ingame before trying again."
            }
            else
            {
                title = "Unacceptable Save File";
                text = "Make sure it's a save file for a supported ROM Hack and is not corrupted.";
            }

            PopUp.fire
            ({
                icon: "error",
                title: title,
                text: text,
                confirmButtonText: "Which ROM Hacks are supported?",
                scrollbarPadding: false,
            }).then((result) =>
            {
                if (result.isConfirmed)
                    this.printSupportedHacks();
            });
        }
    }

    /**
     * Displays a pop-up of the supported ROM Hacks.
     */
    printSupportedHacks()
    {
        var buttonText = "OK";
        if (this.state.oldVersionSaveError)
            buttonText = "How do I update?";

        let supportedHacks = [];

        for (let hack of SUPPORTED_HACKS)
            supportedHacks.push(`<li>${hack}</li>`);

        supportedHacks = supportedHacks.toString().replaceAll(",", "");
        PopUp.fire
        ({
            title: "Supported Hacks",
            html: `<ul style="text-align: left">${supportedHacks}</ul>`,
            confirmButtonText: buttonText,
        }).then((result) =>
        {
            if (result.isConfirmed && this.state.oldVersionSaveError)
            {
                PopUp.fire
                ({
                    title: "How To Update",
                    html: `<ol style="text-align: left">`
                        + "<li>Patch a fresh ROM.</li>"
                        + "<li>Give the newly patched ROM the same name as the old ROM.</li>"
                        + "<li>Delete the old ROM and move the newly patched ROM to the folder where the old ROM was.</li>"
                        + "</ol>"
                        + `<p style="text-align: justify">If you do not understand these steps, ask in the relevant hack's Discord server and someone will help you out.</.b>`,
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

        await this.setStateAndWait({mismatchedRandomizerError: true}); //Prevent the pop-up from showing up for file handles

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

    /**
     * Skips the uploading of a Save file and jumps right to Cloud Box only mode (for account system only).
     */
    async skipSaveFileUpload()
    {
        if (ACCOUNT_SYSTEM)
        {
            var route = `${config.dev_server}/getAccountCloudData`;

            PopUp.fire
            ({
                title: 'Loading, please wait...',
                timer: 30000, //30 seconds
                timerProgressBar: true,
                allowOutsideClick: false,
                showConfirmButton: false,
                showCancelButton: false,
                scrollbarPadding: false,
                didOpen: async () =>
                {
                    try
                    {
                        const requestData =
                        {
                            username: this.state.username,
                            accountCode: this.state.accountCode, //Used for an extra layer of security
                            randomizer: false,
                        };
            
                        let res = await axios.post(route, requestData);

                        await this.setStateAndWait
                        ({
                            saveGameId: "cfru",
                            saveBoxCount: 0,
                            saveBoxes: [],
                            saveTitles: [],
                            homeBoxes: res.data.cloudBoxes.length === 0 ? this.state.homeBoxes : res.data.cloudBoxes,
                            homeTitles: res.data.cloudTitles.length === 0 ? this.state.homeTitles : res.data.cloudTitles,
                            cloudDataSyncKey: res.data.cloudDataSyncKey,
                        });
                        this.changeBoxView(STATE_EDITING_HOME_BOXES);

                        PopUp.fire({showConfirmButton: false});
                        PopUp.close(); //Close loading pop-up

                        this.playOrPauseMainMusicTheme();
                        if (!localStorage.visitedBefore)
                            this.showSymbolTutorial();
                    }
                    catch (error)
                    {
                        let errorMsg = (error.message === "Network Error") ? NO_SERVER_CONNECTION_ERROR : error.response.data;
                        console.error(`Error loading Cloud data: ${errorMsg}`);

                        PopUp.fire
                        ({
                            icon: 'error',
                            title: errorMsg,
                            scrollbarPadding: false,
                        });
                    }
                },
            });
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
            console.error(`Failed to pick Home directory: ${e}`);

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
            console.error(`Failed to pick last Home directory: ${e}`);

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
                        "application/octet-stream": [".sav", ".srm", ".sa1", ".fla"]
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
            console.error(`Failed to pick save file: ${e}`);

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
            console.error(`Failed to pick last save file: ${e}`);

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
        await this.setStateAndWait({saveFileHandle: fileHandle});
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
     * Sets the error message for a Pokemon with illegal EVs being moved to a Home box.
     * @param {Pokemon} pokemon - The Pokemon with illegal EVs.
     * @param {Number} fromOffset - The offset in the "from" set of boxes the Pokemon was being moved from.
     * @param {Number} fromBoxSlot - The box slot of the box the Pokemon is being moved from.
     * @param {Number} toBoxSlot - The box slot of the box the Pokemon is being moved to.
     */
    setIllegalEVsError(pokemon, fromOffset, fromBoxSlot, toBoxSlot)
    {
        var errorMessage = ["", ""];
        var impossibleFrom = this.generateBlankImpossibleMovementArray();
        var impossibleMovement = [null, null];
        var selectedMonPos = this.state.selectedMonPos;
        var fromPos = GetLocalBoxPosFromBoxOffset(fromOffset);

        impossibleFrom[GetBoxPosBoxRow(fromPos)][GetBoxPosBoxColumn(fromPos)] = true;
        impossibleMovement[fromBoxSlot] = impossibleFrom;
        errorMessage[fromBoxSlot] = `${GetNickname(pokemon)} has too many EVs.`;

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
                errorMessage[toBoxSlot] = `${GetSpeciesName(GetSpecies(pokemon), true)} doesn't exist in this game.`;
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
     * Tries to set an error message if a Pokemon can't be moved to a certain box for certain reasons.
     * @param {Pokemon} pokemon - The Pokemon being moved.
     * @param {Array<Pokemon>} toBoxes - The list of boxes the Pokemon is being added to.
     * @param {Number} fromOffset - The offset in the list of boxes the Pokemon is being moved from.
     * @param {Number} fromBoxType - The box type the Pokemon is being moved from.
     * @param {Number} toBoxType - The box type the Pokemon is being moved to.
     * @param {Number} fromBoxSlot - The box slot the Pokemon is being moved from.
     * @param {Number} toBoxSlot - The box slot the Pokemon is being moved from.
     * @returns {Boolean} True if the movement failed and an error message was printed. False if the move can be done.
     */
    trySetErrorForFailedMovement(pokemon, toBoxes, fromOffset, fromBoxType, toBoxType, fromBoxSlot, toBoxSlot)
    {
        let alreadyExistsRet =
            this.monAlreadyExistsInBoxes(pokemon, toBoxes, this.getBoxAmountByBoxSlot(toBoxSlot),
                                        (fromBoxType === toBoxType) ? fromOffset : -1);

        let holdingBannedItem =
            this.cantBePlacedInBoxBecauseOfBannedItem(pokemon, toBoxType);

        let hasIllegalEVs =
            this.cantBePlacedInBoxBecauseOfIllegalEVs(pokemon, toBoxType);

        let doesntExistInGame =
            this.cantBePlacedInBoxBecauseOfNonExistentSpecies(pokemon, toBoxType);

        if (alreadyExistsRet.boxNum >= 0)
            this.setDuplicatePokemonSwappingError(fromBoxSlot, fromOffset, toBoxSlot, alreadyExistsRet);
        else if (holdingBannedItem)
            this.setBannedItemError(pokemon, fromOffset, fromBoxSlot, toBoxSlot);
        else if (hasIllegalEVs)
            this.setIllegalEVsError(pokemon, fromOffset, fromBoxSlot, toBoxSlot);
        else if (doesntExistInGame)
            this.setNonExistentSpeciesError(pokemon, fromOffset, fromBoxSlot, toBoxSlot);

        return alreadyExistsRet.boxNum >= 0 || holdingBannedItem || hasIllegalEVs || doesntExistInGame;
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
                    if (this.trySetErrorForFailedMovement(leftBoxes[leftOffset], rightBoxes, leftOffset, leftBoxType, rightBoxType, BOX_SLOT_LEFT, BOX_SLOT_RIGHT))
                        return;

                    //Check if mon already exists in the left boxes
                    if (this.trySetErrorForFailedMovement(rightBoxes[rightOffset], leftBoxes, rightOffset, rightBoxType, leftBoxType, BOX_SLOT_RIGHT, BOX_SLOT_LEFT))
                        return;

                    //Actually swap the Pokemon
                    this.swapBoxedPokemon(leftBoxes, rightBoxes, leftOffset, rightOffset);
                    changeWasMade[leftBoxType] = true;
                    changeWasMade[rightBoxType] = true;
                }
            }
            else //Moving multiple Pokemon
            {
                var i, j, multiFrom, multiTo, multiTopLeftPos, toTopRow, toLeftCol;

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

                        if (this.trySetErrorForFailedMovement(pokemon, toBoxes, offset, fromBoxType, toBoxType, multiFrom, multiTo))
                            return;
                    }
                }

                //Get area of moving mons
                var topRow = Number.MAX_SAFE_INTEGER;
                var bottomRow = 0;
                var leftCol = Number.MAX_SAFE_INTEGER;
                var topRowLeftCol = Number.MAX_SAFE_INTEGER; //The "anchor" for the move
                var rightCol = 0;
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
                        {
                            leftCol = col;
                            if (topRowLeftCol === Number.MAX_SAFE_INTEGER)
                                topRowLeftCol = col; //Only set for the first col encountered (eg. on the top row)
                        }

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
                toLeftCol = GetBoxPosBoxColumn(multiTopLeftPos) - (topRowLeftCol - leftCol); //Move based on anchor

                for (i = 0; i < height; ++i)
                {
                    let row = toTopRow + i;

                    for (j = 0; j < width; ++j)
                    {
                        let col = toLeftCol + j;
                        let inBoxPos = (topRow + i) * MONS_PER_ROW + (leftCol + j);
                        let offset = GetOffsetFromBoxNumAndPos(this.state.selectedMonBox[multiFrom], inBoxPos);
                        let movingPokemon = this.getMonAtBoxPos(multiFrom, offset);
                        let isMonAndIsSelected = !IsBlankMon(movingPokemon) && this.state.selectedMonPos[multiFrom][inBoxPos];

                        if (row < 0 || row >= MONS_PER_BOX / MONS_PER_ROW) //5 Rows
                        {
                            possible = false; //Outside of bounds
                            if (isMonAndIsSelected) //Only highlight actual selected Pokemon
                                impossibleFrom[topRow + i][leftCol + j] = true;
                            continue;
                        }

                        if (col < 0 || col >= MONS_PER_ROW) //6 Colums
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
     * Checks if a Pokemon's dragging icon should currently appear on the screen.
     * @returns {Boolean} - True if the icon should appear. False otherwise.
     */
    shouldViewDraggingImg()
    {
        return this.state.draggingImg !== "" && this.state.draggingLeftCell;
    }

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
            if (!this.trySetErrorForFailedMovement(fromBoxes[fromOffset], toBoxes, fromOffset, fromBoxType, toBoxType, this.state.draggingFromBox, this.state.draggingToBox)
             && !this.trySetErrorForFailedMovement(toBoxes[toOffset], fromBoxes, toOffset, toBoxType, fromBoxType, this.state.draggingToBox, this.state.draggingFromBox))
            {
                this.swapBoxedPokemon(fromBoxes, toBoxes, fromOffset, toOffset);
                selectedMonPos = this.generateBlankSelectedPos(); //Only remove if swap was made
                summaryMon = [null, null];
                changeWasMade[fromBoxType] = true;
                changeWasMade[toBoxType] = true;
                this.wipeErrorMessage();
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
        {
            this.tryResetFriendTradeState();
        }
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
                    this.trySaveAndExit(false);
            });
        }
        else
        {
            this.setState({inFriendTrade: !this.state.inFriendTrade});
            this.resetStateForStartingFriendTrade(false);
            this.wipeErrorMessage();
        }
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
                        searchCriteria: [null, null],
                    });
                }
            });
        }
        else
        {
            this.setState
            ({
                inFriendTrade: false,
            });
        }
    }

    /**
     * Opens the Global Trade Station screen.
     */
    openGTS()
    {
        if (this.state.inGTS)
        {
            this.tryResetGTSState();
        }
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
                    this.trySaveAndExit(false);
            });
        }
        else
        {
            PopUp.fire
            ({
                icon: "error",
                title: "The GTS is still incomplete.\nPlease use the #cloud-trades channel in the Unbound Discord server to find trades in the meantime.",
                cancelButtonText: "Awww",
                showConfirmButton: false,
                showCancelButton: true,
                scrollbarPadding: false,
                inGTS: false,
            });

            // this.setState({inGTS: !this.state.inGTS});
            // this.wipeErrorMessage();
        }
    }

    tryResetGTSState()
    {
        this.setState
        ({
            inGTS: false,
        });
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
        var freeSlot = speciesList.length; //Free slot after the living dex mons
        var homeBoxes = this.state.homeBoxes;

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
        for (i = speciesList.length; i < homeBoxes.length; ++i)
            newBoxes[i] = homeBoxes[i];

        //Then move the Pokemon that are in the living dex area
        for (i = 0; i < speciesList.length; ++i)
        {
            let pokemon = homeBoxes[i]
            let species = GetSpecies(pokemon, true);

            if (!compareDexNums)
            {
                species = UpdateSpeciesBasedOnMonGender(species, pokemon);
                species = UpdateSpeciesBasedOnIdenticalRegionalForm(species);
            }

            let inDict = (compareDexNums) ? species in gSpeciesToDexNum && gSpeciesToDexNum[species] in speciesIndexDict : species in speciesIndexDict;

            if (inDict)
            {
                let index = (compareDexNums) ? speciesIndexDict[gSpeciesToDexNum[species]] : speciesIndexDict[species];
                if (IsBlankMon(newBoxes[index])) //Free spot
                    newBoxes[index] = pokemon;
                else
                {
                    if (IsShiny(pokemon) && !IsShiny(newBoxes[index]))
                    {
                        //Prioritize shiny mons in the living dex slot
                        newBoxes[freeSlot] = newBoxes[index]; //Move to end
                        newBoxes[index] = pokemon; //Shiny mon
                    }
                    else
                        newBoxes[freeSlot] = pokemon; //Move to end
                }
            }
            else
                newBoxes[freeSlot] = pokemon; //Move to end

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

        this.setState({homeBoxes: newBoxes});
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
     * @param {Boolean} askDoneWithSite - Whether or not the player should be prompted to close the site after the save.
     */
    async downloadSaveFileAndHomeData(askDoneWithSite)
    {
        var encryptedHomeData = null;
        var dataBuffer = null;
        var serverConnectionErrorMsg = <span>Could not connect to the server.<br/>DO NOT RELOAD THE PAGE!</span>;
        this.wipeErrorMessage();

        //Get Encrypted Home File
        if (!ACCOUNT_SYSTEM && this.state.changeWasMade[BOX_HOME]) //Don't waste time if there's no updated version
        {
            await this.printSavingPopUp("Preparing Cloud data...");
            encryptedHomeData = await this.getEncryptedHomeFile(serverConnectionErrorMsg);
            if (encryptedHomeData == null)
                return false;
        }

        //Get Updated Save File
        if (this.state.changeWasMade[BOX_SAVE]) //Don't waste time if there's no updated version
        {
            await this.printSavingPopUp("Preparing Save data...");
            dataBuffer = await this.getUpdatedSaveFile(serverConnectionErrorMsg);
            if (dataBuffer == null)
                return false;
        }

        //Save Cloud Boxes for the account system
        if (ACCOUNT_SYSTEM && this.state.changeWasMade[BOX_HOME])
        {
            await this.printSavingPopUp("Saving Cloud data...");
            let success = await this.saveAccountCloudData(serverConnectionErrorMsg);
            if (!success)
                return false;
        }

        //Download the Save Data (downloaded first because more likely to be problematic)
        if (this.state.changeWasMade[BOX_SAVE])
        {
            await this.printSavingPopUp("Downloading Save data...");
            if (!(await this.downloadSaveFile(dataBuffer))) //Couldn't save because file probably in use
                return false;
        }

        //Download the Home Data
        if (!ACCOUNT_SYSTEM && this.state.changeWasMade[BOX_HOME])
        {
            await this.printSavingPopUp("Downloading Cloud data...");
            if (!(await this.downloadHomeData(encryptedHomeData))) //Couldn't save because file missing
                return false;
        }

        this.setState({savingMessage: "", isSaving: false, changeWasMade: [false, false]});

        if (askDoneWithSite)
        {
            PopUp.fire
            ({
                icon: "success",
                title: "Saving complete!",
                text: "Are you done editing your save file?",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                scrollbarPadding: false,
                didOpen: () =>
                {
                    PopUp.hideLoading(); //From previous pop-ups
                }
            }).then((result) =>
            {
                if (result.isConfirmed)
                    window.location.reload(); //Reload page
            });
        }

        return true;
    }

    /**
     * Displays a pop-up while saving is in progress.
     * @param {String} text - The text to display in the pop-up.
     */
    async printSavingPopUp(text)
    {
        await this.setStateAndWait({savingMessage: text, isSaving: true});

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
    }

    /**
     * Gets the encrypted version of the Home boxes from the server.
     * @param {String} serverConnectionErrorMsg - The message to display if the server couldn't be connected to.
     * @returns {String} The encrypted Home data text.
     */
    async getEncryptedHomeFile(serverConnectionErrorMsg)
    {
        var res;
        const homeRoute = `${config.dev_server}/encryptCloudData`;
        const homeData =
        {
            titles: this.state.homeTitles,
            boxes: this.state.homeBoxes,
            randomizer: this.state.isRandomizedSave,
            version: 2, //No version was in the original tester release
        };

        try
        {
            res = await axios.post(homeRoute, {homeData: homeData});
            return res.data.newHomeData;
        }
        catch (error)
        {
            let errorMsg = (error.message === "Network Error") ? serverConnectionErrorMsg : error.response.data;
            console.error(`Error saving Home data: ${errorMsg}`);
            this.setState({savingMessage: errorMsg});
            return null;
        }
    }

    /**
     * Sends the Cloud boxes to the server and saves it there.
     * @param {String} serverConnectionErrorMsg - The message to display if the server couldn't be connected to.
     * @returns {Boolean} true if the data was saved successfully, false if not.
     */
    async saveAccountCloudData(serverConnectionErrorMsg)
    {
        const homeRoute = `${config.dev_server}/saveAccountCloudData`;
        const homeData =
        {
            titles: this.state.homeTitles,
            boxes: this.state.homeBoxes,
            randomizer: this.state.isRandomizedSave,
            version: 2, //No version was in the original tester release
        };

        const requestData =
        {
            username: this.state.username,
            accountCode: this.state.accountCode, //Used for an extra layer of security
            cloudDataSyncKey: this.state.cloudDataSyncKey, //Prevents issues with opening multiple tabs
            homeData: homeData,
        }

        try
        {
            localStorage.lastSavedHomeData = homeData; //In case the servers get wiped at least there will be a local backup
        }
        catch (error)
        {
            console.error("Error saving local backup of Cloud Data. Local storage is full.");
        }

        try
        {
            await axios.post(homeRoute, requestData);
            return true;
        }
        catch (error)
        {
            let errorMsg = (error.message === "Network Error") ? serverConnectionErrorMsg : error.response.data;
            console.error(`Error saving Home data: ${errorMsg}`);
            await this.setStateAndWait({savingMessage: errorMsg});
            return false;
        }
    }

    /**
     * Gets the updated save file data after processing on the server.
     * @param {String} serverConnectionErrorMsg - The message to display if the server couldn't be connected to.
     * @returns {Buffer} The data buffer for the updated save file.
     */
    async getUpdatedSaveFile(serverConnectionErrorMsg)
    {
        let res, originalSaveContents, requestData;
        const saveRoute = `${config.dev_server}/getUpdatedSaveFile`;

        requestData =
        {
            newBoxes: this.state.saveBoxes,
            saveFileData: this.state.saveFileData["data"],
            fileIdNumber: this.state.saveFileNumber,
        };

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
                console.error(`Error loading the save file: ${e}`);
                let errorMsg = "Save file was not found.";
                await this.setStateAndWait({savingMessage: errorMsg});
                return null;
            }

            let typedArray = new Uint8Array(await originalSaveContents.arrayBuffer());
            typedArray = Array.from(typedArray);

            //Compare original save contents to the one saved in the state
            const equals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

            if (!equals(typedArray, this.state.saveFileData["data"]))
            {
                //Save file has been modified and can't be overwritten
                let errorMsg = <span>Saving can't be completed.<br/>The save file has been used recently.<br/>Please reload the page.</span>;
                await this.setStateAndWait({savingMessage: errorMsg});
                return null;
            }
        }

        //Get the updated save file contents
        try
        {
            res = await axios.post(saveRoute, requestData);
        }
        catch (error)
        {
            let errorMsg = (error.message === "Network Error") ? serverConnectionErrorMsg : error.response.data;
            console.error(`Error saving Save data: ${errorMsg}`);
            await this.setStateAndWait({savingMessage: errorMsg});
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
            if (!ACCOUNT_SYSTEM && this.state.changeWasMade[BOX_HOME])
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
                    console.error(`Cancelling saving save file since Cloud file was not found: ${e}`);
                    let errorMsg = "Cloud file was not found.";
                    await this.setStateAndWait({savingMessage: errorMsg});
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
                console.error(`Error saving Save file: ${e}`);
                let errorMsg = <span>Save file is being used elsewhere.<br/>Close open emulators before trying again.</span>;
                await this.setStateAndWait({savingMessage: errorMsg});
                return false;
            }
        }
        else
        {
            await PopUp.fire
            ({
                icon: 'warning',
                title: `Your new save file is about to be downloaded.\nMake sure you replace your old one with the new file!`,
                confirmButtonText: `I Understand`,
                allowOutsideClick: false,
                scrollbarPadding: false,
                didOpen: () =>
                {
                    PopUp.hideLoading(); //From previous pop-ups
                }
            });

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
                console.error(`Error saving Cloud file: ${e}`);
                let errorMsg = "Cloud file was not found.";
                await this.setStateAndWait({savingMessage: errorMsg});
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
     * @param {Boolean} askDoneWithSite - Whether or not the player should be prompted to close the site after the save.
     */
    async trySaveAndExit(askDoneWithSite)
    {
        if (WillAtLeastOneMonLoseDataInSave(this.state.saveBoxes, this.state.saveGameId))
        {
            PopUp.fire
            ({
                icon: 'warning',
                title: "At least one Pokemon will lose data when the game is saved!",
                denyButtonText: "Save Anyway",
                cancelButtonText: "Cancel",
                showConfirmButton: false,
                showDenyButton: true,
                showCancelButton: true,
                scrollbarPadding: false,
            }).then(async (result) =>
            {
                if (result.isDenied) //Save Anyway - uses red colour
                {
                    await this.saveAndExit(askDoneWithSite);
                }
                else
                {
                    PopUp.fire
                    ({
                        title: 'Choose <b>Only</b> for the search option:\n<b>Will Lose Data When Saved</b>\nto find these Pokemon.',
                        scrollbarPadding: false,
                    });
                }
            });
        }
        else
            await this.saveAndExit(askDoneWithSite);
    }

    /**
     * Handles downloading the updated data.
     * @param {Boolean} askDoneWithSite - Whether or not the player should be prompted to close the site after the save.
     */
    async saveAndExit(askDoneWithSite)
    {
        if (!(await this.downloadSaveFileAndHomeData(askDoneWithSite)))
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
        else if (!askDoneWithSite) //Otherwise it would close the pop-up asking the user if they're done
            PopUp.close();
    }


    /**********************************
               Page Elements           
    **********************************/

    /**
     * Gets the button for viewing the Home boxes in both box slots.
     * @returns {JSX.Element} A button element.
     */
    homeToHomeButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;
        var buttonSelected = !this.areOnlyHomeBoxesAccessible() && this.state.editState === STATE_EDITING_HOME_BOXES; //No point in highlighting when only button
        var buttonClickable = !this.areOnlyHomeBoxesAccessible();

        return (
            <Button size="lg" className={"navbar-button" + (buttonSelected ? " navbar-button-selected" : "")}
                    id="home-to-home-button"
                    style={!buttonClickable ? {cursor: "default"} : {}}
                    aria-label="Home to Home"
                    onClick={() => this.changeBoxView(STATE_EDITING_HOME_BOXES)}>
                <FaCloud size={size} /> ↔ <FaCloud size={size} />
            </Button>
        );
    }

    /**
     * Gets the button for viewing the Save boxes in both box slots.
     * @returns {JSX.Element} A button element.
     */
    saveToSaveButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;

        return (
            <Button size="lg" className={"navbar-button" + (this.state.editState === STATE_EDITING_SAVE_FILE ? " navbar-button-selected" : "")}
                    id="save-to-save-button"
                    aria-label="Save File to Save File"
                    onClick={() => this.changeBoxView(STATE_EDITING_SAVE_FILE)}>
                <FaGamepad size={size} /> ↔ <FaGamepad size={size} />
            </Button>
        );
    }

    /**
     * Gets the button for viewing both the Home boxes and the save boxes in the box slots.
     * @returns {JSX.Element} A button element.
     */
    homeToSaveButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;

        return (
            <Button size="lg" className={"navbar-button" + (this.state.editState === STATE_MOVING_POKEMON ? " navbar-button-selected" : "")}
                    id="home-to-save-button"
                    aria-label="Home to Save File"
                    onClick={() => this.changeBoxView(STATE_MOVING_POKEMON)}>
                <FaCloud size={size} /> ↔ <FaGamepad size={size} />
            </Button>
        );
    }

    /**
     * Gets the button for returning to the box view from the box list page.
     * @returns {JSX.Element} A arrow meant to be pressed as a button.
     */
    handlePressBackButton()
    {
        var size = window.innerWidth < 500 ? 28 : 42;
        var paddingRight = window.innerWidth < 500 ? "0%" : "90%";

        return (
            <BiArrowBack size={size} className="navbar-back-button" style={{paddingRight: paddingRight}}
                         id="back-button"
                         aria-label="Back" onClick={this.navBackButtonPressed.bind(this)}/>
        );
    }

    /**
     * Prints the back arrow at the top of the page.
     * @returns {JSX.Element} The back button navbar.
     */
    printBackButton()
    {
        return (
            <div className="navbar-buttons navbar-fixed">
                {this.handlePressBackButton()}
            </div>
        );
    }

    /**
     * Gets the navbar displayed at the top of the page.
     * @returns {JSX.Element} The navbar.
     */
    navBarButtons()
    {
        var viewingNonBoxView = this.state.viewingBoxList >= 0 || this.state.inFriendTrade || this.state.inGTS;

        if (viewingNonBoxView)
            return this.printBackButton();

        return (
            <div className="navbar-buttons navbar-fixed">
                {this.homeToHomeButton()}
                {!this.areOnlyHomeBoxesAccessible() ? this.homeToSaveButton() : ""}
                {!this.areOnlyHomeBoxesAccessible() ? this.saveToSaveButton() : ""}
            </div>
        );
    }

    /**
     * Gets the blank navbar displayed at the top of the page.
     * @returns {JSX.Element} The navbar.
     */
    navBarNoButtons()
    {
        var printBackButton = false;

        switch (this.state.editState)
        {
            case STATE_UPLOAD_HOME_FILE:
            case STATE_CHOOSE_SAVE_HANDLE:
                printBackButton = true;
                break;
            case STATE_UPLOAD_SAVE_FILE:
            case STATE_ENTER_ACTIVATION_CODE:
            case STATE_FORGOT_PASSWORD:
                if (ACCOUNT_SYSTEM)
                    printBackButton = true;
                break;
            default:
                break;
        }

        if (printBackButton)
            return this.printBackButton();

        return (
            <div className="navbar-buttons navbar-blank navbar-fixed" >
                {/* Maybe one day I'll add a title to the navar */}
                {/* <h1 className="text-light">
                    {UNBOUND_LINK} Cloud
                </h1> */}
            </div>
        );
    }

    /**
     * Gets the button for viewing the explanation of the different symbols.
     * @param {Boolean} onOwnLine - Whether or not the button should be on its own line.
     * @returns {JSX.Element} A button element.
     */
    symbolTutorialButton(onOwnLine)
    {
        var size = 42;
        const tooltip = props => (<Tooltip {...props}>Help</Tooltip>);

        return (
            <OverlayTrigger placement="top" overlay={tooltip}>
                <Button size="lg" className={"footer-button " + ((onOwnLine) ? "help-button-mobile" : "help-button")}
                        aria-label="Get Help"
                        onClick={this.showSymbolTutorial.bind(this)}>
                    <MdHelp size={size} />
                </Button>
            </OverlayTrigger>
        );
    }

    /**
     * Gets the button for starting a peer-to-peer trade.
     * @returns {JSX.Element} A button element.
     */
    startTradeButton()
    {
        var size = 42;
        const tooltip = props => (<Tooltip {...props}>Friend Trade</Tooltip>);

        // if (this.state.isSaving)
        //     return ""; //Can't use while saving

        return (
            <OverlayTrigger placement="top" overlay={tooltip}>
                <Button size="lg" className={"footer-button friend-trade-button"}
                        aria-label="Start Trade With a Friend"
                        onClick={this.startFriendTrade.bind(this)}>
                    <MdSwapVert size={size} />
                </Button>
            </OverlayTrigger>
        );
    }

    /**
     * Gets the button for accessing the Global Trade Station.
     * @returns {JSX.Element} A button element.
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
                        <div style={{width: "fit-content", paddingLeft: "14px", paddingRight: "14px"}}
                             onClick={this.openGTS.bind(this)}>
                            {GTS_ICON}
                        </div>
                    </OverlayTrigger>
            </Button>
        );
    }

    /**
     * Gets the button for turning on and off sounds.
     * @returns {JSX.Element} A button element.
     */
    muteSoundsButton()
    {
        var size = 42;
        var icon = (this.state.muted) ? <RiVolumeMuteFill size={size} /> : <RiVolumeUpFill size={size} />;
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
     * Gets the button for turning on and off music.
     * @returns {JSX.Element} A button element.
     */
    muteMusicButton()
    {
        var size = 42;
        var icon = (this.state.songMuted) ? <MdMusicOff size={size} /> : <MdMusicNote size={size} />;
        var tooltipText = (this.state.songMuted) ? "Music Is Off" : "Music Is On";
        const tooltip = props => (<Tooltip {...props}>{tooltipText}</Tooltip>);

        return (
            <OverlayTrigger placement="top" overlay={tooltip}>
                <Button size="lg" className="footer-button music-button"
                        aria-label={tooltipText}
                        onClick={this.changeMusicMuteState.bind(this)}>
                    {icon}
                </Button>
            </OverlayTrigger>
        );
    }

    /**
     * Gets the footer displayed at the bottom of the page.
     * @returns {JSX.Element} The footer and its buttons.
     */
    footerButtons()
    {
        var tradeScreen = this.state.inFriendTrade || this.state.inGTS;
        const buttons =
            <>
                {this.startTradeButton()}
                {this.openGTSButton()}
                {this.muteSoundsButton()}
                {this.muteMusicButton()}
            </>

        if (window.innerWidth >= 600) //Mainly desktop devices, but also includes some mobile ones like iPads
        {
            return (
                <div className={"footer-buttons"}>
                    {this.symbolTutorialButton(false)}

                    <div style={{display: "flex", justifyContent: "center"}}>
                        {buttons}
                    </div>
                    
                    {this.multiArkGamingLogo()}
                </div>
            );
        }
        else //Pretty much only phones
        {
            //The footer bar here is twice the height to allow the help button to be on it's own row
            return (
                <div className={"footer-buttons footer-buttons-mobile"}
                     style={tradeScreen ? {height: "56px"} : {}}>
                    <div className="footer-buttons-mobile-top-row">
                        {buttons}
                    </div>
                    {
                        !tradeScreen ? //Help is hidden during a trade so there's more space
                            <div style={{textAlign: "center"}}>
                                {this.symbolTutorialButton(true) /* The button is placed on it's own line so there's more space */}
                            </div>
                        :
                            ""
                    }
                </div>
            );
        }
    }

    /**
     * Displays a footer that only says Skeli Games and hosted by MultiArkGaming.
     * @returns {JSX.Element} A container with the text and Multiark logo.
     */
    printBlankFooter()
    {
        let currentYear = new Date().getFullYear();

        return (
            <div className="footer-buttons" style={{justifyContent: "space-between"}}>
                <div className="centre-vertical ms-2 text-light">
                    2022-{currentYear} Skeli Games
                </div>
                {this.multiArkGamingLogo()}
            </div>
        )
    }

    /**
     * Displays the logo for the server the site is hosted on.
     * @returns {JSX.Element} An image of the logo fixed on the bottom right hand corner of the page.
     */
    multiArkGamingLogo()
    {
        return (
            <a className="me-2" //Margin right
                href="https://discord.gg/C6pH7wpS7m" target="_blank" rel="noopener noreferrer">
                <img src={BASE_GFX_LINK + "MultiArkBanner.png"}
                        alt="Hosted By MultiArkGaming"
                        className="multi-ark-gaming-logo"/>
            </a>
        );
    }

    /**
     * Prints the ads on the sides of the desktop view.
     * @returns {JSX.Element} The ads to display on the sides.
     */
    printSideAds()
    {
        return (
            <>
                {/* <GoogleAd slot="4079835251"/>
                <GoogleAd slot="2759014723" classNames="google-ad-right"/> */}
            </>
        );
    }

    /**
     * Gets the screen shown when quick jumping between boxes.
     * @returns {JSX.Element} The box list page.
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
     * @returns {JSX.Element} The friend trade page.
     */
    friendTradeScreen()
    {
        return (
            <FriendTrade globalState={this}
                         setGlobalState={this.setState.bind(this)}
                         homeBoxes={this.state.homeBoxes}
                         homeTitles={this.state.homeTitles}
                         finishFriendTrade={this.finishWonderTrade.bind(this)}/>
        );
    }

    /**
     * Gets the screen shown when trying to trade in the Global Trade Station.
     * @returns {JSX.Element} The GTS page.
     */
    gtsScreen()
    {
        return (
            <GlobalTradeStation globalState={this}
                                setGlobalState={this.setState.bind(this)}
                                homeBoxes={this.state.homeBoxes}
                                homeTitles={this.state.homeTitles}/>
        );
    }

    /**
     * Displays an error message that the server could not be connected to.
     * @returns {JSX.Element} A container with the error message.
     */
    printServerConnectionError()
    {
        return (
            <div className="error-text" hidden={!this.state.serverConnectionError}>
                <p>{NO_SERVER_CONNECTION_ERROR}</p>
            </div>
        );
    }
 
    /**
     * Gets the screen shown the first time the user accesses the site (based on the local storage).
     * @returns {JSX.Element} The welcome page.
     */
    printWelcome()
    {
        var nextState;
        const title = <h1 className="main-page-title">Welcome to {UNBOUND_LINK} Cloud {PURPLE_CLOUD}</h1>;
        const romHacksLink = <a href="https://www.pokecommunity.com/forums/rom-hacks-showcase.184/" target="_blank" rel="noopener noreferrer">ROM Hacks</a>;
        const boxesLink = <a href="https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Bank" target="_blank" rel="noopener noreferrer">Boxes</a>;
        const explanation = <p>This is a tool for {romHacksLink} to connect with each other and store {boxesLink} outside of save files.</p>

        if (ACCOUNT_SYSTEM)
            nextState = localStorage.visitedBefore ? STATE_LOGIN : STATE_SIGN_UP;
        else
            nextState = CanUseFileHandleAPI() ? STATE_CHOOSE_HOME_FOLDER : STATE_ASK_FIRST_TIME;

        return (
            <div className="centre-vertical fade-in">
                <div className="welcome-container">
                    {title}
                    {explanation}
                    <Button className="choose-home-file-button"
                            id="get-started-button"
                            onClick={() => this.setState({editState: nextState})} >
                        Get Started ➤
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Gets the page that asks the user if it's their first time on the site.
     * @returns {JSX.Element} The ask first time page.
     */
    printAskFirstTime()
    {
        return (
            <div className="welcome-container fade-in">
                <h2>Is this your first time here?</h2>
                <div>
                    <div>
                        <Button size="lg" variant="success" onClick={() => this.setState({editState: STATE_UPLOAD_SAVE_FILE, isFirstTime: true})}
                                className="choose-home-file-button">
                            Yes
                        </Button>
                    </div>

                    <div>
                        <Button size="lg" variant="secondary" onClick={() => this.setState({editState: STATE_UPLOAD_SAVE_FILE})}
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
     * @returns {JSX.Element} The choose Home file page.
     */
    printUploadHomeFile()
    {
        const error = "Make sure it was a proper Cloud data file and is not corrupted.";

        return (
            <div className="welcome-container fade-in">
                <p className="choose-save-file-heading">Upload your Cloud data.</p>
                <p className="save-file-location-explanation mb-3">It should be a file called <span className="font-monospace">{this.getHomeFileName()}</span>.</p>
                <div>
                    {
                        this.existsLastSavedHomeData() &&
                            <Button size="lg" variant="info" onClick={() => this.useLastSavedHomeFile(error)}
                                    className="choose-home-file-button">
                                Last Saved
                            </Button>
                    }

                    <label className="btn btn-success btn-lg w-100 choose-home-file-button" id="upload-home-file-button-label">
                        Upload File
                        <input type="file" id="upload-home-file-button" hidden onChange={(e) => this.chooseHomeFile(e, error)}
                                accept=".dat" />
                    </label>

                    <Button size="lg" onClick={() => this.setState
                        ({
                            editState: STATE_MOVING_POKEMON,
                            fileUploadError: false,
                            serverConnectionError: false
                        }, () =>
                        {
                            this.playOrPauseMainMusicTheme();
                            this.showSymbolTutorial();
                        })}
                            className="choose-home-file-button">
                        Create New
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Gets the page that displays the upload progress to the user.
     * @returns {JSX.Element} The upload progress page.
     */
    printUploadingFile()
    {
        let fileName, progress;
        if (this.state.uploadProgress === BOX_SAVE)
            fileName = this.state.selectedSaveFile.name;
        else
            fileName = this.state.selectedHomeFile.name;

        progress = `Processing ${fileName}`;

        return (
            <div className="centre-vertical">
                <div className="welcome-container">
                    <h1 className="form-title">{progress}</h1>
                    <h3>Please wait...</h3>
                </div>
            </div>
        );
    }

    /**
     * Gets the page that asks the user to upload their save file.
     * @returns {JSX.Element} The choose save file page.
     */
    printUploadSaveFile()
    {
        return (
            <div className={"welcome-container fade-in" + (isMobile ? " file-handle-page-mobile" : "")}>
                {
                    ACCOUNT_SYSTEM && this.state.username !== "" &&
                        <div>
                            <h1 className="form-title">Welcome back to {UNBOUND_LINK} Cloud {PURPLE_CLOUD}</h1>
                            <h2 className="form-sub-title">Great to see you, <b>{this.state.username}</b>!</h2>
                            <div className="already-have-account-button"
                                id="logout-button"
                                onClick={() => this.navBackButtonPressed()}>
                                This isn't me.
                            </div>
                        </div>
                }
                <div className={"main-page-upload-instructions fade-in" + (isMobile ? " file-handle-page-mobile" : "")}
                     id="upload-instructions">
                    <p className="choose-save-file-heading">Choose your save file.</p>
                    <p className="save-file-location-explanation">
                        If you don't know where it is, start by looking in the same folder as your ROM.
                        The save file is a 128 kB <span className="font-monospace">.sav</span>, <span className="font-monospace">.srm</span>, <span className="font-monospace">.sa1</span>, <span className="font-monospace">.fla</span> file that has your ROM's name.
                    </p>
                    <div className="already-have-account-button mb-3"
                        onClick={() => this.printSupportedHacks()}>
                        Which hacks are supported?
                    </div>
                    <div className="w-100">
                        <label className="btn btn-success btn-lg w-100 choose-home-file-button" id="upload-save-button-label">
                            Upload File
                            <input type="file" id="upload-save-button" hidden onChange={(e) => this.chooseSaveFile(e)}
                                accept=".sav,.srm,.sa1,.fla" />
                        </label>
                        {
                            ACCOUNT_SYSTEM &&
                                <Button size="lg" onClick={() => this.skipSaveFileUpload()}
                                        variant="danger" className="choose-home-file-button" id="just-cloud-button">
                                    Just Cloud
                                </Button>
                        }
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Gets the page that asks the user to choose the directory where their Home file is located.
     * This uses the modern FileSystem API in order to function.
     * @returns {JSX.Element} The choose save folder page.
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
            <div className={"welcome-container fade-in" + (isMobile ? " file-handle-page-mobile" : "")}>
                {
                    showLastUsedButton &&
                        <h1 className="form-title">Welcome Back to {UNBOUND_LINK} Cloud {PURPLE_CLOUD}</h1>
                }

                <div className={"main-page-upload-instructions fade-in" + (isMobile ? " file-handle-page-mobile" : "")}
                     id="upload-instructions">
                    <p className="choose-save-file-heading">Choose your Cloud Data folder.</p>
                    <p className="save-file-location-explanation">
                        This is the folder on your {isMobile ? "device" : "computer"} where your Boxes {showLastUsedButton ? "are" : "will be"} stored.
                        {
                            showLastUsedButton ?
                                <><br/>Since you've made one before, pick <b>Last Used</b>.</>
                            :
                                <><br/>It's best to <b>create</b> a folder called <b>Unbound Cloud</b> in your <b>Documents</b> and save it there.</>
                        }
                    </p>
                    <div className="w-100 mt-3">
                        {
                            showLastUsedButton && //Loaded one in the past
                                lastUsedButton
                        }

                        <Button size="lg" onClick={() => this.chooseHomeFileDirectory()}
                                variant="success" className="choose-home-file-button">
                            Choose Folder
                        </Button>

                        {
                            !showLastUsedButton && !isMobile &&
                                <div className="main-page-home-storage-example-container">
                                    <img src={BASE_GFX_LINK + "DataStorageExample1.png"}
                                        alt="Make a new folder in Documents."
                                        className="main-page-home-storage-example"/>
                                    <img src={BASE_GFX_LINK + "DataStorageExample2.png"}
                                        alt="Name that folder Unbound Cloud and select it."
                                        className="main-page-home-storage-example"/>
                                </div>
                        }
                    </div>
                    {showLastUsedButton ? this.printServerConnectionError() : "" /*Won't actually get used here, but needed to fill space*/}
                </div>
            </div>
        );
    }

    /**
     * Gets the page that asks the user to choose the directory where their save file is located.
     * This uses the modern FileSystem API in order to function.
     * @returns {JSX.Element} The choose save folder page.
     */
    printChooseSaveFile()
    {
        var showLastUsedButton = this.state.saveFileHandle != null;
        var lastUsedButton = 
            <Button size="lg" onClick={() => this.useMostRecentSaveHandle()}
                    variant="info" className="choose-home-file-button">
                <b>Last Used</b>
            </Button>;

        if ("mostRecentSaveFile" in localStorage)
        {
            const tooltip = props => (<Tooltip {...props}>{localStorage.mostRecentSaveFile}</Tooltip>);

            lastUsedButton =
                <OverlayTrigger placement="top" overlay={tooltip}>
                    {lastUsedButton}
                </OverlayTrigger>
        }

        return (
            <div className={"welcome-container fade-in" + (isMobile ? " file-handle-page-mobile" : "")}>
                {
                    ACCOUNT_SYSTEM && this.state.username !== "" &&
                        <div>
                            <h1 className="form-title">Welcome back to {UNBOUND_LINK} Cloud {PURPLE_CLOUD}</h1>
                            <h2 className="form-sub-title">Great to see you, <b>{this.state.username}</b>!</h2>
                            <div className="already-have-account-button"
                                id="logout-button"
                                onClick={() => this.navBackButtonPressed()}>
                                This isn't me.
                            </div>
                        </div>
                }
                <div className={"main-page-upload-instructions fade-in" + (isMobile ? " file-handle-page-mobile" : "")}
                     id="upload-instructions">
                    <p className="choose-save-file-heading">Choose your save file.</p>
                    <p className="save-file-location-explanation">
                        If you don't know where it is, start by looking in the same folder as your ROM.
                        The save file is a 128 kB <span className="font-monospace">.sav</span>, <span className="font-monospace">.srm</span>, <span className="font-monospace">.sa1</span>, <span className="font-monospace">.fla</span> file that has your ROM's name.
                    </p>
                    <div className="already-have-account-button mb-3"
                        onClick={() => this.printSupportedHacks()}>
                        Which hacks are supported?
                    </div>
                    <div className="w-100">
                        {
                            showLastUsedButton && //Loaded one in the past
                                lastUsedButton
                        }

                        <Button size="lg" onClick={() => this.chooseSaveFileHandle()}
                                variant="success" className="choose-home-file-button" id="upload-save-button">
                            Choose File
                        </Button>

                        {
                            ACCOUNT_SYSTEM &&
                                <Button size="lg" onClick={() => this.skipSaveFileUpload()}
                                        variant="danger" className="choose-home-file-button" id="just-cloud-button">
                                    Just Cloud
                                </Button>
                        }
                    </div>
                </div>

                {this.printServerConnectionError() /*Won't actually get used here, but needed to fill space*/}
            </div>
        );
    }

    /**
     * Gets the page with a Home box in both box slots.
     * @returns {JSX.Element} The Home <-> Home page.
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
                this.state.inFriendTrade ?
                    this.friendTradeScreen()
                :
                this.state.inGTS ?
                    this.gtsScreen()
                :
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                    <>
                        <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"} id="boxes">
                            {homeBoxView1}
                            {homeBoxView2}
                        </div>
                        {
                            !isMobile &&
                                this.printSideAds()
                        }
                    </>
            }
            </>
        );
    }

    /**
     * Gets the page with a Save box in both box slots.
     * @returns {JSX.Element} The Save <-> Save page.
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
                this.state.inFriendTrade ?
                    this.friendTradeScreen()
                :
                this.state.inGTS ?
                    this.gtsScreen()
                :
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                    <>
                        <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"} id="boxes">
                            {saveBoxView1}
                            {saveBoxView2}
                        </div>
                        {
                            !isMobile &&
                                this.printSideAds()
                        }
                    </>
            }
            </>
        );
    }

    /**
     * Gets the page with a Home box in one slot, and the save box in the other.
     * @returns {JSX.Element} The Home <-> Save page.
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
                    this.state.inFriendTrade ?
                        this.friendTradeScreen()
                    :
                    this.state.inGTS ?
                        this.gtsScreen()
                    :
                    this.state.viewingBoxList >= 0 ?
                        this.boxListScreen()
                    :
                        <>
                            <div className={this.areBoxViewsVertical() ? "main-page-boxes-mobile" : "main-page-boxes"} id="boxes">
                                {homeBoxView}
                                {saveBoxView}
                            </div>
                            {
                                !isMobile &&
                                   this.printSideAds()
                            }
                        </>
                }
            </>
        );
    }

    /**
     * Gets the page where a user can create an account.
     * @returns {JSX.Element} The sign-up page.
     */
    printSignUpPage()
    {
        return <SignUp mainPage={this}/>;
    }

    /**
     * Gets the page where a user can log in to their account.
     * @returns {JSX.Element} The login page.
     */
    printLoginPage()
    {
        return <Login mainPage={this}/>;
    }

    /**
     * Gets the page where a user can submit a code to activate their account.
     * @returns {JSX.Element} The account activation page.
     */
    printAccountActivationPage()
    {
        return <ActivateAccount mainPage={this}/>;
    }

    /**
     * Gets the page where a user can reset their forgotten password.
     * @returns {JSX.Element} The forgot password page.
     */
    printForgotPasswordPage()
    {
        return <ForgotPassword mainPage={this}/>;
    }

    /**
     * Gets the page that says the current browser is incompatible with the site.
     * @returns {JSX.Element} The not supported in browser page.
     */
    printNotSupportedInBrowser()
    {
        return (
            
            <div className="centre-vertical fade-in">
                <div className="welcome-container">
                    <h2>😞 <b>{UNBOUND_LINK} Cloud is not supported in this browser. 😞</b></h2>
                    <h3>Please use an updated Google Chrome, Microsoft Edge, or Opera.</h3>
                    <h3>Why? See <a href="https://caniuse.com/?search=showOpenFilePicker">here</a>.</h3>
                </div>
            </div>
        )
    }

    /**
     * Gets the page that says the site currently can't be used due to maintenance.
     * @returns {JSX.Element} The not maintenance.
     */
    printUndergoingMaintence()
    {
        return (
            
            <div className="centre-vertical fade-in">
                <div className="welcome-container">
                    <h2><b>{UNBOUND_LINK} Cloud is currently undergoing maintenance. 🛠️</b></h2>
                    <h3>Hopefully, this won't last too long.</h3>
                    <input style={{marginTop: "5%"}}
                        onChange={(e) => this.setState({unlockedMobile: e.target.value === "opensesame"})}/>
                </div>
            </div>
        )
    }

    /**
     * Gets the page that says the site currently can't be used on mobile devices.
     * @returns {JSX.Element} The not supported on mobile page.
     */
    printNotSupportedOnMobile()
    {
        return (
            
            <div className="centre-vertical fade-in">
                <div className="welcome-container">
                    <h2><b>{UNBOUND_LINK} Cloud is currently not supported on mobile. 😞</b></h2>
                    <h3>Hopefully, this won't last too long.</h3>
                    <input style={{marginTop: "5%"}}
                        onChange={(e) => this.setState({unlockedMobile: e.target.value === "opensesame"})}/>
                </div>
            </div>
        )
    }

    /**
     * Gets the page that says the site currently can't be used by non-testers.
     * @returns {JSX.Element} The not officially released page.
     */
    printNotOfficiallyReleased()
    {
        return (
            <div className="centre-vertical fade-in">
                <div className="welcome-container">
                    <h2><b>{UNBOUND_LINK} Cloud is not officially released.</b></h2>
                    <input style={{marginTop: "5%"}}
                        onChange={(e) => this.setState({unlockedMobile: e.target.value === "opensesame"})}/>
                </div>
            </div>
        )
    }

    /**
     * Prints the main page.
     */
    render()
    {
        let page, draggingImg;
        let navBar = false;
        let blankFooter = true;
        let centerHorizontal = true;
        let fullHeight = false;

        switch (this.state.editState)
        {
            case STATE_WELCOME:
                page = this.printWelcome();
                fullHeight = true;
                break;
            case STATE_SIGN_UP:
                page = this.printSignUpPage();
                break;
            case STATE_LOGIN:
                page = this.printLoginPage();
                break;
            case STATE_ENTER_ACTIVATION_CODE:
                page = this.printAccountActivationPage();
                break;
            case STATE_FORGOT_PASSWORD:
                page = this.printForgotPasswordPage();
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
                blankFooter = false;
                centerHorizontal = false;
                break;
            case STATE_EDITING_SAVE_FILE:
                page = this.printEditingSaveBoxes(); //Don't display title
                navBar = true;
                blankFooter = false;
                centerHorizontal = false;
                break;
            case STATE_MOVING_POKEMON:
                page = this.printMovingPokemon(); //Don't display title
                navBar = true;
                blankFooter = false;
                centerHorizontal = false;
                break;
            default:
                page = "";
                break;
        }

        if (!DEBUG_ORIGINAL_FILE_METHOD && !IsMobileBrowser() && !CanUseFileHandleAPI())
        {
            page = this.printNotSupportedInBrowser();
            fullHeight = true;
        }
        else if (MAINTENANCE && !this.state.unlockedMobile)
        {
            page = this.printUndergoingMaintence();
            fullHeight = true;
        }
        else if (DISABLE_ON_MOBILE && IsMobileBrowser() && !this.state.unlockedMobile)
        {
            page = this.printNotSupportedOnMobile();
            fullHeight = true;
        }
        else if (UNOFFICIAL_RELEASE && (!DISABLE_ON_MOBILE || !IsMobileBrowser())
        && this.state.editState === STATE_WELCOME && !this.state.unlockedMobile && !localStorage.visitedBefore)
        {
            page = this.printNotOfficiallyReleased();
            fullHeight = true;
        }

        draggingImg = ""
        if (this.shouldViewDraggingImg())
            draggingImg = <img src={this.state.draggingImg} alt={GetSpeciesName(GetSpecies(this.getMonAtBoxPos(this.state.draggingFromBox, this.state.draggingMon)), true)}
                               onMouseDown={(e) => e.preventDefault()} id="moving-icon" className="dragging-image"/>;

        let cursorStyle = draggingImg !== "" ? {cursor: "grabbing"} : {};
        fullHeight = (fullHeight) ? {height: "100%"} : {};
        return (
            <div className="main-page"
                 id="main-page" style={{...cursorStyle}}
                 onMouseMove={(e) => this.moveDraggingMonIcon(e)} >
                {/* Navbar at the top */}
                {navBar ? this.navBarButtons() : this.navBarNoButtons()}

                <div className={"main-page-content-footer" + ((isMobile) ? "-mobile scroll-container-mobile" : "")}>
                    {/* Main content */}
                    <div className={(!isMobile) ? "main-page-content scroll-container" : "main-page-content-mobile"}
                         style={(centerHorizontal) ? {display: "flex", justifyContent: "center", ...fullHeight} : {}} >
                        {page}
                    </div>

                    {/* Footer at the bottom */}
                    {
                        (blankFooter) ? this.printBlankFooter() :
                        (this.state.viewingBoxList < 0) ? this.footerButtons() : "" //Don't show footer buttons when viewing a box list
                    }
                </div>

                {/* Allow dragging of Pokémon */}
                {draggingImg}
            </div>
        );
    }
}

/**
 * Gets the starting site the user is directed to when the access the site.
 * @returns {Number} The starting edit state.
 */
//eslint-disable-next-line
function GetInitialPageState()
{
    if (ACCOUNT_SYSTEM && !DEMO_SITE)
    {
        if (localStorage.username && localStorage.accountCode)
        {
            if (!localStorage.activated || localStorage.activated === "false")
                return STATE_ENTER_ACTIVATION_CODE;
            else
                return CanUseFileHandleAPI() ? STATE_CHOOSE_SAVE_HANDLE : STATE_UPLOAD_SAVE_FILE;
        }
    }
    else
    {
        if (DEMO_SITE)
            return STATE_MOVING_POKEMON;

        if (localStorage.visitedBefore)
            return CanUseFileHandleAPI() ? STATE_CHOOSE_HOME_FOLDER : STATE_UPLOAD_SAVE_FILE;
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

    //Only allows the FileSystem API if the user is on desktop or phone
    return typeof(window.showOpenFilePicker) === "function"
        && !isSmartTV
        && !isWearable
        && !isConsole
        && !isEmbedded;
}

/**
 * Checks if the user's browser is being run from a mobile device.
 * @returns {Boolean} True if the user's browser is running from a mobile device. False if not.
 */
function IsMobileBrowser()
{
    //Some mobile devices can be run in desktop mode, so this determines that
    //X11 is not mobile specific, but it's needed to get Chrome on Android in desktop view working
    return isMobile
        || isSmartTV
        || isWearable
        || isConsole
        || isEmbedded
        || isAndroid
        || isWinPhone
        || isIOS
        || navigator.userAgent.match(/Mobile|Lumia|Blackberry|PlayBook|BB10|X11|Opera Mini|\bCrMo\/|Opera Mobi|Tablet/i);
}
