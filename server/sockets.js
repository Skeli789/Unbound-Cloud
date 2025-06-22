const { INVALID_CLOUD_DATA_SYNC_KEY_ERROR } = require('./trade-util');
const friendTrade = require('./friend-trade');
const wonderTrade = require('./wonder-trade');

// Timeout constants
const SOCKET_EMIT_TIMEOUT = 5000; // 5 seconds
const SOCKET_SEND_TIMEOUT = 10000; // 10 seconds
const HEALTH_CHECK_TIMEOUT = 3000; // 3 seconds
const SOCKET_ACTIVITY_TIMEOUT = 120000; // 2 minutes
const MAIN_LOOP_INTERVAL = 1000; // 1 second
const ERROR_RECOVERY_DELAY = 1000; // 1 second
const PING_TIMEOUT = 60000; // 60 seconds
const PING_INTERVAL = 25000; // 25 seconds

// Trade type constants
const TRADE_TYPE_WONDER_TRADE = "WONDER_TRADE";
const TRADE_TYPE_FRIEND_TRADE = "FRIEND_TRADE";


/**
 * Checks if a socket is connected and available for use.
 * @param {Object} socket - The socket instance to check.
 * @returns {Boolean} Whether the socket is connected and available.
 */
function isSocketConnected(socket)
{
    return socket && socket.connected && !socket.disconnected;
}

/**
 * Creates socket utility functions for safe operations.
 * @param {Object} socket - The socket instance.
 * @param {Function} updateActivity - Function to update last activity timestamp.
 * @returns {Object} Object containing utility functions.
 */
function createSocketUtils(socket, updateActivity)
{
    /**
     * Safely emits an event to the socket with timeout protection.
     * @param {String} event - The event name to emit.
     * @param {...*} args - Arguments to pass with the event.
     * @returns {Promise<void>} Promise that resolves when emit completes or rejects on error/timeout.
     */
    function safeEmit(event, ...args)
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                // Check if socket is still connected
                if (!isSocketConnected(socket))
                {
                    reject(new Error('Socket instance is disconnected'));
                    return;
                }

                // Set a timeout to reject if emit takes too long
                const timeout = setTimeout(() =>
                {
                    reject(new Error('Socket instance emit timeout'));
                }, SOCKET_EMIT_TIMEOUT); // 5 seconds

                // Emit the event and resolve when done
                socket.emit(event, ...args);
                clearTimeout(timeout);
                updateActivity(); // Update last activity timestamp
                resolve();
            }
            catch (error)
            {
                reject(new Error(`Socket instance error: ${error.message}`));
            }
        });
    };

    /**
     * Safely sends data to the socket with timeout protection.
     * @param {...*} args - Arguments to pass to socket.send().
     * @returns {Promise<void>} Promise that resolves when send completes or rejects on error/timeout.
     */
    function safeSend(...args)
    {
        return new Promise((resolve, reject) =>
        {
            try
            {
                // Check if socket is still connected
                if (!isSocketConnected(socket))
                {
                    reject(new Error('Socket instance is disconnected'));
                    return;
                }

                // Set a timeout to reject if send takes too long
                const timeout = setTimeout(() =>
                {
                    reject(new Error('Socket instance send timeout'));
                }, SOCKET_SEND_TIMEOUT); // 10 seconds

                // Send the data and resolve when done
                socket.send(...args);
                clearTimeout(timeout);
                updateActivity(); // Update last activity timestamp
                resolve();
            }
            catch (error)
            {
                reject(new Error(`Socket instance error: ${error.message}`));
            }
        });
    };

    /**
     * Checks the health of the socket connection by sending a ping.
     * @returns {Promise<Boolean>} Promise that resolves to whether socket is healthy.
     */
    async function checkSocketHealth()
    {
        try
        {
            // Check if socket is still connected
            if (!isSocketConnected(socket))
                return false;

            // Try a simple ping to test responsiveness
            await Promise.race([
                new Promise((resolve) =>
                {
                    socket.emit('ping', resolve);
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT)
                )
            ]);

            // Update last activity timestamp since the socket is responsive
            updateActivity();
            return true;
        }
        catch (error)
        {
            console.warn(`Socket health check failed: ${error.message}`);
            return false;
        }
    };

    return { safeEmit, safeSend, checkSocketHealth };
}

/**
 * Checks if socket instance has timed out and attempts recovery.
 * @param {Number} lastActivity - Timestamp of last activity.
 * @param {String} clientName - Client name for logging.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Promise<Boolean>} Whether the socket is still active.
 */
