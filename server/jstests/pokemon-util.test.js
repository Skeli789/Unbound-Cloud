const expect = require('chai').expect;
const {gTestPokemon, gTestPokemon2,
       gTestTradeNormalPokemon, gTestTradeItemPokemon,
       gTestTradeShelmet, gTestTradeKarrablast,
       gTestBlankPokemon} = require('./data');
const pokemonUtil = require('../pokemon-util');
const util = require('../util');


describe("Test CalculateMonChecksum", () =>
{
    it(`should be ${gTestPokemon.checksum} for gTestPokemon`, () =>
    {
        let checksum = pokemonUtil.CalculateMonChecksum(gTestPokemon);
        expect(checksum).to.equal(gTestPokemon.checksum);
    });

    it(`should be ${gTestPokemon2.checksum} for gTestPokemon2`, () =>
    {
        let checksum = pokemonUtil.CalculateMonChecksum(gTestPokemon2);
        expect(checksum).to.equal(gTestPokemon2.checksum);
    });

    it(`should be unchanged with modified markings`, () =>
    {
        let pokemon = JSON.parse(JSON.stringify(gTestPokemon)); //Deep copy
        pokemon.markings[0] = true;
        let checksum = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(checksum).to.equal(gTestPokemon.checksum);
    });

    it(`should be unchanged with a modified checksum`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon2);
        pokemon.checksum = "blash";
        let checksum = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(checksum).to.equal(gTestPokemon2.checksum);
    });

    it(`should be unchanged with added Wonder Trade timestamp`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon2);
        pokemon.wonderTradeTimestamp = "blash";
        let checksum = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(checksum).to.equal(gTestPokemon2.checksum);
    });

    it(`should be the same for similar objects`, () =>
    {
        let pokemon1 = {"species": "SPECIES_BULBASAUR", "personality": 12345678}
        let pokemon2 = {"personality": 12345678, "species": "SPECIES_BULBASAUR"}
        let checksum1 = pokemonUtil.CalculateMonChecksum(pokemon1);
        let checksum2 = pokemonUtil.CalculateMonChecksum(pokemon2);
        expect(checksum1).to.equal(checksum2);
    });
});


describe("Test ValidatePokemon", () =>
{
    it(`should be valid for gTestPokemon`, () =>
    {
        expect(pokemonUtil.ValidatePokemon(gTestPokemon, false)).to.be.true;
    });

    it(`should be valid for gTestPokemon2`, () =>
    {
        expect(pokemonUtil.ValidatePokemon(gTestPokemon2, false)).to.be.true;
    });

    it(`should not be valid for a missing checksum`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        delete pokemon.checksum;
        expect(pokemonUtil.ValidatePokemon(pokemon, false)).to.be.false;
    });

    it(`should be valid for null Pokemon`, () =>
    {
        expect(pokemonUtil.ValidatePokemon(null, true)).to.be.true;
    });

    it(`should be invalid for null Pokemon`, () =>
    {
        expect(pokemonUtil.ValidatePokemon(null, false)).to.be.false;
    });

    it(`should be invalid for null Pokemon`, () =>
    {
        expect(pokemonUtil.ValidatePokemon(null, false, true)).to.be.false;
    });

    it(`should be valid for empty Pokemon`, () =>
    {
        expect(pokemonUtil.ValidatePokemon({}, false, true)).to.be.true;
    });

    it(`should be valid for blank Pokemon`, () =>
    {
        expect(pokemonUtil.ValidatePokemon({"field1": 0, "field2": null, "field3": ""}, false, true)).to.be.true;
    });

    it(`should be valid for blank test Pokemon`, () =>
    {
        expect(pokemonUtil.ValidatePokemon(gTestBlankPokemon, false, true)).to.be.true;
    });
});


describe("Test IsEgg", () =>
{
    it(`should be false for gTestPokemon"`, () =>
    {
        expect(pokemonUtil.IsEgg(gTestPokemon)).to.be.false;
    });

    it(`should be true if isEgg=true"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isEgg = true;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsEgg(pokemon)).to.be.true;
    });

    it(`should be false if isEgg=0`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isEgg = 0;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsEgg(pokemon)).to.be.false;
    });

    it(`should be true if isEgg=1"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isEgg = 1;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsEgg(pokemon)).to.be.true;
    });

    it(`should be true if isBadEgg=true"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isBadEgg = true;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsEgg(pokemon)).to.be.true;
    });

    it(`should be false if isBadEgg=0`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isBadEgg = 0;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsEgg(pokemon)).to.be.false;
    });

    it(`should be true if isBadEgg=1"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isBadEgg = 1;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsEgg(pokemon)).to.be.true;
    });
});


