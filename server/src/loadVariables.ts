import * as fs from 'fs';

import {
	Position,
	TextDocument
} from 'vscode-languageserver-textdocument';

import {scssVariablePattern} from './utils/regExp';

export interface IVariableData {
	/**
	 * start position
	 */
	start: Position;
	/**
	 * end position
	 */
	end: Position;
	/**
	 * variable value
	 */
	value: string;
	/**
	 * original content of variable definition
	 */
	origin: string;
	/**
	 * uri of textDocument
	 */
	uri: string;
}

export default (path: string) => {
	const text = fs.readFileSync(path, 'utf-8');
	const cssTextDocument = TextDocument.create(path.substring(1), "plaintext", 1, text);
	const variables: Map<string, IVariableData> = new Map();

	let matches: RegExpExecArray | null;

	while ((matches = scssVariablePattern.exec(text)) !== null) {
		const variableName = matches[1];
		const variableValue = matches[3];
		const variableData = {
			start: cssTextDocument.positionAt(matches.index),
			end: cssTextDocument.positionAt(matches.index + matches[0].length),
			value: variableValue,
			origin: matches[0],
			uri: cssTextDocument.uri
		};
		variables.set(variableName, variableData);
	}
	return {variables, cssTextDocument};
};
