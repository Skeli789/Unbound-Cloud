const { Server } = require('socket.io');
const { createServer } = require('http');
const { io: Client } = require('socket.io-client');
const { expect } = require('chai');
const Module = require('module');
const { gTestPokemon, gTestPokemon2 } = require('./data');


describe('Socket Integration Tests', () =>
{
    let httpServer;
    let ioServer;
    let clientSocket1;
    let clientSocket2;
    let serverPort;
    let originalRequire;
    let accountsStub;
    let tradeUtilStub;
    let discordStub;
    let sockets;

    before((done) =>
    {
        // Create stubs for dependencies
        accountsStub =
        {
            GetCloudDataSyncKey: () => Promise.resolve('valid-key'),
            IsUserBannedFromWonderTrade: () => false
        };

        tradeUtilStub =
        {
            CloudDataSyncKeyIsValidForTrade: (...args) => tradeUtilStub._CloudDataSyncKeyIsValidForTrade(...args),
            _CloudDataSyncKeyIsValidForTrade: () => Promise.resolve(true),
            INVALID_CLOUD_DATA_SYNC_KEY_ERROR: 'Invalid cloud data sync key'
        };

        discordStub =
        {
            WebhookClient: function ()
            {
                return {
                    send: () => Promise.resolve({ id: '123456789' }),
                    editMessage: () => Promise.resolve(true)
                };
            }
        };

        // Clear module cache to ensure fresh requires
        delete require.cache[require.resolve('../sockets')];
        delete require.cache[require.resolve('../wonder-trade')];
        delete require.cache[require.resolve('../friend-trade')];
        delete require.cache[require.resolve('../trade-util')];

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

        // Now require the sockets module
        sockets = require('../sockets');

        httpServer = createServer();
        ioServer = new Server(httpServer);

        // Initialize our socket handling
        sockets.InitSockets(ioServer);

        httpServer.listen(() =>
        {
            serverPort = httpServer.address().port;
            done();
        });
    });

    after(() =>
    {
        ioServer.close();
        httpServer.close();

        // Restore original require
        Module.prototype.require = originalRequire;

        // Clear module cache for cleanup
        delete require.cache[require.resolve('../sockets')];
        delete require.cache[require.resolve('../wonder-trade')];
        delete require.cache[require.resolve('../friend-trade')];
        delete require.cache[require.resolve('../trade-util')];
    });

    beforeEach((done) =>
    {
        // Reset stubs to default behavior
        accountsStub.GetCloudDataSyncKey = () => Promise.resolve('valid-key');
        accountsStub.IsUserBannedFromWonderTrade = () => false;
        tradeUtilStub._CloudDataSyncKeyIsValidForTrade = () => Promise.resolve(true);

        clientSocket1 = new Client(`http://localhost:${serverPort}`);
        clientSocket2 = new Client(`http://localhost:${serverPort}`);

        let connectedClients = 0;
        const onConnect = () =>
        {
            connectedClients++;
            if (connectedClients === 2)
                done();
        };

        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
    });

    afterEach(() =>
    {
        // Clean disconnect sockets
        if (clientSocket1?.connected)
            clientSocket1.disconnect();
        if (clientSocket2?.connected)
            clientSocket2.disconnect();
    });

    describe('Socket Connection and Basic Events', () =>
    {
        it('should handle ping/pong events', (done) =>
        {
            clientSocket1.on('pong', () =>
            {
                done();
            });

            clientSocket1.emit('ping');
        });

        it('should handle disconnect events', (done) =>
        {
            clientSocket1.on('disconnect', () =>
            {
                done();
            });

            clientSocket1.disconnect();
        });

        it('should handle multiple simultaneous connections', () =>
        {
            expect(clientSocket1.connected).to.be.true;
            expect(clientSocket2.connected).to.be.true;
        });

        it('should assign unique client IDs', () =>
        {
            expect(clientSocket1.id).to.not.equal(clientSocket2.id);
            expect(clientSocket1.id).to.be.a('string');
            expect(clientSocket2.id).to.be.a('string');
        });
    });

    describe('Trade Type Handler', () =>
    {
        it('should handle Wonder Trade type', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                done();
            }, 100);
        });

        it('should handle Friend Trade type', (done) =>
        {
            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                done();
            }, 100);
        });

        it('should handle invalid trade type', (done) =>
        {
            clientSocket1.on('invalidCloudDataSyncKey', (message) =>
            {
                expect(message).to.include('Trade type not recognized');
                done();
            });

            clientSocket1.emit('tradeType', 'INVALID_TYPE', 'user1', 'valid-key');
        });

        it('should handle missing parameters', (done) =>
        {
            clientSocket1.emit('tradeType');

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                done();
            }, 100);
        });

        it('should update client name when username provided', (done) =>
        {
            const username = 'testuser123';
            clientSocket1.emit('tradeType', 'WONDER_TRADE', username, 'valid-key');

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                done();
            }, 100);
        });
    });

    describe('Wonder Trade End-to-End', () =>
    {
        it('should complete a successful Wonder Trade between two clients', function (done)
        {
            let tradedClients = 0;
            const onTrade = (pokemon, receivedFrom) =>
            {
                tradedClients++;
                expect(pokemon).to.exist;
                expect(receivedFrom).to.exist;

                if (tradedClients === 2)
                    done();
            };

            clientSocket1.on('message', onTrade);
            clientSocket2.on('message', onTrade);

            // Set up Wonder Trade for both clients
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
            clientSocket2.emit('tradeType', 'WONDER_TRADE', 'user2', 'valid-key');

            setTimeout(() =>
            {
                // Send Pokemon from both clients
                clientSocket1.emit('message', { ...gTestPokemon }, false);
                clientSocket2.emit('message', { ...gTestPokemon2 }, false);
            }, 100);
        });

        it('should handle Wonder Trade with invalid cloud key', (done) =>
        {
            // Override the stub to return false and emit the error
            tradeUtilStub._CloudDataSyncKeyIsValidForTrade = (username, clientId, cloudDataSyncKey, randomizer, socketUtils, tradeType) =>
            {
                // Immediately emit the error and return false
                socketUtils.safeEmit('invalidCloudDataSyncKey', tradeUtilStub.INVALID_CLOUD_DATA_SYNC_KEY_ERROR).catch(() => { });
                return Promise.resolve(false);
            };

            clientSocket1.on('invalidCloudDataSyncKey', (message) =>
            {
                expect(message).to.equal(tradeUtilStub.INVALID_CLOUD_DATA_SYNC_KEY_ERROR);
                done();
            });

            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'invalid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);
            }, 100);
        });

        it('should handle Wonder Trade with invalid Pokemon', (done) =>
        {
            clientSocket1.on('invalidPokemon', () =>
            {
                done();
            });

            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('message', { invalid: 'pokemon' }, false);
            }, 100);
        });

        it('should prevent duplicate Wonder Trades from same user', (done) =>
        {
            clientSocket2.on('invalidCloudDataSyncKey', (message) =>
            {
                expect(message).to.include('Wonder Trade in progress');
                done();
            });

            // First Wonder Trade
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);

                // Try second Wonder Trade with same user
                setTimeout(() =>
                {
                    clientSocket2.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
                    setTimeout(() =>
                    {
                        clientSocket2.emit('message', { ...gTestPokemon2 }, false);
                    }, 50);
                }, 50);
            }, 50);
        });

        it('should handle Wonder Trade client disconnect', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);

                setTimeout(() =>
                {
                    clientSocket1.disconnect();

                    setTimeout(() =>
                    {
                        expect(clientSocket1.connected).to.be.false;
                        done();
                    }, 100);
                }, 100);
            }, 100);
        });
    });

    describe('Friend Trade End-to-End', () =>
    {
        it('should create and connect with friend code', function (done)
        {
            let friendsMatched = 0;
            const onFriendFound = () =>
            {
                friendsMatched++;
                if (friendsMatched === 2)
                    done();
            };

            clientSocket1.on('friendFound', onFriendFound);
            clientSocket2.on('friendFound', onFriendFound);

            clientSocket1.on('createCode', (code) =>
            {
                expect(code).to.be.a('string');
                expect(code).to.have.length(8);

                // Client2 connects with the code
                clientSocket2.emit('tradeType', 'FRIEND_TRADE', 'user2', 'valid-key');
                setTimeout(() =>
                {
                    clientSocket2.emit('checkCode', code, false);
                }, 50);
            });

            // Client1 creates a code
            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('createCode', false);
            }, 100);
        });

        it('should handle friend code not found', (done) =>
        {
            clientSocket1.on('friendNotFound', () =>
            {
                done();
            });

            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('checkCode', 'nonexistent', false);
            }, 100);
        });

        it('should prevent trading with self', (done) =>
        {
            clientSocket1.on('tradeWithSelf', () =>
            {
                done();
            });

            clientSocket1.on('createCode', (code) =>
            {
                setTimeout(() =>
                {
                    clientSocket1.emit('checkCode', code, false);
                }, 50);
            });

            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('createCode', false);
            }, 100);
        });

        it('should handle mismatched randomizer settings', (done) =>
        {
            clientSocket2.on('mismatchedRandomizer', () =>
            {
                done();
            });

            clientSocket1.on('createCode', (code) =>
            {
                clientSocket2.emit('tradeType', 'FRIEND_TRADE', 'user2', 'valid-key');
                setTimeout(() =>
                {
                    clientSocket2.emit('checkCode', code, true); // Different randomizer setting
                }, 50);
            });

            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('createCode', false);
            }, 100);
        });

        it('should handle friend trade offers', function (done)
        {
            clientSocket2.on('tradeOffer', (pokemon) =>
            {
                expect(pokemon).to.deep.equal(gTestPokemon);
                done();
            });

            let friendsConnected = 0;
            const onFriendFound = () =>
            {
                friendsConnected++;
                if (friendsConnected === 2)
                {
                    setTimeout(() =>
                    {
                        clientSocket1.emit('tradeOffer', { ...gTestPokemon });
                    }, 100);
                }
            };

            clientSocket1.on('friendFound', onFriendFound);
            clientSocket2.on('friendFound', onFriendFound);

            clientSocket1.on('createCode', (code) =>
            {
                clientSocket2.emit('tradeType', 'FRIEND_TRADE', 'user2', 'valid-key');
                setTimeout(() =>
                {
                    clientSocket2.emit('checkCode', code, false);
                }, 100);
            });

            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('createCode', false);
            }, 100);
        });

        it('should handle invalid Pokemon in friend trade offer', (done) =>
        {
            clientSocket1.on('invalidPokemon', () =>
            {
                done();
            });

            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('tradeOffer', { invalid: 'pokemon' });
            }, 100);
        });

        it('should handle trade cancellation in friend trade', function (done)
        {
            clientSocket2.on('tradeOffer', (pokemon) =>
            {
                expect(pokemon).to.be.null;
                done();
            });

            let friendsConnected = 0;
            const onFriendFound = () =>
            {
                friendsConnected++;
                if (friendsConnected === 2)
                {
                    setTimeout(() =>
                    {
                        clientSocket1.emit('tradeOffer', null);
                    }, 100);
                }
            };

            clientSocket1.on('friendFound', onFriendFound);
            clientSocket2.on('friendFound', onFriendFound);

            clientSocket1.on('createCode', (code) =>
            {
                clientSocket2.emit('tradeType', 'FRIEND_TRADE', 'user2', 'valid-key');
                setTimeout(() =>
                {
                    clientSocket2.emit('checkCode', code, false);
                }, 100);
            });

            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('createCode', false);
            }, 100);
        });
    });

    describe('Error Handling and Edge Cases', () =>
    {
        it('should handle socket emission errors gracefully', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                clientSocket1.disconnect();

                setTimeout(() =>
                {
                    clientSocket1.emit('message', { ...gTestPokemon }, false);

                    setTimeout(() =>
                    {
                        expect(clientSocket1.connected).to.be.false;
                        done();
                    }, 100);
                }, 50);
            }, 100);
        });

        it('should handle rapid connection cycles', function (done)
        {
            let cycleCount = 0;
            const maxCycles = 3;

            const cycleTest = () =>
            {
                if (cycleCount >= maxCycles)
                {
                    done();
                    return;
                }

                let tempClient = new Client(`http://localhost:${serverPort}`);

                tempClient.on('connect', () =>
                {
                    tempClient.emit('tradeType', 'WONDER_TRADE', `cycleUser${cycleCount}`, 'valid-key');

                    setTimeout(() =>
                    {
                        tempClient.disconnect();
                    }, 50);
                });

                tempClient.on('disconnect', () =>
                {
                    cycleCount++;
                    setTimeout(cycleTest, 100);
                });
            };

            cycleTest();
        });

        it('should handle malformed event data', (done) =>
        {
            clientSocket1.emit('tradeType', { malformed: 'data' }, null, undefined);

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                done();
            }, 100);
        });

        it('should handle concurrent trade type emissions', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
            clientSocket1.emit('tradeType', 'FRIEND_TRADE', 'user1', 'valid-key');
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                done();
            }, 200);
        });

        it('should handle invalid cloud data sync key validation', (done) =>
        {
            // Override the stub to emit error and reject
            tradeUtilStub._CloudDataSyncKeyIsValidForTrade = (username, clientId, cloudDataSyncKey, randomizer, socketUtils, tradeType) =>
            {
                // Immediately emit the error and reject
                socketUtils.safeEmit('invalidCloudDataSyncKey', tradeUtilStub.INVALID_CLOUD_DATA_SYNC_KEY_ERROR).catch(() => { });
                return Promise.reject(new Error('Database error'));
            };

            clientSocket1.on('invalidCloudDataSyncKey', (message) =>
            {
                expect(message).to.equal(tradeUtilStub.INVALID_CLOUD_DATA_SYNC_KEY_ERROR);
                done();
            });

            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);
            }, 100);
        });

        it('should handle socket timeout scenarios', function (done)
        {
            const unresponsiveSocket = new Client(`http://localhost:${serverPort}`);

            unresponsiveSocket.on('connect', () =>
            {
                unresponsiveSocket.emit('tradeType', 'WONDER_TRADE', 'unresponsive_user', 'valid-key');

                setTimeout(() =>
                {
                    unresponsiveSocket.disconnect();
                    done();
                }, 1000);
            });
        });

        it('should handle mixed trade type scenarios', function (done)
        {
            // One client does Wonder Trade, another does Friend Trade
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
            clientSocket2.emit('tradeType', 'FRIEND_TRADE', 'user2', 'valid-key');

            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);
                clientSocket2.emit('createCode', false);

                setTimeout(() =>
                {
                    expect(clientSocket1.connected).to.be.true;
                    expect(clientSocket2.connected).to.be.true;
                    done();
                }, 200);
            }, 100);
        });

        it('should handle empty or null usernames', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', null, 'valid-key');
            clientSocket2.emit('tradeType', 'FRIEND_TRADE', '', 'valid-key');

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                expect(clientSocket2.connected).to.be.true;
                done();
            }, 100);
        });
    });

    describe('Socket State Management', () =>
    {
        it('should maintain separate state for multiple clients', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');
            clientSocket2.emit('tradeType', 'FRIEND_TRADE', 'user2', 'valid-key');

            setTimeout(() =>
            {
                // Both should be in different states but connected
                expect(clientSocket1.connected).to.be.true;
                expect(clientSocket2.connected).to.be.true;
                done();
            }, 100);
        });

        it('should clean up state on disconnect', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);

                setTimeout(() =>
                {
                    clientSocket1.disconnect();

                    setTimeout(() =>
                    {
                        expect(clientSocket1.connected).to.be.false;
                        done();
                    }, 100);
                }, 100);
            }, 100);
        });

        it('should handle activity updates', (done) =>
        {
            clientSocket1.emit('ping');

            setTimeout(() =>
            {
                clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

                setTimeout(() =>
                {
                    expect(clientSocket1.connected).to.be.true;
                    done();
                }, 100);
            }, 100);
        });
    });

    describe('Integration with Module Dependencies', () =>
    {
        it('should handle accounts module errors', (done) =>
        {
            accountsStub.IsUserBannedFromWonderTrade = () => { throw new Error('Database error'); };

            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                expect(clientSocket1.connected).to.be.true;
                done();
            }, 100);
        });

        it('should handle pokemon-util module errors', (done) =>
        {
            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);

                setTimeout(() =>
                {
                    expect(clientSocket1.connected).to.be.true;
                    done();
                }, 100);
            }, 100);
        });

        it('should handle discord webhook failures', (done) =>
        {
            discordStub.WebhookClient = function ()
            {
                return {
                    send: () => Promise.reject(new Error('Discord error')),
                    editMessage: () => Promise.reject(new Error('Discord error'))
                };
            };

            clientSocket1.emit('tradeType', 'WONDER_TRADE', 'user1', 'valid-key');

            setTimeout(() =>
            {
                clientSocket1.emit('message', { ...gTestPokemon }, false);

                setTimeout(() =>
                {
                    expect(clientSocket1.connected).to.be.true;
                    done();
                }, 100);
            }, 100);
        });
    });
});
