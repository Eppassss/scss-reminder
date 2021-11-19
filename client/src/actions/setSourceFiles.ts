/**
 * @file This file contains functions of setting source files
 * @author patrickli147
 */

import * as vscode from 'vscode';

import {messageItems} from '../constants';

export async function setSourceFiles() {
	console.log('set source file');

	const res = await vscode.window.showInformationMessage('Please select a source file containing scss variables.',
		...[messageItems.OK, messageItems.Later]);

	if (res === messageItems.OK) {
		addSourceFile();
	}
}


/**
 * This function returns user configuration by the given configuration name
 * @param {string} configurationName Name of the configuration
 * @returns {Promise<any>} A Promise resolves the value of the configuration
 */
export async function getConfiguration(configurationName: string): Promise<any> {
	return await vscode.workspace.getConfiguration().get(configurationName);
}

/**
 * This function opens a dialog to add a source file
 *
 */
export async function addSourceFile() {
	const sourceFiles: string[] = await getConfiguration('scssReminder.sourceFiles');
	const res = await vscode.window.showOpenDialog({
		filters: {
			'sass/scss': ['scss', 'sass']
		}
	});
	if (res) {
		const filePath = res[0].path;
		const relativePath = vscode.workspace.asRelativePath(filePath);
		const newPath = `./${relativePath}`;
		if (sourceFiles.includes(newPath)) {
			await vscode.window.showWarningMessage('No repeat files.');
			return;
		}
		sourceFiles.push(newPath);
		await vscode.workspace.getConfiguration().update('scssReminder.sourceFiles', sourceFiles);
		await vscode.window.showInformationMessage('Successfully added.');
	}
}
