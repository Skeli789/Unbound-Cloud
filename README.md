# Unbound Cloud

## What is this?

Unbound Cloud is a tool for uploading Box data from certain ROM Hacks to the cloud.

- The production site can be accessed from [here](https://unboundcloud.net).
- The test site can be accessed from [here](https://unbound-home.herokuapp.com/).

## Features
- **100 [Storage Boxes](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Storage_System)**
  - Save up to 3000 species in the Boxes per account, with another 3000 for randomized save files!
- **Full Search Functionality**
  - Search with a variety of filters like species and [natures](https://bulbapedia.bulbagarden.net/wiki/Nature)!
- **Mass [Release](https://bulbapedia.bulbagarden.net/wiki/Released_Pok%C3%A9mon)**
  - Release up to an entire Box at a time!
- **[Showdown](https://play.pokemonshowdown.com/) Converter**
  - Convert your species to be usable in Showdown!
- **[Living Dex](https://bulbapedia.bulbagarden.net/wiki/Living_Pok%C3%A9dex) Sorting**
  - Sort your species based on their Dex number with the click of a button!
- **[Wonder Trading](https://bulbapedia.bulbagarden.net/wiki/Wonder_Trade)**
  - Send and receive a random species from another user!
- **[Friend Trading](https://bulbapedia.bulbagarden.net/wiki/Trade)**
  - Trade directly species with another user!
- **[Global Trading](https://bulbapedia.bulbagarden.net/wiki/Global_Trade_System)**
  - WIP!

## Develop Locally

To run the `main` branch locally for development purposes, the client and the server must be run in seperate terminals. The steps are as follows:

1. Install [Node.js](https://nodejs.org/en/download)

1. Install [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/)

1. Install the client's dependencies with:
    ```bash
    yarn install
    ```

1. Install the server's dependencies with:
    ```bash
    cd server
    yarn install
    ```

1. In `src/MainPage.js`, change the line that starts with:
    ```js
    const ACCOUNT_SYSTEM = true;
    ```
    To start with:
    ```js
    const ACCOUNT_SYSTEM = false;
    ```
    For development purposes, this will store your Cloud Boxes locally on your machine in a directory of your choosing.

1. Run the client in one terminal with:
    ```bash
    yarn start
    ```

1. Run the server in a second terminal with:
    ```bash
    cd server
    yarn start
    ```

1. Visit http://localhost:3000 in your browser to access the site.

## Adding Your Hack

**Currently, only CFRU-based hacks are supported.**

In order to add your own hack, the following changes must be made (see how it is done with Unbound, for reference):

1. Under `server/src/data`, create a directory with your hack's title. E.g. `unbound`.

   Inside the directory, add the following files:
    - `BallTypes.json`: A JSON `string array` of all of the different Ball types found in your hack.
    - `BaseStats.json`: A JSON `object array` of the relevant base stats for all of the species in your hack.
      - All unofficial species (eg. Zygarde Cells, Fakemon) should be removed.
      - If converting the `BaseStats.c` file (see the note below), and if any Pokemon are using CFRU "leech" Abilities to implement additional Abilities, they must be commented next to the Ability with `//-` before converting the file. E.g.:
        ```c
        .ability1 = ABILITY_HUGEPOWER, //-ABILITY_PUREPOWER
        ```
    - `Items.json`: A JSON `object`, with keys being the item ID (decimal `string`) as found in your hack, and the value being the item define.
      - All Key Items, TMs/HMs, and blank items should be removed.
      - See note below for instructions on how to generate this file.
    - `Moves.json`: A JSON `object` with keys being the move ID (decimal `string`) as found in your hack, and the value being the move define.
      - All Max Moves and Z-Moves should be removed.
      - See note below for instructions on how to generate this file.
    - `Species.json`: A JSON `object` with keys being the species ID (decimal `string`) as found in your hack, and the value being the species define.
      - All unofficial species (eg. Zygarde Cells, Fakemon), Megas, Primals, and Gigantamax forms should be removed. Forms of the Pokemon that can't exist outside of battle (eg. Mimikyu Busted) can be left in and the site will automatically revert them to the base form if they're found in a Box.
      - See note below for instructions on how to generate this file.
    - `UnofficialSpecies.json`: A JSON `object` with keys being the species ID (decimal `string`) as found in your hack, and the value being the species define.
      - Only needed if there are Fakemon in the hack.

   Note, some of the above files can be generated from your `.h` files. To do this:
   - Find the main function `server/src/Defines.py`.
   - Modify the `version` variable to be the same as the directory created for your hack under `server/src/data/yourhack`.
   - Place the `.h` files in the directory created for your hack under `server/src/data/yourhack`.
   - Remove any irrelevnt defines such as `ITEMS_COUNT` and `NUM_SPECIES` from the `.h`. files.
   - Run the `server/src/Defines.py` from within the `server/src` directory.
   - Clean up the generated `.json` files and remove any irrelevant defines.

1. In `server/src/Defines.py`, make the following modifications:
    - Under `## File Signatures ##`, add a unique 4 byte ID for your hack, such as `0x12345678`.
    - Under `## Flags and Vars ##`, add any flags or vars needed to prevent access to Cloud at certain points in your player's journey.
    - Under `## Other Constants ##`, add other constants needed, such as custom shiny odds.
    - Under `## Game Versions ##`, add a new entry immediately after `VERSION_LEAFGREEN`. **Do not add one if your hack is just an enhancement hack!**
    - Under `## Regions ##`, if your hack's region is not already found, add the region from your hack.
    - Under `GameDetails = {`, add a new entry for your hack. See how other hacks are done in order to understand how to add yours.
    - Under `CustomHackVersions = {`, if your created a custom version under `## Game Versions ##`, add it here as well.

1. In `src/data`, change the following files:
    - `AbilityNames.json`: Add the Ability names for any custom Abilities you have in your hack.
    - `BallTypeNames.json`: Add the Ball names for any custom Balls you have in your hack. Also add the item sprite in `public/images/balls/` as a 32x32 transparent `.png` file.
    - `ItemNames.json`: Add the item names for any custom items you have in your hack. Also add the item sprite in `public/images/items/` as a 40x40 transparent `.png` file.
    - `MoveData.json`: Add the move details for any custom moves you have in your hack.
    - `MoveNames.json`: Add the move names for any custom moves you have in your hack.

1. In `src/MainPage.js`, find the `SUPPORTED_HACKS` array and add the version of your hack that's supported.

1. In `src/PokemonUtil.js`, add imports for your hack at the top of the file below the data for the latest hack. E.g.
    ```js
    //Your Hack Data
    import YourHackBaseStats from "./data/yourhack/BaseStats.json";
    import YourHackMoves from "./data/yourhack/Moves.json";
    import YourHackItems from "./data/yourhack/Items.json";
    import YourHackBallTypes from "./data/yourhack/BallTypes.json";
    ```

    And in the `GAME_IDS_TO_DATA` object, link the imported files below the data for the latest hack. E.g.
    ```js
    "yourhack":
    {
        "baseStats": YourHackBaseStats,
        "moves": YourHackMoves,
        "items": YourHackItems,
        "ballTypes": YourHackBallTypes,
    },
    ```

1. Add a save file for your hack under `server/pytests/data/saves/yourhack.sav`. Ideally, every Box should be full.

1. In `server\pytests\test_Integrated.py`, add tests for your hack. Copy the existing tests that start with the following names:
   - `testLoadAll`
   - `testReplaceAll`
   - `testTransfer`

    The name of the save file used in these tests should match the name of the save file created in the step before.

1. In the CFRU's [src/config.h](https://github.com/Skeli789/Complete-Fire-Red-Upgrade/blob/master/src/config.h), add a define for `CUSTOM_FILE_SIGNATURE` set to the file signature value set in `server/src/Defines.py` under `## File Signatures ##`.

1. In the CFRU, disable trading by making the following changes:

    - In [repoints](https://github.com/Skeli789/Complete-Fire-Red-Upgrade/blob/master/repoints), add:
        ```
        #Remove Link Trading
        EventScript_CableClub_WirelessTrade 81BB47D
        EventScript_CableClub_WirelessTrade 81BBC01
        EventScript_CableClub_WirelessTrade 81BBC43
        ```

    - Add a new file called `cable_club.s` in [assembly/overworld_scripts](https://github.com/Skeli789/Complete-Fire-Red-Upgrade/tree/master/assembly/overworld_scripts) with the contents:
        ```c
        .text
        .thumb
        .align 2

        .include "../xse_commands.s"
        .include "../xse_defines.s"

        .equ EventScript_CableClub_AbortLink, 0x81BB82F
        EventScript_CableClub_WirelessTrade:
            msgbox gText_LinkNurse_NoTradingUseUnboundCloud MSG_FACE
            goto EventScript_CableClub_AbortLink
        ```

    - Add a new file called `cable_club.string` in [strings](https://github.com/Skeli789/Complete-Fire-Red-Upgrade/tree/master/strings), and add:
        ```c
        #org @gText_LinkNurse_NoTradingUseUnboundCloud
        I'm sorry, but trading is no longer\navailable from the Cable Club.\pPlease use Unbound Cloud if you wish\nto trade Pok\emon.
        ```

1. Once all changes have been made correctly, run the script `DataCopy.py` to copy the changes made on the server to the front end. If all changes are made correctly, the script should print:
    ```
    Data copied successfully!
    Data validated successfully!
    ```
    If there seem to be issues with some of your defines for official data not being validated, try to match your defines to what already exists for other hacks.
    
    For example, if your define for male Basculegion is `"SPECIES_BASCULEGION"`, change it to `"SPECIES_BASCULEGION_M"` in order to match what already exists within the repo.

1. If the RAM used for the Boxes and Dex flags have changes from what's in the CFRU, please let Skeli know so this code can be modified as necessary in order to read from your hack's save file.

1. Run the website locally and test whether or not your save file can be uploaded. If it loads and all looks good, open a pull request!

# Updating Your Hack

If you make any changes to the species, moves, items, or base stats in your game, you must create a new file signature before updating your hack! Failure to do so may have your hack removed from Unbound Cloud. The old file signature can be stored under `## Old File Signatures ##` and `OldVersionFileSignatures = {` to indicate to your players they need to update their save file.