async function checkSocketTimeout(lastActivity, clientName, socketUtils, setInactive)
{
    const timeSinceLastActivity = Date.now() - lastActivity;
    if (timeSinceLastActivity > SOCKET_ACTIVITY_TIMEOUT) // 2 minutes
    {
        console.warn(`Socket instance timeout detected for ${clientName} (${timeSinceLastActivity}ms since last activity)`);

        if (!(await socketUtils.checkSocketHealth()))
        {
            console.error(`Socket instance is unresponsive for ${clientName}, terminating connection`);
            setInactive();
            return false;
        }
    }
    return true;
}

/**
 * Checks if socket is still connected.
 * @param {Object} socket - The socket instance.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Boolean} Whether the socket is still connected.
 */
function checkSocketConnection(socket, setInactive)
{
    if (!isSocketConnected(socket))
    {
        setInactive();
        return false;
    }
    return true;
}

/**
 * Waits for the next iteration of the main loop.
 * @param {Object} socket - The socket instance.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Promise<void>} Promise that resolves after waiting or rejects if socket disconnects.
 */
async function waitForNextIteration(socket, setInactive)
{
    await Promise.race([
        new Promise(r => setTimeout(r, MAIN_LOOP_INTERVAL)),
        new Promise((_, reject) =>
        {
            if (!isSocketConnected(socket))
                reject(new Error('Socket instance disconnected'));
        })
    ]).catch(error =>
    {
        if (error.message?.includes('disconnected'))
            setInactive();
        else
            console.error(`Timeout error: ${error}`);
    });
}

/**
 * Handles main loop errors and determines if loop should continue.
 * @param {Error} error - The error that occurred.
 * @param {String} clientName - Client name for logging.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @returns {Promise<Boolean>} Whether the loop should continue.
 */
async function handleMainLoopError(error, clientName, setInactive)
{
    console.error(`Error in main loop for ${clientName}:`, error);

    // Check if error is related to socket instance being unresponsive
    if (error.message?.includes('disconnect')
     || error.message?.includes('timeout')
     || error.message?.includes('instance'))
    {
        setInactive();
        return false;
    }

    await new Promise(r => setTimeout(r, ERROR_RECOVERY_DELAY));
    return true;
}

/**
 * Sets up basic socket event listeners (ping/pong, disconnect).
 * @param {Object} socket - The socket instance.
 * @param {String} clientName - The client name for logging.
 * @param {Function} updateActivity - Function to update last activity.
 * @param {Function} setInactive - Function to mark socket as inactive.
 */
function setupBasicSocketHandlers(socket, clientName, updateActivity, setInactive)
{
    socket.on('ping', () =>
    {
        updateActivity();
        try
        {
            socket.emit('pong');
        }
        catch (error)
        {
            console.error(`Error sending pong to ${clientName}:`, error);
            setInactive();
        }
    });

    socket.on('disconnect', (reason) =>
    {
        setInactive();
        console.log(`Client ${clientName} disconnected: ${reason}`);
    });
}

/**
 * Handles the tradeType event to set up appropriate trade handlers.
 * @param {Object} socket - The socket instance.
 * @param {String} clientId - The client ID.
 * @param {Function} updateActivity - Function to update activity.
 * @param {Function} setInactive - Function to mark inactive.
 * @param {Function} getClientName - Function to get current client name.
 * @param {Function} setClientName - Function to set client name.
 * @param {Object} socketUtils - Socket utility functions.
 */
function setupTradeTypeHandler(socket, clientId, updateActivity, setInactive, getClientName, setClientName, socketUtils)
{
    socket.on("tradeType", async (tradeType, username, cloudDataSyncKey) =>
    {
        try
        {
            // Update last activity timestamp
            updateActivity();

            // Set the username as the client name if provided
            if (username)
                setClientName(username);

            const clientName = getClientName();

            // Handle the tradeType event
            switch (tradeType)
            {
                case TRADE_TYPE_WONDER_TRADE:
                    console.log(`[WT] ${clientId} (${username}) wants a Wonder Trade`);
                    wonderTrade.SetupWonderTradeHandlers(socket, socketUtils, clientId, username, cloudDataSyncKey, clientName, updateActivity, setInactive);
                    break;
                case TRADE_TYPE_FRIEND_TRADE:
                    console.log(`[FT] ${clientId} (${username}) wants a Friend Trade`);
                    friendTrade.SetupFriendTradeHandlers(socket, socketUtils, clientId, username, cloudDataSyncKey, clientName);
                    break;
                default:
                    console.error(`Invalid trade type received from ${clientName}: ${tradeType}`);
                    socketUtils.safeEmit("invalidCloudDataSyncKey", "Trade type not recognized!"); // Repurpose invalidCloudDataSyncKey to display the error for the user
                    break;
            }
        }
        catch (error)
        {
            console.error(`Error in tradeType handler for ${getClientName()}:`, error);
        }
    });
}