describe("Test IsBadEgg", () =>
{
    it(`should be false for gTestPokemon"`, () =>
    {
        expect(pokemonUtil.IsEgg(gTestPokemon)).to.be.false;
    });

    it(`should be false if isEgg=true alone"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isEgg = true;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsBadEgg(pokemon)).to.be.false;
    });

    it(`should be true if isBadEgg=true"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isBadEgg = true;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsBadEgg(pokemon)).to.be.true;
    });

    it(`should be false if isBadEgg=0`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isBadEgg = 0;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsBadEgg(pokemon)).to.be.false;
    });

    it(`should be true if isBadEgg=1"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.isBadEgg = 1;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.IsBadEgg(pokemon)).to.be.true;
    });
});


describe("Test GetSpecies", () =>
{
    it(`should be SPECIES_VENUSAUR for gTestPokemon`, () =>
    {
        expect(pokemonUtil.GetSpecies(gTestPokemon)).to.equal("SPECIES_VENUSAUR");
    });

    it(`should be SPECIES_GENGAR for gTestPokemon2`, () =>
    {
        expect(pokemonUtil.GetSpecies(gTestPokemon2)).to.equal("SPECIES_GENGAR");
    });

    it(`should be SPECIES_NONE for null pokemon`, () =>
    {
        expect(pokemonUtil.GetSpecies(null)).to.equal("SPECIES_NONE");
    });

    it(`should be SPECIES_NONE for missing species field`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        delete pokemon["species"];
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_NONE");
    });

    it(`should be SPECIES_NONE for invalid species`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon["checksum"] = 0;
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_NONE");
    });
});


describe("Test GetItem", () =>
{
    it(`should be ITEM_NONE for gTestPokemon`, () =>
    {
        expect(pokemonUtil.GetItem(gTestPokemon)).to.equal("ITEM_NONE");
    });

    it(`should be ITEM_METAL_COAT for gTestTradeItemPokemon`, () =>
    {
        expect(pokemonUtil.GetItem(gTestTradeItemPokemon)).to.equal("ITEM_METAL_COAT");
    });

    it(`should be ITEM_NONE for null pokemon`, () =>
    {
        expect(pokemonUtil.GetItem(null)).to.equal("ITEM_NONE");
    });

    it(`should be ITEM_NONE for missing item field`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeItemPokemon);
        delete pokemon["species"];
        expect(pokemonUtil.GetItem(pokemon)).to.equal("ITEM_NONE");
    });

    it(`should be ITEM_NONE for invalid pokemon`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeItemPokemon);
        pokemon["checksum"] = 0;
        expect(pokemonUtil.GetItem(pokemon)).to.equal("ITEM_NONE");
    });
});


describe("Test GetBaseFriendship", () =>
{
    it(`should be 50 for gTestPokemon`, () =>
    {
        expect(pokemonUtil.GetBaseFriendship(gTestPokemon)).to.equal(50);
    });

    it(`should be 0 for SPECIES_DIALGA`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon["species"] = "SPECIES_DIALGA";
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        expect(pokemonUtil.GetBaseFriendship(pokemon)).to.equal(0);
    });

    it(`should be 50 for invalid species`, () =>
    {
        expect(pokemonUtil.GetBaseFriendship(null)).to.equal(50);
    });
});


describe("Test SetFriendship", () =>
{
    it(`should be valid after setting friendship and actually be set`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetFriendship(pokemon, 220);
        expect(pokemonUtil.ValidatePokemon(pokemon)).to.be.true;
        expect(pokemon.friendship).to.equal(220);
    });

    it(`should enforce max amount`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetFriendship(pokemon, 5410451);
        expect(pokemonUtil.ValidatePokemon(pokemon)).to.be.true;
        expect(pokemon.friendship).to.equal(255);
    });

    it(`should do nothing for bad value`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetFriendship(pokemon, "Hello");
        expect(pokemon).to.eql(gTestPokemon);
    });

    it(`should do nothing for fake Pokemon`, () =>
    {
        let pokemon = {};
        pokemonUtil.SetPokemonNickname(pokemon, "Blah");
        expect(Object.keys(pokemon).length).to.equal(0);
    });
});


describe("Test GetNickname & SetPokemonNickname", () =>
{
    it(`should be valid after setting nickname`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetPokemonNickname(pokemon, "Blah");
        expect(pokemonUtil.ValidatePokemon(pokemon)).to.be.true;
    });

    it(`should be actually set`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let nickname = "Blah";
        pokemonUtil.SetPokemonNickname(pokemon, nickname);
        expect(pokemonUtil.GetNickname(pokemon)).to.equal(nickname);
    });

    it(`should enforce max name length`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let nickname = "Feraligatrdcfdvdfs";
        let expectedNickname = "Feraligatr";
        pokemonUtil.SetPokemonNickname(pokemon, nickname);
        expect(pokemonUtil.GetNickname(pokemon)).to.equal(expectedNickname);
    });

    it(`should do nothing for bad value`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetPokemonNickname(pokemon, 5);
        expect(pokemon).to.eql(gTestPokemon);
    });

    it(`should do nothing for fake Pokemon`, () =>
    {
        let pokemon = {};
        pokemonUtil.SetPokemonNickname(pokemon, "Blah");
        expect(Object.keys(pokemon).length).to.equal(0);
    });
});


describe("Test GetOTName & SetOTName", () =>
{
    it(`should be valid after setting nickname`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetOTName(pokemon, "Blah");
        expect(pokemonUtil.ValidatePokemon(pokemon)).to.be.true;
    });

    it(`should be actually set`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let otName = "Blah";
        pokemonUtil.SetOTName(pokemon, otName);
        expect(pokemonUtil.GetOTName(pokemon)).to.equal(otName);
    });

    it(`should enforce max name length`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let otName = "Ashencone";
        let expectedOTName = "Ashenco";
        pokemonUtil.SetOTName(pokemon, otName);
        expect(pokemonUtil.GetOTName(pokemon)).to.equal(expectedOTName);
    });

    it(`should do nothing for bad value`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetOTName(pokemon, 5);
        expect(pokemon).to.eql(gTestPokemon);
    });

    it(`should do nothing for fake Pokemon`, () =>
    {
        let pokemon = {};
        pokemonUtil.SetOTName(pokemon, "Blah");
        expect(Object.keys(pokemon).length).to.equal(0);
    });
});


describe("Test GivePokemonSpeciesName", () =>
{
    it(`should be Venusaur for gTestPokemon`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetPokemonNickname(pokemon, "Blah");
        pokemonUtil.GivePokemonSpeciesName(pokemon)
        expect(pokemonUtil.GetNickname(pokemon)).to.equal("Venusaur");
    });

    it(`should be Gengar for gTestPokemon2`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon2);
        pokemonUtil.SetPokemonNickname(pokemon, "Blah");
        pokemonUtil.GivePokemonSpeciesName(pokemon)
        expect(pokemonUtil.GetNickname(pokemon)).to.equal("Gengar");
    });
});


describe("Test ReplaceNicknameWithSpeciesNameIfNeeded", () =>
{
    it(`should be replaced for "rapist"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.SetPokemonNickname(pokemon, "rapist");
        pokemonUtil.ReplaceNicknameWithSpeciesNameIfNeeded(pokemon)
        expect(pokemonUtil.GetNickname(pokemon)).to.equal("Venusaur");
    });

    it(`should be left alone for "My Love"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let nickname = "My Love";
        pokemonUtil.SetPokemonNickname(pokemon, nickname);
        pokemonUtil.ReplaceNicknameWithSpeciesNameIfNeeded(pokemon)
        expect(pokemonUtil.GetNickname(pokemon)).to.equal(nickname);
    });
});


describe("Test ReplaceOTNameWithGenericNameIfNeeded", () =>
{
    it(`should be replaced for "Sex"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let otName = "Sex";
        pokemonUtil.SetOTName(pokemon, otName);
        pokemonUtil.ReplaceOTNameWithGenericNameIfNeeded(pokemon)
        expect(pokemonUtil.GetOTName(pokemon)).to.not.equal(otName);
        expect(pokemonUtil.GetOTName(pokemon)).to.not.equal(gTestPokemon.otName);
    });

    it(`should be left alone for "Lovery"`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let otName = "Lovery";
        pokemonUtil.SetOTName(pokemon, otName);
        pokemonUtil.ReplaceOTNameWithGenericNameIfNeeded(pokemon)
        expect(pokemonUtil.GetOTName(pokemon)).to.equal(otName);
    });
});

