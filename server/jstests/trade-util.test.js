const { expect } = require('chai');
const Module = require('module');

let tradeUtil = require('../trade-util');


describe('Trade Util Tests', () =>
{
    let originalRequire;
    let accountsStub;

    beforeEach(() =>
    {
        // Clear module cache to ensure fresh requires
        delete require.cache[require.resolve('../trade-util')];

        // Create stub for accounts module
        accountsStub =
        {
            GetCloudDataSyncKey: () => Promise.resolve('valid-sync-key')
        };

        // Mock modules using Module approach
        originalRequire = Module.prototype.require;

        Module.prototype.require = function (id)
        {
            if (id === './accounts')
                return accountsStub;
            return originalRequire.apply(this, arguments);
        };
    });

    afterEach(() =>
    {
        // Restore original require after each test
        Module.prototype.require = originalRequire;

        // Clear module cache again to prevent state leakage
        delete require.cache[require.resolve('../trade-util')];
    });

    describe('CloudDataSyncKeyIsValidForTrade', () =>
    {
        let mockSocket;
        let mockSocketUtils;

        beforeEach(() =>
        {
            delete require.cache[require.resolve('../trade-util')];
            tradeUtil = require('../trade-util'); // Re-import the module to get the latest version

            mockSocket = {};
            mockSocketUtils = {
                safeEmit: (socket, route, message) =>
                {
                    // Store the emit calls for verification
                    if (!mockSocketUtils.emitCalls) mockSocketUtils.emitCalls = [];
                    mockSocketUtils.emitCalls.push({ socket, route, message });
                }
            };
        });

        it('should return false when username is required but not provided', async () =>
        {
            // Mock ENFORCE_USERNAMES to be true
            process.env.ACCOUNT_SYSTEM = "true";
            delete require.cache[require.resolve('../trade-util')];

            const result = await tradeUtil.CloudDataSyncKeyIsValidForTrade(
                '', 'client123', 'sync-key', false, mockSocketUtils, 'FT'
            );

            expect(result).to.be.false;
            expect(mockSocketUtils.emitCalls[0].route).to.equal('invalidCloudDataSyncKey');
            expect(mockSocketUtils.emitCalls[0].message).to.equal('A username must be provided to trade!');
        });

        it('should return false when cloud data sync key is missing', async () =>
        {
            const result = await tradeUtil.CloudDataSyncKeyIsValidForTrade(
                'testuser', 'client123', null, false, mockSocketUtils, 'WT'
            );

            expect(result).to.be.false;
            expect(mockSocketUtils.emitCalls[0].route).to.equal('invalidCloudDataSyncKey');
            expect(mockSocketUtils.emitCalls[0].message).to.equal('The cloud data sync key was missing!');
        });

        it('should return false when cloud data sync key does not match', async () =>
        {
            accountsStub.GetCloudDataSyncKey = () => Promise.resolve('different-sync-key');

            const result = await tradeUtil.CloudDataSyncKeyIsValidForTrade(
                'testuser', 'client123', 'wrong-sync-key', false, mockSocketUtils, 'FT'
            );

            expect(result).to.be.false;
            expect(mockSocketUtils.emitCalls[0].route).to.equal('invalidCloudDataSyncKey');
            expect(mockSocketUtils.emitCalls[0].message).to.equal(tradeUtil.INVALID_CLOUD_DATA_SYNC_KEY_ERROR);
        });

        it('should return false when GetCloudDataSyncKey throws an error', async () =>
        {
            accountsStub.GetCloudDataSyncKey = () => Promise.reject(new Error('Database error'));

            const result = await tradeUtil.CloudDataSyncKeyIsValidForTrade(
                'testuser', 'client123', 'sync-key', false, mockSocketUtils, 'WT'
            );

            expect(result).to.be.false;
            expect(mockSocketUtils.emitCalls[0].route).to.equal('invalidCloudDataSyncKey');
            expect(mockSocketUtils.emitCalls[0].message).to.equal('Error validating cloud data sync key!');
        });

        it('should return true when cloud data sync key matches', async () =>
        {
            accountsStub.GetCloudDataSyncKey = () => Promise.resolve('valid-sync-key');

            const result = await tradeUtil.CloudDataSyncKeyIsValidForTrade(
                'testuser', 'client123', 'valid-sync-key', false, mockSocketUtils, 'FT'
            );

            expect(result).to.be.true;
            expect(mockSocketUtils.emitCalls || []).to.have.length(0);
        });

        it('should return true when no username is provided and usernames are not enforced', async () =>
        {
            process.env.ACCOUNT_SYSTEM = "false";
            delete require.cache[require.resolve('../trade-util')];
            tradeUtil = require('../trade-util'); // Re-import the module to get the latest version with the new environment variable

            const result = await tradeUtil.CloudDataSyncKeyIsValidForTrade(
                null, 'client123', 'sync-key', false, mockSocketUtils, 'WT'
            );

            expect(result).to.be.true;
            expect(mockSocketUtils.emitCalls || []).to.have.length(0);
        });
    });

    describe('IsSameClient', () =>
    {
        it('should return true when client IDs match', () =>
        {
            const result = tradeUtil.IsSameClient('client1', 'client1', 'user1', 'user2');
            expect(result).to.be.true;
        });

        it('should return true when usernames match', () =>
        {
            const result = tradeUtil.IsSameClient('client1', 'client2', 'user1', 'user1');
            expect(result).to.be.true;
        });

        it('should return true when usernames are different cases', () =>
        {
            const result = tradeUtil.IsSameClient('client1', 'client2', 'USER1', 'user1');
            expect(result).to.be.true;
        });

        it('should return false when neither client IDs nor usernames match', () =>
        {
            const result = tradeUtil.IsSameClient('client1', 'client2', 'user1', 'user2');
            expect(result).to.be.false;
        });

        it('should handle null client IDs correctly', () =>
        {
            const result = tradeUtil.IsSameClient(null, 'client2', 'user1', 'user2');
            expect(result).to.be.false;
        });
    });

    describe('HasMatchingRandomizerSettings', () =>
    {
        it('should return true when both are true', () =>
        {
            const result = tradeUtil.HasMatchingRandomizerSettings(true, true);
            expect(result).to.be.true;
        });

        it('should return true when both are false', () =>
        {
            const result = tradeUtil.HasMatchingRandomizerSettings(false, false);
            expect(result).to.be.true;
        });

        it('should return false when one is true and other is false', () =>
        {
            const result = tradeUtil.HasMatchingRandomizerSettings(true, false);
            expect(result).to.be.false;
        });

        it('should return false when one is false and other is true', () =>
        {
            const result = tradeUtil.HasMatchingRandomizerSettings(false, true);
            expect(result).to.be.false;
        });
    });
});