/**
 * Performs cleanup when socket connection ends.
 * @param {String} clientId - The client ID.
 * @param {String} clientName - Client name for logging.
 * @returns {Promise<void>} Promise that resolves when cleanup is complete.
 */
async function performSocketCleanup(clientId, clientName)
{
    try
    {
        await wonderTrade.CleanupWonderTradeClient(clientId, clientName);
        await friendTrade.CleanupFriendTradeClient(clientId, clientName);
    }
    catch (cleanupError)
    {
        console.error(`Error during cleanup for ${clientName}:`, cleanupError);
    }
}

/**
 * Runs the main processing loop for a socket connection.
 * @param {Object} socket - The socket instance.
 * @param {String} clientId - The client ID.
 * @param {String} clientName - The client name.
 * @param {Object} socketUtils - Socket utility functions.
 * @param {Function} isActive - Function to check if socket is active.
 * @param {Function} setInactive - Function to mark socket as inactive.
 * @param {Function} updateActivity - Function to update last activity.
 * @param {Function} getLastActivity - Function to get last activity timestamp.
 * @returns {Promise<void>} Promise that resolves when the main loop ends.
 */
async function runMainProcessingLoop(socket, clientId, clientName, socketUtils, isActive, setInactive,
                                     updateActivity, getLastActivity)
{
    // Loop until the socket is deactivated
    while (isActive())
    {
        try
        {
            // Check for instance timeout
            if (!(await checkSocketTimeout(getLastActivity(), clientName, socketUtils, setInactive)))
                break;

            // Check socket connection
            if (!checkSocketConnection(socket, setInactive))
                break;

            // Process Wonder Trade transactions
            if (!(await wonderTrade.ProcessWonderTradeTransactions(clientId, clientName, socketUtils, updateActivity, setInactive)))
                break;

            // Process Friend Trade states
            await friendTrade.ProcessFriendTradeStates(clientId, clientName, socketUtils, updateActivity, setInactive);

            // Continue to next iteration of the main loop
            await waitForNextIteration(socket, setInactive);
        }
        catch (error)
        {
            // Try to unlock in case of error
            try { wonderTrade.UnlockWonderTrade(); } catch { }

            // Handle any errors that occur in the main loop
            if (!(await handleMainLoopError(error, clientName, setInactive)))
                break;
        }
    }
}

/**
 * Initialize websocket functionality.
 * @param {Object} io - The socket.io instance.
 */
function InitSockets(io)
{
    // Configure socket.io timeout settings
    io.engine.pingTimeout = PING_TIMEOUT;
    io.engine.pingInterval = PING_INTERVAL;

    io.on("connection", async function (socket)
    {
        const clientId = socket.id;
        let clientName = clientId;
        let isActive = true;
        let lastActivity = Date.now();
        
        console.log(`Client ${clientName} connected`);

        // State management functions
        const updateActivity = () => { lastActivity = Date.now(); };
        const setInactive = () => { isActive = false; };
        const getLastActivity = () => lastActivity;
        const checkIsActive = () => isActive;
        const getClientName = () => clientName;
        const setClientName = (name) => { clientName = name; };

        const socketUtils = createSocketUtils(socket, updateActivity);

        // Set up event handlers
        setupBasicSocketHandlers(socket, clientName, updateActivity, setInactive);
        setupTradeTypeHandler(socket, clientId, updateActivity, setInactive, getClientName, setClientName, socketUtils);

        // Run main processing loop
        await runMainProcessingLoop(
            socket, 
            clientId, 
            clientName, 
            socketUtils, 
            checkIsActive, 
            setInactive, 
            updateActivity, 
            getLastActivity
        );

        // Cleanup
        await performSocketCleanup(clientId, clientName);
        // console.debug(`Main loop ended for ${clientName}`);
    });
}

module.exports = { InitSockets };