describe("Test TryActivateTradeEvolution", () =>
{
    it(`gTestPokemon should not be changed after trading`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_CHARIZARD");
        expect(pokemon).to.eql(gTestPokemon);
    });

    it(`Kadabra should evolve just by trading`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeNormalPokemon);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_HAUNTER");
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_ALAKAZAM");
        expect(pokemonUtil.GetNickname(pokemon)).to.equal("Alakazam");
        expect(pokemonUtil.GetItem(pokemon)).to.equal("ITEM_ALAKAZITE"); //Confirm item is kept
    });

    it(`Scyther should evolve when traded with Metal Coat"`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeItemPokemon);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_PINSIR");
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_SCIZOR");
        expect(pokemonUtil.GetNickname(pokemon)).to.equal("Scizor");
        expect(pokemonUtil.GetItem(pokemon)).to.equal("ITEM_NONE");
    });

    it(`Shelmet should evolve when traded with Karrablast`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeShelmet);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_KARRABLAST");
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_ACCELGOR");
        expect(pokemonUtil.GetNickname(pokemon)).to.equal("Accelgor");
    });

    it(`Karrablast should evolve when traded with Shelmet`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeKarrablast);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_SHELMET");
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_ESCAVALIER");
        expect(pokemonUtil.GetNickname(pokemon)).to.equal(pokemonUtil.GetNickname(gTestTradeKarrablast));
    });

    it(`Shelmet should not evolve when traded with other Pokemon`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeShelmet);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_VOLCARONA");
        expect(pokemon).to.eql(gTestTradeShelmet);
    });

    it(`Kadabra in an Egg shouldn't evolve`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeNormalPokemon);
        pokemon.isEgg = true;
        pokemon["checksum"] = pokemonUtil.CalculateMonChecksum(pokemon);
        let beforeTrade = Object.assign({}, pokemon);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_HAUNTER");
        expect(pokemon).to.eql(beforeTrade);
    });

    it(`Pokemon with nickname should keep it`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeNormalPokemon);
        let nickname = "Nicky";
        pokemonUtil.SetPokemonNickname(pokemon, nickname);
        pokemonUtil.TryActivateTradeEvolution(pokemon, "SPECIES_HAUNTER");
        expect(pokemonUtil.GetNickname(pokemon)).to.equal(nickname);
    });
});


