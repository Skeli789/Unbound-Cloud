/**
 * Configuration file for connecting to the development server.
 */

const DEV_SERVER = import.meta.env.VITE_DEV_SERVER ?? ""; // If it's an environment variable, then use it

export const config =
{
    devServer : DEV_SERVER,
};
