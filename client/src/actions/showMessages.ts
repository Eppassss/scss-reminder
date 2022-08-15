/**
 * @file showMessages.ts
 * @author patrickli147
 */

import * as vscode from 'vscode';

export const showErrorMessage = (props) => {
	if (!props.msg) {
		return;
	}
	vscode.window.showErrorMessage(props.msg);
};
