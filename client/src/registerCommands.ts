import * as vscode from 'vscode';

import {commandConfigs} from './commands';

export default async () => {
	Object.entries(commandConfigs).map(([command, callback]) => registerCommand(command, callback));
};

/**
 * This function registers a command
 * @param {string} command Name of the command
 * @returns {Promise<void>}
 */
async function registerCommand(command: string, callback: (...params: any[]) => any): Promise<void>{
	await vscode.commands.registerCommand(command, callback);
}