describe("Test UpdatePokemonAfterNonFriendTrade", () =>
{
    it(`should set base friendship`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeItemPokemon);
        pokemonUtil.UpdatePokemonAfterNonFriendTrade(pokemon, gTestPokemon);
        expect(pokemon.friendship).to.equal(50);
    });

    it(`should evolve Pokemon`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeShelmet);
        let pokemon2 = Object.assign({}, gTestTradeKarrablast);
        pokemonUtil.UpdatePokemonAfterNonFriendTrade(pokemon, pokemon2);
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_ACCELGOR");
    });

    it(`should remove bad words`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let nickname = "Fuct";
        let otName = "Coon";
        pokemonUtil.SetPokemonNickname(pokemon, nickname);
        pokemonUtil.SetOTName(pokemon, otName);
        pokemonUtil.UpdatePokemonAfterNonFriendTrade(pokemon, pokemon);
        expect(pokemonUtil.GetNickname(pokemon)).to.equal(util.GetSpeciesName(pokemonUtil.GetSpecies(pokemon)));
        expect(pokemonUtil.GetOTName(pokemon)).to.not.equal(otName);
    });
});


describe("Test UpdatePokemonAfterFriendTrade", () =>
{
    it(`should set base friendship`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeItemPokemon);
        pokemonUtil.UpdatePokemonAfterFriendTrade(pokemon, gTestPokemon);
        expect(pokemon.friendship).to.equal(50);
    });

    it(`should evolve Pokemon`, () =>
    {
        let pokemon = Object.assign({}, gTestTradeShelmet);
        let pokemon2 = Object.assign({}, gTestTradeKarrablast);
        pokemonUtil.UpdatePokemonAfterFriendTrade(pokemon, pokemon2);
        expect(pokemonUtil.GetSpecies(pokemon)).to.equal("SPECIES_ACCELGOR");
    });

    it(`should not remove bad words`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        let nickname = "Fuct";
        let otName = "Coon";
        pokemonUtil.SetPokemonNickname(pokemon, nickname);
        pokemonUtil.SetOTName(pokemon, otName);
        pokemonUtil.UpdatePokemonAfterFriendTrade(pokemon, pokemon);
        expect(pokemonUtil.GetNickname(pokemon)).to.equal(nickname);
        expect(pokemonUtil.GetOTName(pokemon)).to.equal(otName);
    });
});
