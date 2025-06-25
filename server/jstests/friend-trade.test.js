const { expect } = require('chai');
const Module = require('module');
const { gTestPokemon, gTestPokemon2 } = require('./data');


describe('Friend Trade Tests', () =>
{
    let friendTrade;
    let originalRequire;
    let pokemonUtilStub;
    let tradeUtilStub;
    let randomstringStub;

    beforeEach(() =>
    {
        // Clear module cache to ensure fresh requires
        delete require.cache[require.resolve('../friend-trade')];

        // Create stubs for dependencies
        tradeUtilStub =
        {
            CloudDataSyncKeyIsValidForTrade: (...args) => tradeUtilStub._CloudDataSyncKeyIsValidForTrade(...args),
            _CloudDataSyncKeyIsValidForTrade: () => Promise.resolve(true),
        };

        randomstringStub =
        {
            generate: ({ length, charset, capitalization }) => 'test1234'
        };

        // Mock modules using Module approach
        originalRequire = Module.prototype.require;

        Module.prototype.require = function (id)
        {
            if (id === './trade-util')
            {
                const realTradeUtil = originalRequire.apply(this, arguments);
                return {
                    ...realTradeUtil,
                    CloudDataSyncKeyIsValidForTrade: tradeUtilStub.CloudDataSyncKeyIsValidForTrade
                };
            }
            if (id === 'randomstring')
                return randomstringStub;

            return originalRequire.apply(this, arguments);
        };

        // Now require the friend-trade module with fresh state
        delete require.cache[require.resolve('../trade-util')];
        friendTrade = require('../friend-trade');

        // Clear data for each test
        friendTrade.ClearAllFriendTradeData();
    });

    afterEach(() =>
    {
        // Restore original require after each test
        Module.prototype.require = originalRequire;

        // Clear module cache again to prevent state leakage
        delete require.cache[require.resolve('../friend-trade')];
    });

    describe('LockFriendTrade and UnlockFriendTrade', () =>
    {
        it('should lock and unlock without errors', async () =>
        {
            await friendTrade.LockFriendTrade();
            expect(() => friendTrade.UnlockFriendTrade()).to.not.throw();
        });

        it('should wait for the first lock to be released', async () =>
        {
            await friendTrade.LockFriendTrade();
            
            let secondLockResolved = false;
            const lockPromise = friendTrade.LockFriendTrade().then(() => {
                secondLockResolved = true;
            });
            
            // Give some time for the promise to settle if it was going to resolve immediately
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // The second lock should still be waiting
            expect(secondLockResolved).to.be.false;

            // Unlock and ensure the second lock can proceed
            friendTrade.UnlockFriendTrade();
            await lockPromise; // Should resolve now
            
            expect(secondLockResolved).to.be.true;
        });
    });

    describe('CreateFriendCode', () =>
    {
        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
        });

        it('should generate a friend code', () =>
        {
            const code = friendTrade.CreateFriendCode();
            expect(code).to.equal('test1234');
        });

        it('should generate different codes when one is in use', () =>
        {
            let callCount = 0;
            randomstringStub.generate = () =>
            {
                callCount++;
                return callCount === 1 ? 'used1234' : 'free5678';
            };

            friendTrade.SetCodeInUse('used1234', true);
            const code = friendTrade.CreateFriendCode();
            expect(code).to.equal('free5678');
        });

        it('should handle multiple codes in use', () =>
        {
            let callCount = 0;
            const usedCodes = ['used1111', 'used2222', 'used3333'];
            randomstringStub.generate = () =>
            {
                callCount++;
                if (callCount <= usedCodes.length)
                    return usedCodes[callCount - 1];
                return 'free9999';
            };

            usedCodes.forEach(code => friendTrade.SetCodeInUse(code, true));
            const code = friendTrade.CreateFriendCode();
            expect(code).to.equal('free9999');
        });
    });

    describe('SetupFriendTradeHandlers', () =>
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
                emit: () => {}
            };
            mockSocketUtils = {};
        });

        it('should set up createCode handler', () =>
        {
            friendTrade.SetupFriendTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key1', 'User1');
            expect(mockHandlers.createCode).to.be.a('function');
        });

        it('should set up checkCode handler', () =>
        {
            friendTrade.SetupFriendTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key1', 'User1');
            expect(mockHandlers.checkCode).to.be.a('function');
        });

        it('should set up tradeOffer handler', () =>
        {
            friendTrade.SetupFriendTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key1', 'User1');
            expect(mockHandlers.tradeOffer).to.be.a('function');
        });

        it('should set up acceptedTrade handler', () =>
        {
            friendTrade.SetupFriendTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key1', 'User1');
            expect(mockHandlers.acceptedTrade).to.be.a('function');
        });

        it('should set up cancelledTradeAcceptance handler', () =>
        {
            friendTrade.SetupFriendTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key1', 'User1');
            expect(mockHandlers.cancelledTradeAcceptance).to.be.a('function');
        });

        it('should set up tradeAgain handler', () =>
        {
            friendTrade.SetupFriendTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key1', 'User1');
            expect(mockHandlers.tradeAgain).to.be.a('function');
        });

        it('should set up disconnect handler', () =>
        {
            friendTrade.SetupFriendTradeHandlers(mockSocket, mockSocketUtils, 'client1', 'user1', 'key1', 'User1');
            expect(mockHandlers.disconnect).to.be.a('function');
        });
    });

    describe('HandleCreateFriendCode', () =>
    {
        let mockSocketUtils;
        let emittedEvents;

        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
            emittedEvents = {};
            mockSocketUtils =
            {
                safeEmit: (event, data) =>
                {
                    return new Promise((resolve) =>
                    {
                        emittedEvents[event] = data;
                        resolve();
                    });
                }
            };
        });

        it('should create code and emit it when valid', async () =>
        {
            await friendTrade.HandleCreateFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', false, 'User1'
            );

            expect(emittedEvents.createCode).to.equal('test1234');
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.deep.include
            ({
                username: 'user1',
                code: 'test1234',
                friend: '',
                randomizer: false,
                state: friendTrade.FRIEND_TRADE_INITIAL
            });
        });

        it('should not create code when cloud sync key is invalid', async () =>
        {
            // Ensure the stub is configured before calling the function
            tradeUtilStub._CloudDataSyncKeyIsValidForTrade = () => Promise.resolve(false);

            await friendTrade.HandleCreateFriendCode(
                mockSocketUtils, 'client1', 'user1', 'invalidKey', false, 'User1'
            );

            expect(emittedEvents.createCode).to.be.undefined;
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.be.undefined;
            const codes = friendTrade.GetCodesInUse();
            expect(codes['test1234']).to.be.undefined;
        });

        it('should handle error thrown', async () =>
        {
            mockSocketUtils.safeEmit = () => { return Promise.reject(); };

            await friendTrade.HandleCreateFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', false, 'User1'
            );

            // Should not throw and should handle gracefully
            expect(Object.keys(emittedEvents)).to.have.length(0);
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.be.undefined;
            const codes = friendTrade.GetCodesInUse();
            expect(codes['test1234']).to.be.undefined;
        });
    });

    describe('HandleCheckFriendCode', () =>
    {
        let mockSocketUtils;
        let emittedEvents;

        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
            emittedEvents = {};
            mockSocketUtils =
            {
                safeEmit: (event, data) =>
                {
                    return new Promise((resolve) =>
                    {
                        emittedEvents[event] = data;
                        resolve();
                    });
                }
            };
        });

        it('should emit friendNotFound when code does not exist', async () =>
        {
            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', 'nonexistent', false, 'User1'
            );

            expect(emittedEvents).to.have.property('friendNotFound');
        });

        it('should emit tradeWithSelf when trying to trade with same user', async () =>
        {
            // Set up a client with the same username
            friendTrade.SetFriendTradeClientData('client2',
            {
                username: 'user1',
                code: 'test1234',
                friend: '',
                randomizer: false,
                state: 0
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', 'test1234', false, 'User1'
            );

            expect(emittedEvents).to.have.property('tradeWithSelf');
        });

        it('should emit mismatchedRandomizer when randomizer settings do not match', async () =>
        {
            // Set up a client with different randomizer setting
            friendTrade.SetFriendTradeClientData('client2',
            {
                username: 'user2',
                code: 'test1234',
                friend: '',
                randomizer: true,
                state: 0
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', 'test1234', false, 'User1'
            );

            expect(emittedEvents).to.have.property('mismatchedRandomizer');
        });

        it('should connect clients when everything matches', async () =>
        {
            // Set up a client with matching randomizer setting
            friendTrade.SetFriendTradeClientData('client2', {
                username: 'user2',
                code: 'test1234',
                friend: '',
                randomizer: false,
                state: 0
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', 'test1234', false, 'User1'
            );

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.deep.include
            ({
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_CONNECTED,
            });
            expect(clients.client2).to.deep.include
            ({
                username: 'user2',
                code: 'test1234',
                friend: 'client1',
                state: friendTrade.FRIEND_TRADE_CONNECTED,
            });
        });

        it('should not proceed when cloud sync key is invalid', async () =>
        {
            // Ensure the stub is configured before calling the function
            tradeUtilStub._CloudDataSyncKeyIsValidForTrade = () => Promise.resolve(false);

            // Clear any previous emitted events
            emittedEvents = {};

            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, 'client1', 'user1', 'invalidKey', 'test1234', false, 'User1'
            );

            expect(Object.keys(emittedEvents)).to.have.length(0);
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.be.undefined;
        });

        it('should not handle error thrown', async () =>
        {
            tradeUtilStub._CloudDataSyncKeyIsValidForTrade = () => { throw new Error('Test error'); };

            // Clear any previous emitted events
            emittedEvents = {};

            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', 'test1234', false, 'User1'
            );

            // Should not throw and should handle gracefully
            expect(Object.keys(emittedEvents)).to.have.length(0);
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.be.undefined;
        });
    });

    describe('HandleFriendTradeOffer', () =>
    {
        let mockSocketUtils, emittedEvents;

        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
            emittedEvents = {};
            mockSocketUtils =
            {
                safeEmit: (event, data) =>
                {
                    return new Promise((resolve) =>
                    {
                        emittedEvents[event] = data;
                        resolve();
                    });
                }
            };
        });

        it('should handle valid Pokemon offer', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });

            await friendTrade.HandleFriendTradeOffer(
                mockSocketUtils, 'client1', gTestPokemon, 'User1'
            );

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1.offeringPokemon).to.deep.equal(gTestPokemon);
            expect(clients.client1.notifiedFriendOfOffer).to.be.false;
        });

        it('should emit invalidPokemon when Pokemon is invalid', async () =>
        {
            await friendTrade.HandleFriendTradeOffer(
                mockSocketUtils, 'client1', {}, 'User1'
            );

            expect(emittedEvents).to.have.property('invalidPokemon');
        });

        it('should handle null Pokemon (cancellation)', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });

            await friendTrade.HandleFriendTradeOffer(
                mockSocketUtils, 'client1', null, 'User1'
            );

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1.offeringPokemon).to.be.null;
        });

        it('should handle client that does not exist', async () =>
        {
            await friendTrade.HandleFriendTradeOffer(
                mockSocketUtils, 'nonexistent', gTestPokemon, 'User1'
            );

            // Should throw an error and should handle gracefully
            expect(Object.keys(emittedEvents)).to.have.length(0);
        });
    });

    describe('HandleTradeAgain', () =>
    {
        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
        });

        it('should reset client state for trade again', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_ENDING_TRADE,
                offeringPokemon: gTestPokemon,
                notifiedFriendOfOffer: true,
                acceptedTrade: true
            });

            await friendTrade.HandleTradeAgain('client1', 'User1');

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.deep.include({
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
        });

        it('should handle client that does not exist', async () =>
        {
            await friendTrade.HandleTradeAgain('nonexistent', 'User1');
            // Should not throw
        });
    });

    describe('HandleFriendTradeDisconnect', () =>
    {
        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
        });

        it('should clean up client data on disconnect', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.HandleFriendTradeDisconnect('client1', 'User1');

            const clients = friendTrade.GetAllFriendTradeClients();
            const codes = friendTrade.GetCodesInUse();
            
            expect(clients.client1).to.be.undefined;
            expect(codes['test1234']).to.be.undefined;
        });

        it('should handle client that does not exist', async () =>
        {
            await friendTrade.HandleFriendTradeDisconnect('nonexistent', 'User2');
            // Should not throw
        });
    });

    describe('ProcessFriendTradeStates', () =>
    {
        let mockSocketUtils;
        let mockUpdateActivity;
        let mockSetInactive;
        let emittedEvents;
        let activityUpdated;
        let inactiveSet;

        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
            emittedEvents = {};
            activityUpdated = false;
            inactiveSet = false;
            mockUpdateActivity = () => { activityUpdated = true; };
            mockSetInactive = () => { inactiveSet = true; };
            mockSocketUtils =
            {
                safeEmit: (event, data) =>
                {
                    return new Promise((resolve) =>
                    {
                        emittedEvents[event] = data;
                        resolve();
                    });
                }
            };
        });

        it('should return early when client does not exist', async () =>
        {
            await friendTrade.ProcessFriendTradeStates('nonexistent', 'nonexistent', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(Object.keys(emittedEvents)).to.have.length(0);
            expect(activityUpdated).to.be.false;
        });

        it('should return early when client has no friend', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: '',
                state: friendTrade.FRIEND_TRADE_CONNECTED,
            });

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);
            
            expect(Object.keys(emittedEvents)).to.have.length(0);
            expect(activityUpdated).to.be.false;
        });

        it('should emit friendFound when state is CONNECTED', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1', {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_CONNECTED,
            });

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);
            
            expect(emittedEvents).to.have.property('friendFound');
            expect(activityUpdated).to.be.true;
            
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION);
        });

        it('should handle socket emit error and set inactive', async () =>
        {
            mockSocketUtils.safeEmit = () => { throw new Error('Socket error'); };
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_CONNECTED,
            });

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(inactiveSet).to.be.true;
        });

        // More tests for other FT states?
    });

    describe('handleFriendTradeNotifiedState (via ProcessFriendTradeStates)', () =>
    {
        let mockSocketUtils;
        let mockUpdateActivity;
        let mockSetInactive;
        let emittedEvents;
        let activityUpdated;
        let inactiveSet;

        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
            emittedEvents = {};
            activityUpdated = false;
            inactiveSet = false;
            mockUpdateActivity = () => { activityUpdated = true; };
            mockSetInactive = () => { inactiveSet = true; };
            mockSocketUtils =
            {
                safeEmit: (event, data) =>
                {
                    return new Promise((resolve) =>
                    {
                        emittedEvents[event] = data;
                        resolve();
                    });
                }
            };
        });

        it('should emit partnerDisconnected when code not in use', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
            // Don't set code in use to simulate partner disconnect

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(emittedEvents).to.have.property('partnerDisconnected');
            expect(activityUpdated).to.be.true;
        });

        it('should handle socket emit error when partner disconnected', async () =>
        {
            mockSocketUtils.safeEmit = () => { throw new Error('Socket error'); };
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(inactiveSet).to.be.true;
        });

        it('should return early when friend does not exist', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'nonexistent',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(Object.keys(emittedEvents)).to.have.length(0);
            expect(activityUpdated).to.be.false;
        });

        it('should emit tradeOffer when friend has offering Pokemon', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
            friendTrade.SetFriendTradeClientData('client2',
            {
                username: 'user2',
                code: 'test1234',
                friend: 'client1',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
                offeringPokemon: gTestPokemon,
                notifiedFriendOfOffer: false
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(emittedEvents).to.have.property('tradeOffer');
            expect(emittedEvents.tradeOffer).to.deep.equal(gTestPokemon);
            expect(activityUpdated).to.be.true;
            
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client2.notifiedFriendOfOffer).to.be.true;
        });

        it('should emit tradeOffer with null when friend cancels offer', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
            friendTrade.SetFriendTradeClientData('client2',
            {
                username: 'user2',
                code: 'test1234',
                friend: 'client1',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
                offeringPokemon: null,
                notifiedFriendOfOffer: false
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(emittedEvents).to.have.property('tradeOffer');
            expect(emittedEvents.tradeOffer).to.be.null;
            expect(activityUpdated).to.be.true;
        });

        it('should handle socket emit error when sending trade offer', async () =>
        {
            mockSocketUtils.safeEmit = () => { throw new Error('Socket error'); };
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
            friendTrade.SetFriendTradeClientData('client2',
            {
                username: 'user2',
                code: 'test1234',
                friend: 'client1',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
                offeringPokemon: gTestPokemon,
                notifiedFriendOfOffer: false
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(inactiveSet).to.be.true;
        });

        it('should advance to ACCEPTED_TRADE state when both clients accept', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
                acceptedTrade: true,
                offeringPokemon: gTestPokemon,
            });
            friendTrade.SetFriendTradeClientData('client2',
            {
                username: 'user2',
                code: 'test1234',
                friend: 'client1',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
                acceptedTrade: true,
                offeringPokemon: gTestPokemon2
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_ACCEPTED_TRADE);
            expect(clients.client1.friendPokemon).to.deep.equal(gTestPokemon2);
            expect(clients.client1.friendUsername).to.equal('user2');
            expect(clients.client2.state).to.equal(friendTrade.FRIEND_TRADE_ACCEPTED_TRADE);
            expect(clients.client2.friendPokemon).to.deep.equal(gTestPokemon);
            expect(clients.client2.friendUsername).to.equal('user1');
        });

        it('should not advance state when only one client accepts', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
                acceptedTrade: true,
                offeringPokemon: gTestPokemon
            });
            friendTrade.SetFriendTradeClientData('client2',
            {
                username: 'user2',
                code: 'test1234',
                friend: 'client1',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
                acceptedTrade: false,
                offeringPokemon: gTestPokemon2
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION);
            expect(clients.client2.state).to.equal(friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION);
        });
    });

    describe('handleFriendTradeAcceptedState (via ProcessFriendTradeStates)', () =>
    {
        let mockSocketUtils;
        let mockUpdateActivity;
        let mockSetInactive;
        let emittedEvents;
        let activityUpdated;
        let inactiveSet;

        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
            emittedEvents = {};
            activityUpdated = false;
            inactiveSet = false;
            mockUpdateActivity = () => { activityUpdated = true; };
            mockSetInactive = () => { inactiveSet = true; };
            mockSocketUtils =
            {
                safeEmit: (event, data) =>
                {
                    return new Promise((resolve) =>
                    {
                        emittedEvents[event] = data;
                        resolve();
                    });
                }
            };
        });

        it('should emit acceptedTrade with friend Pokemon and advance state', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_ACCEPTED_TRADE,
                offeringPokemon: gTestPokemon,
                friendPokemon: gTestPokemon2,
                friendUsername: 'user2'
            });

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(emittedEvents).to.have.property('acceptedTrade');
            expect(emittedEvents.acceptedTrade).to.be.an('object');
            expect(activityUpdated).to.be.true;
            
            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_ENDING_TRADE);
        });

        it('should handle socket emit error during trade completion', async () =>
        {
            mockSocketUtils.safeEmit = () => { throw new Error('Socket error'); };
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_ACCEPTED_TRADE,
                offeringPokemon: gTestPokemon,
                friendPokemon: gTestPokemon2,
                friendUsername: 'user2'
            });

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(inactiveSet).to.be.true;
        });

        it('should handle client without username gracefully', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_ACCEPTED_TRADE,
                offeringPokemon: gTestPokemon,
                friendPokemon: gTestPokemon2,
                friendUsername: 'user2'
            });

            await friendTrade.ProcessFriendTradeStates('client1', 'client1', mockSocketUtils, mockUpdateActivity, mockSetInactive);

            expect(emittedEvents).to.have.property('acceptedTrade');
            expect(activityUpdated).to.be.true;
        });
    });

    describe('CleanupFriendTradeClient', () =>
    {
        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
        });

        it('should clean up client data on disconnect', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1',
            {
                username: 'user1',
                code: 'test1234',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });
            friendTrade.SetCodeInUse('test1234', true);

            await friendTrade.CleanupFriendTradeClient('client1', 'User1');

            const clients = friendTrade.GetAllFriendTradeClients();
            const codes = friendTrade.GetCodesInUse();
            
            expect(clients.client1).to.be.undefined;
            expect(codes['test1234']).to.be.undefined;
        });

        it('should handle client that does not exist', async () =>
        {
            await friendTrade.CleanupFriendTradeClient('nonexistent', 'User2');
            // Should not throw
        });

        it('should handle null client', async () =>
        {
            await friendTrade.CleanupFriendTradeClient(null, null);
            // Should not throw
        });

        it('should handle client with no code', async () =>
        {
            friendTrade.SetFriendTradeClientData('client1', {
                username: 'user1',
                friend: 'client2',
                state: friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION,
            });

            await friendTrade.CleanupFriendTradeClient('client1', 'User3');

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1).to.be.undefined;
        });
    });

    describe('Integration Tests', () =>
    {
        const clientId1 = 'client1';
        const clientId2 = 'client2';
        const username1 = 'User1';
        const username2 = 'User2';
        const clientName1 = username1;
        const clientName2 = username2;

        let emittedEvents = {};
        const mockSocketUtils =
        {
            safeEmit: (event, data) =>
            {
                return new Promise((resolve) =>
                {
                    emittedEvents[event] = data;
                    resolve();
                });
            },
        };

        beforeEach(() =>
        {
            friendTrade.ClearAllFriendTradeData();
            emittedEvents = {};
        });

        it('should handle complete Pokemon offer and acceptance flow', async () =>
        {
            // Connect clients
            await friendTrade.HandleCreateFriendCode(
                mockSocketUtils, clientId1, username1, 'validKey', false, clientName1
            );

            expect(emittedEvents.createCode).to.equal('test1234');

            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, clientId2, username2, 'validKey', 'test1234', false, clientName2
            );

            const clients = friendTrade.GetAllFriendTradeClients();
            expect(clients.client1.friend).to.equal(clientId2);
            expect(clients.client2.friend).to.equal(clientId1);
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_CONNECTED);
            expect(clients.client2.state).to.equal(friendTrade.FRIEND_TRADE_CONNECTED);

            // Process state to notify connection
            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId1, clientName1, mockSocketUtils, () => {}, () => {});
            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});
            expect(emittedEvents).to.have.property('friendFound');

            // Both clients offer Pokemon
            await friendTrade.HandleFriendTradeOffer(mockSocketUtils, clientId1, gTestPokemon, clientName1);
            await friendTrade.HandleFriendTradeOffer(mockSocketUtils, clientId2, gTestPokemon2, clientName2);

            // Process states to send offers
            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId1, clientName1, mockSocketUtils, () => {}, () => {});
            expect(emittedEvents).to.have.property('tradeOffer');

            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});
            expect(emittedEvents).to.have.property('tradeOffer');

            // Both clients accept the trade
            friendTrade.GetAllFriendTradeClients().client1.acceptedTrade = true;
            friendTrade.GetAllFriendTradeClients().client2.acceptedTrade = true;

            // Process states to complete trade
            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId1, clientName1, mockSocketUtils, () => {}, () => {});

            // Both should advance to accepted trade state
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_ACCEPTED_TRADE);
            expect(clients.client2.state).to.equal(friendTrade.FRIEND_TRADE_ACCEPTED_TRADE);            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});

            // Process states to end the trade
            await friendTrade.ProcessFriendTradeStates(clientId1, clientName1, mockSocketUtils, () => {}, () => {});
            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});

            // Both should advance to ending trade state
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_ENDING_TRADE);
            expect(clients.client2.state).to.equal(friendTrade.FRIEND_TRADE_ENDING_TRADE);

            // Both clients want to trade again
            await friendTrade.HandleTradeAgain(clientId1, 'User1');
            await friendTrade.HandleTradeAgain(clientId2, 'User2');
            expect(clients.client1.state).to.equal(friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION);
            expect(clients.client2.state).to.equal(friendTrade.FRIEND_TRADE_NOTIFIED_CONNECTION);
            expect(clients.client1.offeringPokemon).to.be.undefined;
            expect(clients.client2.offeringPokemon).to.be.undefined;
            expect(clients.client1.acceptedTrade).to.be.undefined;
            expect(clients.client2.acceptedTrade).to.be.undefined;
        });

        it('should handle Pokemon offer cancellation and disconnect flow', async () =>
        {
            // Set up connected clients
            await friendTrade.HandleCreateFriendCode(
                mockSocketUtils, clientId1, username1, 'validKey', false, clientName1
            );
            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, clientId2, username2, 'validKey', 'test1234', false, clientName2
            );

            // Process state to notify connection
            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId1, clientName1, mockSocketUtils, () => {}, () => {});
            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});
            expect(emittedEvents).to.have.property('friendFound');

            // Client 1 offers Pokemon
            await friendTrade.HandleFriendTradeOffer(mockSocketUtils, clientId1, gTestPokemon, clientName1);

            // Client 2 should receive the offer
            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});
            expect(emittedEvents).to.have.property('tradeOffer');

            // Client 1 cancels offer
            await friendTrade.HandleFriendTradeOffer(mockSocketUtils, clientId1, null, clientName1);

            // Client 2 should receive null offer
            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});
            expect(emittedEvents.tradeOffer).to.be.null;

            // Client 1 disconnects
            await friendTrade.HandleFriendTradeDisconnect(clientId1, clientName1);

            // Client 2 should be notified of partner disconnect
            emittedEvents = {};
            await friendTrade.ProcessFriendTradeStates(clientId2, clientName2, mockSocketUtils, () => {}, () => {});
            expect(emittedEvents).to.have.property('partnerDisconnected');

            // Client 1 should be cleaned up
            const clients = friendTrade.GetAllFriendTradeClients();
            const codes = friendTrade.GetCodesInUse();
            expect(clients.client1).to.be.undefined;
            expect(codes['test1234']).to.be.undefined;
        });

        it('should prevent self-trading with same username', async () =>
        {
            // Client 1 creates a code
            await friendTrade.HandleCreateFriendCode(
                mockSocketUtils, clientId1, 'user1', 'validKey', false, 'User1'
            );

            // Same user tries to check the code
            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, clientId2, 'user1', 'validKey', 'test1234', false, 'User1'
            );

            expect(emittedEvents).to.have.property('tradeWithSelf');
        });

        it('should prevent trading with mismatched randomizer settings', async () =>
        {
            // Client 1 creates a code without randomizer
            await friendTrade.HandleCreateFriendCode(
                mockSocketUtils, 'client1', 'user1', 'validKey', false, 'User1'
            );

            // Client 2 tries to check with randomizer enabled
            await friendTrade.HandleCheckFriendCode(
                mockSocketUtils, 'client2', 'user2', 'validKey', 'test1234', true, 'User2'
            );

            expect(emittedEvents).to.have.property('mismatchedRandomizer');
        });
    });
});
