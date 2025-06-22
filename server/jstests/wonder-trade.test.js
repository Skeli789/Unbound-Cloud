const { expect } = require('chai');
const Module = require('module');
const { gTestPokemon, gTestPokemon2 } = require('./data');
const { WONDER_TRADE_SPECIES_COOLDOWN } = require('../wonder-trade');


describe('Wonder Trade Tests', () =>
{
    let wonderTrade;
    let originalRequire;
    let accountsStub;
    let tradeUtilStub;
    let discordStub;

    beforeEach(() =>
    {
        // Clear module cache to ensure fresh requires
        delete require.cache[require.resolve('../wonder-trade')];

        // Create stubs for dependencies
        accountsStub =
        {
            IsUserBannedFromWonderTrade: () => false
        };

        tradeUtilStub =
        {
            CloudDataSyncKeyIsValidForTrade: () => Promise.resolve(true)
        };

        discordStub =
        {
            WebhookClient: function ()
            {
                return {
                    send: () => Promise.resolve({ id: 'test-message-id' }),
                    editMessage: () => Promise.resolve()
                };
            }
        };

        // Mock modules using Module approach
        originalRequire = Module.prototype.require;

        Module.prototype.require = function (id)
        {
            if (id === './accounts')
                return accountsStub;
            if (id === './trade-util')
            {
                const realTradeUtil = originalRequire.apply(this, arguments);
                return {
                    ...realTradeUtil,
                    CloudDataSyncKeyIsValidForTrade: tradeUtilStub.CloudDataSyncKeyIsValidForTrade
                };
            }
            if (id === 'discord.js')
                return discordStub;

            return originalRequire.apply(this, arguments);
        };

        // Now require the wonder-trade module with fresh state
        wonderTrade = require('../wonder-trade');

        // Clear species data for each test
        wonderTrade.TryWipeWonderTradeSpeciesData();
    });

    afterEach(() =>
    {
        // Restore original require after each test
        Module.prototype.require = originalRequire;

        // Clear module cache again to prevent state leakage
        delete require.cache[require.resolve('../wonder-trade')];
    });

    describe('LockWonderTrade and UnlockWonderTrade', () =>
    {
        it('should lock and unlock without errors', async () =>
        {
            await wonderTrade.LockWonderTrade();
            expect(() => wonderTrade.UnlockWonderTrade()).to.not.throw();
        });

        it('should wait for the first lock to be released', async () =>
        {
            await wonderTrade.LockWonderTrade();
            
            let secondLockResolved = false;
            const lockPromise = wonderTrade.LockWonderTrade().then(() => {
                secondLockResolved = true;
            });
            
            // Give some time for the promise to settle if it was going to resolve immediately
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // The second lock should still be waiting
            expect(secondLockResolved).to.be.false;

            // Unlock and ensure the second lock can proceed
            wonderTrade.UnlockWonderTrade();
            await lockPromise; // Should resolve now
            
            expect(secondLockResolved).to.be.true;
        });
    });

    describe('GetLastWonderTradeAt, SetLastWonderTradeAt, & SetLastWonderTradeNow', () =>
    {
        it('should return 0 initially', () =>
        {
            const result = wonderTrade.GetLastWonderTradeAt();
            expect(result).to.equal(0);
        });

        it('should set and get last wonder trade time', () =>
        {
            const testTime = 1234567890;
            wonderTrade.SetLastWonderTradeAt(testTime);
            const result = wonderTrade.GetLastWonderTradeAt();
            expect(result).to.equal(testTime);
        });

        it('should handle negative timestamps', () =>
        {
            const negativeTime = -1000;
            wonderTrade.SetLastWonderTradeAt(negativeTime);
            const result = wonderTrade.GetLastWonderTradeAt();
            expect(result).to.equal(negativeTime);
        });

        it('should handle zero timestamp', () =>
        {
            wonderTrade.SetLastWonderTradeAt(1000);
            wonderTrade.SetLastWonderTradeAt(0);
            const result = wonderTrade.GetLastWonderTradeAt();
            expect(result).to.equal(0);
        });

        it('should handle very large timestamps', () =>
        {
            const largeTime = Number.MAX_SAFE_INTEGER;
            wonderTrade.SetLastWonderTradeAt(largeTime);
            const result = wonderTrade.GetLastWonderTradeAt();
            expect(result).to.equal(largeTime);
        });

        it('should set current time with SetLastWonderTradeNow', () =>
        {
            const originalNow = Date.now;
            const testTime = 9876543210;

            Date.now = () => testTime;
            wonderTrade.SetLastWonderTradeNow();
            const result = wonderTrade.GetLastWonderTradeAt();

            expect(result).to.equal(testTime);
            Date.now = originalNow;
        });

        it('should update time when SetLastWonderTradeNow is called multiple times', () =>
        {
            const originalNow = Date.now;
            let currentTime = 1000000;

            Date.now = () => currentTime;
            wonderTrade.SetLastWonderTradeNow();
            const firstTime = wonderTrade.GetLastWonderTradeAt();

            currentTime = 2000000;
            wonderTrade.SetLastWonderTradeNow();
            const secondTime = wonderTrade.GetLastWonderTradeAt();

            expect(firstTime).to.equal(1000000);
            expect(secondTime).to.equal(2000000);
            expect(secondTime).to.be.greaterThan(firstTime);

            Date.now = originalNow;
        });

        it('should handle floating point timestamps', () =>
        {
            const floatTime = 1234567890.123;
            wonderTrade.SetLastWonderTradeAt(floatTime);
            const result = wonderTrade.GetLastWonderTradeAt();
            expect(result).to.equal(floatTime);
        });
    });

    describe('HasAlreadyTraded', () =>
    {
        const clientId = 'client1';

        it('should return true when client has traded', () =>
        {
            const clientData = { tradedWith: 'client2' };
            wonderTrade.SetWonderTradeClientData(clientId, clientData);
            const result = wonderTrade.HasAlreadyTraded(clientId);
            expect(result).to.be.true;
        });

        it('should return false when client has not traded', () =>
        {
            const clientData = { tradedWith: "" };
            const result = wonderTrade.HasAlreadyTraded(clientData);
            wonderTrade.SetWonderTradeClientData(clientId, clientData);
            expect(result).to.be.false;
        });

        it('should return false when client id is null', () =>
        {
            const result = wonderTrade.HasAlreadyTraded(null);
            expect(result).to.be.false;
        });

        it('should handle malformed client data', () =>
        {
            const malformedData =
            {
                // Missing required fields
                randomizer: false
            };

            wonderTrade.SetWonderTradeClientData(clientId, malformedData);
            const result = wonderTrade.HasAlreadyTraded(clientId);
            expect(result).to.be.false;
        });
    });

    describe('IsClientBanned', () =>
    {
        it('should return true when user is banned', () =>
        {
            accountsStub.IsUserBannedFromWonderTrade = () => true;
            const result = wonderTrade.IsClientBanned('bannedUser');
            expect(result).to.be.true;
        });

        it('should return false when user is not banned', () =>
        {
            accountsStub.IsUserBannedFromWonderTrade = () => false;
            const result = wonderTrade.IsClientBanned('normalUser');
            expect(result).to.be.false;
        });
    });

    describe('ShouldPreventUserFromWonderTradingTwice', () =>
    {
        beforeEach(() =>
        {
            // Clear any existing client data before each test
            wonderTrade.TryWipeWonderTradeSpeciesData();
        });

        it('should return false when username is not provided', () =>
        {
            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', null);
            expect(result).to.be.empty;
        });

        it('should return false when username is empty string', () =>
        {
            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', '');
            expect(result).to.be.empty;
        });

        it('should return false when user has no existing trades', () =>
        {
            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.be.empty;
        });

        it('should return true when same user has active trade on different client', () =>
        {
            // Set up an existing trade for user1 on client2
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user1',
                    tradedWith: '', // Not traded yet
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.not.be.empty;
        });

        it('should return true when same client ID has active trade', () =>
        {
            // Set up an existing trade for the same client
            wonderTrade.SetWonderTradeClientData('client1',
                {
                    username: 'user2',
                    tradedWith: '', // Not traded yet
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.not.be.empty;
        });

        it('should return false when user has completed trade on different client', () =>
        {
            // Set up a completed trade for user1 on client2
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user1',
                    tradedWith: 'client3', // Already traded
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.be.empty;
        });

        it('should return false when different user has active trade', () =>
        {
            // Set up an active trade for a different user
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '', // Not traded yet
                    pokemon: gTestPokemon
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.be.empty;
        });

        it('should return true when multiple clients exist but one matches username', () =>
        {
            // Set up multiple clients
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '',
                    pokemon: gTestPokemon
                });

            wonderTrade.SetWonderTradeClientData('client3',
                {
                    username: 'user1', // Same username as the one being checked
                    tradedWith: '',
                    pokemon: gTestPokemon2
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.not.be.empty;
        });

        it('should return false when multiple clients exist but none match', () =>
        {
            // Set up multiple clients with different usernames
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '',
                    pokemon: gTestPokemon
                });

            wonderTrade.SetWonderTradeClientData('client3',
                {
                    username: 'user3',
                    tradedWith: '',
                    pokemon: gTestPokemon2
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.be.empty;
        });

        it('should handle client data with missing username field', () =>
        {
            // Set up client data without username
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    tradedWith: '',
                    pokemon: gTestPokemon
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.be.empty;
        });

        it('should return true when exact username match exists', () =>
        {
            // Set up client with exact username match
            wonderTrade.SetWonderTradeClientData('client2', {
                username: 'user1',
                tradedWith: '',
                pokemon: gTestPokemon
            });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.not.be.empty;
        });

        it('should return false when checking same client ID against itself with no existing data', () =>
        {
            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.be.empty;
        });

        it('should handle multiple active trades for same user', () =>
        {
            // Set up multiple active trades for the same user
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user1',
                    tradedWith: '',
                    pokemon: gTestPokemon
                });

            wonderTrade.SetWonderTradeClientData('client3',
                {
                    username: 'user1',
                    tradedWith: '',
                    pokemon: gTestPokemon2
                });

            const result = wonderTrade.ShouldPreventUserFromWonderTradingTwice('client1', 'user1');
            expect(result).to.not.be.empty; // Should prevent even if multiple exist
        });
    });

    describe('AddUserToWonderTradeSpeciesTable', () =>
    {
        it('should not add entry when username is missing', () =>
        {
            expect(() =>
            {
                wonderTrade.AddUserToWonderTradeSpeciesTable(null, 'user2', 'Pikachu');
            }).to.not.throw();
        });

        it('should not add entry when username is empty string', () =>
        {
            expect(() =>
            {
                wonderTrade.AddUserToWonderTradeSpeciesTable('', 'user2', 'Pikachu');
            }).to.not.throw();
        });

        it('should not add entry when receivedFromUser is missing', () =>
        {
            expect(() =>
            {
                wonderTrade.AddUserToWonderTradeSpeciesTable('user1', null, 'Pikachu');
            }).to.not.throw();
        });

        it('should not add entry when receivedFromUser is empty string', () =>
        {
            expect(() =>
            {
                wonderTrade.AddUserToWonderTradeSpeciesTable('user1', '', 'Pikachu');
            }).to.not.throw();
        });

        it('should not add entry when species is missing', () =>
        {
            expect(() =>
            {
                wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', null);
            }).to.not.throw();
        });

        it('should not add entry when species is empty string', () =>
        {
            expect(() =>
            {
                wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', '');
            }).to.not.throw();
        });

        it('should add entry when all parameters are provided', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'SPECIES_VENUSAUR');
            // Verify it was added by checking HasRecentSpeciesTrade
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'SPECIES_VENUSAUR');
            expect(result).to.be.true;
        });

        it('should normalize usernames to lowercase', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('USER1', 'USER2', 'pikachu');

            // Should be found with any case combination
            const result1 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'PIKACHU');
            const result2 = wonderTrade.HasRecentSpeciesTrade('User1', 'User2', 'Pikachu');
            const result3 = wonderTrade.HasRecentSpeciesTrade('USER1', 'USER2', 'pikachu');

            expect(result1).to.be.true;
            expect(result2).to.be.true;
            expect(result3).to.be.true;
        });

        it('should normalize species to uppercase', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'pikachu');

            // Should be found with any case
            const result1 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'PIKACHU');
            const result2 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            const result3 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'pikachu');

            expect(result1).to.be.true;
            expect(result2).to.be.true;
            expect(result3).to.be.true;
        });

        it('should handle undefined parameters gracefully', () =>
        {
            expect(() =>
            {
                wonderTrade.AddUserToWonderTradeSpeciesTable(undefined, undefined, undefined);
            }).to.not.throw();

            // Should not have added anything
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;
        });

        it('should handle special characters in usernames and species', () =>
        {
            const specialUser1 = 'user@#$%1';
            const specialUser2 = 'user<>?2';
            const specialSpecies = 'SPECIES_@#$%';

            wonderTrade.AddUserToWonderTradeSpeciesTable(specialUser1, specialUser2, specialSpecies);
            const result = wonderTrade.HasRecentSpeciesTrade(specialUser1, specialUser2, specialSpecies);
            expect(result).to.be.true;
        });

        it('should handle unicode characters', () =>
        {
            const unicodeUser1 = '用户名🎮';
            const unicodeUser2 = 'пользователь👾';
            const unicodeSpecies = 'SPECIES_ポケモン🔥';

            wonderTrade.AddUserToWonderTradeSpeciesTable(unicodeUser1, unicodeUser2, unicodeSpecies);
            const result = wonderTrade.HasRecentSpeciesTrade(unicodeUser1, unicodeUser2, unicodeSpecies);
            expect(result).to.be.true;
        });

        it('should handle very long strings', () =>
        {
            const longUser1 = 'a'.repeat(1000);
            const longUser2 = 'b'.repeat(1000);
            const longSpecies = 'SPECIES_' + 'C'.repeat(10000);

            wonderTrade.AddUserToWonderTradeSpeciesTable(longUser1, longUser2, longSpecies);
            const result = wonderTrade.HasRecentSpeciesTrade(longUser1, longUser2, longSpecies);
            expect(result).to.be.true;
        });

        it('should handle numeric usernames and species', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('12345', '67890', '999');
            const result = wonderTrade.HasRecentSpeciesTrade('12345', '67890', '999');
            expect(result).to.be.true;
        });

        it('should handle whitespace in parameters', () =>
        {
            const userWithSpaces = '  user 1  ';
            const speciesWithSpaces = '  pikachu  ';

            wonderTrade.AddUserToWonderTradeSpeciesTable(userWithSpaces, 'user2', speciesWithSpaces);
            const result = wonderTrade.HasRecentSpeciesTrade(userWithSpaces, 'user2', speciesWithSpaces);
            expect(result).to.be.true;
        });

        it('should create nested structure correctly', () =>
        {
            // Add multiple species for same user pair
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Charizard');

            // Add different user pairs
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user3', 'Blastoise');
            wonderTrade.AddUserToWonderTradeSpeciesTable('user2', 'user1', 'Venusaur');

            // All should be findable
            expect(wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu')).to.be.true;
            expect(wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Charizard')).to.be.true;
            expect(wonderTrade.HasRecentSpeciesTrade('user1', 'user3', 'Blastoise')).to.be.true;
            expect(wonderTrade.HasRecentSpeciesTrade('user2', 'user1', 'Venusaur')).to.be.true;

            // Cross combinations should not exist
            expect(wonderTrade.HasRecentSpeciesTrade('user1', 'user3', 'Pikachu')).to.be.false;
            expect(wonderTrade.HasRecentSpeciesTrade('user2', 'user3', 'Charizard')).to.be.false;
        });

        it('should update timestamp when same entry is added again', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Move time forward
            Date.now = () => baseTime + 60000; // 1 minute later
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Should still be within cooldown (newer timestamp)
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.true;

            Date.now = originalNow;
        });

        it('should handle concurrent access to species table', () =>
        {
            // Test rapid successive calls
            for (let i = 0; i < 10; ++i)
                wonderTrade.AddUserToWonderTradeSpeciesTable(`user${i}`, `other${i}`, `SPECIES_${i}`);

            // Verify some data was added
            const hasData = wonderTrade.HasRecentSpeciesTrade('user0', 'other0', 'SPECIES_0');
            expect(hasData).to.be.true;
        });

        it('should handle large numbers of species entries', () =>
        {
            // Add many entries
            for (let i = 0; i < 1000; i++)
                wonderTrade.AddUserToWonderTradeSpeciesTable(`user${i % 10}`, `other${i % 10}`, `SPECIES_${i}`);

            // Should still function correctly
            const result = wonderTrade.HasRecentSpeciesTrade('user0', 'other0', 'SPECIES_0');
            expect(result).to.be.true;
        });
    });

    describe('TryWipeWonderTradeSpeciesData', () =>
    {
        it('should execute without errors when no trades exist', () =>
        {
            expect(() =>
            {
                wonderTrade.TryWipeWonderTradeSpeciesData();
            }).to.not.throw();
        });

        it('should not wipe data when last trade time is 0', () =>
        {
            // Add some data
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Ensure last trade time is 0
            wonderTrade.SetLastWonderTradeAt(0);

            // Attempt to wipe data
            wonderTrade.TryWipeWonderTradeSpeciesData();

            // Data should still exist
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.true;
        });

        it('should not wipe data when cooldown has not passed', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward but still within cooldown
            Date.now = () => baseTime + (2 * 60 * 1000); // 2 minutes

            wonderTrade.TryWipeWonderTradeSpeciesData();

            // Data should still exist
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.true;

            Date.now = originalNow;
        });

        it('should wipe data when cooldown has passed', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward beyond cooldown
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN + 1000; // 6 minutes

            wonderTrade.TryWipeWonderTradeSpeciesData();

            // Data should be cleared
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;

            Date.now = originalNow;
        });

        it('should reset last trade time to 0 after wiping', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward beyond cooldown
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN + 1000;

            wonderTrade.TryWipeWonderTradeSpeciesData();

            // Last trade time should be reset
            const lastTradeTime = wonderTrade.GetLastWonderTradeAt();
            expect(lastTradeTime).to.equal(0);

            Date.now = originalNow;
        });

        it('should handle exactly at cooldown boundary', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward to exactly the cooldown period
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN;

            wonderTrade.TryWipeWonderTradeSpeciesData();

            // Data should be cleared (>= condition)
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;

            Date.now = originalNow;
        });

        it('should handle exactly 1ms before cooldown boundary', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward to 1ms before cooldown expires
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN - 1;

            wonderTrade.TryWipeWonderTradeSpeciesData();

            // Data should still exist
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.true;

            Date.now = originalNow;
        });

        it('should handle multiple calls in succession', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward beyond cooldown
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN + 1000;

            // Call multiple times
            wonderTrade.TryWipeWonderTradeSpeciesData();
            wonderTrade.TryWipeWonderTradeSpeciesData();
            wonderTrade.TryWipeWonderTradeSpeciesData();

            // Should not cause issues
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;

            Date.now = originalNow;
        });

        it('should handle negative time differences gracefully', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.SetLastWonderTradeAt(baseTime + 60000); // Set future time

            // Current time is before last trade time
            expect(() =>
            {
                wonderTrade.TryWipeWonderTradeSpeciesData();
            }).to.not.throw();

            Date.now = originalNow;
        });

        it('should be called automatically by AddUserToWonderTradeSpeciesTable', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward beyond cooldown
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN + 1000;

            // Adding new entry should trigger cleanup
            wonderTrade.AddUserToWonderTradeSpeciesTable('user3', 'user4', 'Charizard');

            // Old data should be gone, new data should exist
            const oldResult = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            const newResult = wonderTrade.HasRecentSpeciesTrade('user3', 'user4', 'Charizard');

            expect(oldResult).to.be.false;
            expect(newResult).to.be.true;

            Date.now = originalNow;
        });

        it('should handle very large time differences', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.SetLastWonderTradeAt(baseTime);

            // Move time forward by a very large amount
            Date.now = () => baseTime + (365 * 24 * 60 * 60 * 1000); // 1 year

            expect(() =>
            {
                wonderTrade.TryWipeWonderTradeSpeciesData();
            }).to.not.throw();

            Date.now = originalNow;
        });
    });

    describe('HasRecentSpeciesTrade', () =>
    {
        it('should return false when username is not provided', () =>
        {
            const result = wonderTrade.HasRecentSpeciesTrade(null, 'otherUser', 'Pikachu');
            expect(result).to.be.false;
        });

        it('should return false when username is empty string', () =>
        {
            const result = wonderTrade.HasRecentSpeciesTrade('', 'otherUser', 'Pikachu');
            expect(result).to.be.false;
        });

        it('should return false when otherUsername is not provided', () =>
        {
            const result = wonderTrade.HasRecentSpeciesTrade('user1', null, 'Pikachu');
            expect(result).to.be.false;
        });

        it('should return false when otherUsername is empty string', () =>
        {
            const result = wonderTrade.HasRecentSpeciesTrade('user1', '', 'Pikachu');
            expect(result).to.be.false;
        });

        it('should return false when species is not provided', () =>
        {
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', null);
            expect(result).to.be.false;
        });

        it('should return false when species is empty string', () =>
        {
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', '');
            expect(result).to.be.false;
        });

        it('should return false when no previous trades exist for user', () =>
        {
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;
        });

        it('should return false when user exists but no trades with other user', () =>
        {
            // Add a trade with a different user
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user3', 'Pikachu');

            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;
        });

        it('should return false when users have traded but not this species', () =>
        {
            // Add a trade with different species
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Charizard');

            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;
        });

        it('should return true when recent trade exists within cooldown', () =>
        {
            // Add a recent trade
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.true;
        });

        it('should return false when trade is outside cooldown period', () =>
        {
            // Save original Date.now
            const originalNow = Date.now;
            const baseTime = 1000000;

            // Mock Date.now
            Date.now = () => baseTime;

            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Move time forward beyond cooldown (5 minutes + buffer)
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN + 1000; // 6 minutes

            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.false;

            // Restore original Date.now
            Date.now = originalNow;
        });

        it('should return true when trade is exactly at cooldown boundary', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Move time forward to exactly the cooldown period
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN - 1; // 1ms before cooldown expires

            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.true;

            Date.now = originalNow;
        });

        it('should clean up expired entries when checking', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Move time forward beyond cooldown
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN + 1000; // 6 minutes

            // First call should return false and clean up
            const result1 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result1).to.be.false;

            // Second call should still return false (entry was cleaned up)
            const result2 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result2).to.be.false;

            Date.now = originalNow;
        });

        it('should handle multiple species for same user pair', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Charizard');

            const result1 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            const result2 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Charizard');
            const result3 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Blastoise');

            expect(result1).to.be.true;
            expect(result2).to.be.true;
            expect(result3).to.be.false;
        });

        it('should handle multiple user pairs for same user', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user3', 'Pikachu');

            const result1 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            const result2 = wonderTrade.HasRecentSpeciesTrade('user1', 'user3', 'Pikachu');
            const result3 = wonderTrade.HasRecentSpeciesTrade('user1', 'user4', 'Pikachu');

            expect(result1).to.be.true;
            expect(result2).to.be.true;
            expect(result3).to.be.false;
        });

        it('should be case insensitive for usernames', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            const result1 = wonderTrade.HasRecentSpeciesTrade('User1', 'user2', 'Pikachu');
            const result2 = wonderTrade.HasRecentSpeciesTrade('user1', 'User2', 'Pikachu');

            expect(result1).to.be.true;
            expect(result2).to.be.true;
        });

        it('should be case insensitive for species', () =>
        {
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'pikachu');
            expect(result).to.be.true;
        });

        it('should handle special characters in usernames', () =>
        {
            const specialUser1 = 'user@#$%1';
            const specialUser2 = 'user<>?2';

            wonderTrade.AddUserToWonderTradeSpeciesTable(specialUser1, specialUser2, 'Pikachu');
            const result = wonderTrade.HasRecentSpeciesTrade(specialUser1, specialUser2, 'Pikachu');
            expect(result).to.be.true;
        });

        it('should handle mixed expired and non-expired entries', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;
            const cooldown = 5 * 60 * 1000;

            // Add first trade
            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Move time forward but still within cooldown
            Date.now = () => baseTime + (2 * 60 * 1000); // 2 minutes
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Charizard');

            // Move time forward beyond first trade's cooldown
            Date.now = () => baseTime + WONDER_TRADE_SPECIES_COOLDOWN + 1000; // 6 minutes

            const result1 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            const result2 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Charizard');

            expect(result1).to.be.false; // Should be expired and cleaned up
            expect(result2).to.be.true;  // Should still be within cooldown

            Date.now = originalNow;
        });

        it('should maintain separate cooldowns for different directions', () =>
        {
            // Add trade from user1 to user2
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Check reverse direction (user2 receiving from user1)
            const result = wonderTrade.HasRecentSpeciesTrade('user2', 'user1', 'Pikachu');
            expect(result).to.be.false; // Should be false since this is the reverse direction
        });

        it('should handle rapid successive trades of same species', () =>
        {
            const originalNow = Date.now;
            const baseTime = 1000000;

            Date.now = () => baseTime;
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            // Move time forward slightly but still within cooldown
            Date.now = () => baseTime + 1000; // 1 second
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'Pikachu');

            const result = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'Pikachu');
            expect(result).to.be.true;

            Date.now = originalNow;
        });
    });

    describe('IsValidWonderTradeClient', () =>
    {
        beforeEach(() =>
        {
            // Reset accounts stub for each test
            accountsStub.IsUserBannedFromWonderTrade = () => false;
            // Clear any existing client data
            wonderTrade.TryWipeWonderTradeSpeciesData();
        });

        it('should return false when other client data does not exist', () =>
        {
            const result = wonderTrade.IsValidWonderTradeClient('client1', 'nonexistent', 'user1', false);
            expect(result).to.be.false;
        });

        it('should return false when other client has already traded', () =>
        {
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: 'client3', // Already traded
                    randomizer: false,
                    pokemon: gTestPokemon
                });

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client2', 'user1', false);
            expect(result).to.be.false;
        });

        it('should return false when randomizer settings do not match', () =>
        {
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '',
                    randomizer: true, // Different from current client (false)
                    pokemon: gTestPokemon
                });

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client2', 'user1', false);
            expect(result).to.be.false;
        });

        it('should return false when trying to trade with same client ID', () =>
        {
            wonderTrade.SetWonderTradeClientData('client1',
                {
                    username: 'user2',
                    tradedWith: '',
                    randomizer: false,
                    pokemon: gTestPokemon
                });

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client1', 'user1', false);
            expect(result).to.be.false;
        });

        it('should return false when other client user is banned', () =>
        {
            accountsStub.IsUserBannedFromWonderTrade = (username) => username === 'bannedUser';

            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'bannedUser',
                    tradedWith: '',
                    randomizer: false,
                    pokemon: gTestPokemon
                });

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client2', 'user1', false);
            expect(result).to.be.false;
        });

        it('should return false when users have recent species trade', () =>
        {
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '',
                    randomizer: false,
                    pokemon: gTestPokemon
                });

            // Add recent species trade
            wonderTrade.AddUserToWonderTradeSpeciesTable('user1', 'user2', 'SPECIES_VENUSAUR');

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client2', 'user1', false);
            expect(result).to.be.false;
        });

        it('should return true when all conditions are valid', () =>
        {
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '',
                    randomizer: false,
                    pokemon: gTestPokemon2 // Different species, no recent trade
                });

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client2', 'user1', false);
            expect(result).to.be.true;
        });

        it('should handle invalid Pokemon species gracefully', () =>
        {
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '',
                    randomizer: false,
                    pokemon: { species: null }
                });

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client2', 'user1', false);
            expect(result).to.be.true; // Should still work with null species
        });

        it('should handle null Pokemon in GetSpecies calls', () =>
        {
            wonderTrade.SetWonderTradeClientData('client2',
                {
                    username: 'user2',
                    tradedWith: '',
                    randomizer: false,
                    pokemon: null
                });

            const result = wonderTrade.IsValidWonderTradeClient('client1', 'client2', 'user1', false);
            expect(result).to.be.true; // Should still work with null Pokemon
        });
    });

    describe('GetValidWonderTradeClientsFor', () =>
    {
        beforeEach(() =>
        {
            accountsStub.IsUserBannedFromWonderTrade = () => false;
        });

        it('should return empty array when user is banned', () =>
        {
            accountsStub.IsUserBannedFromWonderTrade = () => true;
            const result = wonderTrade.GetValidWonderTradeClientsFor('client1', 'bannedUser', false);
            expect(result).to.be.an('array').that.is.empty;
        });

        it('should return valid clients when conditions are met', () =>
        {
            wonderTrade.SetWonderTradeClientData('client1', {
                username: 'user1',
                tradedWith: '',
                randomizer: false,
                pokemon: gTestPokemon
            });

            wonderTrade.SetWonderTradeClientData('client2', {
                username: 'user2',
                tradedWith: '',
                randomizer: false,
                pokemon: gTestPokemon2
            });

            const result = wonderTrade.GetValidWonderTradeClientsFor('client1', 'user1', false);
            expect(result).to.be.an('array').that.has.lengthOf(1);
            expect(result[0]).to.equal('client2');
        });
    });

    describe('IsWonderTradeAvailable', () =>
    {
        beforeEach(() =>
        {
            accountsStub.IsUserBannedFromWonderTrade = () => false;
        });

        it('should return false when no clients are available', () =>
        {
            const result = wonderTrade.IsWonderTradeAvailable('client1', 'user1', false);
            expect(result).to.be.false;
        });

        it('should return true where there is a valid client', () =>
        {
            wonderTrade.SetWonderTradeClientData('client1', {
                username: 'user1',
                tradedWith: '',
                randomizer: false,
                pokemon: gTestPokemon
            });

            wonderTrade.SetWonderTradeClientData('client2', {
                username: 'user2',
                tradedWith: '',
                randomizer: false,
                pokemon: gTestPokemon2
            });

            const result = wonderTrade.IsWonderTradeAvailable('client1', 'user1', false);
            expect(result).to.be.true;
        });
    });

    describe('SendWonderTradeDiscordMessage', () =>
    {
        let mockWebhook;
        let sendCalls;
        let editCalls;

        beforeEach(() =>
        {
            sendCalls = [];
            editCalls = [];

            mockWebhook =
            {
                send: (params) =>
                {
                    sendCalls.push(params);
                    return Promise.resolve({ id: 'new-message-id' });
                },
                editMessage: (messageId, params) =>
                {
                    editCalls.push({ messageId, params });
                    return Promise.resolve();
                }
            };

            // Mock the webhook in discord stub - needs to be a constructor
            discordStub.WebhookClient = function WebhookClient() {
                return mockWebhook;
            };

            // Set environment variable to enable webhook
            process.env.WONDER_TRADE_WEBHOOK = 'test-webhook-url';

            // Re-require the module to pick up the webhook
            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');
        });

        afterEach(() =>
        {
            delete process.env.WONDER_TRADE_WEBHOOK;
        });

        it('should send new message when messageId is 0', async () =>
        {
            const messageId = await wonderTrade.SendWonderTradeDiscordMessage('Test Title', 0xFF0000, 0);

            expect(sendCalls).to.have.lengthOf(1);
            expect(editCalls).to.have.lengthOf(0);
            expect(sendCalls[0].embeds[0].title).to.equal('Test Title');
            expect(sendCalls[0].embeds[0].color).to.equal(0xFF0000);
            expect(messageId).to.equal('new-message-id');
        });

        it('should edit existing message when messageId is provided', async () =>
        {
            const messageId = await wonderTrade.SendWonderTradeDiscordMessage('Updated Title', 0x00FF00, 'existing-id');

            expect(editCalls).to.have.lengthOf(1);
            expect(sendCalls).to.have.lengthOf(0);
            expect(editCalls[0].messageId).to.equal('existing-id');
            expect(editCalls[0].params.embeds[0].title).to.equal('Updated Title');
            expect(messageId).to.equal('existing-id');
        });

        it('should fallback to sending new message if edit fails', async () =>
        {
            mockWebhook.editMessage = () => Promise.reject(new Error('Edit failed'));

            const messageId = await wonderTrade.SendWonderTradeDiscordMessage('Fallback Title', 0x0000FF, 'invalid-id');

            expect(editCalls).to.have.lengthOf(0);
            expect(sendCalls).to.have.lengthOf(1);
            expect(messageId).to.equal('new-message-id');
        });

        it('should return 0 when webhook is not configured', async () =>
        {
            delete process.env.WONDER_TRADE_WEBHOOK;
            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');

            const messageId = await wonderTrade.SendWonderTradeDiscordMessage('Test', 0x000000, 0);
            expect(messageId).to.equal(0);
        });

        it('should retry failed send operations', async () =>
        {
            let attempts = 0;
            mockWebhook.send = () =>
            {
                attempts++;
                if (attempts < 3) return Promise.reject(new Error('Network error'));
                return Promise.resolve({ id: 'retry-success-id' });
            };

            const messageId = await wonderTrade.SendWonderTradeDiscordMessage('Retry Test', 0x000000, 0);
            expect(messageId).to.equal('retry-success-id');
            expect(attempts).to.equal(3);
        });
    });

    describe('SetupWonderTradeHandlers', () =>
    {
        let mockSocket;
        let mockHandlers;
        let mockSocketUtils;

        beforeEach(() =>
        {
            mockHandlers = {};
            mockSocket =
            {
                on: (event, handler) =>
                {
                    mockHandlers[event] = handler;
                },
                emit: () => { }
            };
            mockSocketUtils =
            {
                safeEmit: () => { }
            };
            tradeUtilStub.CloudDataSyncKeyIsValidForTrade = () => Promise.resolve(true);
        });

        it('should set up message handler', () =>
        {
            wonderTrade.SetupWonderTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key', 'TestClient', () => { }, () => { });
            expect(mockHandlers.message).to.be.a('function');
        });

        it('should set up disconnect handler', () =>
        {
            wonderTrade.SetupWonderTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key', 'TestClient', () => { }, () => { });
            expect(mockHandlers.disconnect).to.be.a('function');
        });

        it('should handle message event with invalid cloud key', async () =>
        {
            tradeUtilStub.CloudDataSyncKeyIsValidForTrade = () => Promise.resolve(false);
            wonderTrade.SetupWonderTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key', 'TestClient', () => { }, () => { });

            // Call the message handler
            await mockHandlers.message({ species: 'Pikachu' }, false);
            // Should complete without error
        });

        it('should handle message event with invalid Pokemon', async () =>
        {
            let emitCalled = false;
            mockSocketUtils.safeEmit = (event) =>
            {
                if (event === 'invalidPokemon') emitCalled = true;
            };

            wonderTrade.SetupWonderTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key', 'TestClient', () => { }, () => { });
            await mockHandlers.message({ invalid: 'pokemon' }, false);

            expect(emitCalled).to.be.true;
        });
    });

    describe('ProcessWonderTradeMatch', () =>
    {
        beforeEach(() =>
        {
            wonderTrade.TryWipeWonderTradeSpeciesData();
        });

        it('should return false when partner client data does not exist', async () =>
        {
            const result = await wonderTrade.ProcessWonderTradeMatch('client1', 'user1', gTestPokemon, 'nonexistent');
            expect(result).to.be.false;
        });

        it('should successfully process a valid match', async () =>
        {
            const partnerData =
            {
                username: 'user2',
                pokemon: gTestPokemon2,
                originalPokemon: gTestPokemon2,
                discordMessageId: 'msg-123'
            };
            wonderTrade.SetWonderTradeClientData('client2', partnerData);

            const result = await wonderTrade.ProcessWonderTradeMatch('client1', 'user1', gTestPokemon, 'client2');
            expect(result).to.be.true;

            // Verify partner's data was updated
            const updatedPartner = wonderTrade.GetWonderTradeClientData('client2');
            expect(updatedPartner.username).to.equal('user2'); // Preserved
            expect(updatedPartner.pokemon).to.deep.equal(gTestPokemon);
            expect(updatedPartner.originalPokemon).to.deep.equal(gTestPokemon2);
            expect(updatedPartner.tradedWith).to.equal('client1');
            expect(updatedPartner.receivedFrom).to.equal('user1');

            // Verify current client's data was created
            const currentClient = wonderTrade.GetWonderTradeClientData('client1');
            expect(currentClient.username).to.equal('user1');
            expect(currentClient.pokemon).to.deep.equal(gTestPokemon2);
            expect(currentClient.originalPokemon).to.deep.equal(gTestPokemon);
            expect(currentClient.tradedWith).to.equal('client2');
            expect(currentClient.receivedFrom).to.equal('user2');
            expect(currentClient.discordMessageId).to.equal('msg-123');
        });

        it('should add users to species table after match & should update last wonder trade timestamp', async () =>
        {
            const originalLastTrade = wonderTrade.GetLastWonderTradeAt();
            const partnerData =
            {
                username: 'user2',
                pokemon: gTestPokemon2,
                originalPokemon: gTestPokemon2,
            };
            wonderTrade.SetWonderTradeClientData('client2', partnerData);

            await wonderTrade.ProcessWonderTradeMatch('client1', 'user1', gTestPokemon, 'client2');

            // Check that species entries were added for both directions
            const hasRecentTrade1 = wonderTrade.HasRecentSpeciesTrade('user1', 'user2', 'SPECIES_GENGAR');
            const hasRecentTrade2 = wonderTrade.HasRecentSpeciesTrade('user2', 'user1', 'SPECIES_VENUSAUR');

            expect(hasRecentTrade1).to.be.true;
            expect(hasRecentTrade2).to.be.true;

            // Check that last trade timestamp was updated
            const newLastTrade = wonderTrade.GetLastWonderTradeAt();
            expect(newLastTrade).to.be.greaterThan(originalLastTrade);
        });
    });

    describe('AddToWonderTradeQueue', () =>
    {
        beforeEach(() =>
        {
            // Set up Discord webhook for these tests
            process.env.WONDER_TRADE_WEBHOOK = 'test-webhook-url';
            
            // Re-require the module to pick up the webhook
            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');
            
            // Clear species data for each test
            wonderTrade.TryWipeWonderTradeSpeciesData();
        });

        afterEach(() =>
        {
            delete process.env.WONDER_TRADE_WEBHOOK;
        });

        it('should return false when client is already in queue', async () =>
        {
            wonderTrade.SetWonderTradeClientData('client1', { username: 'user1' });

            const result = await wonderTrade.AddToWonderTradeQueue('client1', 'user1', gTestPokemon, false, 'TestClient');
            expect(result).to.be.false;
        });

        it('should successfully add client to queue', async () =>
        {
            const result = await wonderTrade.AddToWonderTradeQueue('client1', 'user1', gTestPokemon, false, 'TestClient');
            expect(result).to.be.true;

            const clientData = wonderTrade.GetWonderTradeClientData('client1');
            expect(clientData.username).to.equal('user1');
            expect(clientData.pokemon).to.deep.equal(gTestPokemon);
            expect(clientData.originalPokemon).to.deep.equal(gTestPokemon);
            expect(clientData.tradedWith).to.equal('');
            expect(clientData.randomizer).to.be.false;
            expect(clientData.discordMessageId).to.equal("test-message-id");
        });

        it('should set correct randomizer setting', async () =>
        {
            await wonderTrade.AddToWonderTradeQueue('client1', 'user1', gTestPokemon, true, 'TestClient');

            const clientData = wonderTrade.GetWonderTradeClientData('client1');
            expect(clientData.randomizer).to.be.true;
        });

        it('should handle different Pokemon correctly', async () =>
        {
            await wonderTrade.AddToWonderTradeQueue('client1', 'user1', gTestPokemon2, false, 'TestClient');

            const clientData = wonderTrade.GetWonderTradeClientData('client1');
            expect(clientData.pokemon).to.deep.equal(gTestPokemon2);
            expect(clientData.originalPokemon).to.deep.equal(gTestPokemon2);
        });

        it('should handle special characters in usernames', async () =>
        {
            const specialUsername = 'user@#$%1';
            await wonderTrade.AddToWonderTradeQueue('client1', specialUsername, gTestPokemon, false, 'TestClient');

            const clientData = wonderTrade.GetWonderTradeClientData('client1');
            expect(clientData.username).to.equal(specialUsername);
        });
    });

    describe('HandleWonderTradeDisconnect', () =>
    {
        it('should handle disconnect for non-existent client', async () =>
        {
            // Should not throw error
            await expect(wonderTrade.HandleWonderTradeDisconnect('nonexistent', 'TestClient')).to.not.be.rejected;
        });

        it('should clear client data on disconnect', async () =>
        {
            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                pokemon: gTestPokemon,
                tradedWith: ''
            });

            await wonderTrade.HandleWonderTradeDisconnect('client1', 'TestClient');

            const clientData = wonderTrade.GetWonderTradeClientData('client1');
            expect(clientData).to.be.null;
        });

        it('should send Discord cancellation message for untraded clients', async () =>
        {
            let sendCalls = [];
            const mockWebhook =
            {
                send: (params) =>
                {
                    sendCalls.push(params);
                    return Promise.resolve({ id: 'new-id' });
                },
                editMessage: (messageId, params) =>
                {
                    sendCalls.push({ edit: true, messageId, params });
                    return Promise.resolve();
                }
            };

            discordStub.WebhookClient = function WebhookClient() { return mockWebhook; };
            process.env.WONDER_TRADE_WEBHOOK = 'test-url';

            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');

            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                pokemon: gTestPokemon,
                tradedWith: '',
                discordMessageId: 'msg-123'
            });

            await wonderTrade.HandleWonderTradeDisconnect('client1', 'TestClient');

            expect(sendCalls).to.have.lengthOf(1);
            expect(sendCalls[0].edit).to.be.true;
            expect(sendCalls[0].messageId).to.equal('msg-123');

            delete process.env.WONDER_TRADE_WEBHOOK;
        });

        it('should not send Discord message for already traded clients', async () =>
        {
            let sendCalls = [];
            const mockWebhook =
            {
                editMessage: () =>
                {
                    sendCalls.push('edit called');
                    return Promise.resolve();
                }
            };

            discordStub.WebhookClient = function WebhookClient() { return mockWebhook; };
            process.env.WONDER_TRADE_WEBHOOK = 'test-url';

            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');

            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                pokemon: gTestPokemon,
                tradedWith: 'client2', // Already traded
                discordMessageId: 'msg-123'
            });

            await wonderTrade.HandleWonderTradeDisconnect('client1', 'TestClient');

            expect(sendCalls).to.have.lengthOf(0);

            delete process.env.WONDER_TRADE_WEBHOOK;
        });

        it('should handle Discord webhook errors gracefully', async () =>
        {
            const mockWebhook =
            {
                send: () => Promise.reject(new Error('Discord error')),
                editMessage: () => Promise.reject(new Error('Discord error'))
            };

            discordStub.WebhookClient = function WebhookClient() { return mockWebhook; };
            process.env.WONDER_TRADE_WEBHOOK = 'test-url';

            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');

            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                tradedWith: '',
                discordMessageId: 'msg-123'
            });

            await expect(wonderTrade.HandleWonderTradeDisconnect('client1', 'TestClient')).to.not.be.rejected;

            delete process.env.WONDER_TRADE_WEBHOOK;
        });
    });

    describe('ProcessWonderTradeTransactions', () =>
    {
        let mockSocketUtils;
        let safeSendCalls;
        let activityUpdated;
        let inactiveSet;

        beforeEach(() =>
        {
            safeSendCalls = [];
            activityUpdated = false;
            inactiveSet = false;

            mockSocketUtils =
            {
                safeSend: (pokemon, username) =>
                {
                    safeSendCalls.push({ pokemon, username });
                    return Promise.resolve();
                }
            };
        });

        it('should return true and do nothing when client has not traded', async () =>
        {
            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                tradedWith: '' // Not traded
            });

            const result = await wonderTrade.ProcessWonderTradeTransactions(
                'client1', 'TestClient', mockSocketUtils,
                () => { activityUpdated = true; },
                () => { inactiveSet = true; }
            );

            expect(result).to.be.true;
            expect(safeSendCalls).to.have.lengthOf(0);
            expect(activityUpdated).to.be.false;
        });

        it('should process completed trade successfully', async () =>
        {
            const clientData =
            {
                username: 'user1',
                originalPokemon: { ...gTestPokemon },
                pokemon: { ...gTestPokemon2 },
                receivedFrom: 'user2',
                tradedWith: 'client2'
            };
            wonderTrade.SetWonderTradeClientData('client1', clientData);

            const result = await wonderTrade.ProcessWonderTradeTransactions(
                'client1', 'TestClient', mockSocketUtils,
                () => { activityUpdated = true; },
                () => { inactiveSet = true; }
            );

            expect(result).to.be.true;
            expect(safeSendCalls).to.have.lengthOf(1);
            expect(safeSendCalls[0].pokemon).to.deep.equal({ ...gTestPokemon2,
                                                             checksum: safeSendCalls[0].pokemon?.checksum,
                                                            friendship: 50}); // Friendship should be reset
            expect(safeSendCalls[0].username).to.equal('user2');
            expect(activityUpdated).to.be.true;
            expect(inactiveSet).to.be.false;
        });

        it('should handle socket send errors gracefully', async () =>
        {
            mockSocketUtils.safeSend = () => Promise.reject(new Error('Socket error'));

            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                originalPokemon: gTestPokemon,
                pokemon: gTestPokemon2,
                receivedFrom: 'user2',
                tradedWith: 'client2'
            });

            const result = await wonderTrade.ProcessWonderTradeTransactions(
                'client1', 'TestClient', mockSocketUtils,
                () => { activityUpdated = true; },
                () => { inactiveSet = true; }
            );

            expect(result).to.be.false;
            expect(inactiveSet).to.be.true;
            expect(activityUpdated).to.be.false;
        });

        it('should send Discord completion message when discord ID exists', async () =>
        {
            let editCalls = [];
            const mockWebhook =
            {
                editMessage: (messageId, params) =>
                {
                    editCalls.push({ messageId, params });
                    return Promise.resolve();
                }
            };

            discordStub.WebhookClient = function WebhookClient() { return mockWebhook; };
            process.env.WONDER_TRADE_WEBHOOK = 'test-url';

            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');

            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                originalPokemon: gTestPokemon,
                pokemon: gTestPokemon2,
                receivedFrom: 'user2',
                tradedWith: 'client2',
                discordMessageId: 'msg-456'
            });

            await wonderTrade.ProcessWonderTradeTransactions(
                'client1', 'TestClient', mockSocketUtils,
                () => { activityUpdated = true; },
                () => { inactiveSet = true; }
            );

            expect(editCalls).to.have.lengthOf(1);
            expect(editCalls[0].messageId).to.equal('msg-456');
            expect(editCalls[0].params.embeds[0].color).to.equal(0x0000FF);

            delete process.env.WONDER_TRADE_WEBHOOK;
        });

        it('should not send Discord message when no discord ID', async () =>
        {
            let editCalls = [];
            const mockWebhook = {
                editMessage: () =>
                {
                    editCalls.push('called');
                    return Promise.resolve();
                }
            };

            discordStub.WebhookClient = function WebhookClient() { return mockWebhook; };
            process.env.WONDER_TRADE_WEBHOOK = 'test-url';

            delete require.cache[require.resolve('../wonder-trade')];
            wonderTrade = require('../wonder-trade');

            wonderTrade.SetWonderTradeClientData('client1',
            {
                username: 'user1',
                originalPokemon: gTestPokemon,
                pokemon: gTestPokemon2,
                receivedFrom: 'user2',
                tradedWith: 'client2'
                // No discordMessageId
            });

            await wonderTrade.ProcessWonderTradeTransactions(
                'client1', 'TestClient', mockSocketUtils,
                () => { activityUpdated = true; },
                () => { inactiveSet = true; }
            );

            expect(editCalls).to.have.lengthOf(0);

            delete process.env.WONDER_TRADE_WEBHOOK;
        });

        it('should handle missing client data gracefully', async () =>
        {
            const result = await wonderTrade.ProcessWonderTradeTransactions(
                'nonexistent', 'TestClient', mockSocketUtils,
                () => { activityUpdated = true; },
                () => { inactiveSet = true; }
            );

            expect(result).to.be.true;
            expect(safeSendCalls).to.have.lengthOf(0);
        });
    });

    describe('CleanupWonderTradeClient', () =>
    {
        it('should clear client data', async () =>
        {
            wonderTrade.SetWonderTradeClientData('client1', {
                username: 'user1',
                pokemon: gTestPokemon
            });

            await wonderTrade.CleanupWonderTradeClient('client1');

            const clientData = wonderTrade.GetWonderTradeClientData('client1');
            expect(clientData).to.be.null;
        });

        it('should handle non-existent client gracefully', async () =>
        {
            await expect(wonderTrade.CleanupWonderTradeClient('nonexistent')).to.not.be.rejected;
        });

        it('should handle errors during cleanup', async () =>
        {
            // Mock an error in the mutex
            const originalLock = wonderTrade.LockWonderTrade;
            wonderTrade.LockWonderTrade = () => Promise.reject(new Error('Lock error'));

            await expect(wonderTrade.CleanupWonderTradeClient('client1')).to.not.be.rejected;

            wonderTrade.LockWonderTrade = originalLock;
        });

        it('should clear multiple clients independently', async () =>
        {
            wonderTrade.SetWonderTradeClientData('client1', { username: 'user1' });
            wonderTrade.SetWonderTradeClientData('client2', { username: 'user2' });

            await wonderTrade.CleanupWonderTradeClient('client1');

            expect(wonderTrade.GetWonderTradeClientData('client1')).to.be.null;
            expect(wonderTrade.GetWonderTradeClientData('client2')).to.not.be.null;
        });
    });

    describe('State Transitions', () =>
    {
        it('should handle rapid state changes', async () =>
        {
            // Simulate rapid add/remove cycles
            for (let i = 0; i < 5; ++i)
            {
                await wonderTrade.AddToWonderTradeQueue(`client${i}`, `user${i}`, { species: `Species${i}` }, false, `Client${i}`);
                await wonderTrade.HandleWonderTradeDisconnect(`client${i}`, `Client${i}`);
            }
            // Should complete without errors
        });
    });
});
