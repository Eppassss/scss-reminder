import * as vscode from 'vscode';

import {messageItems} from '../constants';

export default async () => {
	console.log('set source file');
	const sourceFiles: string[] = await getConfiguration('scssReminder.sourceFiles');

	if ((sourceFiles as string[]).length === 0) {
		const res = await vscode.window.showInformationMessage('Please select a source file containing scss variables.',
			...[messageItems.OK, messageItems.Later]);

		if (res === messageItems.OK) {
			const res = await vscode.window.showOpenDialog();
			const filePath = res[0].path;
			const relativePath = vscode.workspace.asRelativePath(filePath);
			sourceFiles.push('./' + relativePath);
			await vscode.workspace.getConfiguration().update('scssReminder.sourceFiles', sourceFiles);
		}
	}
};


/**
 * This function returns user configuration by the given configuration name
 * @param {string} configurationName Name of the configuration
 * @returns {Promise<any>} A Promise resolves the value of the configuration
 */
async function getConfiguration(configurationName: string): Promise<any> {
	return await vscode.workspace.getConfiguration().get(configurationName);
}
